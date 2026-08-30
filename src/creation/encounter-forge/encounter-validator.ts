/**
 * Encounter Validator — turns the solved encounter into explained warnings.
 *
 * Every warning says WHY it fires, in GM-readable terms (rounds, Health
 * Levels, defense shares), never as an abstract score. Thresholds are the
 * central tuning constants.
 */

import { ENCOUNTER_TUNING } from './encounter-tuning.js';
import { NPC_DEFENSE_SUPPORT } from './defense-solver.js';
import type { EncounterDesign } from './encounter-model.js';
import type { EncounterSolution, SolvedPhase } from './solve-encounter.js';

export type WarningSeverity = 'info' | 'warn' | 'strong';

export interface EncounterWarning {
  severity: WarningSeverity;
  code: string;
  message: string;
}

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',');
}

export function validateEncounter(
  design: EncounterDesign,
  solution: EncounterSolution,
): EncounterWarning[] {
  const t = ENCOUNTER_TUNING;
  const warnings: EncounterWarning[] = [];

  // Party data warnings (transient/inconsistent actor state).
  for (const w of solution.party.warnings) {
    warnings.push({ severity: 'info', code: 'party-data', message: w });
  }
  if (solution.party.size === 0) {
    warnings.push({
      severity: 'strong',
      code: 'no-party',
      message: 'Keine Charaktere ausgewählt — ohne Gruppe kann nichts gelöst werden.',
    });
    return warnings;
  }

  solution.phases.forEach((phase) => {
    const label = `Phase ${phase.phaseIndex + 1}`;
    validatePhaseDuration(phase, label, warnings);
    validateDefenses(design, phase, label, warnings);
    validateOffense(phase, label, warnings);
    validateActionEconomy(phase, label, warnings, solution);
    validateEscalation(phase, label, warnings);
  });

  return warnings;
}

function validatePhaseDuration(
  phase: SolvedPhase,
  label: string,
  warnings: EncounterWarning[],
): void {
  const t = ENCOUNTER_TUNING;
  const d = phase.durability;
  if (d.expectedPhaseRounds > t.phaseDurationWarnRounds) {
    warnings.push({
      severity: 'warn',
      code: 'phase-too-long',
      message: `${label} dauert voraussichtlich ${fmt(d.expectedPhaseRounds)} Runden — Ziel sind ~${fmt(t.targetPhaseRounds)}. Der Kampf zieht sich; weniger Health oder schwächere Verteidigungen prüfen.`,
    });
  }
  if (d.unfavorableRounds > t.phaseDurationBadCaseWarnRounds) {
    warnings.push({
      severity: 'strong',
      code: 'phase-bad-case',
      message: `${label}: Bei schlechten Würfen dauert die Phase ~${fmt(d.unfavorableRounds)} Runden (> ${fmt(t.phaseDurationBadCaseWarnRounds)}). Das Risiko eines zähen Kampfes ist hoch.`,
    });
  }
  if (d.expectedPhaseRounds < t.phaseCollapseWarnRounds) {
    warnings.push({
      severity: 'warn',
      code: 'phase-collapse',
      message: `${label} endet voraussichtlich schon nach ${fmt(d.expectedPhaseRounds)} Runden — der Gegner kollabiert vermutlich in Runde 1.`,
    });
  }
  if (d.burstRounds < t.minRoundsUnderBurst) {
    warnings.push({
      severity: 'warn',
      code: 'burst-collapse',
      message: `${label}: Mit einer offensichtlichen Opening-Burst-Sequenz (Stones, Extra-Angriffe) fällt die Phase in ~${fmt(d.burstRounds)} Runden. Gegen Nova-Runden ist sie nicht stabil.`,
    });
  }
}

function validateDefenses(
  design: EncounterDesign,
  phase: SolvedPhase,
  label: string,
  warnings: EncounterWarning[],
): void {
  const t = ENCOUNTER_TUNING;
  for (const enemy of phase.enemies) {
    const contributions = enemy.defensePackage.contributions;
    for (const c of contributions) {
      if (!c.supported) {
        warnings.push({
          severity: 'strong',
          code: 'defense-unsupported',
          message: `${label}, ${enemy.enemyName}: ${c.kind} ist für generierte NPCs nicht verfügbar — ${NPC_DEFENSE_SUPPORT[c.kind].note}`,
        });
        continue;
      }
      if (c.share < t.defenseUselessShareWarn && contributions.length > 1) {
        warnings.push({
          severity: 'warn',
          code: 'defense-useless',
          message: `${label}, ${enemy.enemyName}: ${c.kind} verhindert nur ${fmt(c.share * 100, 0)}% des Gesamtschutzes gegen diese Gruppe — die Wahl bringt hier fast nichts (z. B. Spell Resistance gegen eine Gruppe ohne Zauber).`,
        });
      }
    }
    const primary = contributions.find((c) => c.slot === 'primary');
    const biggest = contributions.reduce(
      (best, c) => (c.preventedPerRound > best.preventedPerRound ? c : best),
      contributions[0],
    );
    if (primary && biggest && primary.kind !== biggest.kind && primary.supported) {
      warnings.push({
        severity: 'warn',
        code: 'identity-inverted',
        message: `${label}, ${enemy.enemyName}: ${biggest.kind} trägt mehr zur Überlebensfähigkeit bei (${fmt(biggest.share * 100, 0)}%) als die gewählte Primärverteidigung ${primary.kind} (${fmt(primary.share * 100, 0)}%). Die Verteidigungsidentität kippt.`,
      });
    }
  }
}

