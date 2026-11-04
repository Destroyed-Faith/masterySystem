/**
 * Batch 8 / 8.1 — Special Auras (Z05): complete 14-Power Active Buff catalogue
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs.js';
import {
  FINAL_ACTIVE_BUFF_TEMPLATE_IDS,
  filterCatalog,
  isSelectableActiveBuffTemplateId,
} from '../src/utils/power-catalog.js';
import {
  RETIRED_LEGACY_AURA_TEMPLATE_IDS,
  SPECIAL_AURA_TEMPLATE_IDS,
  applySpecialAuraToCreaturesInRadius,
  applySpecialAurasOnTokenMove,
  auraAlreadyApplied,
  auraRoundKey,
  creatureInsideSpecialAura,
  isRetiredLegacyAuraTemplateId,
  isSpecialAuraTemplateId,
  markAuraApplied,
  readActiveSpecialAura,
  specialAuraLabel,
  specialAuraSourceKey,
} from '../src/combat/special-aura-runtime.js';
import { handleTokenMovement } from '../src/combat/movement-tracker.js';
import { ruinTickDamage } from '../src/combat/status-tick.js';
import { ACTIVE_TEMPLATES } from '../src/utils/powers/templates/actives.js';
import * as reactionEligibility from '../src/combat/reaction-eligibility.js';
import * as applySpecial from '../src/combat/apply-special-effects.js';

const OFFICIAL_14 = [
  'ab-blight-aura',
  'ab-challenge-aura',
  'ab-corrode-aura',
  'ab-disoriented-aura',
  'ab-expose-aura',
  'ab-hex-aura',
  'ab-lacerate-aura',
  'ab-mark-aura',
  'ab-root-aura',
  'ab-ruin-aura',
  'ab-slow-aura',
  'ab-soulburn-aura',
  'ab-sundered-aura',
  'ab-weaken-aura',
] as const;

const NEW_11 = [
  'ab-challenge-aura',
  'ab-disoriented-aura',
  'ab-expose-aura',
  'ab-hex-aura',
  'ab-lacerate-aura',
  'ab-mark-aura',
  'ab-root-aura',
  'ab-slow-aura',
  'ab-soulburn-aura',
  'ab-sundered-aura',
  'ab-weaken-aura',
] as const;

const TABLES = JSON.parse(
  readFileSync(join(__dirname, '../scripts/_special-aura-tables.json'), 'utf8'),
) as Record<
  string,
  {
    name: string;
    rows: Array<
      | { pl: number; unavailable: true }
      | { pl: number; radiusM: number; special: string; rank: number }
    >;
  }
>;

function tpl(id: string) {
  return ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id)!;
}

function row(id: string, pl: number) {
  return tpl(id).levels![String(pl)] as any;
}

function makeCombat() {
  const combat: any = {
    id: 'c1',
    round: 1,
    started: true,
    combatant: { actor: { id: 'Actor.active' } },
    flags: { 'mastery-system': {} },
    async setFlag(scope: string, key: string, value: unknown) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = value;
    },
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
  };
  return combat;
}

function auraOwner(templateId: string, rank: number, radiusM: number, special?: string) {
  const key =
    special ??
    String(templateId)
      .replace(/^ab-/, '')
      .replace(/-aura$/, '');
  return {
    id: 'Actor.owner',
    name: 'Owner',
    effects: [
      {
        id: 'eff-aura',
        name: `Active Buff: ${templateId}`,
        disabled: false,
        flags: {
          'mastery-system': {
            activeBuff: true,
            powerTemplateId: templateId,
            mechanics: {
              applyWhen: 'activeBuff-active',
              activeSpecialAura: {
                special: key,
                rank,
                radiusM,
              },
            },
          },
        },
      },
    ],
  };
}

describe('Batch 8.1 — Special Aura catalogue (14 Powers)', () => {
  it('registers exactly the 14 official Special Aura template IDs', () => {
    expect([...SPECIAL_AURA_TEMPLATE_IDS]).toEqual([...OFFICIAL_14]);
    expect(SPECIAL_AURA_TEMPLATE_IDS).toHaveLength(14);
    for (const id of SPECIAL_AURA_TEMPLATE_IDS) {
      expect(tpl(id)).toBeTruthy();
      expect(tpl(id).subfamily).toBe('special-aura');
      expect(tpl(id).roll?.kind).toBe('none');
      expect(tpl(id).cost?.action).toBe('attack'); // catalog cost field; activation still free Prep
      expect(isSpecialAuraTemplateId(id)).toBe(true);
    }
  });

  it('matches Canonical Active_Buffs.md PL 1–16 tables for every Aura', () => {
    for (const [specialKey, pack] of Object.entries(TABLES)) {
      const id = `ab-${specialKey}-aura`;
      expect(tpl(id), id).toBeTruthy();
      expect(pack.rows).toHaveLength(16);
      for (const expected of pack.rows) {
        const lvl = row(id, expected.pl);
        if ('unavailable' in expected && expected.unavailable) {
          expect(lvl.mechanics.specialAuraUnavailable, `${id} PL${expected.pl}`).toBe(true);
          expect(lvl.mechanics.activeSpecialAura).toBeUndefined();
        } else {
          const e = expected as { radiusM: number; special: string; rank: number };
          expect(lvl.mechanics.activeSpecialAura, `${id} PL${expected.pl}`).toEqual({
            special: e.special,
            rank: e.rank,
            radiusM: e.radiusM,
          });
          expect(lvl.specials?.[0]).toEqual({ key: e.special, rank: e.rank });
        }
      }
    }
  });

  it('keeps original Ruin / Corrode / Blight control points unchanged', () => {
    expect(row('ab-ruin-aura', 2).mechanics.activeSpecialAura).toEqual({
      special: 'ruin',
      rank: 1,
      radiusM: 2,
    });
    expect(row('ab-ruin-aura', 9).mechanics.activeSpecialAura).toEqual({
      special: 'ruin',
      rank: 5,
      radiusM: 3,
    });
    expect(row('ab-ruin-aura', 16).mechanics.activeSpecialAura).toEqual({
      special: 'ruin',
      rank: 8,
      radiusM: 3,
    });
    expect(row('ab-corrode-aura', 3).mechanics.activeSpecialAura).toEqual({
      special: 'corrode',
      rank: 1,
      radiusM: 2,
    });
    expect(row('ab-corrode-aura', 15).mechanics.activeSpecialAura).toEqual({
      special: 'corrode',
      rank: 5,
      radiusM: 4,
    });
    expect(row('ab-blight-aura', 2).mechanics.activeSpecialAura).toEqual({
      special: 'blight',
      rank: 1,
      radiusM: 2,
    });
    expect(row('ab-blight-aura', 9).mechanics.activeSpecialAura).toEqual({
      special: 'blight',
      rank: 6,
      radiusM: 3,
    });
    expect(row('ab-blight-aura', 16).mechanics.activeSpecialAura).toEqual({
      special: 'blight',
      rank: 9,
      radiusM: 3,
    });
  });

  it('locks Unavailable levels (Challenge PL1–4, Root PL1–3, Disoriented/Soulburn/Weaken PL1–6, …)', () => {
    expect(row('ab-challenge-aura', 4).mechanics.specialAuraUnavailable).toBe(true);
    expect(row('ab-challenge-aura', 5).mechanics.activeSpecialAura.rank).toBe(1);
    expect(row('ab-root-aura', 3).mechanics.specialAuraUnavailable).toBe(true);
    expect(row('ab-root-aura', 4).mechanics.activeSpecialAura).toEqual({
      special: 'root',
      rank: 2,
      radiusM: 2,
    });
    expect(row('ab-disoriented-aura', 6).mechanics.specialAuraUnavailable).toBe(true);
    expect(row('ab-soulburn-aura', 6).mechanics.specialAuraUnavailable).toBe(true);
    expect(row('ab-weaken-aura', 6).mechanics.specialAuraUnavailable).toBe(true);
    expect(row('ab-hex-aura', 2).mechanics.specialAuraUnavailable).toBe(true);
    expect(row('ab-hex-aura', 3).mechanics.activeSpecialAura.rank).toBe(1);
  });

  it('selectable catalogue is 33 Buffs (19 core + 14 Special Auras); legacy auras excluded', () => {
    expect(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).toHaveLength(33);
    for (const id of SPECIAL_AURA_TEMPLATE_IDS) {
      expect(isSelectableActiveBuffTemplateId(id)).toBe(true);
    }
    for (const id of NEW_11) {
      expect(isSelectableActiveBuffTemplateId(id)).toBe(true);
    }
    for (const id of RETIRED_LEGACY_AURA_TEMPLATE_IDS) {
      expect(isSelectableActiveBuffTemplateId(id)).toBe(false);
      expect(isRetiredLegacyAuraTemplateId(id)).toBe(true);
      expect(ACTIVE_BUFF_TEMPLATES.some((t) => t.templateId === id)).toBe(true);
    }
    const listed = filterCatalog({ category: 'activeBuff' });
    expect(listed).toHaveLength(33);
    expect(listed.some((e) => e.templateId === 'ab-hex-aura')).toBe(true);
    expect(listed.some((e) => e.templateId === 'ab-challenge-aura')).toBe(true);
    expect(listed.some((e) => e.templateId === 'ab-armor-aura')).toBe(false);
    expect(listed.some((e) => e.templateId === 'ab-damage-aura')).toBe(false);
  });
});

describe('Batch 8.1 — once-per-aura/target/round + A→B→A', () => {
  it('keeps stable owner×template source marks across re-activation', async () => {
    const combat = makeCombat();
    const source = specialAuraSourceKey('Actor.owner', 'ab-ruin-aura');
    const roundKey = auraRoundKey('c1', 1);
    await markAuraApplied(combat, source, roundKey, 'Actor.foe');
    expect(auraAlreadyApplied(combat, source, roundKey, 'Actor.foe')).toBe(true);
    expect(specialAuraSourceKey('Actor.owner', 'ab-ruin-aura')).toBe(source);
    expect(
      auraAlreadyApplied(
        combat,
        specialAuraSourceKey('Actor.owner', 'ab-hex-aura'),
        roundKey,
        'Actor.foe',
      ),
    ).toBe(false);
  });

  it('formats Special labels for all 14 Aura Specials', () => {
    expect(specialAuraLabel('ruin', 5)).toBe('Ruin(5)');
    expect(specialAuraLabel('hex', 3)).toBe('Hex(3)');
    expect(specialAuraLabel('challenge', 1)).toBe('Challenge(1)');
    expect(specialAuraLabel('root', 2)).toBe('Root(2)');
    expect(specialAuraLabel('disoriented', 1)).toBe('Disoriented(1)');
    expect(specialAuraLabel('corrode', 0)).toBe('');
  });
});

describe('Batch 8.1 — application, immunity, Special resolvers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('applies Special via central pipeline; owner immune; allies affected; once per Round; no direct damage', async () => {
    const combat = makeCombat();
    const owner = auraOwner('ab-ruin-aura', 3, 2);
    const ally = { id: 'Actor.ally', name: 'Ally' };
    const foe = { id: 'Actor.foe', name: 'Foe' };
    const otherOwner = { id: 'Actor.other', name: 'OtherCaster' };

    (globalThis as any).game = {
      combat,
      actors: { contents: [owner, ally, foe, otherOwner] },
      user: { isGM: true },
    };

    vi.spyOn(reactionEligibility, 'distanceBetweenActorsMeters').mockImplementation(
      (a: any, b: any) => {
        if (String(a.id) === String(b.id)) return 0;
        return 1;
      },
    );
    const applySpy = vi
      .spyOn(applySpecial, 'applySpecialStringsToTarget')
      .mockResolvedValue([]);

    expect(readActiveSpecialAura(owner)?.special).toBe('ruin');
    expect(creatureInsideSpecialAura(owner, owner, 2)).toBe(false);

    const notes = await applySpecialAuraToCreaturesInRadius(owner, combat, 'activation');
    expect(notes.length).toBe(3);
    expect(applySpy).toHaveBeenCalledTimes(3);
    for (const call of applySpy.mock.calls) {
      expect(call[0].id).not.toBe(owner.id);
      expect(call[1]).toEqual(['Ruin(3)']);
      expect(call[2]).toBe(owner);
    }

    applySpy.mockClear();
    const again = await applySpecialAuraToCreaturesInRadius(owner, combat, 'owner-move');
    expect(again).toEqual([]);
    expect(applySpy).not.toHaveBeenCalled();
  });

  it.each([
    ['ab-hex-aura', 'hex', 3, 'Hex(3)'],
    ['ab-challenge-aura', 'challenge', 1, 'Challenge(1)'],
    ['ab-root-aura', 'root', 2, 'Root(2)'],
    ['ab-disoriented-aura', 'disoriented', 1, 'Disoriented(1)'],
    ['ab-expose-aura', 'expose', 2, 'Expose(2)'],
    ['ab-lacerate-aura', 'lacerate', 4, 'Lacerate(4)'],
    ['ab-mark-aura', 'mark', 3, 'Mark(3)'],
    ['ab-slow-aura', 'slow', 4, 'Slow(4)'],
    ['ab-soulburn-aura', 'soulburn', 1, 'Soulburn(1)'],
    ['ab-sundered-aura', 'sundered', 3, 'Sundered(3)'],
    ['ab-weaken-aura', 'weaken', 1, 'Weaken(1)'],
  ] as const)(
    '%s routes %s through applySpecialStringsToTarget as %s',
    async (templateId, special, rank, label) => {
      const combat = makeCombat();
      const owner = auraOwner(templateId, rank, 2, special);
      const foe = { id: 'Actor.foe', name: 'Foe' };
      (globalThis as any).game = {
        combat,
        actors: { contents: [owner, foe] },
        user: { isGM: true },
      };
      vi.spyOn(reactionEligibility, 'distanceBetweenActorsMeters').mockReturnValue(1);
      const applySpy = vi
        .spyOn(applySpecial, 'applySpecialStringsToTarget')
        .mockResolvedValue([]);

      await applySpecialAuraToCreaturesInRadius(owner, combat, 'activation');
      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy.mock.calls[0][1]).toEqual([label]);
      expect(applySpy.mock.calls[0][2]).toBe(owner);
      expect(readActiveSpecialAura(owner)?.special).toBe(special);
    },
  );

  it('A→B→A same Round does not re-apply the same Aura to the same target', async () => {
    const combat = makeCombat();
    const owner = auraOwner('ab-ruin-aura', 2, 2);
    const foe = { id: 'Actor.foe', name: 'Foe' };
    (globalThis as any).game = {
      combat,
      actors: { contents: [owner, foe] },
      user: { isGM: true },
    };
    vi.spyOn(reactionEligibility, 'distanceBetweenActorsMeters').mockReturnValue(1);
    const applySpy = vi
      .spyOn(applySpecial, 'applySpecialStringsToTarget')
      .mockResolvedValue([]);

    await applySpecialAuraToCreaturesInRadius(owner, combat, 'activation');
    expect(applySpy).toHaveBeenCalledTimes(1);

    applySpy.mockClear();
    owner.effects[0].id = 'eff-aura-recreated';
    await applySpecialAuraToCreaturesInRadius(owner, combat, 'activation');
    expect(applySpy).not.toHaveBeenCalled();
  });

  it('overlapping different Aura Powers apply separately', async () => {
    const combat = makeCombat();
    const ruinOwner = auraOwner('ab-ruin-aura', 2, 2);
    ruinOwner.id = 'Actor.ruin';
    const hexOwner: any = auraOwner('ab-hex-aura', 3, 2, 'hex');
    hexOwner.id = 'Actor.hex';
    hexOwner.effects[0].flags['mastery-system'].powerTemplateId = 'ab-hex-aura';
    const foe = { id: 'Actor.foe', name: 'Foe' };
    (globalThis as any).game = {
      combat,
      actors: { contents: [ruinOwner, hexOwner, foe] },
      user: { isGM: true },
    };
    vi.spyOn(reactionEligibility, 'distanceBetweenActorsMeters').mockReturnValue(1);
    const applySpy = vi
      .spyOn(applySpecial, 'applySpecialStringsToTarget')
      .mockResolvedValue([]);

    await applySpecialAuraToCreaturesInRadius(ruinOwner, combat, 'activation');
    await applySpecialAuraToCreaturesInRadius(hexOwner, combat, 'activation');
    const onFoe = applySpy.mock.calls
      .filter((c) => c[0].id === foe.id)
      .map((c) => c[1][0])
      .sort();
    expect(onFoe).toEqual(['Hex(3)', 'Ruin(2)']);
  });
});

describe('Batch 8.1 — movement hook (any combat token)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('applies Special Auras when a non-active combatant moves into radius', async () => {
    const combat = makeCombat();
    // Active combatant is Actor.active — mover is someone else.
    const owner = auraOwner('ab-hex-aura', 2, 4, 'hex');
    owner.id = 'Actor.auraOwner';
    const mover: any = {
      id: 'Actor.mover',
      name: 'Mover',
      getFlag: () => null,
      setFlag: vi.fn(),
      unsetFlag: vi.fn(),
      system: { combat: { speed: 8 } },
    };
    (globalThis as any).game = {
      combat,
      actors: { contents: [owner, mover] },
      user: { isGM: true },
    };

    vi.spyOn(reactionEligibility, 'distanceBetweenActorsMeters').mockReturnValue(1);
    const applySpy = vi
      .spyOn(applySpecial, 'applySpecialStringsToTarget')
      .mockResolvedValue([]);

    const tokenDoc = {
      actor: mover,
      parent: { grid: { size: 100, distance: 1 } },
      x: 0,
      y: 0,
      _source: { x: 0, y: 0 },
    };

    await handleTokenMovement(tokenDoc, { x: 200, y: 0 });
    expect(applySpy).toHaveBeenCalled();
    expect(applySpy.mock.calls.some((c) => c[0].id === mover.id && c[1][0] === 'Hex(2)')).toBe(
      true,
    );
  });

  it('applySpecialAurasOnTokenMove refreshes owner-move coverage', async () => {
    const combat = makeCombat();
    const owner = auraOwner('ab-slow-aura', 2, 2, 'slow');
    const foe = { id: 'Actor.foe', name: 'Foe' };
    (globalThis as any).game = {
      combat,
      actors: { contents: [owner, foe] },
      user: { isGM: true },
    };
    vi.spyOn(reactionEligibility, 'distanceBetweenActorsMeters').mockReturnValue(1);
    const applySpy = vi
      .spyOn(applySpecial, 'applySpecialStringsToTarget')
      .mockResolvedValue([]);

    await applySpecialAurasOnTokenMove(owner, {}, combat);
    expect(applySpy).toHaveBeenCalledWith(foe, ['Slow(2)'], owner);
  });
});

describe('Batch 8 — regressions', () => {
  it('Ruin Tick remains 4 × current stack', () => {
    expect(ruinTickDamage(6)).toBe(24);
    expect(ruinTickDamage(1)).toBe(4);
  });

  it('Persistent Zone templates remain (Batch 7)', () => {
    const zones = ACTIVE_TEMPLATES.filter((t) => t.subfamily === 'persistent-zone');
    expect(zones.length).toBeGreaterThanOrEqual(4);
  });

  it('isSpecialAuraTemplateId accepts all 14 official IDs only', () => {
    for (const id of OFFICIAL_14) expect(isSpecialAuraTemplateId(id)).toBe(true);
    expect(isSpecialAuraTemplateId('ab-damage-aura')).toBe(false);
    expect(isSpecialAuraTemplateId('passive-special-aura')).toBe(false);
  });
});
