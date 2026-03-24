/**
 * Reasoning Effort: None
 * CUSTOM source + GPT model support
 * Fixed: preset save & load, no settings overwrite, no change event re-entry
 */

import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { oai_settings, chat_completion_sources } from '../../../openai.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const NONE_VALUE = 'none';
const EXT_NAME = 'ReasoningEffortNone';

const ALWAYS_SUPPORTED_SOURCES = new Set([
    chat_completion_sources.OPENAI,
    chat_completion_sources.AZURE_OPENAI,
]);

// ── 재진입 방지 플래그 (#3 fix) ───────────────────────────────────────────────
// syncVisibility가 select.value를 직접 바꿀 때 change 이벤트가 발생할 수 있음.
// 이 플래그가 true인 동안은 onSelectChange를 무시해서 재진입을 막는다.
let _suppressChangeEvent = false;

// ── Model detection ───────────────────────────────────────────────────────────

function isGptModel(modelId) {
    if (!modelId || typeof modelId !== 'string') return false;
    return /^(o1-|gpt-)/i.test(modelId);
}

function getCurrentModel() {
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

// ── DOM helpers ───────────────────────────────────────────────────────────────

function getSelect() {
    return /** @type {HTMLSelectElement|null} */ (
        document.getElementById('openai_reasoning_effort')
    );
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

/**
 * None 옵션의 표시/숨김만 담당한다.
 *
 * #2 fix: 이 함수는 oai_settings를 절대 건드리지 않는다.
 * 설정 저장은 오직 onSelectChange(사용자 직접 변경)에서만 한다.
 *
 * @param {boolean} applyValue - true면 oai_settings의 현재 값을 select UI에 반영한다.
 */
function syncVisibility(applyValue = false) {
    const select = getSelect();
    if (!select) return;

    const opt = /** @type {HTMLOptionElement|null} */ (
        select.querySelector(`option[value="${NONE_VALUE}"]`)
    );
    if (!opt) return;

    const supported = isCurrentSourceSupported();
    opt.hidden = !supported;
    opt.disabled = !supported;

    if (applyValue) {
        const savedValue = oai_settings?.reasoning_effort;
        if (savedValue !== undefined) {
            // #3 fix: select.value 변경이 onSelectChange를 재진입시키지 않도록 플래그 설정
            _suppressChangeEvent = true;
            try {
                if (savedValue === NONE_VALUE && !supported) {
                    // none이 저장돼 있지만 현재 source가 지원 안 함:
                    // UI만 auto로 보여준다. oai_settings는 건드리지 않는다. (#2 fix)
                    select.value = 'auto';
                } else {
                    select.value = savedValue;
                }
            } finally {
                _suppressChangeEvent = false;
            }
        }
    } else {
        // applyValue 없이 호출 (source/model 변경 시):
        // none이 선택 중인데 지원 안 하면 UI만 auto로 되돌린다.
        // oai_settings는 건드리지 않는다. (#2 fix)
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

// ── Save: 사용자가 직접 select를 바꿀 때만 oai_settings에 저장 ─────────────────

function onSelectChange() {
    // #3 fix: syncVisibility 내부에서 발생한 change 이벤트는 무시
    if (_suppressChangeEvent) return;

    const select = getSelect();
    if (!select) return;

    const value = select.value;

    // none 선택인데 지원 안 하면 무시하고 되돌림
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

// ── Generate intercept ────────────────────────────────────────────────────────

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

// ── Boot ──────────────────────────────────────────────────────────────────────

jQuery(async () => {
    await new Promise(resolve => eventSource.once(event_types.APP_READY, resolve));

    ensureNoneOption();
    syncVisibility(true);

    // 사용자 직접 변경 → 저장
    getSelect()?.addEventListener('change', onSelectChange);

    // Source 변경 → UI만 갱신
    document
        .getElementById('chat_completion_source')
        ?.addEventListener('change', () => syncVisibility(false));

    // 모델 변경 (CUSTOM) → UI만 갱신
document
    .getElementById('model_openai_select')
    ?.addEventListener('change', () => setTimeout(() => syncVisibility(false), 0));

    // 프리셋 교체 후 → 옵션 재주입 + 저장된 값 UI에 반영
    eventSource.on(event_types.OAI_PRESET_CHANGED_AFTER, () => {
        ensureNoneOption();
        syncVisibility(true);
    });

    // Generate 페이로드 최종 검증
    if (event_types.CHAT_COMPLETION_SETTINGS_READY) {
        eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, onSettingsReady);
    }

    console.info(`[${EXT_NAME}] Loaded.`);
});
