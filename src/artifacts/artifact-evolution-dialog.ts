/**
 * Actor-facing artifact evolution: Attunement ritual, then upgrade along tree.
 *
 *   • Attunement / Binding Ritual: one-time, no Stone reservation.
 *   • Level 1 is free after Attunement. Further levels cost 8 XP each.
 *   • Maximum reachable level = min(10, max(1, (MR − 1) × 2)).
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
import { repairArtifactEvolutionLinks } from '../utils/artifact-echo-repair.js';
import { listUnwiredEmbeddedArtifacts } from '../utils/artifact-tree-grant.js';
import {
  buildArtifactEvolutionCards,
  linkArtifactForActor,
  releaseAllArtifactActivationStones,
  resetArtifactActivationForActor,
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
    const unwired = listUnwiredEmbeddedArtifacts(this.actor);
    return {
      actor: this.actor,
      cards: buildArtifactEvolutionCards(this.actor),
      unwiredArtifacts: unwired.map((e: any) => ({ id: e.id, name: e.name })),
      hasUnwiredArtifacts: unwired.length > 0,
      stonePools,
      usesStonePools: usesStonePoolEconomy(this.actor),
      isGM: game.user?.isGM === true,
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

    const releaseAllBtn = root.querySelector<HTMLElement>('[data-action="ae-release-all-stones"]');
    if (releaseAllBtn) {
      releaseAllBtn.onclick = async (ev) => {
        ev.preventDefault();
        const confirmed = await Dialog.confirm({
          title: 'GM: Aktivierungs-Steine freigeben',
          content:
            '<p>Alle durch Artefakte blockierten <strong>Aktivierungs-Steine</strong> freigeben? ' +
            'Alle Artefakte dieses Charakters werden deaktiviert (Evolution-Level bleibt erhalten). ' +
            'Nützlich, wenn nach einem Reset noch falsche Steine blockiert sind.</p>',
          yes: () => true,
          no: () => false,
          defaultYes: false,
        });
        if (!confirmed) return;
        await releaseAllArtifactActivationStones(this.actor);
        await this.render({ force: true });
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

    root.querySelectorAll<HTMLElement>('[data-action="ae-gm-reset"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const displayName = btn.dataset.displayName || 'Artifact';
        const confirmed = await Dialog.confirm({
          title: 'GM: Aktivierung zurücksetzen',
          content: `<p>Stone zurückgeben und <strong>${displayName}</strong> deaktivieren? Der Spieler kann den Pool neu wählen. Evolution-Level bleibt erhalten.</p>`,
          yes: () => true,
          no: () => false,
          defaultYes: false,
        });
        if (!confirmed) return;
        const ok = await resetArtifactActivationForActor(
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

    root.querySelectorAll<HTMLElement>('[data-action="ae-gm-upgrade-selected"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const card = btn.closest('.ae-card');
        const sel = card?.querySelector<HTMLSelectElement>('.ae-path-select');
        const opt = sel?.selectedOptions[0];
        if (!sel?.value || !opt) {
          ui.notifications?.warn('Wähle einen gültigen Evolution-Pfad.');
          return;
        }
        if (opt.dataset.gmDisabled === '1' || opt.disabled) {
          ui.notifications?.warn('Dieser Pfad ist für ein GM-Upgrade nicht verfügbar (Artefakt zuerst aktivieren).');
          return;
        }
        const displayName = card?.querySelector('.ae-card-title')?.textContent?.trim() || 'Artifact';
        const pathLabel = opt.textContent?.trim() || sel.value;
        const confirmed = await Dialog.confirm({
          title: 'GM: Artefakt upgraden (ohne XP)',
          content:
            `<p><strong>${displayName}</strong> entlang <strong>${pathLabel}</strong> upgraden?</p>` +
            '<p>Kein XP wird abgezogen; MR-Cap und Upgrade-Step-Regel gelten nicht.</p>',
          yes: () => true,
          no: () => false,
          defaultYes: false,
        });
        if (!confirmed) return;
        const ok = await upgradeArtifactForActor(
          this.actor,
          String(btn.dataset.rootId),
          String(btn.dataset.embId),
          String(opt.dataset.worldId),
          String(sel.value),
          { gmFree: true },
        );
        if (ok) await this.render({ force: true });
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ae-wire-artifact"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const embId = String(btn.dataset.embId);
        const emb = (this.actor as any).items.get(embId);
        if (!emb) return;
        const { wireEmbeddedArtifactToWorldTree } = await import('../utils/artifact-tree-grant.js');
        const wire = await wireEmbeddedArtifactToWorldTree(this.actor, emb, { notify: true });
        if (!wire.ok && !wire.alreadyWired) {
          ui.notifications?.warn(wire.reason || 'Could not link artifact to world tree.');
          return;
        }
        await this.render({ force: true });
      };
    });
  }
}

export async function openArtifactEvolutionDialog(actor: Actor): Promise<void> {
  try {
    await repairArtifactEvolutionLinks(actor);
  } catch (err) {
    console.warn('[mastery-system] artifact evolution repair failed', err);
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
