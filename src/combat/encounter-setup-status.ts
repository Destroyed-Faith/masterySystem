/**
 * Encounter setup status (passives / stones / initiative) plus GM force-open.
 */

import { getPassiveSlots } from '../powers/passives.js';
import { emitEncounterSocketToPlayerOwners, resolveLiveCombat } from './combat-permissions.js';
import { readCombatantSetupStep } from './encounter-setup-flags.js';

export type EncounterDialogKind = 'passives' | 'stones' | 'initiative';

export interface EncounterPickRow {
  kind: EncounterDialogKind;
  label: string;
  done: boolean;
  summary: string;
  tooltip: string;
}

export interface EncounterSetupStatus {
  isCharacter: boolean;
  combatantId: string;
  actorId: string;
  rows: EncounterPickRow[];
  canForce: boolean;
}

function loc(key: string, fallback: string): string {
  const full = `MASTERY.encounterSetup.${key}`;
  const i18n = (globalThis as any).game?.i18n;
  if (!i18n?.localize) return fallback;
  const t = String(i18n.localize(full) ?? '');
  return !t || t === full ? fallback : t;
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function passiveSummary(actor: Actor, combatant?: Combatant | null): { done: boolean; names: string[] } {
  const combat = resolveLiveCombat(game.combat);
  const actorId = (actor as { id?: string }).id;
  const locked = !!(
    combat &&
    actorId &&
    ((combat.flags as any)?.['mastery-system']?.encounterSetup?.passives?.[actorId]?.locked ||
      readCombatantSetupStep(combatant, combat)?.passivesLocked)
  );
  const names = getPassiveSlots(actor)
    .map((s) => String(s.passive?.name ?? '').trim())
    .filter(Boolean);
  return { done: locked, names };
}

function stoneSummary(actor: Actor, combatantId: string, combat: Combat | null): {
  done: boolean;
  parts: string[];
} {
  const round = combat?.round || 1;
  const doneRound = Number(
    (combat?.flags as any)?.['mastery-system']?.stonePowersState?.stonesDone?.[combatantId] ?? 0,
  );
  const plan = (actor as any).getFlag?.('mastery-system', 'stonePowersRoundPlan') as
    | { combatId?: string; round?: number; lanes?: Array<{ accKey?: string; value?: unknown }> }
    | undefined;
  const planLive =
    !!plan &&
    !!combat &&
    String(plan.combatId) === String(combat.id) &&
    Number(plan.round) === Number(round);
  const parts: string[] = [];
  if (planLive && Array.isArray(plan?.lanes)) {
    for (const lane of plan.lanes) {
      const accKey = String(lane?.accKey ?? '');
      const [powerId, attr] = accKey.split(':');
      const item = powerId ? (actor as any).items?.get?.(powerId) : null;
      const name = String(item?.name ?? powerId ?? '').trim();
      const count = Array.isArray(lane.value) ? lane.value.length : 0;
      if (!name) continue;
      parts.push(attr && attr !== '_' ? `${name} (${cap(attr)}×${count || 1})` : name);
    }
  }
  const stepDone = readCombatantSetupStep(
    combat?.combatants?.get?.(combatantId),
    combat,
  )?.stonesDoneRound;
  return { done: doneRound === round || Number(stepDone) === Number(round), parts };
}

export function buildEncounterSetupStatus(
  combatant: Combatant,
  combat: Combat | null = game.combat ?? null,
): EncounterSetupStatus | null {
  if (!game.user?.isGM) return null;
  const actor = combatant.actor;
  if (!actor || actor.type !== 'character') return null;
  const live = resolveLiveCombat(combat);
  const passives = passiveSummary(actor, combatant);
  const stones = stoneSummary(actor, combatant.id, live);

  const row = (
    kind: EncounterDialogKind,
    label: string,
    done: boolean,
    parts: string[],
    empty: string,
  ): EncounterPickRow => {
    const summary = parts.length ? parts.join(', ') : done ? loc('confirmed', 'Bestätigt') : empty;
    return {
      kind,
      label,
      done,
      summary,
      tooltip: `${label}: ${done ? loc('chosen', 'gewählt') : loc('pending', 'offen')} — ${parts.length ? parts.join(', ') : empty}`,
    };
  };

  const empty = loc('nothingYet', 'noch nichts');
  return {
    isCharacter: true,
    combatantId: combatant.id,
    actorId: actor.id ?? '',
    canForce: !!game.user?.isGM,
    rows: [
      row('passives', loc('passives', 'Passives'), passives.done, passives.names, empty),
      row('stones', loc('stones', 'Steine'), stones.done, stones.parts, empty),
    ],
  };
}

export async function openEncounterDialogLocally(
  kind: EncounterDialogKind,
  combatant: Combatant,
  combat: Combat,
): Promise<void> {
  const actor = combatant.actor;
  if (!actor) return;
  if (kind === 'passives') {
    const { PassiveSelectionDialog } = await import('../sheets/passive-selection-dialog.js');
    await PassiveSelectionDialog.showForCombatant(combatant, false);
    return;
  }
  if (kind === 'stones') {
    const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
    await StonePowersDialog.showForActor(actor, combatant);
    return;
  }
  const { openInitiativeShopForTrackerRescue } = await import('./initiative-roll.js');
  await openInitiativeShopForTrackerRescue(combatant, combat);
}

export async function forceEncounterDialog(
  kind: EncounterDialogKind,
  combatant: Combatant,
): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn(loc('gmOnly', 'Nur der SL kann Dialoge erzwingen.'));
    return;
  }
  const combat = resolveLiveCombat(game.combat);
  if (!combat) {
    ui.notifications?.warn(loc('noCombat', 'Kein aktiver Kampf.'));
    return;
  }
  const actor = combatant.actor;
  if (!actor || actor.type !== 'character') return;

  await openEncounterDialogLocally(kind, combatant, combat);
  const sent = emitEncounterSocketToPlayerOwners(actor, {
    type: 'forceEncounterDialog',
    combatId: combat.id,
    combatantId: combatant.id,
    actorId: actor.id,
    kind,
  });
  if (sent > 0) {
    const sentTpl = loc('sentToPlayer', '{name}: {dialog} an den Spieler geschickt.');
    ui.notifications?.info(
      sentTpl.replace('{name}', String(actor.name ?? '')).replace('{dialog}', kindLabel(kind)),
    );
  }
}

export async function forceEncounterDialogForAll(kind: EncounterDialogKind): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn(loc('gmOnly', 'Nur der SL kann Dialoge erzwingen.'));
    return;
  }
  const combat = resolveLiveCombat(game.combat);
  if (!combat) {
    ui.notifications?.warn(loc('noCombat', 'Kein aktiver Kampf.'));
    return;
  }
  const pcs = Array.from(combat.combatants).filter((c: any) => c.actor?.type === 'character');
  for (const pc of pcs) {
    await forceEncounterDialog(kind, pc);
  }
}

function kindLabel(kind: EncounterDialogKind): string {
  if (kind === 'passives') return loc('passives', 'Passives');
  if (kind === 'stones') return loc('stones', 'Steine');
  return loc('initiative', 'Initiative');
}
