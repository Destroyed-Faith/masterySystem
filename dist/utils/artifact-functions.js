/**
 * Artifact-function overlay contract (Batch B / plan §7.3).
 * Four entries only — not a second power registry. Mechanics stay in existing handlers.
 */
export const ARTIFACT_FUNCTION_CONTRACT = {
    'dragon-breath': {
        klass: 'K3',
        requiresTemplateId: 'active-melee-weapon-aoe',
        category: 'inherit',
        modes: ['damage', 'ruin'],
        resource: 'dragonBreath',
        handler: 'attack-executor:breath',
    },
    'titan-growth': {
        klass: 'K2',
        requiresTemplateId: null,
        category: 'activeBuff',
        modes: null,
        resource: null,
        handler: 'transformation-growth',
    },
    'life-absorption': {
        klass: 'K2',
        requiresTemplateId: null,
        category: 'passive',
        modes: null,
        resource: null,
        handler: 'hollow-crown',
    },
    'artifact-awakening': {
        klass: 'K2',
        requiresTemplateId: null,
        category: 'passive',
        modes: null,
        resource: null,
        handler: 'artifact-awakening',
    },
};
const ARTIFACT_FUNCTION_IDS = new Set(Object.keys(ARTIFACT_FUNCTION_CONTRACT));
export function isArtifactFunctionId(value) {
    return typeof value === 'string' && ARTIFACT_FUNCTION_IDS.has(value);
}
export function getArtifactFunctionContract(id) {
    return ARTIFACT_FUNCTION_CONTRACT[id];
}
//# sourceMappingURL=artifact-functions.js.map