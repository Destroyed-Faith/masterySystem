/**
 * Hold the new round until every PC confirms stone assignment.
 * NPCs do not block. The GM cannot skip the wait with Next Turn.
 */

import {
  isCombatantInitiativeConfirmed,
  isPassiveSelectionLocked,
  readCombatantSetupStep,
} from './encounter-setup-flags.js';

export function isStonePowersDone(combat: Combat, combatantId: string, round: number): boolean {
  const done = (combat.flags as any)?.['mastery-system']?.stonePowersState?.stonesDone?.[combatantId];
  if (Number(done) === Number(round)) return true;
  const combatant = combat.combatants.get(combatantId);
  return Number(readCombatantSetupStep(combatant, combat)?.stonesDoneRound) === Number(round);
}

function isPlayerCharacter(combatant: Combatant): boolean {
  return combatant.actor?.type === 'character';
}

export function pendingStoneCombatants(
  combat: Combat,
  round: number = Math.max(1, Number(combat.round) || 1),
): Combatant[] {
  return (Array.from(combat.combatants) as Combatant[]).filter(
    (c) => isPlayerCharacter(c) && !isStonePowersDone(combat, c.id, round),
  );
}

export function pendingStonePlayerNames(
  combat: Combat,
  round: number = Math.max(1, Number(combat.round) || 1),
): string[] {
  return pendingStoneCombatants(combat, round).map((c) => {
    const name = String((c.actor as { name?: string } | null)?.name || (c as { name?: string }).name || '').trim();
    return name || 'Unbekannt';
  });
}

export function arePlayerStonesReadyForRound(
  combat: Combat,
  round: number = Math.max(1, Number(combat.round) || 1),
): boolean {
  return pendingStoneCombatants(combat, round).length === 0;
}

function stoneWaitMessage(combat: Combat): string {
  const names = pendingStonePlayerNames(combat);
  const who = names.length ? ` Noch offen: ${names.join(', ')}.` : '';
  return `Neue Runde: alle Spieler müssen ihre Steine bestätigen, bevor jemand den Zug wechselt.${who}`;
}

let gmStonePromptOpen = false;
let launchingLiveCombat = false;

export function setLaunchingLiveCombat(value: boolean): void {
  launchingLiveCombat = value;
}

export function isLaunchingLiveCombat(): boolean {
  return launchingLiveCombat;
}

export function isEncounterPreparing(combat: Combat | null | undefined): boolean {
  if (!combat) return false;
  const setup = (combat.flags as any)?.['mastery-system']?.encounterSetup;
  return !!setup?.started && !combat.started;
}

export function encounterStartBlockers(combat: Combat): string[] {
  const blockers: string[] = [];
  for (const combatant of Array.from(combat.combatants) as Combatant[]) {
    const actor = combatant.actor as { type?: string; id?: string; name?: string } | null;
    if (!actor || actor.type !== 'character') continue;
    const name = String(actor.name || (combatant as { name?: string }).name || 'Unbekannt');
    if (!isPassiveSelectionLocked(combat, String(actor.id ?? ''))) blockers.push(`${name}: Passives`);
    if (!isStonePowersDone(combat, combatant.id, 1)) blockers.push(`${name}: Steine`);
    if (!isCombatantInitiativeConfirmed(combat, combatant.id)) blockers.push(`${name}: Shop`);
  }
  return blockers;
}

/** @returns true if actions / turn advance must wait for stone confirm. */
export function warnIfPlayerStonesPending(combat: Combat | null | undefined): boolean {
  if (!combat) return false;
  if (isLaunchingLiveCombat()) return false;
  if (isEncounterPreparing(combat)) {
    ui.notifications?.warn(
      game.i18n?.localize('MASTERY.encounterSetup.waitForStart') ||
        'Erst alle vorbereiten, dann „Kampf starten“ im Karussell.',
    );
    return true;
  }
  if (!combat.started) return false;
  if (arePlayerStonesReadyForRound(combat)) return false;
  ui.notifications?.warn(stoneWaitMessage(combat));
  if (game.user?.isGM) {
    void promptGmAssignPendingStones(combat);
  } else {
    void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
      void resumePlayerEncounterSetup(combat);
    });
  }
  return true;
}

