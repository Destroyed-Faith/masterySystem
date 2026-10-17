/**
 * Growth Form riders that sit on the active buff besides the stat package:
 * melee reach, forced-movement reduction, and Prone resistance.
 */

export interface GrowthFormRider {
  reachBonusM: number;
  pushReductionM: number;
  proneImmunity: 'none' | 'smaller' | 'standard';
  footprintHexes: number;
}

function effectList(actor: any): any[] {
  const effects = actor?.effects;
  if (!effects) return [];
  if (Array.isArray(effects?.contents)) return effects.contents;
  if (typeof effects[Symbol.iterator] === 'function') return Array.from(effects);
  return [];
}

export function readGrowthFormRider(actor: any): GrowthFormRider | null {
  let best: GrowthFormRider | null = null;
  for (const effect of effectList(actor)) {
    if (effect?.disabled) continue;
    const gf = effect?.flags?.['mastery-system']?.mechanics?.growthForm;
    if (!gf || typeof gf !== 'object') continue;
    const immunity = gf.proneImmunity === 'standard' || gf.proneImmunity === 'smaller' ? gf.proneImmunity : 'none';
    const row: GrowthFormRider = {
      reachBonusM: Math.max(0, Number(gf.reachBonusM) || 0),
      pushReductionM: Math.max(0, Number(gf.pushReductionM) || 0),
      proneImmunity: immunity,
      footprintHexes: Math.max(1, Math.floor(Number(gf.footprintHexes) || 1)),
    };
    if (
      !best ||
      row.reachBonusM > best.reachBonusM ||
      row.pushReductionM > best.pushReductionM
    ) {
      best = row;
    }
  }
  return best;
}

/**
 * `smaller`: sources with a smaller footprint cannot knock you Prone.
 * `standard`: only a larger footprint than 1 hex can knock you Prone.
 */
export function growthFormBlocksProne(defender: any, attacker: any): boolean {
  const form = readGrowthFormRider(defender);
  if (!form || form.proneImmunity === 'none') return false;
  const sourceFoot = readGrowthFormRider(attacker)?.footprintHexes ?? 1;
  if (form.proneImmunity === 'standard') return sourceFoot <= 1;
  return sourceFoot < form.footprintHexes;
}

export function reduceForcedMeters(actor: any, meters: number): number {
  const cut = readGrowthFormRider(actor)?.pushReductionM ?? 0;
  return Math.max(0, Math.floor(Number(meters) || 0) - cut);
}
