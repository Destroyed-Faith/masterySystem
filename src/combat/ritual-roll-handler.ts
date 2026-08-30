/**
 * Ritual skill-check flow: declared Raises, Base TN = 8 × Ritual MR,
 * stones Sealed on the attempt (success or failure).
 */

import { masteryRoll } from '../dice/roll-handler.js';
import {
  appliedRitualEffects,
  calculateRitualRaiseTN,
  resolveRitualDeclaredOutcome,
  ritualStoneCost,
  type RitualDefinition,
} from '../utils/rituals.js';
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';

function availableStones(system: any): { ready: number; exhausted: number; available: number } {
  const ready = Math.max(0, Number(system.stones?.ready) || 0);
  const exhausted = Math.max(0, Number(system.stones?.exhausted) || 0);
  return { ready, exhausted, available: ready + exhausted };
}

async function sealRitualStones(
  actor: Actor,
  cost: number,
  placed?: string[],
): Promise<boolean> {
  const system = (actor as any).system;
  const updates: Record<string, number> = {};
  if (placed && placed.length === cost) {
    const counts: Record<string, number> = {};
    for (const attr of placed) counts[attr] = (counts[attr] || 0) + 1;
    for (const [attr, n] of Object.entries(counts)) {
      const current = Math.max(0, Number(system.stonePools?.[attr]?.current) || 0);
      if (current < n) return false;
      updates[`system.stonePools.${attr}.current`] = current - n;
      // Track the seal on the pool so regen / refills cannot resurrect these
      // stones before a Safe Haven Rest.
      const sealedNow = Math.max(0, Number(system.stonePools?.[attr]?.sealed) || 0);
      updates[`system.stonePools.${attr}.sealed`] = sealedNow + n;
    }
  } else {
    const { ready, exhausted, available } = availableStones(system);
    if (available < cost) return false;
    const fromReady = Math.min(ready, cost);
    const fromExhausted = cost - fromReady;
    updates['system.stones.ready'] = ready - fromReady;
    updates['system.stones.exhausted'] = exhausted - fromExhausted;
  }
  updates['system.stones.sealed'] = Math.max(0, Number(system.stones?.sealed) || 0) + cost;
  await (actor as any).update(updates);
  return true;
}

export async function showRitualRollDialog(actor: Actor, ritualId?: string): Promise<void> {
  const { RitualWorkshopDialog } = await import('../stones/ritual-workshop-dialog.js');
  await RitualWorkshopDialog.show(actor, ritualId);
}

export async function performRitualRoll(
  actor: Actor,
  ritual: RitualDefinition,
  opts: {
    skillKey: string;
    attributeKey: string;
    baseTn: number;
    ritualMR: number;
    gmMod: number;
    declaredRaises: number;
    placedAttrs?: string[];
  },
): Promise<void> {
  const system = (actor as any).system;
  const masteryRank = system.mastery?.rank || 2;
  const skillDef = SKILLS[opts.skillKey];
  if (!skillDef) {
    ui.notifications?.error('Invalid ritual skill.');
    return;
  }

  const cost = ritualStoneCost(ritual, opts.declaredRaises);
  const placed = Array.isArray(opts.placedAttrs) ? opts.placedAttrs.filter(Boolean) : [];
  if (placed.length && placed.length !== cost) {
    ui.notifications?.warn(`Place exactly ${cost} stone(s) for ${ritual.name} before rolling.`);
    return;
  }
  if (!placed.length) {
    const { available } = availableStones(system);
    if (available < cost) {
      ui.notifications?.warn(`Need ${cost} available stone(s) for ${ritual.name} (have ${available}).`);
      return;
    }
  }

  const sealed = await sealRitualStones(actor, cost, placed.length ? placed : undefined);
  if (!sealed) {
    ui.notifications?.warn(`Need ${cost} available stone(s) for ${ritual.name}.`);
    return;
  }

  let numDice = Number(system.attributes?.[opts.attributeKey]?.value) || 0;
  if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
    const pen = getEquippedPhysicalSkillPenaltyDice(actor);
    if (pen > 0) numDice = Math.max(1, numDice - pen);
  }

  const raiseTn = calculateRitualRaiseTN(opts.baseTn, opts.declaredRaises);
  const result = await masteryRoll({
    numDice,
    keepDice: masteryRank,
    skill: 0,
    tn: raiseTn,
    normalTn: opts.baseTn,
    declaredRaiseSlots: opts.declaredRaises,
    label: `Ritual: ${ritual.name}`,
    flavor: `Ritual MR ${opts.ritualMR}, Base TN ${opts.baseTn}, Raise ${opts.declaredRaises} (TN ${raiseTn})${opts.gmMod ? ` · situational ${opts.gmMod >= 0 ? '+' : ''}${opts.gmMod}` : ''}. Skill: ${skillDef.name}.`,
    actorId: (actor as any).id,
    skillKey: opts.skillKey,
    isSkillRoll: true,
    rollKind: 'skill',
    raiseModel: 'power',
    autoFailIntent: 'skill',
    checkContext: { skillKey: opts.skillKey },
  });

  const resolved = resolveRitualDeclaredOutcome({
    rollTotal: result.total,
    baseTn: opts.baseTn,
    declaredRaises: opts.declaredRaises,
  });
  const effects = resolved.success ? appliedRitualEffects(ritual, resolved.appliedRaise) : [];
  const heading = resolved.success
    ? resolved.kind === 'raise0' && opts.declaredRaises > 0
      ? `${ritual.name} — Success (Raise 0 only)`
      : `${ritual.name} — Success (Raise ${resolved.appliedRaise})`
    : `${ritual.name} — Failure`;

  const effectHtml = effects.length
    ? `<ol class="ritual-raise-effects">${effects.map((t, i) => `<li><strong>Raise ${i}:</strong> ${t}</li>`).join('')}</ol>`
    : '';

  // PG "Word of Recall" Special Cost Rule: while the mark exists the Stones
  // stay Sealed even across Safe Haven Rests. Track the mark on the actor.
  let wordOfRecallHtml = '';
  if (ritual.id === 'ritual-word-of-recall' && resolved.success) {
    try {
      const { setWordOfRecallMark } = await import('../stones/word-of-recall-mark.js');
      const attrCounts: Record<string, number> = {};
      for (const attr of placed) attrCounts[attr] = (attrCounts[attr] || 0) + 1;
      await setWordOfRecallMark(actor, {
        attrCounts,
        generic: placed.length ? 0 : cost,
        raise: resolved.appliedRaise,
      });
      wordOfRecallHtml =
        `<p><em>The mark is bound — these Stones stay Sealed while it exists.</em></p>` +
        `<button type="button" data-action="word-of-recall-release" data-actor-id="${(actor as any).id}">` +
        `Use / Dismiss Mark</button>`;
    } catch (err) {
      console.warn('Mastery System | Word of Recall mark tracking failed', err);
    }
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="ritual-roll-outcome">
        <h4>${heading}</h4>
        <p>Base TN ${opts.baseTn} · declared Raise ${opts.declaredRaises} (TN ${raiseTn}) · roll ${result.total}</p>
        ${effectHtml}
        <p><em>${cost} stone(s) Sealed until Safe Haven Rest${ritual.id === 'ritual-word-of-recall' ? ' (or until the mark is used or dismissed, then a Safe Haven Rest)' : ''}.</em></p>
        ${wordOfRecallHtml}
        ${!resolved.success ? '<p><em>The Ritual does not produce its intended effect. The GM may apply a fitting consequence.</em></p>' : ''}
      </div>
    `,
  } as any);
}
