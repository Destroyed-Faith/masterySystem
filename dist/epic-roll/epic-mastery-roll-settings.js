/**
 * Epic Mastery Roll — module settings.
 */
export function registerEpicMasteryRollSettings() {
    game.settings.register('mastery-system', 'epicRollSummaryVisibility', {
        name: 'Epic Mastery Roll: Summary Visibility',
        hint: 'Who can see the final Epic Mastery Roll summary in chat.',
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
        name: 'Epic Mastery Roll: Recent Presets',
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
export function listEpicRollCandidateActors() {
    const actors = (game.actors?.contents ?? []);
    return actors
        .filter((a) => a.type === 'character' || a.type === 'npc')
        .map((a) => {
        const actor = a;
        return {
            id: String(actor.id),
            name: String(actor.name ?? 'Unknown'),
            type: String(actor.type),
            img: String(actor.img ?? ''),
        };
    })
        .sort((a, b) => a.name.localeCompare(b.name));
}
//# sourceMappingURL=epic-mastery-roll-settings.js.map