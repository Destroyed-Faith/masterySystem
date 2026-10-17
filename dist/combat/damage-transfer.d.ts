/**
 * Damage Transfer (Vampyr).
 *
 * Healing is the real HP this one damage instance removed from the target
 * after mitigation, Temporary HP, and other buffers. It is capped by the
 * missing HP on the attacker's current Health Bar. Limited doubles printed
 * power dice only; it does not multiply the heal. This is not Life Absorption.
 */
export declare const MELEE_DAMAGE_TRANSFER_TEMPLATE_ID = "active-melee-single-target-damage-transfer";
export declare const RANGED_DAMAGE_TRANSFER_TEMPLATE_ID = "active-ranged-single-target-damage-transfer";
/** Test hook. Production claims live for the session so a replay cannot heal twice. */
export declare function resetDamageTransferInstances(): void;
export declare function isDamageTransferTemplateId(templateId: unknown): boolean;
export declare function isDamageTransferPower(item: any): boolean;
/** A miss never transfers. The attack handler and the damage resolver both use this. */
export declare function damageTransferApplies(opts: {
    damageTransfer?: boolean;
    hit: boolean;
}): boolean;
/**
 * Martial delivery includes weapon damage. Spell delivery and an explicit
 * ignore flag do not. NPC spell rows are spell delivery.
 */
export declare function martialWeaponDamageApplies(flags: {
    ignoreWeaponDamage?: boolean;
    powerIsSpell?: boolean;
    npcIsSpell?: boolean;
}): boolean;
/** Limited doubles the printed power-damage pool only, never a following weapon term. */
export declare function doublePrintedPowerDice(formula: string): string;
export declare function applyLimitedToTransferPowerDamage(formula: string, opts: {
    damageTransfer?: boolean;
    limited?: boolean;
}): string;
export declare function settleDamageTransfer(opts: {
    enabled: boolean;
    attacker: any;
    realHpLost: number;
    instanceId?: string | null;
}): Promise<number>;
//# sourceMappingURL=damage-transfer.d.ts.map