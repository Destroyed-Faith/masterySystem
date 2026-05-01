/**
 * End-of-Turn Save Ends pipeline (Players Guide ~6052–6067).
 *
 * At the end of each of their turns, an affected creature gets **one** free
 * save against an active diminishing effect:
 *   - Success → the effect's stack drops by 4 (or ends entirely when X ≤ 4).
 *   - Failure → no change; the standard 1-per-round auto-tick still applies.
 * Stunned, Brace, Stunning Strike and similar one-round timed effects do not
 * get a save (they expire at end-of-turn on their own).
 *
 * The pipeline is intentionally conservative: it never auto-rolls. It posts
 * a single chat card per turn listing the eligible effects with save
 * buttons (Body / Mind / Spirit). The player presses one and a normal save
 * roll fires through `masteryRoll`. The flag `saveEndsConsumedRound` on the
 * actor tracks that the free save for the round has been used so a second
 * save in the same end-of-turn step is not offered.
 */

import { masteryRoll } from '../dice/roll-handler.js';
import { calculateSaveDC } from '../utils/saving-throws.js';
import { getEffectById } from '../utils/special-effects.js';

const FLAG_SCOPE = 'mastery-system';
const FLAG_SAVE_USED = 'saveEndsConsumedRound';

type SaveCat = 'body' | 'mind' | 'spirit';

interface EligibleEffect {
  name: string;
  value: number | null;
  save: SaveCat;
  index: number;
}

const SAVE_TO_ATTRIBUTES: Record<SaveCat, [string, string]> = {
  body: ['might', 'agility'],
  mind: ['intellect', 'wits'],
  spirit: ['resolve', 'influence'],
};

/**
 * Inspect `system.statusEffects` and return the diminishing entries that
 * still have a positive stack and a Body/Mind/Spirit save category.
 */
export function listSaveEndsCandidates(actor: any): EligibleEffect[] {
  const list: any[] = Array.isArray(actor?.system?.statusEffects)
    ? actor.system.statusEffects
    : [];
  const out: EligibleEffect[] = [];
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    if (!entry || typeof entry !== 'object') continue;
    const id = String(entry.id ?? entry.name ?? '').toLowerCase().replace(/\s+/g, '-');
    const def = getEffectById(id);
    // Only diminishing effects are eligible — timed / instant / until-used
    // either expire on their own (Stunned/Brace/Prone) or never need a save.
    if (!def || def.category !== 'diminishing') continue;
    const saveRaw = (def.save || '').toLowerCase();
    let save: SaveCat | null = null;
    if (saveRaw.startsWith('body')) save = 'body';
    else if (saveRaw.startsWith('mind')) save = 'mind';
    else if (saveRaw.startsWith('spirit')) save = 'spirit';
    if (!save) continue;
    const value = Number.isFinite(Number(entry.value)) ? Number(entry.value) : null;
    if (value !== null && value <= 0) continue;
    out.push({
      name: typeof entry.name === 'string' ? entry.name : (def.name || id),
      value,
      save,
      index: i,
    });
  }
  return out;
}

/**
 * Has this actor already used their free Save Ends this round?
 */
export async function isSaveEndsConsumedThisRound(
  actor: any,
  round: number,
): Promise<boolean> {
  const stored = await actor?.getFlag?.(FLAG_SCOPE, FLAG_SAVE_USED);
  if (!stored || typeof stored !== 'object') return false;
  return Number(stored.round) === Number(round) && stored.used === true;
}

async function markSaveEndsConsumedThisRound(actor: any, round: number): Promise<void> {
  try {
    await actor?.setFlag?.(FLAG_SCOPE, FLAG_SAVE_USED, { round, used: true });
  } catch (err) {
    console.warn('Mastery System | save-ends flag write failed', err);
  }
}

/**
 * Roll the free Save Ends for `actor` against `effect`. Updates the actor's
 * `system.statusEffects[index].value` on success and records that the free
 * save for this round has been used.
 */
