/**
 * Dialog: pick the character's known languages.
 *
 * Source: Players Guide 3100–3127 ("Choose a Language").
 *
 * Every character speaks the **Common Tongue**. At creation they pick
 * **one additional language** from the canon list — unless their Echo
 * locks that slot (Elorian, Dragonborn, Dwarf, Sentinel). After creation
 * the GM may grant extras; the locked Echo language still cannot be removed.
 */
import { LANGUAGES, COMMON_LANGUAGE_KEY, STARTING_PICKED_LANGUAGES, getEchoLockedLanguage, getLanguage, getPickerOptions, normalizeKnownLanguages, } from '../utils/languages.js';
import { scheduleCenterLegacyDialog } from '../utils/legacy-dialog-resize.js';
const FOUNDRY_DIALOG = globalThis.Dialog;
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function actorEchoKey(actor) {
    return String(actor?.system?.echo?.key || '');
}
function isCreationIncomplete(actor) {
    return actor?.system?.creation?.complete === false;
}
function buildLanguageDialogContent(known, lockedKey, lockOthers) {
    const knownSet = new Set(known.map((k) => k.toLowerCase()));
    const lockedName = lockedKey ? getLanguage(lockedKey)?.name ?? lockedKey : '';
    const options = getPickerOptions().map((lang) => {
        const isCommon = lang.key === COMMON_LANGUAGE_KEY;
        const isLocked = !!lockedKey && lang.key === lockedKey;
        const checked = isCommon || isLocked || knownSet.has(lang.key);
        const disabled = isCommon || isLocked || (lockOthers && !isCommon && !isLocked);
        const flag = isCommon
            ? ' <span class="lang-flag">(always known)</span>'
            : isLocked
                ? ' <span class="lang-flag">(from Echo)</span>'
                : '';
        return `
            <li class="lang-row${disabled ? ' is-locked' : ''}" data-lang="${lang.key}">
                <label class="lang-label">
                    <input type="checkbox" class="lang-checkbox" value="${lang.key}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} />
                    <span class="lang-name">${escapeHtml(lang.name)}${flag}</span>
                </label>
                <p class="lang-description">${escapeHtml(lang.description)}</p>
            </li>`;
    }).join('');
    const intro = lockedKey
        ? `<p class="lang-intro">
                The <strong>Common Tongue</strong> is always known.
                Your Echo grants <strong>${escapeHtml(lockedName)}</strong> — this language cannot be changed.
                ${lockOthers ? '' : 'The GM may grant additional languages through play.'}
           </p>`
        : `<p class="lang-intro">
                Pick the languages your character speaks. The <strong>Common Tongue</strong> is always known.
                At character creation you may pick <strong>${STARTING_PICKED_LANGUAGES}</strong> additional language
                (Players Guide 3100–3127). The GM may grant more later through play.
           </p>`;
    return `
        <div class="languages-dialog">
            ${intro}
            <ul class="lang-list">
                ${options}
            </ul>
        </div>`;
}
/**
 * Open the language picker for the supplied actor. Persists the chosen
 * languages to `system.languages.known`.
 */
export async function showLanguagesDialog(actor) {
    if (!actor)
        return;
    const echoKey = actorEchoKey(actor);
    const lockedKey = getEchoLockedLanguage(echoKey);
    const inCreation = isCreationIncomplete(actor);
    const lockOthers = inCreation && !!lockedKey;
    const current = (actor.system?.languages?.known ?? []);
    const initial = normalizeKnownLanguages(current, echoKey, {
        replaceExtras: lockOthers,
    }).cleaned;
    return new Promise((resolve) => {
        let dialog;
        dialog = new FOUNDRY_DIALOG({
            title: `${actor.name ?? 'Character'} — Languages`,
            content: buildLanguageDialogContent(initial, lockedKey, lockOthers),
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Save',
                    callback: async (html) => {
                        const $html = window.jQuery ? window.jQuery(html) : html;
                        const picked = [COMMON_LANGUAGE_KEY];
                        if (lockOthers && lockedKey) {
                            picked.push(lockedKey);
                        }
                        else {
                            $html.find('input.lang-checkbox:checked').each((_idx, el) => {
                                const key = el.value?.toLowerCase();
                                if (key && key !== COMMON_LANGUAGE_KEY && LANGUAGES.find((l) => l.key === key)) {
                                    picked.push(key);
                                }
                            });
                            if (lockedKey)
                                picked.push(lockedKey);
                        }
                        const cleaned = normalizeKnownLanguages(picked, echoKey, {
                            replaceExtras: lockOthers,
                        }).cleaned;
                        await actor.update({ 'system.languages.known': cleaned });
                        resolve();
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => resolve(),
                },
            },
            default: 'save',
            render: (htmlRaw) => {
                const html = (htmlRaw instanceof HTMLElement) ? $(htmlRaw) : $(htmlRaw);
                setTimeout(() => {
                    const dlg = html.closest('.window-app.dialog, .window-app, .application');
                    if (dlg.length) {
                        dlg.addClass('mastery-system languages-picker-dialog');
                        dlg.css({
                            position: 'fixed',
                            height: 'auto',
                            'min-height': '280px',
                            'max-height': '88vh',
                            width: 'auto',
                            'min-width': '460px',
                            'max-width': '620px',
                        });
                    }
                    scheduleCenterLegacyDialog(html, dialog);
                }, 0);
            },
        }, {
            classes: ['dialog', 'mastery-system', 'languages-picker-dialog'],
            width: 520,
        });
        dialog.render(true);
    });
}
//# sourceMappingURL=languages-dialog.js.map