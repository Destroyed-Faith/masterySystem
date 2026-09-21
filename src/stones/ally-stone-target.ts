/**
 * Pick a player for Influence Stone Powers (Regeneration + Movement).
 */

import { getRoundState, setRoundState } from '../combat/action-economy.js';
import { readActorStatusEffects } from '../system/active-specials.js';
import { setActorCatalogStatus } from '../system/assign-status.js';

export interface AllyPlayerChoice {
  id: string;
  name: string;
  isSelf: boolean;
}

export function nextRegenerationValue(current: number, granted: number): number {
  return Math.max(0, Math.floor(Number(current) || 0), Math.floor(Number(granted) || 0));
}

export function currentRegenerationValue(actor: any): number {
  const row = readActorStatusEffects(actor).find((e) => {
    const id = String((e as { id?: string })?.id || '').toLowerCase();
    const name = String((e as { name?: string })?.name || '').toLowerCase();
    return id === 'regeneration' || name.includes('regeneration');
  });
  return Math.max(0, Math.floor(Number((row as { value?: number })?.value) || 0));
}

export function listSelectablePlayerActors(
  actors: Iterable<any> | null | undefined,
  casterId?: string,
): AllyPlayerChoice[] {
  const self = String(casterId || '').trim();
  const seen = new Set<string>();
  const out: AllyPlayerChoice[] = [];
  for (const raw of actors ?? []) {
    const actor = (raw as { actor?: any })?.actor ?? raw;
    if (!actor || String(actor.type || '') !== 'character') continue;
    const id = String(actor.id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: String(actor.name || 'Player'),
      isSelf: !!self && id === self,
    });
  }
  out.sort((a, b) => Number(a.isSelf) - Number(b.isSelf) || a.name.localeCompare(b.name));
  return out;
}

function worldAndCombatActors(): any[] {
  const g = globalThis as any;
  const out: any[] = [];
  const combatants = g.game?.combat?.combatants;
  if (combatants && typeof combatants[Symbol.iterator] === 'function') {
    for (const c of combatants) out.push(c);
  }
  const actors = g.game?.actors;
  if (actors && typeof actors[Symbol.iterator] === 'function') {
    for (const a of actors) out.push(a);
  }
  return out;
}

export async function promptSelectablePlayerTarget(options: {
  caster: any;
  title: string;
  hint: string;
}): Promise<any | null> {
  const caster = options.caster;
  const choices = listSelectablePlayerActors(worldAndCombatActors(), String(caster?.id || ''));
  if (!choices.length) return null;
  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.prompt !== 'function') return null;
  try {
    const optionsHtml = choices
      .map((c) => {
        const label = c.isSelf ? `${c.name} (self)` : c.name;
        return `<option value="${c.id}">${label}</option>`;
      })
      .join('');
    const id = await DialogV2.prompt({
      window: { title: options.title },
      content: `<form class="mastery-dialog-form"><p class="md-hint">${options.hint}</p><label class="md-label">Player</label><select name="target" class="md-select">${optionsHtml}</select></form>`,
      ok: {
        label: 'Give',
        callback: (_event: unknown, button: any) => String(button?.form?.elements?.target?.value || ''),
      },
    });
    const picked = String(id || '').trim();
    if (!picked) return null;
    if (String(caster?.id || '') === picked) return caster;
    const fromCombat = (globalThis as any).game?.combat?.combatants?.find?.(
      (c: any) => String(c?.actor?.id || c?.actorId || '') === picked,
    )?.actor;
    if (fromCombat) return fromCombat;
    return (globalThis as any).game?.actors?.get?.(picked) ?? null;
  } catch {
    return null;
  }
}

export async function applyRegenerationAndMove(
  target: any,
  regen: number,
  moveMeters: number,
): Promise<void> {
  if (!target) return;
  const value = nextRegenerationValue(currentRegenerationValue(target), regen);
  if (value > 0) {
    try {
      await setActorCatalogStatus(target, 'regeneration', true, value, { notify: false });
    } catch (err) {
      console.warn('Mastery System | Regeneration status apply failed', err);
    }
  }
  const combat = (globalThis as any).game?.combat ?? null;
  const move = Math.max(0, Math.floor(Number(moveMeters) || 0));
  if (move > 0 && combat) {
    try {
      const rs = getRoundState(target, combat);
      if (!rs.stoneBonuses) {
        rs.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      rs.stoneBonuses.extraMoveMeters = (rs.stoneBonuses.extraMoveMeters ?? 0) + move;
      await setRoundState(target, rs);
    } catch (err) {
      console.warn('Mastery System | Regeneration movement apply failed', err);
    }
  }
}
