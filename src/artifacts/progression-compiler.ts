/**
 * Picks -> Level Progression compiler.
 *
 * The three Level 1/2/3 progression picks are the single source of truth for an
 * artifact's 1-10 Level Progression table. Each pick (a catalog Power or a Stone
 * Function) is expanded into three staged rows:
 *
 *   Pick L1 -> artifact levels 1 / 4 / 7   (stage I / II / III, PL 4 / 10 / 16)
 *   Pick L2 -> artifact levels 2 / 5 / 8
 *   Pick L3 -> artifact levels 3 / 6 / 9
 *
 * Power picks pull the real per-stage text (range / aoe / duration / effect /
 * special) from the catalog template's PL 4 / 10 / 16 rows, so the change at each
 * stage (radius, damage, special) is visible. There is no Level 10 row.
 */

import type {
  ArtifactProgressionPick,
  ArtifactLevelProgressionRow,
  ArtifactStoneFunction,
  PowerLevelKey,
  PowerLevelRow,
} from '../types/item.js';
import { getTemplate } from '../utils/powers/index.js';
import { renderRange, renderAoe, renderDuration, renderSpecials } from '../utils/power-rendering.js';
import { STONE_POWERS } from '../stones/stone-powers.js';

/** Roman numeral per stage index (0-based). */
const STAGE_NUMERALS = ['I', 'II', 'III'] as const;

/** Power Level consulted for each stage (Basic / Improved / Greater). */
const STAGE_POWER_LEVELS: PowerLevelKey[] = ['4', '10', '16'];

const ATTRIBUTE_LABELS: Record<string, string> = {
  might: 'Might',
  agility: 'Agility',
  vitality: 'Vitality',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence',
  wits: 'Wits',
};

const STONE_KIND_LABELS: Record<string, string> = {
  stonePowerSupport: 'Stone Power Support',
  stonePool: 'Stone Pool',
  stoneRefresh: 'Stone Refresh',
  stoneBattery: 'Stone Battery',
};

/** `renderRange`/`renderAoe`/`renderDuration` return a placeholder for empty data; treat it as blank. */
function clean(s: string | undefined): string {
  if (!s) return '';
  const t = s.trim();
  if (t === '—' || t === 'N/A') return '';
  return t;
}

/** Human-readable effect text for a Stone Function support row. */
function stoneFunctionEffect(sf: ArtifactStoneFunction): string {
  const kindLabel = STONE_KIND_LABELS[sf.kind] || sf.kind;
  const attr = sf.attribute ? ATTRIBUTE_LABELS[sf.attribute] || sf.attribute : '';
  if (sf.kind === 'stonePowerSupport') {
    const sp = sf.stonePowerId ? (STONE_POWERS as Record<string, { name?: string }>)[sf.stonePowerId] : undefined;
    const spName = sp?.name || sf.stonePowerId || '';
    return `${kindLabel}${attr ? ` (${attr})` : ''}${spName ? `: supports ${spName}` : ''}`;
  }
  return `${kindLabel}${attr ? ` (${attr})` : ''}`;
}

/**
 * Expand the up-to-three progression picks into a Level Progression table.
 * Returns rows for levels 1-9 (no Level 10 Ultimate), sorted by level.
 */
export function deriveLevelProgressionFromPicks(
  picks: ArtifactProgressionPick[] | null | undefined,
): ArtifactLevelProgressionRow[] {
  const rows: ArtifactLevelProgressionRow[] = [];
  const byLevel = new Map<number, ArtifactProgressionPick>();
  for (const p of picks || []) {
    const lvl = Number(p?.level);
    if (lvl >= 1 && lvl <= 3) byLevel.set(lvl, p);
  }

  for (const baseLevel of [1, 2, 3]) {
    const pick = byLevel.get(baseLevel);
    if (!pick || pick.kind === 'none') continue;

    if (pick.kind === 'power') {
      const tpl = pick.powerTemplateId ? getTemplate(pick.powerTemplateId) : undefined;
      if (!tpl) continue;
      for (let s = 0; s < STAGE_NUMERALS.length; s++) {
        const level = baseLevel + 3 * s;
        const pl = STAGE_POWER_LEVELS[s];
        const lr = (tpl.levels as Record<string, PowerLevelRow>)[pl];
        if (!lr) continue;
        rows.push({
          level,
          name: `${tpl.templateName} ${STAGE_NUMERALS[s]}`,
          type: lr.type || tpl.category || 'Active',
          range: clean(renderRange(lr.range ?? null)),
          aoe: clean(renderAoe(lr.aoe ?? null)),
          duration: clean(renderDuration(lr.duration)),
          effect: lr.effect?.text || '',
          special: clean(renderSpecials(lr.specials || [])),
        });
      }
    } else if (pick.kind === 'stoneFunction' && pick.stoneFunction) {
      const effect = stoneFunctionEffect(pick.stoneFunction);
      for (let s = 0; s < STAGE_NUMERALS.length; s++) {
        const level = baseLevel + 3 * s;
        rows.push({
          level,
          name: `Stone Support ${STAGE_NUMERALS[s]}`,
          type: 'Support',
          range: 'Self',
          aoe: '',
          duration: 'Passive',
          effect,
          special: '',
        });
      }
    }
  }

  rows.sort((a, b) => a.level - b.level);
  return rows;
}
