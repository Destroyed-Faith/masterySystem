/**
 * NPC Print / Export
 *
 * Builds a print-friendly context from an `npc` actor and renders one A4 page
 * per boss phase (or a single page for phase-less NPCs). Opens a standalone
 * window that triggers `window.print()` (save as PDF).
 */

import type { AttackValue, BossPhase, HealthBar, StatusEffect } from '../types/actor.js';
import { CREATURE_TYPE_OPTIONS, resolveCreatureType } from '../utils/creature-type.js';
import {
  formatNpcAttackSpecialsLine,
  npcAttackDiceCount,
  npcAttackKeepDice,
  npcAttacksPerRoundCap,
  npcDamageDiceFormula,
  resolveNpcAttackList,
  sumNpcAttackSlotsFromPowers,
} from '../utils/npc-attack-model.js';
import {
  clampNpcInitiativeModifier,
  formatNpcInitiativeSigned,
} from '../utils/npc-initiative.js';
import { specialApplicationLimit } from '../combat/special-application.js';

const PRINT_TEMPLATE = 'systems/mastery-system/templates/actor/npc-print.hbs';
const PRINT_TEMPLATE_COMPACT = 'systems/mastery-system/templates/actor/npc-print-compact.hbs';
const PRINT_CSS = 'systems/mastery-system/styles/npc-print.css';

export type NpcPrintOptions = {
  /** Dense combat strip with precalculated attack lines (no skills/attributes). */
  layout?: 'full' | 'compact';
};

