/**
 * Encounter Generator — guided 5-step dialog (concept-driven).
 *
 * Steps: party -> concept (Kampfidee) -> adds -> review (Threat Report,
 * editierbar) -> name. On generation it writes an Encounter-Projekt:
 * folder tree + NPC actors + summary journal (see apply module).
 */

import { ENCOUNTER_GENERATOR_COPY } from './encounter-generator-copy.js';
import { analyzeParty } from './encounter-generator-analysis.js';
import { applyEncounterProject } from './encounter-generator-apply.js';
import {
  ARCHETYPE_PRESETS,
  ATTACK_SHAPE_OPTIONS,
  CYCLE_STYLE_OPTIONS,
  KIT_MODE_OPTIONS,
  RANK_OPTIONS,
  REACTION_KIND_OPTIONS,
  SECONDARY_STYLE_OPTIONS,
  STYLE_OPTIONS,
  TARGETING_OPTIONS,
  WEAPON_PROFILE_OPTIONS,
  defaultConcept,
  deriveConceptPlan,
  normalizeConcept,
  normalizeReactions,
  primarySpecialOptions,
  specialLabel,
} from './encounter-generator-concept.js';
import { buildThreatReport } from './encounter-generator-threat.js';
import {
  ENCOUNTER_STEP_ORDER,
  type EncounterConcept,
  type EncounterProjectPlan,
  type EncounterReactionDraft,
  type EncounterStep,
  type PartyMetrics,
  type ThreatReport,
} from './encounter-generator-types.js';

const { ApplicationV2, HandlebarsApplicationMixin } = (foundry as any).applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as any;

declare const game: any;
declare const ui: any;

interface QuickPc {
  id: string;
  name: string;
  mr: number;
  hp: number;
  evade: number;
}

function readQuickPc(actor: any): QuickPc {
  const system = actor?.system ?? {};
  const combat = system.combat ?? {};
  const mr = Math.max(1, Math.min(8, Math.floor(Number(system.mastery?.rank) || 2)));
  const evade = Math.round(Number(combat.evadeTotal ?? combat.evade ?? mr * 4));
  const bars: any[] = Array.isArray(system.health?.bars) ? system.health.bars : [];
  const hp = bars.reduce((acc, b) => acc + Math.max(0, Number(b?.max) || 0), 0);
  return { id: String(actor?.id ?? ''), name: String(actor?.name ?? 'Unbenannt'), mr, hp, evade };
}

function quickMetrics(pcs: QuickPc[]) {
  if (pcs.length === 0) return null;
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  const mrs = [...pcs.map((p) => p.mr)].sort((a, b) => a - b);
  const median = mrs[Math.floor(mrs.length / 2)];
  return {
    size: pcs.length,
    medianMR: median,
    avgHP: avg(pcs.map((p) => p.hp)),
    avgEvade: avg(pcs.map((p) => p.evade)),
    avgArmor: avg(pcs.map((p) => p.mr)),
    avgDrPct: 0,
  };
}

function selectOptions<T extends string | number>(
  options: Array<{ value: T; label: string; description?: string }>,
  current: T,
) {
  return options.map((o) => ({ ...o, selected: String(o.value) === String(current) }));
}

export class EncounterGeneratorDialog extends BaseDialog {
  private step: EncounterStep = 'party';
  private selectedActorIds = new Set<string>();
  private concept: EncounterConcept = defaultConcept();
  private presetId = '';
  private folderName = '';
  private party: PartyMetrics | null = null;
  private plan: EncounterProjectPlan | null = null;
  private report: ThreatReport | null = null;
  private selectedKitIndex = 0;

  static DEFAULT_OPTIONS = {
    id: 'encounter-generator-dialog',
    classes: ['mastery-system', 'encounter-gen-app'],
    position: { width: 920, height: 760 },
    window: {
      title: ENCOUNTER_GENERATOR_COPY.title,
      resizable: true,
    },
  };

  static PARTS = {
    content: {
      template: 'systems/mastery-system/templates/creation/encounter-generator/wizard-shell.hbs',
    },
  };

