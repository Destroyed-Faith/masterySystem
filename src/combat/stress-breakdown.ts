/**
 * Stress Breakdown Check — Players Guide (~9214–9257).
 *
 * When the Stress Track fills (all bars empty / Breakdown reached):
 *  1. Meltdown (GM narrative: catatonia / panic / possession).
 *  2. Wits Attribute Check, keep = MR, TN = 8 × MR
 *     (no Skill Points, no Vitality expenditure).
 *  3. Success (Virtue) → reset track to Clear; next action +1 Keep.
 *  4. Failure (Affliction) → reset track; choose:
 *       A) Scar of Will — Mental Restriction (2 pts) + recover 2 Reroll Points
 *       B) Push It Down — GM gains 1d8 Misfortune Tokens
 */

import {
  applyStress,
  isStressTrackCollapsed,
  resetStressBarsToClear,
} from '../utils/calculations.js';
import { calculateDisadvantagePoints } from '../system/disadvantages.js';
import type { HealthBar } from '../types/actor.js';

const FLAG_SCOPE = 'mastery-system';
const FLAG_PENDING = 'stressBreakdownPending';
const FLAG_VIRTUE_KEEP = 'stressBreakdownVirtueKeep';
const MISFORTUNE_SETTING = 'misfortuneTokens';

let hooksRegistered = false;
let settingsRegistered = false;

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function masteryRankOf(actor: any): number {
  return Math.max(1, Math.min(16, Math.floor(Number(actor?.system?.mastery?.rank) || 1)));
}

function userMayActForActor(actor: any): boolean {
  const u = (globalThis as any).game?.user;
  if (!u) return false;
  if (u.isGM) return true;
  return !!actor?.isOwner;
}

export function registerStressBreakdownSettings(): void {
  if (settingsRegistered) return;
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, MISFORTUNE_SETTING, {
      name: 'Misfortune Tokens (GM)',
      hint: 'Tokens from Stress Breakdown “Push It Down”. Spend to force a reroll, add a complication, or worsen a failure (max 1 per roll).',
      scope: 'world',
      config: true,
      type: Number,
      default: 0,
    });
    settingsRegistered = true;
  } catch (err) {
    console.warn('Mastery System | misfortuneTokens setting register failed', err);
  }
}

async function getMisfortuneTokens(): Promise<number> {
  const g = globalThis as any;
  try {
    return Math.max(0, Math.floor(Number(g.game?.settings?.get?.(FLAG_SCOPE, MISFORTUNE_SETTING)) || 0));
  } catch {
    return 0;
  }
}

async function addMisfortuneTokens(amount: number): Promise<number> {
  const g = globalThis as any;
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  const cur = await getMisfortuneTokens();
  const next = cur + add;
  try {
    await g.game?.settings?.set?.(FLAG_SCOPE, MISFORTUNE_SETTING, next);
  } catch (err) {
    console.warn('Mastery System | misfortuneTokens set failed', err);
  }
  return next;
}

async function resetActorStressTrack(actor: any): Promise<void> {
  const bars: HealthBar[] = Array.isArray(actor?.system?.stress?.bars)
    ? actor.system.stress.bars
    : [];
  if (!bars.length) return;
  const cleared = resetStressBarsToClear(bars);
  await actor.update({
    'system.stress.bars': cleared,
    'system.stress.currentBar': 0,
  });
}

function buildBreakdownPromptHtml(actor: any, tn: number, mr: number): string {
  const name = escHtml(String(actor?.name ?? 'Character'));
  return `<div class="mastery-stress-breakdown" data-actor-id="${escHtml(String(actor.id))}">
    <strong>⚡ Stress Breakdown — ${name}</strong>
    <p>The Stress Track is full. <strong>Meltdown</strong> (catatonia, panic, or possession — GM decides).</p>
    <p>Make a <strong>Wits Attribute Check</strong>: keep <strong>${mr}</strong>, TN <strong>${tn}</strong> (= 8 × MR). No Skill Points / Vitality expenditure.</p>
    <div class="ms-stress-breakdown-actions" style="margin-top:0.5em;display:flex;flex-wrap:wrap;gap:0.4em;">
      <button type="button" class="ms-stress-breakdown-roll-btn" data-actor-id="${escHtml(String(actor.id))}">
        <i class="fas fa-dice"></i> Roll Stress Breakdown Check
      </button>
    </div>
  </div>`;
}

