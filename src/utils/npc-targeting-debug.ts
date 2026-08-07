/**
 * Verbose NPC attack targeting diagnostics.
 * Filter browser console with:  MS NPC Targeting
 */

import {
  coerceNpcPhasesArray,
  resolveNpcAttackList,
  resolveNpcAttackTargeting,
  type NpcAttackTargeting,
} from './npc-attack-model.js';

const PREFIX = '[MS NPC Targeting]';

export function npcTargetingSnap(row: any): {
  name: string;
  kind: string;
  meters: string | number;
  min: string | number;
  aoe: string | number;
  shape: string;
  burst: boolean;
  ranged: boolean;
} {
  const t = resolveNpcAttackTargeting(row);
  return {
    name: String(row?.name || '—'),
    kind: String(row?.npcRangeKind ?? '∅'),
    meters: row?.npcRangeMeters ?? '∅',
    min: row?.npcRangeMinMeters ?? '∅',
    aoe: row?.npcAoeRadiusM ?? '∅',
    shape: String(row?.npcAoeShape ?? '∅'),
    burst: t.burstMeleeAoE,
    ranged: t.isRanged,
  };
}

export function npcTargetingLine(label: string, row: any): string {
  const s = npcTargetingSnap(row);
  return `${PREFIX} ${label} → name="${s.name}" kind=${s.kind} m=${s.meters} min=${s.min} aoe=${s.aoe} shape=${s.shape} burst=${s.burst} ranged=${s.ranged}`;
}

export function logNpcTargeting(label: string, detail?: Record<string, unknown>): void {
  if (detail) console.log(`${PREFIX} ${label}`, detail);
  else console.log(`${PREFIX} ${label}`);
}

export function logNpcTargetingRow(label: string, row: any, extra?: Record<string, unknown>): void {
  console.log(npcTargetingLine(label, row), extra ?? '');
}

/** Dump every attack combat will see from this system blob. */
export function logNpcAttackListDump(label: string, system: any, actorMeta?: Record<string, unknown>): void {
  const phasesRaw = system?.phases;
  const phases = coerceNpcPhasesArray(phasesRaw);
  const { attacks, phaseIndex } = resolveNpcAttackList(system || {});
  const rows = attacks.map((atk, i) => ({
    index: i,
    ...npcTargetingSnap(atk),
    resolved: resolveNpcAttackTargeting(atk),
  }));
  console.log(`${PREFIX} ${label} — attack list`, {
    ...actorMeta,
    phasesIsArray: Array.isArray(phasesRaw),
    phasesType: phasesRaw == null ? 'null' : Array.isArray(phasesRaw) ? 'array' : typeof phasesRaw,
    phasesLen: phases.length,
    activePhaseIndex: system?.npcActivePhaseIndex,
    resolvedPhaseIndex: phaseIndex,
    rootBase: npcTargetingSnap(system?.npcBaseAttack),
    attackCount: rows.length,
    attacks: rows,
  });
  for (const r of rows) {
    console.log(
      `${PREFIX} ${label} — #${r.index} "${r.name}" kind=${r.kind} aoe=${r.aoe} shape=${r.shape} burst=${r.burst} ranged=${r.ranged}`,
    );
  }
}

/** Compare sheet/world/token actor attack lists side by side. */
export function logNpcActorTargetingCompare(
  label: string,
  tokenActor: any,
  worldActor: any | null | undefined,
): void {
  logNpcAttackListDump(`${label} / token.actor`, tokenActor?.system, {
    actorId: tokenActor?.id,
    actorName: tokenActor?.name,
    isToken: !!tokenActor?.isToken,
    actorLink: tokenActor?.token?.document?.actorLink ?? tokenActor?.getActiveTokens?.()?.[0]?.document?.actorLink,
  });
  if (worldActor && worldActor !== tokenActor) {
    logNpcAttackListDump(`${label} / world.actor`, worldActor.system, {
      actorId: worldActor.id,
      actorName: worldActor.name,
      isToken: !!worldActor.isToken,
    });
    const tList = resolveNpcAttackList(tokenActor?.system || {});
    const wList = resolveNpcAttackList(worldActor.system || {});
    const mismatches: string[] = [];
    const n = Math.max(tList.attacks.length, wList.attacks.length);
    for (let i = 0; i < n; i++) {
      const ts = npcTargetingSnap(tList.attacks[i]);
      const ws = npcTargetingSnap(wList.attacks[i]);
      if (JSON.stringify(ts) !== JSON.stringify(ws)) {
        mismatches.push(`#${i}: token(${ts.kind}/${ts.aoe}/${ts.shape}) vs world(${ws.kind}/${ws.aoe}/${ws.shape})`);
      }
    }
    if (mismatches.length) {
      console.warn(`${PREFIX} ${label} — TOKEN vs WORLD MISMATCH`, mismatches);
    } else {
      console.log(`${PREFIX} ${label} — token and world attack targeting match`);
    }
  } else {
    console.log(`${PREFIX} ${label} — no separate world actor (or same reference)`);
  }
}

export function logNpcOptionBranch(
  label: string,
  option: any,
  targeting: NpcAttackTargeting | null,
): void {
  const source = option?.source;
  const burst = !!option?.burstMeleeAoE;
  const tags = option?.tags || [];
  const isRangedTag = tags.includes('ranged');
  let branch = 'unknown';
  if (source === 'npc-attack') {
    if (!isRangedTag && burst) branch = 'MELEE_AOE_DIALOG';
    else if (!isRangedTag && !burst) branch = 'MELEE_SINGLE_TARGET';
    else if (isRangedTag && (option?.aoeShape === 'radius' || targeting?.rangedZone))
      branch = 'RANGE_AOE_ZONE';
    else if (isRangedTag) branch = 'RANGE_SINGLE_TARGET';
  } else if (source === 'power') {
    branch = burst ? 'POWER_MELEE_AOE' : 'POWER_OTHER';
  }
  console.log(`${PREFIX} ${label} — branch=${branch}`, {
    source,
    name: option?.name,
    id: option?.id,
    itemId: option?.item?.id,
    itemName: option?.item?.name,
    tags,
    burstMeleeAoE: burst,
    aoeShape: option?.aoeShape,
    aoeRadiusMeters: option?.aoeRadiusMeters,
    range: option?.range,
    npcAttackIndex: option?.npcAttackIndex,
    npcPhaseIndex: option?.npcPhaseIndex,
    npcAttackUsageKey: option?.npcAttackUsageKey,
    targeting,
  });
}
