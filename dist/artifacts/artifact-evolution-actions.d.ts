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
    /** XP cost of reaching `targetLevel` (0 for L1). */
    xpCost: number;
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
    img: string;
    flavor: string;
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
    canUpgrade: boolean;
    upgradeDisabledReason: string;
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
    openAbilities: boolean;
    activationStoneAttr: string;
    activationStoneLabel: string;
    /** Existing Artifact Level is above the actor's MR cap — do not silently reduce. */
    legacyOverCap: boolean;
    legacyOverCapReason: string;
}
/** Flavor line from lore / description (embedded first, then world root). */
export declare function artifactFlavorText(...items: unknown[]): string;
export declare function artifactUpgradeBlockReason(paths: Array<{
    disabledReason?: string;
}>, opts?: {
    atMax?: boolean;
}): string;
/** Build evolution cards for every tree-linked embedded artifact on the actor. */
export declare function buildArtifactEvolutionCards(actor: Actor, opts?: {
    xpAvailable?: number;
}): ArtifactEvolutionCard[];
/** Attune / bind an artifact — one-time ritual, no Stone reservation, Level 1 is free. */
export declare function linkArtifactForActor(actor: Actor, rootWorldId: string, embeddedId: string, _stoneAttr?: string): Promise<boolean>;
/**
 * GM-only: deactivate artifact and refund its activation Stone so the player
 * can choose a different pool.
 */
export declare function resetArtifactActivationForActor(actor: Actor, rootWorldId: string, embeddedId: string): Promise<boolean>;
/**
 * GM-only: clear leftover Link-Stone reservation flags on an actor.
 * Artifacts stay active (Level 1 is free). Use to recover from stale
 * `artifactActivationStoneAttr` leftovers — never deactivates items.
 *
 * @returns the number of reservation flags cleared.
 */
export declare function releaseAllArtifactActivationStones(actor: Actor): Promise<number>;
/** Upgrade an artifact one tree step — costs XP by the new level (unless `gmFree`). */
export declare function upgradeArtifactForActor(actor: Actor, rootWorldId: string, embeddedId: string, targetWorldItemId: string, targetNodeId: string, options?: UpgradeArtifactOptions): Promise<boolean>;
/** Walk the evolution tree back to `targetLevel` and refund banded XP per dropped level. */
export declare function downgradeArtifactForActor(actor: Actor, embeddedId: string, targetLevel: number): Promise<{
    ok: boolean;
    error?: string;
}>;
//# sourceMappingURL=artifact-evolution-actions.d.ts.map