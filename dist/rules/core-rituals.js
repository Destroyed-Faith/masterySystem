/**
 * Sixteen Core Rituals — universal access from character creation.
 */
import ritualData from './data/core-rituals-data.js';
export const CORE_RITUALS = ritualData;
export function findCoreRitual(id) {
    return CORE_RITUALS.find((r) => r.id === id);
}
export function listCoreRitualIds() {
    return CORE_RITUALS.map((r) => r.id);
}
/** Legacy (pre-DF 2026) ritual ids → Core Ritual ids. */
const LEGACY_CORE_RITUAL_IDS = {
    'ritual-detect-magic': 'read-resonance',
};
/** Normalize legacy `ritual-*` ids to Core Ritual ids. */
export function normalizeCoreRitualId(id) {
    const raw = String(id || '').trim();
    if (LEGACY_CORE_RITUAL_IDS[raw])
        return LEGACY_CORE_RITUAL_IDS[raw];
    if (!findCoreRitual(raw) && raw.startsWith('ritual-'))
        return raw.slice('ritual-'.length);
    return raw;
}
/** Look up a Core Ritual by current or legacy id. */
export function getCoreRitualById(id) {
    return findCoreRitual(normalizeCoreRitualId(id));
}
/** Seal Passage Raise 4 is an alternate mode (JSON tier 4 is intentionally empty). */
export const SEAL_PASSAGE_ID = 'seal-passage';
export const SEAL_PASSAGE_OPEN_MODE_TEXT = 'Alternate mode: open an existing sealed, hidden, or forgotten passage, but only if such a passage truly exists. ' +
    'It cannot create a new tunnel, doorway, road, or exit where none exists. Declare opening instead of sealing before rolling.';
export function isSealPassage(ritualOrId) {
    const id = typeof ritualOrId === 'string' ? normalizeCoreRitualId(ritualOrId) : ritualOrId.id;
    return id === SEAL_PASSAGE_ID;
}
/** Strip the light markdown (`**bold**`, trailing `---`) used in the rules JSON. */
export function stripRitualMarkdown(text) {
    return String(text ?? '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\s*-{3,}\s*$/g, '')
        .trim();
}
/** Plain-text effect for a named tier (0–4), with the Seal Passage Raise 4 alternate mode. */
export function coreRitualTierText(ritual, tier) {
    const t = Math.max(0, Math.min(4, Math.floor(Number(tier) || 0)));
    const raw = ritual.tiers?.[t] ?? ritual.tiers?.[String(t)] ?? '';
    if (t === 4 && isSealPassage(ritual) && !String(raw).trim())
        return SEAL_PASSAGE_OPEN_MODE_TEXT;
    return stripRitualMarkdown(raw);
}
//# sourceMappingURL=core-rituals.js.map