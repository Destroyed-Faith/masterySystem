/**
 * GM utility: wipe XP accounting on a character without reverting purchased
 * attributes / skills / powers (use `resetActorProgressToPostCreation` for that).
 */

import { emptyStep } from './xp-step-rule.js';

export interface XpAccountingSnapshot {
  regularAvailable: number;
  freeAvailable: number;
  totalEarned: number;
  totalSpent: number;
  freeEarned: number;
  freeSpent: number;
  historyLength: number;
}

/** Read current XP pool totals for confirm dialogs. */
export function readXpAccounting(actor: any): XpAccountingSnapshot {
  const points = actor?.system?.points ?? {};
  const xp = actor?.system?.xp ?? {};
  return {
    regularAvailable: Number(points.xp ?? 0),
    freeAvailable: Number(points.xpFree ?? 0),
    totalEarned: Number(xp.totalEarned ?? 0),
    totalSpent: Number(xp.totalSpent ?? 0),
    freeEarned: Number(xp.freeEarned ?? 0),
    freeSpent: Number(xp.freeSpent ?? 0),
    historyLength: Array.isArray(xp.history) ? xp.history.length : 0,
  };
}

export function hasAnyXpAccounting(snap: XpAccountingSnapshot): boolean {
  return (
    snap.regularAvailable > 0 ||
    snap.freeAvailable > 0 ||
    snap.totalEarned > 0 ||
    snap.totalSpent > 0 ||
    snap.freeEarned > 0 ||
    snap.freeSpent > 0 ||
    snap.historyLength > 0
  );
}

/** HTML snippet for the GM confirm dialog. */
export function formatXpAccountResetConfirmHtml(actorName: string, snap: XpAccountingSnapshot): string {
  const totalAvail = snap.regularAvailable + snap.freeAvailable;
  return (
    `<p class="xp-reset-confirm">` +
    `<strong>${actorName}</strong>: Alle XP-Konten auf <strong>0</strong> setzen und die <strong>History löschen</strong>?` +
    `</p><ul class="xp-reset-summary">` +
    `<li>Verfügbar: ${totalAvail} (Regular ${snap.regularAvailable}, Free ${snap.freeAvailable})</li>` +
    `<li>Verdient / Ausgegeben: ${snap.totalEarned} / ${snap.totalSpent}</li>` +
    `<li>History-Einträge: ${snap.historyLength}</li>` +
    `</ul>` +
    `<p class="xp-reset-note"><em>Attribute, Skills und Power-Level bleiben unverändert. Für einen vollen Progressions-Reset nutze den Undo-Button.</em></p>`
  );
}

/**
 * Zero all XP balances, clear history, and reset the Upgrade Step bump lists.
 * Does not change attributes, skills, power levels, or post-creation snapshots.
 */
export async function resetActorXpAccounting(actor: any): Promise<void> {
  if (!actor) return;
  const step = emptyStep();
  await actor.update({
    'system.points.xp': 0,
    'system.points.xpFree': 0,
    'system.xp.totalEarned': 0,
    'system.xp.totalSpent': 0,
    'system.xp.freeEarned': 0,
    'system.xp.freeSpent': 0,
    'system.xp.history': [],
    'system.xp.currentStep.attributes': [...step.attributes],
    'system.xp.currentStep.skills': [...step.skills],
    'system.xp.currentStep.powers': [...step.powers],
    'system.xp.currentStep.artifacts': [...step.artifacts],
  });
}

/** Reset XP accounting for every character actor. Returns count touched. */
export async function resetAllCharactersXpAccounting(actors: any[]): Promise<number> {
  let n = 0;
  for (const actor of actors) {
    if (actor?.type !== 'character') continue;
    await resetActorXpAccounting(actor);
    n += 1;
  }
  return n;
}

/** GM confirm dialog — reset one character's XP accounting. */
export function promptResetActorXpAccounting(actor: any, onComplete?: () => void): void {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Nur der GM kann XP-Konten zurücksetzen.');
    return;
  }
  if (!actor) return;
  const snap = readXpAccounting(actor);
  new Dialog({
    title: `XP zurücksetzen: ${actor.name}`,
    content: formatXpAccountResetConfirmHtml(actor.name, snap),
    buttons: {
      reset: {
        icon: '<i class="fas fa-eraser"></i>',
        label: 'XP zurücksetzen',
        callback: async () => {
          await resetActorXpAccounting(actor);
          ui.notifications?.info(`XP-Konten und History für ${actor.name} zurückgesetzt.`);
          onComplete?.();
        },
      },
      cancel: {
        label: 'Abbrechen',
        callback: () => {},
      },
    },
    default: 'cancel',
  }).render(true);
}

/** GM confirm dialog — reset XP accounting on every player character. */
export function promptResetAllCharactersXpAccounting(onComplete?: () => void): void {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Nur der GM kann XP-Konten zurücksetzen.');
    return;
  }
  const characters =
    (game as any).actors?.filter((a: any) => a.type === 'character') ?? [];
  if (characters.length === 0) {
    ui.notifications?.warn('Keine Spieler-Charaktere gefunden.');
    return;
  }
  new Dialog({
    title: 'XP für alle zurücksetzen',
    content:
      `<p class="xp-reset-confirm">XP-Konten und History für <strong>${characters.length}</strong> Charaktere auf <strong>0</strong> setzen?</p>` +
      `<p class="xp-reset-note"><em>Attribute, Skills und Power-Level bleiben unverändert.</em></p>`,
    buttons: {
      reset: {
        icon: '<i class="fas fa-eraser"></i>',
        label: 'Alle zurücksetzen',
        callback: async () => {
          const n = await resetAllCharactersXpAccounting(characters);
          ui.notifications?.info(`XP-Konten und History für ${n} Charaktere zurückgesetzt.`);
          onComplete?.();
        },
      },
      cancel: {
        label: 'Abbrechen',
        callback: () => {},
      },
    },
    default: 'cancel',
  }).render(true);
}
