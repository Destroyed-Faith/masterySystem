/**
 * Artifact-function overlay contract (Batch B / plan §7.3).
 * Four entries only — not a second power registry. Mechanics stay in existing handlers.
 */
import type { PowerCategory } from '../types/item.js';
export type ArtifactFunctionId = 'dragon-breath' | 'titan-growth' | 'life-absorption' | 'artifact-awakening';
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
export declare const ARTIFACT_FUNCTION_CONTRACT: Record<ArtifactFunctionId, ArtifactFunctionContractEntry>;
export declare function isArtifactFunctionId(value: unknown): value is ArtifactFunctionId;
export declare function getArtifactFunctionContract(id: ArtifactFunctionId): ArtifactFunctionContractEntry;
//# sourceMappingURL=artifact-functions.d.ts.map