/**
 * Reasoning Effort: None  +  DeepSeek Thinking Toggle
 * v1.1.0
 *
 * GPT / Azure:  "None" option added to reasoning_effort select (existing).
 * DeepSeek v4:  Thinking Mode toggle injected when CUSTOM source + deepseek model detected.
 *               Injects  extra_body.thinking.type = "enabled" | "disabled"  via
 *               CHAT_COMPLETION_SETTINGS_READY payload intercept.
 *
 * Isolation guarantee:
 *   - GPT None logic is completely unchanged.
 *   - DeepSeek UI / payload branch only fires when isDeepSeekModel() is true.
 *   - The two branches share only the boot listener and the settings-ready handler.
 */

import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { oai_settings, chat_completion_sources } from '../../../openai.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const NONE_VALUE       = 'none';
const EXT_NAME         = 'ReasoningEffortNone';
const DS_CONTAINER_ID  = 'ren_deepseek_container';
const DS_TOGGLE_ID     = 'ren_deepseek_thinking_toggle';
const DS_REFRESH_ID    = 'ren_deepseek_refresh_btn';

const ALWAYS_SUPPORTED_SOURCES = new Set([
    chat_completion_sources.OPENAI,
    chat_completion_sources.AZURE_OPENAI,
]);

// Re-entry guard: prevents syncVisibility → change event → onSelectChange loop (#3 fix, unchanged)
let _suppressChangeEvent = false;

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION A — Model / source detection
// ═══════════════════════════════════════════════════════════════════════════════

function isGptModel(modelId) {
    if (!modelId || typeof modelId !== 'string') return false;
    return /^(o1-|gpt-)/i.test(modelId);
}

function isDeepSeekModel(modelId) {
    if (!modelId || typeof modelId !== 'string') return false;
    return /deepseek/i.test(modelId);
}

function getCurrentModel() {
    return oai_settings?.openai_model ?? '';
}

/** True when the "None" reasoning_effort option is meaningful (GPT family only). */
function isNoneSupported() {
    const source = oai_settings?.chat_completion_source;
    if (ALWAYS_SUPPORTED_SOURCES.has(source)) return true;
    if (source === chat_completion_sources.CUSTOM) return isGptModel(getCurrentModel());
    return false;
}

