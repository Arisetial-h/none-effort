/**
 * Reasoning Effort: None
 * CUSTOM source + GPT 모델 지원 추가
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

// ── Model detection ───────────────────────────────────────────────────────────

/**
 * GPT 계열 모델인지 판단 (reasoning_effort: 'none'을 지원하는)
 * @param {string} modelId 
 * @returns {boolean}
 */
function isGptModel(modelId) {
    if (!modelId || typeof modelId !== 'string') return false;
    
    // o1 계열, gpt-4o, gpt-5 등
    return /^(o1-|gpt-)/i.test(modelId);
}

/**
 * 현재 선택된 모델 ID 가져오기
 * @returns {string}
 */
function getCurrentModel() {
    return oai_settings?.openai_model || '';
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
 * None 옵션 표시 여부 결정:
 * - OPENAI / AZURE_OPENAI → 항상 표시
 * - CUSTOM → 모델이 GPT 계열이면 표시
 * - 기타 → 숨김
 */
function syncVisibility() {
    const select = getSelect();
    if (!select) return;

    const opt = /** @type {HTMLOptionElement|null} */ (
        select.querySelector(`option[value="${NONE_VALUE}"]`)
    );
    if (!opt) return;

    const source = oai_settings?.chat_completion_source;
    let isSupported = ALWAYS_SUPPORTED_SOURCES.has(source);

    // CUSTOM source: 모델명 기반 판단
    if (source === chat_completion_sources.CUSTOM) {
        const model = getCurrentModel();
        isSupported = isGptModel(model);
        
        if (isSupported) {
            console.debug(`[${EXT_NAME}] CUSTOM source + GPT model detected: ${model}`);
        }
    }

    opt.hidden = !isSupported;
    opt.disabled = !isSupported;

    // 비지원 상태에서 None이 선택되어 있으면 auto로 리셋
    if (!isSupported && select.value === NONE_VALUE) {
        select.value = 'auto';
        oai_settings.reasoning_effort = 'auto';
        saveSettingsDebounced();
        console.info(`[${EXT_NAME}] Model/source changed to unsupported. Reset reasoning_effort → auto.`);
    }
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
    syncVisibility();

    // Source 변경 감지
    document
        .getElementById('chat_completion_source')
        ?.addEventListener('change', syncVisibility);

    // 모델 변경 감지 (CUSTOM에서 모델 바꿀 때)
    document
        .getElementById('model_openai_select')
        ?.addEventListener('change', syncVisibility);

    // 프리셋 변경 후
    eventSource.on(event_types.OAI_PRESET_CHANGED_AFTER, () => {
        syncVisibility();
        const select = getSelect();
        if (select && oai_settings?.reasoning_effort !== undefined) {
            select.value = oai_settings.reasoning_effort;
        }
    });

    // Generate 페이로드 최종 검증
    if (event_types.CHAT_COMPLETION_SETTINGS_READY) {
        eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, onSettingsReady);
    }

    console.info(`[${EXT_NAME}] Loaded — "None" option with CUSTOM source + GPT model support.`);
});
