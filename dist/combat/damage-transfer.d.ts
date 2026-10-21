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
type InstantAoeFlagBag = {
    aoeMeleeWeapon?: boolean | string;
    instantAoe?: boolean | string;
};
/**
 * Instant AoE Attack (Melee / Ranged AoE Attack, AoE Special Attacks): one shared
 * Attack/Casting roll and one shared Power damage roll. These attacks never add
 * Weapon Damage or Spell Focus damage and have no Primary Target.
 *
 * `aoeMeleeWeapon` is the legacy flag name kept for compatibility with existing
 * attack-card data; `instantAoe` is the preferred name.
 */
export declare function isInstantAoeFlags(flags: InstantAoeFlagBag | null | undefined): boolean;
/**
 * Martial delivery includes weapon damage. Spell delivery, an explicit
 * ignore flag and Instant AoE do not. NPC spell rows are spell delivery.
 */
export declare function martialWeaponDamageApplies(flags: {
    ignoreWeaponDamage?: boolean;
    powerIsSpell?: boolean;
    npcIsSpell?: boolean;
} & InstantAoeFlagBag): boolean;
/**
 * Spell Focus dice boost single-target Spell damage. Instant AoE never receives
 * them (shared Power damage only).
 */
export declare function spellFocusDamageApplies(flags: {
    isSpell?: boolean;
    isNpcAttackFlow?: boolean;
} & InstantAoeFlagBag): boolean;
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
export {};
//# sourceMappingURL=damage-transfer.d.ts.map