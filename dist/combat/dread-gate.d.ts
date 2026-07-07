/**
 * Pre-attack / power-use enforcement for Dread and Disrupt.
 *
 *   Dread(X): before you make an attack, make the listed Save (DC increased by
 *             X). On a failure, the attack is lost. The Save type is chosen by
 *             the applying Power; since stored Specials do not yet carry the
 *             type, we default to a Spirit Save at DC 8 + X.
 *   Disrupt(X): when you use a Power, reduce Disrupt by X. If you cannot reduce
 *               it by the required amount, the Power fails and the action is
 *               lost. We reduce by the current value (the required amount),
 *               which always succeeds, then clear Disrupt.
 */
/**
 * Roll the attacker's Dread save before an attack. Returns `true` when the
 * attack is blocked (save failed) and should not proceed.
 */
export declare function resolveDreadPreAttack(attacker: any): Promise<{
    blocked: boolean;
    note: string;
}>;
/**
 * Apply Disrupt when a Power is used: reduce Disrupt by its current value
 * (the required amount) and clear it. Returns `true` when the Power may
 * proceed (always true here, since the required amount is always payable).
 */
export declare function consumePowerDisrupt(attacker: any): Promise<boolean>;
//# sourceMappingURL=dread-gate.d.ts.map