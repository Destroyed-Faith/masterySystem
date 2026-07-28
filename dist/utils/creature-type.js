/**
 * Creature type helpers (Smite validity, NPC typing).
 *
 * Smite(X) adds +Xd8 bonus damage only vs Undead / Fiends (Rules).
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
/** True when Smite(X) bonus damage applies (Undead or Fiend). */
export function isSmiteValidTarget(actor) {
    const t = resolveCreatureType(actor);
    return t === 'undead' || t === 'fiend';
}
/**
 * Sum Smite(X) ranks from special effect strings (e.g. "Smite(8)").
 * Instant rider — not a lasting status.
 */
export function extractSmiteDice(specialStrings) {
    let total = 0;
    for (const raw of specialStrings) {
        const s = String(raw ?? '').trim();
        const m = s.match(/^smite\s*\((\d+)\)$/i);
        if (m)
            total += Math.max(0, Math.floor(Number(m[1]) || 0));
    }
    return total;
}
/** Drop Smite entries so they are not written as lasting status effects. */
export function stripSmiteSpecials(specialStrings) {
    return specialStrings.filter((raw) => {
        const s = String(raw ?? '').trim();
        if (/^smite$/i.test(s))
            return false;
        if (/^smite\s*\(/i.test(s))
            return false;
        return true;
    });
}
//# sourceMappingURL=creature-type.js.map