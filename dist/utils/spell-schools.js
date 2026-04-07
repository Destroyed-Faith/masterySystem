/**
 * Spell Schools — thematic groupings for spells (short + full display names).
 */
export const SPELL_SCHOOLS = {
    pyromancy: {
        name: 'Pyromancy',
        fullName: 'Pyromancy — School of Flame'
    },
    maleficArts: {
        name: 'Malefic Arts',
        fullName: 'Malefic Arts — School of Hex'
    },
    oldPact: {
        name: 'Old Pact',
        fullName: 'Old Pact — School of Forgotten Nature'
    },
    thornWhisper: {
        name: 'Thorn & Whisper',
        fullName: 'Thorn & Whisper — Enchantment & Venom'
    },
    breachBreak: {
        name: 'Breach & Break',
        fullName: 'Breach & Break — Force & Impact'
    },
    aegisBenedictions: {
        name: 'Aegis & Benedictions',
        fullName: 'Aegis & Benedictions — Aid'
    },
    boundMind: {
        name: 'School of the Bound Mind',
        fullName: 'School of the Bound Mind'
    }
};
export function getAllSpellSchools() {
    return Object.values(SPELL_SCHOOLS).sort((a, b) => a.name.localeCompare(b.name));
}
export function getSpellSchool(key) {
    return SPELL_SCHOOLS[key];
}
//# sourceMappingURL=spell-schools.js.map