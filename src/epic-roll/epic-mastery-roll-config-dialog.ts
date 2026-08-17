/**
 * Epic Mastery Roll — GM configuration dialog.
 */

import { SKILLS } from '../utils/skills.js';
import { buildDifficultyPresets } from '../dice/roll-context-build.js';
import type {
  EpicMasteryRollPreset,
  EpicMasteryRollStartConfig,
  EpicRollConfig,
  EpicRollKind,
  defaultRollTitleForKind,
} from './epic-mastery-roll-types.js';
import { startEpicMasteryRollSession } from './epic-mastery-roll-session.js';
import {
  listEpicRollCandidateActors,
  saveEpicRollRecentPreset,
} from './epic-mastery-roll-settings.js';
import { resolveActorPortraitSrc, portraitFallbackSrc } from './epic-mastery-roll-portraits.js';

const ATTRIBUTES = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
const CHALLENGE_MR_MIN = 2;
const CHALLENGE_MR_MAX = 8;
const CHALLENGE_MR_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

function clampChallengeMR(value: number): number {
  return Math.max(CHALLENGE_MR_MIN, Math.min(CHALLENGE_MR_MAX, Math.floor(value) || CHALLENGE_MR_MIN));
}

function defaultTnConfig(): EpicMasteryRollStartConfig['tn'] {
  const challengeMR = CHALLENGE_MR_MIN;
  const presets = buildDifficultyPresets(challengeMR);
  return {
    challengeMR,
    baseTN: presets.standard,
    raises: 0,
  };
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export class EpicMasteryRollConfigDialog extends BaseDialog {
  private sceneTitle = '';
  private flavor = '';
  private showTn = true;
  private tn = defaultTnConfig();
  private rollKind: EpicRollKind = 'skill';
  private skillKey = 'athletics';
  private attributeKey = 'might';
  private selectedIds: string[] = [];
  private preset: EpicMasteryRollPreset | null = null;

  static DEFAULT_OPTIONS = {
    id: 'mastery-epic-roll-config',
    classes: ['mastery-system', 'epic-mastery-roll-config'],
    position: { width: 920, height: 640 },
    window: {
      title: 'Skill Roll',
      resizable: true,
    },
  };

  static PARTS = {
    content: {
      template: 'systems/mastery-system/templates/epic-roll/config-dialog.hbs',
    },
  };

  constructor(preset?: EpicMasteryRollPreset) {
    super();
    if (preset) {
      this.applyPreset(preset);
    } else {
      this.selectedIds = [];
    }
  }

  private applyPreset(preset: EpicMasteryRollPreset): void {
    this.preset = preset;
    this.sceneTitle = preset.title;
    this.flavor = preset.flavor;
    this.showTn = preset.showTn;
    this.tn = { ...preset.tn, challengeMR: clampChallengeMR(preset.tn.challengeMR) };
    this.rollKind = preset.roll.kind;
    if (preset.roll.kind === 'skill') this.skillKey = preset.roll.skillKey;
    if (preset.roll.kind === 'attribute') this.attributeKey = preset.roll.attributeKey;
    this.selectedIds = [...preset.actorIds].filter((id) => {
      const actor = game.actors?.get(id);
      return actor?.type === 'character';
    });
  }

  protected async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
    const allActors = listEpicRollCandidateActors();
    const selectedSet = new Set(this.selectedIds);
    const presets = buildDifficultyPresets(this.tn.challengeMR);
    const raiseTn = this.tn.baseTN + this.tn.raises * 4;

    const skills = Object.entries(SKILLS)
      .map(([key, def]) => ({ key, name: def.name, category: def.category }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const mapActorRow = (a: { id: string; name: string; type: string; img: string }) => ({
      ...a,
      img: resolveActorPortraitSrc(game.actors?.get(a.id), a.img),
    });

    return {
      title: this.sceneTitle,
      flavor: this.flavor,
      showTn: this.showTn,
      tn: this.tn,
      raiseTn,
      presets,
      challengeMROptions: CHALLENGE_MR_OPTIONS,
      rollKind: this.rollKind,
      skillKey: this.skillKey,
      attributeKey: this.attributeKey,
      attributes: ATTRIBUTES,
      skills,
      availableActors: allActors.filter((a) => !selectedSet.has(a.id)).map(mapActorRow),
      selectedActors: allActors.filter((a) => selectedSet.has(a.id)).map(mapActorRow),
    };
  }

  protected async _onRender(context: unknown, options: unknown): Promise<void> {
    await super._onRender(context, options);
    const root = this.element as HTMLElement;
    const fallback = portraitFallbackSrc();
    root.querySelectorAll<HTMLImageElement>('.emr-actor-thumb').forEach((img) => {
      img.onerror = () => {
        if (img.src !== fallback) img.src = fallback;
      };
    });

    const bindInput = (selector: string, handler: (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => void) => {
      root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector).forEach((el) => {
        el.addEventListener('input', () => handler(el));
        el.addEventListener('change', () => handler(el));
      });
    };

    bindInput('[name="emr-title"]', (el) => {
      this.sceneTitle = (el as HTMLInputElement).value;
    });
    bindInput('[name="emr-flavor"]', (el) => {
      this.flavor = (el as HTMLTextAreaElement).value;
    });
    bindInput('[name="emr-show-tn"]', (el) => {
      this.showTn = (el as HTMLInputElement).checked;
    });
    bindInput('[name="emr-challenge-mr"]', (el) => {
      this.tn.challengeMR = clampChallengeMR(parseInt((el as HTMLSelectElement).value) || CHALLENGE_MR_MIN);
      const p = buildDifficultyPresets(this.tn.challengeMR);
      this.tn.baseTN = p.standard;
      this.render(false);
    });
    bindInput('[name="emr-base-tn-preset"]', (el) => {
      const val = (el as HTMLSelectElement).value;
      if (val === 'custom') return;
      this.tn.baseTN = parseInt(val) || this.tn.baseTN;
      this.render(false);
    });
    bindInput('[name="emr-custom-tn"]', (el) => {
      this.tn.baseTN = parseInt((el as HTMLInputElement).value) || 0;
      this.render(false);
    });
    bindInput('[name="emr-raises"]', (el) => {
      this.tn.raises = Math.max(0, parseInt((el as HTMLInputElement).value) || 0);
      this.render(false);
    });
    bindInput('[name="emr-roll-kind"]', (el) => {
      this.rollKind = (el as HTMLSelectElement).value as EpicRollKind;
      this.render(false);
    });
    bindInput('[name="emr-skill-key"]', (el) => {
      this.skillKey = (el as HTMLSelectElement).value;
    });
    bindInput('[name="emr-attribute-key"]', (el) => {
      this.attributeKey = (el as HTMLSelectElement).value;
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-add-actor"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const id = btn.dataset.actorId;
        if (id && !this.selectedIds.includes(id)) {
          this.selectedIds.push(id);
          this.render(false);
        }
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-remove-actor"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const id = btn.dataset.actorId;
        if (id) {
          this.selectedIds = this.selectedIds.filter((x) => x !== id);
          this.render(false);
        }
      };
    });

    const startBtn = root.querySelector<HTMLElement>('[data-action="emr-start"]');
    if (startBtn) {
      startBtn.onclick = async (ev) => {
        ev.preventDefault();
        await this.startSession();
      };
    }
  }

  private buildRollConfig(): EpicRollConfig {
    if (this.rollKind === 'attribute') {
      return { kind: 'attribute', attributeKey: this.attributeKey };
    }
    return { kind: 'skill', skillKey: this.skillKey };
  }

  private readCustomTnFromDom(): void {
    const root = this.element as HTMLElement;
    const preset = root.querySelector<HTMLSelectElement>('[name="emr-base-tn-preset"]')?.value;
    if (preset === 'custom') {
      const custom = root.querySelector<HTMLInputElement>('[name="emr-custom-tn"]');
      if (custom) this.tn.baseTN = parseInt(custom.value) || this.tn.baseTN;
    }
  }

  private async startSession(): Promise<void> {
    this.readCustomTnFromDom();

    const config: EpicMasteryRollStartConfig = {
      title: this.sceneTitle.trim() || defaultRollTitleForKind(this.rollKind),
      flavor: this.flavor.trim(),
      showTn: this.showTn,
      tn: { ...this.tn },
      roll: this.buildRollConfig(),
      actorIds: [...this.selectedIds].filter((id) => game.actors?.get(id)?.type === 'character'),
    };

    const session = await startEpicMasteryRollSession(config);
    if (!session) return;

    await saveEpicRollRecentPreset({
      title: config.title,
      flavor: config.flavor,
      showTn: config.showTn,
      tn: config.tn,
      roll: config.roll,
      actorIds: config.actorIds,
    });

    this.close();
  }
}

export function showEpicMasteryRollConfigDialog(preset?: EpicMasteryRollPreset): void {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start a Skill Roll.');
    return;
  }

  const existing = foundry.applications.instances.get('mastery-epic-roll-config');
  if (existing) {
    (existing as any).bringToFront?.();
    return;
  }

  new EpicMasteryRollConfigDialog(preset).render(true);
}

export async function requestEpicMasteryRoll(preset?: EpicMasteryRollPreset): Promise<void> {
  showEpicMasteryRollConfigDialog(preset);
}
