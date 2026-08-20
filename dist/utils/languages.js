/**
 * Languages of the Known Realms — Players Guide 3100–3127 ("Choose a
 * Language"). Every character speaks the **Common Tongue** plus one
 * additional language reflecting their origin / training.
 *
 * The list is intentionally short and open. GMs may approve additional
 * world-specific languages by adding entries to a per-world setting; this
 * module only exposes the canon defaults.
 */
export const LANGUAGES = [
    {
        key: 'common',
        name: 'Common Tongue',
        description: 'Spoken by all civilized nations; born from the Echoes of the First War.',
        isCommon: true,
    },
    {
        key: 'arcane',
        name: 'Arcane',
        description: 'Language of runes, sigils, and scholars of the old world.',
    },
    {
        key: 'infernal',
        name: 'Infernal',
        description: 'The whispered bargains of hell.',
    },
    {
        key: 'celestial',
        name: 'Celestial',
        description: 'Hymns of the divine and long-fallen angels.',
    },
    {
        key: 'dwarvish',
        name: 'Dwarvish',
        description: 'Forged words of stone and steel.',
    },
    {
        key: 'first',
        name: 'The First',
        description: 'Ancient tongue of the Titan-born.',
    },
    {
        key: 'elorian',
        name: 'Elorian',
        description: 'Fluid and timeless, carried by wind and memory of Eloria.',
    },
    {
        key: 'draconic',
        name: 'Draconic',
        description: 'The primal roar of flame, wave, and storm.',
    },
];
/** Legacy keys still stored on older actors. */
const LANGUAGE_ALIASES = {
    elvish: 'elorian',
};
/**
 * Echoes whose extra language is fixed at creation and cannot be swapped.
 * Humans, Unbound, and Titanborn still pick freely.
 */
export const ECHO_LOCKED_LANGUAGES = {
    elorians: 'elorian',
    dragonborn: 'draconic',
    dwarfs: 'dwarvish',
    sentinels: 'celestial',
};
/** Canonicalize a stored language key (aliases + lowercase). */
export function resolveLanguageKey(key) {
    const lc = String(key || '').toLowerCase();
    return LANGUAGE_ALIASES[lc] ?? lc;
}
export function getEchoLockedLanguage(echoKey) {
    if (!echoKey)
        return null;
    return ECHO_LOCKED_LANGUAGES[String(echoKey).toLowerCase()] ?? null;
}
/** Look up a language by key. */
export function getLanguage(key) {
    if (!key)
        return undefined;
    const resolved = resolveLanguageKey(key);
    return LANGUAGES.find((l) => l.key === resolved);
}
/** Picker options ordered with the Common Tongue first. */
export function getPickerOptions() {
    const common = LANGUAGES.find((l) => l.isCommon);
    const rest = LANGUAGES.filter((l) => !l.isCommon);
    return common ? [common, ...rest] : [...LANGUAGES];
}
/**
 * The Common Tongue key — Players Guide 3102 declares it as the
 * universal language all characters speak.
 */
export const COMMON_LANGUAGE_KEY = 'common';
/**
 * Players Guide 3103: "choose **one other language**" beyond the Common
 * Tongue at character creation.
 */
export const STARTING_PICKED_LANGUAGES = 1;
/**
 * Validate the language list on an actor against the creation rule.
 *
 * Returns the cleaned list (Common Tongue prepended, duplicates removed,
 * unknown keys stripped) plus a flag indicating whether the count of
 * non-Common picks matches the creation rule (`STARTING_PICKED_LANGUAGES`).
 */
export function normalizeKnownLanguages(known, echoKey, options) {
    const lockedKey = getEchoLockedLanguage(echoKey);
    const raw = Array.isArray(known) ? known : [];
    const seen = new Set();
    const cleaned = [COMMON_LANGUAGE_KEY];
    seen.add(COMMON_LANGUAGE_KEY);
    if (lockedKey && options?.replaceExtras) {
        cleaned.push(lockedKey);
        seen.add(lockedKey);
    }
    else {
        for (const entry of raw) {
            if (typeof entry !== 'string')
                continue;
            const lc = resolveLanguageKey(entry);
            if (seen.has(lc))
                continue;
            if (!getLanguage(lc))
                continue;
            cleaned.push(lc);
            seen.add(lc);
        }
        if (lockedKey && !seen.has(lockedKey)) {
            cleaned.push(lockedKey);
            seen.add(lockedKey);
        }
    }
    const pickedNonCommon = cleaned.filter((k) => k !== COMMON_LANGUAGE_KEY).length;
    return {
        cleaned,
        pickedNonCommon,
        creationValid: pickedNonCommon >= STARTING_PICKED_LANGUAGES,
        lockedKey,
    };
}
//# sourceMappingURL=languages.js.map