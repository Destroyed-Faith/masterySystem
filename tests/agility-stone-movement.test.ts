/**
 * Safe Movement replaces normal Movement. Slip is a separate reaction to a miss.
 */

import { describe, expect, it } from 'vitest';
import { STONE_POWERS } from '../src/stones/stone-powers';
import {
  simulateConfirmAssignment,
  stoneResolutionKind,
} from '../src/stones/stone-resolution';
import {
  canCommitSafeMovement,
  commitSafeMovement,
  expireSlipOnOwnTurnStart,
  markSlipUsed,
  movementProvokesReactions,
  safeMovementMeters,
  slipCanTrigger,
  slipMeters,
  type MovementBudget,
  type SlipArm,
} from '../src/stones/agility-movement';

function budget(partial: Partial<MovementBudget> = {}): MovementBudget {
  return {
    movementTotal: 1,
    movementUsed: 0,
    movementPowerUsed: false,
    attackUsed: 0,
    reactionUsed: 0,
    ...partial,
  };
}

function armedSlip(meters = 12): SlipArm {
  return {
    meters,
    used: false,
    actorId: 'hero',
    armedCombatId: 'combat-1',
    armedRound: 1,
    armedTurn: 0,
  };
}

const enemyMiss = {
  defenderId: 'hero',
  attackerId: 'wolf',
  hit: false,
  isAttack: true,
};

describe('Safe Movement', () => {
  it('uses 4/8/12/16 m and waits for a movement resolution after confirm', () => {
    expect([1, 2, 3, 4].map((tier) => safeMovementMeters(tier))).toEqual([4, 8, 12, 16]);
    expect(safeMovementMeters(5)).toBe(0);
    expect(stoneResolutionKind('agility.safeMovement')).toBe('interactive');
    expect(STONE_POWERS['agility.safeMovement'].tiers.map((tier) => tier.value)).toEqual([4, 8, 12, 16]);
  });

  it('consumes normal Movement and leaves Attack Actions and Reactions alone', () => {
    const next = commitSafeMovement(budget({ attackUsed: 0, reactionUsed: 1 }));
    expect(next).toMatchObject({
      movementUsed: 1,
      movementTotal: 1,
      movementPowerUsed: true,
      attackUsed: 0,
      reactionUsed: 1,
    });
    expect(canCommitSafeMovement(next!)).toBe(false);
    expect(movementProvokesReactions('safe')).toBe(false);
  });

  it('cannot be used after normal Movement, and does not add a free extra move', () => {
    const spent = budget({ movementUsed: 1 });
    expect(canCommitSafeMovement(spent)).toBe(false);
    expect(commitSafeMovement(spent)).toBeNull();
    expect(spent.movementUsed).toBe(1);
  });

  it('can spend a Movement action another rule already granted', () => {
    const extra = budget({ movementTotal: 2, movementUsed: 1 });
    const next = commitSafeMovement(extra);
    expect(next).toMatchObject({ movementUsed: 2, movementPowerUsed: true });
    const beforeAnyMove = commitSafeMovement(budget({ movementTotal: 2, movementUsed: 0 }));
    expect(beforeAnyMove).toMatchObject({ movementUsed: 1, movementPowerUsed: false });
  });

  it('does not change the movement budget merely by allocating the power', async () => {
    const actor: any = {
      id: 'hero',
      name: 'Hero',
      _round: { moveBonusMeters: 0, movementActions: { total: 1, used: 0 } },
      async setFlag(_ns: string, key: string, value: unknown) {
        this[key] = value;
      },
    };
    await STONE_POWERS['agility.safeMovement'].apply({
      actor,
      combatant: {} as any,
      tier: 3,
      cost: 4,
    });
    expect(actor.pendingSafeMovement).toEqual({ meters: 12 });
    expect(actor._round.moveBonusMeters).toBe(0);
    expect(actor._round.movementActions.used).toBe(0);
  });
});

describe('Slip', () => {
  it('uses 4/8/12/16 m and is armed on confirm without moving', () => {
    expect([1, 2, 3, 4].map((tier) => slipMeters(tier))).toEqual([4, 8, 12, 16]);
    expect(stoneResolutionKind('agility.slip')).toBe('automatic');
    expect(STONE_POWERS['agility.slip'].tiers.map((tier) => tier.value)).toEqual([4, 8, 12, 16]);
    const fired: string[] = [];
    const committed = simulateConfirmAssignment(
      { locked: false, fired: [], queue: null },
      {
        combatId: 'combat-1',
        round: 1,
        powers: [
          { powerId: 'agility.slip', tier: 3 },
          { powerId: 'agility.safeMovement', tier: 2 },
        ],
        onAutomatic: (power) => fired.push(power.powerId),
      },
    );
    expect(fired).toEqual(['agility.slip']);
    expect(committed.queue?.tickets.map((ticket) => ticket.powerId)).toEqual(['agility.safeMovement']);
    expect(committed.locked).toBe(true);
  });

  it('offers Slip only when an enemy Attack misses you', () => {
    const slip = armedSlip();
    expect(slipCanTrigger(slip, enemyMiss)).toBe(true);
    expect(slipCanTrigger(slip, { ...enemyMiss, hit: true })).toBe(false);
    expect(slipCanTrigger(slip, { ...enemyMiss, isAttack: false })).toBe(false);
    expect(slipCanTrigger(slip, { ...enemyMiss, defenderId: 'ally' })).toBe(false);
    expect(slipCanTrigger(slip, { ...enemyMiss, attackerId: 'hero', defenderId: 'hero' })).toBe(false);
  });

  it('does not spend normal Movement, and declining leaves the opportunity', () => {
    const open = budget();
    const slip = armedSlip(8);
    expect(slipCanTrigger(slip, enemyMiss)).toBe(true);
    expect(open.movementUsed).toBe(0);
    expect(canCommitSafeMovement(open)).toBe(true);
    expect(movementProvokesReactions('slip')).toBe(false);
    expect(slip.used).toBe(false);
  });

  it('resolves only once, then expires at the start of the next Turn if unused', () => {
    const once = markSlipUsed(armedSlip());
    expect(slipCanTrigger(once, enemyMiss)).toBe(false);
    const expired = expireSlipOnOwnTurnStart(armedSlip());
    expect(expired).toBeNull();
    expect(slipCanTrigger(expired, enemyMiss)).toBe(false);
  });
});

describe('Safe Movement and Slip together', () => {
  it('keeps the Movement budget and the Slip trigger independent', () => {
    const afterSafe = commitSafeMovement(budget({ attackUsed: 0, reactionUsed: 0 }));
    const slip = armedSlip(16);
    expect(afterSafe).toMatchObject({
      movementUsed: 1,
      movementPowerUsed: true,
      attackUsed: 0,
      reactionUsed: 0,
    });
    expect(slipCanTrigger(slip, enemyMiss)).toBe(true);
    expect(afterSafe!.movementUsed).toBe(1);
    expect(canCommitSafeMovement(afterSafe!)).toBe(false);
    expect(movementProvokesReactions('normal')).toBe(true);
    expect(movementProvokesReactions('safe')).toBe(false);
    expect(movementProvokesReactions('slip')).toBe(false);
  });
});
