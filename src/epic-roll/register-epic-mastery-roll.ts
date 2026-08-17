/**
 * Epic Mastery Roll — chat button, hooks, and initialization.
 */

import { registerEpicMasteryRollSettings, loadEpicRollRecentPresets } from './epic-mastery-roll-settings.js';
import { registerEpicMasteryRollSocket } from './epic-mastery-roll-socket.js';
import { getActiveEpicMasteryRollSession } from './epic-mastery-roll-session.js';
import {
  requestEpicMasteryRoll,
  showEpicMasteryRollConfigDialog,
} from './epic-mastery-roll-config-dialog.js';

function resolveChatControls(
  elements?: Record<string, HTMLElement>,
  htmlRoot?: HTMLElement | JQuery | null,
): HTMLElement | null {
  if (elements) {
    for (const key of ['#chat-controls', 'chat-controls']) {
      const el = elements[key];
      if (el instanceof HTMLElement) return el;
    }
    for (const el of Object.values(elements)) {
      if (el instanceof HTMLElement && el.id === 'chat-controls') return el;
    }
  }

  if (htmlRoot instanceof HTMLElement) {
    return htmlRoot.querySelector('#chat-controls');
  }

  if (htmlRoot && typeof (htmlRoot as JQuery).find === 'function') {
    const found = (htmlRoot as JQuery).find('#chat-controls');
    if (found.length) return found[0] ?? null;
  }

  return document.querySelector('#chat-controls');
}

function injectEpicRollButton(controlsEl: HTMLElement | null | undefined): void {
  if (!game.user?.isGM || !controlsEl) return;
  if (controlsEl.querySelector('.emr-chat-launch')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'emr-chat-launch';
  button.title = 'Skill Roll — group skill or attribute check';
  button.innerHTML = '<i class="fas fa-dice-d20"></i><span>Skill Roll</span>';

  button.addEventListener('click', (ev) => {
    ev.preventDefault();
    showEpicMasteryRollConfigDialog();
  });

  button.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    showEpicRollRecentMenu();
  });

  controlsEl.prepend(button);
}

function tryInjectEpicRollButton(
  elements?: Record<string, HTMLElement>,
  htmlRoot?: HTMLElement | JQuery | null,
): void {
  injectEpicRollButton(resolveChatControls(elements, htmlRoot));
}

export function initializeEpicMasteryRoll(): void {
  registerEpicMasteryRollSettings();
  registerEpicMasteryRollSocket();

  // Foundry v13: chat input + #chat-controls are re-parented outside renderChatLog.
  Hooks.on('renderChatInput', (_app: unknown, elements: Record<string, HTMLElement>) => {
    tryInjectEpicRollButton(elements);
  });

  // v12 / log-only render fallback.
  Hooks.on('renderChatLog', (_app: unknown, html: HTMLElement | JQuery) => {
    tryInjectEpicRollButton(undefined, html);
  });

  // Sidebar chat tab (covers first paint when input is already in the DOM).
  Hooks.on('renderSidebarTab', (app: any, html: HTMLElement | JQuery, data?: { tab?: string }) => {
    const tab = data?.tab ?? app?.tab?.name ?? app?.options?.tab?.id;
    if (tab && tab !== 'chat') return;
    const root = html instanceof HTMLElement ? html : (html as JQuery)?.[0];
    tryInjectEpicRollButton(undefined, root ?? html);
  });

  Hooks.on('changeSidebarTab', () => {
    window.setTimeout(() => tryInjectEpicRollButton(), 0);
  });

  Hooks.once('ready', () => {
    window.setTimeout(() => tryInjectEpicRollButton(), 250);
  });
}

function showEpicRollRecentMenu(): void {
  const presets = loadEpicRollRecentPresets();
  if (presets.length === 0) {
    ui.notifications?.info('No recent Skill Roll presets yet.');
    return;
  }

  const buttons: Record<string, { label: string; callback: () => void }> = {};
  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i]!;
    const key = `preset${i}`;
    buttons[key] = {
      label: preset.title || `Preset ${i + 1}`,
      callback: () => showEpicMasteryRollConfigDialog(preset),
    };
  }
  buttons.cancel = { label: 'Cancel', callback: () => undefined };

  new Dialog(
    {
      title: 'Recent Skill Rolls',
      content: '<p class="emr-recent-hint">Choose a recent configuration to pre-fill the dialog.</p>',
      buttons,
    },
    { classes: ['mastery-system', 'epic-mastery-roll-config'] },
  ).render(true);
}

export {
  getActiveEpicMasteryRollSession,
  requestEpicMasteryRoll,
  showEpicMasteryRollConfigDialog,
};