  #characterActors(): any[] {
    const actors = (game as any).actors?.contents ?? [];
    return actors.filter((a: any) => a?.type === 'character');
  }

  #selectedActors(): any[] {
    return this.#characterActors().filter((a: any) => this.selectedActorIds.has(String(a.id)));
  }

  #canNext(): boolean {
    switch (this.step) {
      case 'party':
        return this.selectedActorIds.size > 0;
      default:
        return true;
    }
  }

  #canGenerate(): boolean {
    return this.selectedActorIds.size > 0 && this.folderName.trim().length > 0;
  }

  #recomputePlan(): void {
    const actors = this.#selectedActors();
    if (actors.length === 0) {
      this.party = null;
      this.plan = null;
      this.report = null;
      return;
    }
    this.party = analyzeParty(actors);
    this.plan = deriveConceptPlan(this.party, this.concept);
    this.report = buildThreatReport(this.party, this.plan);
  }

  #recomputeReport(): void {
    if (!this.party || !this.plan) return;
    this.report = buildThreatReport(this.party, this.plan);
  }

  #nextStep(): void {
    const idx = ENCOUNTER_STEP_ORDER.indexOf(this.step);
    const next = ENCOUNTER_STEP_ORDER[idx + 1] ?? this.step;
    if (next === 'review') {
      this.selectedKitIndex = 0;
      this.#recomputePlan();
    }
    this.step = next;
    this.render();
  }

  #prevStep(): void {
    const idx = ENCOUNTER_STEP_ORDER.indexOf(this.step);
    this.step = ENCOUNTER_STEP_ORDER[idx - 1] ?? this.step;
    this.render();
  }

  #applyPreset(id: string): void {
    this.presetId = id;
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === id);
    if (preset) {
      // Deep copy so edits never mutate the preset definition.
      this.concept = normalizeConcept(JSON.parse(JSON.stringify(preset.concept)));
      if (!this.folderName.trim()) this.folderName = preset.label;
    }
  }

  #activeKit() {
    const kits = this.plan?.kits;
    if (!kits?.length) return null;
    const index = Math.max(0, Math.min(this.selectedKitIndex, kits.length - 1));
    return kits[index];
  }

  #reactionEditorRows(reactions: EncounterReactionDraft[]) {
    const copy = ENCOUNTER_GENERATOR_COPY;
    return normalizeReactions(reactions).map((row, index) => ({
      index,
      label: copy.concept.reactionN(index + 1),
      name: row.name,
      showName: row.kind === 'custom',
      kindOptions: selectOptions(REACTION_KIND_OPTIONS, row.kind),
    }));
  }

  #reviewContext(): Record<string, unknown> | null {
    const plan = this.plan;
    const report = this.report;
    if (!plan || !report) return null;
    const kit = this.#activeKit();
    const phasePlans = kit?.phasePlans ?? plan.phasePlans;
    const reactions = kit?.reactions ?? plan.concept.reactions;
    const phases = phasePlans.map((p, pi) => ({
      index: pi,
      name: p.name,
      changes: p.changes.join(' · '),
      actionsPerRound: p.actionsPerRound,
      addsActive: p.addsActive,
      stat: p.stat,
      cycle: p.cycle.map((c, ci) => ({
        ...c,
        cycleIndex: ci,
        specialText: c.special ? `${specialLabel(c.special)}(${c.specialValue})` : '',
        rangeText: c.aoe
          ? `${c.rangeKind === 'melee' ? 'Nah' : `${c.rangeMeters} m`} · AoE ${c.aoe.radiusM} m`
          : c.rangeKind === 'melee'
            ? 'Nahkampf'
            : `${c.rangeMeters} m`,
        extraText: plan.concept.cycleStyle === 'weighted' && c.weight != null
          ? `${c.weight}%`
          : plan.concept.cycleStyle === 'conditional' && c.condition
            ? c.condition
            : c.note,
      })),
    }));
    const showKits = plan.kitMode === 'distinct' && (plan.kits?.length ?? 0) > 1;
    const kitIndex = Math.max(0, Math.min(this.selectedKitIndex, Math.max(0, (plan.kits?.length ?? 1) - 1)));
    return {
      mr: plan.boss.mr,
      phases,
      showKits,
      copiesLabel: !showKits && plan.bossCount > 1
        ? ENCOUNTER_GENERATOR_COPY.review.copies(plan.bossCount)
        : '',
      kitTabs: (plan.kits ?? []).map((k, index) => ({
        index,
        name: k.name,
        active: index === kitIndex,
      })),
      activeKitName: kit?.name ?? 'Hauptgegner',
      reactions: this.#reactionEditorRows(reactions),
      adds: plan.adds,
      addsProjection: plan.adds
        ? {
            active: plan.adds.projectedActive.join(' → '),
            attacks: plan.adds.projectedAttacks.join(' → '),
          }
        : null,
      environment: plan.environment,
      report,
      hasWarnings: report.warnings.length > 0,
      notes: plan.notes,
      tactics: plan.tactics,
    };
  }

  protected async _prepareContext(): Promise<Record<string, unknown>> {
    const copy = ENCOUNTER_GENERATOR_COPY;
    const stepIndex = ENCOUNTER_STEP_ORDER.indexOf(this.step) + 1;
    const pcs = this.#characterActors().map(readQuickPc);
    const partyActors = pcs.map((p) => ({ ...p, selected: this.selectedActorIds.has(p.id) }));
    const selectedPcs = pcs.filter((p) => this.selectedActorIds.has(p.id));
    const metrics = quickMetrics(selectedPcs);
    const c = this.concept;
    if (this.step === 'concept' && this.selectedActorIds.size > 0) {
      this.#recomputePlan();
    }

    const presetOptions = [
      {
        value: '',
        label: copy.concept.presetNone,
        description: copy.concept.presetHint,
        selected: this.presetId === '',
      },
      ...ARCHETYPE_PRESETS.map((p) => ({
        value: p.id,
        label: p.label,
        description: p.description,
        selected: this.presetId === p.id,
      })),
    ];
    const presetDescription = ARCHETYPE_PRESETS.find((p) => p.id === this.presetId)?.description ?? '';
    const previewPlan = this.step === 'concept' ? this.plan : null;
    const previewPhase = previewPlan?.phasePlans[0];
    const previewDamage = previewPhase?.cycle.filter((row) => !row.isSummon) ?? [];
    const previewReactions = (previewPlan?.concept.reactions ?? c.reactions).filter((r) => r.kind !== 'none');
    const partyMr = Math.max(1, Math.round(this.party?.medianMR || metrics?.medianMR || 1));
    const mrCap = Math.min(8, partyMr + 1);
    const enemyMr = previewPlan?.boss.mr ?? 0;
    const conceptPreview = previewPhase
      ? {
          countLabel:
            c.bossCount > 1
              ? `${c.bossCount}× ${c.kitMode === 'distinct' ? 'eigene Kits' : 'gleiche Hauptgegner'}`
              : '1 Hauptgegner',
          hp: previewPlan!.phasePlans.reduce((sum, p) => sum + p.stat.hp, 0),
          mr: enemyMr,
          armor: previewPhase.stat.armor,
          evade: previewPhase.stat.evade,
          attacks: previewDamage
            .map((row) => {
              const dmg = `${row.damageDiceCount}W8`;
              const shape = row.aoe ? 'Fläche' : 'Einzel';
              return `${row.name} (${shape}, ${dmg})`;
            })
            .join(' · '),
          reactions: previewReactions.length
            ? `Reaktionen: ${previewReactions.map((r) => r.name || r.kind).join(', ')}`
            : 'Keine Reaktionen',
          mrCaution: copy.concept.mrCaution(enemyMr, partyMr, mrCap),
        }
      : null;

    return {
      progressLabel: copy.progress(stepIndex, ENCOUNTER_STEP_ORDER.length),
      copy,
      partyActors,
      metrics,
      selectedLabel: metrics ? copy.party.selected(metrics.size) : '',
      concept: c,
      presetOptions,
      presetDescription,
      rankOptions: selectOptions(RANK_OPTIONS, c.rank),
      styleOptions: selectOptions(STYLE_OPTIONS, c.style),
      specialOptions: selectOptions(primarySpecialOptions(), c.primarySpecial),
      secondaryOptions: selectOptions(SECONDARY_STYLE_OPTIONS, c.secondaryStyle),
      targetingOptions: selectOptions(TARGETING_OPTIONS, c.targeting),
      cycleStyleOptions: selectOptions(CYCLE_STYLE_OPTIONS, c.cycleStyle),
      kitModeOptions: selectOptions(KIT_MODE_OPTIONS, c.kitMode),
      weaponProfileOptions: selectOptions(WEAPON_PROFILE_OPTIONS, c.weaponProfile),
      attackShapeOptions: selectOptions(ATTACK_SHAPE_OPTIONS, c.attackShape),
      reactionRows: this.#reactionEditorRows(c.reactions),
      mrRule: copy.concept.mrRule,
      conceptPreview,
      isEnvironmental: c.style === 'environmental',
      adds: c.adds,
      durabilityOptions: selectOptions(
        Object.entries(copy.adds.durabilityOptions).map(([value, label]) => ({
          value,
          label,
          description: (copy.adds.durabilityHints as Record<string, string>)[value] ?? label,
        })),
        c.adds.durability,
      ),
      pressureOptions: selectOptions(
        Object.entries(copy.adds.pressureOptions).map(([value, label]) => ({
          value,
          label,
          description: (copy.adds.pressureHints as Record<string, string>)[value] ?? label,
        })),
        c.adds.pressure,
      ),
      spawnPatternOptions: selectOptions(
        Object.entries(copy.adds.spawnPatternOptions).map(([value, label]) => ({
          value,
          label,
          description: (copy.adds.spawnPatternHints as Record<string, string>)[value] ?? label,
        })),
        c.adds.spawnPattern,
      ),
      review: this.step === 'review' ? this.#reviewContext() : null,
      selection: { folderName: this.folderName },
      isParty: this.step === 'party',
      isConcept: this.step === 'concept',
      isAdds: this.step === 'adds',
      isReview: this.step === 'review',
      isName: this.step === 'name',
      showBack: this.step !== 'party',
      canNext: this.#canNext(),
      canGenerate: this.#canGenerate(),
    };
  }

  protected async _onRender(context: Record<string, unknown>, options: Record<string, unknown>): Promise<void> {
    await super._onRender(context, options);
    const root = $((this as any).element);

    root.find('.js-eg-toggle-pc').on('click', (ev) => {
      const id = String($(ev.currentTarget).data('actor-id') || '');
      if (!id) return;
      if (this.selectedActorIds.has(id)) this.selectedActorIds.delete(id);
      else this.selectedActorIds.add(id);
      this.render();
    });

    root.find('.js-eg-preset').on('change', (ev) => {
      this.#applyPreset(String($(ev.currentTarget).val() || ''));
      this.render();
    });

    root.find('.js-eg-concept').on('change', (ev) => {
      const el = $(ev.currentTarget);
      const field = String(el.data('field') || '');
      if (!(field in this.concept)) return;
      const raw = el.val();
      if (field === 'attackShape' && String(raw) === 'single-and-aoe') {
        this.concept.attackShape = 'single-and-aoe';
        this.concept.targeting = 'mixed';
        this.concept.actionsPerRound = 2;
        this.concept.cycleLength = 2;
        this.presetId = '';
        this.render();
        return;
      }
      const current = (this.concept as any)[field];
      (this.concept as any)[field] = typeof current === 'number' ? Math.floor(Number(raw) || 0) : String(raw);
      if (field === 'targeting' || field === 'actionsPerRound' || field === 'cycleLength') {
        const matches =
          this.concept.targeting === 'mixed' &&
          this.concept.actionsPerRound === 2 &&
          this.concept.cycleLength === 2;
        if (!matches) this.concept.attackShape = 'free';
      }
      this.presetId = '';
      this.render();
    });

    root.find('.js-eg-reaction').on('change', (ev) => {
      const el = $(ev.currentTarget);
      const index = Math.floor(Number(el.data('index')) || 0);
      const field = String(el.data('field') || '');
      this.concept.reactions = normalizeReactions(this.concept.reactions);
      const row = this.concept.reactions[index];
      if (!row) return;
      if (field === 'kind') {
        row.kind = String(el.val() || 'none') as EncounterReactionDraft['kind'];
        if (row.kind !== 'custom') row.name = '';
        this.render();
        return;
      }
      if (field === 'name') row.name = String(el.val() || '');
    });

    root.find('.js-eg-adds').on('change', (ev) => {
      const el = $(ev.currentTarget);
      const field = String(el.data('field') || '');
      const adds = this.concept.adds as any;
      if (!(field in adds)) return;
      if (el.attr('type') === 'checkbox') {
        adds[field] = el.prop('checked');
        this.render();
        return;
      }
      const raw = el.val();
      adds[field] = typeof adds[field] === 'number' ? Math.floor(Number(raw) || 0) : String(raw);
      this.presetId = '';
    });

    root.find('.js-eg-kit-tab').on('click', (ev) => {
      this.selectedKitIndex = Math.floor(Number($(ev.currentTarget).data('kit')) || 0);
      this.render();
    });

    root.find('.js-eg-kit-name').on('change', (ev) => {
      const kit = this.#activeKit();
      if (!kit) return;
      kit.name = String($(ev.currentTarget).val() || '').trim() || kit.name;
    });

    root.find('.js-eg-review-reaction').on('change', (ev) => {
      const kit = this.#activeKit();
      if (!kit) return;
      const el = $(ev.currentTarget);
      const index = Math.floor(Number(el.data('index')) || 0);
      const field = String(el.data('field') || '');
      kit.reactions = normalizeReactions(kit.reactions);
      const row = kit.reactions[index];
      if (!row) return;
      if (field === 'kind') {
        row.kind = String(el.val() || 'none') as EncounterReactionDraft['kind'];
        if (row.kind !== 'custom') row.name = '';
        this.render();
        return;
      }
      if (field === 'name') row.name = String(el.val() || '');
    });

    // Review: edit phase defensive stats.
    root.find('.js-eg-phase-stat').on('change', (ev) => {
      if (!this.plan) return;
      const el = $(ev.currentTarget);
      const phase = Math.floor(Number(el.data('phase')) || 0);
      const field = String(el.data('field') || '');
      const value = Math.max(0, Math.floor(Number(el.val()) || 0));
      const phasePlans = this.#activeKit()?.phasePlans ?? this.plan.phasePlans;
      const stat = phasePlans[phase]?.stat;
      if (stat && field in stat) {
        (stat as any)[field] = value;
        const bossPhase = this.#activeKit()?.boss.phases[phase];
        if (bossPhase && field in bossPhase) (bossPhase as any)[field] = value;
        this.#recomputeReport();
        this.render();
      }
    });

    // Review: edit individual cycle rows (dice, special, spell, APR).
    root.find('.js-eg-cycle').on('change', (ev) => {
      if (!this.plan) return;
      const el = $(ev.currentTarget);
      const phase = Math.floor(Number(el.data('phase')) || 0);
      const slot = Math.floor(Number(el.data('slot')) || 0);
      const field = String(el.data('field') || '');
      const phasePlans = this.#activeKit()?.phasePlans ?? this.plan.phasePlans;
      const entry = phasePlans[phase]?.cycle[slot];
      if (!entry) return;
      if (field === 'name') {
        (entry as any)[field] = String(el.val() || '');
      } else if (field === 'isSpell') {
        entry.isSpell = el.is(':checked');
      } else if (field === 'attacksPerRound') {
        entry.attacksPerRound = Math.min(5, Math.max(1, Math.floor(Number(el.val()) || 1)));
      } else if (field in entry) {
        let n = Math.max(0, Math.floor(Number(el.val()) || 0));
        if (field === 'attackDiceCount' || field === 'damageDiceCount') n = Math.min(80, n);
        (entry as any)[field] = n;
      } else {
        return;
      }
      // Keep the phase display row in sync with the first damage power.
      const stat = phasePlans[phase]?.stat;
      const firstDamage = phasePlans[phase]?.cycle.find((cEntry) => !cEntry.isSummon);
      if (stat && firstDamage) {
        stat.attackDiceCount = firstDamage.attackDiceCount;
        stat.damageDiceCount = firstDamage.damageDiceCount;
      }
      this.#recomputeReport();
      this.render();
    });

    root.find('.js-eg-name').on('input change', (ev) => {
      this.folderName = String($(ev.currentTarget).val() || '');
      root.find('.js-eg-generate').prop('disabled', !this.#canGenerate());
    });

    root.find('.js-eg-back').on('click', () => this.#prevStep());

    root.find('.js-eg-next').on('click', () => {
      if (!this.#canNext()) {
        if (this.step === 'party') ui?.notifications?.warn(ENCOUNTER_GENERATOR_COPY.notify.noParty);
        return;
      }
      this.#nextStep();
    });

    root.find('.js-eg-generate').on('click', async () => {
      if (!this.#canGenerate()) {
        ui?.notifications?.warn(ENCOUNTER_GENERATOR_COPY.notify.noName);
        return;
      }
      if (!this.plan || !this.party || !this.report) this.#recomputePlan();
      if (!this.plan || !this.party || !this.report) return;
      try {
        const result = await applyEncounterProject(this.folderName, this.party, this.plan, this.report);
        if (result) {
          ui?.notifications?.info(
            ENCOUNTER_GENERATOR_COPY.notify.done(this.folderName.trim(), result.actorCount),
          );
          this.close();
        }
      } catch (error) {
        console.error('Mastery System | Encounter generation failed', error);
        ui?.notifications?.error(ENCOUNTER_GENERATOR_COPY.notify.failed);
      }
    });
  }
}

export async function showEncounterGeneratorDialog(): Promise<void> {
  if (!game.user?.isGM) {
    ui?.notifications?.warn(ENCOUNTER_GENERATOR_COPY.notify.gmOnly);
    return;
  }
  const dialog = new EncounterGeneratorDialog();
  await dialog.render(true);
}