export async function rollSaveEnd(
  actor: any,
  effect: EligibleEffect,
  options: { sourceMR?: number; sourceIntellect?: number; round?: number } = {},
): Promise<{ success: boolean; newValue: number | null; ended: boolean }> {
  const round = Number(options.round ?? game?.combat?.round ?? 0) || 0;
  const sourceMR = Math.max(1, Math.floor(options.sourceMR ?? 2));
  const sourceIntellect = Math.max(0, Math.floor(options.sourceIntellect ?? 0));
  const dc = calculateSaveDC(sourceMR, sourceIntellect);

  const [attr1, attr2] = SAVE_TO_ATTRIBUTES[effect.save];
  const v1 = Number(actor?.system?.attributes?.[attr1]?.value ?? 0);
  const v2 = Number(actor?.system?.attributes?.[attr2]?.value ?? 0);
  const chosen = v1 >= v2 ? attr1 : attr2;
  const masteryRank = Math.max(1, Math.floor(actor?.system?.mastery?.rank ?? 2));
  const numDice = Math.max(1, Math.max(v1, v2, masteryRank));

  const result = await masteryRoll({
    numDice,
    keepDice: masteryRank,
    skill: 0,
    tn: dc,
    label: `Save Ends: ${effect.name}`,
    flavor: `End-of-turn ${effect.save} save vs DC ${dc} (using ${chosen.charAt(0).toUpperCase() + chosen.slice(1)})`,
    actorId: actor?.id,
    isSaveRoll: true,
    rollKind: effect.save === 'body' ? 'saveBody' : effect.save === 'mind' ? 'saveMind' : 'saveSpirit',
  });

  await markSaveEndsConsumedThisRound(actor, round);

  if (!result.success) {
    return { success: false, newValue: effect.value, ended: false };
  }

  // Players Guide ~6052–6067: success drops the stack by 4 (effect ends if
  // the stack goes ≤ 0). Effects without a numeric stack just end.
  const oldValue = effect.value;
  let ended = false;
  let newValue: number | null = oldValue;
  if (oldValue == null) {
    ended = true;
  } else {
    newValue = oldValue - 4;
    if (newValue <= 0) {
      ended = true;
      newValue = 0;
    }
  }

  try {
    const list: any[] = Array.isArray(actor?.system?.statusEffects)
      ? [...actor.system.statusEffects]
      : [];
    if (ended) {
      list.splice(effect.index, 1);
    } else {
      list[effect.index] = { ...list[effect.index], value: newValue };
    }
    await actor?.update?.({ 'system.statusEffects': list });
  } catch (err) {
    console.warn('Mastery System | save-ends mutation failed', err);
  }

  return { success: true, newValue, ended };
}

/**
 * Post a chat card listing the eligible Save Ends candidates for the
 * current combatant. The card has one button per effect; clicking it fires
 * `rollSaveEnd` and posts the result. No-op when the actor has nothing to
 * save against, or has already consumed their free save this round.
 */
export async function postSaveEndsPromptForActor(
  actor: any,
  combat: any,
): Promise<void> {
  if (!actor) return;
  const round = Number(combat?.round ?? 0) || 0;
  if (await isSaveEndsConsumedThisRound(actor, round)) return;

  const candidates = listSaveEndsCandidates(actor);
  if (candidates.length === 0) return;

  const items = candidates
    .map((c) => {
      const stack = c.value != null ? `(${c.value})` : '';
      return `<button type="button" class="save-ends-btn"
        data-actor-id="${actor.id}"
        data-effect-index="${c.index}"
        data-effect-save="${c.save}"
        data-round="${round}"
      >${c.name}${stack ? ` ${stack}` : ''} · ${c.save.toUpperCase()} save</button>`;
    })
    .join('');

  const content = `
    <div class="mastery-save-ends">
      <h4>${actor.name} — End-of-Turn Save</h4>
      <p>Pick <strong>one</strong> diminishing effect to attempt a free save against (success drops the stack by 4).</p>
      <div class="save-ends-buttons">${items}</div>
    </div>
  `;
  try {
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      flags: {
        [FLAG_SCOPE]: {
          saveEndsPrompt: true,
          actorId: actor.id,
          round,
        },
      },
    });
  } catch (err) {
    console.warn('Mastery System | save-ends prompt failed', err);
  }
}

/**
 * Wire the chat-button delegation. Idempotent — call once during
 * `init` / `ready` setup.
 */
export function registerSaveEndsChatHandlers(): void {
  Hooks.on('renderChatMessage', (_msg: any, html: JQuery) => {
    html.find('.save-ends-btn').off('click.masterySaveEnds').on('click.masterySaveEnds', async (ev) => {
      ev.preventDefault();
      const btn = ev.currentTarget as HTMLButtonElement;
      const actorId = btn.dataset.actorId;
      const effectIndex = Number(btn.dataset.effectIndex);
      const round = Number(btn.dataset.round);
      const actor: any = (game as any).actors?.get?.(actorId);
      if (!actor) return;
      if (await isSaveEndsConsumedThisRound(actor, round)) {
        ui.notifications?.warn(`${actor.name} already used their free save this round.`);
        return;
      }
      const candidates = listSaveEndsCandidates(actor);
      const target = candidates.find((c) => c.index === effectIndex);
      if (!target) return;
      // Source MR/Intellect are *the source's* values; we don't have them
      // from the chat card alone, so we fall back to the rolling actor's
      // own MR-based DC (this is the GM-tuneable variant when the source is
      // ambient / environmental).
      await rollSaveEnd(actor, target, {
        sourceMR: actor.system?.mastery?.rank ?? 2,
        sourceIntellect: actor.system?.attributes?.intellect?.value ?? 0,
        round,
      });
    });
  });
}
