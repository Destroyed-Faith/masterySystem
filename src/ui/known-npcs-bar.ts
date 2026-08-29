/**
 * Player-facing portrait bar for GM-released important NPCs.
 */

import { resolveActorPortraitSrc } from '../epic-roll/epic-mastery-roll-portraits.js';
import {
  collectReleasedKnownNpcs,
  isKnownNpcReleased,
  readKnownNpcIds,
  readKnownNpcsBarCollapsed,
  removeKnownNpc,
  setKnownNpcsBarCollapsed,
} from '../system/known-npcs.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseBar = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

function loc(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(key);
  return raw && raw !== key ? raw : fallback;
}

export async function openKnownNpcPortrait(actorId: string): Promise<void> {
  const actor = (game as any).actors?.get?.(actorId);
  if (!actor || String(actor.type || '') !== 'npc') return;
  const imgSrc = resolveActorPortraitSrc(actor);
  const title = String(actor.name || loc('MASTERY.knownNpcs.title', 'Important NPCs'));
  try {
    const ImagePopoutClass =
      (foundry as any)?.applications?.apps?.ImagePopout?.implementation || (window as any).ImagePopout;
    if (ImagePopoutClass) {
      const popout = new ImagePopoutClass(imgSrc, {
        title,
        shareable: false,
        uuid: actor.uuid,
      });
      await popout.render(true);
      return;
    }
  } catch (err) {
    console.warn('Mastery System | Known NPC portrait popout failed', err);
  }
  ui.notifications?.info(title);
}

export class KnownNpcsBar extends BaseBar {
  private static _instance: KnownNpcsBar | null = null;

  static DEFAULT_OPTIONS = {
    id: 'mastery-known-npcs-bar',
    classes: ['mastery-system', 'known-npcs-bar'],
    position: { width: 'auto' },
    window: {
      title: 'Important NPCs',
      frame: false,
      positioned: false,
      resizable: false,
      minimizable: false,
    },
    actions: {
      toggle: function (this: KnownNpcsBar, event: Event) {
        event.preventDefault();
        void this.#toggleCollapsed();
      },
      portrait: function (this: KnownNpcsBar, event: Event) {
        event.preventDefault();
        const btn = (event.target as HTMLElement | null)?.closest?.('[data-actor-id]') as HTMLElement | null;
        void openKnownNpcPortrait(btn?.dataset.actorId || '');
      },
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/known-npcs-bar.hbs' },
  };

  static get instance(): KnownNpcsBar | null {
    return KnownNpcsBar._instance;
  }

  static async refresh(): Promise<void> {
    const npcs = collectReleasedKnownNpcs((game as any).actors ?? [], readKnownNpcIds());
    const existing = foundry.applications.instances.get('mastery-known-npcs-bar') as KnownNpcsBar | undefined;
    if (!npcs.length) {
      if (existing) await (existing as any).close();
      KnownNpcsBar._instance = null;
      return;
    }
    if (existing) {
      KnownNpcsBar._instance = existing;
      if ((existing as any).rendered) {
        await (existing as any).render({ force: true, focus: false });
        return;
      }
    }
    KnownNpcsBar._instance = existing ?? new KnownNpcsBar();
    await (KnownNpcsBar._instance as any).render({ force: true, focus: false });
  }

  async _prepareContext(_options: any): Promise<any> {
    const npcs = collectReleasedKnownNpcs((game as any).actors ?? [], readKnownNpcIds()).map((npc) => {
      const actor = (game as any).actors?.get?.(npc.actorId);
      return { ...npc, img: resolveActorPortraitSrc(actor, npc.img) };
    });
    return {
      npcs,
      hasNpcs: npcs.length > 0,
      collapsed: readKnownNpcsBarCollapsed(),
      title: loc('MASTERY.knownNpcs.title', 'Important NPCs'),
      expandLabel: loc('MASTERY.knownNpcs.expand', 'Show important NPCs'),
      collapseLabel: loc('MASTERY.knownNpcs.collapse', 'Hide important NPCs'),
    };
  }

  async #toggleCollapsed(): Promise<void> {
    await setKnownNpcsBarCollapsed(!readKnownNpcsBarCollapsed());
    await (this as any).render({ force: true, focus: false });
  }
}

export function initializeKnownNpcsBar(): void {
  const refresh = () => {
    void KnownNpcsBar.refresh();
  };

  Hooks.once('ready', refresh);
  Hooks.on('canvasReady', refresh);

  Hooks.on('updateSetting', (setting: any) => {
    const key = String(setting?.key ?? '');
    if (key === 'mastery-system.knownNpcs' || key.endsWith('.knownNpcs')) refresh();
  });

  Hooks.on('updateActor', (actor: any) => {
    if (String(actor?.type || '') !== 'npc') return;
    refresh();
  });

  Hooks.on('createActor', (actor: any) => {
    if (String(actor?.type || '') !== 'npc') return;
    refresh();
  });

  Hooks.on('deleteActor', (actor: any) => {
    if (String(actor?.type || '') !== 'npc') return;
    const id = String(actor?.id || '');
    if (id && (game as any).user?.isGM && isKnownNpcReleased(id)) {
      void removeKnownNpc(id).then(refresh);
      return;
    }
    refresh();
  });
}
