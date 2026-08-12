/**
 * Creature type helpers (Exorcism / Requiem validity, NPC typing).
 *
 * Exorcism(X) applies only to Fiends; Requiem(X) only to Undead (Rules).
 * NPCs set `system.creatureType`; aliases like "Dämon" / "demon" map to fiend.
 */
export const CREATURE_TYPE_OPTIONS = [
    { value: '', label: '— Creature Type —' },
    { value: 'humanoid', label: 'Humanoid' },
    { value: 'undead', label: 'Undead' },
    { value: 'fiend', label: 'Dämon / Fiend' },
    { value: 'beast', label: 'Beast' },
    { value: 'construct', label: 'Construct' },
    { value: 'elemental', label: 'Elemental' },
    { value: 'other', label: 'Other' },
];
/** Normalize free-text / sheet values to a canonical creature-type key. */
export function resolveCreatureType(actor) {
    const sys = actor?.system;
    const raw = String(sys?.creatureType ?? sys?.bio?.type ?? '')
        .trim()
        .toLowerCase();
    if (!raw)
        return '';
    if (raw === 'undead' ||
        raw === 'untot' ||
        raw === 'zombie' ||
        raw === 'skeleton' ||
        raw === 'vampire' ||
        raw === 'geist' ||
        raw === 'ghost') {
        return 'undead';
    }
    if (raw === 'fiend' ||
        raw === 'demon' ||
        raw === 'daemon' ||
        raw === 'devil' ||
        raw === 'dämon' ||
        raw === 'daemonisch' ||
        raw === 'infernal') {
        return 'fiend';
    }
    if (raw === 'humanoid' || raw === 'human' || raw === 'mensch')
        return 'humanoid';
    if (raw === 'beast' || raw === 'animal' || raw === 'tier')
        return 'beast';
    if (raw === 'construct' || raw === 'golem' || raw === 'konstrukt')
        return 'construct';
    if (raw === 'elemental' || raw === 'elementar')
        return 'elemental';
    if (raw === 'other' || raw === 'sonstige')
        return 'other';
    return raw;
}
/** True when Exorcism(X) may be applied (Fiend only). */
export function isExorcismValidTarget(actor) {
    return resolveCreatureType(actor) === 'fiend';
}
/** True when Requiem(X) may be applied (Undead only). */
export function isRequiemValidTarget(actor) {
    return resolveCreatureType(actor) === 'undead';
}
/** Tag gate for a targeted Special id (`exorcism` / `requiem`). */
export function isTargetedSpecialValidTarget(specialId, actor) {
    const id = String(specialId ?? '').trim().toLowerCase();
    if (id === 'exorcism')
        return isExorcismValidTarget(actor);
    if (id === 'requiem')
        return isRequiemValidTarget(actor);
    return true;
}
//# sourceMappingURL=creature-type.js.map