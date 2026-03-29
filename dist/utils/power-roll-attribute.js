/**
 * Attack-roll attribute for powers is determined by mastery tree or spell school (list), not the power's roll.attribute field.
 * Keys are normalized with trim + lowercase for lookup.
 */
const TREE_OR_SCHOOL_TO_ATTRIBUTE = {
    // Mastery trees
    crusader: "might",
    juggernaut: "might",
    "berserker of the blood moon": "might",
    "grim hunter": "agility",
    "wild stalker": "agility",
    "elemental scholar": "intellect",
    sanctifier: "resolve",
    ravenlord: "resolve",
    wraith: "resolve",
    mesmer: "influence",
    alchemist: "intellect",
    battlemage: "intellect",
    "marked one": "resolve",
    spellshaper: "intellect",
    "titan - forged": "vitality",
    "titan-forged": "vitality",
    "titan runecaster": "vitality",
    frostmonger: "intellect",
    scourge: "resolve",
    curseweaver: "resolve",
    siren: "influence",
    crane: "agility",
    lotus: "intellect",
    catalyst: "vitality",
    forgemaster: "intellect",
    witchbane: "intellect",
    // Spell schools (value stored on power is usually `school.name`)
    pyromancy: "intellect",
    "school of the bound mind": "intellect",
    "malefic arts": "resolve",
    "old pact": "resolve",
    "thorn & whisper": "resolve",
    "breach & break": "intellect",
    "aegis & benedictions": "resolve",
    // fullName strings if stored on older powers
    "pyromancy — school of flame": "intellect",
    "malefic arts — school of hex": "resolve",
    "old pact — school of forgotten nature": "resolve",
    "thorn & whisper — enchantment & venom": "resolve",
    "breach & break — force & impact": "intellect",
    "aegis & benedictions — aid": "resolve"
};
function normalizeTreeOrSchoolLabel(raw) {
    return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
/**
 * Attribute key for attack rolls from a power's `system.tree` (mastery tree or spell school name).
 * Returns null if unknown — caller should fall back to roll.attribute / weapon rules.
 */
export function getAttackAttributeForPowerTreeOrSchool(treeOrSchool) {
    if (treeOrSchool == null || typeof treeOrSchool !== "string")
        return null;
    const key = normalizeTreeOrSchoolLabel(treeOrSchool);
    if (!key)
        return null;
    return TREE_OR_SCHOOL_TO_ATTRIBUTE[key] ?? null;
}
//# sourceMappingURL=power-roll-attribute.js.map