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
    disabledReason: string;
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
}
/** Build evolution cards for every tree-linked embedded artifact on the actor. */
export declare function buildArtifactEvolutionCards(actor: Actor): ArtifactEvolutionCard[];
/** Activate (link) an artifact — costs 1 Stone once. */
export declare function linkArtifactForActor(actor: Actor, rootWorldId: string, embeddedId: string): Promise<boolean>;
/** Upgrade an artifact one tree step — costs 8 XP. */
export declare function upgradeArtifactForActor(actor: Actor, rootWorldId: string, embeddedId: string, targetWorldItemId: string, targetNodeId: string): Promise<boolean>;
//# sourceMappingURL=artifact-evolution-actions.d.ts.map