function validateOffense(phase: SolvedPhase, label: string, warnings: EncounterWarning[]): void {
  const t = ENCOUNTER_TUNING;
  const o = phase.offense;
  for (const pc of o.perPc) {
    if (pc.expectedHlLostPerRound > t.pcRoundHealthLevelWarn) {
      warnings.push({
        severity: 'strong',
        code: 'pc-outlier',
        message: `${label}: ${pc.name} verliert erwartet ${fmt(pc.expectedHlLostPerRound)} Health Level pro Runde — deutlicher Verwundbarkeits-Ausreißer in dieser Gruppe.`,
      });
    }
    const cap = 4 * 2; // display heuristic vs the 4×MR application limit at MR 2
    if (pc.peakSpecialStacks > cap * t.specialAccumulationWarnFraction) {
      warnings.push({
        severity: 'warn',
        code: 'special-accumulation',
        message: `${label}: Auf ${pc.name} akkumulieren sich Specials bis auf ~${fmt(pc.peakSpecialStacks, 0)} Punkte vor Phasenende — gefährliche Dauerbelastung, Cleanse-Optionen prüfen.`,
      });
    }
  }
  if (o.worstSingleHitQ90 > t.singleHitHealthFractionWarn) {
    warnings.push({
      severity: 'warn',
      code: 'burst-hit',
      message: `${label}: „${o.worstSingleHitAttackName}" trifft ${o.worstSingleHitTargetName} im 90. Perzentil für ${fmt(o.worstSingleHitQ90 * 100, 0)}% der Gesamt-HP — ein einzelner Treffer kann unverhältnismäßigen Burst erzeugen.`,
    });
  }
  // AoE occupancy danger: dangerous case vs typical case.
  for (const enemy of phase.enemies) {
    for (const atk of enemy.attacks) {
      if (!atk.occupancy) continue;
      if (atk.occupancy.dangerous >= 3) {
        warnings.push({
          severity: 'info',
          code: 'aoe-occupancy',
          message: `${label}, ${enemy.enemyName}: „${atk.name}" (AoE) — Bewertung nutzt ${atk.occupancy.typical} Ziele als typischen Fall; bei ${atk.occupancy.dangerous}+ getroffenen PCs wird der Angriff deutlich gefährlicher. Jedes getroffene Ziel erhält die volle Wirkung.`,
        });
      }
    }
  }
}

function validateActionEconomy(
  phase: SolvedPhase,
  label: string,
  warnings: EncounterWarning[],
  solution: EncounterSolution,
): void {
  const t = ENCOUNTER_TUNING;
  const totalHostile =
    phase.enemies.reduce((a, e) => a + e.offensiveActions, 0) + phase.actionEconomy.addActions;
  const partyActions = phase.actionEconomy.party.offensiveActionsPerRound;
  if (totalHostile > partyActions * t.excessiveActionRatio) {
    warnings.push({
      severity: 'strong',
      code: 'action-economy-excessive',
      message: `${label}: ${totalHostile} feindliche Offensiv-Aktionen pro Runde gegen ${partyActions} der Gruppe — die Action Economy erdrückt die Spieler (Grenze: ×${t.excessiveActionRatio}).`,
    });
  }
  for (const enemy of phase.enemies) {
    const repeated = enemy.attacks.filter((a) => a.usesPerRound > 1);
    if (repeated.length > 0) {
      warnings.push({
        severity: 'warn',
        code: 'attack-variety',
        message: `${label}, ${enemy.enemyName}: ${enemy.offensiveActions} Aktionen, aber nur ${enemy.attacks.length} unterschiedliche Angriffe — ${repeated.map((a) => `„${a.name}"`).join(', ')} wird mehrfach pro Runde eingesetzt. Weitere konkrete Angriffe anlegen, statt denselben zu wiederholen.`,
      });
    }
    if (enemy.paysSummonAction) {
      warnings.push({
        severity: 'info',
        code: 'summon-cost',
        message: `${label}: ${enemy.enemyName} zahlt in Runde 1 eine Angriffs-Aktion für die Beschwörung; ab Runde 2 erzeugt der Summon zusätzlichen Druck.`,
      });
    }
  }
  if (phase.enemies.length > 1) {
    warnings.push({
      severity: 'info',
      code: 'focus-fire',
      message: `${label}: Nach dem Fall des ersten Hauptgegners (~Runde ${fmt(phase.durability.timeToFirstDrop)}) bleiben ${phase.hostileActionsAfterFirstDrop} feindliche Aktionen pro Runde aktiv.`,
    });
  }
}

function validateEscalation(phase: SolvedPhase, label: string, warnings: EncounterWarning[]): void {
  // Specials escalation: does the phase get substantially more dangerous in
  // later rounds (accumulated ticks/stacks)?
  const perPc = phase.offense.perPc;
  if (perPc.length === 0) return;
  const rounds = perPc[0].poolPenaltyByRound.length;
  if (rounds >= 4) {
    const lateRisk = perPc.some((pc) => pc.peakSpecialStacks >= 4);
    if (lateRisk && phase.durability.unfavorableRounds >= 4) {
      warnings.push({
        severity: 'warn',
        code: 'late-round-escalation',
        message: `${label}: Erreicht die Phase Runde 4, ist die akkumulierte Special-Belastung deutlich höher als zu Beginn — die Phase wird ab Runde 4 substanziell gefährlicher.`,
      });
    }
  }
}
