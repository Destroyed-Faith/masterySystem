/**
 * Live combat defender totals — the same arithmetic Foundry uses when an
 * attack is resolved. Encounter Forge imports these so it does not keep a
 * second interpretation of the sheet.
 *
 * Always-on Passive `mechanics.evade` / `mechanics.armor` are already folded
 * into `evadeTotal` / `armorTotal` by `prepareDerivedData`. Active Buff
 * bonuses still stack on top via `*FromActiveBuffs`.
 */
import { actorHasSurprise, evadeAfterSurprise } from './surprise.js';
/** Evade used at attack resolution (`attack-executor.getTargetEvade`). */
export function getTargetEvade(targetActor) {
    if (!targetActor || !targetActor.system)
        return 6;
    const system = targetActor.system;
    const combat = system.combat || {};
    const base = combat.evadeTotal ?? combat.evade ?? 6;
    const buffBonus = Number(combat.evadeFromActiveBuffs ?? 0);
    return evadeAfterSurprise(base + buffBonus, actorHasSurprise(targetActor));
}
/** Armor used at damage resolution (`damage-dialog`: armorTotal + buffs). */
export function getTargetArmor(targetActor) {
    if (!targetActor?.system)
        return 0;
    const combat = targetActor.system.combat ?? {};
    return (Math.max(0, Math.floor(Number(combat.armorTotal ?? combat.armor ?? 0) || 0)) +
        Math.max(0, Math.floor(Number(combat.armorFromActiveBuffs ?? 0) || 0)));
}
/** Spell Resistance used vs spells (`attack-executor.getTargetSpellResistance`). */
export function getTargetSpellResistance(targetActor) {
    if (!targetActor?.system)
        return 0;
    const combat = targetActor.system.combat ?? {};
    let stoneBonus = 0;
    try {
        const rs = targetActor.getFlag?.('mastery-system', 'roundState');
        stoneBonus = Math.max(0, Math.floor(Number(rs?.stoneBonuses?.spellResistanceBonus ?? 0) || 0));
    }
    catch {
        /* ignore */
    }
    return Math.max(0, Math.floor(Number(combat.spellResistanceTotal ?? 0) || 0) +
        Math.floor(Number(combat.spellResistanceFromActiveBuffs ?? 0) || 0) +
        stoneBonus);
}
/** Intellect Spell Penetration on the caster. Never applied to a Base TN. */
export function getCasterSpellPenetration(caster) {
    if (!caster)
        return 0;
    try {
        const rs = caster.getFlag?.('mastery-system', 'roundState');
        return Math.max(0, Math.floor(Number(rs?.stoneBonuses?.spellPenetration ?? 0) || 0));
    }
    catch {
        return 0;
    }
}
/**
 * Spell Resistance after Spell Penetration.
 * Penetration subtracts only from SR, floors at 0, and does not touch Base TN.
 */
export function spellResistanceAfterPenetration(targetActor, caster) {
    return Math.max(0, getTargetSpellResistance(targetActor) - getCasterSpellPenetration(caster));
}
//# sourceMappingURL=target-defenses.js.map