function buildAfflictionChoiceHtml(actor: any, total: number, tn: number): string {
  const name = escHtml(String(actor?.name ?? 'Character'));
  return `<div class="mastery-stress-breakdown" data-actor-id="${escHtml(String(actor.id))}" data-phase="affliction">
    <strong>⚡ Stress Breakdown — Affliction — ${name}</strong>
    <p>Check <strong>failed</strong> (${total} vs TN ${tn}). Stress Track resets to <strong>Clear</strong>. Choose one:</p>
    <div class="ms-stress-breakdown-actions" style="margin-top:0.5em;display:flex;flex-wrap:wrap;gap:0.4em;">
      <button type="button" class="ms-stress-affliction-a-btn" data-actor-id="${escHtml(String(actor.id))}"
        title="Add a Mental Restriction (2 pts). Recover 2 Reroll Points (up to max).">
        <i class="fas fa-brain"></i> A) Scar of Will
      </button>
      <button type="button" class="ms-stress-affliction-b-btn" data-actor-id="${escHtml(String(actor.id))}"
        title="No new restriction. GM gains 1d8 Misfortune Tokens.">
        <i class="fas fa-cloud-moon"></i> B) Push It Down
      </button>
    </div>
    <p style="opacity:0.85;font-size:0.9em;margin-top:0.45em;">
      <em>A)</em> Mental Restriction (Normal / 2 pts) — acting against it: Resolve k1 (TN 6/10/14).<br/>
      <em>B)</em> GM gains 1d8 Misfortune Tokens (force reroll / complication / worsen failure; max 1 per roll).
    </p>
  </div>`;
}

/**
 * Call after stress has been applied. If this hit collapsed the track for a
 * PC, post the Breakdown Check card (once).
 */
export async function maybeTriggerStressBreakdown(
  actor: any,
  opts?: { wasCollapsed?: boolean },
): Promise<boolean> {
  if (!actor || actor.type !== 'character') return false;
  const bars: HealthBar[] = Array.isArray(actor.system?.stress?.bars)
    ? actor.system.stress.bars
    : [];
  const currentBar = Math.floor(Number(actor.system?.stress?.currentBar) || 0);
  const collapsed = isStressTrackCollapsed(bars, currentBar);
  if (!collapsed) return false;
  if (opts?.wasCollapsed) return false;

  try {
    if (actor.getFlag?.(FLAG_SCOPE, FLAG_PENDING)) return false;
    await actor.setFlag?.(FLAG_SCOPE, FLAG_PENDING, true);
  } catch {
    /* continue even if flag fails */
  }

  const mr = masteryRankOf(actor);
  const tn = 8 * mr;
  const g = globalThis as any;
  try {
    await g.ChatMessage?.create?.({
      user: g.game?.user?.id,
      speaker: g.ChatMessage?.getSpeaker?.({ actor }),
      content: `<div class="mastery-reaction-msg">${buildBreakdownPromptHtml(actor, tn, mr)}</div>`,
      flags: {
        [FLAG_SCOPE]: {
          stressBreakdown: { actorId: String(actor.id), phase: 'roll', tn, mr },
        },
      },
    });
    g.ui?.notifications?.warn?.(
      `${actor.name}: Stress Breakdown! Meltdown — roll the Wits check (TN ${tn}).`,
    );
  } catch (err) {
    console.warn('Mastery System | stress breakdown prompt failed', err);
    try {
      await actor.unsetFlag?.(FLAG_SCOPE, FLAG_PENDING);
    } catch {
      /* ignore */
    }
    return false;
  }
  return true;
}

