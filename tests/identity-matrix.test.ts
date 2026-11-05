/**
 * Identity-Matrix (plan §11.2 / K6 final).
 * Every catalog template × every defined rank 1–16 and every artifact progression
 * row with identity must resolve via resolvePowerIdentity and agree with the
 * catalog on templateId / category / subfamily / rank / mechanics / limited /
 * special flags / routing. Legacy-vs-ID disagreements are dual-run; only
 * exceptions.json (or the documented C1 family rule) may excuse a mismatch.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_POWER_TEMPLATES } from '../src/utils/powers/templates/index.js';
import { ECHO_ARTIFACTS } from '../src/utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts.js';
import {
  deriveActiveSegment,
  resolvePowerIdentity,
} from '../src/utils/power-identity.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import { isHealTemplateId } from '../src/combat/heal-resolution.js';
import { isCleanseTemplateId } from '../src/combat/cleanse-resolution.js';
import {
  isForbiddenLimitedTemplateId,
  isLimitedPowerTemplateId,
} from '../src/combat/limited-charge.js';
import {
  resolvePowerMechanics,
  resolvePowerMechanicsById,
} from '../src/utils/power-mechanics.js';
import {
  clearIdentityShadowLog,
  setIdentityShadowEnabled,
} from '../src/utils/identity-shadow.js';

const ALL_RANKS = Array.from({ length: 16 }, (_, i) => i + 1);
const REPORT_PATH = path.resolve(__dirname, '../docs/audits/identity-matrix-report-k6.md');
const EXCEPTIONS_PATH = path.resolve(__dirname, './__fixtures__/identity-exceptions.json');

interface SegmentMismatch {
  templateId: string;
  rank: number;
  identity: string;
  legacy: string;
  detail: string;
}

interface MatrixStats {
  templates: number;
  cells: number;
  definedCells: number;
  undefinedCells: number;
  resolved: number;
  failures: string[];
  mechanicsCells: number;
  mechanicsLegacyMismatch: string[];
  limitedTemplates: string[];
  specialSlotTemplates: number;
  specialsCells: number;
  byCategory: Record<string, number>;
}

function levelDefined(tpl: any, rank: number): boolean {
  const lvl = tpl.levels?.[String(rank)];
  return !!lvl && typeof lvl === 'object';
}

/** Stable JSON for mechanics equality. */
function stable(v: unknown): string {
  try {
    return JSON.stringify(v, Object.keys((v as object) || {}).sort());
  } catch {
    return String(v);
  }
}

