/**
 * Foundry prompts for Safe Movement (after confirm) and Slip (on an enemy miss).
 */

import {
  getRoundState,
  refundMovementAction,
  setRoundState,
  spendMovementAction,
} from '../combat/action-economy.js';
import {
  PENDING_SAFE_MOVEMENT_FLAG,
  PENDING_SLIP_FLAG,
  SLIP_MOVEMENT_ACTIVE_FLAG,
  canCommitSafeMovement,
  markSlipUsed,
  readSlipArm,
  safeMovementMeters,
  slipCanTrigger,
  type SlipTriggerEvent,
} from './agility-movement.js';

function actorToken(actor: any): any | null {
  const id = String(actor?.id || '');
  if (!id) return null;
  const placeables = (globalThis as any).canvas?.tokens?.placeables ?? [];
  return placeables.find((token: any) => String(token?.actor?.id || '') === id) ?? null;
}

async function confirmChoice(title: string, content: string, yes: string, no: string): Promise<boolean | null> {
  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.confirm !== 'function') return null;
  try {
    return !!(await DialogV2.confirm({
      window: { title },
      content: `<p>${content}</p>`,
      yes: { label: yes },
      no: { label: no },
    }));
  } catch {
    return false;
  }
}

async function postChat(content: string): Promise<void> {
  const ChatMessage = (globalThis as any).ChatMessage;
  if (typeof ChatMessage?.create !== 'function') return;
  try {
    await ChatMessage.create({ content });
  } catch {
    /* chat is not the movement itself */
  }
}

/**
 * Resolve committed Safe Movement. False leaves the ticket pending (Later / cancelled move).
 * True means the choice is finished: the move replaced Movement, or Movement was already spent.
 */
export async function presentSafeMovement(actor: any, tier: number): Promise<boolean> {
  const meters = safeMovementMeters(tier);
  const name = String(actor?.name || 'Someone');
  const combat = (globalThis as any).game?.combat ?? null;
  const roundState = getRoundState(actor, combat);
  const attackUsed = roundState.attackActions.used;
  const reactionUsed = roundState.reactionActions.used;
  const budget = {
    movementTotal: roundState.movementActions.total,
    movementUsed: roundState.movementActions.used,
    movementPowerUsed: !!roundState.movementPowerUsedThisRound,
    attackUsed,
    reactionUsed,
  };
  if (!canCommitSafeMovement(budget)) {
    await postChat(
      `<div class="mastery-stone-resolution"><p><strong>${name}</strong> — Safe Movement</p><p>Normal Movement is already spent, so Safe Movement does not grant another move.</p></div>`,
    );
    await actor?.unsetFlag?.('mastery-system', PENDING_SAFE_MOVEMENT_FLAG);
    return true;
  }
  const choice = await confirmChoice(
    'Safe Movement',
    `${name}: move up to <strong>${meters} m</strong> as your Movement. This replaces normal Movement, does not cost an Attack Action or a Reaction, and does not provoke movement-triggered Reactions.`,
    'Move',
    'Later',
  );
  if (choice !== true) return false;

  const token = actorToken(actor);
  if (!token) {
    (globalThis as any).ui?.notifications?.warn('Safe Movement needs a token on the canvas.');
    return false;
  }

  const previous = {
    movementPowerUsed: !!roundState.movementPowerUsedThisRound,
    safeMovementThisTurn: !!roundState.safeMovementThisTurn,
  };
  const spent = await spendMovementAction(actor, combat);
  if (!spent) {
    await postChat(
      `<div class="mastery-stone-resolution"><p><strong>${name}</strong> — Safe Movement</p><p>Normal Movement is already spent.</p></div>`,
    );
    return true;
  }
  const marked = getRoundState(actor, combat);
  marked.safeMovementThisTurn = true;
  marked.attackActions.used = attackUsed;
  marked.reactionActions.used = reactionUsed;
  if (marked.movementActions.used >= marked.movementActions.total) {
    marked.movementPowerUsedThisRound = true;
  }
  await setRoundState(actor, marked);

  const { startGuidedMovement } = await import('../token-action-selector.js');
  const moved = await startGuidedMovement(token, {
    id: 'stone-safe-movement',
    name: 'Safe Movement',
    description: `Move up to ${meters} m`,
    slot: 'movement',
    source: 'maneuver',
    range: meters,
    costsMovement: false,
    costsAction: false,
  } as any);
  if (!moved) {
    await refundMovementAction(actor, combat);
    const restored = getRoundState(actor, combat);
    restored.movementPowerUsedThisRound = previous.movementPowerUsed;
    restored.safeMovementThisTurn = previous.safeMovementThisTurn;
    restored.attackActions.used = attackUsed;
    restored.reactionActions.used = reactionUsed;
    await setRoundState(actor, restored);
    return false;
  }
  await actor?.unsetFlag?.('mastery-system', PENDING_SAFE_MOVEMENT_FLAG);
  await postChat(
    `<div class="mastery-stone-resolution"><p><strong>${name}</strong> — Safe Movement</p><p>Moved up to <strong>${meters} m</strong>. This was your Movement for the Turn. Normal Movement is no longer available. Movement-triggered Reactions do not apply.</p></div>`,
  );
  return true;
}

/** Offer Slip after a qualifying miss. Declining leaves the opportunity for a later miss. */
export async function maybeOfferSlip(args: {
  defender: any;
  attacker: any;
  hit: boolean;
  isAttack: boolean;
}): Promise<void> {
  const defender = args.defender;
  if (!defender) return;
  const slip = readSlipArm(defender.getFlag?.('mastery-system', PENDING_SLIP_FLAG));
  const event: SlipTriggerEvent = {
    defenderId: String(defender.id || slip?.actorId || ''),
    attackerId: String(args.attacker?.id || ''),
    hit: args.hit,
    isAttack: args.isAttack,
  };
  if (!slip || !slipCanTrigger(slip, event)) return;
  const name = String(defender.name || 'Someone');
  const choice = await confirmChoice(
    'Slip',
    `${name}: an Attack missed you. Slip up to <strong>${slip.meters} m</strong>? This does not use your normal Movement and does not provoke movement-triggered Reactions.`,
    'Slip',
    'Not now',
  );
  if (choice !== true) return;
  const token = actorToken(defender);
  if (!token) {
    (globalThis as any).ui?.notifications?.warn('Slip needs a token on the canvas.');
    return;
  }
  await defender.setFlag?.('mastery-system', SLIP_MOVEMENT_ACTIVE_FLAG, true);
  const { startGuidedMovement } = await import('../token-action-selector.js');
  const moved = await startGuidedMovement(token, {
    id: 'stone-slip',
    name: 'Slip',
    description: `Slip up to ${slip.meters} m`,
    slot: 'movement',
    source: 'maneuver',
    range: slip.meters,
    costsMovement: false,
    costsAction: false,
  } as any);
  if (!moved) {
    await defender.unsetFlag?.('mastery-system', SLIP_MOVEMENT_ACTIVE_FLAG);
    return;
  }
  await defender.setFlag?.('mastery-system', PENDING_SLIP_FLAG, markSlipUsed(slip));
  await postChat(
    `<div class="mastery-stone-resolution"><p><strong>${name}</strong> — Slip</p><p>Moved up to <strong>${slip.meters} m</strong> after an Attack missed. Normal Movement was not spent. Movement-triggered Reactions do not apply. Slip is used until your next Turn.</p></div>`,
  );
}