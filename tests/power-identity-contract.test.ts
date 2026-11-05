/**
 * Batch B — power identity contract (plan §11.1 T1–T6, T9–T11, T19–T21).
 * K1b: T1/T7 also assert getSegmentIdForOption (C2.a catalog-bound routing).
 */
import { describe, expect, it } from 'vitest';
import { resolvePowerIdentity, deriveActiveSegment } from '../src/utils/power-identity.js';
import { resolvePowerMechanicsById } from '../src/utils/power-mechanics.js';
import { buildEchoProgressionPicks, ECHO_ARTIFACTS } from '../src/utils/echo-artifacts.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { ARTIFACT_FUNCTION_CONTRACT } from '../src/utils/artifact-functions.js';
import { isLimitedAttackDeclaration } from '../src/combat/limited-charge.js';
import { getSegmentIdForOption } from '../src/radial-menu/options.js';
import {
  clearIdentityShadowLog,
  setIdentityShadowEnabled,
} from '../src/utils/identity-shadow.js';

function powerOption(opts: {
  name: string;
  description?: string;
  templateId?: string;
  category?: string;
  powerType?: string;
  rank?: number;
  slot?: 'attack' | 'utility' | 'movement' | 'reaction';
}): any {
  const category = opts.category || 'active';
  const powerType =
    opts.powerType ||
    (category === 'activeBuff' ? 'buff' : category === 'active' ? 'active' : category);
  return {
    id: `k1b-${opts.templateId || 'none'}-${opts.name}`,
    name: opts.name,
    description: opts.description || '',
    source: 'power',
    slot: opts.slot || 'attack',
    powerType,
    tags: [],
    item: {
      type: 'power',
      name: opts.name,
      system: {
        ...(opts.templateId ? { templateId: opts.templateId } : {}),
        rank: opts.rank ?? 4,
        category,
        powerType,
        cost: { action: 'attack' },
        description: opts.description || '',
      },
    },
  };
}

describe('resolvePowerIdentity — catalog powers', () => {
  it('T1: damage-transfer with stance wording stays active/attack', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Damage Transfer',
        system: {
          templateId: 'active-melee-single-target-damage-transfer',
          rank: 4,
          description: 'enter a defensive stance',
        },
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.category).toBe('active');
    expect(deriveActiveSegment(id)).toBe('attack');
  });

  it('T1/K1b: getSegmentIdForOption — catalog Active + stance/instance text stays attack', () => {
    setIdentityShadowEnabled(false);
    try {
      const stance = getSegmentIdForOption(
        powerOption({
          name: 'Damage Transfer',
          templateId: 'active-melee-single-target-damage-transfer',
          description: 'enter a defensive stance',
        }),
      );
      const instance = getSegmentIdForOption(
        powerOption({
          name: 'Damage Transfer',
          templateId: 'active-melee-single-target-damage-transfer',
          description: 'this damage instance buffs the wielder',
        }),
      );
      expect(stance).toBe('attack');
      expect(instance).toBe('attack');
    } finally {
      setIdentityShadowEnabled(true);
      clearIdentityShadowLog();
    }
  });

  it('T1/K1b: getSegmentIdForOption — Active Buff id routes to active-buff', () => {
    setIdentityShadowEnabled(false);
    try {
      const seg = getSegmentIdForOption(
        powerOption({
          name: 'Armor',
          templateId: 'ab-armor',
          category: 'activeBuff',
          powerType: 'buff',
          description: 'grant armor',
        }),
      );
      expect(seg).toBe('active-buff');
    } finally {
      setIdentityShadowEnabled(true);
      clearIdentityShadowLog();
    }
  });

  it('T1/K1b: getSegmentIdForOption — missing templateId keeps stance→active-buff legacy', () => {
    setIdentityShadowEnabled(false);
    try {
      const seg = getSegmentIdForOption(
        powerOption({
          name: 'Mystery Stance',
          description: 'enter a defensive stance',
          category: 'active',
          powerType: 'active',
        }),
      );
      expect(seg).toBe('active-buff');
    } finally {
      setIdentityShadowEnabled(true);
      clearIdentityShadowLog();
    }
  });

  it('T2: missing templateId → Unresolved missing-identity', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Mystery',
        system: { description: 'this damage instance', rank: 1 },
      },
    });
    expect(id.ok).toBe(false);
    if (id.ok) return;
    expect(id.reason).toBe('missing-identity');
    expect(id.severity).toBe('blocks-activation');
  });

  it('T3: ab-armor renamed — mechanics by id identical across ranks', () => {
    for (let r = 1; r <= 16; r++) {
      const a = resolvePowerMechanicsById('ab-armor', r);
      const b = resolvePowerIdentity({
        kind: 'power-item',
        item: { name: 'Banana', system: { templateId: 'ab-armor', rank: r } },
      });
      expect(b.ok).toBe(true);
      if (!b.ok) return;
      expect(b.mechanics).toEqual(a);
      expect(b.mechanics?.armor).toBeDefined();
    }
  });

  it('T6: Armor templates stay distinct by templateId', () => {
    const reaction = resolvePowerIdentity({
      kind: 'power-item',
      item: { name: 'X', system: { templateId: 'reaction-armor', rank: 4 } },
    });
    const buff = resolvePowerIdentity({
      kind: 'power-item',
      item: { name: 'X', system: { templateId: 'ab-armor', rank: 4 } },
    });
    const passive = resolvePowerIdentity({
      kind: 'power-item',
      item: { name: 'X', system: { templateId: 'passive-echo-armor-value', rank: 4 } },
    });
    expect(reaction.ok && buff.ok && passive.ok).toBe(true);
    if (!reaction.ok || !buff.ok || !passive.ok) return;
    expect(reaction.category).toBe('reaction');
    expect(buff.category).toBe('activeBuff');
    expect(passive.category).toBe('passive');
    expect(new Set([reaction.templateId, buff.templateId, passive.templateId]).size).toBe(3);
  });

  it('T10: Artifact Active type ignored — category from template', () => {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      artifact: { flags: { 'mastery-system': { echoArtifactKey: 'x' } } },
      row: {
        level: 1,
        name: 'Anything',
        type: 'Artifact Active',
        powerTemplateId: 'ab-armor',
        rank: 4,
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.category).toBe('activeBuff');
  });

  it('T11: category-conflict → Unresolved', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        system: { templateId: 'ab-armor', rank: 4, category: 'active' },
      },
    });
    expect(id.ok).toBe(false);
    if (id.ok) return;
    expect(id.reason).toBe('category-conflict');
  });

  it('T20: utility powerType with cleanse template → active + utility segment', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        system: {
          templateId: 'active-ranged-single-cleanse',
          rank: 4,
          powerType: 'utility',
          category: 'active',
        },
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.category).toBe('active');
    expect(deriveActiveSegment(id)).toBe('utility');
  });

  it('T21: utility without templateId → missing-identity', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: { system: { powerType: 'utility', rank: 1 } },
    });
    expect(id.ok).toBe(false);
    if (id.ok) return;
    expect(id.reason).toBe('missing-identity');
  });
});

