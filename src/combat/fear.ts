/**
 * Fear (Players Guide) — accumulated dread that removes dice from attribute pools.
 * Only GM-driven or explicit rule calls should invoke Fear Checks.
 */

export const FEAR_CHECK_TN_NORMAL = 8;
export const FEAR_CHECK_TN_EXTREME = 12;

export function getFear(actor: any): number {
  return Math.max(0, Math.floor(Number(actor?.system?.fear) || 0));
}

export async function setFear(actor: any, value: number): Promise<void> {
  if (!actor?.update) return;
  const v = Math.max(0, Math.floor(Number(value) || 0));
  await actor.update({ 'system.fear': v });
}

/** Apply a signed delta; returns the new Fear total. */
export async function applyFearDelta(actor: any, delta: number): Promise<number> {
  const next = Math.max(0, getFear(actor) + Math.floor(Number(delta) || 0));
  await setFear(actor, next);
  return next;
}

export interface FearCheckResult {
  rolled: boolean;
  total?: number;
  tn: number;
  success?: boolean;
  fearBefore?: number;
  fearAfter?: number;
  poolDice?: number;
}

/**
 * Resolve k1 Fear Check (Resolve pool, keep 1). No Skill Points, no Raises.
 * Failure adds +1 Fear (accumulates).
 */
export async function runFearCheck(
  actor: any,
  tn: number = FEAR_CHECK_TN_NORMAL,
): Promise<FearCheckResult> {
  if (!actor) return { rolled: false, tn };
  const targetTn = Math.max(0, Math.floor(Number(tn) || FEAR_CHECK_TN_NORMAL));
  const fearBefore = getFear(actor);
  const resolveRaw = Math.max(
    0,
    Math.floor(Number(actor?.system?.attributes?.resolve?.value) || 0),
  );

  const { finalizeRolledPool } = await import('../dice/pool-finalize.js');
  const finalized = finalizeRolledPool(actor, resolveRaw, 1, {
    rollKind: 'generic',
    poolAttribute: 'resolve',
    applyPoolPenalties: true,
  });
  const poolDice = finalized.numDice;

  const { masteryRoll } = await import('../dice/roll-handler.js');
  const label = `Fear Check (Resolve k1 vs TN ${targetTn})`;
  const flavorParts = [
    'No Skill Points / Raises',
    ...finalized.notes,
  ];
  if (poolDice <= 0) {
    const fearAfter = await applyFearDelta(actor, 1);
    try {
      await (globalThis as any).ChatMessage?.create?.({
        speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor }),
        content:
          `<div class="mastery-fear-check"><strong>${actor.name}</strong> — ${label}: ` +
          `<strong>Pool 0</strong> → Failure. Fear ${fearBefore} → <strong>${fearAfter}</strong>.</div>`,
      });
    } catch {
      /* chat optional in tests */
    }
    return {
      rolled: true,
      total: 0,
      tn: targetTn,
      success: false,
      fearBefore,
      fearAfter,
      poolDice: 0,
    };
  }

  const result = await masteryRoll({
    numDice: poolDice,
    keepDice: 1,
    skill: 0,
    tn: targetTn,
    normalTn: targetTn,
    label,
    flavor: flavorParts.join(' · '),
    actorId: String(actor.id ?? ''),
    actorRef: actor,
    rollKind: 'generic',
    poolAttribute: 'resolve',
    applyPoolPenalties: false,
    applyFear: false,
    guaranteedEights: 0,
    raiseModel: 'margin',
    isSkillRoll: false,
  });

  const total = Math.floor(Number(result?.total) || 0);
  const success = total >= targetTn;
  let fearAfter = fearBefore;
  if (!success) {
    fearAfter = await applyFearDelta(actor, 1);
  }

  return {
    rolled: true,
    total,
    tn: targetTn,
    success,
    fearBefore,
    fearAfter,
    poolDice,
  };
}

/** GM dialog: pick TN 8 or 12, then roll a Fear Check for this actor. */
export async function promptGmFearCheck(actor: any): Promise<FearCheckResult | null> {
  if (!actor) return null;
  const DialogCls = (globalThis as any).Dialog;
  if (!DialogCls) {
    return runFearCheck(actor, FEAR_CHECK_TN_NORMAL);
  }
  return new Promise((resolve) => {
    new DialogCls(
      {
        title: `Fear Check — ${actor.name}`,
        content: `<p>Roll <strong>Resolve k1</strong>. Current Fear: <strong>${getFear(actor)}</strong>.</p>`,
        buttons: {
          normal: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: `TN ${FEAR_CHECK_TN_NORMAL} (normal)`,
            callback: () => {
              void runFearCheck(actor, FEAR_CHECK_TN_NORMAL).then(resolve);
            },
          },
          extreme: {
            icon: '<i class="fas fa-skull"></i>',
            label: `TN ${FEAR_CHECK_TN_EXTREME} (extreme)`,
            callback: () => {
              void runFearCheck(actor, FEAR_CHECK_TN_EXTREME).then(resolve);
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => resolve(null),
          },
        },
        default: 'normal',
      },
      { width: 360 },
    ).render(true);
  });
}
