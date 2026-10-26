/**
 * Epic Mastery Roll — unified GM Rolls configuration dialog.
 * Skill Checks (Standard / Comparative / Group Ambush) share this UI with
 * Attribute and Fear rolls. The competing standalone Skill Check dialog is retired.
 */

import { SKILLS } from '../utils/skills.js';
import { buildDifficultyPresets } from '../dice/roll-context-build.js';
import { standardTnForMasteryRank } from '../utils/constants.js';
import { readSituationalSkills } from '../rules/index.js';
import type {
  EpicMasteryRollPreset,
  EpicMasteryRollStartConfig,
  EpicRollConfig,
  EpicRollKind,
} from './epic-mastery-roll-types.js';
import { defaultRollTitleForKind } from './epic-mastery-roll-types.js';
import { startEpicMasteryRollSession } from './epic-mastery-roll-session.js';
import {
  isEpicRollPlayerCharacter,
  listEpicRollCandidateActors,
  saveEpicRollRecentPreset,
} from './epic-mastery-roll-settings.js';
import { resolveActorPortraitSrc, portraitFallbackSrc } from './epic-mastery-roll-portraits.js';
import {
  ROLLS_ATTRIBUTES,
  applyApproachToRow,
  defaultComparativeConfig,
  emptyApproach,
  groupAmbushPoolPreview,
  listActorSkillOptions,
  participantSkillPreview,
  skillKeyFromRef,
  skillRefFromKey,
  taskLevelTnPresets,
  type RollsAllowedApproach,
  type RollsComparativeConfig,
  type RollsParticipantSkillRow,
  type RollsSkillMode,
} from './rolls-skill-panel.js';
import {
  ensureParticipantRows,
  startSkillWorkflowFromRolls,
} from './rolls-skill-start.js';

const ATTRIBUTES = [...ROLLS_ATTRIBUTES];
const CHALLENGE_MR_MIN = 1;
const CHALLENGE_MR_MAX = 8;
const CHALLENGE_MR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const SOCKET_NAME = 'system.mastery-system';