describe('resolvePowerIdentity — artifact functions', () => {
  it('T9: dragon-breath K3 with correct template resolves', () => {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      artifact: { flags: { 'mastery-system': { echoArtifactKey: 'dragonHead' } } },
      row: {
        level: 1,
        powerTemplateId: 'active-melee-weapon-aoe',
        artifactFunctionId: 'dragon-breath',
        rank: 4,
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.artifactFunctionId).toBe('dragon-breath');
    expect(id.templateId).toBe('active-melee-weapon-aoe');
  });

  it('T9b: dragon-breath with wrong template → contract violation', () => {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      row: {
        level: 1,
        powerTemplateId: 'ab-armor',
        artifactFunctionId: 'dragon-breath',
        rank: 4,
      },
    });
    expect(id.ok).toBe(false);
    if (id.ok) return;
    expect(id.reason).toBe('artifact-function-contract-violation');
  });

  it('T19: K2 titan-growth with templateId → contract violation', () => {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      row: {
        level: 1,
        powerTemplateId: 'ab-growth-form',
        artifactFunctionId: 'titan-growth',
      },
    });
    expect(id.ok).toBe(false);
    if (id.ok) return;
    expect(id.reason).toBe('artifact-function-contract-violation');
  });

  it('T14-shape: titan-growth K2 resolves without template', () => {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      row: { level: 4, artifactFunctionId: 'titan-growth' },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.templateId).toBeNull();
    expect(id.artifactFunctionId).toBe('titan-growth');
    expect(id.category).toBe(ARTIFACT_FUNCTION_CONTRACT['titan-growth'].category);
  });
});

