/**
 * Foundry prompts for Safe Movement (after confirm) and Slip (on an enemy miss).
 */
/**
 * Resolve committed Safe Movement. False leaves the ticket pending (Later / cancelled move).
 * True means the choice is finished: the move replaced Movement, or Movement was already spent.
 */
export declare function presentSafeMovement(actor: any, tier: number): Promise<boolean>;
/** Offer Slip after a qualifying miss. Declining leaves the opportunity for a later miss. */
export declare function maybeOfferSlip(args: {
    defender: any;
    attacker: any;
    hit: boolean;
    isAttack: boolean;
}): Promise<void>;
//# sourceMappingURL=agility-movement-ui.d.ts.map