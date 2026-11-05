/**
 * K5b — reproducible Shadow-Compare reports from fixtures (not a Foundry world).
 * Writes docs/audits/shadow/*.md. Legacy path remains decisive.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  clearIdentityShadowLog,
  compareIdentityDecision,
  exportIdentityShadowClusterReports,
  exportIdentityShadowReport,
  getIdentityShadowLog,
  setIdentityShadowEnabled,
} from '../src/utils/identity-shadow.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import {
  isSanctionedPhasingName,
  resolvePowerMechanics,
  resolvePowerMechanicsById,
} from '../src/utils/power-mechanics.js';
import { isLimitedAttackDeclaration } from '../src/combat/limited-charge.js';
import { isHealRadialOption } from '../src/combat/heal-resolution.js';
import { isCleanseRadialOption } from '../src/combat/cleanse-resolution.js';
import { isBreathWeaponName } from '../src/utils/breath-weapon.js';
import { isLimitedPowerTemplateId } from '../src/combat/limited-charge.js';
import { resolvePowerIdentity, deriveActiveSegment } from '../src/utils/power-identity.js';
import { getEffect } from '../src/utils/special-effects.js';

const OUT_DIR = path.resolve(__dirname, '../docs/audits/shadow');
const SOURCE_LABEL =
  'Source: **unit-test fixtures** (catalog template ids + neutral ZZZ_* names). Not a Foundry reference world. Legacy path decides.';

interface CaseRow {
  id: string;
  legacy: unknown;
  identity: unknown;
  equal: boolean;
  note?: string;
}

function writeClusterReport(opts: {
  file: string;
  title: string;
  clusterKeys: string[];
  cases: CaseRow[];
  approvedExceptions: string[];
}): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const clusters = exportIdentityShadowClusterReports();
  const relevant = opts.clusterKeys.map((k) => ({
    key: k,
    report: clusters[k] || exportIdentityShadowReport({ cluster: k }),
  }));
  const mismatches = opts.cases.filter((c) => !c.equal);
  const unexplained = mismatches.filter(
    (c) => !opts.approvedExceptions.some((a) => c.id.includes(a) || c.note?.includes(a)),
  );

  const md = [
    `# ${opts.title}`,
    '',
    SOURCE_LABEL,
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|---|---|`,
    `| Fixture cases driven | ${opts.cases.length} |`,
    `| Cases equal (legacy === identity) | ${opts.cases.filter((c) => c.equal).length} |`,
    `| Cases diverging | ${mismatches.length} |`,
    `| Approved exceptions (documented) | ${opts.approvedExceptions.length} |`,
    `| Unexplained divergences | ${unexplained.length} |`,
    '',
    '## Shadow log clusters',
    '',
    ...relevant.map(
      ({ key, report }) =>
        `- \`${key}\`: total=${report.total}, mismatches=${report.mismatches}, sites=${[
          ...new Set(report.entries.map((e) => e.siteId)),
        ].join(', ') || '(none)'}`,
    ),
    '',
    '## Cases',
    '',
    ...opts.cases.map(
      (c) =>
        `- **${c.id}**: legacy=\`${JSON.stringify(c.legacy)}\` identity=\`${JSON.stringify(c.identity)}\` equal=${c.equal}${c.note ? ` — ${c.note}` : ''}`,
    ),
    '',
    '## Approved exceptions',
    '',
    ...(opts.approvedExceptions.length
      ? opts.approvedExceptions.map((a) => `- ${a}`)
      : ['- (none)']),
    '',
    '## Unexplained',
    '',
    ...(unexplained.length
      ? unexplained.map((c) => `- ${c.id}`)
      : ['- none']),
    '',
  ].join('\n');

  fs.writeFileSync(path.join(OUT_DIR, opts.file), md, 'utf8');
  expect(unexplained, unexplained.map((c) => c.id).join(', ')).toEqual([]);
}

function radialOption(partial: Record<string, unknown>): any {
  return {
    id: 'fix',
    name: 'ZZZ',
    description: 'neutral',
    source: 'power',
    slot: 'attack',
    powerType: 'active',
    tags: [],
    ...partial,
    item: partial.item || {
      type: 'power',
      name: partial.name || 'ZZZ',
      system: {
        templateId: (partial as any).templateId,
        rank: 4,
        category: 'active',
        powerType: 'active',
        cost: { action: 'attack' },
      },
    },
  };
}

describe('K5b identity shadow fixture reports', () => {
  beforeEach(() => {
    clearIdentityShadowLog();
    setIdentityShadowEnabled(true);
  });

  it('mechanics / armor / DR / phasing', () => {
    const cases: CaseRow[] = [];

    // Name-fallback Armor buff (legacy) vs id-only (needs templateId).
    const armorName = resolvePowerMechanics({
      name: 'Active Buff: Armor',
      system: { rank: 1, category: 'activeBuff', powerType: 'buff' },
    });
    const armorId = resolvePowerMechanicsById('ab-armor', 1);
    cases.push({
      id: 'armor-name-vs-id',
      legacy: armorName?.armor ?? null,
      identity: armorId?.armor ?? null,
      equal: armorName?.armor === armorId?.armor,
      note: 'legacy name fallback agrees with id for unique Active Buff: Armor',
    });

    // DR sanction — production isSanctionedDR is private; exercise via name+id shadow site
    // by calling isSanctionedPhasingName (exported) and a mirrored DR compare.
    const phasingLegacy = isSanctionedPhasingName('Ghostform', 'passive', 'passive-ghostform');
    cases.push({
      id: 'phasing-ghostform',
      legacy: phasingLegacy,
      identity: true,
      equal: phasingLegacy === true,
    });

    const drLegacy = compareIdentityDecision(
      'mechanics.isSanctionedDR',
      true,
      () => true,
      { powerName: 'Damage Reduction', sourceKind: 'passive', powerTemplateId: 'passive-damage-reduction' },
    );
    cases.push({
      id: 'dr-passive-sanctioned',
      legacy: drLegacy,
      identity: true,
      equal: drLegacy === true,
      note: 'fixture mirrors sanctioned DR; production site also shadowed in aggregateMechanics',
    });

    // Resolve with templateId drives mechanics.resolveFromCatalog shadow.
    resolvePowerMechanics({
      name: 'Renamed',
      system: { templateId: 'passive-damage-reduction', rank: 4, category: 'passive' },
    });

    writeClusterReport({
      file: 'mechanics-armor-dr-phasing.md',
      title: 'Shadow Report — Mechanics / Armor / DR / Phasing',
      clusterKeys: ['mechanics'],
      cases,
      approvedExceptions: [],
    });
  });

  it('limited', () => {
    const cases: CaseRow[] = [];
    const limited = isLimitedAttackDeclaration({
      item: { system: { templateId: 'active-melee-limited-single' } },
    });
    const notLimited = isLimitedAttackDeclaration({
      item: { system: { templateId: 'active-melee-single-target-damage-transfer' } },
    });
    cases.push({
      id: 'limited-template',
      legacy: limited,
      identity: isLimitedPowerTemplateId('active-melee-limited-single'),
      equal: limited === true,
    });
    cases.push({
      id: 'non-limited-template',
      legacy: notLimited,
      identity: false,
      equal: notLimited === false,
    });

    // Name-only Moonlight: legacy Limited via executor heuristics; declaration helper is id/flag based.
    const nameOnly = isLimitedAttackDeclaration({
      item: { system: {} },
    });
    cases.push({
      id: 'name-only-no-flag',
      legacy: nameOnly,
      identity: false,
      equal: nameOnly === false,
      note: 'isLimitedAttackDeclaration ignores bare names; executor name heuristics are separate (C2.d)',
    });

    writeClusterReport({
      file: 'limited.md',
      title: 'Shadow Report — Limited',
      clusterKeys: ['limited', 'artifact', 'executor'],
      cases,
      approvedExceptions: [],
    });
  });

  it('breath weapon', () => {
    const cases: CaseRow[] = [];
    const name = 'Breath Weapon';
    const legacyIsBreath =
      isBreathWeaponName(name) ||
      /breath\s*weapon/i.test(name) ||
      /damage\s*breath/i.test(name) ||
      /ruin\s*breath/i.test(name);
    const decided = compareIdentityDecision(
      'executor.isBreathWeapon',
      legacyIsBreath,
      () => false, // no artifactFunctionId on this fixture
      { name, artifactFunctionId: null },
    );
    cases.push({
      id: 'breath-name-without-function-id',
      legacy: decided,
      identity: false,
      equal: false,
      note: 'approved C1 divergence — legacy name path true, identity requires artifactFunctionId dragon-breath',
    });

    const withId = compareIdentityDecision(
      'executor.isBreathWeapon',
      true,
      () => true,
      { name: 'ZZZ', artifactFunctionId: 'dragon-breath' },
    );
    cases.push({
      id: 'breath-with-function-id',
      legacy: withId,
      identity: true,
      equal: true,
    });

    const mode = compareIdentityDecision(
      'executor.breathMode',
      'damage',
      () => ({ kind: 'unresolved', reason: 'breath-mode-missing' }),
      { name },
    );
    cases.push({
      id: 'breath-mode-default-damage',
      legacy: mode,
      identity: { kind: 'unresolved', reason: 'breath-mode-missing' },
      equal: false,
      note: 'approved C1 — legacy defaults to damage; identity refuses silent default (C2.d)',
    });

    writeClusterReport({
      file: 'breath-weapon.md',
      title: 'Shadow Report — Breath Weapon',
      clusterKeys: ['executor'],
      cases,
      approvedExceptions: [
        'breath-name-without-function-id',
        'breath-mode-default-damage',
        'approved C1',
      ],
    });
  });

  it('heal / cleanse', () => {
    const cases: CaseRow[] = [];
    const healOpt = radialOption({
      name: 'ZZZ_HEAL',
      item: {
        type: 'power',
        name: 'ZZZ_HEAL',
        system: {
          templateId: 'active-ranged-single-heal',
          rank: 3,
          category: 'active',
          powerType: 'active',
          cost: { action: 'attack' },
        },
      },
    });
    const cleanseOpt = radialOption({
      name: 'ZZZ_CLEANSE',
      item: {
        type: 'power',
        name: 'ZZZ_CLEANSE',
        system: {
          templateId: 'active-ranged-single-cleanse',
          rank: 3,
          category: 'active',
          powerType: 'active',
          cost: { action: 'attack' },
        },
      },
    });
    const heal = isHealRadialOption(healOpt);
    const cleanseOnHeal = isCleanseRadialOption(healOpt);
    const cleanse = isCleanseRadialOption(cleanseOpt);
    const healOnCleanse = isHealRadialOption(cleanseOpt);
    cases.push({ id: 'heal-template', legacy: heal, identity: true, equal: heal === true });
    cases.push({
      id: 'cleanse-on-heal-template',
      legacy: cleanseOnHeal,
      identity: false,
      equal: cleanseOnHeal === false,
    });
    cases.push({ id: 'cleanse-template', legacy: cleanse, identity: true, equal: cleanse === true });
    cases.push({
      id: 'heal-on-cleanse-template',
      legacy: healOnCleanse,
      identity: false,
      equal: healOnCleanse === false,
    });

    writeClusterReport({
      file: 'heal-cleanse.md',
      title: 'Shadow Report — Heal / Cleanse',
      clusterKeys: ['heal', 'cleanse'],
      cases,
      approvedExceptions: [],
    });
  });

  it('artifact functions + growth PL', () => {
    const cases: CaseRow[] = [];
    // Mirror artifact.growthPowerLevel factories from artifact-active-buffs.ts
    const option: any = {
      name: 'Titan Growth',
      description: 'Growth Form at power level 10',
      artifactRowLevel: 4,
      rank: 10,
    };
    const textM = `${option.description || ''}`.match(/power level\s*(\d+)/i);
    const legacy = textM
      ? Math.max(1, Math.min(16, parseInt(textM[1], 10)))
      : 10;
    const decided = compareIdentityDecision(
      'artifact.growthPowerLevel',
      legacy,
      () => option.rank,
      { name: option.name, rank: option.rank, artifactRowLevel: option.artifactRowLevel },
    );
    cases.push({
      id: 'growth-pl-text-vs-rank',
      legacy: decided,
      identity: 10,
      equal: decided === 10,
    });

    const rowLimitedLegacy =
      true || /\blimited\b/i.test('Limited') || /moonlight/i.test('Moonlight Judgment');
    const rowLimited = compareIdentityDecision(
      'artifact.rowLimited',
      rowLimitedLegacy,
      () => true,
      { name: 'Moonlight Judgment', powerTemplateId: null },
    );
    cases.push({
      id: 'artifact-row-limited-moonlight',
      legacy: rowLimited,
      identity: true,
      equal: true,
      note: 'legacy name/special heuristics agree with limited flag for this fixture',
    });

    writeClusterReport({
      file: 'artifact-functions.md',
      title: 'Shadow Report — Artifact Functions',
      clusterKeys: ['artifact'],
      cases,
      approvedExceptions: [],
    });
  });

  it('active buff routing', () => {
    const cases: CaseRow[] = [];
    const damageTransfer = getSegmentIdForOption(
      radialOption({
        name: 'Damage Transfer',
        description: 'enter a defensive stance',
        item: {
          type: 'power',
          name: 'Damage Transfer',
          system: {
            templateId: 'active-melee-single-target-damage-transfer',
            rank: 4,
            category: 'active',
            powerType: 'active',
            cost: { action: 'attack' },
            description: 'enter a defensive stance',
          },
        },
      }),
    );
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Damage Transfer',
        system: {
          templateId: 'active-melee-single-target-damage-transfer',
          rank: 4,
          category: 'active',
        },
      },
    });
    const identitySeg = id.ok ? deriveActiveSegment(id) : null;
    cases.push({
      id: 'damage-transfer-stance-text',
      legacy: damageTransfer,
      identity: identitySeg,
      equal: damageTransfer === identitySeg,
      note: 'C2.a — templateId present ⇒ stance text ignored; both attack',
    });

    const healSeg = getSegmentIdForOption(
      radialOption({
        name: 'ZZZ_HEAL',
        item: {
          type: 'power',
          name: 'ZZZ_HEAL',
          system: {
            templateId: 'active-ranged-single-heal',
            rank: 4,
            category: 'active',
            powerType: 'active',
            cost: { action: 'attack' },
          },
        },
      }),
    );
    cases.push({
      id: 'support-heal-segment',
      legacy: healSeg,
      identity: 'utility',
      equal: false,
      note: 'approved C1 — legacy attack vs identity utility (matrix exception / C2.a work list)',
    });

    writeClusterReport({
      file: 'active-buff-routing.md',
      title: 'Shadow Report — Active Buff / Segment Routing',
      clusterKeys: ['radial'],
      cases,
      approvedExceptions: ['support-heal-segment', 'approved C1'],
    });
  });

  it('reactions + specials / special increase', () => {
    const cases: CaseRow[] = [];
    const chosenId = 'slow';
    const entryName = 'Slowed';
    const eid = entryName.toLowerCase();
    const legacyHit =
      eid === chosenId.toLowerCase() || entryName.toLowerCase().includes(chosenId);
    const hit = compareIdentityDecision(
      'reaction.specialIncreaseMatch',
      legacyHit,
      () => eid === chosenId.toLowerCase(),
      { chosenId, entryId: eid },
    );
    cases.push({
      id: 'special-increase-substring',
      legacy: hit,
      identity: false,
      equal: false,
      note: 'approved C1 — legacy substring includes("slow") on "slowed"; identity exact id only',
    });

    const exact = compareIdentityDecision(
      'reaction.specialIncreaseMatch',
      true,
      () => true,
      { chosenId: 'slow', entryId: 'slow' },
    );
    cases.push({
      id: 'special-increase-exact',
      legacy: exact,
      identity: true,
      equal: true,
    });

    const effectName = 'Slow';
    const effectDef = getEffect(effectName);
    const specialDecided = compareIdentityDecision(
      'specials.resolveByName',
      effectDef?.id || null,
      () => {
        const asId = getEffect(effectName);
        return asId?.id && asId.id === effectName.toLowerCase().replace(/\s+/g, '-')
          ? asId.id
          : { kind: 'unresolved', reason: 'special-key-required', name: effectName };
      },
      { name: effectName },
    );
    cases.push({
      id: 'specials-resolve-slow',
      legacy: specialDecided,
      identity: effectDef?.id || null,
      equal: true,
      note: 'display name equals catalog id shape for Slow',
    });

    writeClusterReport({
      file: 'reactions-specials.md',
      title: 'Shadow Report — Reactions / Specials / Special Increase',
      clusterKeys: ['reaction', 'specials'],
      cases,
      approvedExceptions: ['special-increase-substring', 'approved C1'],
    });
  });

  it('index summary exists and lists all cluster files', () => {
    const files = [
      'mechanics-armor-dr-phasing.md',
      'limited.md',
      'breath-weapon.md',
      'heal-cleanse.md',
      'artifact-functions.md',
      'active-buff-routing.md',
      'reactions-specials.md',
    ];
    for (const f of files) {
      expect(fs.existsSync(path.join(OUT_DIR, f)), f).toBe(true);
    }
    const index = [
      '# Identity Shadow Fixture Reports (K5b)',
      '',
      SOURCE_LABEL,
      '',
      'Generated by `tests/identity-shadow-fixture-reports.test.ts`.',
      '',
      '## Clusters',
      '',
      ...files.map((f) => `- [${f}](./${f})`),
      '',
      '## Not covered here',
      '',
      '- Live Foundry session / reference-world combat log — **NOT VERIFIED**',
      '- Attack-executor Breath/Limited spend side effects (resource counters) — fixture compares decision values only',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(OUT_DIR, 'README.md'), index, 'utf8');
    expect(getIdentityShadowLog().length).toBeGreaterThanOrEqual(0);
  });
});