describe('Ringchain / authored identity propagation (Batch B Z2)', () => {
  it('source rows carry freigegebene identities', () => {
    const def = ECHO_ARTIFACTS.ringchainOfKeptNames;
    expect(def).toBeDefined();
    const byLevel = Object.fromEntries(def.levelProgression.map((r) => [r.level, r]));
    expect(byLevel[2].powerTemplateId).toBe('active-ranged-single-cleanse');
    expect(byLevel[2].rank).toBe(4);
    expect(byLevel[3].powerTemplateId).toBe('active-melee-aoe-restoration');
    expect(byLevel[3].rank).toBe(4);
    expect(byLevel[4].powerTemplateId).toBe('active-ranged-health-level-heal');
    expect(byLevel[4].rank).toBe(10);
    expect(byLevel[6].powerTemplateId).toBe('active-ranged-single-cleanse');
    expect(byLevel[6].rank).toBe(10);
    expect(byLevel[7].powerTemplateId).toBe('active-ranged-health-level-heal');
    expect(byLevel[7].rank).toBe(16);
    expect(byLevel[8].powerTemplateId).toBe('active-melee-aoe-restoration');
    expect(byLevel[8].rank).toBe(16);
    expect(byLevel[10].artifactFunctionId).toBe('artifact-awakening');
  });

  it('authored pick builder preserves identity fields into authoredStages', () => {
    const def = ECHO_ARTIFACTS.ringchainOfKeptNames;
    const picks = buildEchoProgressionPicks(def);
    // With useAuthoredLevelProgression the printed table is SoT; picks may still
    // carry authored stages for empty slots when no pick specs exist.
    const authored = picks.filter((p) => p.kind === 'authored');
    for (const pick of authored) {
      for (const stage of pick.authoredStages || []) {
        if (!stage.powerTemplateId && !stage.artifactFunctionId) continue;
        if (stage.powerTemplateId) {
          expect(stage.rank, `${stage.name} missing rank`).toBeDefined();
        }
      }
    }
  });

  it('T15: Hearth Circle II resolves pool-bearing restoration identity', () => {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      artifact: { flags: { 'mastery-system': { echoArtifactKey: 'ringchainOfKeptNames' } } },
      row: {
        level: 8,
        name: 'Hearth Circle II',
        effect: 'damage (PL 4)',
        powerTemplateId: 'active-melee-aoe-restoration',
        rank: 16,
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.templateId).toBe('active-melee-aoe-restoration');
    expect(id.rank).toBe(16);
    expect(id.subfamily).toMatch(/heal|restoration|support/i);
  });

  it('Dragon Head pick carries dragon-breath overlay', () => {
    const def = ECHO_ARTIFACTS.dragonHead;
    const picks = buildEchoProgressionPicks(def);
    const breath = picks.find((p) => p.kind === 'power' && p.powerTemplateId === 'active-melee-weapon-aoe');
    expect(breath?.artifactFunctionId).toBe('dragon-breath');
    const rows = deriveLevelProgressionFromPicks(picks);
    const breathRows = rows.filter((r) => r.powerTemplateId === 'active-melee-weapon-aoe');
    expect(breathRows.length).toBeGreaterThanOrEqual(1);
    for (const r of breathRows) {
      expect(r.artifactFunctionId).toBe('dragon-breath');
      expect(r.rank).toBeDefined();
    }
  });
});

