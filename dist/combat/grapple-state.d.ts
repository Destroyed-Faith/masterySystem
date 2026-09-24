/**
 * Grapple — combat state shared by two creatures.
 *
 * A won Grapple contest links grappler and held creature. Both carry the
 * `grappled` catalog status (Speed 0 m, see `actor.ts`) and a pair flag
 * pointing at the partner. Grapple is not Root: it never deals damage, never
 * touches Evade, Armor, Attack Pools or Specials. Hurting the held creature
 * is a separate Unarmed Basic Attack; drawing a weapon means letting go.
 */
export declare const GRAPPLE_FLAG = "grapple";
export declare const GRAPPLED_STATUS_ID = "grappled";
export type GrappleRole = 'grappler' | 'held';
export interface GrappleState {
    role: GrappleRole;
    partnerActorId: string;
    partnerActorUuid?: string;
    partnerTokenId?: string;
    partnerName: string;
    combatId?: string;
    round?: number;
}
export interface GrappleParticipant {
    actorId: string;
    actorUuid?: string;
    tokenId?: string;
    name: string;
}
export declare function readGrappleState(actor: any): GrappleState | null;
export declare function isInGrapple(actor: any): boolean;
export declare function grappleRoleOf(actor: any): GrappleRole | null;
/**
 * Flag payloads for both participants after a won Grapple contest. Pure so
 * tests can assert that nothing beyond the pair link and the `grappled`
 * status is written — no Root, no damage, no Evade / Armor / pool changes.
 */
export declare function planGrapplePair(grappler: GrappleParticipant, held: GrappleParticipant, combat?: {
    id?: string;
    round?: number;
} | null): {
    grappler: GrappleState;
    held: GrappleState;
};
/** Grapple deals no damage of its own — ever. Kept as an explicit rule hook. */
export declare function grappleDamage(): 0;
/** The only status a Grapple applies. Root is a different Special. */
export declare function grappleStatusIds(): readonly string[];
/**
 * Attacking with a weapon is not part of the Grapple. When the grappler picks
 * a weapon-based attack the hold has to be released first. The unarmed Basic
 * Attack and spells keep the Grapple. The held creature is never gated here —
 * it does not maintain the hold.
 */
export declare function attackRequiresGrappleRelease(actor: any, option: any, deps: {
    unarmedNow: boolean;
}): boolean;
/** Live partner actor: scene token first (unlinked NPCs), then world actor. */
export declare function resolveGrapplePartner(state: GrappleState | null): Promise<any | null>;
export declare function grappleParticipantOf(actor: any, token?: any): GrappleParticipant;
/** Won Grapple: link both creatures and put `grappled` on each. */
export declare function applyGrapple(grappler: any, held: any, opts?: {
    grapplerToken?: any;
    heldToken?: any;
    combat?: any;
}): Promise<void>;
/** End the Grapple for both participants (release, escape, cleanup). */
export declare function endGrapple(actor: any): Promise<{
    partner: any | null;
}>;
/** Combat end: no Grapple survives the fight. */
export declare function clearGrappleAfterCombat(actors: any[]): Promise<void>;
//# sourceMappingURL=grapple-state.d.ts.map