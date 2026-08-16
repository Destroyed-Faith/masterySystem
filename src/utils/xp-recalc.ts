/**
 * Ground-truth XP recalculation.
 *
 * Recomputes a character's *invested* XP directly from the current build
 * (attributes, skills, power levels, artifact levels) measured against the
 * immutable post-creation baseline, then redistributes the two XP pools so that
 * `invested = freeSpent + regularSpent` with the **Free pool spent first**
 * (matching the live spend logic), and derives the correct available XP.
 *
 * This deliberately ignores the XP history log, so it self-corrects accounting
 * drift caused by buggy / duplicated refund entries (e.g. the old Combat
 * Package Wizard "power upgrade refund" over-refund).
 */

import { ARTIFACT_UPGRADE_XP_COST } from './artifact-actor-rules.js';
import { attributeBandCost } from './constants.js';
import { calculatePowersUpgradeRefund } from './power-xp-refund.js';
import { actorHasPostCreationSnapshot, type PostCreationProgress } from './xp-post-creation.js';

const ATTRIBUTE_KEYS = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'] as const;

export interface XpRecalcResult {
  ok: boolean;
  error?: string;
  /** Lifetime earned regular XP. */
  totalEarned: number;
  /** Lifetime earned Free XP. */
  freeEarned: number;
  attributeSpent: number;
  skillSpent: number;
  powerSpent: number;
  artifactSpent: number;
  /** Total XP invested in the current build (attributes + skills + powers + artifacts). */
  totalInvested: number;
  /** Correct regular spent (after Free pool absorbs as much as possible). */
  regularSpent: number;
  /** Correct Free spent. */
  freeSpent: number;
  /** Correct regular available. */
  available: number;
  /** Correct Free available. */
  freeAvailable: number;
  previousAvailable: number;
  previousFreeAvailable: number;
  previousSpent: number;
  previousFreeSpent: number;
  /** Change in regular available. */
  delta: number;
  /** Change in Free available. */
  freeDelta: number;
  /** Change in total spendable (regular + free). */
  totalDelta: number;
  /** True when any pool value changes. */
  changed: boolean;
}

/** Σ of the banded step cost to raise an Attribute/Skill from `from` to `to`. */
function bandStepSum(from: number, to: number): number {
  const start = Math.floor(Number(from) || 0);
  const end = Math.floor(Number(to) || 0);
  let sum = 0;
  for (let v = start + 1; v <= end; v++) {
    sum += attributeBandCost(v);
  }
  return sum;
}

/**
 * Recompute the correct XP balance for `actor` from its current build.
 * Returns `ok:false` with an `error` when no post-creation snapshot exists
 * (attributes / skills cannot be measured without a baseline).
 */