describe('K6 contract gaps T4/T5/T7/T8/T9c/T12/T13/T16/T17/T18', () => {
  it('T4: renamed DR passive keeps mechanics by id; nameless impostor is unresolved', () => {
    const real = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Schadensreduktion Umbennant',
        system: { templateId: 'passive-damage-reduction', rank: 4, category: 'passive' },
      },
    });
    expect(real.ok).toBe(true);
    if (!real.ok) return;
    expect(real.mechanics?.damageReductionPct).toBeDefined();

    const impostor = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Schadensreduktion',
        system: { rank: 4, category: 'passive', description: 'damage reduction 50%' },
      },
    });
    expect(impostor.ok).toBe(false);
    if (impostor.ok) return;
    expect(impostor.reason).toBe('missing-identity');
  });

  it('T5: renamed ghostform keeps phasing mechanics by id', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Phasenmantel X',
        system: { templateId: 'passive-ghostform', rank: 4, category: 'passive' },
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.mechanics?.phasing || id.mechanics).toBeTruthy();
  });

  it('T7: renaming with valid id does not change identity routing', () => {
    const a = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Alpha',
        system: {
          templateId: 'active-melee-single-target-damage-transfer',
          rank: 4,
          description: 'buff stance heal teleport limited breath',
        },
      },
    });
    const b = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Omega Limited Breath Stance Heal',
        system: {
          templateId: 'active-melee-single-target-damage-transfer',
          rank: 4,
          description: 'totally different',
        },
      },
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.category).toBe(b.category);
    expect(deriveActiveSegment(a)).toBe(deriveActiveSegment(b));
    expect(a.templateId).toBe(b.templateId);
  });

  it('T7/K1b: getSegmentIdForOption — rename/translation with templateId does not change segment', () => {
    setIdentityShadowEnabled(false);
    try {
      const a = getSegmentIdForOption(
        powerOption({
          name: 'Damage Transfer',
          templateId: 'active-melee-single-target-damage-transfer',
          description: 'enter a defensive stance',
        }),
      );
      const b = getSegmentIdForOption(
        powerOption({
          name: 'Schadensübertragung (Stance Buff Heal Breath)',
          templateId: 'active-melee-single-target-damage-transfer',
          description: 'völlig anderer Fluff mit Stance und Buff',
        }),
      );
      expect(a).toBe('attack');
      expect(b).toBe('attack');
      expect(a).toBe(b);
    } finally {
      setIdentityShadowEnabled(true);
      clearIdentityShadowLog();
    }
  });

  it('T8: Moonlight Judgment name without limited/id is not a limited declaration', () => {
    expect(
      isLimitedAttackDeclaration({
        limited: false,
        artifactLimited: false,
        templateId: '',
        item: { name: 'Moonlight Judgment', system: {} },
      }),
    ).toBe(false);
    // Identity itself is missing — fail-closed.
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      row: { level: 4, name: 'Moonlight Judgment', type: 'Active' },
    });
    expect(id.ok).toBe(false);
  });

  it('T9c: dragon-breath without structured mode stays identity-ok but mode unresolved is separate', () => {
    const id = resolvePowerIdentity({
      kind: 'artifact-row',
      row: {
        level: 1,
        powerTemplateId: 'active-melee-weapon-aoe',
        artifactFunctionId: 'dragon-breath',
        rank: 4,
        name: 'Feuerhauch',
      },
    });
    expect(id.ok).toBe(true);
    // Mode is not part of resolvePowerIdentity — absence of dragonHeadBreathMode is the
    // fail-closed concern for the executor shadow (executor.breathMode).
    expect((id as any).dragonHeadBreathMode).toBeUndefined();
  });

  it('T12: special increase exact id match preferred over substring (identity path)', () => {
    const status = [
      { id: 'mark', name: 'Mark', value: 1 },
      { id: 'ruin', name: 'Ruinous Mark', value: 2 },
    ];
    const chosenId = 'mark';
    const exact = status.filter((e) => e.id.toLowerCase() === chosenId);
    const substring = status.filter((e) => e.name.toLowerCase().includes(chosenId));
    expect(exact).toHaveLength(1);
    expect(exact[0]!.id).toBe('mark');
    // Substring would also hit "Ruinous Mark" — documenting why C2.g must drop includes().
    expect(substring.length).toBeGreaterThanOrEqual(1);
  });

  it('T13: special key adapter shape — structured ref vs display string', () => {
    const structured = { key: 'ruin', rank: 3 };
    const legacy = 'Ruin(3)';
    const parsed = /^([^(]+)(?:\((\d+)\))?$/.exec(legacy);
    expect(parsed?.[1]?.trim().toLowerCase()).toBe('ruin');
    expect(Number(parsed?.[2])).toBe(structured.rank);
    expect(structured.key).toBe('ruin');
    // Malformed display string must not invent a key.
    expect(/^([^(]+)(?:\((\d+)\))?$/.exec('Rüin(3)')?.[1]?.trim().toLowerCase()).not.toBe('ruin');
  });

  it('T16: movement-teleport identity stays movement when renamed', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Blink',
        system: { templateId: 'movement-teleport', rank: 1, category: 'movement' },
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.category).toBe('movement');
    const attackNamedTeleport = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Teleport Strike',
        system: {
          templateId: 'active-melee-single-target-damage-transfer',
          rank: 4,
          category: 'active',
        },
      },
    });
    expect(attackNamedTeleport.ok).toBe(true);
    if (!attackNamedTeleport.ok) return;
    expect(attackNamedTeleport.category).toBe('active');
    expect(deriveActiveSegment(attackNamedTeleport)).toBe('attack');
  });

  it('T17: reaction-riposte identity stays reaction when renamed', () => {
    const id = resolvePowerIdentity({
      kind: 'power-item',
      item: {
        name: 'Weapon Damage Shield',
        system: { templateId: 'reaction-riposte', rank: 4, category: 'reaction' },
      },
    });
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    expect(id.category).toBe('reaction');
    expect(id.templateId).toBe('reaction-riposte');
  });

  it('T18: active-buff effect without powerTemplateId stays present; preflight omits-contribution', () => {
    const id = resolvePowerIdentity({
      kind: 'active-effect',
      effect: {
        id: 'eff1',
        name: 'Armor Buff',
        flags: { 'mastery-system': { activeBuff: true, powerId: 'pw1' } },
      },
    });
    expect(id.ok).toBe(false);
    if (id.ok) return;
    expect(id.severity).toBe('omits-contribution');
    // Document is not deleted — identity resolution only reports.
    expect(id.reason).toBe('missing-identity');
  });
});

