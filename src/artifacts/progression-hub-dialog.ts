/**
 * Unified Progression Hub — Attributes, Skills, Powers, and Artifacts in one dialog.
 */

import {
  ARTIFACT_CAPACITY_DEFAULT,
  ARTIFACT_LINK_STONE_COST,
  ARTIFACT_MAX_SYSTEM_LEVEL,
  ARTIFACT_UPGRADE_XP_COST,
  listArtifactSpendableStonePools,
  usesStonePoolEconomy,
} from '../utils/artifact-actor-rules.js';
import { repairArtifactEvolutionLinks } from '../utils/artifact-echo-repair.js';
import {
  applyAttributePendingChanges,
  applyPowerPendingChanges,
  applySkillPendingChanges,
  buildProgressionHubContext,
  calculateAttributePendingNetCost,
  calculatePowerPendingNetCost,
  calculateSkillPendingNetCost,
  getAttributeXpBaseline,
  hasFreeXp,
} from '../progression/progression-hub-actions.js';
import {
  buildArtifactEvolutionCards,
  linkArtifactForActor,
  resetArtifactActivationForActor,
  upgradeArtifactForActor,
} from './artifact-evolution-actions.js';
import { wireEmbeddedArtifactToWorldTree } from '../utils/artifact-tree-grant.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export type ProgressionHubSection = 'overview' | 'attributes' | 'skills' | 'powers' | 'artifacts';

export class ProgressionHubDialog extends BaseDialog {
  private actor: Actor;
  private expandSection: ProgressionHubSection;
  private pendingAttributes: Record<string, number> = {};
  private pendingSkills: Record<string, number> = {};
  private pendingPowers: Record<string, number> = {};

  static DEFAULT_OPTIONS = {
    id: 'progression-hub-dialog',
    classes: ['mastery-system', 'progression-hub-dialog'],
    position: { width: 620, height: 720 },
    window: {
      title: 'Progression',
      resizable: true,
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/artifacts/progression-hub-dialog.hbs' },
  };

  constructor(actor: Actor, options: Record<string, unknown> = {}) {
    const mergedOptions = foundry.utils.mergeObject(ProgressionHubDialog.DEFAULT_OPTIONS, options);
    super(mergedOptions);
    this.actor = actor;
    this.expandSection = (options.expandSection as ProgressionHubSection) || 'overview';
  }

  protected async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
    const hub = buildProgressionHubContext(this.actor);
    const stonePools = listArtifactSpendableStonePools(this.actor);
    const attrNet = calculateAttributePendingNetCost(this.actor, this.pendingAttributes);
    const skillNet = calculateSkillPendingNetCost(this.actor, this.pendingSkills);
    const powerNet = calculatePowerPendingNetCost(this.actor, this.pendingPowers);
    const remainingAfterPending = hub.xp.available - attrNet - skillNet - powerNet;

    return {
      actor: this.actor,
      expandOverview: this.expandSection === 'overview',
      expandAttributes: this.expandSection === 'attributes',
      expandSkills: this.expandSection === 'skills',
      expandPowers: this.expandSection === 'powers',
      expandArtifacts: this.expandSection === 'artifacts',
      hub,
      stonePools,
      usesStonePools: usesStonePoolEconomy(this.actor),
      isGM: game.user?.isGM === true,
      pendingAttributes: this.pendingAttributes,
      pendingSkills: this.pendingSkills,
      pendingPowers: this.pendingPowers,
      hasPendingAttributes: Object.keys(this.pendingAttributes).length > 0,
      hasPendingSkills: Object.keys(this.pendingSkills).length > 0,
      hasPendingPowers: Object.keys(this.pendingPowers).length > 0,
      attrNet,
      skillNet,
      powerNet,
      remainingAfterPending,
      hasFreeXpPhase: hasFreeXp(this.actor),
      capacity: hub.artifactCapacity,
      cards: buildArtifactEvolutionCards(this.actor),
      hasUnwiredArtifacts: hub.unwiredArtifacts.length > 0,
      constants: {
        linkStone: ARTIFACT_LINK_STONE_COST,
        upXp: ARTIFACT_UPGRADE_XP_COST,
        maxLevel: ARTIFACT_MAX_SYSTEM_LEVEL,
        capacityMax: ARTIFACT_CAPACITY_DEFAULT,
      },
    };
  }