describe('identity matrix (all ranks 1–16)', () => {
  it('every catalog template resolves at every defined rank with catalog-consistent fields', () => {
    setIdentityShadowEnabled(false);
    try {
      const stats: MatrixStats = {
        templates: ALL_POWER_TEMPLATES.length,
        cells: 0,
        definedCells: 0,
        undefinedCells: 0,
        resolved: 0,
        failures: [],
        mechanicsCells: 0,
        mechanicsLegacyMismatch: [],
        limitedTemplates: [],
        specialSlotTemplates: 0,
        specialsCells: 0,
        byCategory: {},
      };

      for (const tpl of ALL_POWER_TEMPLATES as any[]) {
        stats.byCategory[tpl.category] = (stats.byCategory[tpl.category] || 0) + 1;
        if (tpl.limited === true) stats.limitedTemplates.push(tpl.templateId);
        if (tpl.specialSlot) stats.specialSlotTemplates += 1;

        for (const rank of ALL_RANKS) {
          stats.cells += 1;
          if (!levelDefined(tpl, rank)) {
            stats.undefinedCells += 1;
            continue;
          }
          stats.definedCells += 1;

          const item = {
            name: tpl.templateName,
            system: {
              templateId: tpl.templateId,
              rank,
              category: tpl.category,
              limited: tpl.limited === true ? true : undefined,
            },
          };
          const id = resolvePowerIdentity({ kind: 'power-item', item });
          if (!id.ok) {
            stats.failures.push(`${tpl.templateId}@${rank}: ${id.reason} — ${id.diagnostic}`);
            continue;
          }
          stats.resolved += 1;

          // Template ID
          if (id.templateId !== tpl.templateId) {
            stats.failures.push(`${tpl.templateId}@${rank}: resolved templateId ${id.templateId}`);
          }
          // Category / subfamily
          if (id.category !== tpl.category) {
            stats.failures.push(`${tpl.templateId}@${rank}: category ${id.category} ≠ ${tpl.category}`);
          }
          if ((id.subfamily ?? null) !== (tpl.subfamily ?? null)) {
            stats.failures.push(
              `${tpl.templateId}@${rank}: subfamily ${id.subfamily} ≠ ${tpl.subfamily}`,
            );
          }
          // Rank
          if (id.rank !== rank) {
            stats.failures.push(`${tpl.templateId}@${rank}: rank ${id.rank}`);
          }
          // Limited flag
          if ((tpl.limited === true) !== id.limited) {
            stats.failures.push(
              `${tpl.templateId}@${rank}: limited identity=${id.limited} catalog=${tpl.limited === true}`,
            );
          }
          // Mechanics by id must equal catalog level mechanics; legacy resolvePowerMechanics must agree.
          const levelMech = tpl.levels[String(rank)]?.mechanics ?? null;
          const byId = resolvePowerMechanicsById(tpl.templateId, rank);
          if (levelMech && typeof levelMech === 'object') {
            stats.mechanicsCells += 1;
            if (stable(byId) !== stable(levelMech)) {
              stats.failures.push(`${tpl.templateId}@${rank}: mechanics-by-id ≠ catalog level`);
            }
            if (stable(id.mechanics) !== stable(levelMech)) {
              stats.failures.push(`${tpl.templateId}@${rank}: identity.mechanics ≠ catalog level`);
            }
            const legacyMech = resolvePowerMechanics(item);
            if (stable(legacyMech) !== stable(levelMech)) {
              stats.mechanicsLegacyMismatch.push(
                `${tpl.templateId}@${rank}: legacy=${stable(legacyMech)} id=${stable(levelMech)}`,
              );
            }
          }
          // Specials declared on the level row must be structured keys.
          const specials = tpl.levels[String(rank)]?.specials;
          if (Array.isArray(specials) && specials.length) {
            stats.specialsCells += 1;
            for (const s of specials) {
              if (!s || typeof s.key !== 'string' || !s.key.trim()) {
                stats.failures.push(`${tpl.templateId}@${rank}: special without key ${stable(s)}`);
              }
            }
          }
        }
      }

      // Limited consistency (catalog flag ↔ limited-charge gate).
      for (const tid of stats.limitedTemplates) {
        if (!isLimitedPowerTemplateId(tid)) {
          stats.failures.push(`${tid}: catalog limited but not in LIMITED_ID_SET`);
        }
        if (isForbiddenLimitedTemplateId(tid)) {
          stats.failures.push(`${tid}: catalog limited but forbidden by gate`);
        }
      }
      for (const tpl of ALL_POWER_TEMPLATES) {
        if (tpl.limited !== true && isLimitedPowerTemplateId(tpl.templateId)) {
          stats.failures.push(`${tpl.templateId}: LIMITED_ID_SET but catalog not limited`);
        }
      }

      (globalThis as any).__identityMatrixStats = stats;

      expect(stats.undefinedCells, 'all templates define 16 levels').toBe(0);
      expect(stats.failures.slice(0, 30)).toEqual([]);
      // Legacy resolvePowerMechanics with templateId must equal catalog mechanics (no rename drift).
      expect(stats.mechanicsLegacyMismatch.slice(0, 20)).toEqual([]);
    } finally {
      setIdentityShadowEnabled(true);
      clearIdentityShadowLog();
    }
  });

  it('every activatable artifact row with identity fields resolves', () => {
    const failures: string[] = [];
    let checked = 0;
    const defs = [...Object.values(ECHO_ARTIFACTS), ...Object.values(GENERAL_ARTIFACTS)];
    for (const def of defs as any[]) {
      const key = String(def.key || '');
      for (const row of def.levelProgression || []) {
        if (!row?.powerTemplateId && !row?.artifactFunctionId) continue;
        checked += 1;
        const id = resolvePowerIdentity({
          kind: 'artifact-row',
          artifact: { flags: { 'mastery-system': { echoArtifactKey: key } }, name: def.name },
          row,
        });
        if (!id.ok) {
          failures.push(`${key} L${row.level} (${row.name}): ${id.reason} — ${id.diagnostic}`);
          continue;
        }
        if (row.powerTemplateId && id.templateId !== row.powerTemplateId) {
          failures.push(`${key} L${row.level}: templateId ${id.templateId} ≠ ${row.powerTemplateId}`);
        }
        if (row.rank != null && id.rank !== Number(row.rank)) {
          failures.push(`${key} L${row.level}: rank ${id.rank} ≠ ${row.rank}`);
        }
        if (row.limited === true && !id.limited) {
          failures.push(`${key} L${row.level}: limited lost`);
        }
      }
    }
    (globalThis as any).__identityMatrixArtifactRows = { checked, failures };
    expect(failures.slice(0, 20)).toEqual([]);
  });

  it('dual-run (all ranks): deriveActiveSegment vs getSegmentIdForOption', () => {
    setIdentityShadowEnabled(false);
    const exceptions = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, 'utf8')) as {
      segmentMismatches: Array<{
        templateId: string;
        identity: string;
        legacy: string;
        ruleCite: string;
      }>;
    };
    const allowed = new Map(
      exceptions.segmentMismatches.map((e) => [`${e.templateId}|${e.identity}|${e.legacy}`, e.ruleCite]),
    );
    /** C1 family rule: identity utility (roll.kind none / support-*) vs legacy attack. */
    const isDocumentedSupportUtilityMismatch = (m: SegmentMismatch) =>
      m.identity === 'utility' &&
      m.legacy === 'attack' &&
      /support-|subfamily=mental|subfamily=barrier|subfamily=illusion|roll=none/.test(m.detail);

    const mismatches: SegmentMismatch[] = [];
    let dualRunCells = 0;
    const activeTemplates = ALL_POWER_TEMPLATES.filter((t) => t.category === 'active');
    const nonActiveMismatch: string[] = [];

    try {
      for (const tpl of ALL_POWER_TEMPLATES as any[]) {
        for (const rank of ALL_RANKS) {
          if (!levelDefined(tpl, rank)) continue;
          const id = resolvePowerIdentity({
            kind: 'power-item',
            item: {
              name: tpl.templateName,
              system: {
                templateId: tpl.templateId,
                rank,
                category: tpl.category,
                cost: { action: tpl.category === 'movement' ? 'movement' : 'attack' },
              },
            },
          });
          if (!id.ok) continue;
          dualRunCells += 1;

          const neutralName = `ZZZ_MATRIX_${tpl.templateId}`;
          const option: any = {
            id: `matrix-${tpl.templateId}-${rank}`,
            name: neutralName,
            description: 'matrix probe — no stance/buff wording',
            source: 'power',
            slot:
              tpl.category === 'movement'
                ? 'movement'
                : tpl.category === 'activeBuff'
                  ? 'active-buff'
                  : 'attack',
            powerType:
              tpl.category === 'activeBuff'
                ? 'buff'
                : tpl.category === 'movement'
                  ? 'movement'
                  : tpl.category === 'reaction'
                    ? 'reaction'
                    : tpl.category === 'passive'
                      ? 'passive'
                      : 'active',
            tags: [],
            item: {
              type: 'power',
              name: neutralName,
              system: {
                templateId: tpl.templateId,
                rank,
                category: tpl.category,
                powerType:
                  tpl.category === 'activeBuff'
                    ? 'buff'
                    : tpl.category === 'movement'
                      ? 'movement'
                      : tpl.category === 'reaction'
                        ? 'reaction'
                        : tpl.category === 'passive'
                          ? 'passive'
                          : 'active',
                cost: { action: tpl.category === 'movement' ? 'movement' : 'attack' },
              },
            },
          };
          const legacySeg = getSegmentIdForOption(option);

          if (tpl.category === 'active') {
            const identitySeg = deriveActiveSegment(id);
            if (identitySeg !== legacySeg) {
              mismatches.push({
                templateId: tpl.templateId,
                rank,
                identity: identitySeg,
                legacy: legacySeg,
                detail: `subfamily=${tpl.subfamily} roll=${tpl.roll?.kind}`,
              });
            }
          } else if (tpl.category === 'activeBuff') {
            if (legacySeg !== 'active-buff') {
              nonActiveMismatch.push(`${tpl.templateId}@${rank}: activeBuff → legacy ${legacySeg}`);
            }
          } else if (tpl.category === 'movement') {
            if (legacySeg !== 'movement') {
              nonActiveMismatch.push(`${tpl.templateId}@${rank}: movement → legacy ${legacySeg}`);
            }
          }
          // reaction / passive: legacy routing is not a radial segment decision; informational only.
        }
      }
    } finally {
      setIdentityShadowEnabled(true);
      clearIdentityShadowLog();
    }

    const unexplained = mismatches.filter(
      (m) =>
        !allowed.has(`${m.templateId}|${m.identity}|${m.legacy}`) &&
        !isDocumentedSupportUtilityMismatch(m),
    );
    const rankConsistent = new Map<string, Set<string>>();
    for (const m of mismatches) {
      const k = m.templateId;
      if (!rankConsistent.has(k)) rankConsistent.set(k, new Set());
      rankConsistent.get(k)!.add(`${m.identity}|${m.legacy}`);
    }
    const rankInconsistent = [...rankConsistent.entries()]
      .filter(([, set]) => set.size > 1)
      .map(([k]) => k);

    const stats = (globalThis as any).__identityMatrixStats as MatrixStats | undefined;
    const artRows = (globalThis as any).__identityMatrixArtifactRows as
      | { checked: number; failures: string[] }
      | undefined;
    const byTemplate = new Map<string, SegmentMismatch>();
    for (const m of mismatches) if (!byTemplate.has(m.templateId)) byTemplate.set(m.templateId, m);

    const md = [
      '# Identity-Matrix Report (K6 final — all ranks 1–16)',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Coverage',
      '',
      `- Templates: ${stats?.templates ?? ALL_POWER_TEMPLATES.length} (${Object.entries(stats?.byCategory || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')})`,
      `- Cells (template × rank 1–16): ${stats?.cells ?? '?'} · defined: ${stats?.definedCells ?? '?'} · undefined: ${stats?.undefinedCells ?? '?'}`,
      `- Resolved by id: ${stats?.resolved ?? '?'} · failures: ${stats?.failures.length ?? '?'}`,
      `- Mechanics cells compared (by-id = catalog = legacy with templateId): ${stats?.mechanicsCells ?? '?'} · legacy mismatches: ${stats?.mechanicsLegacyMismatch.length ?? '?'}`,
      `- Specials cells with structured keys: ${stats?.specialsCells ?? '?'} · templates with specialSlot: ${stats?.specialSlotTemplates ?? '?'}`,
      `- Limited templates (catalog flag ↔ LIMITED_ID_SET consistent): ${stats?.limitedTemplates.length ?? '?'} (${(stats?.limitedTemplates || []).join(', ')})`,
      `- Artifact rows with identity checked: ${artRows?.checked ?? '?'} · failures: ${artRows?.failures.length ?? '?'}`,
      '',
      '## Routing dual-run',
      '',
      `- Dual-run cells (all categories × defined ranks): ${dualRunCells}`,
      `- Active templates: ${activeTemplates.length}`,
      `- Segment mismatches (active, legacy≠identity): ${mismatches.length} cells across ${byTemplate.size} templates`,
      `- Rank-inconsistent templates (mismatch differs by rank): ${rankInconsistent.length}`,
      `- Documented exceptions (explicit): ${allowed.size} · unexplained: ${unexplained.length}`,
      `- activeBuff/movement legacy routing mismatches: ${nonActiveMismatch.length}`,
      '',
      '## Segment mismatches by template (same for every rank unless listed under rank-inconsistent)',
      '',
      ...[...byTemplate.values()].map((m) => {
        const key = `${m.templateId}|${m.identity}|${m.legacy}`;
        const cite =
          allowed.get(key) ||
          (isDocumentedSupportUtilityMismatch(m)
            ? 'C1 family rule — support/mental/barrier/illusion roll.kind none → utility vs legacy attack (C2.a)'
            : '**UNDOCUMENTED**');
        return `- \`${m.templateId}\`: identity=${m.identity} legacy=${m.legacy} (${m.detail}) — ${cite}`;
      }),
      '',
      ...(rankInconsistent.length
        ? ['## Rank-inconsistent', '', ...rankInconsistent.map((k) => `- \`${k}\``), '']
        : []),
      ...(nonActiveMismatch.length
        ? ['## activeBuff / movement routing', '', ...nonActiveMismatch.slice(0, 50).map((s) => `- ${s}`), '']
        : []),
      '## Notes',
      '',
      '- Identity path is shadow-only in C1; legacy decides. Mismatches above are the C2.a work list, not bugs fixed here.',
      '- `isSanctionedDR` / Phasing and heal/cleanse/limited classifiers are covered by `tests/power-identity-contract.test.ts` and the K5 shadow sites; this matrix asserts catalog↔id consistency of mechanics, limited flags and special keys.',
      '',
    ].join('\n');
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, md, 'utf8');

    expect(unexplained, unexplained.map((m) => `${m.templateId}@${m.rank}`).join(', ')).toEqual([]);
    expect(rankInconsistent, 'segment decision must not vary by rank').toEqual([]);
    expect(nonActiveMismatch.slice(0, 20)).toEqual([]);
  });

  it('classifier ID helpers: heal/cleanse/limited for active support templates', () => {
    for (const tpl of ALL_POWER_TEMPLATES) {
      const tid = tpl.templateId;
      if (
        tpl.category === 'active' &&
        /support-heal|health-level-heal|aoe-restoration|single-heal/i.test(String(tpl.subfamily) + tid)
      ) {
        expect(isHealTemplateId(tid), tid).toBe(true);
      }
      if (
        tpl.category === 'active' &&
        (/support-cleanse/i.test(String(tpl.subfamily)) || /single-cleanse|aoe-cleanse/i.test(tid))
      ) {
        if (!/heal-cleanse/i.test(tid)) {
          expect(isCleanseTemplateId(tid), tid).toBe(true);
        }
      }
      if (tpl.limited === true) {
        expect(isLimitedPowerTemplateId(tid), tid).toBe(true);
      }
    }
  });
});
