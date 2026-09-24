/**
 * Combat entry points for Grapple (radial menu → these → contest card).
 *
 * Grapple / Escape post an Opposed Attribute Contest card via
 * `startAttributeContest`; Release ends the pair link. None of this rolls
 * damage — hurting a held creature is the normal Unarmed Basic Attack.
 */
/** Radial "Grapple" after a melee target was picked: attribute prompt → contest card. */
export declare function beginGrappleContest(attackerToken: any, targetToken: any): Promise<void>;
/** Radial "Escape Grapple" for the held creature: contest vs the grappler. */
export declare function beginGrappleEscape(token: any): Promise<void>;
/** Radial "Release Grapple" (grappler only, free). */
export declare function releaseGrappleAction(token: any, opts?: {
    reason?: string;
}): Promise<boolean>;
/**
 * Weapon attacks are not part of the Grapple. Ask the grappler to release
 * the hold before the weapon attack proceeds. Returns true when the attack
 * may continue (hold released), false when the player cancelled.
 */
export declare function confirmReleaseGrappleForWeaponAttack(token: any, attackName: string): Promise<boolean>;
//# sourceMappingURL=grapple-actions.d.ts.map