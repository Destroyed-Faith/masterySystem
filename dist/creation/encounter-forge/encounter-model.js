/**
 * Encounter Forge data model.
 *
 * Core principle: THE GM DECIDES WHAT THE ENCOUNTER DOES; THE GENERATOR
 * DETERMINES HOW STRONG THOSE CHOICES MAY BE AGAINST THE SELECTED PARTY.
 *
 * The design (this file) contains only GM choices — fiction, composition,
 * phases, defensive identity, concrete attack concepts. It contains NO
 * solved numbers. Solved numbers live in the EncounterSolution produced by
 * the solvers, so the same design solved against a different party yields
 * different numbers while the design stays identical.
 *
 * There is deliberately NO difficulty, rank, style, targeting, tempo or
 * pressure-style field anywhere in this model.
 */
/** Schema version for persisted designs (legacy v1/v2 projects are not migrated). */
export const ENCOUNTER_DESIGN_SCHEMA = 3;
export const PRIMARY_DEFENSE_PILLARS = ['parry', 'evade', 'armor', 'absorption'];
export const SECONDARY_DEFENSE_OPTIONS = [
    'parry',
    'evade',
    'armor',
    'phasing',
    'ward',
    'damageNegation',
    'damageReduction',
    'spellResistance',
];
export function emptyPhaseOverrides() {
    return {
        health: null,
        evade: null,
        armor: null,
        parry: null,
        ward: null,
        damageNegation: null,
        damageReductionPct: null,
        spellResistance: null,
        phasingCharges: null,
        offensiveActions: null,
    };
}
export const ENCOUNTER_FORGE_LIMITS = {
    minEnemies: 1,
    maxEnemies: 6,
    minPhases: 1,
    maxPhases: 4,
    maxDefenses: 3,
    maxReactionSlots: 2,
    maxAttacksPerEnemy: 6,
};
/* ------------------------------------------------------------------ */
/* Factories                                                           */
/* ------------------------------------------------------------------ */
let idCounter = 0;
/** Deterministic-enough unique id for design elements (not persisted across reloads). */
export function forgeId(prefix) {
    idCounter += 1;
    return `${prefix}-${idCounter.toString(36)}`;
}
export function defaultAttackConcept(partial) {
    return {
        id: forgeId('atk'),
        name: '',
        resolution: 'martial',
        delivery: 'melee',
        area: 'single',
        areaSize: 0,
        range: 1,
        specialId: null,
        catalogTemplateId: null,
        stress: true,
        overrides: { attackDice: null, damageDice: null, specialValue: null, penetration: null },
        ...partial,
    };
}
export function defaultMovement() {
    return { kind: 'normal', name: '', escapesMelee: false };
}
export function defaultPhaseConcept(attackIds) {
    return {
        defenses: { primary: 'armor' },
        attackIds: [...attackIds],
        movement: defaultMovement(),
        reactions: [],
        mechanicsNote: '',
        overrides: emptyPhaseOverrides(),
    };
}
export function defaultMainEnemy(name, phaseCount) {
    const attack = defaultAttackConcept({ name: 'Attack' });
    return {
        id: forgeId('enemy'),
        name,
        concept: '',
        attacks: [attack],
        phases: Array.from({ length: Math.max(1, phaseCount) }, () => defaultPhaseConcept([attack.id])),
        copies: { enabled: false, count: 1, health: 'independent', fragile: false, attack: false },
    };
}
export function defaultEncounterDesign() {
    return {
        schema: ENCOUNTER_DESIGN_SCHEMA,
        name: '',
        partyActorIds: [],
        phaseCount: 1,
        enemies: [defaultMainEnemy('Main Enemy 1', 1)],
        addGroups: [],
    };
}
/** Keep enemy phase arrays in sync with the design's phaseCount. */
export function syncPhaseCount(design) {
    const count = Math.min(ENCOUNTER_FORGE_LIMITS.maxPhases, Math.max(ENCOUNTER_FORGE_LIMITS.minPhases, Math.floor(design.phaseCount) || 1));
    design.phaseCount = count;
    for (const enemy of design.enemies) {
        while (enemy.phases.length < count) {
            const prev = enemy.phases[enemy.phases.length - 1];
            enemy.phases.push({
                defenses: { ...prev.defenses },
                attackIds: [...prev.attackIds],
                movement: { ...prev.movement },
                reactions: prev.reactions.map((r) => ({ ...r })),
                mechanicsNote: '',
                overrides: emptyPhaseOverrides(),
            });
        }
        if (enemy.phases.length > count)
            enemy.phases.length = count;
    }
}
//# sourceMappingURL=encounter-model.js.map