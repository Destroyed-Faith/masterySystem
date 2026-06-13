/**
 * Tower Wizard — guided beginner combat package dialog.
 */

import { applyTowerWizardPackage } from './tower-wizard-apply.js';
import { combatLoopExample, TOWER_WIZARD_COPY } from './tower-wizard-copy.js';
import {
    getDefensePackage,
    resolveGrant,
    secondPassiveLabel,
    sortOffensePackagesForDefense,
    TOWER_WIZARD_DEFENSE_PACKAGES,
    buildPackageReview,
    packageNeedsDeliveryStep,
    packageNeedsWeakenSaveStep,
} from './tower-wizard-packages.js';
import { collectRelevantWarnings } from './tower-wizard-validation.js';
import type {
    DefensePackageId,
    DeliveryMode,
    OffensePackageId,
    TowerWizardSelection,
    TowerWizardStep,
    WeakenSaveChoice,
} from './tower-wizard-types.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const STEP_ORDER: TowerWizardStep[] = [
    'intro',
    'defense',
    'passive2',
    'defenseSummary',
    'buffLimitation',
    'spellcaster',
    'offense',
    'weakenSave',
    'delivery',
    'combatLoop',
    'warnings',
    'review',
];

function defaultSelection(): Partial<TowerWizardSelection> {
    return {
        defenseId: undefined,
        secondPassiveTemplateId: undefined,
        offenseId: undefined,
        delivery: 'melee',
        weakenSave: null,
        spellcaster: false,
    };
}

export class TowerWizardDialog extends BaseDialog {
    private actor: Actor;
    private step: TowerWizardStep = 'intro';
    private selection: Partial<TowerWizardSelection> = defaultSelection();

    static DEFAULT_OPTIONS = {
        id: 'tower-wizard-dialog',
        classes: ['mastery-system', 'tower-wizard-app'],
        position: { width: 680, height: 720 },
        window: {
            title: TOWER_WIZARD_COPY.title,
            resizable: true,
        },
    };

    static PARTS = {
        content: { template: 'systems/mastery-system/templates/creation/tower-wizard/wizard-shell.hbs' },
    };

    constructor(actor: Actor, options: Record<string, unknown> = {}) {
        super(foundry.utils.mergeObject(TowerWizardDialog.DEFAULT_OPTIONS, options));
        this.actor = actor;
    }

    protected async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
        const stepIndex = STEP_ORDER.indexOf(this.step) + 1;
        const copy = TOWER_WIZARD_COPY;
        const defense = this.selection.defenseId ? getDefensePackage(this.selection.defenseId) : undefined;

        const recommendedPassives = defense
            ? defense.recommendedSecondPassiveTemplateIds.map((id) => ({
                id,
                label: secondPassiveLabel(id),
                mechanical: resolveGrant({ templateId: id, rank: 4 }).mechanicalName,
            }))
            : [];

        const allPassives = defense
            ? defense.secondPassiveTemplateIds.map((id) => ({
                id,
                label: secondPassiveLabel(id),
                mechanical: resolveGrant({ templateId: id, rank: 4 }).mechanicalName,
            }))
            : [];

        const offensePackages = this.selection.defenseId
            ? sortOffensePackagesForDefense(
                this.selection.defenseId,
                !!this.selection.spellcaster,
            ).map((p) => ({
                id: p.id,
                label: p.label,
                explanation: p.explanation,
                warning: p.warning,
                recommended: defense?.offenseRecommendations.includes(p.id),
                thematic: this.selection.defenseId === 'evade' && p.id === 'expose',
            }))
            : [];

        const defenseSummaryRows = defense
            ? [
                {
                    role: 'Passive 1',
                    label: resolveGrant(defense.grants.passive1).displayName,
                    mechanical: resolveGrant(defense.grants.passive1).mechanicalName,
                    rank: 4,
                },
                this.selection.secondPassiveTemplateId
                    ? {
                        role: 'Passive 2',
                        label: secondPassiveLabel(this.selection.secondPassiveTemplateId),
                        mechanical: resolveGrant({ templateId: this.selection.secondPassiveTemplateId, rank: 4 }).mechanicalName,
                        rank: 4,
                    }
                    : null,
                {
                    role: 'Active Buff',
                    label: resolveGrant(defense.grants.activeBuff).displayName,
                    mechanical: resolveGrant(defense.grants.activeBuff).mechanicalName,
                    rank: 4,
                },
                {
                    role: 'Reaction',
                    label: resolveGrant(defense.grants.reaction).displayName,
                    mechanical: resolveGrant(defense.grants.reaction).mechanicalName,
                    rank: 4,
                },
            ].filter(Boolean)
            : [];

        const fullSelection = this.selection as TowerWizardSelection;
        const review = this.selection.defenseId && this.selection.offenseId && this.selection.secondPassiveTemplateId
            ? buildPackageReview(fullSelection)
            : { defenseRows: [], offenseRows: [], allOk: false, packageId: '' };

        const warnings = this.selection.defenseId && this.selection.offenseId
            ? collectRelevantWarnings(fullSelection)
            : [];

