/**
 * Ground-truth XP recalculation.
 *
 * Recomputes a character's *invested* XP directly from the current build
 * (attributes, skills, power levels) measured against the immutable
 * post-creation baseline, then derives the correct available XP as
 * `available = totalEarned − invested`.
 *
 * This deliberately ignores the XP history log, so it self-corrects accounting
 * drift caused by buggy / duplicated refund entries (e.g. the old Combat
 * Package Wizard "power upgrade refund" over-refund).
 */

import { attributeBandCost } from './constants.js';
import { calculatePowersUpgradeRefund } from './power-xp-refund.js';
import { actorHasPostCreationSnapshot, type PostCreationProgress } from './xp-post-creation.js';

const ATTRIBUTE_KEYS = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'] as const;

export interface XpRecalcResult {
  ok: boolean;
  error?: string;
  totalEarned: number;
  freeEarned: number;
  freeAvailable: number;
  attributeSpent: number;
  skillSpent: number;
  powerSpent: number;
  totalSpent: number;
  available: number;
  previousAvailable: number;
  previousSpent: number;
  /** `available − previousAvailable` (negative means XP was removed). */
  delta: number;
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
  const freeAvailable = Math.max(0, Math.floor(Number(points.xpFree) || 0));
  const previousAvailable = Math.max(0, Math.floor(Number(points.xp) || 0));
  const previousSpent = Math.max(0, Math.floor(Number(xp.totalSpent) || 0));

  const base = {
    totalEarned,
    freeEarned,
    freeAvailable,
    previousAvailable,
    previousSpent,
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
      totalSpent: 0,
      available: previousAvailable,
      delta: 0,
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

  const totalSpent = attributeSpent + skillSpent + powerSpent;
  const available = Math.max(0, totalEarned - totalSpent);
  const delta = available - previousAvailable;

  return {
    ok: true,
    ...base,
    attributeSpent,
    skillSpent,
    powerSpent,
    totalSpent,
    available,
    delta,
  };
}

/** HTML breakdown for the GM confirm dialog. */
export function formatXpRecalcHtml(actorName: string, r: XpRecalcResult): string {
  if (!r.ok) {
    return `<p class="xp-recalc-error"><strong>${actorName}:</strong> ${r.error}</p>`;
  }
  const deltaStr = r.delta === 0 ? '±0' : `${r.delta > 0 ? '+' : ''}${r.delta}`;
  const freeNote =
    r.freeEarned > 0
      ? `<p class="xp-recalc-note"><em>Hinweis: Dieser Charakter hat Free XP (${r.freeAvailable} verfügbar / ${r.freeEarned} verdient). Die Neuberechnung betrifft nur das reguläre XP-Konto.</em></p>`
      : '';
  return (
    `<div class="xp-recalc-dialog">` +
    `<p>Neuberechnung der verfügbaren XP für <strong>${actorName}</strong> aus dem aktuellen Build:</p>` +
    `<table class="xp-recalc-table" style="width:100%;border-collapse:collapse;margin:8px 0;">` +
    `<tbody>` +
    `<tr><td>Verdiente XP (Basis)</td><td style="text-align:right;"><strong>${r.totalEarned}</strong></td></tr>` +
    `<tr><td>− Attribute</td><td style="text-align:right;">${r.attributeSpent}</td></tr>` +
    `<tr><td>− Skills</td><td style="text-align:right;">${r.skillSpent}</td></tr>` +
    `<tr><td>− Powers</td><td style="text-align:right;">${r.powerSpent}</td></tr>` +
    `<tr style="border-top:1px solid rgba(255,255,255,0.2);"><td>= Investiert (gesamt)</td><td style="text-align:right;"><strong>${r.totalSpent}</strong></td></tr>` +
    `<tr><td><strong>= Verfügbar (korrekt)</strong></td><td style="text-align:right;"><strong>${r.available}</strong></td></tr>` +
    `</tbody></table>` +
    `<p class="xp-recalc-compare">Aktuell verbucht: <strong>${r.previousAvailable}</strong> verfügbar / ${r.previousSpent} ausgegeben &nbsp;→&nbsp; Änderung: <strong>${deltaStr}</strong> XP.</p>` +
    freeNote +
    `</div>`
  );
}
