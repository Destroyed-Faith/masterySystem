/**
 * Encounter Generator — Threat Report.
 *
 * Pure and Foundry-free. Computes the measurable target values the GM sees
 * before saving: hit chances vs low/avg/high evade, expected damage before/
 * after armor, persistent (armor-ignoring) damage, first-round burst, group
 * damage per round, enemy actions incl. adds, expected duration — plus the
 * same numbers expressed in party HEALTH LEVELS, and balancing warnings.
 */

import {
  EXPLODING_D8_MEAN,
  hitRate,
  quantile,
  simulateAttackTotals,
  type Rng,
} from './encounter-generator-analysis.js';
import { avgHealthLevelSize, specialLabel } from './encounter-generator-concept.js';
import type {
  EncounterProjectPlan,
  PartyMetrics,
  ThreatReport,
} from './encounter-generator-types.js';

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pct(value: number): number {
  return Math.round(value * 100);
}

export function buildThreatReport(
  party: PartyMetrics,
  plan: EncounterProjectPlan,
  rng: Rng = Math.random,
): ThreatReport {
  const warnings: string[] = [];
  const hlSize = avgHealthLevelSize(party);
  const phase1 = plan.phasePlans[0];
  const cycle = phase1?.cycle.filter((c) => !c.isSummon) ?? [];
  const mr = plan.boss.mr;
  const bodies =
    plan.kitMode === 'distinct'
      ? Math.max(1, plan.kits?.length || plan.bossCount || 1)
      : Math.max(1, plan.bossCount || plan.concept?.bossCount || 1);

  const evades = party.members.map((m) => m.evade);
  const lowEvade = evades.length ? Math.min(...evades) : party.avgEvade;
  const highEvade = evades.length ? Math.max(...evades) : party.avgEvade;

  // Direct and AoE rows both compare against Evade. AoE uses one shared roll
  // checked separately per creature — model expected hits with avg Evade and
  // ~2 affected PCs (each checked independently).
  const directRows = cycle.filter((c) => !c.aoe);
  const aoeRows = cycle.filter((c) => !!c.aoe);

  // Boss to-hit sample vs Evade (direct rows share one attack pool per phase).
  const attackDice =
    directRows[0]?.attackDiceCount ?? cycle[0]?.attackDiceCount ?? plan.boss.phases[0]?.attackDiceCount ?? 6;
  const totals = simulateAttackTotals(attackDice, mr, 2500, rng);
  const hitLow = hitRate(totals, lowEvade);
  const hitAvg = hitRate(totals, party.avgEvade);
  const hitHigh = hitRate(totals, highEvade);

  // AoE to-hit sample vs average party Evade (per-creature check).
  let hitAoe = 0;
  if (aoeRows.length) {
    const aoeTotals = simulateAttackTotals(aoeRows[0].attackDiceCount, mr, 2500, rng);
    hitAoe = hitRate(aoeTotals, party.avgEvade);
  }

  /** Hit chance of a cycle row vs the average PC. */
  const rowHit = (c: (typeof cycle)[number]): number => (c.aoe ? hitAoe : hitAvg);
  /** AoE rows affect several PCs at once (~2 on average). */
  const rowTargets = (c: (typeof cycle)[number]): number => (c.aoe ? 2 : 1);

  // Damage per hit, averaged over the cycle.
  const avgDice = cycle.length
    ? cycle.reduce((a, c) => a + c.damageDiceCount, 0) / cycle.length
    : plan.boss.phases[0]?.damageDiceCount ?? 4;
  const rawPerHit = avgDice * EXPLODING_D8_MEAN;
  const drFraction = Math.max(0, Math.min(0.95, party.avgDrPct / 100));
  const afterArmorPerHit = Math.max(0, (rawPerHit - party.avgArmor) * (1 - drFraction));

  // Persistent / armor-ignoring damage per round: expected special
  // applications × X (a fresh application ticks ~X the following round).
  const actions = phase1?.actionsPerRound ?? plan.boss.attackSlots;
  const summonSlots = (phase1?.cycle ?? []).filter((c) => c.isSummon).length;
  const damageActions = Math.max(0, actions - (plan.adds?.summonCostsBossAction ? Math.min(1, summonSlots) : 0));
  const avgSpecialValue = cycle.length
    ? cycle.reduce((a, c) => a + (c.special ? c.specialValue : 0), 0) / cycle.length
    : 0;
  const avgSpecialPerAction = cycle.length
    ? cycle.reduce((a, c) => a + rowHit(c) * (c.special ? c.specialValue : 0) * rowTargets(c), 0) /
      cycle.length
    : 0;
  let persistentPerRound = avgSpecialPerAction * damageActions * bodies;
  if (plan.environment?.special) {
    persistentPerRound += plan.environment.specialValue * 1.5; // ~1-2 PCs in zones
  }

  // First-round burst on ONE target: all damage actions land at p90 damage.
  // Only direct rows can focus a single target; fall back to AoE rows for
  // pure-AoE enemies.
  const burstRows = directRows.length ? directRows : aoeRows;
  const burstDice = burstRows.length
    ? burstRows.reduce((a, c) => a + c.damageDiceCount, 0) / burstRows.length
    : avgDice;
  const burstHit = burstRows === directRows || !aoeRows.length ? hitAvg : hitAoe;
  const p90Total = quantile(totals, 0.9);
  const p90Hits = p90Total >= party.avgEvade ? damageActions : Math.round(damageActions * burstHit);
  const burstPerHitRaw = burstDice * EXPLODING_D8_MEAN * 1.3; // ~p90 of the dice
  const burst =
    (p90Hits * Math.max(0, (burstPerHitRaw - party.avgArmor) * (1 - drFraction)) +
      p90Hits * avgSpecialValue) *
    bodies;

  // Expected group damage per round (boss + adds + environment). AoE rows
  // multiply their per-target damage across ~2 affected PCs.
  const avgDamagePerAction = cycle.length
    ? cycle.reduce((a, c) => {
        const dmg = Math.max(0, (c.damageDiceCount * EXPLODING_D8_MEAN - party.avgArmor) * (1 - drFraction));
        const spec = c.special ? c.specialValue : 0;
        return a + rowHit(c) * (dmg + spec) * rowTargets(c);
      }, 0) / cycle.length
    : hitAvg * (afterArmorPerHit + avgSpecialValue);
  const bossGroupDamage = damageActions * avgDamagePerAction * bodies;
  const addsRound3Attacks = plan.adds ? plan.adds.projectedAttacks[2] ?? 0 : 0;
  const addsGroupDamage = plan.adds ? addsRound3Attacks * plan.adds.design.threatPerAction : 0;
  let envGroupDamage = 0;
  if (plan.environment) {
    const zoneRaw = plan.environment.damageDiceCount * EXPLODING_D8_MEAN;
    const affectedPcs = 1.5;
    envGroupDamage = affectedPcs * Math.max(0, zoneRaw - party.avgArmor * 0.5);
  }
  const groupPerRound = bossGroupDamage + addsGroupDamage + envGroupDamage;

  // Enemy actions per round incl. adds + environment (rounds 1..5).
  const enemyActionsByRound: number[] = [];
  for (let r = 0; r < 5; r++) {
    const addActions = plan.adds ? plan.adds.projectedAttacks[r] ?? 0 : 0;
    const envActions = plan.environment?.actionsPerRound ?? 0;
    enemyActionsByRound.push(actions * bodies + addActions + envActions);
  }

  // Expected duration: party DPS vs total enemy HP; adds soak player actions.
  const bossEvade = plan.boss.phases[0]?.evade ?? mr * 4;
  const bossArmor = plan.boss.phases[0]?.armor ?? mr;
  let partyDps = 0;
  for (const m of party.members) {
    const hr = hitRate(m.attackTotals, bossEvade);
    const dmg = Math.max(0, m.weaponDamageMean + m.mightMeleeBonus - bossArmor);
    partyDps += hr * dmg * m.attacksPerRound;
  }
  partyDps = Math.max(1, partyDps);
  const totalBossHp = plan.boss.phases.reduce((a, p) => a + p.hp, 0) * bodies;
  const bossFocusShare = plan.adds ? 0.6 : plan.environment ? 0.85 : 1;
  const expectedDuration = totalBossHp / (partyDps * bossFocusShare);

  // Round-1 pressure on the squishiest PC (expected, not worst case).
  const lowestPc = party.members.reduce(
    (min, m) => (m.effectiveHP < min.effectiveHP ? m : min),
    party.members[0] ?? { effectiveHP: party.avgHP, barCount: 4, evade: party.avgEvade } as any,
  );
  const lowestHlSize = Math.max(1, lowestPc.effectiveHP / Math.max(1, lowestPc.barCount));
  const hitLowest = hitRate(totals, lowestPc.evade ?? party.avgEvade);
  const round1Expected =
    (damageActions * hitLowest * afterArmorPerHit + hitLowest * avgSpecialValue * damageActions) * bodies;
  const round1HL = round1Expected / lowestHlSize;

  // ── Warnings / recommendations ────────────────────────────────────────
  const usesPersistent = cycle.some((c) => c.special) || !!plan.environment?.special;
  const partyHasCleanse = party.members.some((m) => m.canCleanse);
  if (usesPersistent && !partyHasCleanse) {
    const label = specialLabel(plan.concept.primarySpecial !== 'none' ? plan.concept.primarySpecial : null) || 'Persistent-Schaden';
    warnings.push(
      `Die Gruppe hat kein Cleanse. Hohes ${label} kann auch nach dem Encounter gefährlich bleiben — Anwendung reduzieren oder Counterplay einbauen.`,
    );
  }
  const burstHL = burst / hlSize;
  if (burstHL >= 2) {
    warnings.push(
      `Maximaler Runde-1-Burst auf ein Ziel entspricht ${round1(burstHL)} Health Levels — kann einen Charakter fast ausschalten.`,
    );
  }
  if (round1HL > 1.3) {
    warnings.push(
      `Der zerbrechlichste Charakter verliert in Runde 1 erwartbar ${round1(round1HL)} Health Levels — Erstrundendruck ggf. senken.`,
    );
  }
  if (plan.adds) {
    const proj = plan.adds.projectedActive;
    if (proj[4] >= plan.adds.maxActive && plan.adds.spawnPerRound * 2 > plan.adds.maxActive) {
      warnings.push('Add-Population läuft schnell ins Maximum — Spawn-Rate oder Cap prüfen, sonst eskaliert die Action Economy.');
    }
  }
  if (hitAvg > 0.8) {
    warnings.push(`Der Boss trifft ${pct(hitAvg)}% gegen das durchschnittliche Ausweichen — fast jede Aktion sitzt.`);
  } else if (hitAvg < 0.3) {
    warnings.push(`Der Boss trifft nur ${pct(hitAvg)}% gegen das durchschnittliche Ausweichen — er wirkt evtl. harmlos.`);
  }
  if (expectedDuration > 9) {
    warnings.push(`Erwartete Kampfdauer ~${Math.round(expectedDuration)} Runden — ggf. HP senken.`);
  } else   if (expectedDuration < 2.5) {
    warnings.push(`Erwartete Kampfdauer unter 3 Runden — der Boss fällt evtl. um, bevor die Mechanik greift.`);
  }
  if (bodies > 1) {
    warnings.push(
      `${bodies} Hauptgegner handeln unabhängig — Action Economy und Fokus-Druck sind höher als bei einem einzelnen Boss.`,
    );
  }
  const partyMr = Math.max(1, Math.round(party.medianMR || 1));
  const mrCap = Math.min(8, partyMr + 1);
  if (plan.boss.mr > mrCap) {
    warnings.push(
      `Stopp: Gegner-MR ${plan.boss.mr} liegt über dem Maximum (Gruppen-MR ${partyMr} + 1 = ${mrCap}).`,
    );
  } else if (plan.boss.mr >= mrCap) {
    warnings.push(
      `Vorsicht: Gegner-MR ist ${plan.boss.mr} — das Maximum für diese Gruppe (MR ${partyMr} + 1). Höher geht nicht.`,
    );
  }

  return {
    hitChanceLowEvade: pct(hitLow),
    hitChanceAvgEvade: pct(hitAvg),
    hitChanceHighEvade: pct(hitHigh),
    areaTn: null,
    hitChanceAreaTn: aoeRows.length ? pct(hitAoe) : null,
    expectedHitDamageRaw: round1(rawPerHit),
    expectedHitDamageAfterArmor: round1(afterArmorPerHit),
    persistentDamagePerRound: round1(persistentPerRound),
    firstRoundBurstOneTarget: Math.round(burst),
    firstRoundBurstHealthLevels: round1(burstHL),
    expectedGroupDamagePerRound: Math.round(groupPerRound),
    expectedGroupDamageHealthLevels: round1(groupPerRound / hlSize),
    environmentDamagePerRound: Math.round(envGroupDamage),
    enemyActionsByRound,
    expectedDurationRounds: round1(expectedDuration),
    avgHealthLevelSize: Math.round(hlSize),
    round1HealthLevelsLowestPc: round1(round1HL),
    warnings,
  };
}
