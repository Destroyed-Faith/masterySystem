/**
 * Artifact-function overlay contract (Batch B / plan §7.3).
 * Four entries only — not a second power registry. Mechanics stay in existing handlers.
 */

import type { PowerCategory } from '../types/item.js';

export type ArtifactFunctionId =
  | 'dragon-breath'
  | 'titan-growth'
  | 'life-absorption'
  | 'artifact-awakening';

export type ArtifactFunctionKlass = 'K2' | 'K3';

export interface ArtifactFunctionContractEntry {
  klass: ArtifactFunctionKlass;
  /** K3: exact templateId required; K2: templateId must be absent. */
  requiresTemplateId: string | null;
  /** K2 category for routing; K3 inherits template.category. */
  category: PowerCategory | 'inherit';
  modes: readonly string[] | null;
  resource: 'dragonBreath' | null;
  handler: 'attack-executor:breath' | 'transformation-growth' | 'hollow-crown' | 'artifact-awakening';
}

export const ARTIFACT_FUNCTION_CONTRACT: Record<ArtifactFunctionId, ArtifactFunctionContractEntry> = {
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

const ARTIFACT_FUNCTION_IDS = new Set<string>(Object.keys(ARTIFACT_FUNCTION_CONTRACT));

export function isArtifactFunctionId(value: unknown): value is ArtifactFunctionId {
  return typeof value === 'string' && ARTIFACT_FUNCTION_IDS.has(value);
}

export function getArtifactFunctionContract(
  id: ArtifactFunctionId,
): ArtifactFunctionContractEntry {
  return ARTIFACT_FUNCTION_CONTRACT[id];
}
