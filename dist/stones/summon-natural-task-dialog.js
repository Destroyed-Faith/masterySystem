/**
 * Minimal Summon Natural Task dialog — owner Profession / Perception Training Roll.
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
import { CHARACTER_PERCEPTION_SPEC_ID, isCharacterPerceptionSpec, readActorSpecializations, } from '../rules/specializations.js';
import { getSummonBondsFromActor, upsertSummonBond, } from './summon-bond-bind.js';
import { buildSummonNaturalTaskKey, executeSummonNaturalTask, planSummonNaturalTask, } from './summon-natural-task.js';
const ATTRS = [
    { key: 'might', label: 'Might' },
    { key: 'agility', label: 'Agility' },
    { key: 'vitality', label: 'Vitality' },
    { key: 'intellect', label: 'Intellect' },
    { key: 'resolve', label: 'Resolve' },
    { key: 'influence', label: 'Influence' },
    { key: 'wits', label: 'Wits' },
];
export class SummonNaturalTaskDialog extends BaseDialog {
    static DEFAULT_OPTIONS = {
        ...(BaseDialog.DEFAULT_OPTIONS ?? {}),
        id: 'mastery-summon-natural-task',
        classes: ['mastery-system', 'summon-natural-task-app'],
        window: {
            title: 'Summon Natural Task',
            resizable: true,
        },
        position: { width: 480, height: 'auto' },
        actions: {},
    };
    static PARTS = {
        body: {
            template: 'systems/mastery-system/templates/dialogs/summon-natural-task.hbs',
        },
    };
    actor;
    bondId;
    attributeKey = 'wits';
    professionId = '';
    taskDescription = '';
    transferExplanation = '';
    gmApproved = false;
    declareTrainingCrit = false;
    sharedSenseActive = false;
    bodyId = '';
    constructor(actor, bondId, options = {}) {
        super(options);
        this.actor = actor;
        this.bondId = bondId;
        const isGm = !!globalThis.game?.user?.isGM;
        this.gmApproved = isGm;
        const specs = readActorSpecializations(actor?.system);
        const perception = specs.find((s) => isCharacterPerceptionSpec(s)) ??
            specs.find((s) => String(s.id) === CHARACTER_PERCEPTION_SPEC_ID);
        this.professionId = String(perception?.id || specs[0]?.id || '');
        const bodies = this.#bond()?.bodies || [];
        this.bodyId = String(bodies[0]?.id || '');
    }
    static async show(actor, bondId) {
        const app = new SummonNaturalTaskDialog(actor, bondId);
        await app.render({ force: true });
        return app;
    }
    #bond() {
        return getSummonBondsFromActor(this.actor).find((b) => b.id === this.bondId);
    }
    #usesPerception() {
        const specs = readActorSpecializations(this.actor?.system);
        const selected = specs.find((s) => String(s.id) === this.professionId);
        return !selected || isCharacterPerceptionSpec(selected);
    }
    #bodyHasSharedSense() {
        const bond = this.#bond();
        const body = (bond?.bodies || []).find((b) => String(b.id) === this.bodyId);
        return Array.isArray(body?.sharedSenses) && body.sharedSenses.length > 0;
    }
    #buildInput() {
        const bond = this.#bond();
        const usesPerception = this.#usesPerception();
        const taskKey = buildSummonNaturalTaskKey(this.taskDescription, this.professionId);
        return {
            taskDescription: this.taskDescription,
            attributeKey: this.attributeKey,
            professionId: usesPerception ? undefined : this.professionId,
            transferExplanation: this.transferExplanation,
            gmApproved: this.gmApproved,
            declareTrainingCrit: this.declareTrainingCrit,
            independentPerception: usesPerception && !this.sharedSenseActive,
            sharedSenseActive: usesPerception && this.sharedSenseActive,
            bodyHasSharedSense: this.#bodyHasSharedSense(),
            bondId: this.bondId,
            taskKey,
            resolvedTaskKeys: [...(bond?.naturalTaskResolvedKeys || [])],
        };
    }
    async _prepareContext(_options) {
        const bond = this.#bond();
        const system = this.actor?.system ?? {};
        const specs = readActorSpecializations(system);
        const usesPerception = this.#usesPerception();
        const plan = planSummonNaturalTask(this.actor, this.#buildInput());
        const selected = specs.find((s) => String(s.id) === this.professionId);
        return {
            bondName: bond?.name ?? 'Summon',
            taskDescription: this.taskDescription,
            transferExplanation: this.transferExplanation,
            gmApproved: this.gmApproved,
            declareTrainingCrit: this.declareTrainingCrit,
            sharedSenseActive: this.sharedSenseActive,
            usesPerception,
            canDeclareTrainingCrit: plan.canDeclareTrainingCrit,
            critRemaining: plan.trainingCritRemaining,
            planError: plan.ok ? '' : plan.error || plan.rejectReason || '',
            planPreview: plan.ok ? plan.flavor : '',
            canRoll: plan.ok,
            attrOptions: ATTRS.map((a) => ({
                key: a.key,
                label: a.label,
                pool: Math.max(0, Math.floor(Number(system.attributes?.[a.key]?.value) || 0)),
                selected: a.key === this.attributeKey,
            })),
            professionOptions: specs.map((s) => {
                const id = String(s.id || '');
                const rank = Math.max(0, Math.floor(Number(s.rank) || 0));
                const perception = isCharacterPerceptionSpec(s);
                return {
                    id,
                    label: `${s.name} Rank ${rank}${perception ? ' (Perception)' : ''}`,
                    selected: id === this.professionId,
                };
            }),
            bodyOptions: (bond?.bodies || []).map((b) => ({
                id: b.id,
                label: `${b.id}${b.sharedSenses?.length ? ` · senses: ${b.sharedSenses.join(', ')}` : ' · no Shared Sense'}`,
                selected: b.id === this.bodyId,
            })),
            selectedProfessionName: selected?.name ?? '',
        };
    }
    async _onRender(context, options) {
        await super._onRender?.(context, options);
        const root = this.element;
        if (!root)
            return;
        const refresh = () => void this.render({ force: true });
        root.querySelector('.js-snt-attr')?.addEventListener('change', (ev) => {
            this.attributeKey = String(ev.target.value);
            refresh();
        });
        root.querySelector('.js-snt-profession')?.addEventListener('change', (ev) => {
            this.professionId = String(ev.target.value || '');
            this.declareTrainingCrit = false;
            refresh();
        });
        root.querySelector('.js-snt-task')?.addEventListener('input', (ev) => {
            this.taskDescription = String(ev.target.value ?? '');
        });
        root.querySelector('.js-snt-task')?.addEventListener('change', (ev) => {
            this.taskDescription = String(ev.target.value ?? '');
            refresh();
        });
        root.querySelector('.js-snt-why')?.addEventListener('input', (ev) => {
            this.transferExplanation = String(ev.target.value ?? '');
        });
        root.querySelector('.js-snt-why')?.addEventListener('change', (ev) => {
            this.transferExplanation = String(ev.target.value ?? '');
            refresh();
        });
        root.querySelector('.js-snt-gm-approved')?.addEventListener('change', (ev) => {
            this.gmApproved = !!ev.target.checked;
            refresh();
        });
        root.querySelector('.js-snt-shared-sense')?.addEventListener('change', (ev) => {
            this.sharedSenseActive = !!ev.target.checked;
            refresh();
        });
        root.querySelector('.js-snt-body')?.addEventListener('change', (ev) => {
            this.bodyId = String(ev.target.value || '');
            refresh();
        });
        root.querySelector('.js-snt-crit')?.addEventListener('change', (ev) => {
            this.declareTrainingCrit = !!ev.target.checked;
        });
        root.querySelector('.js-snt-cancel')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            void this.close();
        });
        root.querySelector('.js-snt-roll')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            void this.#roll();
        });
    }
    async #roll() {
        const bond = this.#bond();
        if (!bond) {
            ui.notifications?.warn('Summon Bond not found.');
            return;
        }
        const input = this.#buildInput();
        const preview = planSummonNaturalTask(this.actor, input);
        if (!preview.ok) {
            ui.notifications?.warn(preview.error || preview.rejectReason || 'Cannot roll.');
            await this.render({ force: true });
            return;
        }
        const result = await executeSummonNaturalTask(this.actor, input);
        if (!result.ok) {
            ui.notifications?.warn(result.error || 'Natural task failed.');
            return;
        }
        const key = String(input.taskKey || '');
        const prev = Array.isArray(bond.naturalTaskResolvedKeys) ? [...bond.naturalTaskResolvedKeys] : [];
        if (key && !prev.includes(key))
            prev.push(key);
        await upsertSummonBond(this.actor, { ...bond, naturalTaskResolvedKeys: prev });
        ui.notifications?.info(`Natural task total ${result.total ?? 0} (${result.plan.flavor}).`);
        await this.close();
    }
}
//# sourceMappingURL=summon-natural-task-dialog.js.map