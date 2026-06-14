/**
 * Encounter Generator — guided 5-step dialog.
 *
 * Steps: party -> difficulty -> composition -> review (editable) -> name.
 * On generation it writes a new Actor folder + NPC actors (see apply module).
 */
import { ENCOUNTER_GENERATOR_COPY } from './encounter-generator-copy.js';
import { analyzeParty } from './encounter-generator-analysis.js';
import { deriveEncounterPlan } from './encounter-generator-balance.js';
import { applyEncounter } from './encounter-generator-apply.js';
import { normalizeComposition, validateEncounterSelection } from './encounter-generator-validation.js';
import { ENCOUNTER_STEP_ORDER, } from './encounter-generator-types.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
function defaultComposition() {
    return { bossCount: 1, phasesPerBoss: 3, minionCount: 0, respawnCadence: 0 };
}
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
export class EncounterGeneratorDialog extends BaseDialog {
    step = 'party';
    selectedActorIds = new Set();
    difficulty = 'hard';
    composition = defaultComposition();
    folderName = '';
    plan = null;
    static DEFAULT_OPTIONS = {
        id: 'encounter-generator-dialog',
        classes: ['mastery-system', 'encounter-gen-app'],
        position: { width: 760, height: 680 },
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
            this.plan = null;
            return;
        }
        this.composition = normalizeComposition(this.composition);
        const party = analyzeParty(actors);
        this.plan = deriveEncounterPlan(party, this.difficulty, this.composition);
        if (!this.folderName.trim() && this.plan.bosses.length > 0) {
            // leave empty; user names it on the last step
        }
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
    async _prepareContext() {
        const copy = ENCOUNTER_GENERATOR_COPY;
        const stepIndex = ENCOUNTER_STEP_ORDER.indexOf(this.step) + 1;
        const pcs = this.#characterActors().map(readQuickPc);
        const partyActors = pcs.map((p) => ({ ...p, selected: this.selectedActorIds.has(p.id) }));
        const selectedPcs = pcs.filter((p) => this.selectedActorIds.has(p.id));
        const metrics = quickMetrics(selectedPcs);
        const cadenceOptions = [0, 1, 2, 3].map((value) => ({
            value,
            label: value === 0 ? copy.composition.cadenceNone : copy.composition.cadenceEvery(value),
            selected: this.composition.respawnCadence === value,
        }));
        const respawnRecommendLabel = this.plan
            ? copy.review.recommend(this.plan.respawn.recommendedPerWave, this.plan.respawn.recommendedCadence)
            : '';
        return {
            progressLabel: copy.progress(stepIndex, ENCOUNTER_STEP_ORDER.length),
            copy,
            partyActors,
            metrics,
            selectedLabel: metrics ? copy.party.selected(metrics.size) : '',
            cadenceOptions,
            respawnRecommendLabel,
            selection: {
                difficulty: this.difficulty,
                composition: this.composition,
                folderName: this.folderName,
            },
            plan: this.plan,
            isParty: this.step === 'party',
            isDifficulty: this.step === 'difficulty',
            isComposition: this.step === 'composition',
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
        root.find('.js-eg-difficulty').on('click', (ev) => {
            this.difficulty = String($(ev.currentTarget).data('difficulty') || 'hard');
            this.render();
        });
        root.find('.js-eg-comp').on('change', (ev) => {
            const field = String($(ev.currentTarget).data('field') || '');
            const value = Math.floor(Number($(ev.currentTarget).val()) || 0);
            if (field in this.composition) {
                this.composition[field] = value;
                this.composition = normalizeComposition(this.composition);
            }
        });
        root.find('.js-eg-stat').on('change', (ev) => {
            if (!this.plan)
                return;
            const el = $(ev.currentTarget);
            const kind = String(el.data('kind') || '');
            const block = Math.floor(Number(el.data('block')) || 0);
            const phase = Math.floor(Number(el.data('phase')) || 0);
            const field = String(el.data('field') || '');
            const value = Math.max(0, Math.floor(Number(el.val()) || 0));
            const list = kind === 'boss' ? this.plan.bosses : this.plan.minions;
            const target = list[block]?.phases[phase];
            if (target && field in target) {
                target[field] = value;
            }
        });
        root.find('.js-eg-name').on('input change', (ev) => {
            this.folderName = String($(ev.currentTarget).val() || '');
            // toggle generate button without a full re-render
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
            const selection = {
                selectedActorIds: [...this.selectedActorIds],
                difficulty: this.difficulty,
                composition: this.composition,
                folderName: this.folderName,
            };
            const validation = validateEncounterSelection(selection);
            if (!validation.ok) {
                ui?.notifications?.warn(validation.error);
                return;
            }
            if (!this.plan)
                this.#recomputePlan();
            if (!this.plan)
                return;
            try {
                const result = await applyEncounter(selection, this.plan);
                if (result) {
                    ui?.notifications?.info(ENCOUNTER_GENERATOR_COPY.notify.done(selection.folderName.trim(), result.actorCount));
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