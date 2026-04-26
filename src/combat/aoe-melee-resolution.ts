/**
 * Melee weapon AoE — Body save escape for secondary targets + power-only damage.
 */

import { masteryRoll } from '../dice/roll-handler.js';
import { getRoundState, spendReactionAction } from './action-economy.js';
import { countNaturalEights } from './damage-mitigation.js';

/** Body save DC to escape secondary AoE damage (attacker mastery rank). */
export function aoeSecondaryBodySaveDc(masteryRank: number): number {
  const r = Math.max(1, Math.min(6, Math.floor(Number(masteryRank) || 1)));
  return r * 8;
}

function vitalityPoolSize(actor: any): number {
  const v = actor?.system?.attributes?.vitality?.value;
  return Math.max(1, Math.floor(Number(v) || 1));
}

/**
 * After primary damage is resolved: each secondary may spend a Reaction to roll Body vs DC; success skips AoE damage.
 */
export async function resolveAoeMeleeSecondaries(params: {
  attacker: any;
  attackerMasteryRank: number;
  secondaryTokenIds: string[];
  powerBonusDice: number;
}): Promise<void> {
  const { attacker, attackerMasteryRank, secondaryTokenIds, powerBonusDice } = params;
  if (!secondaryTokenIds.length || powerBonusDice <= 0) return;

  const dc = aoeSecondaryBodySaveDc(attackerMasteryRank);
  const combat = (game as any).combat as Combat | null;

  for (const tid of secondaryTokenIds) {
    const tok = (canvas as any)?.tokens?.get?.(tid);
    const defender = tok?.actor;
    if (!defender) continue;

    let escaped = false;
    const rsReact = getRoundState(defender, combat);
    const reactions = Math.max(
      0,
      (rsReact.reactionActions?.total ?? 0) - (rsReact.reactionActions?.used ?? 0),
    );
    if (reactions > 0) {
      const spend = await Dialog.confirm({
        title: `AoE — ${defender.name}`,
        content: `<p>Spend <strong>1 Reaction</strong> to roll <strong>Body</strong> vs TN <strong>${dc}</strong> and avoid <strong>${powerBonusDice}d8</strong> AoE damage?</p>`,
        yes: () => true,
        no: () => false,
        defaultYes: false,
      } as any);
      if (spend) {
        const consumed = await spendReactionAction(defender, combat);
        if (consumed) {
          const numDice = vitalityPoolSize(defender);
          const keep = Math.max(
            1,
            Math.floor(Number((defender as any).system?.mastery?.rank) || attackerMasteryRank || 2),
          );
          const res = await masteryRoll({
            numDice,
            keepDice: keep,
            skill: 0,
            tn: dc,
            label: `Body save (escape AoE)`,
            flavor: `vs TN ${dc} to avoid secondary AoE damage`,
            actorId: (defender as any).id,
            rollKind: 'saveBody',
            isSaveRoll: true,
            autoFailIntent: 'skill',
            checkContext: { tags: [] },
          });
          escaped = !!res.success;
          await ChatMessage.create({
            user: (game as any).user?.id,
            speaker: ChatMessage.getSpeaker({ actor: defender, token: tok?.document }),
            content: `<p><strong>${defender.name}</strong> — Body save vs ${dc}: ${escaped ? '<strong>Success</strong> — no AoE damage.' : '<strong>Failure</strong> — takes AoE damage.'}</p>`,
          } as any);
        }
      }
    }

    if (escaped) continue;

    if (typeof defender.prepareDerivedData === 'function') {
      try {
        defender.prepareDerivedData();
      } catch {
        /* ignore */
      }
    }

    const spec = `${powerBonusDice}d8x`;
    const RollCls = (globalThis as any).Roll;
    const r = RollCls?.create
      ? await RollCls.create(spec).evaluate({ async: true })
      : null;
    const total = Math.max(0, Math.floor(Number(r?.total) || 0));
    const rollsArr = r ? [r] : [];
    const c8 = countNaturalEights(rollsArr);

    const { applyDamageToTargetFromAoe } = await import('../dice/damage-dialog.js');
    const mit = await applyDamageToTargetFromAoe(defender, total, attacker, c8);
    const mitLine = mit?.breakdownLine ? `<p>${mit.breakdownLine}</p>` : '';
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content: `<p><strong>AoE secondary</strong> → <strong>${defender.name}</strong>: ${total} (${powerBonusDice}d8 power only) ${mitLine}</p>`,
    } as any);
  }
}
