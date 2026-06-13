/**
 * Tower Wizard — guided combat package dialog.
 */

import { applyTowerWizardPackage } from './tower-wizard-apply.js';
import { TOWER_WIZARD_COPY } from './tower-wizard-copy.js';
import {
    buildPackageGrantSpecs,
    collectPackageIdentityKeys,
    getDefensePackage,
    sortOffensePackagesForDefense,
    TOWER_WIZARD_DEFENSE_PACKAGES,
    buildPackageReview,
    getSecondPassiveGroups,
    getDefaultActiveBuffPreview,
    getOffensiveActiveBuffGroups,
    initializeOffenseOverrides,
    packageNeedsDeliveryStep,
    packageNeedsOffensiveBuffStep,
    packageNeedsWeakenSaveStep,
} from './tower-wizard-packages.js';
import { showTowerWizardPowerPicker } from './tower-wizard-power-picker.js';
import { collectRelevantWarnings, validateTowerWizardSelection } from './tower-wizard-validation.js';
import type {
    ActiveBuffMode,
    DefensePackageId,
    DeliveryMode,
    OffenseActiveOverride,
    OffenseActiveVariant,
    OffensePackageId,
    PackageGrantKey,
    PackagePowerOverride,
    TowerWizardSelection,
    TowerWizardStep,
    WeakenSaveChoice,
} from './tower-wizard-types.js';
import type { CastingAttribute, SpellResolution } from '../../types/item.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const STEP_ORDER: TowerWizardStep[] = [
    'defense',
    'passive2',
    'activeBuffChoice',
    'offensiveBuff',
    'offense',
    'weakenSave',
    'delivery',
    'review',
];

function defaultSelection(): Partial<TowerWizardSelection> {
    return {
        defenseId: undefined,
        secondPassiveTemplateId: undefined,
        activeBuffMode: 'defensive',
        offensiveActiveBuffId: undefined,
        offenseId: undefined,
        delivery: 'melee',
        weakenSave: null,
        offenseActiveOverrides: undefined,
        powerOverrides: undefined,
    };
}

export class TowerWizardDialog extends BaseDialog {
    private actor: Actor;
    private step: TowerWizardStep = 'defense';
    private selection: Partial<TowerWizardSelection> = defaultSelection();

    static DEFAULT_OPTIONS = {
        id: 'tower-wizard-dialog',
        classes: ['mastery-system', 'tower-wizard-app'],
        position: { width: 800, height: 720 },
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

    #fullSelection(): TowerWizardSelection | null {
        if (!this.selection.defenseId || !this.selection.secondPassiveTemplateId || !this.selection.offenseId) {
            return null;
        }
        if (this.selection.activeBuffMode === 'offensive' && !this.selection.offensiveActiveBuffId) {
            return null;
        }
        const sel = {
            ...this.selection,
            activeBuffMode: this.selection.activeBuffMode ?? 'defensive',
        } as TowerWizardSelection;
        if (this.step === 'review' || this.selection.offenseActiveOverrides) {
            sel.offenseActiveOverrides = initializeOffenseOverrides(sel);
        }
        return sel;
    }

    protected async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
        const stepIndex = STEP_ORDER.indexOf(this.step) + 1;
        const copy = TOWER_WIZARD_COPY;
        const defense = this.selection.defenseId ? getDefensePackage(this.selection.defenseId) : undefined;

        const passiveGroups = this.selection.defenseId
            ? getSecondPassiveGroups(this.selection.defenseId)
            : [];

        const offensePackages = this.selection.defenseId
            ? sortOffensePackagesForDefense(this.selection.defenseId).map((p) => ({
                id: p.id,
                label: p.label,
                explanation: p.explanation,
                warning: p.warning,
            }))
            : [];

        const fullSelection = this.#fullSelection();
        const review = fullSelection
            ? buildPackageReview(fullSelection)
            : { defenseRows: [], offenseRows: [], reviewPowerRows: [], allOk: false, packageId: '' };

        const warnings = fullSelection ? collectRelevantWarnings(fullSelection) : [];
        const validationError = fullSelection ? validateTowerWizardSelection(fullSelection) : null;