async function handleRollClick(actorId: string): Promise<void> {
  const g = globalThis as any;
  const actor = g.game?.actors?.get?.(actorId);
  if (!actor) return;
  if (!userMayActForActor(actor)) {
    g.ui?.notifications?.warn?.('Only the owner or GM can roll this check.');
    return;
  }

  const mr = masteryRankOf(actor);
  const tn = 8 * mr;
  const wits = Math.max(0, Math.floor(Number(actor.system?.attributes?.wits?.value) || 0));

  const { masteryRoll } = await import('../dice/roll-handler.js');
  const result = await masteryRoll({
    numDice: Math.max(1, wits),
    keepDice: mr,
    skill: 0,
    tn,
    normalTn: tn,
    label: 'Stress Breakdown Check (Wits)',
    flavor: 'No Skill Points / Vitality expenditure',
    actorId: String(actor.id),
    rollKind: 'generic',
    poolAttribute: 'wits',
    // Health % penalties still apply; no skill spend path.
    applyPoolPenalties: true,
    raiseModel: 'margin',
  });

  const total = Math.floor(Number(result?.total) || 0);
  const success = total >= tn;

  await resetActorStressTrack(actor);

  if (success) {
    try {
      await actor.setFlag?.(FLAG_SCOPE, FLAG_VIRTUE_KEEP, true);
      await actor.unsetFlag?.(FLAG_SCOPE, FLAG_PENDING);
    } catch (err) {
      console.warn('Mastery System | virtue flag failed', err);
    }
    await g.ChatMessage?.create?.({
      user: g.game?.user?.id,
      speaker: g.ChatMessage?.getSpeaker?.({ actor }),
      content: `<div class="mastery-reaction-msg">
        <strong>⚡ Stress Breakdown — Virtue — ${escHtml(String(actor.name))}</strong>
        <p>Check <strong>succeeded</strong> (${total} vs TN ${tn}). Stress Track resets to <strong>Clear</strong>.</p>
        <p><em>Clarity:</em> the next action gains <strong>+1 Keep</strong>.</p>
      </div>`,
    });
    g.ui?.notifications?.info?.(
      `${actor.name}: Virtue — Stress cleared. Next action +1 Keep.`,
    );
    return;
  }

  // Failure → Affliction choice (track already cleared).
  try {
    await actor.unsetFlag?.(FLAG_SCOPE, FLAG_PENDING);
  } catch {
    /* ignore */
  }
  await g.ChatMessage?.create?.({
    user: g.game?.user?.id,
    speaker: g.ChatMessage?.getSpeaker?.({ actor }),
    content: `<div class="mastery-reaction-msg">${buildAfflictionChoiceHtml(actor, total, tn)}</div>`,
    flags: {
      [FLAG_SCOPE]: {
        stressBreakdown: { actorId: String(actor.id), phase: 'affliction', tn, total },
      },
    },
  });
}

