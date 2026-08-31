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
export function getTargetEvade(targetActor: any): number {
  if (!targetActor || !targetActor.system) return 6;

  const system = targetActor.system as any;
  const combat = system.combat || {};
  const base = combat.evadeTotal ?? combat.evade ?? 6;
  const buffBonus = Number(combat.evadeFromActiveBuffs ?? 0);
  return base + buffBonus;
}

/** Armor used at damage resolution (`damage-dialog`: armorTotal + buffs). */
export function getTargetArmor(targetActor: any): number {
  if (!targetActor?.system) return 0;
  const combat = targetActor.system.combat ?? {};
  return (
    Math.max(0, Math.floor(Number(combat.armorTotal ?? combat.armor ?? 0) || 0)) +
    Math.max(0, Math.floor(Number(combat.armorFromActiveBuffs ?? 0) || 0))
  );
}

/** Spell Resistance used vs spells (`attack-executor.getTargetSpellResistance`). */
export function getTargetSpellResistance(targetActor: any): number {
  if (!targetActor?.system) return 0;
  const combat = targetActor.system.combat ?? {};
  let stoneBonus = 0;
  try {
    const rs = targetActor.getFlag?.('mastery-system', 'roundState');
    stoneBonus = Math.max(0, Math.floor(Number(rs?.stoneBonuses?.spellResistanceBonus ?? 0) || 0));
  } catch {
    /* ignore */
  }
  return Math.max(
    0,
    Math.floor(Number(combat.spellResistanceTotal ?? 0) || 0) +
      Math.floor(Number(combat.spellResistanceFromActiveBuffs ?? 0) || 0) +
      stoneBonus,
  );
}
