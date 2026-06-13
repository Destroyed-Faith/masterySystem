/**
 * Tower Wizard — guided combat package dialog.
 */
import { applyTowerWizardPackage } from './tower-wizard-apply.js';
import { TOWER_WIZARD_COPY } from './tower-wizard-copy.js';
import { buildPackageGrantSpecs, buildPackageGrantSpecsFromOverrides, buildManualPackageReview, collectOverrideIdentityKeys, collectPackageIdentityKeys, getDefensePackage, TOWER_WIZARD_DEFENSE_PACKAGES, buildPackageReview, getSecondPassiveGroups, getOffenseActiveSpecialGroups, getDefaultActiveBuffPreview, getOffensiveActiveBuffGroups, initializeOffenseOverrides, isManualBuildMode, packageNeedsDeliveryStep, packageNeedsOffensiveBuffStep, packageNeedsWeakenSaveStep, selectionUsesCatalogOffense, } from './tower-wizard-packages.js';
import { showTowerWizardPowerPicker } from './tower-wizard-power-picker.js';
import { computeBuildRoleRating } from './tower-wizard-build-rating.js';
import { collectRelevantWarnings, validateTowerWizardSelection } from './tower-wizard-validation.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
const STEP_ORDER = [
    'defense',
    'passive2',
    'activeBuffChoice',
    'offensiveBuff',
    'offense',
    'weakenSave',
    'delivery',
    'review',
];
function defaultSelection() {
    return {
        defenseId: undefined,
        secondPassiveTemplateId: undefined,
        activeBuffMode: 'defensive',
        offensiveActiveBuffId: undefined,
        offenseId: undefined,
        offenseActivePicks: undefined,
        delivery: 'melee',
        weakenSave: null,
        offenseActiveOverrides: undefined,
        powerOverrides: undefined,
    };
}
export class TowerWizardDialog extends BaseDialog {
    actor;
    step = 'defense';
    selection = defaultSelection();
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
    constructor(actor, options = {}) {
        super(foundry.utils.mergeObject(TowerWizardDialog.DEFAULT_OPTIONS, options));
        this.actor = actor;
        if (options.manualBuildMode === true) {
            this.selection = {
                ...defaultSelection(),
                manualBuildMode: true,
            };
            this.step = 'review';
        }
    }
    #fullSelection() {
        if (isManualBuildMode(this.selection)) {
            const err = validateTowerWizardSelection(this.selection);
            if (err)
                return null;
            const specs = buildPackageGrantSpecsFromOverrides(this.selection);
            if (!specs)
                return null;
            return {
                ...this.selection,
                defenseId: this.selection.defenseId ?? 'armor',
                secondPassiveTemplateId: this.selection.secondPassiveTemplateId ?? '',
                activeBuffMode: this.selection.activeBuffMode ?? 'defensive',
                delivery: this.selection.delivery ?? 'melee',
                weakenSave: this.selection.weakenSave ?? null,
                manualBuildMode: true,
            };
        }
        if (!this.selection.defenseId || !this.selection.secondPassiveTemplateId) {
            return null;
        }
        if (!selectionUsesCatalogOffense(this.selection) && !this.selection.offenseId) {
            return null;
        }
        if (selectionUsesCatalogOffense(this.selection) && (this.selection.offenseActivePicks?.length ?? 0) !== 2) {
            return null;
        }
        if (this.selection.activeBuffMode === 'offensive' && !this.selection.offensiveActiveBuffId) {
            return null;
        }
        const sel = {
            ...this.selection,
            activeBuffMode: this.selection.activeBuffMode ?? 'defensive',
        };
        if (this.step === 'review' || this.selection.offenseActiveOverrides) {
            sel.offenseActiveOverrides = initializeOffenseOverrides(sel);
        }
        return sel;
    }
    async _prepareContext(_options) {
        const stepIndex = STEP_ORDER.indexOf(this.step) + 1;
        const copy = TOWER_WIZARD_COPY;
        const defense = this.selection.defenseId ? getDefensePackage(this.selection.defenseId) : undefined;
        const passiveGroups = this.selection.defenseId
            ? getSecondPassiveGroups(this.selection.defenseId)
            : [];
        const echoKey = this.actor.system?.echo?.key ?? null;
        const selectedPickIds = new Set((this.selection.offenseActivePicks ?? []).map((p) => p.pickId));
        const offenseSpecialGroups = getOffenseActiveSpecialGroups(echoKey, selectedPickIds);
        const offensePickCount = this.selection.offenseActivePicks?.length ?? 0;
        const fullSelection = this.#fullSelection();
        const manualMode = isManualBuildMode(this.selection);
        const review = manualMode
            ? buildManualPackageReview(this.selection)
            : fullSelection
                ? buildPackageReview(fullSelection)
                : { defenseRows: [], offenseRows: [], reviewPowerRows: [], allOk: false, packageId: '' };
        const warnings = fullSelection && !manualMode ? collectRelevantWarnings(fullSelection) : [];
        const validationError = manualMode || fullSelection
            ? validateTowerWizardSelection(this.selection)
            : null;
        const roleRating = this.step === 'review' && review.allOk
            ? computeBuildRoleRating(review.reviewPowerRows)
            : null;
        return {
            progressLabel: copy.progress(stepIndex, STEP_ORDER.length),
            copy,
            selection: this.selection,
            defensePackages: TOWER_WIZARD_DEFENSE_PACKAGES,
            secondPassiveGroups: passiveGroups,
            offenseSpecialGroups,
            offensePickCount,
            offensePickLabel: copy.offense.pickCount(offensePickCount),
            review,
            roleRating,
            warnings,
            validationError,
            canApply: manualMode
                ? review.allOk && !validationError
                : !!fullSelection && review.allOk && !validationError,
            manualBuildMode: manualMode,
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
            showBack: this.step !== 'defense' && (this.step !== 'review' || manualMode),
            showNext: this.step === 'offense',
            canAdvance: this.#canAdvance(),
        };
    }
    #canAdvance() {
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
                return (this.selection.offenseActivePicks?.length ?? 0) === 2;
            case 'weakenSave':
                return true;
            case 'delivery':
                return !!this.selection.delivery;
            default:
                return false;
        }
    }
    #nextStep(from) {
        const idx = STEP_ORDER.indexOf(from);
        let next = STEP_ORDER[idx + 1];
        while (next) {
            if (next === 'offensiveBuff' && !packageNeedsOffensiveBuffStep(this.selection)) {
                next = STEP_ORDER[STEP_ORDER.indexOf(next) + 1];
                continue;
            }
            if (next === 'weakenSave' && !packageNeedsWeakenSaveStep(this.selection)) {
                next = STEP_ORDER[STEP_ORDER.indexOf(next) + 1];
                continue;
            }
            if (next === 'delivery' && !packageNeedsDeliveryStep(this.selection)) {
                next = STEP_ORDER[STEP_ORDER.indexOf(next) + 1];
                continue;
            }
            break;
        }
        return next ?? 'review';
    }
    #prevStep(from) {
        const idx = STEP_ORDER.indexOf(from);
        let prev = STEP_ORDER[idx - 1];
        while (prev) {
            if (prev === 'offensiveBuff' && !packageNeedsOffensiveBuffStep(this.selection)) {
                prev = STEP_ORDER[STEP_ORDER.indexOf(prev) - 1];
                continue;
            }
            if (prev === 'delivery' && !packageNeedsDeliveryStep(this.selection)) {
                prev = STEP_ORDER[STEP_ORDER.indexOf(prev) - 1];
                continue;
            }
            if (prev === 'weakenSave' && !packageNeedsWeakenSaveStep(this.selection)) {
                prev = STEP_ORDER[STEP_ORDER.indexOf(prev) - 1];
                continue;
            }
            break;
        }
        return prev ?? 'defense';
    }
    #advanceAfterSelection() {
        if (!this.#canAdvance())
            return;
        this.step = this.#nextStep(this.step);
        if (this.step === 'review') {
            const sel = this.#fullSelection();
            if (sel)
                this.selection.offenseActiveOverrides = initializeOffenseOverrides(sel);
        }
        this.render();
    }
    #getOverride(grantKey) {
        if (!this.selection.offenseActiveOverrides) {
            const sel = this.#fullSelection();
            if (sel)
                this.selection.offenseActiveOverrides = initializeOffenseOverrides(sel);
        }
        let override = this.selection.offenseActiveOverrides?.find((o) => o.grantKey === grantKey);
        if (!override) {
            override = { grantKey, isSpell: false, castingAttribute: 'intellect', spellResolution: 'spellAttack' };
            this.selection.offenseActiveOverrides = [...(this.selection.offenseActiveOverrides ?? []), override];
        }
        return override;
    }
    #clearPowerOverrides() {
        this.selection.powerOverrides = undefined;
    }
    #upsertPowerOverride(entry) {
        const list = [...(this.selection.powerOverrides ?? [])];
        const idx = list.findIndex((o) => o.grantKey === entry.grantKey);
        if (idx >= 0)
            list[idx] = entry;
        else
            list.push(entry);
        this.selection.powerOverrides = list;
    }
    #removePowerOverride(grantKey) {
        const list = (this.selection.powerOverrides ?? []).filter((o) => o.grantKey !== grantKey);
        this.selection.powerOverrides = list.length ? list : undefined;
    }
    #hasCatalogOverride(grantKey) {
        return !!this.selection.powerOverrides?.some((o) => o.grantKey === grantKey);
    }
    #updateSpellConfig(grantKey, patch) {
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
    async #openPowerPicker(grantKey) {
        const manualMode = isManualBuildMode(this.selection);
        if (!manualMode && !this.#fullSelection())
            return;
        const excludeIdentityKeys = manualMode
            ? collectOverrideIdentityKeys(this.selection.powerOverrides ?? [], grantKey)
            : collectPackageIdentityKeys(buildPackageGrantSpecs(this.#fullSelection()), grantKey);
        const row = manualMode
            ? buildManualPackageReview(this.selection).reviewPowerRows.find((r) => r.grantKey === grantKey)
            : buildPackageReview(this.#fullSelection()).reviewPowerRows.find((r) => r.grantKey === grantKey);
        const echoKey = this.actor.system?.echo?.key ?? null;
        const result = await showTowerWizardPowerPicker({
            grantKey,
            roleLabel: row?.role ?? grantKey,
            excludeIdentityKeys,
            actorEchoKey: echoKey,
            currentTemplateId: row?.spec.templateId || undefined,
            currentSpecial: row?.spec.special,
        });
        if (!result)
            return;
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
    static startManualBuild(actor) {
        return new TowerWizardDialog(actor, { manualBuildMode: true });
    }
    #updateOverride(grantKey, patch) {
        const list = [...(this.selection.offenseActiveOverrides ?? initializeOffenseOverrides(this.#fullSelection()))];
        const idx = list.findIndex((o) => o.grantKey === grantKey);
        if (idx >= 0) {
            list[idx] = { ...list[idx], ...patch };
        }
        else {
            list.push({ grantKey, ...patch });
        }
        this.selection.offenseActiveOverrides = list;
        this.render();
    }
    async _onRender(context, options) {
        await super._onRender(context, options);
        const root = $(this.element);
        root.find('.js-tw-select-defense').on('click', (ev) => {
            const el = $(ev.currentTarget);
            el.addClass('is-picked');
            this.selection.manualBuildMode = false;
            this.selection.defenseId = el.data('defense-id');
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
            const mode = String($(ev.currentTarget).data('buff-mode') || 'defensive');
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
        root.find('.js-tw-select-offense-variant').on('click', (ev) => {
            const el = $(ev.currentTarget);
            const pickId = String(el.data('pick-id') || '');
            const templateId = String(el.data('template-id') || '');
            const specialRaw = el.data('special');
            const special = specialRaw === undefined || specialRaw === null || specialRaw === ''
                ? null
                : String(specialRaw);
            const picks = [...(this.selection.offenseActivePicks ?? [])];
            const existing = picks.findIndex((p) => p.pickId === pickId);
            if (existing >= 0) {
                picks.splice(existing, 1);
            }
            else {
                if (picks.length >= 2) {
                    ui.notifications?.warn('You can only select two Actives. Deselect one first.');
                    return;
                }
                picks.push({ pickId, templateId, special });
            }
            this.selection.offenseActivePicks = picks.length > 0 ? picks : undefined;
            this.selection.offenseId = undefined;
            this.selection.offenseActiveOverrides = undefined;
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            this.render();
        });
        root.find('.js-tw-select-offense').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.offenseId = $(ev.currentTarget).data('offense-id');
            this.selection.offenseActiveOverrides = undefined;
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });
        root.find('.js-tw-weaken-save').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            const raw = String($(ev.currentTarget).data('save') || '');
            this.selection.weakenSave = raw ? raw : 'body';
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });
        root.find('.js-tw-delivery').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.delivery = $(ev.currentTarget).data('delivery');
            this.selection.offenseActiveOverrides = undefined;
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });
        root.find('.js-tw-change-power').on('click', async (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            await this.#openPowerPicker(grantKey);
        });
        root.find('.js-tw-reset-power').on('click', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            this.#removePowerOverride(grantKey);
            this.render();
        });
        root.find('.js-tw-variant').on('change', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            if (this.#hasCatalogOverride(grantKey))
                return;
            const variant = String($(ev.currentTarget).val() || '');
            const patch = { variant };
            if (variant === 'damage-t4-spell') {
                patch.isSpell = true;
                patch.spellResolution = 'spellAttack';
            }
            else if (variant.startsWith('weapon-') || variant.startsWith('damage-t')) {
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
                castingAttribute: String($(ev.currentTarget).val() || 'intellect'),
            });
        });
        root.find('.js-tw-spell-resolution').on('change', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '');
            this.#updateSpellConfig(grantKey, {
                spellResolution: String($(ev.currentTarget).val() || 'spellAttack'),
            });
        });
        root.find('.js-tw-back').on('click', () => {
            if (isManualBuildMode(this.selection) && this.step === 'review') {
                this.close();
                return;
            }
            this.step = this.#prevStep(this.step);
            this.render();
        });
        root.find('.js-tw-next').on('click', () => {
            if (!this.#canAdvance())
                return;
            this.step = this.#nextStep(this.step);
            if (this.step === 'review') {
                const sel = this.#fullSelection();
                if (sel)
                    this.selection.offenseActiveOverrides = initializeOffenseOverrides(sel);
            }
            this.render();
        });
        root.find('.js-tw-restart').on('click', () => {
            if (isManualBuildMode(this.selection)) {
                this.selection = {
                    ...defaultSelection(),
                    manualBuildMode: true,
                };
                this.step = 'review';
            }
            else {
                this.step = 'offense';
                this.selection.offenseId = undefined;
                this.selection.offenseActivePicks = undefined;
                this.selection.offenseActiveOverrides = undefined;
            }
            this.#clearPowerOverrides();
            this.render();
        });
        root.find('.js-tw-apply').on('click', async () => {
            const sel = this.#fullSelection();
            if (!sel)
                return;
            const ok = await applyTowerWizardPackage(this.actor, sel);
            if (ok)
                this.close();
        });
    }
}
export async function showTowerWizardDialog(actor, options) {
    const dialog = options?.manualBuildMode
        ? TowerWizardDialog.startManualBuild(actor)
        : new TowerWizardDialog(actor);
    await dialog.render(true);
}
//# sourceMappingURL=tower-wizard-dialog.js.map