async function handleAfflictionA(actorId: string): Promise<boolean> {
  const g = globalThis as any;
  const actor = g.game?.actors?.get?.(actorId);
  if (!actor) return false;
  if (!userMayActForActor(actor)) {
    g.ui?.notifications?.warn?.('Only the owner or GM can choose Scar of Will.');
    return false;
  }

  const title = await new Promise<string | null>((resolve) => {
    let settled = false;
    const finish = (v: string | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    try {
      new Dialog({
        title: 'Scar of Will — Mental Restriction',
        content: `<form class="mastery-dialog">
          <p>Choose a <strong>Mental Restriction (2 Points)</strong> — Oath, Fear, or Trait. Acting against it requires Resolve k1.</p>
          <div class="form-group">
            <label>Title</label>
            <input type="text" name="sheetTitle" placeholder="e.g. Fear of Fire, Never Abandon an Ally" />
          </div>
          <div class="form-group">
            <label>Note (optional)</label>
            <textarea name="context" rows="3" placeholder="How it shows up at the table"></textarea>
          </div>
        </form>`,
        buttons: {
          ok: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Add Restriction',
            callback: (html: any) => {
              const root = html instanceof jQuery || (html as any)?.find ? html : $(html);
              const t = String(root.find('[name="sheetTitle"]').val() || '').trim();
              const ctx = String(root.find('[name="context"]').val() || '').trim();
              if (!t) {
                g.ui?.notifications?.warn?.('Title is required.');
                finish(null);
                return;
              }
              finish(JSON.stringify({ sheetTitle: t, context: ctx }));
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => finish(null),
          },
        },
        default: 'ok',
        close: () => finish(null),
      }).render(true);
    } catch (err) {
      console.warn('Mastery System | Scar of Will dialog failed', err);
      finish(null);
    }
  });

  if (!title) return false;
  let details: { sheetTitle: string; context: string; severity: string };
  try {
    const parsed = JSON.parse(title);
    details = {
      sheetTitle: String(parsed.sheetTitle || '').trim(),
      context: String(parsed.context || '').trim(),
      severity: 'normal',
    };
  } catch {
    return false;
  }
  if (!details.sheetTitle) return false;

  const entry = {
    id: 'mental-restrictions',
    details,
    points: calculateDisadvantagePoints('mental-restrictions', details),
  };

  const list = Array.isArray(actor.system?.disadvantages)
    ? [...actor.system.disadvantages]
    : [];
  list.push(entry);

  const newMax = list.reduce(
    (sum: number, d: any) => sum + (Number(d.points) || calculateDisadvantagePoints(d.id, d.details || {})),
    0,
  );
  const curFaith = Math.max(0, Math.floor(Number(actor.system?.faithFractures?.current) || 0));
  // Recover 2 Reroll Points after max grows with the new restriction.
  const newCur = Math.min(newMax, curFaith + 2);

  await actor.update({
    'system.disadvantages': list,
    'system.faithFractures.maximum': newMax,
    'system.faithFractures.current': newCur,
  });

  await g.ChatMessage?.create?.({
    user: g.game?.user?.id,
    speaker: g.ChatMessage?.getSpeaker?.({ actor }),
    content: `<div class="mastery-reaction-msg">
      <strong>⚡ Scar of Will — ${escHtml(String(actor.name))}</strong>
      <p>Mental Restriction added: <strong>${escHtml(details.sheetTitle)}</strong> (2 pts). Reroll Points: ${newCur}/${newMax} (+2 recovered).</p>
    </div>`,
  });
  g.ui?.notifications?.info?.(
    `${actor.name}: Scar of Will — "${details.sheetTitle}". +2 Reroll Points.`,
  );
  return true;
}

async function handleAfflictionB(actorId: string): Promise<void> {
  const g = globalThis as any;
  const actor = g.game?.actors?.get?.(actorId);
  if (!actor) return;
  // Owner or GM may choose Push It Down (GM receives the tokens).
  if (!userMayActForActor(actor)) {
    g.ui?.notifications?.warn?.('Only the owner or GM can choose Push It Down.');
    return;
  }

  let rolled = 1;
  try {
    const roll = await new g.Roll('1d8').evaluate({ async: true });
    rolled = Math.max(1, Math.floor(Number(roll?.total) || 1));
    try {
      await roll.toMessage?.({
        speaker: g.ChatMessage?.getSpeaker?.({ actor }),
        flavor: 'Push It Down — Misfortune Tokens',
      });
    } catch {
      /* optional */
    }
  } catch {
    rolled = 4;
  }

  const total = await addMisfortuneTokens(rolled);
  await g.ChatMessage?.create?.({
    user: g.game?.user?.id,
    speaker: g.ChatMessage?.getSpeaker?.({ actor }),
    content: `<div class="mastery-reaction-msg">
      <strong>⚡ Push It Down — ${escHtml(String(actor.name))}</strong>
      <p>No new restriction. GM gains <strong>${rolled}</strong> Misfortune Token(s) (now <strong>${total}</strong> total).</p>
      <p style="opacity:0.85;font-size:0.9em;">Spend 1 token to force a player reroll, introduce a complication, or worsen a failure (max 1 per roll).</p>
    </div>`,
  });
  g.ui?.notifications?.info?.(
    `GM: +${rolled} Misfortune Tokens (total ${total}) from ${actor.name}'s Breakdown.`,
  );
}

/**
 * If the actor has a pending Virtue from a successful Breakdown, consume it
 * and return the Keep bonus (1). Otherwise 0.
 */
export async function consumeStressBreakdownVirtueKeep(actor: any): Promise<number> {
  if (!actor) return 0;
  try {
    const has = !!actor.getFlag?.(FLAG_SCOPE, FLAG_VIRTUE_KEEP);
    if (!has) return 0;
    await actor.unsetFlag?.(FLAG_SCOPE, FLAG_VIRTUE_KEEP);
    return 1;
  } catch {
    return 0;
  }
}

export function registerStressBreakdownChatHandlers(): void {
  registerStressBreakdownSettings();
  if (hooksRegistered) return;
  hooksRegistered = true;

  const $doc = $(document);
  $doc
    .off('click.msStressBreakdownRoll', '.ms-stress-breakdown-roll-btn')
    .on('click.msStressBreakdownRoll', '.ms-stress-breakdown-roll-btn', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const btn = $(ev.currentTarget);
      const actorId = String(btn.attr('data-actor-id') || '');
      if (!actorId) return;
      btn.prop('disabled', true);
      try {
        await handleRollClick(actorId);
      } finally {
        btn.prop('disabled', false);
      }
    });

  $doc
    .off('click.msStressAfflictionA', '.ms-stress-affliction-a-btn')
    .on('click.msStressAfflictionA', '.ms-stress-affliction-a-btn', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const btn = $(ev.currentTarget);
      const actorId = String(btn.attr('data-actor-id') || '');
      if (!actorId) return;
      btn.prop('disabled', true);
      try {
        const ok = await handleAfflictionA(actorId);
        if (ok) {
          btn.closest('.mastery-stress-breakdown').find('button').prop('disabled', true);
        }
      } finally {
        btn.prop('disabled', false);
      }
    });

  $doc
    .off('click.msStressAfflictionB', '.ms-stress-affliction-b-btn')
    .on('click.msStressAfflictionB', '.ms-stress-affliction-b-btn', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const btn = $(ev.currentTarget);
      const actorId = String(btn.attr('data-actor-id') || '');
      if (!actorId) return;
      btn.prop('disabled', true);
      try {
        await handleAfflictionB(actorId);
        btn.closest('.mastery-stress-breakdown').find('button').prop('disabled', true);
      } finally {
        btn.prop('disabled', false);
      }
    });
}
