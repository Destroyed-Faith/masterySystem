/**
 * Echo catalog tests.
 *
 * Covers:
 *  - Catalog order and lookup.
 *  - Echo Cards are retired: no Echo carries a card deck.
 *  - Trait uses and the Safe-Haven reset.
 *  - Sub-choice validation (Sentinels / Unbound require one, others don't).
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_ECHOS,
  buildFreshTraitUses,
  ECHO_KEY_ORDER,
  getActiveEchoTraits,
  getAllEchos,
  getEcho,
  getEchoSubChoice,
  isMrPerRest,
  isTraitGatedByMr,
} from '../src/utils/echos/index';
import * as echoApi from '../src/utils/echos/index';
import { buildSafeHavenRestUpdates } from '../src/utils/safe-haven-rest';

describe('Echo Catalog', () => {
  it('registers all 8 playable Echos in canonical order', () => {
    expect(ECHO_KEY_ORDER).toEqual([
      'humans',
      'halflings',
      'dwarfs',
      'elorians',
      'sentinels',
      'titanborn',
      'dragonborn',
      'unbound'
    ]);
    expect(getAllEchos().length).toBe(8);
    for (const key of ECHO_KEY_ORDER) {
      expect(ALL_ECHOS[key]).toBeDefined();
      expect(ALL_ECHOS[key].key).toBe(key);
    }
  });

  it('no Echo carries a retired Echo Card deck', () => {
    for (const def of getAllEchos()) expect((def as any).deck).toBeUndefined();
    for (const name of ['getEchoCard', 'getCardOption', 'getUnlockedCardSlots', 'isEchoCardLicensed', 'removeSelectedEchoCard']) {
      expect((echoApi as any)[name]).toBeUndefined();
    }
  });
});

describe('Echo trait uses + Safe-Haven reset', () => {
  it('Sentinel Order traits are flavor-only passives (no per-rest uses)', () => {
    const sc = getEchoSubChoice('sentinels', 'judicator')!;
    expect(sc.trait.usage).toBe('passive');
    expect(isMrPerRest(sc.trait.usage)).toBe(false);
    expect(buildFreshTraitUses('sentinels', 'judicator', 3)).toEqual({});
  });

  it('buildFreshTraitUses returns empty when no active traits', () => {
    expect(buildFreshTraitUses('humans', null, 3)).toEqual({});
    expect(buildFreshTraitUses('elorians', null, 3)).toEqual({});
  });

  it('Safe-Haven rest refreshes trait uses and never writes Echo Card uses', () => {
    const updates = buildSafeHavenRestUpdates({
      mastery: { rank: 3 },
      echo: { key: 'sentinels', subChoiceKey: 'judicator', selectedCardIds: ['old'], cardUses: { old: true } },
      specializations: [],
    });
    expect(updates['system.echo.traitUses']).toEqual({});
    expect(Object.keys(updates).filter((k) => k.includes('card'))).toEqual([]);
  });
});

describe('Echo Sub-Choice Validation', () => {
  it('Elves choose Elemental Lineage via echo artifact, not racial sub-choice', () => {
    const def = getEcho('elorians')!;
    expect(def.subChoices === undefined || def.subChoices.length === 0).toBe(true);
  });

  it('Sentinels require an Order Protocol sub-choice (3 options)', () => {
    const def = getEcho('sentinels')!;
    expect(def.subChoices).toBeDefined();
    expect(def.subChoices!.length).toBe(3);
  });

  it('Humans / Dwarfs / Dragonborn have no sub-choices', () => {
    for (const key of ['humans', 'dwarfs', 'dragonborn']) {
      const def = getEcho(key)!;
      expect(def.subChoices === undefined || def.subChoices.length === 0).toBe(true);
    }
  });

  it('Unbound requires one Response identity (Beast, three Witches, three Banes)', () => {
    const def = getEcho('unbound')!;
    expect(def.subChoices).toBeDefined();
    expect(def.subChoices!.map((s) => s.key)).toEqual([
      'beast',
      'witch-root',
      'witch-ruin',
      'witch-blight',
      'bane-alchemist',
      'bane-greenwarden',
      'bane-relic-hunter',
    ]);
    expect(def.speed).toBe(8);
  });

  it('Titanborn have no Attribute-affinity sub-choice (Titan Scars is one artifact)', () => {
    const def = getEcho('titanborn')!;
    expect(def.subChoices === undefined || def.subChoices.length === 0).toBe(true);
  });

  it('Dragonborn require a Veiled Form, others do not', () => {
    expect(getEcho('dragonborn')!.veiledForm).toBe(true);
    expect(getEcho('humans')!.veiledForm).toBeFalsy();
    expect(getEcho('elorians')!.veiledForm).toBeFalsy();
  });

  it('racial core traits are empty (mechanics live on Echo artifacts)', () => {
    expect(getActiveEchoTraits('elorians', null)).toHaveLength(0);
    expect(getActiveEchoTraits('humans', null)).toHaveLength(0);
    expect(getActiveEchoTraits('elorians', 'fire')).toHaveLength(0);
  });

  it('getActiveEchoTraits includes sub-choice trait when chosen', () => {
    const traits = getActiveEchoTraits('sentinels', 'judicator');
    expect(traits).toHaveLength(1);
    expect(traits[0].id).toBe('judicator-order');
  });
});

describe('Echo Trait Mastery Rank Gating', () => {
  it('Titanborn Large Form is gated below MR 3', () => {
    expect(isTraitGatedByMr('unlock-mr3', 1)).toBe(true);
    expect(isTraitGatedByMr('unlock-mr3', 2)).toBe(true);
    expect(isTraitGatedByMr('unlock-mr3', 3)).toBe(false);
  });

  it('Titanborn True Form is gated below MR 6', () => {
    expect(isTraitGatedByMr('unlock-mr6-once', 5)).toBe(true);
    expect(isTraitGatedByMr('unlock-mr6-once', 6)).toBe(false);
    expect(isTraitGatedByMr('unlock-mr6', 6)).toBe(false);
  });
});

describe('Echo Lookup Helpers', () => {
  it('returns undefined for missing keys', () => {
    expect(getEcho('does-not-exist')).toBeUndefined();
  });
});