export function computeGroundTruthXp(actor: any): XpRecalcResult {
  const system = actor?.system ?? {};
  const xp = system.xp ?? {};
  const points = system.points ?? {};

  const totalEarned = Math.max(0, Math.floor(Number(xp.totalEarned) || 0));
  const freeEarned = Math.max(0, Math.floor(Number(xp.freeEarned) || 0));
  const previousAvailable = Math.max(0, Math.floor(Number(points.xp) || 0));
  const previousFreeAvailable = Math.max(0, Math.floor(Number(points.xpFree) || 0));
  const previousSpent = Math.max(0, Math.floor(Number(xp.totalSpent) || 0));
  const previousFreeSpent = Math.max(0, Math.floor(Number(xp.freeSpent) || 0));

  const base = {
    totalEarned,
    freeEarned,
    previousAvailable,
    previousFreeAvailable,
    previousSpent,
    previousFreeSpent,
  };

  const snap = xp.postCreationProgress as PostCreationProgress | undefined;
  if (!snap?.attributes || !actorHasPostCreationSnapshot(actor)) {
    return {
      ok: false,
      error:
        'Kein Post-Creation-Snapshot vorhanden. Ohne diese Baseline lassen sich investierte Attribut-/Skill-XP nicht messen.',
      ...base,
      attributeSpent: 0,
      skillSpent: 0,
      powerSpent: 0,
      artifactSpent: 0,
      totalInvested: 0,
      regularSpent: previousSpent,
      freeSpent: previousFreeSpent,
      available: previousAvailable,
      freeAvailable: previousFreeAvailable,
      delta: 0,
      freeDelta: 0,
      totalDelta: 0,
      changed: false,
    };
  }

  let attributeSpent = 0;
  for (const k of ATTRIBUTE_KEYS) {
    const baseVal = Number(snap.attributes[k] ?? 2);
    const curVal = Number(system.attributes?.[k]?.value ?? baseVal);
    if (curVal > baseVal) attributeSpent += bandStepSum(baseVal, curVal);
  }

  let skillSpent = 0;
  const curSkills: Record<string, number> = system.skills ?? {};
  const snapSkills: Record<string, number> = snap.skills ?? {};
  const skillKeys = new Set<string>([...Object.keys(curSkills), ...Object.keys(snapSkills)]);
  for (const key of skillKeys) {
    const baseVal = Number(snapSkills[key] ?? 0);
    const curVal = Number(curSkills[key] ?? 0);
    if (curVal > baseVal) skillSpent += bandStepSum(baseVal, curVal);
  }

  const powerItems = (actor.items?.filter?.((i: any) => i.type === 'power') ?? []).map((i: any) => ({
    system: i.system,
    type: i.type,
  }));
  const powerSpent = calculatePowersUpgradeRefund(powerItems);

  const artifactItems = actor.items?.filter?.((i: any) => i.type === 'artifact') ?? [];
  let artifactSpent = 0;
  for (const item of artifactItems) {
    const level = Math.max(1, Math.floor(Number(item?.system?.level) || 1));
    if (level > 1) artifactSpent += (level - 1) * ARTIFACT_UPGRADE_XP_COST;
  }

  const totalInvested = attributeSpent + skillSpent + powerSpent + artifactSpent;

  // Free pool is spent first, then regular (mirrors the live spend logic).
  const freeSpent = Math.min(freeEarned, totalInvested);
  const regularSpent = Math.max(0, totalInvested - freeSpent);
  const freeAvailable = Math.max(0, freeEarned - freeSpent);
  const available = Math.max(0, totalEarned - regularSpent);

  const delta = available - previousAvailable;
  const freeDelta = freeAvailable - previousFreeAvailable;
  const totalDelta = available + freeAvailable - (previousAvailable + previousFreeAvailable);
  const changed =
    available !== previousAvailable ||
    freeAvailable !== previousFreeAvailable ||
    regularSpent !== previousSpent ||
    freeSpent !== previousFreeSpent;

  return {
    ok: true,
    ...base,
    attributeSpent,
    skillSpent,
    powerSpent,
    artifactSpent,
    totalInvested,
    regularSpent,
    freeSpent,
    available,
    freeAvailable,
    delta,
    freeDelta,
    totalDelta,
    changed,
  };
}

/** HTML breakdown for the GM confirm dialog. */
export function formatXpRecalcHtml(actorName: string, r: XpRecalcResult): string {
  if (!r.ok) {
    return `<p class="xp-recalc-error"><strong>${actorName}:</strong> ${r.error}</p>`;
  }
  const fmt = (n: number) => `${n > 0 ? '+' : ''}${n}`;
  const totalEarnedAll = r.totalEarned + r.freeEarned;
  return (
    `<div class="xp-recalc-dialog">` +
    `<p>Neuberechnung der verfügbaren XP für <strong>${actorName}</strong> aus dem aktuellen Build:</p>` +
    `<table class="xp-recalc-table" style="width:100%;border-collapse:collapse;margin:8px 0;">` +
    `<tbody>` +
    `<tr><td>Verdient gesamt (Regular ${r.totalEarned} + Free ${r.freeEarned})</td><td style="text-align:right;"><strong>${totalEarnedAll}</strong></td></tr>` +
    `<tr><td>− Attribute</td><td style="text-align:right;">${r.attributeSpent}</td></tr>` +
    `<tr><td>− Skills</td><td style="text-align:right;">${r.skillSpent}</td></tr>` +
    `<tr><td>− Powers</td><td style="text-align:right;">${r.powerSpent}</td></tr>` +
    `<tr><td>− Artefakte</td><td style="text-align:right;">${r.artifactSpent}</td></tr>` +
    `<tr style="border-top:1px solid rgba(255,255,255,0.2);"><td>= Investiert (gesamt)</td><td style="text-align:right;"><strong>${r.totalInvested}</strong></td></tr>` +
    `</tbody></table>` +
    `<p class="xp-recalc-result" style="margin:6px 0;">Korrekt: <strong>${r.available}</strong> regulär verfügbar &nbsp;·&nbsp; <strong>${r.freeAvailable}</strong> Free verfügbar &nbsp;(Free zuerst ausgegeben).</p>` +
    `<p class="xp-recalc-compare" style="opacity:0.8;">Aktuell verbucht: ${r.previousAvailable} regulär / ${r.previousFreeAvailable} Free &nbsp;→&nbsp; Änderung: Regular <strong>${fmt(r.delta)}</strong>, Free <strong>${fmt(r.freeDelta)}</strong> (gesamt <strong>${fmt(r.totalDelta)}</strong> XP).</p>` +
    `</div>`
  );
}
