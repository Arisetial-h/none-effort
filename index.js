/**
 * Reasoning Effort: None
 * Adds "None" as a selectable reasoning effort option for OpenAI (and Azure OpenAI),
 * which disables reasoning/thinking on supported models.
 *
 * ST's getReasoningEffort() passes unrecognized values through via the default
 * switch case, so 'none' reaches the backend as-is. The backend's
 * OPENAI_REASONING_EFFORT_MAP lookup returns undefined for 'none', falls back
 * to the raw string, and sends reasoning_effort: 'none' to the OpenAI API.
 */

import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { oai_settings, chat_completion_sources } from '../../../openai.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const NONE_VALUE = 'none';
const EXT_NAME = 'ReasoningEffortNone';

/**
 * Sources where reasoning_effort: 'none' is meaningful and safe to send.
 * Other sources either don't support reasoning_effort at all, or map
 * unknown values to something unintended (e.g., xAI maps non-'high' → 'low').
 */
const SUPPORTED_SOURCES = new Set([
    chat_completion_sources.OPENAI,
    chat_completion_sources.AZURE_OPENAI,
]);

// ── DOM helpers ───────────────────────────────────────────────────────────────

function getSelect() {
    return /** @type {HTMLSelectElement|null} */ (
        document.getElementById('openai_reasoning_effort')
    );
}

/**
 * Injects the None <option> right after the Auto option (once only).
 */
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
 * Shows or hides the None option based on the active completion source,
 * and resets the selection to 'auto' if None is selected on an unsupported source.
 */
function syncVisibility() {
    const select = getSelect();
    if (!select) return;

    const opt = /** @type {HTMLOptionElement|null} */ (
        select.querySelector(`option[value="${NONE_VALUE}"]`)
    );
    if (!opt) return;

    const source = oai_settings?.chat_completion_source;
    const isSupported = SUPPORTED_SOURCES.has(source);

    opt.hidden = !isSupported;
    opt.disabled = !isSupported;

    // Guard: if None is currently selected but source changed to unsupported, reset.
    if (!isSupported && select.value === NONE_VALUE) {
        select.value = 'auto';
        oai_settings.reasoning_effort = 'auto';
        saveSettingsDebounced();
        console.info(`[${EXT_NAME}] Source changed to unsupported. Reset reasoning_effort → auto.`);
    }
}

// ── Generate intercept ────────────────────────────────────────────────────────

/**
 * Belt-and-suspenders: strips reasoning_effort from the payload entirely
 * if it is 'none' and the source is not in SUPPORTED_SOURCES.
 * Handles edge cases where the select is bypassed (presets, API, etc.).
 *
 * ST emits CHAT_COMPLETION_SETTINGS_READY with the raw generate_data object
 * just before the network request, allowing in-place mutation.
 */
function onSettingsReady(generate_data) {
    if (!generate_data || generate_data.reasoning_effort !== NONE_VALUE) return;

    if (!SUPPORTED_SOURCES.has(generate_data.chat_completion_source)) {
        delete generate_data.reasoning_effort;
        console.warn(
            `[${EXT_NAME}] reasoning_effort "none" removed — ` +
            `not supported for source: ${generate_data.chat_completion_source}`
        );
    }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

jQuery(async () => {
    // Wait for the full app (including settings panel HTML) to be ready.
    await new Promise(resolve => eventSource.once(event_types.APP_READY, resolve));

    ensureNoneOption();
    syncVisibility();

    // Keep the option hidden/shown as the user switches sources.
    document
        .getElementById('chat_completion_source')
        ?.addEventListener('change', syncVisibility);

    // Also sync when a preset is loaded (oai_settings may have been replaced).
    eventSource.on(event_types.OAI_PRESET_CHANGED_AFTER, () => {
        syncVisibility();
        // Re-reflect oai_settings.reasoning_effort back onto the select element.
        const select = getSelect();
        if (select && oai_settings?.reasoning_effort !== undefined) {
            select.value = oai_settings.reasoning_effort;
        }
    });

    // Intercept generate payload for unsupported sources.
    if (event_types.CHAT_COMPLETION_SETTINGS_READY) {
        eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, onSettingsReady);
    }

    console.info(`[${EXT_NAME}] Loaded — "None" reasoning effort option injected.`);
});
