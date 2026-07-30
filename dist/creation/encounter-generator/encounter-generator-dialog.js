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
import { ARCHETYPE_PRESETS, CYCLE_STYLE_OPTIONS, RANK_OPTIONS, SECONDARY_STYLE_OPTIONS, STYLE_OPTIONS, TARGETING_OPTIONS, defaultConcept, deriveConceptPlan, primarySpecialOptions, specialLabel, } from './encounter-generator-concept.js';
import { buildThreatReport } from './encounter-generator-threat.js';
import { ENCOUNTER_STEP_ORDER, } from './encounter-generator-types.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
function readQuickPc(actor) {
    const system = actor?.system ?? {};
    const combat = system.combat ?? {};
    const mr = Math.max(1, Math.min(8, Math.floor(Number(system.mastery?.rank) || 2)));
    const evade = Math.round(Number(combat.evadeTotal ?? combat.evade ?? mr * 4));
    const bars = Array.isArray(system.health?.bars) ? system.health.bars : [];
    const hp = bars.reduce((acc, b) => acc + Math.max(0, Number(b?.max) || 0), 0);
    return { id: String(actor?.id ?? ''), name: String(actor?.name ?? 'Unbenannt'), mr, hp, evade };
}
function quickMetrics(pcs) {
    if (pcs.length === 0)
        return null;
    const avg = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
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
function selectOptions(options, current) {
    return options.map((o) => ({ ...o, selected: String(o.value) === String(current) }));
}
export class EncounterGeneratorDialog extends BaseDialog {
    step = 'party';
    selectedActorIds = new Set();
    concept = defaultConcept();
    presetId = '';
    folderName = '';
    party = null;
    plan = null;
    report = null;
    static DEFAULT_OPTIONS = {
        id: 'encounter-generator-dialog',
        classes: ['mastery-system', 'encounter-gen-app'],
        position: { width: 860, height: 720 },
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
    #characterActors() {
        const actors = game.actors?.contents ?? [];
        return actors.filter((a) => a?.type === 'character');
    }
    #selectedActors() {
        return this.#characterActors().filter((a) => this.selectedActorIds.has(String(a.id)));
    }
    #canNext() {
        switch (this.step) {
            case 'party':
                return this.selectedActorIds.size > 0;
            default:
                return true;
        }
    }
    #canGenerate() {
        return this.selectedActorIds.size > 0 && this.folderName.trim().length > 0;
    }
    #recomputePlan() {
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
    #recomputeReport() {
        if (!this.party || !this.plan)
            return;
        this.report = buildThreatReport(this.party, this.plan);
    }
    #nextStep() {
        const idx = ENCOUNTER_STEP_ORDER.indexOf(this.step);
        const next = ENCOUNTER_STEP_ORDER[idx + 1] ?? this.step;
        if (next === 'review') {
            this.#recomputePlan();
        }
        this.step = next;
        this.render();
    }
    #prevStep() {
        const idx = ENCOUNTER_STEP_ORDER.indexOf(this.step);
        this.step = ENCOUNTER_STEP_ORDER[idx - 1] ?? this.step;
        this.render();
    }
    #applyPreset(id) {
        this.presetId = id;
        const preset = ARCHETYPE_PRESETS.find((p) => p.id === id);
        if (preset) {
            // Deep copy so edits never mutate the preset definition.
            this.concept = JSON.parse(JSON.stringify(preset.concept));
            if (!this.folderName.trim())
                this.folderName = preset.label;
        }
    }
    #reviewContext() {
        const plan = this.plan;
        const report = this.report;
        if (!plan || !report)
            return null;
        const phases = plan.phasePlans.map((p, pi) => ({
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
        return {
            phases,
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
    async _prepareContext() {
        const copy = ENCOUNTER_GENERATOR_COPY;
        const stepIndex = ENCOUNTER_STEP_ORDER.indexOf(this.step) + 1;
        const pcs = this.#characterActors().map(readQuickPc);
        const partyActors = pcs.map((p) => ({ ...p, selected: this.selectedActorIds.has(p.id) }));
        const selectedPcs = pcs.filter((p) => this.selectedActorIds.has(p.id));
        const metrics = quickMetrics(selectedPcs);
        const c = this.concept;
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
            isEnvironmental: c.style === 'environmental',
            adds: c.adds,
            durabilityOptions: selectOptions(Object.entries(copy.adds.durabilityOptions).map(([value, label]) => ({
                value,
                label,
                description: copy.adds.durabilityHints[value] ?? label,
            })), c.adds.durability),
            pressureOptions: selectOptions(Object.entries(copy.adds.pressureOptions).map(([value, label]) => ({
                value,
                label,
                description: copy.adds.pressureHints[value] ?? label,
            })), c.adds.pressure),
            spawnPatternOptions: selectOptions(Object.entries(copy.adds.spawnPatternOptions).map(([value, label]) => ({
                value,
                label,
                description: copy.adds.spawnPatternHints[value] ?? label,
            })), c.adds.spawnPattern),
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
    async _onRender(context, options) {
        await super._onRender(context, options);
        const root = $(this.element);
        root.find('.js-eg-toggle-pc').on('click', (ev) => {
            const id = String($(ev.currentTarget).data('actor-id') || '');
            if (!id)
                return;
            if (this.selectedActorIds.has(id))
                this.selectedActorIds.delete(id);
            else
                this.selectedActorIds.add(id);
            this.render();
        });
        root.find('.js-eg-preset').on('change', (ev) => {
            this.#applyPreset(String($(ev.currentTarget).val() || ''));
            this.render();
        });
        root.find('.js-eg-concept').on('change', (ev) => {
            const el = $(ev.currentTarget);
            const field = String(el.data('field') || '');
            if (!(field in this.concept))
                return;
            const raw = el.val();
            const current = this.concept[field];
            this.concept[field] = typeof current === 'number' ? Math.floor(Number(raw) || 0) : String(raw);
            this.presetId = '';
            // Style switch changes which fields are visible (environment actions).
            if (field === 'style')
                this.render();
        });
        root.find('.js-eg-adds').on('change', (ev) => {
            const el = $(ev.currentTarget);
            const field = String(el.data('field') || '');
            const adds = this.concept.adds;
            if (!(field in adds))
                return;
            if (el.attr('type') === 'checkbox') {
                adds[field] = el.prop('checked');
                this.render();
                return;
            }
            const raw = el.val();
            adds[field] = typeof adds[field] === 'number' ? Math.floor(Number(raw) || 0) : String(raw);
            this.presetId = '';
        });
        // Review: edit phase defensive stats.
        root.find('.js-eg-phase-stat').on('change', (ev) => {
            if (!this.plan)
                return;
            const el = $(ev.currentTarget);
            const phase = Math.floor(Number(el.data('phase')) || 0);
            const field = String(el.data('field') || '');
            const value = Math.max(0, Math.floor(Number(el.val()) || 0));
            const stat = this.plan.phasePlans[phase]?.stat;
            if (stat && field in stat) {
                stat[field] = value;
                this.#recomputeReport();
                this.render();
            }
        });
        // Review: edit individual cycle rows (dice, special value).
        root.find('.js-eg-cycle').on('change', (ev) => {
            if (!this.plan)
                return;
            const el = $(ev.currentTarget);
            const phase = Math.floor(Number(el.data('phase')) || 0);
            const slot = Math.floor(Number(el.data('slot')) || 0);
            const field = String(el.data('field') || '');
            const entry = this.plan.phasePlans[phase]?.cycle[slot];
            if (!entry || !(field in entry))
                return;
            if (field === 'name') {
                entry[field] = String(el.val() || '');
            }
            else {
                entry[field] = Math.max(0, Math.floor(Number(el.val()) || 0));
            }
            // Keep the phase display row in sync with the first damage power.
            const stat = this.plan.phasePlans[phase]?.stat;
            const firstDamage = this.plan.phasePlans[phase]?.cycle.find((cEntry) => !cEntry.isSummon);
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
                if (this.step === 'party')
                    ui?.notifications?.warn(ENCOUNTER_GENERATOR_COPY.notify.noParty);
                return;
            }
            this.#nextStep();
        });
        root.find('.js-eg-generate').on('click', async () => {
            if (!this.#canGenerate()) {
                ui?.notifications?.warn(ENCOUNTER_GENERATOR_COPY.notify.noName);
                return;
            }
            if (!this.plan || !this.party || !this.report)
                this.#recomputePlan();
            if (!this.plan || !this.party || !this.report)
                return;
            try {
                const result = await applyEncounterProject(this.folderName, this.party, this.plan, this.report);
                if (result) {
                    ui?.notifications?.info(ENCOUNTER_GENERATOR_COPY.notify.done(this.folderName.trim(), result.actorCount));
                    this.close();
                }
            }
            catch (error) {
                console.error('Mastery System | Encounter generation failed', error);
                ui?.notifications?.error(ENCOUNTER_GENERATOR_COPY.notify.failed);
            }
        });
    }
}
export async function showEncounterGeneratorDialog() {
    if (!game.user?.isGM) {
        ui?.notifications?.warn(ENCOUNTER_GENERATOR_COPY.notify.gmOnly);
        return;
    }
    const dialog = new EncounterGeneratorDialog();
    await dialog.render(true);
}
//# sourceMappingURL=encounter-generator-dialog.js.map