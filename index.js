import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { oai_settings, chat_completion_sources } from '../../../openai.js';

const NONE_VALUE = 'none';
const EXT_NAME = 'ReasoningEffortNone';

const ALWAYS_SUPPORTED_SOURCES = new Set([
    chat_completion_sources.OPENAI,
    chat_completion_sources.AZURE_OPENAI,
]);

let _suppressChangeEvent = false;

function isGptModel(modelId) {
    if (!modelId || typeof modelId !== 'string') return false;
    return /^(o1-|gpt-)/i.test(modelId);
}

function getCurrentModel() {
    const source = oai_settings?.chat_completion_source;
    // Custom API는 custom_model에서 읽기
    if (source === chat_completion_sources.CUSTOM) {
        return oai_settings?.custom_model || '';
    }
    return oai_settings?.openai_model || '';
}

function isCurrentSourceSupported() {
    const source = oai_settings?.chat_completion_source;
    if (ALWAYS_SUPPORTED_SOURCES.has(source)) return true;
    if (source === chat_completion_sources.CUSTOM) {
        return isGptModel(getCurrentModel());
    }
    return false;
}

function getSelect() {
    return document.getElementById('openai_reasoning_effort');
}

function ensureNoneOption() {
    const select = getSelect();
    if (!select) return;
    if (select.querySelector(`option[value="${NONE_VALUE}"]`)) return;

    const opt = document.createElement('option');
    opt.value = NONE_VALUE;
    opt.textContent = 'None';
    opt.title = 'Sends reasoning_effort: "none" — disables reasoning on supported OpenAI models.';
    opt.classList.add('reasoning-effort-none-option');

    const autoOpt = select.querySelector('option[value="auto"]');
    if (autoOpt) {
        autoOpt.insertAdjacentElement('afterend', opt);
    } else {
        select.prepend(opt);
    }
}

function syncVisibility(applyValue = false) {
    const select = getSelect();
    if (!select) return;

    const opt = select.querySelector(`option[value="${NONE_VALUE}"]`);
    if (!opt) return;

    const supported = isCurrentSourceSupported();
    opt.hidden = !supported;
    opt.disabled = !supported;

    if (applyValue) {
        const savedValue = oai_settings?.reasoning_effort;
        if (savedValue !== undefined) {
            _suppressChangeEvent = true;
            try {
                if (savedValue === NONE_VALUE && !supported) {
                    select.value = 'auto';
                } else {
                    select.value = savedValue;
                }
            } finally {
                _suppressChangeEvent = false;
            }
        }
    } else {
        if (!supported && select.value === NONE_VALUE) {
            _suppressChangeEvent = true;
            try {
                select.value = 'auto';
            } finally {
                _suppressChangeEvent = false;
            }
            console.info(`[${EXT_NAME}] Source/model unsupported — UI reset to auto (settings preserved).`);
        }
    }
}

function onSelectChange() {
    if (_suppressChangeEvent) return;

    const select = getSelect();
    if (!select) return;

    const value = select.value;

    if (value === NONE_VALUE && !isCurrentSourceSupported()) {
        _suppressChangeEvent = true;
        try {
            select.value = oai_settings?.reasoning_effort ?? 'auto';
        } finally {
            _suppressChangeEvent = false;
        }
        return;
    }

    oai_settings.reasoning_effort = value;
    saveSettingsDebounced();
    console.debug(`[${EXT_NAME}] reasoning_effort saved: ${value}`);
}

function onSettingsReady(generate_data) {
    if (!generate_data || generate_data.reasoning_effort !== NONE_VALUE) return;

    const source = generate_data.chat_completion_source;
    let allowed = ALWAYS_SUPPORTED_SOURCES.has(source);

    if (source === chat_completion_sources.CUSTOM) {
        allowed = isGptModel(generate_data.model);
    }

    if (!allowed) {
        delete generate_data.reasoning_effort;
        console.warn(
            `[${EXT_NAME}] reasoning_effort "none" removed — ` +
            `not supported for ${source} with model ${generate_data.model}`
        );
    }
}

jQuery(async () => {
    await new Promise(resolve => eventSource.once(event_types.APP_READY, resolve));

    ensureNoneOption();
    syncVisibility(true);

    getSelect()?.addEventListener('change', onSelectChange);

    // Source 변경 감지
    document
        .getElementById('chat_completion_source')
        ?.addEventListener('change', () => syncVisibility(false));

    // OpenAI 탭 모델 변경 감지
    document
        .getElementById('model_openai_select')
        ?.addEventListener('change', () => setTimeout(() => syncVisibility(false), 0));

    // Custom API 모델 변경 감지 (추가)
    document
        .getElementById('custom_model_id')
        ?.addEventListener('input', () => setTimeout(() => syncVisibility(false), 0));

    document
        .getElementById('model_custom_select')
        ?.addEventListener('change', () => setTimeout(() => syncVisibility(false), 0));

    eventSource.on(event_types.OAI_PRESET_CHANGED_AFTER, () => {
        ensureNoneOption();
        syncVisibility(true);
    });

    if (event_types.CHAT_COMPLETION_SETTINGS_READY) {
        eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, onSettingsReady);
    }

    console.info(`[${EXT_NAME}] Loaded.`);
});
