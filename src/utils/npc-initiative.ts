/**
 * NPC / Summon initiative flat modifier from the sheet combat block.
 * Applied on top of Mastery Rank d8 at combat start (no Combat Reflexes).
 */

export function clampNpcInitiativeModifier(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return 0;
  return Math.max(-10, Math.min(10, n));
}

/** Split a stored net modifier into UI malus (≤0) / bonus (≥0) selects. */
export function splitNpcInitiativeModifier(raw: unknown): {
  malus: number;
  bonus: number;
  net: number;
} {
  const net = clampNpcInitiativeModifier(raw);
  return {
    net,
    malus: net < 0 ? net : 0,
    bonus: net > 0 ? net : 0,
  };
}

export function formatNpcInitiativeSigned(net: number): string {
  const n = clampNpcInitiativeModifier(net);
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : String(n);
}

/** Active-phase (or root) initiative modifier for an NPC/summon actor. */
export function getNpcInitiativeModifier(actor: any): number {
  if (!actor?.system) return 0;
  const system = actor.system as any;
  const phases = Array.isArray(system.phases) ? system.phases : [];
  let raw = system.combat?.initiative;
  if (phases.length > 0) {
    const idx = Math.max(
      0,
      Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)),
    );
    const phaseIni = phases[idx]?.combat?.initiative;
    if (phaseIni !== undefined && phaseIni !== null && phaseIni !== '') {
      raw = phaseIni;
    }
  }
  return clampNpcInitiativeModifier(raw);
}