        return {
            progressLabel: copy.progress(stepIndex, STEP_ORDER.length),
            copy,
            selection: this.selection,
            defensePackages: TOWER_WIZARD_DEFENSE_PACKAGES,
            secondPassiveGroups: passiveGroups,
            offensePackages,
            review,
            warnings,
            validationError,
            canApply: !!fullSelection && review.allOk && !validationError,
            defaultActiveBuffPreview: this.selection.defenseId
                ? getDefaultActiveBuffPreview(this.selection.defenseId)
                : null,
            offensiveActiveBuffGroups: getOffensiveActiveBuffGroups(),
            isDefense: this.step === 'defense',
            isPassive2: this.step === 'passive2',
            isActiveBuffChoice: this.step === 'activeBuffChoice',
            isOffensiveBuff: this.step === 'offensiveBuff',
            isOffense: this.step === 'offense',
            isWeakenSave: this.step === 'weakenSave',
            isDelivery: this.step === 'delivery',
            isReview: this.step === 'review',
            showBack: this.step !== 'defense' && this.step !== 'review',
            showNext: false,
            canAdvance: this.#canAdvance(),
        };
    }

    #canAdvance(): boolean {
        switch (this.step) {
            case 'defense':
                return !!this.selection.defenseId;
            case 'passive2':
                return !!this.selection.secondPassiveTemplateId;
            case 'activeBuffChoice':
                return !!this.selection.activeBuffMode;
            case 'offensiveBuff':
                return !!this.selection.offensiveActiveBuffId;
            case 'offense':
                return !!this.selection.offenseId;
            case 'weakenSave':
                return true;
            case 'delivery':
                return !!this.selection.delivery;
            default:
                return false;
        }
    }

    #nextStep(from: TowerWizardStep): TowerWizardStep {
        const idx = STEP_ORDER.indexOf(from);
        let next = STEP_ORDER[idx + 1];
        while (next) {
            if (next === 'offensiveBuff' && !packageNeedsOffensiveBuffStep(this.selection)) {
                next = STEP_ORDER[STEP_ORDER.indexOf(next) + 1];
                continue;
            }
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
            if (prev === 'offensiveBuff' && !packageNeedsOffensiveBuffStep(this.selection)) {
                prev = STEP_ORDER[STEP_ORDER.indexOf(prev) - 1];
                continue;
            }
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
        return prev ?? 'defense';
    }

    #advanceAfterSelection(): void {
        if (!this.#canAdvance()) return;
        this.step = this.#nextStep(this.step);
        if (this.step === 'review') {
            const sel = this.#fullSelection();
            if (sel) this.selection.offenseActiveOverrides = initializeOffenseOverrides(sel);
        }
        this.render();
    }

    #getOverride(grantKey: string): OffenseActiveOverride {
        if (!this.selection.offenseActiveOverrides) {
            const sel = this.#fullSelection();
            if (sel) this.selection.offenseActiveOverrides = initializeOffenseOverrides(sel);
        }
        let override = this.selection.offenseActiveOverrides?.find((o) => o.grantKey === grantKey);
        if (!override) {
            override = { grantKey, isSpell: false, castingAttribute: 'intellect', spellResolution: 'spellAttack' };
            this.selection.offenseActiveOverrides = [...(this.selection.offenseActiveOverrides ?? []), override];
        }
        return override;
    }

    #clearPowerOverrides(): void {
        this.selection.powerOverrides = undefined;
    }

    #upsertPowerOverride(entry: PackagePowerOverride): void {
        const list = [...(this.selection.powerOverrides ?? [])];
        const idx = list.findIndex((o) => o.grantKey === entry.grantKey);
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
        this.selection.powerOverrides = list;
    }

    #removePowerOverride(grantKey: PackageGrantKey): void {
        const list = (this.selection.powerOverrides ?? []).filter((o) => o.grantKey !== grantKey);
        this.selection.powerOverrides = list.length ? list : undefined;
    }

    #hasCatalogOverride(grantKey: string): boolean {
        return !!this.selection.powerOverrides?.some((o) => o.grantKey === grantKey);
    }

    #updateSpellConfig(grantKey: string, patch: Partial<OffenseActiveOverride>): void {
        const powerIdx = this.selection.powerOverrides?.findIndex((o) => o.grantKey === grantKey) ?? -1;
        if (powerIdx >= 0 && this.selection.powerOverrides) {
            const list = [...this.selection.powerOverrides];
            const current = list[powerIdx];
            list[powerIdx] = {
                ...current,
                isSpell: patch.isSpell ?? current.isSpell,
                castingAttribute: patch.castingAttribute ?? current.castingAttribute,
                spellResolution: patch.spellResolution ?? current.spellResolution,
            };
            this.selection.powerOverrides = list;
            this.render();
            return;
        }
        this.#updateOverride(grantKey, patch);
    }

    async #openPowerPicker(grantKey: PackageGrantKey): Promise<void> {
        const sel = this.#fullSelection();
        if (!sel) return;
        const specs = buildPackageGrantSpecs(sel);
        const excludeIdentityKeys = collectPackageIdentityKeys(specs, grantKey);
        const row = buildPackageReview(sel).reviewPowerRows.find((r) => r.grantKey === grantKey);
        const echoKey = (this.actor.system as { echo?: { key?: string } })?.echo?.key ?? null;
        const result = await showTowerWizardPowerPicker({
            grantKey,
            roleLabel: row?.role ?? grantKey,
            excludeIdentityKeys,
            actorEchoKey: echoKey,
            currentTemplateId: row?.spec.templateId,
            currentSpecial: row?.spec.special,
        });
        if (!result) return;
        this.#upsertPowerOverride({
            grantKey,
            templateId: result.templateId,
            special: result.special,
            isSpell: result.isSpell,
            castingAttribute: result.castingAttribute,
            spellResolution: result.spellResolution,
        });
        this.render();
    }

    #updateOverride(grantKey: string, patch: Partial<OffenseActiveOverride>): void {
        const list = [...(this.selection.offenseActiveOverrides ?? initializeOffenseOverrides(this.#fullSelection()!))];
        const idx = list.findIndex((o) => o.grantKey === grantKey);
        if (idx >= 0) {
            list[idx] = { ...list[idx], ...patch };
        } else {
            list.push({ grantKey, ...patch });
        }
        this.selection.offenseActiveOverrides = list;
        this.render();
    }

    protected async _onRender(context: Record<string, unknown>, options: Record<string, unknown>): Promise<void> {
        await super._onRender(context, options);
        const root = $(this.element);

        root.find('.js-tw-select-defense').on('click', (ev) => {
            const el = $(ev.currentTarget);
            el.addClass('is-picked');
            this.selection.defenseId = el.data('defense-id') as DefensePackageId;
            this.selection.secondPassiveTemplateId = undefined;
            this.selection.activeBuffMode = 'defensive';
            this.selection.offensiveActiveBuffId = undefined;
            this.selection.offenseId = undefined;
            this.selection.offenseActiveOverrides = undefined;
            this.#clearPowerOverrides();
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-select-passive2').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.secondPassiveTemplateId = String($(ev.currentTarget).data('passive-id') || '');
            this.#removePowerOverride('passive-2');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-active-buff-mode').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            const mode = String($(ev.currentTarget).data('buff-mode') || 'defensive') as ActiveBuffMode;
            this.selection.activeBuffMode = mode;
            if (mode === 'defensive') {
                this.selection.offensiveActiveBuffId = undefined;
            }
            this.#removePowerOverride('active-buff');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-select-offensive-buff').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.offensiveActiveBuffId = String($(ev.currentTarget).data('buff-id') || '');
            this.#removePowerOverride('active-buff');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-select-offense').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.offenseId = $(ev.currentTarget).data('offense-id') as OffensePackageId;
            this.selection.offenseActiveOverrides = undefined;
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-weaken-save').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            const raw = String($(ev.currentTarget).data('save') || '');
            this.selection.weakenSave = raw ? (raw as WeakenSaveChoice) : 'body';
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-delivery').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.delivery = $(ev.currentTarget).data('delivery') as DeliveryMode;
            this.selection.offenseActiveOverrides = undefined;
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-change-power').on('click', async (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '') as PackageGrantKey;
            await this.#openPowerPicker(grantKey);
        });

        root.find('.js-tw-reset-power').on('click', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '') as PackageGrantKey;
            this.#removePowerOverride(grantKey);
            this.render();
        });

        root.find('.js-tw-variant').on('change', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            if (this.#hasCatalogOverride(grantKey)) return;
            const variant = String($(ev.currentTarget).val() || '') as OffenseActiveVariant;
            const patch: Partial<OffenseActiveOverride> = { variant };
            if (variant === 'damage-t4-spell') {
                patch.isSpell = true;
                patch.spellResolution = 'spellAttack';
            } else if (variant.startsWith('weapon-') || variant.startsWith('damage-t')) {
                patch.isSpell = false;
            }
            this.#updateOverride(grantKey, patch);
        });

        root.find('.js-tw-is-spell').on('change', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            const isSpell = $(ev.currentTarget).prop('checked') === true;
            root.find(`.js-tw-spell-fields[data-grant-key="${grantKey}"]`).toggle(isSpell);
            const current = this.#getOverride(grantKey);
            this.#updateSpellConfig(grantKey, {
                isSpell,
                castingAttribute: current.castingAttribute ?? 'intellect',
                spellResolution: current.spellResolution ?? 'spellAttack',
            });
        });

        root.find('.js-tw-casting-attr').on('change', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            this.#updateSpellConfig(grantKey, {
                castingAttribute: String($(ev.currentTarget).val() || 'intellect') as CastingAttribute,
            });
        });

        root.find('.js-tw-spell-resolution').on('change', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            this.#updateSpellConfig(grantKey, {
                spellResolution: String($(ev.currentTarget).val() || 'spellAttack') as SpellResolution,
            });
        });

        root.find('.js-tw-back').on('click', () => {
            this.step = this.#prevStep(this.step);
            this.render();
        });

        root.find('.js-tw-next').on('click', () => {
            if (!this.#canAdvance()) return;
            this.step = this.#nextStep(this.step);
            if (this.step === 'review') {
                const sel = this.#fullSelection();
                if (sel) this.selection.offenseActiveOverrides = initializeOffenseOverrides(sel);
            }
            this.render();
        });

        root.find('.js-tw-restart').on('click', () => {
            this.step = 'offense';
            this.selection.offenseId = undefined;
            this.selection.offenseActiveOverrides = undefined;
            this.#clearPowerOverrides();
            this.render();
        });

        root.find('.js-tw-apply').on('click', async () => {
            const sel = this.#fullSelection();
            if (!sel) return;
            const ok = await applyTowerWizardPackage(this.actor, sel);
            if (ok) this.close();
        });
    }
}

export async function showTowerWizardDialog(actor: Actor): Promise<void> {
    const dialog = new TowerWizardDialog(actor);
    await dialog.render(true);
}
