/**
 * Foundry presentation for the post-commit Stone resolution queue.
 * Healing and Stress Healing open a target dialog. Other interactive powers
 * keep the apply they already had.
 */
import { type StoneResolutionTicket, type StoneTargetCandidate } from './stone-resolution.js';
export declare function stoneTargetCandidates(source: any, preferred?: any): StoneTargetCandidate[];
export declare function postStonePowerChat(content: string): Promise<void>;
/** Resolve one committed ticket. False means the player still has to choose. */
export declare function presentStoneResolution(actor: any, combatant: any, ticket: StoneResolutionTicket): Promise<boolean>;
//# sourceMappingURL=stone-resolution-ui.d.ts.map