/**
 * Dialog: pick the character's known languages.
 *
 * Source: Players Guide 3100–3127 ("Choose a Language").
 *
 * Every character speaks the **Common Tongue**. At creation they pick
 * **one additional language** from the canon list. After creation the
 * GM may grant extras (story hooks, downtime, mentor NPCs); the dialog
 * therefore allows multi-select but flags the "1 extra at creation"
 * threshold for the validation banner.
 */

import {
    LANGUAGES,
    COMMON_LANGUAGE_KEY,
    STARTING_PICKED_LANGUAGES,
    getPickerOptions,
    normalizeKnownLanguages,
} from '../utils/languages.js';

const FOUNDRY_DIALOG: any = (globalThis as any).Dialog;

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildLanguageDialogContent(known: string[]): string {
    const knownSet = new Set(known.map((k) => k.toLowerCase()));
    const options = getPickerOptions().map((lang) => {
        const isCommon = lang.key === COMMON_LANGUAGE_KEY;
        const checked = isCommon || knownSet.has(lang.key);
        const disabled = isCommon ? 'disabled' : '';
        const commonNote = isCommon ? ' <span class="lang-flag">(always known)</span>' : '';
        return `
            <li class="lang-row" data-lang="${lang.key}">
                <label class="lang-label">
                    <input type="checkbox" class="lang-checkbox" value="${lang.key}" ${checked ? 'checked' : ''} ${disabled} />
                    <span class="lang-name">${escapeHtml(lang.name)}${commonNote}</span>
                </label>
                <p class="lang-description">${escapeHtml(lang.description)}</p>
            </li>`;
    }).join('');

    return `
        <div class="languages-dialog">
            <p class="lang-intro">
                Pick the languages your character speaks. The <strong>Common Tongue</strong> is always known.
                At character creation you may pick <strong>${STARTING_PICKED_LANGUAGES}</strong> additional language
                (Players Guide 3100–3127). The GM may grant more later through play.
            </p>
            <ul class="lang-list">
                ${options}
            </ul>
        </div>`;
}

/**
 * Open the language picker for the supplied actor. Persists the chosen
 * languages to `system.languages.known`.
 */
export async function showLanguagesDialog(actor: any): Promise<void> {
    if (!actor) return;
    const current = (actor.system?.languages?.known ?? []) as unknown[];
    const initial = normalizeKnownLanguages(current).cleaned;

    return new Promise<void>((resolve) => {
        new FOUNDRY_DIALOG({
            title: `${actor.name ?? 'Character'} — Languages`,
            content: buildLanguageDialogContent(initial),
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Save',
                    callback: async (html: any) => {
                        const $html = (window as any).jQuery ? (window as any).jQuery(html) : html;
                        const picked: string[] = [COMMON_LANGUAGE_KEY];
                        $html.find('input.lang-checkbox:checked').each((_idx: number, el: HTMLInputElement) => {
                            const key = el.value?.toLowerCase();
                            if (key && key !== COMMON_LANGUAGE_KEY && LANGUAGES.find((l) => l.key === key)) {
                                picked.push(key);
                            }
                        });
                        const cleaned = normalizeKnownLanguages(picked).cleaned;
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
        }).render(true);
    });
}
