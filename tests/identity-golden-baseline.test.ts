/**
 * K8 preparation — Golden Snapshots of the currently approved LEGACY behaviour.
 * Snapshots are written under docs/audits/golden/ and compared on subsequent runs.
 * Do not update a snapshot merely to make a failing test pass — investigate first.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_POWER_TEMPLATES } from '../src/utils/powers/templates/index.js';
import { resolvePowerMechanics, resolvePowerMechanicsById } from '../src/utils/power-mechanics.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import { isLimitedAttackDeclaration, isLimitedPowerTemplateId } from '../src/combat/limited-charge.js';
import { isHealRadialOption } from '../src/combat/heal-resolution.js';
import { isCleanseRadialOption } from '../src/combat/cleanse-resolution.js';
import { isBreathWeaponName } from '../src/utils/breath-weapon.js';
import { deriveActiveSegment, resolvePowerIdentity } from '../src/utils/power-identity.js';
import { ECHO_ARTIFACTS } from '../src/utils/echo-artifacts.js';
import {
  clearIdentityShadowLog,
  setIdentityShadowEnabled,
} from '../src/utils/identity-shadow.js';
import { getEffect } from '../src/utils/special-effects.js';

const GOLDEN_DIR = path.resolve(__dirname, '../docs/audits/golden');
const UPDATE = process.env.UPDATE_GOLDEN === '1';

function readOrWrite(name: string, actual: unknown): void {
  fs.mkdirSync(GOLDEN_DIR, { recursive: true });
  const file = path.join(GOLDEN_DIR, name);
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;
  if (UPDATE || !fs.existsSync(file)) {
    fs.writeFileSync(file, serialized, 'utf8');
  }
  const expected = fs.readFileSync(file, 'utf8');
  expect(serialized, `golden drift in ${name} — investigate; set UPDATE_GOLDEN=1 only after review`).toBe(
    expected,
  );
}

function sampleRanks(tpl: { levels?: Record<string, unknown> }): number[] {
  const out: number[] = [];
  for (const r of [1, 4, 10, 16]) {
    if (tpl.levels?.[String(r)]) out.push(r);
  }
  return out.length ? out : [1];
}

describe('K8 golden baseline (legacy behaviour)', () => {
  it('mechanics-breakdown.json — catalog mechanics at sample ranks', () => {
    const rows: Array<Record<string, unknown>> = [];
    for (const tpl of ALL_POWER_TEMPLATES) {
      for (const rank of sampleRanks(tpl as any)) {
        const byId = resolvePowerMechanicsById(tpl.templateId, rank);
        const legacy = resolvePowerMechanics({
          name: tpl.templateName,
          system: {
            templateId: tpl.templateId,
            rank,
            category: tpl.category,
          },
        });
        rows.push({
          templateId: tpl.templateId,
          rank,
          category: tpl.category,
          mechanics: byId,
          legacyAgrees: JSON.stringify(byId) === JSON.stringify(legacy),
        });
      }
    }
    readOrWrite('mechanics-breakdown.json', {
      description:
        'Legacy-approved mechanics by templateId×rank (sampled 1/4/10/16). Source: catalog fixtures.',
      count: rows.length,
      rows,
    });
  });

  it('power-routing-radial.json — segment routing for representative powers', () => {
    setIdentityShadowEnabled(false);
    try {
      const samples = [
        {
          id: 'damage-transfer-stance',
          templateId: 'active-melee-single-target-damage-transfer',
          name: 'Damage Transfer',
          description: 'enter a defensive stance',
          category: 'active',
          powerType: 'active',
        },
        {
          id: 'ab-armor',
          templateId: 'ab-armor',
          name: 'Armor',
          description: 'grant armor',
          category: 'activeBuff',
          powerType: 'buff',
        },
        {
          id: 'heal-ranged',
          templateId: 'active-ranged-single-heal',
          name: 'ZZZ_HEAL',
          description: 'neutral',
          category: 'active',
          powerType: 'active',
        },
        {
          id: 'movement-teleport',
          templateId: 'movement-teleport',
          name: 'Teleport',
          description: 'neutral',
          category: 'movement',
          powerType: 'movement',
          slot: 'movement',
        },
        {
          id: 'legacy-stance-no-id',
          name: 'Mystery Stance',
          description: 'enter a defensive stance',
          category: 'active',
          powerType: 'active',
        },
      ];
      const rows = samples.map((s) => {
        const option: any = {
          id: s.id,
          name: s.name,
          description: s.description,
          source: 'power',
          slot: (s as any).slot || 'attack',
          powerType: s.powerType,
          tags: [],
          item: {
            type: 'power',
            name: s.name,
            system: {
              ...(s.templateId ? { templateId: s.templateId } : {}),
              rank: 4,
              category: s.category,
              powerType: s.powerType,
              cost: { action: s.category === 'movement' ? 'movement' : 'attack' },
              description: s.description,
            },
          },
        };
        const legacySeg = getSegmentIdForOption(option);
        const id = s.templateId
          ? resolvePowerIdentity({ kind: 'power-item', item: option.item })
          : null;
        return {
          id: s.id,
          templateId: s.templateId || null,
          legacySegment: legacySeg,
          identitySegment:
            id && id.ok
              ? id.category === 'active'
                ? deriveActiveSegment(id)
                : id.category === 'activeBuff'
                  ? 'active-buff'
                  : id.category === 'movement'
                    ? 'movement'
                    : null
              : null,
          documentedDeviation: null as string | null,
        };
      }).map((row) => ({
        ...row,
        // K8.a: getSegmentIdForOption is identity-primary; deviation only when paths still diverge.
        documentedDeviation:
          row.legacySegment !== row.identitySegment && row.identitySegment != null
            ? `segment drift: returned=${row.legacySegment} identity=${row.identitySegment}`
            : null,
      }));
      readOrWrite('power-routing-radial.json', {
        description:
          'K8.a getSegmentIdForOption (identity-primary). `legacySegment` field = returned segment. Source: unit fixtures.',
        rows,
      });
    } finally {
      setIdentityShadowEnabled(true);
      clearIdentityShadowLog();
    }
  });

  it('attack-card-flags-limited-breath.json', () => {
    const rows = [
      {
        id: 'limited-melee-single',
        templateId: 'active-melee-limited-single',
        isLimitedDeclaration: isLimitedAttackDeclaration({
          item: { system: { templateId: 'active-melee-limited-single' } },
        }),
        inLimitedIdSet: isLimitedPowerTemplateId('active-melee-limited-single'),
      },
      {
        id: 'non-limited-damage-transfer',
        templateId: 'active-melee-single-target-damage-transfer',
        isLimitedDeclaration: isLimitedAttackDeclaration({
          item: { system: { templateId: 'active-melee-single-target-damage-transfer' } },
        }),
        inLimitedIdSet: isLimitedPowerTemplateId('active-melee-single-target-damage-transfer'),
      },
      {
        id: 'breath-name-damage',
        name: 'Damage Breath',
        isBreathWeaponName: isBreathWeaponName('Damage Breath'),
        legacyModeDefault: 'damage',
        documentedDeviation:
          'C1/C2.d: executor still defaults mode to damage when unstructured; identity would unresolved',
      },
      {
        id: 'breath-name-ruin',
        name: 'Ruin Breath',
        isBreathWeaponName: isBreathWeaponName('Ruin Breath'),
        legacyModeDefault: 'ruin',
      },
      {
        id: 'moonlight-judgment-name',
        name: 'Moonlight Judgment',
        note: 'Executor Limited via name heuristic; isLimitedAttackDeclaration requires flag/id',
        isLimitedDeclarationWithoutFlag: isLimitedAttackDeclaration({
          item: { system: {} },
        }),
      },
    ];
    readOrWrite('attack-card-flags-limited-breath.json', {
      description: 'Legacy Limited/Breath decision baseline. Source: unit fixtures.',
      rows,
    });
  });

  it('reactions-active-buff-specials.json', () => {
    const heal = isHealRadialOption({
      id: 'h',
      name: 'ZZZ',
      description: 'neutral',
      source: 'power',
      slot: 'attack',
      powerType: 'active',
      tags: [],
      item: {
        type: 'power',
        name: 'ZZZ',
        system: {
          templateId: 'active-ranged-single-heal',
          rank: 4,
          category: 'active',
          powerType: 'active',
          cost: { action: 'attack' },
        },
      },
    } as any);
    const cleanse = isCleanseRadialOption({
      id: 'c',
      name: 'ZZZ',
      description: 'neutral',
      source: 'power',
      slot: 'attack',
      powerType: 'active',
      tags: [],
      item: {
        type: 'power',
        name: 'ZZZ',
        system: {
          templateId: 'active-ranged-single-cleanse',
          rank: 4,
          category: 'active',
          powerType: 'active',
          cost: { action: 'attack' },
        },
      },
    } as any);
    const specials = ['Slow', 'Prone', 'Blind', 'Riposte'].map((name) => ({
      name,
      effectId: getEffect(name)?.id ?? null,
      category: getEffect(name)?.category ?? null,
    }));
    readOrWrite('reactions-active-buff-specials.json', {
      description:
        'Legacy heal/cleanse classifiers + special display-name resolution. Source: unit fixtures.',
      healIsHeal: heal,
      cleanseIsCleanse: cleanse,
      specials,
    });
  });

  it('artifact-functions-representative.json', () => {
    const dragon = ECHO_ARTIFACTS.dragonHead;
    const ring = ECHO_ARTIFACTS.ringchainOfKeptNames;
    const titan = ECHO_ARTIFACTS.titanScars;
    const pick = (def: typeof dragon) =>
      (def.levelProgression || [])
        .filter((r) => r.powerTemplateId || r.artifactFunctionId)
        .map((r) => ({
          level: r.level,
          name: r.name,
          powerTemplateId: r.powerTemplateId ?? null,
          artifactFunctionId: r.artifactFunctionId ?? null,
          rank: r.rank ?? null,
          limited: r.limited === true,
        }));
    readOrWrite('artifact-functions-representative.json', {
      description:
        'Authored catalog identity on representative Echo artifacts (source data, not compiled packs).',
      dragonHead: pick(dragon),
      ringchainOfKeptNames: pick(ring),
      titanScars: pick(titan),
    });
  });

  it('README documents baseline policy', () => {
    const md = [
      '# Golden Snapshots — K8 Legacy Baseline',
      '',
      'These snapshots capture the **currently approved legacy behaviour** before any C2/K8 hard cut.',
      '',
      '- Source: unit-test fixtures / live catalog (`ALL_POWER_TEMPLATES`, `ECHO_ARTIFACTS`).',
      '- Not a Foundry reference world.',
      '- Regenerated by `tests/identity-golden-baseline.test.ts`.',
      '- To refresh after an intentional approved change: `UPDATE_GOLDEN=1 npm test -- tests/identity-golden-baseline.test.ts`.',
      '- **Do not** refresh solely to silence a failure.',
      '',
      '## Documented legacy↔identity deviations (not bugs in C1)',
      '',
      '- Support-heal / cleanse / mental / barrier / illusion Actives: legacy radial segment `attack` vs identity `utility` (see `identity-exceptions.json`).',
      '- Breath without structured mode: legacy defaults to `damage`; identity would be unresolved (C2.d).',
      '- Breath/Limited name heuristics in executor remain until C2.d.',
      '- Special Increase substring match (`slowed` includes `slow`) remains until C2.g.',
      '',
      '## Files',
      '',
      '- `mechanics-breakdown.json`',
      '- `power-routing-radial.json`',
      '- `attack-card-flags-limited-breath.json`',
      '- `reactions-active-buff-specials.json`',
      '- `artifact-functions-representative.json`',
      '',
    ].join('\n');
    fs.mkdirSync(GOLDEN_DIR, { recursive: true });
    fs.writeFileSync(path.join(GOLDEN_DIR, 'README.md'), md, 'utf8');
    expect(fs.existsSync(path.join(GOLDEN_DIR, 'mechanics-breakdown.json'))).toBe(true);
  });
});
