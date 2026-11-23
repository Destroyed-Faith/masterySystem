/**
 * Live combat defender totals — the same arithmetic Foundry uses when an
 * attack is resolved. Encounter Forge imports these so it does not keep a
 * second interpretation of the sheet.
 *
 * Always-on Passive `mechanics.evade` / `mechanics.armor` are already folded
 * into `evadeTotal` / `armorTotal` by `prepareDerivedData`. The Active Buff
 * part (`*FromActiveBuffs` vs Protective Auras in range, highest only) adds on top.
 */
import { type ProtectiveAuraStat } from './protective-aura-runtime.js';
/** Evade used at attack resolution (`attack-executor.getTargetEvade`). */
export declare function getTargetEvade(targetActor: any, attacker?: any): number;
/** Evade (evadeTotal + Active Buffs) before attacker reductions and All-Out drawbacks. */
export declare function getTargetEvadeBeforeAllOut(targetActor: any): number;
/** Effective Armor (armorTotal + Active Buffs) before any All-Out drawback. */
export declare function getTargetArmorBeforeAllOut(targetActor: any): number;
/**
 * Active Buff part of Armor / Evade / Spell Resistance: the highest of the
 * creature's own Active Buff and every Protective Aura it stands in (no stacking).
 */
export declare function activeBuffDefenseBonus(targetActor: any, stat: ProtectiveAuraStat): number;
/** Armor used at damage resolution (`damage-dialog`: armorTotal + buffs). */
export declare function getTargetArmor(targetActor: any): number;
/** Spell Resistance used vs spells (`attack-executor.getTargetSpellResistance`). */
export declare function getTargetSpellResistance(targetActor: any): number;
/**
 * Spell Resistance ignored by the caster (Stone Penetration + Passive Piercing).
 * Never applied to Spell Base TN.
 */
export declare function getCasterSpellPenetration(caster: any): number;
/**
 * Spell Resistance after Spell Penetration.
 * Penetration subtracts only from SR, floors at 0, and does not touch Base TN.
 */
export declare function spellResistanceAfterPenetration(targetActor: any, caster: any): number;
//# sourceMappingURL=target-defenses.d.ts.map