export interface RollsSkillSuggestion {
  actorId: string;
  skillKey: string;
  attributeKey: string;
  note: string;
  skillLabel: string;
}

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

  /** DF Skill System panel state */
  private taskDescription = '';
  private skillMode: RollsSkillMode = 'standard';
  private approaches: RollsAllowedApproach[] = [];
  private participantRows: RollsParticipantSkillRow[] = [];
  private comparative: RollsComparativeConfig = defaultComparativeConfig();
  private allowPlayerSuggestions = false;
  private pendingSuggestions: Record<string, RollsSkillSuggestion> = {};
  private socketBound = false;

  static DEFAULT_OPTIONS = {
    id: 'mastery-epic-roll-config',
    classes: ['mastery-system', 'epic-mastery-roll-config'],
    position: { width: 1100, height: 720 },
    window: {
      title: 'Rolls',
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
    if (preset.roll.kind === 'fear') {
      this.tn.baseTN = 16;
      this.tn.raises = 0;
    }
    this.selectedIds = [...preset.actorIds].filter((id) =>
      isEpicRollPlayerCharacter(game.actors?.get(id)),
    );
  }

  /** Open Rolls already configured for Comparative Group Ambush. */
  applyGroupAmbushPreset(): void {
    this.rollKind = 'skill';
    this.skillMode = 'comparative';
    this.comparative = {
      ...defaultComparativeConfig(),
      groupAmbush: true,
      source: 'virtual',
      virtual: {
        name: 'Observers',
        skillName: 'Perception',
        poolDice: 8,
        masteryRank: 2,
        skillRank: 2,
        attributeKey: 'wits',
        allowSkillCrit: false,
      },
    };
    if (!this.sceneTitle.trim()) this.sceneTitle = 'Group Ambush';
    if (!this.taskDescription.trim()) this.taskDescription = 'Group Ambush · Stealth';
  }

  private syncParticipantRows(): void {
    this.participantRows = ensureParticipantRows(
      this.selectedIds,
      this.participantRows,
      this.approaches,
      12,
    );
    if (this.comparative.groupAmbush) {
      if (!this.comparative.ambushParticipantIds.length) {
        this.comparative.ambushParticipantIds = [...this.selectedIds];
      }
      this.comparative.ambushParticipantIds = this.comparative.ambushParticipantIds.filter((id) =>
        this.selectedIds.includes(id),
      );
      if (
        !this.comparative.stealthSpecialistId ||
        !this.comparative.ambushParticipantIds.includes(this.comparative.stealthSpecialistId)
      ) {
        this.comparative.stealthSpecialistId =
          this.comparative.ambushParticipantIds[0] || this.selectedIds[0] || '';
      }
    }
  }

  private catalogSkillOptions(): Array<{ key: string; label: string }> {
    const map = new Map<string, string>();
    map.set('perception', 'Perception');
    map.set('untrained', 'Untrained');
    for (const id of this.selectedIds) {
      const actor = game.actors?.get(id);
      for (const opt of listActorSkillOptions(actor)) {
        if (!map.has(opt.key)) map.set(opt.key, opt.label);
      }
    }
    // Also include legacy SKILLS names as approach labels only when no Spec id known
    for (const [key, def] of Object.entries(SKILLS)) {
      if (!map.has(key)) map.set(key, def.name);
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }

  private listNpcActors(): Array<{ id: string; name: string }> {
    const out: Array<{ id: string; name: string }> = [];
    for (const a of game.actors ?? []) {
      if ((a as any).type === 'npc') {
        out.push({ id: String((a as any).id), name: String((a as any).name ?? 'NPC') });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  protected async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
    this.syncParticipantRows();
    const allActors = listEpicRollCandidateActors();
    const selectedSet = new Set(this.selectedIds);
    const presets = buildDifficultyPresets(this.tn.challengeMR);
    const raiseTn = this.tn.baseTN + this.tn.raises * 4;
    const taskLevelPresets = taskLevelTnPresets();
    const taskLevelTnValues = taskLevelPresets.map((p) => p.tn);

    const skills = Object.entries(SKILLS)
      .map(([key, def]) => ({ key, name: def.name, category: def.category }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const mapActorRow = (a: { id: string; name: string; type: string; img: string }) => {
      const row = this.participantRows.find((r) => r.actorId === a.id);
      const actor = game.actors?.get(a.id);
      let assignmentSummary = '';
      if (row && this.rollKind === 'skill' && actor) {
        const prev = participantSkillPreview(actor, row);
        assignmentSummary =
          this.skillMode === 'standard'
            ? `${prev.skillLabel} · ${row.attributeKey} · TN ${row.baseTn}`
            : `${prev.skillLabel} · ${row.attributeKey}`;
      }
      return {
        ...a,
        img: resolveActorPortraitSrc(game.actors?.get(a.id), a.img),
        assignmentSummary,
      };
    };

    const participantAssigns = this.participantRows.map((row) => {
      const actor = game.actors?.get(row.actorId) as any;
      const preview = actor ? participantSkillPreview(actor, row) : null;
      const suggestion = this.pendingSuggestions[row.actorId];
      return {
        actorId: row.actorId,
        actorName: actor?.name ?? row.actorId,
        skillKey: skillKeyFromRef(row.skillRef),
        attributeKey: row.attributeKey,
        baseTn: row.baseTn,
        skillOptions: listActorSkillOptions(actor),
        previewLine: preview
          ? `Rank ${preview.rank} · ${preview.advantageLabel} · ${preview.poolLabel}` +
            (preview.critAllowance
              ? ` · Crit ${preview.critRemaining}/${preview.critAllowance}`
              : '')
          : '',
        suggestion: suggestion || null,
      };
    });

    // Refresh approach labels from skill keys; flag custom TNs for the select
    const approachesView = this.approaches.map((ap) => {
      const hit = this.catalogSkillOptions().find((o) => o.key === ap.skillKey);
      if (hit) ap.label = hit.label.split(' · ')[0] || hit.label;
      return {
        ...ap,
        isCustomTn: !taskLevelTnValues.includes(ap.baseTn),
      };
    });

    const ambushIds = new Set(this.comparative.ambushParticipantIds);
    const ambushCandidateActors = this.selectedIds.map((id) => {
      const a = game.actors?.get(id) as any;
      return { id, name: a?.name ?? id, inAmbush: ambushIds.has(id) };
    });

    let ambushPreview: ReturnType<typeof groupAmbushPoolPreview> | null = null;
    if (
      this.rollKind === 'skill' &&
      this.skillMode === 'comparative' &&
      this.comparative.groupAmbush &&
      this.comparative.stealthSpecialistId
    ) {
      const specialist = game.actors?.get(this.comparative.stealthSpecialistId) as any;
      const parts = this.comparative.ambushParticipantIds
        .map((id) => game.actors?.get(id))
        .filter(Boolean) as any[];
      const row = this.participantRows.find(
        (r) => r.actorId === this.comparative.stealthSpecialistId,
      );
      if (specialist) {
        ambushPreview = groupAmbushPoolPreview(
          specialist,
          parts,
          row?.attributeKey || 'agility',
        );
      }
    }

    return {
      title: this.sceneTitle,
      flavor: this.flavor,
      showTn: this.showTn,
      tn: this.tn,
      raiseTn,
      presets,
      challengeMROptions: CHALLENGE_MR_OPTIONS.map((mr) => ({
        mr,
        standardTn: standardTnForMasteryRank(mr),
      })),
      isFearRoll: this.rollKind === 'fear',
      rollKind: this.rollKind,
      skillKey: this.skillKey,
      attributeKey: this.attributeKey,
      attributes: ATTRIBUTES,
      skills,
      availableActors: allActors.filter((a) => !selectedSet.has(a.id)).map(mapActorRow),
      selectedActors: allActors.filter((a) => selectedSet.has(a.id)).map(mapActorRow),
      taskDescription: this.taskDescription,
      skillMode: this.skillMode,
      approaches: approachesView,
      participantAssigns,
      allowPlayerSuggestions: this.allowPlayerSuggestions,
      comparative: this.comparative,
      npcActors: this.listNpcActors(),
      taskLevelPresets,
      taskLevelTnValues,
      catalogSkillOptions: this.catalogSkillOptions(),
      ambushCandidateActors,
      ambushPreview,
    };
  }

  protected async _onRender(context: unknown, options: unknown): Promise<void> {
    await super._onRender(context, options);
    this.bindSuggestionSocket();
    const root = this.element as HTMLElement;
    const fallback = portraitFallbackSrc();
    root.querySelectorAll<HTMLImageElement>('.emr-actor-thumb').forEach((img) => {
      img.onerror = () => {
        if (img.src !== fallback) img.src = fallback;
      };
    });

    const bindInput = (
      selector: string,
      handler: (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => void,
    ) => {
      root
        .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector)
        .forEach((el) => {
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
    bindInput('[name="emr-task"]', (el) => {
      this.taskDescription = (el as HTMLInputElement).value;
    });
    bindInput('[name="emr-show-tn"]', (el) => {
      this.showTn = (el as HTMLInputElement).checked;
    });
    bindInput('[name="emr-allow-suggestions"]', (el) => {
      this.allowPlayerSuggestions = (el as HTMLInputElement).checked;
      this.render(false);
    });
    bindInput('[name="emr-challenge-mr"]', (el) => {
      this.tn.challengeMR = clampChallengeMR(
        parseInt((el as HTMLSelectElement).value) || CHALLENGE_MR_MIN,
      );
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
      if (this.rollKind === 'fear') {
        this.tn.baseTN = 16;
        this.tn.raises = 0;
        if (!this.sceneTitle.trim()) this.sceneTitle = 'Fear Check';
      } else if (this.rollKind !== 'skill') {
        const p = buildDifficultyPresets(this.tn.challengeMR);
        if (this.tn.baseTN === 8 || this.tn.baseTN === 16) this.tn.baseTN = p.standard;
      }
      this.render(false);
    });
    bindInput('[name="emr-skill-key"]', (el) => {
      this.skillKey = (el as HTMLSelectElement).value;
    });
    bindInput('[name="emr-attribute-key"]', (el) => {
      this.attributeKey = (el as HTMLSelectElement).value;
    });

    root.querySelectorAll<HTMLInputElement>('input[name="emr-skill-mode"]').forEach((el) => {
      el.addEventListener('change', () => {
        if (!el.checked) return;
        this.skillMode = el.value as RollsSkillMode;
        this.render(false);
      });
    });

    // Approaches
    bindInput('[name="emr-ap-skill"]', (el) => {
      const id = (el as HTMLSelectElement).dataset.approachId;
      const ap = this.approaches.find((a) => a.id === id);
      if (!ap) return;
      ap.skillKey = (el as HTMLSelectElement).value;
      const opt = this.catalogSkillOptions().find((o) => o.key === ap.skillKey);
      ap.label = opt?.label.split(' · ')[0] || ap.skillKey;
    });
    bindInput('[name="emr-ap-attr"]', (el) => {
      const id = (el as HTMLSelectElement).dataset.approachId;
      const ap = this.approaches.find((a) => a.id === id);
      if (ap) ap.suggestedAttribute = (el as HTMLSelectElement).value;
    });
    bindInput('[name="emr-ap-tn"]', (el) => {
      const id = (el as HTMLSelectElement).dataset.approachId;
      const ap = this.approaches.find((a) => a.id === id);
      if (!ap) return;
      const val = (el as HTMLSelectElement).value;
      if (val !== 'custom') {
        ap.baseTn = parseInt(val) || ap.baseTn;
        this.render(false);
      }
    });
    bindInput('[name="emr-ap-tn-custom"]', (el) => {
      const id = (el as HTMLInputElement).dataset.approachId;
      const ap = this.approaches.find((a) => a.id === id);
      if (ap) ap.baseTn = Math.max(0, parseInt((el as HTMLInputElement).value) || 0);
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-add-approach"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        this.approaches.push(emptyApproach({ baseTn: 12, suggestedAttribute: 'wits' }));
        this.render(false);
      };
    });
    root.querySelectorAll<HTMLElement>('[data-action="emr-remove-approach"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const id = btn.dataset.approachId;
        this.approaches = this.approaches.filter((a) => a.id !== id);
        this.render(false);
      };
    });

    // Per-character rows
    bindInput('[name="emr-row-skill"]', (el) => {
      const actorId = (el as HTMLSelectElement).dataset.actorId || '';
      const row = this.participantRows.find((r) => r.actorId === actorId);
      if (!row) return;
      row.skillRef = skillRefFromKey((el as HTMLSelectElement).value);
      this.render(false);
    });
    bindInput('[name="emr-row-attr"]', (el) => {
      const actorId = (el as HTMLSelectElement).dataset.actorId || '';
      const row = this.participantRows.find((r) => r.actorId === actorId);
      if (row) row.attributeKey = (el as HTMLSelectElement).value;
    });
    bindInput('[name="emr-row-tn"]', (el) => {
      const actorId = (el as HTMLInputElement).dataset.actorId || '';
      const row = this.participantRows.find((r) => r.actorId === actorId);
      if (row) row.baseTn = Math.max(0, parseInt((el as HTMLInputElement).value) || 0);
    });
    bindInput('[name="emr-row-approach"]', (el) => {
      const actorId = (el as HTMLSelectElement).dataset.actorId || '';
      const approachId = (el as HTMLSelectElement).value;
      if (!approachId) return;
      const ap = this.approaches.find((a) => a.id === approachId);
      if (!ap) return;
      const idx = this.participantRows.findIndex((r) => r.actorId === actorId);
      if (idx >= 0) this.participantRows[idx] = applyApproachToRow(ap, actorId);
      this.render(false);
    });

    // Comparative opposition
    bindInput('[name="emr-opp-source"]', (el) => {
      this.comparative.source = (el as HTMLSelectElement).value as 'npc' | 'virtual';
      this.render(false);
    });
    bindInput('[name="emr-opp-npc"]', (el) => {
      this.comparative.npcActorId = (el as HTMLSelectElement).value;
      const npc = game.actors?.get(this.comparative.npcActorId) as any;
      const skills = readSituationalSkills(npc?.system);
      if (skills[0] && !this.comparative.npcSkillKey) {
        this.comparative.npcSkillKey = skills[0].name;
      }
    });
    bindInput('[name="emr-opp-npc-skill"]', (el) => {
      this.comparative.npcSkillKey = (el as HTMLInputElement).value;
    });
    bindInput('[name="emr-opp-npc-attr"]', (el) => {
      this.comparative.npcAttributeKey = (el as HTMLSelectElement).value;
    });
    bindInput('[name="emr-virt-name"]', (el) => {
      this.comparative.virtual.name = (el as HTMLInputElement).value;
    });
    bindInput('[name="emr-virt-skill"]', (el) => {
      this.comparative.virtual.skillName = (el as HTMLInputElement).value;
    });
    bindInput('[name="emr-virt-pool"]', (el) => {
      this.comparative.virtual.poolDice = Math.max(
        0,
        parseInt((el as HTMLInputElement).value) || 0,
      );
    });
    bindInput('[name="emr-virt-mr"]', (el) => {
      this.comparative.virtual.masteryRank = Math.max(
        1,
        parseInt((el as HTMLInputElement).value) || 1,
      );
    });
    bindInput('[name="emr-virt-rank"]', (el) => {
      this.comparative.virtual.skillRank = Math.max(
        0,
        Math.min(8, parseInt((el as HTMLInputElement).value) || 0),
      );
    });
    bindInput('[name="emr-virt-crit"]', (el) => {
      this.comparative.virtual.allowSkillCrit = (el as HTMLInputElement).checked;
    });
    bindInput('[name="emr-group-ambush"]', (el) => {
      this.comparative.groupAmbush = (el as HTMLInputElement).checked;
      if (this.comparative.groupAmbush && !this.comparative.ambushParticipantIds.length) {
        this.comparative.ambushParticipantIds = [...this.selectedIds];
        this.comparative.stealthSpecialistId = this.selectedIds[0] || '';
      }
      this.render(false);
    });
    root.querySelectorAll<HTMLInputElement>('input[name="emr-ambush-part"]').forEach((el) => {
      el.addEventListener('change', () => {
        const ids = Array.from(
          root.querySelectorAll<HTMLInputElement>('input[name="emr-ambush-part"]:checked'),
        ).map((x) => x.value);
        this.comparative.ambushParticipantIds = ids;
        if (!ids.includes(this.comparative.stealthSpecialistId)) {
          this.comparative.stealthSpecialistId = ids[0] || '';
        }
        this.render(false);
      });
    });
    bindInput('[name="emr-ambush-specialist"]', (el) => {
      this.comparative.stealthSpecialistId = (el as HTMLSelectElement).value;
      this.render(false);
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-add-actor"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const id = btn.dataset.actorId;
        if (id && !this.selectedIds.includes(id)) {
          this.selectedIds.push(id);
          this.syncParticipantRows();
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
          this.participantRows = this.participantRows.filter((r) => r.actorId !== id);
          delete this.pendingSuggestions[id];
          this.render(false);
        }
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-accept-suggestion"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const actorId = btn.dataset.actorId || '';
        const sug = this.pendingSuggestions[actorId];
        if (!sug) return;
        const idx = this.participantRows.findIndex((r) => r.actorId === actorId);
        if (idx >= 0) {
          const row = this.participantRows[idx]!;
          row.skillRef = skillRefFromKey(sug.skillKey);
          row.attributeKey = sug.attributeKey || row.attributeKey;
        }
        delete this.pendingSuggestions[actorId];
        this.render(false);
      };
    });
    root.querySelectorAll<HTMLElement>('[data-action="emr-reject-suggestion"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const actorId = btn.dataset.actorId || '';
        delete this.pendingSuggestions[actorId];
        this.render(false);
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-request-suggestions"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        void this.requestPlayerSuggestions();
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

  private bindSuggestionSocket(): void {
    if (this.socketBound) return;
    this.socketBound = true;
    (game as any).socket?.on?.(SOCKET_NAME, (data: any) => {
      if (!data || data.type !== 'rollsSkillSuggestion') return;
      if (!game.user?.isGM) return;
      const actorId = String(data.actorId || '');
      if (!actorId || !this.selectedIds.includes(actorId)) return;
      this.pendingSuggestions[actorId] = {
        actorId,
        skillKey: String(data.skillKey || 'untrained'),
        attributeKey: String(data.attributeKey || 'wits'),
        note: String(data.note || '').slice(0, 200),
        skillLabel: String(data.skillLabel || data.skillKey || 'Suggestion'),
      };
      void this.render(false);
      ui.notifications?.info?.(`Skill suggestion received for ${data.actorName || actorId}.`);
    });
  }

  private async requestPlayerSuggestions(): Promise<void> {
    if (!this.selectedIds.length) {
      ui.notifications?.warn('Select participants first.');
      return;
    }
    const task = this.taskDescription.trim() || 'Skill Check';
    (game as any).socket?.emit?.(SOCKET_NAME, {
      type: 'rollsSkillSuggestionRequest',
      taskDescription: task,
      note: this.flavor.trim(),
      actorIds: [...this.selectedIds],
    });
    // Local GM-owned characters
    for (const id of this.selectedIds) {
      const actor = game.actors?.get(id) as any;
      if (!actor) continue;
      if (game.user?.isGM && String(game.user.character?.id || '') === id) {
        await promptPlayerSkillSuggestion(actor, task, this.flavor.trim());
      }
    }
    ui.notifications?.info('Suggestion request sent to participants.');
  }

  private buildRollConfig(): EpicRollConfig {
    if (this.rollKind === 'fear') return { kind: 'fear' };
    if (this.rollKind === 'attribute') {
      return { kind: 'attribute', attributeKey: this.attributeKey };
    }
    return { kind: 'skill', skillKey: this.skillKey };
  }

  private readCustomTnFromDom(): void {
    if (this.rollKind === 'fear') {
      this.tn.baseTN = 16;
      this.tn.raises = 0;
      return;
    }
    const root = this.element as HTMLElement;
    const preset = root.querySelector<HTMLSelectElement>('[name="emr-base-tn-preset"]')?.value;
    if (preset === 'custom') {
      const custom = root.querySelector<HTMLInputElement>('[name="emr-custom-tn"]');
      if (custom) this.tn.baseTN = parseInt(custom.value) || this.tn.baseTN;
    }
  }

  private async startSession(): Promise<void> {
    if (this.rollKind === 'skill') {
      this.syncParticipantRows();
      if (!this.participantRows.length) {
        ui.notifications?.warn('Select at least one participant.');
        return;
      }
      const result = await startSkillWorkflowFromRolls({
        taskDescription: this.taskDescription.trim() || this.sceneTitle.trim() || 'Skill Check',
        note: this.flavor.trim(),
        showTn: this.showTn,
        mode: this.skillMode,
        approaches: this.approaches,
        participantRows: this.participantRows,
        allowPlayerSuggestions: this.allowPlayerSuggestions,
        comparative: this.comparative,
      });
      if (!result.ok) {
        ui.notifications?.warn(result.error || 'Failed to start Skill Rolls.');
        return;
      }
      this.close();
      return;
    }

    this.readCustomTnFromDom();

    const tn =
      this.rollKind === 'fear'
        ? { challengeMR: this.tn.challengeMR, baseTN: 16, raises: 0 }
        : { ...this.tn };

    const config: EpicMasteryRollStartConfig = {
      title: this.sceneTitle.trim() || defaultRollTitleForKind(this.rollKind),
      flavor: this.flavor.trim(),
      showTn: this.showTn,
      tn,
      roll: this.buildRollConfig(),
      actorIds: [...this.selectedIds].filter((id) =>
        isEpicRollPlayerCharacter(game.actors?.get(id)),
      ),
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

async function promptPlayerSkillSuggestion(
  actor: any,
  task: string,
  note: string,
): Promise<void> {
  const DialogCls = (globalThis as any).Dialog;
  if (!DialogCls || !actor) return;
  const opts = listActorSkillOptions(actor);
  const skillOpts = opts
    .map((o) => `<option value="${o.key}">${o.label}</option>`)
    .join('');
  const attrOpts = ATTRIBUTES.map((a) => `<option value="${a}">${a}</option>`).join('');
  const content = `
    <form class="mastery-dialog-form">
      <p><strong>Task:</strong> ${String(task).replace(/</g, '&lt;')}</p>
      ${note ? `<p class="md-sublabel">${String(note).replace(/</g, '&lt;')}</p>` : ''}
      <div class="md-group">
        <label class="md-label">Proposed Specialization</label>
        <select name="skill" class="md-select">${skillOpts}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Proposed Attribute</label>
        <select name="attribute" class="md-select">${attrOpts}</select>
      </div>
      <div class="md-group">
        <label class="md-label">How you approach (optional)</label>
        <input type="text" name="note" class="md-input" maxlength="200" />
      </div>
      <p class="md-sublabel">The GM must approve — this is only a suggestion.</p>
    </form>`;
  await new Promise<void>((resolve) => {
    new DialogCls(
      {
        title: `Suggest approach · ${actor.name}`,
        content,
        buttons: {
          send: {
            label: 'Send suggestion',
            callback: (html: any) => {
              const root = html?.[0] ?? html;
              const skillKey = String(
                (root.querySelector('[name="skill"]') as HTMLSelectElement)?.value || 'untrained',
              );
              const attributeKey = String(
                (root.querySelector('[name="attribute"]') as HTMLSelectElement)?.value || 'wits',
              );
              const sugNote = String(
                (root.querySelector('[name="note"]') as HTMLInputElement)?.value || '',
              ).trim();
              const skillLabel =
                opts.find((o) => o.key === skillKey)?.label || skillKey;
              (game as any).socket?.emit?.(SOCKET_NAME, {
                type: 'rollsSkillSuggestion',
                actorId: actor.id,
                actorName: actor.name,
                skillKey,
                attributeKey,
                note: sugNote,
                skillLabel,
              });
              resolve();
            },
          },
          cancel: { label: 'Cancel', callback: () => resolve() },
        },
        default: 'send',
        close: () => resolve(),
      },
      { width: 420, classes: ['mastery-system', 'mastery-roll-dialog'] },
    ).render(true);
  });
}

/** Register player-side suggestion request handler (once). */
let suggestionHandlerRegistered = false;
export function registerRollsSkillSuggestionHandlers(): void {
  if (suggestionHandlerRegistered) return;
  suggestionHandlerRegistered = true;
  const bind = () => {
    (game as any).socket?.on?.(SOCKET_NAME, async (data: any) => {
      if (!data || data.type !== 'rollsSkillSuggestionRequest') return;
      if (game.user?.isGM && !game.user.character) return;
      const actorIds: string[] = Array.isArray(data.actorIds) ? data.actorIds : [];
      for (const id of actorIds) {
        const actor = game.actors?.get(id) as any;
        if (!actor) continue;
        const owns =
          game.user?.isGM
            ? String(game.user.character?.id || '') === id
            : typeof actor.testUserPermission === 'function'
              ? actor.testUserPermission(game.user, 'OWNER')
              : false;
        if (!owns) continue;
        await promptPlayerSkillSuggestion(
          actor,
          String(data.taskDescription || 'Skill Check'),
          String(data.note || ''),
        );
        break;
      }
    });
  };
  if ((game as any).ready) bind();
  else Hooks.once('ready', bind);
}

export function showEpicMasteryRollConfigDialog(preset?: EpicMasteryRollPreset): void {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start Rolls.');
    return;
  }

  const existing = foundry.applications.instances.get('mastery-epic-roll-config');
  if (existing) {
    (existing as any).bringToFront?.();
    return;
  }

  new EpicMasteryRollConfigDialog(preset).render(true);
}

export function showEpicMasteryRollConfigDialogForGroupAmbush(): void {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start Rolls.');
    return;
  }
  const existing = foundry.applications.instances.get('mastery-epic-roll-config');
  if (existing) {
    (existing as EpicMasteryRollConfigDialog).applyGroupAmbushPreset();
    void (existing as any).render?.(false);
    (existing as any).bringToFront?.();
    return;
  }
  const dlg = new EpicMasteryRollConfigDialog();
  dlg.applyGroupAmbushPreset();
  dlg.render(true);
}

export async function requestEpicMasteryRoll(preset?: EpicMasteryRollPreset): Promise<void> {
  showEpicMasteryRollConfigDialog(preset);
}
