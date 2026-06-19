/**
 * Shared artifact link / upgrade actions for the Evolution dialog and
 * Equipment-tab controls on the character sheet.
 */
import { type ArtifactActorProgress } from '../utils/artifact-actor-rules.js';
export interface ArtifactEvolutionPath {
    worldItemId: string;
    nodeId: string;
    label: string;
    targetLevel: number;
    /** Player upgrade blockers (XP, step rule, MR cap, …). */
    disabledReason: string;
    /** GM free-upgrade blockers (activation + valid tree step only). */
    gmDisabledReason: string;
}
export interface UpgradeArtifactOptions {
    /** GM-only: evolve without spending XP or counting against Upgrade Step. */
    gmFree?: boolean;
}
export interface ArtifactEvolutionCard {
    embeddedId: string;
    displayName: string;
    rootWorldId: string;
    folderId: string;
    masteryRank: number;
    maxSystemLevel: number;
    canLinkRules: boolean;
    linked: boolean;
    progress: ArtifactActorProgress;
    currentSystemLevel: number;
    currentLabel: string;
    xp: number;
    stones: number;
    paths: ArtifactEvolutionPath[];
    atMaxTierForMr: boolean;
    bindingKind: 'unbound' | 'bound' | 'echo';
    isEchoBound: boolean;
    linkDisabledReason: string;
    canActivate: boolean;
    nextUpgrade: ArtifactEvolutionPath | null;
    nextGmUpgrade: ArtifactEvolutionPath | null;
    baseValues: Array<{
        label: string;
        value: string;
    }>;
    abilities: Array<{
        name: string;
        type: string;
        effect: string;
    }>;
    hasBaseValues: boolean;
    hasAbilities: boolean;
    activationStoneAttr: string;
    activationStoneLabel: string;
}
/** Build evolution cards for every tree-linked embedded artifact on the actor. */
export declare function buildArtifactEvolutionCards(actor: Actor): ArtifactEvolutionCard[];
/** Activate (link) an artifact — costs 1 Stone once from a chosen pool. */
export declare function linkArtifactForActor(actor: Actor, rootWorldId: string, embeddedId: string, stoneAttr?: string): Promise<boolean>;
/**
 * GM-only: deactivate artifact and refund its activation Stone so the player
 * can choose a different pool.
 */
export declare function resetArtifactActivationForActor(actor: Actor, rootWorldId: string, embeddedId: string): Promise<boolean>;
/**
 * GM-only: hard-release ALL artifact activation Stones on an actor. Clears the
 * `artifactActivated` / `artifactActivationStoneAttr` flags on every embedded
 * artifact and marks the matching root progress as not-linked, so no stones
 * remain blocked in the Stone Powers menu. Use to recover from stale/duplicate
 * activations.
 *
 * @returns the number of activation bindings released.
 */
export declare function releaseAllArtifactActivationStones(actor: Actor): Promise<number>;
/** Upgrade an artifact one tree step — costs 8 XP (unless `gmFree`). */
export declare function upgradeArtifactForActor(actor: Actor, rootWorldId: string, embeddedId: string, targetWorldItemId: string, targetNodeId: string, options?: UpgradeArtifactOptions): Promise<boolean>;
//# sourceMappingURL=artifact-evolution-actions.d.ts.map