/** True when the current CUSTOM endpoint looks like DeepSeek. */
function isDeepSeekActive() {
    return (
        oai_settings?.chat_completion_source === chat_completion_sources.CUSTOM &&
        isDeepSeekModel(getCurrentModel())
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION B — Extension settings (DeepSeek state persistence)
// ═══════════════════════════════════════════════════════════════════════════════

function getExtSettings() {
    // SillyTavern.getContext() is the canonical way to access extensionSettings.
    const { extensionSettings } = SillyTavern.getContext();
    if (!extensionSettings[EXT_NAME]) {
        extensionSettings[EXT_NAME] = {};
    }
    const s = extensionSettings[EXT_NAME];
    // Default: thinking ON (matches DeepSeek's own default)
    if (s.deepseekThinking === undefined) s.deepseekThinking = true;
    return s;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION C — GPT "None" option  (original logic, unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

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
    opt.value       = NONE_VALUE;
    opt.textContent = 'None';
    opt.title       = 'Sends reasoning_effort: "none" — disables reasoning on supported OpenAI models.';
    opt.classList.add('reasoning-effort-none-option');

    const autoOpt = select.querySelector('option[value="auto"]');
    if (autoOpt) autoOpt.insertAdjacentElement('afterend', opt);
    else         select.prepend(opt);
}

function syncVisibility(applyValue = false) {
    const select = getSelect();
    if (!select) return;

    const opt = /** @type {HTMLOptionElement|null} */ (
        select.querySelector(`option[value="${NONE_VALUE}"]`)
    );
    if (!opt) return;

    const supported   = isNoneSupported();
    opt.hidden        = !supported;
    opt.disabled      = !supported;

    if (applyValue) {
        const savedValue = oai_settings?.reasoning_effort;
        if (savedValue !== undefined) {
            _suppressChangeEvent = true;
            try {
                select.value = (savedValue === NONE_VALUE && !supported) ? 'auto' : savedValue;
            } finally {
                _suppressChangeEvent = false;
            }
        }
    } else if (!supported && select.value === NONE_VALUE) {
        _suppressChangeEvent = true;
        try { select.value = 'auto'; }
        finally { _suppressChangeEvent = false; }
        console.info(`[${EXT_NAME}] Source/model unsupported — UI reset to auto (settings preserved).`);
    }
}

function onSelectChange() {
    if (_suppressChangeEvent) return;

    const select = getSelect();
    if (!select) return;

    const value = select.value;

    if (value === NONE_VALUE && !isNoneSupported()) {
        _suppressChangeEvent = true;
        try { select.value = oai_settings?.reasoning_effort ?? 'auto'; }
        finally { _suppressChangeEvent = false; }
        return;
    }

    oai_settings.reasoning_effort = value;
    saveSettingsDebounced();
    console.debug(`[${EXT_NAME}] reasoning_effort saved: ${value}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION D — DeepSeek Thinking UI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Injects the DeepSeek toggle container immediately after the reasoning_effort
 * block. Called once; subsequent calls are no-ops (idempotent).
 */
function ensureDeepSeekUI() {
    if (document.getElementById(DS_CONTAINER_ID)) return;

    const select = getSelect();
    if (!select) return;

    // Walk up to a meaningful block-level wrapper (ST uses range-block or flex-container).
    const block =
        select.closest('.range-block') ??
        select.closest('.flex-container') ??
        select.parentElement;
    if (!block) return;

    const settings = getExtSettings();

    const container = document.createElement('div');
    container.id        = DS_CONTAINER_ID;
    container.className = 'ren-deepseek-container';
    // Hidden by default; syncDeepSeekVisibility() will show it when appropriate.
    container.style.display = 'none';

    container.innerHTML = /* html */`
        <div class="ren-deepseek-row">
            <span class="ren-deepseek-icon" aria-hidden="true">🧠</span>
            <span class="ren-deepseek-label">DeepSeek Thinking Mode</span>
            <label class="ren-toggle" title="DeepSeek 추론 모드 활성화 / 비활성화&#10;extra_body → thinking.type: enabled | disabled">
                <input type="checkbox" id="${DS_TOGGLE_ID}" ${settings.deepseekThinking ? 'checked' : ''} />
                <span class="ren-toggle-track">
                    <span class="ren-toggle-thumb"></span>
                </span>
            </label>
            <button id="${DS_REFRESH_ID}" class="ren-refresh-btn" type="button"
                    title="DeepSeek 모델 재감지 / Re-detect DeepSeek model">↻</button>
        </div>
        <div class="ren-deepseek-hint">
            <code>extra_body.thinking.type</code>:
            <span id="ren_deepseek_state_label">${settings.deepseekThinking ? 'enabled' : 'disabled'}</span>
        </div>
    `;

    block.insertAdjacentElement('afterend', container);

    // Events
    document.getElementById(DS_TOGGLE_ID)?.addEventListener('change', onDeepSeekToggleChange);
    document.getElementById(DS_REFRESH_ID)?.addEventListener('click', () => {
        syncDeepSeekVisibility(true);
        console.info(`[${EXT_NAME}] Manual refresh — DeepSeek active: ${isDeepSeekActive()}`);
    });
}

/** Shows or hides the DeepSeek container based on current model/source. */
function syncDeepSeekVisibility(syncCheckbox = false) {
    const active = isDeepSeekActive();

    // Build the UI on first encounter.
    if (!document.getElementById(DS_CONTAINER_ID)) {
        ensureDeepSeekUI();
    }

    const container = document.getElementById(DS_CONTAINER_ID);
    if (!container) return;

    container.style.display = active ? '' : 'none';

    if (active && syncCheckbox) {
        const s      = getExtSettings();
        const toggle = /** @type {HTMLInputElement|null} */ (document.getElementById(DS_TOGGLE_ID));
        const label  = document.getElementById('ren_deepseek_state_label');
        if (toggle) toggle.checked = s.deepseekThinking;
        if (label)  label.textContent = s.deepseekThinking ? 'enabled' : 'disabled';
    }
}

function onDeepSeekToggleChange() {
    const toggle = /** @type {HTMLInputElement|null} */ (document.getElementById(DS_TOGGLE_ID));
    const label  = document.getElementById('ren_deepseek_state_label');
    if (!toggle) return;

    const settings           = getExtSettings();
    settings.deepseekThinking = toggle.checked;
    saveSettingsDebounced();

    if (label) label.textContent = toggle.checked ? 'enabled' : 'disabled';
    console.debug(`[${EXT_NAME}] DeepSeek thinking saved: ${toggle.checked ? 'enabled' : 'disabled'}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION E — Generate payload intercept
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fired just before the chat completion request is sent.
 * Two independent branches run here:
 *   1. GPT None: strip invalid reasoning_effort values (original logic).
 *   2. DeepSeek: inject extra_body.thinking when the model is deepseek.
 */
function onSettingsReady(generate_data) {
    if (!generate_data) return;

    const source = generate_data.chat_completion_source;
    const model  = generate_data.model ?? '';

    // ── Branch 1: GPT None (original, unchanged) ──────────────────────────────
    if (generate_data.reasoning_effort === NONE_VALUE) {
        let allowed = ALWAYS_SUPPORTED_SOURCES.has(source);
        if (source === chat_completion_sources.CUSTOM) allowed = isGptModel(model);

        if (!allowed) {
            delete generate_data.reasoning_effort;
            console.warn(
                `[${EXT_NAME}] reasoning_effort "none" removed — ` +
                `not supported for ${source} / ${model}`
            );
        }
    }

    // ── Branch 2: DeepSeek thinking injection ─────────────────────────────────
    if (source === chat_completion_sources.CUSTOM && isDeepSeekModel(model)) {
        const enabled = getExtSettings().deepseekThinking;

        // extra_body may already exist (user-set or other extensions) — merge, not overwrite.
        if (typeof generate_data.extra_body !== 'object' || generate_data.extra_body === null) {
            generate_data.extra_body = {};
        }
        generate_data.extra_body.thinking = { type: enabled ? 'enabled' : 'disabled' };

        console.debug(
            `[${EXT_NAME}] DeepSeek thinking injected → extra_body.thinking.type = ` +
            `"${enabled ? 'enabled' : 'disabled'}"`
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SECTION F — Boot
// ═══════════════════════════════════════════════════════════════════════════════

jQuery(async () => {
    await new Promise(resolve => eventSource.once(event_types.APP_READY, resolve));

    // ── GPT None setup ────────────────────────────────────────────────────────
    ensureNoneOption();
    syncVisibility(true);
    getSelect()?.addEventListener('change', onSelectChange);

    // ── DeepSeek setup ────────────────────────────────────────────────────────
    ensureDeepSeekUI();
    syncDeepSeekVisibility(true);

    // ── Shared change listeners ───────────────────────────────────────────────
    document
        .getElementById('chat_completion_source')
        ?.addEventListener('change', () => {
            syncVisibility(false);
            syncDeepSeekVisibility(true);
        });

    document
        .getElementById('model_openai_select')
        ?.addEventListener('change', () => {
            syncVisibility(false);
            syncDeepSeekVisibility(true);
        });

    // Preset reload: re-inject None option and sync both UIs.
    eventSource.on(event_types.OAI_PRESET_CHANGED_AFTER, () => {
        ensureNoneOption();
        syncVisibility(true);
        syncDeepSeekVisibility(true);
    });

    // Payload intercept (exists in both branches).
    if (event_types.CHAT_COMPLETION_SETTINGS_READY) {
        eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, onSettingsReady);
    }

    console.info(`[${EXT_NAME}] v1.1.0 loaded (GPT None + DeepSeek Thinking).`);
});
