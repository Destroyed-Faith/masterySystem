import { describe, expect, it } from 'vitest';
import {
  inferProfessionXpInvested,
  professionIdentityKey,
  specializationXpCostFromTo,
} from '../src/rules/index';

describe('inferProfessionXpInvested', () => {
  it('uses stored xpInvested when present', () => {
    expect(
      inferProfessionXpInvested({
        name: 'Burglar',
        rank: 5,
        startingSlot: true,
        xpInvested: 12,
      }),
    ).toBe(12);
  });

  it('starting slots are free through Rank 2', () => {
    expect(
      inferProfessionXpInvested({
        id: professionIdentityKey('Blacksmith'),
        name: 'Blacksmith',
        rank: 2,
        startingSlot: true,
      }),
    ).toBe(0);
    expect(
      inferProfessionXpInvested({
        id: professionIdentityKey('Blacksmith'),
        name: 'Blacksmith',
        rank: 5,
        startingSlot: true,
      }),
    ).toBe(specializationXpCostFromTo(2, 5));
  });

  it('GM grants count 0 until XP is tracked', () => {
    expect(
      inferProfessionXpInvested({
        name: 'Sailor',
        rank: 4,
        gmGranted: true,
      }),
    ).toBe(0);
  });

  it('learned Professions count the full ladder from 0', () => {
    expect(
      inferProfessionXpInvested({
        name: 'Courier',
        rank: 1,
      }),
    ).toBe(4);
    expect(
      inferProfessionXpInvested({
        name: 'Courier',
        rank: 2,
      }),
    ).toBe(8);
  });

  it('Perception is free through Rank 2', () => {
    expect(
      inferProfessionXpInvested({
        id: 'profession:perception',
        name: 'Perception',
        rank: 2,
      }),
    ).toBe(0);
    expect(
      inferProfessionXpInvested({
        id: 'profession:perception',
        name: 'Perception',
        rank: 4,
      }),
    ).toBe(specializationXpCostFromTo(2, 4));
  });
});