  #dialogRoot(): HTMLElement | null {
    const el = (this as any).element as HTMLElement | undefined;
    return el?.querySelector('.ph-dialog') ?? el ?? null;
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

    root.querySelector<HTMLElement>('[data-action="ph-close"]')!.onclick = (ev) => {
      ev.preventDefault();
      this.close();
    };

    root.querySelectorAll<HTMLElement>('[data-action="ph-attr-dec"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const key = String(btn.dataset.attr);
        this.#bumpPending(this.pendingAttributes, key, -1, () =>
          getAttributeXpBaseline(this.actor, key),
        );
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ph-attr-inc"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const key = String(btn.dataset.attr);
        this.#bumpPending(this.pendingAttributes, key, 1);
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ph-skill-dec"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const key = String(btn.dataset.skill);
        this.#bumpPending(this.pendingSkills, key, -1);
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ph-skill-inc"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const key = String(btn.dataset.skill);
        this.#bumpPending(this.pendingSkills, key, 1);
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ph-power-dec"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const id = String(btn.dataset.powerId);
        this.#bumpPending(this.pendingPowers, id, -1);
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="ph-power-inc"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const id = String(btn.dataset.powerId);
        this.#bumpPending(this.pendingPowers, id, 1);
      };
    });

    root.querySelector<HTMLElement>('[data-action="ph-confirm-attr"]')!.onclick = async (ev) => {
      ev.preventDefault();
      const res = await applyAttributePendingChanges(this.actor, this.pendingAttributes);
      if (!res.ok) {
        ui.notifications?.error(res.error || 'Could not apply attribute changes.');
        return;
      }
      this.pendingAttributes = {};
      await this.render({ force: true });
    };

    root.querySelector<HTMLElement>('[data-action="ph-confirm-skills"]')!.onclick = async (ev) => {
      ev.preventDefault();
      const res = await applySkillPendingChanges(this.actor, this.pendingSkills);
      if (!res.ok) {
        ui.notifications?.error(res.error || 'Could not apply skill changes.');
        return;
      }
      this.pendingSkills = {};
      await this.render({ force: true });
    };

    root.querySelector<HTMLElement>('[data-action="ph-confirm-powers"]')!.onclick = async (ev) => {
      ev.preventDefault();
      const res = await applyPowerPendingChanges(this.actor, this.pendingPowers);
      if (!res.ok) {
        ui.notifications?.error(res.error || 'Could not apply power changes.');
        return;
      }
      this.pendingPowers = {};
      await this.render({ force: true });
    };

    root.querySelectorAll<HTMLElement>('[data-action="ph-wire-artifact"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const embId = String(btn.dataset.embId);
        const emb = (this.actor as any).items.get(embId);
        if (!emb) return;
        const wire = await wireEmbeddedArtifactToWorldTree(this.actor, emb, { notify: true });
        if (!wire.ok && !wire.alreadyWired) {
          ui.notifications?.warn(wire.reason || 'Could not link artifact to world tree.');
          return;
        }
        await this.render({ force: true });
      };
    });

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
          content: `<p>Stone zurückgeben und <strong>${displayName}</strong> deaktivieren?</p>`,
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
  }

  #bumpPending(
    map: Record<string, number>,
    key: string,
    delta: number,
    minBaseline?: () => number,
  ): void {
    const current = map[key] || 0;
    const next = current + delta;
    if (next === 0) delete map[key];
    else map[key] = next;

    if (minBaseline && delta < 0) {
      const attrKey = key;
      const base = this.actor.system.attributes?.[attrKey]?.value || 0;
      const baseline = minBaseline();
      const effective = base + (map[key] || 0);
      if (effective < baseline) {
        delete map[key];
      }
    }

    void this.render({ force: true });
  }
}

export async function openProgressionHubDialog(
  actor: Actor,
  options: { expandSection?: ProgressionHubSection } = {},
): Promise<void> {
  try {
    await repairArtifactEvolutionLinks(actor);
  } catch (err) {
    console.warn('[mastery-system] artifact evolution repair failed', err);
  }

  const existing = foundry.applications.instances.get('progression-hub-dialog');
  if (existing) {
    const dlg = existing as ProgressionHubDialog;
    dlg['expandSection'] = options.expandSection || 'overview';
    dlg['actor'] = actor;
    dlg.bringToFront?.();
    await dlg.render({ force: true });
    return;
  }

  const dlg = new ProgressionHubDialog(actor, options);
  dlg.render(true);
}