async function promptGmAssignPendingStones(combat: Combat): Promise<void> {
  if (!game.user?.isGM || gmStonePromptOpen) return;
  const existingStone = (globalThis as any).foundry?.applications?.instances?.get?.('mastery-stone-powers');
  if (existingStone) return;

  const pending = pendingStoneCombatants(combat);
  if (!pending.length) return;

  gmStonePromptOpen = true;
  try {
    const choice = await askGmFillPendingStones(pendingStonePlayerNames(combat));
    if (choice !== 'fill') return;
    await assignPendingStonesAsGm(combat);
  } finally {
    gmStonePromptOpen = false;
  }
}

async function askGmFillPendingStones(names: string[]): Promise<'fill' | 'wait'> {
  const who = names.length ? names.join(', ') : 'Spieler';
  const content =
    `<p>Noch nicht alle haben Steine für diese Runde bestätigt.</p>` +
    `<p><strong>Noch offen: ${who}</strong></p>` +
    `<p>Du kannst die Steine jetzt für die Spieler verteilen und bestätigen.</p>`;

  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.wait === 'function') {
    const result = await DialogV2.wait({
      window: { title: 'Steine noch offen' },
      content,
      buttons: [
        { action: 'fill', label: 'Für Spieler ausfüllen', icon: 'fa-solid fa-gem', default: true },
        { action: 'wait', label: 'Warten', icon: 'fa-solid fa-clock' },
      ],
      rejectClose: false,
    });
    return result === 'fill' ? 'fill' : 'wait';
  }

  const DialogCls = (globalThis as any).Dialog;
  if (typeof DialogCls !== 'function') return 'wait';

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: 'fill' | 'wait') => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    new DialogCls({
      title: 'Steine noch offen',
      content,
      buttons: {
        fill: {
          icon: '<i class="fas fa-gem"></i>',
          label: 'Für Spieler ausfüllen',
          callback: () => finish('fill'),
        },
        wait: {
          icon: '<i class="fas fa-clock"></i>',
          label: 'Warten',
          callback: () => finish('wait'),
        },
      },
      default: 'fill',
      close: () => finish('wait'),
    }).render(true);
  });
}

/** GM walks each open PC and can confirm stones on their behalf. */
export async function assignPendingStonesAsGm(combat: Combat): Promise<number> {
  if (!game.user?.isGM) return 0;
  const { persistCombatantSetupStep } = await import('./encounter-setup-flags.js');
  const { handleStonePowersComplete } = await import('./stone-powers-flow.js');
  const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
  const { canCurrentUserUpdateDocument, resolveLiveCombat } = await import('./combat-permissions.js');

  const live = resolveLiveCombat(combat);
  if (!live) return 0;

  let confirmedCount = 0;
  for (const combatant of pendingStoneCombatants(live)) {
    const actor = combatant.actor;
    if (!actor) continue;
    const round = Math.max(1, Number(live.round) || 1);
    if (round > 1 && canCurrentUserUpdateDocument(actor)) {
      try {
        const { syncStonePoolCapsFromAttributes } = await import('./action-economy.js');
        await syncStonePoolCapsFromAttributes(actor);
      } catch (err) {
        console.warn('Mastery System | Could not sync stone pools before GM fill', err);
      }
    }

    const confirmed = await StonePowersDialog.showForActor(actor, combatant);
    if (!confirmed) continue;

    await persistCombatantSetupStep(combatant, live, { stonesDoneRound: round });
    await handleStonePowersComplete(live, combatant.id, round);
    confirmedCount += 1;
  }

  const still = pendingStonePlayerNames(live);
  if (!still.length) {
    ui.notifications?.info('Steine für alle Spieler bestätigt. Der Zug kann weitergehen.');
  } else {
    ui.notifications?.warn(`Noch offen: ${still.join(', ')}.`);
  }
  return confirmedCount;
}

/** Blocks Foundry tracker Next Turn / Next Round while PC stones are still open. */
export function initializeStoneRoundGate(): void {
  Hooks.on('preUpdateCombat', (combat: Combat, changes: any, _options: any, userId: string) => {
    if (userId !== game.user?.id) return;
    if (changes?.turn === undefined && changes?.round === undefined) return;
    if (warnIfPlayerStonesPending(combat)) return false;
    return;
  });
}
