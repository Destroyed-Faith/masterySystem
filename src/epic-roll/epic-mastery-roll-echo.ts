/**
 * Epic Mastery Roll — Echo Card offers after a successful skill check.
 */

import { countMarginRaises } from '../dice/roll-handler.js';
import { getCardOption, getEcho, getEchoCard } from '../utils/echos/index.js';
import type { EpicMasteryRollSession, EpicParticipantResult } from './epic-mastery-roll-types.js';
import { submitEpicParticipantResult } from './epic-mastery-roll-roll.js';

export interface EpicEchoCardOffer {
  cardId: string;
  cardName: string;
  optionId: string;
  optionLabel: string;
  description: string;
  skillKey: string;
  trigger: string;
}

export function getEpicEchoCardOffers(actor: Actor, skillKey: string): EpicEchoCardOffer[] {
  const system = (actor as any).system;
  const echo = system?.echo || {};
  const echoKey = echo.key as string | undefined;
  if (!echoKey || !skillKey) return [];

  const selectedCardIds: string[] = Array.isArray(echo.selectedCardIds)
    ? echo.selectedCardIds.filter((id: unknown) => typeof id === 'string')
    : [];
  const cardUses = (echo.cardUses || {}) as Record<string, boolean>;
  const offers: EpicEchoCardOffer[] = [];

  for (const cardId of selectedCardIds) {
    if (cardUses[cardId] === true) continue;
    const card = getEchoCard(echoKey, cardId);
    if (!card) continue;

    for (const option of card.options) {
      if (option.skill !== skillKey) continue;
      offers.push({
        cardId,
        cardName: card.name,
        optionId: option.id,
        optionLabel: option.label,
        description: option.description,
        skillKey: option.skill,
        trigger: card.trigger,
      });
    }
  }

  return offers;
}

function marginRaisesForResult(result: EpicParticipantResult): number {
  const tn = Math.max(0, Math.floor(result.normalTn ?? 0));
  if (!result.success || tn <= 0) return 0;
  return countMarginRaises(result.total, tn);
}

async function postEchoFlavorChat(
  actor: Actor,
  echoKey: string,
  cardName: string,
  optionLabel: string,
  description: string,
): Promise<void> {
  const def = getEcho(echoKey);
  const echoName = def?.name || echoKey;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="echo-roll-flavor">
        <div><strong>${echoName} — ${cardName}</strong></div>
        <div><em>${optionLabel}</em></div>
        <div class="echo-roll-desc">${description}</div>
      </div>
    `,
  } as any);
}

export function applyEchoCardToParticipantResult(
  result: EpicParticipantResult,
  echoKey: string,
  cardId: string,
  optionId: string,
): EpicParticipantResult | null {
  if (!result.success) return null;

  const card = getEchoCard(echoKey, cardId);
  const option = getCardOption(echoKey, cardId, optionId);
  if (!card || !option) return null;

  const raises = marginRaisesForResult(result);

  return {
    ...result,
    raises,
    awaitingConfirm: false,
    rollPayload: undefined,
    echoCardUsed: {
      cardId,
      optionId,
      cardName: card.name,
      optionLabel: option.label,
    },
  };
}

export async function applyEpicEchoCardToResult(
  session: EpicMasteryRollSession,
  actorId: string,
  cardId: string,
  optionId: string,
): Promise<EpicParticipantResult | null> {
  const draft = session.results[actorId];
  if (!draft?.success || draft.echoCardUsed) return null;
  if (session.roll.kind !== 'skill') return null;

  const actor = game.actors?.get(actorId);
  if (!actor) return null;

  const echoKey = (actor as any).system?.echo?.key as string | undefined;
  if (!echoKey) return null;

  const selectedCardIds: string[] = Array.isArray((actor as any).system?.echo?.selectedCardIds)
    ? (actor as any).system.echo.selectedCardIds
    : [];
  if (!selectedCardIds.includes(cardId)) return null;

  const cardUses = ((actor as any).system?.echo?.cardUses || {}) as Record<string, boolean>;
  if (cardUses[cardId] === true) return null;

  const option = getCardOption(echoKey, cardId, optionId);
  const card = getEchoCard(echoKey, cardId);
  if (!card || !option || option.skill !== session.roll.skillKey) return null;

  const updated = applyEchoCardToParticipantResult(draft, echoKey, cardId, optionId);
  if (!updated) return null;

  await postEchoFlavorChat(actor, echoKey, card.name, option.label, option.description);
  await actor.update({ [`system.echo.cardUses.${cardId}`]: true });
  await submitEpicParticipantResult(session.id, updated, { staged: false });
  return updated;
}
