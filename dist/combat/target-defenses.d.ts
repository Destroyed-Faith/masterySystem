/**
 * Live combat defender totals — the same arithmetic Foundry uses when an
 * attack is resolved. Encounter Forge imports these so it does not keep a
 * second interpretation of the sheet.
 *
 * Always-on Passive `mechanics.evade` / `mechanics.armor` are already folded
 * into `evadeTotal` / `armorTotal` by `prepareDerivedData`. Active Buff
 * bonuses still stack on top via `*FromActiveBuffs`.
 */
/** Evade used at attack resolution (`attack-executor.getTargetEvade`). */
export declare function getTargetEvade(targetActor: any): number;
/** Armor used at damage resolution (`damage-dialog`: armorTotal + buffs). */
export declare function getTargetArmor(targetActor: any): number;
/** Spell Resistance used vs spells (`attack-executor.getTargetSpellResistance`). */
export declare function getTargetSpellResistance(targetActor: any): number;
/** Intellect Spell Penetration on the caster. Never applied to a Base TN. */
export declare function getCasterSpellPenetration(caster: any): number;
/**
 * Spell Resistance after Spell Penetration.
 * Penetration subtracts only from SR, floors at 0, and does not touch Base TN.
 */
export declare function spellResistanceAfterPenetration(targetActor: any, caster: any): number;
//# sourceMappingURL=target-defenses.d.ts.map