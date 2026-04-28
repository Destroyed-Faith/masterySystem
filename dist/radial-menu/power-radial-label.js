/**
 * Player-facing label for a power on the token radial menu.
 * Strips internal tier suffixes and marks spells clearly.
 */
/** Remove trailing "Tier 3", "T3", "· T4", etc. from catalog-generated names. */
export function stripPowerTierSuffixFromName(name) {
    let s = String(name || '').trim();
    if (!s)
        return s;
    s = s
        .replace(/\s*\(?\s*tier\s*\d+\s*\)?\s*$/i, '')
        .replace(/\s*[\-·•]\s*t?\d+\s*$/i, '')
        .replace(/\s+t\d+\s*$/i, '')
        .trim();
    return s;
}
/**
 * Final radial label: tier noise removed, split-attack suffix, spell wording.
 */
export function formatRadialPowerDisplayName(item, opts) {
    let name = stripPowerTierSuffixFromName(String(item?.name ?? ''));
    const sys = item?.system ?? {};
    if (sys.isSpell === true) {
        if (/^melee\s+damage\b/i.test(name) && !/\bspell\b/i.test(name)) {
            name = name.replace(/^melee\s+damage\b/i, 'Melee Spell Damage');
        }
        else if (/^ranged\s+damage\b/i.test(name) && !/\bspell\b/i.test(name)) {
            name = name.replace(/^ranged\s+damage\b/i, 'Ranged Spell Damage');
        }
        else if (!/\(spell\)|\bspell\b/i.test(name)) {
            name = `${name} (Spell)`;
        }
    }
    if (opts?.splitAttack) {
        name = `${name} × 2`;
    }
    return name;
}
//# sourceMappingURL=power-radial-label.js.map