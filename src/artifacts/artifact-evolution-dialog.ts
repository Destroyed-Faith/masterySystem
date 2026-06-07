/**
 * Actor-facing artifact evolution: activate (1 Stone), upgrade along tree.
 *
 *   • Activate / link: 1 Stone once (MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step.
 */

import {
  ARTIFACT_CAPACITY_DEFAULT,
  ARTIFACT_LINK_STONE_COST,
  ARTIFACT_MAX_SYSTEM_LEVEL,
  ARTIFACT_UPGRADE_XP_COST,
  countBoundArtifacts,
  listArtifactSpendableStonePools,
  usesStonePoolEconomy,
} from '../utils/artifact-actor-rules.js';
import { repairActorEchoArtifacts } from '../utils/artifact-echo-repair.js';
import {
  buildArtifactEvolutionCards,
  linkArtifactForActor,
  upgradeArtifactForActor,
} from './artifact-evolution-actions.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export class ArtifactEvolutionDialog extends BaseDialog {
  private actor: Actor;

  static DEFAULT_OPTIONS = {
    id: 'artifact-evolution-dialog',
    classes: ['mastery-system', 'artifact-evolution-dialog'],
    position: { width: 560, height: 640 },
    window: {
      title: 'Echo & Artifact Progression',
      resizable: true,
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/artifacts/artifact-evolution-dialog.hbs' },
  };

  constructor(actor: Actor, options: Record<string, unknown> = {}) {
    const mergedOptions = foundry.utils.mergeObject(ArtifactEvolutionDialog.DEFAULT_OPTIONS, options);
    super(mergedOptions);
    this.actor = actor;
  }

  protected async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
    const boundCount = countBoundArtifacts(this.actor);
    const stonePools = listArtifactSpendableStonePools(this.actor);
    return {
      actor: this.actor,
      cards: buildArtifactEvolutionCards(this.actor),
      stonePools,
      usesStonePools: usesStonePoolEconomy(this.actor),
      capacity: {
        bound: boundCount,
        max: ARTIFACT_CAPACITY_DEFAULT,
        full: boundCount >= ARTIFACT_CAPACITY_DEFAULT,
      },
      constants: {
        linkStone: ARTIFACT_LINK_STONE_COST,
        upXp: ARTIFACT_UPGRADE_XP_COST,
        maxLevel: ARTIFACT_MAX_SYSTEM_LEVEL,
      },
    };
  }

  #dialogRoot(): HTMLElement | null {
    const el = (this as any).element as HTMLElement | undefined;
    return el?.querySelector('.ae-dialog') ?? el ?? null;
  }

  #firstEnabledOption(select: HTMLSelectElement | null): HTMLOptionElement | null {
    if (!select) return null;
    return Array.from(select.options).find((o) => o.value && !o.disabled) ?? null;
  }

  protected async _onRender(_context: unknown, _options: unknown): Promise<void> {
    const root = this.#dialogRoot();
    if (!root) return;

    root.querySelectorAll<HTMLSelectElement>('.ae-stone-select').forEach((sel) => {
      if (!sel.value) {
        const first = this.#firstEnabledOption(sel);
        if (first) sel.value = first.value;
      }
    });

    root.querySelectorAll<HTMLSelectElement>('.ae-path-select').forEach((sel) => {
      if (!sel.value || sel.selectedOptions[0]?.disabled) {
        const first = this.#firstEnabledOption(sel);
        if (first) sel.value = first.value;
      }
    });

    const closeBtn = root.querySelector<HTMLElement>('[data-action="ae-close"]');
    if (closeBtn) {
      closeBtn.onclick = (ev) => {
        ev.preventDefault();
        this.close();
      };
    }

    root.querySelectorAll<HTMLElement>('[data-action="ae-activate"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const card = btn.closest('.ae-card');
        const sel = card?.querySelector<HTMLSelectElement>('.ae-stone-select');
        const stoneAttr = sel?.value;
        if (!stoneAttr) {
          ui.notifications?.warn('Wähle einen Stone aus deinem Pool.');
          return;
        }
        const ok = await linkArtifactForActor(
          this.actor,
          String(btn.dataset.rootId),
          String(btn.dataset.embId),
          stoneAttr,
        );
        if (ok) await this.render({ force: true });
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ae-link"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const ok = await linkArtifactForActor(
          this.actor,
          String(btn.dataset.rootId),
          String(btn.dataset.embId),
        );
        if (ok) await this.render({ force: true });
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ae-upgrade-selected"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const card = btn.closest('.ae-card');
        const sel = card?.querySelector<HTMLSelectElement>('.ae-path-select');
        const opt = sel?.selectedOptions[0];
        if (!sel?.value || !opt || opt.disabled) {
          ui.notifications?.warn('Wähle einen gültigen Evolution-Pfad.');
          return;
        }
        const ok = await upgradeArtifactForActor(
          this.actor,
          String(btn.dataset.rootId),
          String(btn.dataset.embId),
          String(opt.dataset.worldId),
          String(sel.value),
        );
        if (ok) await this.render({ force: true });
      };
    });
  }
}

export async function openArtifactEvolutionDialog(actor: Actor): Promise<void> {
  try {
    await repairActorEchoArtifacts(actor);
  } catch (err) {
    console.warn('[mastery-system] echo artifact repair failed', err);
  }

  const existing = foundry.applications.instances.get('artifact-evolution-dialog');
  if (existing) {
    (existing as any).bringToFront?.();
    await (existing as any).render({ force: true });
    return;
  }

  const dlg = new ArtifactEvolutionDialog(actor);
  dlg.render(true);
}
