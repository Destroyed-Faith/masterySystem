/**
 * Equipped-only equipment effects for rolls (initiative, physical skills).
 * Mirrors armor skill-penalty resolution used in item-info-dialog.
 */
export declare function getEquippedWeapon(actor: any): any | null;
export declare function getEquippedArmor(actor: any): any | null;
export declare function getEquippedShield(actor: any): any | null;
/** Resolved skill-penalty line for armor (item override or type table). */
export declare function resolveArmorSkillPenaltyText(armorItem: any): string;
/** Shield: type table only (no per-item override in template yet). */
export declare function resolveShieldSkillPenaltyText(shieldItem: any): string;
/**
 * Count penalty d8 mentioned in armor/shield strings (e.g. "−1d8", "-2d8").
 * Sums all matches in one string; caller sums armor + shield.
 */
export declare function parsePhysicalSkillPenaltyDiceCount(text: string): number;
/** Total d8 removed from physical skill pool (armor + shield, equipped only). */
export declare function getEquippedPhysicalSkillPenaltyDice(actor: any): number;
/**
 * Heavy weapon: −10 to initiative; with Balanced, −5 instead.
 */
export declare function getEquippedWeaponInitiativePenalty(weaponItem: any): number;
/** Flat initiative modifier from equipped armor + shield + weapon (Heavy). */
export declare function getEquippedEquipmentInitiativeModifier(actor: any): number;
/**
 * Strict equipped-only weapon for attack type (no unequipped / name fallbacks).
 * Multiple equipped weapons should not occur (preUpdateItem enforces one per type).
 */
export declare function resolveEquippedWeaponForAttackType(items: any[], attackType: 'melee' | 'ranged'): any | null;
//# sourceMappingURL=equipment-modifiers.d.ts.map