/**
 * Epic Mastery Roll — module settings.
 */
export function registerEpicMasteryRollSettings() {
    game.settings.register('mastery-system', 'epicRollSummaryVisibility', {
        name: 'Skill Roll: Summary Visibility',
        hint: 'Who can see the final Skill Roll summary in chat.',
        scope: 'world',
        config: true,
        type: String,
        choices: {
            all: 'Everyone',
            gm: 'GM only (whisper)',
        },
        default: 'all',
    });
    game.settings.register('mastery-system', 'epicRollRecentPresets', {
        name: 'Skill Roll: Recent Presets',
        scope: 'client',
        config: false,
        type: Object,
        default: [],
    });
}
export function loadEpicRollRecentPresets() {
    const raw = game.settings.get('mastery-system', 'epicRollRecentPresets');
    return Array.isArray(raw) ? raw : [];
}
export async function saveEpicRollRecentPreset(preset) {
    const existing = loadEpicRollRecentPresets();
    const filtered = existing.filter((p) => !(p.title === preset.title &&
        p.roll.kind === preset.roll.kind &&
        JSON.stringify(p.roll) === JSON.stringify(preset.roll) &&
        p.tn.baseTN === preset.tn.baseTN));
    const next = [preset, ...filtered].slice(0, 5);
    await game.settings.set('mastery-system', 'epicRollRecentPresets', next);
}
function actorDocumentType(actor) {
    return String(actor.type ?? actor._source?.type ?? '')
        .trim()
        .toLowerCase();
}
/**
 * Skill Roll participants: player character sheets only.
 * NPC sheets, summons, and generic/other actor types never qualify.
 */
export function isEpicRollPlayerCharacter(actor) {
    if (!actor || typeof actor !== 'object')
        return false;
    const a = actor;
    if (actorDocumentType(a) !== 'character')
        return false;
    const sheetClass = String(a.flags?.core?.sheetClass ?? (typeof a.getFlag === 'function' ? a.getFlag('core', 'sheetClass') : '') ?? '');
    if (/MasteryNpcSheet|MasterySummonSheet|\bNpcSheet\b|\bSummonSheet\b/i.test(sheetClass)) {
        return false;
    }
    return true;
}
function worldActors() {
    const col = game.actors;
    if (!col)
        return [];
    if (typeof col.filter === 'function') {
        return col.filter(() => true);
    }
    if (Array.isArray(col.contents))
        return col.contents;
    return [];
}
export function listEpicRollCandidatesFrom(actors) {
    return Array.from(actors)
        .filter((a) => isEpicRollPlayerCharacter(a))
        .map((a) => {
        const actor = a;
        return {
            id: String(actor.id ?? ''),
            name: String(actor.name ?? 'Unknown'),
            type: 'character',
            img: String(actor.img ?? ''),
        };
    })
        .filter((row) => row.id)
        .sort((a, b) => a.name.localeCompare(b.name));
}
export function listEpicRollCandidateActors() {
    return listEpicRollCandidatesFrom(worldActors());
}
//# sourceMappingURL=epic-mastery-roll-settings.js.map