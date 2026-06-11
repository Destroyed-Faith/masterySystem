/**
 * Echo System tests.
 *
 * Covers:
 *  - Slot unlocks at Mastery Ranks 1/2/3/4/5/6/7.
 *  - Card-use marking + Safe-Haven reset.
 *  - Sub-choice validation (Elves/Sentinels require, others don't).
 *  - Every card option references an existing SKILLS key.
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_ECHOS,
  buildFreshTraitUses,
  ECHO_KEY_ORDER,
  getActiveEchoTraits,
  getAllEchos,
  getCardOption,
  getEcho,
  getEchoCard,
  getEchoSubChoice,
  getUnlockedCardSlots,
  isMrPerRest,
  isTraitGatedByMr
} from '../src/utils/echos/index';
import { SKILLS } from '../src/utils/skills';

describe('Echo Catalog', () => {
  it('registers all 7 playable Echos in canonical order', () => {
    expect(ECHO_KEY_ORDER).toEqual([
      'humans',
      'dwarfs',
      'elves',
      'sentinels',
      'titanborn',
      'dragonborn',
      'unbound'
    ]);
    expect(getAllEchos().length).toBe(7);
    for (const key of ECHO_KEY_ORDER) {
      expect(ALL_ECHOS[key]).toBeDefined();
      expect(ALL_ECHOS[key].key).toBe(key);
    }
  });

  it('every Echo has exactly 4 cards, each with 4 options', () => {
    for (const def of getAllEchos()) {
      expect(def.deck.length).toBe(4);
      for (const card of def.deck) {
        expect(card.options.length).toBe(4);
        for (const opt of card.options) {
          expect(opt.id).toBeTruthy();
          expect(opt.label).toBeTruthy();
          expect(opt.description).toBeTruthy();
        }
      }
    }
  });

  it('every card option references an existing SKILLS key', () => {
    const missing: string[] = [];
    for (const def of getAllEchos()) {
      for (const card of def.deck) {
        for (const opt of card.options) {
          if (!SKILLS[opt.skill]) {
            missing.push(`${def.key}/${card.id}/${opt.id} -> ${opt.skill}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('Echo Slot Unlocks', () => {
  it('MR 1 yields 1 card slot (creation start)', () => {
    expect(getUnlockedCardSlots(1)).toBe(1);
  });
  it('MR 2 yields 2 card slots', () => {
    expect(getUnlockedCardSlots(2)).toBe(2);
  });
  it('MR 3 still yields 2 card slots', () => {
    expect(getUnlockedCardSlots(3)).toBe(2);
  });
  it('MR 4 yields 3 card slots', () => {
    expect(getUnlockedCardSlots(4)).toBe(3);
  });
  it('MR 5 still yields 3 card slots', () => {
    expect(getUnlockedCardSlots(5)).toBe(3);
  });
  it('MR 6 yields the full 4 card slots', () => {
    expect(getUnlockedCardSlots(6)).toBe(4);
  });
  it('MR 7+ never exceeds 4 card slots', () => {
    expect(getUnlockedCardSlots(7)).toBe(4);
    expect(getUnlockedCardSlots(99)).toBe(4);
  });
});

describe('Echo Card Usage + Safe-Haven Reset Simulation', () => {
  /**
   * Minimal simulation of the actor-side data flow without instantiating a full
   * Foundry actor. Mirrors the same shape used by `actor.update` in the sheet.
   */
  it('marks a card as used and resets it via fresh cardUses', () => {
    const def = getEcho('humans')!;
    const actorEcho = {
      key: def.key,
      subChoiceKey: '',
      veiledFormKey: '',
      selectedCardIds: [def.deck[0].id],
      cardUses: {} as Record<string, boolean>,
      traitUses: buildFreshTraitUses(def.key, null, 1)
    };

    actorEcho.cardUses[def.deck[0].id] = true;
    expect(actorEcho.cardUses[def.deck[0].id]).toBe(true);

    // Safe-Haven Rest replaces cardUses with {} and re-initializes traitUses.
    actorEcho.cardUses = {};
    actorEcho.traitUses = buildFreshTraitUses(def.key, null, 3);
    expect(actorEcho.cardUses[def.deck[0].id]).toBeUndefined();
  });

  it('buildFreshTraitUses respects Mastery Rank for mr-per-rest sub-choice traits', () => {
    const sc = getEchoSubChoice('sentinels', 'judicators')!;
    expect(isMrPerRest(sc.trait.usage)).toBe(true);

    const usesAtMr1 = buildFreshTraitUses('sentinels', 'judicators', 1);
    const usesAtMr3 = buildFreshTraitUses('sentinels', 'judicators', 3);
    expect(usesAtMr1[sc.trait.id]).toBe(1);
    expect(usesAtMr3[sc.trait.id]).toBe(3);
  });

  it('buildFreshTraitUses returns empty when no active traits', () => {
    expect(buildFreshTraitUses('humans', null, 3)).toEqual({});
    expect(buildFreshTraitUses('elves', null, 3)).toEqual({});
  });
});

describe('Echo Sub-Choice Validation', () => {
  it('Elves choose Elemental Lineage via echo artifact, not racial sub-choice', () => {
    const def = getEcho('elves')!;
    expect(def.subChoices === undefined || def.subChoices.length === 0).toBe(true);
  });

  it('Sentinels require an Order Protocol sub-choice (3 options)', () => {
    const def = getEcho('sentinels')!;
    expect(def.subChoices).toBeDefined();
    expect(def.subChoices!.length).toBe(3);
  });

  it('Humans / Dwarfs / Titanborn / Dragonborn / Unbound have no sub-choices', () => {
    for (const key of ['humans', 'dwarfs', 'titanborn', 'dragonborn', 'unbound']) {
      const def = getEcho(key)!;
      expect(def.subChoices === undefined || def.subChoices.length === 0).toBe(true);
    }
  });

  it('Dragonborn require a Veiled Form, others do not', () => {
    expect(getEcho('dragonborn')!.veiledForm).toBe(true);
    expect(getEcho('humans')!.veiledForm).toBeFalsy();
    expect(getEcho('elves')!.veiledForm).toBeFalsy();
  });

  it('racial core traits are empty (mechanics live on Echo artifacts)', () => {
    expect(getActiveEchoTraits('elves', null)).toHaveLength(0);
    expect(getActiveEchoTraits('humans', null)).toHaveLength(0);
    expect(getActiveEchoTraits('elves', 'fire')).toHaveLength(0);
  });

  it('getActiveEchoTraits includes sub-choice trait when chosen', () => {
    const traits = getActiveEchoTraits('sentinels', 'judicators');
    expect(traits).toHaveLength(1);
    expect(traits[0].id).toBe('sentence-engine');
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
  it('getEchoCard returns the right card, getCardOption returns the right option', () => {
    const def = getEcho('humans')!;
    const card = getEchoCard('humans', def.deck[0].id);
    expect(card?.id).toBe(def.deck[0].id);
    const opt = getCardOption('humans', def.deck[0].id, def.deck[0].options[2].id);
    expect(opt?.id).toBe(def.deck[0].options[2].id);
  });

  it('returns undefined for missing keys', () => {
    expect(getEcho('does-not-exist')).toBeUndefined();
    expect(getEchoCard('humans', 'missing-card')).toBeUndefined();
    expect(getCardOption('humans', 'missing-card', 'missing-opt')).toBeUndefined();
  });
});