        return {
            title: copy.title,
            progressLabel: copy.progress(stepIndex, STEP_ORDER.length),
            copy,
            selection: this.selection,
            defensePackages: TOWER_WIZARD_DEFENSE_PACKAGES,
            recommendedPassives,
            allPassives,
            offensePackages,
            defenseSummaryRows,
            review,
            warnings,
            combatExample: this.selection.defenseId && this.selection.offenseId
                ? combatLoopExample(this.selection.defenseId, this.selection.offenseId)
                : '',
            isIntro: this.step === 'intro',
            isDefense: this.step === 'defense',
            isPassive2: this.step === 'passive2',
            isDefenseSummary: this.step === 'defenseSummary',
            isBuffLimitation: this.step === 'buffLimitation',
            isSpellcaster: this.step === 'spellcaster',
            isOffense: this.step === 'offense',
            isWeakenSave: this.step === 'weakenSave',
            isDelivery: this.step === 'delivery',
            isCombatLoop: this.step === 'combatLoop',
            isWarnings: this.step === 'warnings',
            isReview: this.step === 'review',
            showBack: this.step !== 'intro' && this.step !== 'review',
            showNext: this.step !== 'review',
            canAdvance: this.#canAdvance(),
        };
    }

    #canAdvance(): boolean {
        switch (this.step) {
            case 'intro':
                return true;
            case 'defense':
                return !!this.selection.defenseId;
            case 'passive2':
                return !!this.selection.secondPassiveTemplateId;
            case 'defenseSummary':
            case 'buffLimitation':
            case 'spellcaster':
                return true;
            case 'offense':
                return !!this.selection.offenseId;
            case 'weakenSave':
                return true;
            case 'delivery':
                return !!this.selection.delivery;
            case 'combatLoop':
            case 'warnings':
                return true;
            default:
                return false;
        }
    }

    #nextStep(from: TowerWizardStep): TowerWizardStep {
        const idx = STEP_ORDER.indexOf(from);
        let next = STEP_ORDER[idx + 1];
        while (next) {
            if (next === 'weakenSave' && (!this.selection.offenseId || !packageNeedsWeakenSaveStep(this.selection.offenseId))) {
                next = STEP_ORDER[STEP_ORDER.indexOf(next) + 1];
                continue;
            }
            if (next === 'delivery' && (!this.selection.offenseId || !packageNeedsDeliveryStep(this.selection.offenseId))) {
                next = STEP_ORDER[STEP_ORDER.indexOf(next) + 1];
                continue;
            }
            break;
        }
        return next ?? 'review';
    }

    #prevStep(from: TowerWizardStep): TowerWizardStep {
        const idx = STEP_ORDER.indexOf(from);
        let prev = STEP_ORDER[idx - 1];
        while (prev) {
            if (prev === 'delivery' && (!this.selection.offenseId || !packageNeedsDeliveryStep(this.selection.offenseId))) {
                prev = STEP_ORDER[STEP_ORDER.indexOf(prev) - 1];
                continue;
            }
            if (prev === 'weakenSave' && (!this.selection.offenseId || !packageNeedsWeakenSaveStep(this.selection.offenseId))) {
                prev = STEP_ORDER[STEP_ORDER.indexOf(prev) - 1];
                continue;
            }
            break;
        }
        return prev ?? 'intro';
    }

    protected async _onRender(context: Record<string, unknown>, options: Record<string, unknown>): Promise<void> {
        await super._onRender(context, options);
        const root = $(this.element);

        root.find('.js-tw-select-defense').on('click', (ev) => {
            this.selection.defenseId = $(ev.currentTarget).data('defense-id') as DefensePackageId;
            this.selection.secondPassiveTemplateId = undefined;
            this.render();
        });

        root.find('.js-tw-select-passive2').on('click', (ev) => {
            this.selection.secondPassiveTemplateId = String($(ev.currentTarget).data('passive-id') || '');
            this.render();
        });

        root.find('.js-tw-spellcaster').on('click', (ev) => {
            this.selection.spellcaster = String($(ev.currentTarget).data('spellcaster')) === 'true';
            this.render();
        });

        root.find('.js-tw-select-offense').on('click', (ev) => {
            this.selection.offenseId = $(ev.currentTarget).data('offense-id') as OffensePackageId;
            this.render();
        });

        root.find('.js-tw-weaken-save').on('click', (ev) => {
            const raw = String($(ev.currentTarget).data('save') || '');
            this.selection.weakenSave = raw ? (raw as WeakenSaveChoice) : 'body';
            this.render();
        });

        root.find('.js-tw-delivery').on('click', (ev) => {
            this.selection.delivery = $(ev.currentTarget).data('delivery') as DeliveryMode;
            this.render();
        });

        root.find('.js-tw-back').on('click', () => {
            this.step = this.#prevStep(this.step);
            this.render();
        });

        root.find('.js-tw-next').on('click', () => {
            if (!this.#canAdvance()) return;
            this.step = this.#nextStep(this.step);
            this.render();
        });

        root.find('.js-tw-restart').on('click', () => {
            this.step = 'defense';
            this.selection.offenseId = undefined;
            this.render();
        });

        root.find('.js-tw-apply').on('click', async () => {
            const sel = this.selection as TowerWizardSelection;
            const ok = await applyTowerWizardPackage(this.actor, sel);
            if (ok) this.close();
        });
    }
}

export async function showTowerWizardDialog(actor: Actor): Promise<void> {
    const dialog = new TowerWizardDialog(actor);
    await dialog.render(true);
}
