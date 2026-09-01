/**
 * Live combat defender totals — the same arithmetic Foundry uses when an
 * attack is resolved. Encounter Forge imports these so it does not keep a
 * second interpretation of the sheet.
 *
 * Passive `mechanics.evade` / `mechanics.armor` are intentionally NOT added
 * here: `prepareDerivedData` zeroes `evadeFromMechanics` / `armorFromMechanics`.
 * That live behavior is flagged for rules review, not changed in this pass.
 */
/** Evade used at attack resolution (`attack-executor.getTargetEvade`). */
export declare function getTargetEvade(targetActor: any): number;
/** Armor used at damage resolution (`damage-dialog`: armorTotal + buffs). */
export declare function getTargetArmor(targetActor: any): number;
/** Spell Resistance used vs spells (`attack-executor.getTargetSpellResistance`). */
export declare function getTargetSpellResistance(targetActor: any): number;
//# sourceMappingURL=target-defenses.d.ts.map