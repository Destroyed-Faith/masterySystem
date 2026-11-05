/**
 * Central power identity resolution (Batch B / plan §7.2).
 * Reads only structured identity fields — never name/description/text.
 * Does not execute mechanics (I2).
 */
import type { PowerCategory, PowerMechanics } from '../types/item.js';
import { type PowerTemplate } from './powers/templates/index.js';
import { type ArtifactFunctionId } from './artifact-functions.js';
export type PowerIdentitySource = {
    kind: 'power-item';
    item: any;
} | {
    kind: 'artifact-row';
    artifact?: any;
    row: any;
} | {
    kind: 'active-effect';
    effect: any;
} | {
    kind: 'radial-option';
    option: any;
};
export type UnresolvedIdentityReason = 'missing-identity' | 'unknown-template-id' | 'unknown-artifact-function-id' | 'artifact-function-contract-violation' | 'rank-missing' | 'rank-out-of-range' | 'category-conflict' | 'special-key-unknown';
export type UnresolvedSeverity = 'blocks-activation' | 'omits-contribution' | 'informational';
export interface ResolvedPowerIdentity {
    ok: true;
    templateId: string | null;
    template: PowerTemplate | null;
    category: PowerCategory;
    subfamily: string | null;
    rank: number;
    chosenSpecialKey: string | null;
    mechanics: PowerMechanics | null;
    limited: boolean;
    isSpell: boolean;
    artifactFunctionId: ArtifactFunctionId | null;
    artifactLevel: number | null;
    source: PowerIdentitySource['kind'];
}
export interface UnresolvedPowerIdentity {
    ok: false;
    reason: UnresolvedIdentityReason;
    severity: UnresolvedSeverity;
    diagnostic: string;
    ref: {
        actorId?: string;
        actorName?: string;
        itemId?: string;
        itemName?: string;
        effectId?: string;
        echoArtifactKey?: string;
        rowLevel?: number;
    };
    suggestedIdentity?: {
        templateId?: string;
        artifactFunctionId?: ArtifactFunctionId;
        rank?: number;
        basis: 'echoArtifactKey+level' | 'flags.powerId' | 'templateName-exact';
    };
}
export type PowerIdentityResult = ResolvedPowerIdentity | UnresolvedPowerIdentity;
/**
 * Resolve a structured power identity. Never reads name/description/effect text.
 */
export declare function resolvePowerIdentity(source: PowerIdentitySource): PowerIdentityResult;
/** Derive radial segment for an active-category identity (plan §7.5). */
export declare function deriveActiveSegment(identity: ResolvedPowerIdentity): 'attack' | 'utility';
//# sourceMappingURL=power-identity.d.ts.map