function routed(path: string): string {
  try {
    const getRoute = (foundry as any)?.utils?.getRoute;
    if (typeof getRoute === 'function') return getRoute(path);
  } catch {
    /* ignore */
  }
  return `${window.location.origin}/${path.replace(/^\//, '')}`;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asHealthBars(raw: unknown): HealthBar[] {
  if (Array.isArray(raw)) return raw as HealthBar[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, HealthBar>;
    return Object.keys(o)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((k) => o[k]);
  }
  return [];
}

function creatureTypeLabel(actor: any): string {
  const key = resolveCreatureType(actor);
  if (!key) return '—';
  const hit = CREATURE_TYPE_OPTIONS.find((o) => o.value === key);
  return hit?.label || key;
}

function formatRangeLine(atk: AttackValue): string {
  const kind = String(atk.npcRangeKind || '').toLowerCase();
  if (kind === 'ranged') {
    const longM = Math.floor(num(atk.npcRangeMeters, 24));
    const shortM = Math.floor(num(atk.npcRangeMinMeters, 12));
    return shortM > 0
      ? `Range Short ≤${shortM} / Long ≤${longM} m`
      : `Range Long ≤${longM} m`;
  }
  const aoeM = Math.floor(num(atk.npcAoeRadiusM, 0));
  if (aoeM >= 2) return 'Melee around self';
  const reach = Math.floor(num(atk.npcRangeMeters, 2));
  return `Melee ${reach > 0 ? reach : 2} m`;
}

function formatAoeLine(atk: AttackValue): string {
  // Radius ≥ 2 m is the only AoE gate (ignore leftover shape).
  const m = Math.floor(num(atk.npcAoeRadiusM, 0));
  if (m < 2) return '—';
  const kind = String(atk.npcRangeKind || '').toLowerCase();
  return kind === 'ranged' ? `AoE ${m} m` : `AoE burst ${m} m`;
}

function formatFlags(atk: AttackValue): string {
  const flags: string[] = [];
  if (atk.npcIsSpell) flags.push('Spell');
  if (atk.npcSplitAttack) flags.push('Split');
  return flags.join(' · ') || '—';
}

function formatStress(atk: AttackValue): string {
  const n = Math.floor(num(atk.npcStressD8, 0));
  return n > 0 ? `${n}d8` : '—';
}

/** Compact range tag for the combat strip (shorter than the full print table). */
function formatCompactRangeTag(atk: AttackValue): string {
  const kind = String(atk.npcRangeKind || '').toLowerCase();
  const aoeM = Math.floor(num(atk.npcAoeRadiusM, 0));
  if (kind === 'ranged') {
    const longM = Math.floor(num(atk.npcRangeMeters, 24));
    const shortM = Math.floor(num(atk.npcRangeMinMeters, 12));
    return shortM > 0 ? `Short ≤${shortM} / Long ≤${longM} m` : `Ranged ≤${longM} m`;
  }
  if (aoeM >= 2) return 'Melee around self';
  const reach = Math.floor(num(atk.npcRangeMeters, 2));
  return `Melee ${reach > 0 ? reach : 2} m`;
}

/**
 * One ready-to-play attack line: pool+keep, damage, range, flags, specials, ×/R.
 * Example: `Speer — 6k3 · 4d8 · Melee 3 m · ×2`
 */
export function formatNpcCompactAttackPlayLine(
  atk: AttackValue,
  opts: { masteryRank: number; castingTn: number; index?: number },
): string {
  const index = opts.index ?? 0;
  const name =
    String(atk.name || '').trim() || (index === 0 ? 'Waffenangriff' : `Power ${index + 1}`);
  const pool = npcAttackDiceCount(atk);
  const keep = npcAttackKeepDice(atk, opts.masteryRank);
  const damage = npcDamageDiceFormula(atk);
  const apr = npcAttacksPerRoundCap(atk);
  const parts: string[] = [];
  parts.push(pool > 0 ? `${pool}k${keep}` : '—');
  parts.push(damage && damage !== '0' ? damage : '—');
  parts.push(formatCompactRangeTag(atk));
  const aoe = formatAoeLine(atk);
  if (aoe !== '—') parts.push(aoe);
  if (atk.npcIsSpell) parts.push(`Spell TN ${opts.castingTn}`);
  if (atk.npcSplitAttack) parts.push('Split');
  const stress = Math.floor(num(atk.npcStressD8, 0));
  if (stress > 0) parts.push(`Stress ${stress}d8`);
  const specials = formatNpcAttackSpecialsLine(atk);
  if (specials) parts.push(specials.replace(/,\s*/g, ' · '));
  if (apr > 1) parts.push(`×${apr}`);
  return `${name} — ${parts.join(' · ')}`;
}

function buildAttackRows(attacks: AttackValue[]): Record<string, unknown>[] {
  return attacks.map((atk, index) => {
    const pool = npcAttackDiceCount(atk);
    const damage = npcDamageDiceFormula(atk);
    const apr = npcAttacksPerRoundCap(atk);
    return {
      index: index + 1,
      name: String(atk.name || '').trim() || (index === 0 ? 'Waffenangriff' : `Power ${index + 1}`),
      pool: pool > 0 ? `${pool}d8` : '—',
      damage: damage && damage !== '0' ? damage : '—',
      // Named rangeText — `range` collides with the Handlebars {{range}} helper
      // and rendered as "1,2,3,4,5,6,7,8" on the print sheet.
      rangeText: formatRangeLine(atk),
      aoe: formatAoeLine(atk),
      flags: formatFlags(atk),
      apr,
      stress: formatStress(atk),
      specials: formatNpcAttackSpecialsLine(atk) || '—',
      isSpell: !!atk.npcIsSpell,
      isSplit: !!atk.npcSplitAttack,
    };
  });
}

function buildHealthRows(bars: HealthBar[]): {
  bars: { name: string; current: number; max: number; penalty: number }[];
  totalMax: number;
  totalCurrent: number;
  summary: string;
} {
  const rows = bars.map((bar, i) => {
    const max = Math.max(0, Math.floor(num(bar?.max, 0)));
    const current = Math.max(0, Math.floor(num(bar?.current, max)));
    const penalty = Math.floor(num(bar?.penalty, 0));
    return {
      name: String(bar?.name || '').trim() || `Bar ${i + 1}`,
      current,
      max,
      penalty,
    };
  });
  const totalMax = rows.reduce((s, r) => s + r.max, 0);
  const totalCurrent = rows.reduce((s, r) => s + r.current, 0);
  const summary =
    rows.length <= 1
      ? `${totalCurrent} / ${totalMax}`
      : rows.map((r) => `${r.name}: ${r.current}/${r.max}`).join(' · ');
  return { bars: rows, totalMax, totalCurrent, summary };
}

function formatStatuses(raw: unknown): string[] {
  if (!Array.isArray(raw) || !raw.length) return [];
  return (raw as StatusEffect[])
    .map((e) => {
      const name = String(e?.name || '').trim();
      if (!name) return '';
      const v = e?.value;
      if (v === undefined || v === null || String(v).trim() === '') return name;
      return `${name} (${v})`;
    })
    .filter(Boolean);
}

type PhaseSource = {
  phaseName: string | null;
  phaseIndex: number | null;
  phaseNumber: number | null;
  phaseCount: number;
  combat: any;
  health: any;
  attacks: AttackValue[];
  statusEffects: unknown;
  attackSlots: number;
};

function collectPhaseSources(system: any): PhaseSource[] {
  const phases = Array.isArray(system?.phases) ? (system.phases as BossPhase[]) : [];
  if (phases.length > 0) {
    return phases.map((phase, i) => {
      const attacks = (() => {
        // Resolve as if this phase were active (do not mutate actor).
        const synthetic = {
          ...system,
          npcActivePhaseIndex: i,
          phases,
        };
        return resolveNpcAttackList(synthetic).attacks;
      })();
      return {
        phaseName: String(phase?.name || '').trim() || `Phase ${i + 1}`,
        phaseIndex: i,
        phaseNumber: i + 1,
        phaseCount: phases.length,
        combat: phase?.combat ?? {},
        health: phase?.health ?? {},
        attacks,
        statusEffects: phase?.statusEffects,
        attackSlots: sumNpcAttackSlotsFromPowers({
          ...system,
          npcActivePhaseIndex: i,
          phases,
        }),
      };
    });
  }

  const { attacks } = resolveNpcAttackList(system);
  return [
    {
      phaseName: null,
      phaseIndex: null,
      phaseNumber: null,
      phaseCount: 0,
      combat: system?.combat ?? {},
      health: system?.health ?? {},
      attacks,
      statusEffects: system?.statusEffects,
      attackSlots: sumNpcAttackSlotsFromPowers(system),
    },
  ];
}

/**
 * Build the flat data object consumed by `npc-print.hbs`.
 * One entry in `pages` per phase (or a single page without phases).
 */
export function buildNpcPrintContext(actor: any): Record<string, unknown> {
  const system = actor?.system ?? {};
  const name = String(actor?.name ?? system?.bio?.name ?? 'NPC').trim() || 'NPC';
  const masteryRank = Math.max(1, Math.floor(num(system?.mastery?.rank, 1)));
  const castingTn = 8 * masteryRank;
  const creatureType = creatureTypeLabel(actor);
  const movementSlots = Math.max(1, Math.floor(num(system?.npcMovementSlots, 1)));
  const description = String(system?.bio?.description ?? '').trim();
  const faction = String(system?.bio?.faction ?? '').trim();

  const pages = collectPhaseSources(system).map((src) => {
    const health = buildHealthRows(asHealthBars(src.health?.bars));
    const attackRows = buildAttackRows(src.attacks);
    const statuses = formatStatuses(src.statusEffects);
    const pageIndex = (src.phaseNumber ?? 1);
    const pageTotal = Math.max(1, src.phaseCount || 1);
    return {
      name,
      masteryRank,
      specialRecovery: masteryRank,
      specialCap: specialApplicationLimit(masteryRank),
      castingTn,
      creatureType,
      faction,
      description,
      phaseName: src.phaseName,
      phaseNumber: src.phaseNumber,
      phaseCount: src.phaseCount,
      hasPhases: src.phaseCount > 0,
      pageIndex,
      pageTotal,
      evade: Math.floor(num(src.combat?.evade, 0)),
      armor: Math.floor(num(src.combat?.armor, 0)),
      speed: Math.floor(num(src.combat?.speed, 6)),
      attackSlots: src.attackSlots,
      movementSlots,
      health: {
        ...health,
        hasMultipleBars: health.bars.length > 1,
      },
      attacks: attackRows,
      hasAttacks: attackRows.length > 0,
      statuses,
      hasStatuses: statuses.length > 0,
      pageLabel: src.phaseName ? `${name} — ${src.phaseName}` : name,
    };
  });

  return {
    name,
    masteryRank,
    creatureType,
    pageCount: pages.length,
    pages,
  };
}

/**
 * Compact combat strip — precalculated attack lines, no skills/attributes.
 * One strip per boss phase (or a single strip for phase-less NPCs).
 */
export function buildNpcCompactPrintContext(actor: any): Record<string, unknown> {
  const system = actor?.system ?? {};
  const name = String(actor?.name ?? system?.bio?.name ?? 'NPC').trim() || 'NPC';
  const masteryRank = Math.max(1, Math.floor(num(system?.mastery?.rank, 1)));
  const castingTn = 8 * masteryRank;
  const creatureType = creatureTypeLabel(actor);
  const movementSlots = Math.max(1, Math.floor(num(system?.npcMovementSlots, 1)));
  const faction = String(system?.bio?.faction ?? '').trim();

  const strips = collectPhaseSources(system).map((src) => {
    const health = buildHealthRows(asHealthBars(src.health?.bars));
    const iniNet = clampNpcInitiativeModifier(src.combat?.initiative);
    const iniSigned = formatNpcInitiativeSigned(iniNet);
    const initiative =
      iniNet === 0 ? `${masteryRank}d8` : `${masteryRank}d8 ${iniSigned}`;
    const attacks = src.attacks.map((atk, index) => ({
      line: formatNpcCompactAttackPlayLine(atk, { masteryRank, castingTn, index }),
      isSpell: !!atk.npcIsSpell,
      isSplit: !!atk.npcSplitAttack,
    }));
    const cores = [
      { label: 'Evade', value: String(Math.floor(num(src.combat?.evade, 0))) },
      { label: 'Armor', value: String(Math.floor(num(src.combat?.armor, 0))) },
      { label: 'Speed', value: `${Math.floor(num(src.combat?.speed, 6))} m` },
      { label: 'HP', value: health.summary },
      { label: 'Init', value: initiative },
      { label: 'ATK', value: String(src.attackSlots) },
      { label: 'Move', value: String(movementSlots) },
      { label: 'Spell TN', value: String(castingTn) },
    ];
    const dr = Math.floor(num(src.combat?.damageReduction, 0));
    if (dr > 0) cores.push({ label: 'DR', value: `${dr}%` });
    const spellRes = Math.floor(num(src.combat?.spellResistance, 0));
    if (spellRes > 0) cores.push({ label: 'Spell Res', value: String(spellRes) });

    return {
      name,
      masteryRank,
      creatureType,
      faction,
      phaseName: src.phaseName,
      phaseNumber: src.phaseNumber,
      phaseCount: src.phaseCount,
      hasPhases: src.phaseCount > 0,
      cores,
      attacks,
      hasAttacks: attacks.length > 0,
      title: src.phaseName ? `${name} — ${src.phaseName}` : name,
    };
  });

  return {
    name,
    masteryRank,
    creatureType,
    stripCount: strips.length,
    strips,
  };
}

/**
 * Render the printable NPC sheet and open it in a new window that triggers
 * the browser print dialog (save as PDF).
 */
export async function openNpcPrintSheet(
  actor: any,
  options: NpcPrintOptions = {},
): Promise<void> {
  if (!actor || actor.type !== 'npc') {
    (ui as any)?.notifications?.warn('Druck-Export ist nur für NPCs verfügbar.');
    return;
  }

  const compact = options.layout === 'compact';
  let body = '';
  try {
    const context = compact
      ? buildNpcCompactPrintContext(actor)
      : buildNpcPrintContext(actor);
    const template = compact ? PRINT_TEMPLATE_COMPACT : PRINT_TEMPLATE;
    body = await (foundry as any).applications.handlebars.renderTemplate(template, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Mastery System | Failed to build NPC print sheet', message, error);
    (ui as any)?.notifications?.error('NPC-Bogen konnte nicht erstellt werden.');
    return;
  }

  const win = window.open('', '_blank', compact ? 'width=720,height=640' : 'width=900,height=1200');
  if (!win) {
    (ui as any)?.notifications?.warn(
      'Druckfenster wurde blockiert. Bitte Pop-ups für Foundry erlauben.',
    );
    return;
  }

  const cssVersion = String((game as any)?.system?.version ?? Date.now());
  const cssHref = `${routed(PRINT_CSS)}?v=${encodeURIComponent(cssVersion)}`;
  const title = String(actor?.name ?? 'NPC');
  const bodyClass = compact ? 'mastery-npc-print is-compact' : 'mastery-npc-print';
  const doc = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link rel="stylesheet" href="${cssHref}" />
</head>
<body class="${bodyClass}">
${body}
<script>
  window.addEventListener('load', function () {
    setTimeout(function () {
      window.focus();
      window.print();
    }, 350);
  });
</script>
</body>
</html>`;

  win.document.open();
  win.document.write(doc);
  win.document.close();
}
