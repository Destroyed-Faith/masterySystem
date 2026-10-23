/**
 * Tower Wizard — guided combat package dialog.
 */

import { applyTowerWizardPackage } from './tower-wizard-apply.js';
import { TOWER_WIZARD_COPY, localizedTowerWizardCopy } from './tower-wizard-copy.js';
import {
    buildPackageGrantSpecs,
    buildPackageGrantSpecsFromOverrides,
    buildManualPackageReview,
    buildDefensePackagePreview,
    collectOverrideIdentityKeys,
    collectPackageIdentityKeys,
    getDefensePackage,
    deriveDefenseIdFromPassive1,
    TOWER_WIZARD_DEFENSE_PACKAGES,
    buildPackageReview,
    getCatalogSubfamily,
    getFirstPassiveIntentGroups,
    getSecondPassiveIntentGroups,
    getOffenseActiveSpecialGroups,
    getGuidedSpecialFocusGroups,
    GUIDED_DELIVERY_OPTIONS,
    resolveGuidedCoreAttackPick,
    resolveGuidedSpecialPick,
    getDefensiveActiveBuffChoiceBody,
    getDefaultActiveBuffPreview,
    getOffensiveActiveBuffGroups,
    getSupportActiveBuffGroups,
    getVisibleWizardSteps,
    initializeOffenseOverrides,
    isIdentityWizardStep,
    isManualBuildMode,
    packageNeedsDeliveryStep,
    packageNeedsReplacementBuffStep,
    packageNeedsWeakenSaveStep,
    resolvePassive1TemplateId,
    selectionUsesCatalogOffense,
    WIZARD_STEP_ORDER,
} from './tower-wizard-packages.js';
import { isAllowedSecondPassive } from './tower-wizard-passive-categories.js';
import { passiveWizardChoiceLabel } from './tower-wizard-passive-labels.js';
import { findCatalogEntry } from '../../utils/power-catalog.js';

import { showTowerWizardPowerPicker } from './tower-wizard-power-picker.js';
import { computeBuildRoleRating } from './tower-wizard-build-rating.js';
import {
    collectRelevantWarnings,
    validateTowerWizardIdentity,
    validateTowerWizardSelection,
    validateWizardIdentityStep,
    type TowerWizardIdentityContext,
} from './tower-wizard-validation.js';
import {
    buildReconciliationPreview,
    buildWizardAttributeRows,
    buildWizardAttributeSummary,
    buildWizardImprintGroups,
    buildWizardSpecRows,
    readActorIdentityPrefill,
    specRecordsFromDraft,
    type WizardEarlyChange,
} from './tower-wizard-identity.js';
import { ATTRIBUTE_KEYS } from '../../progression/v099-rules.js';
import {
    buildDefensePackagesWithEcho,
    buildTowerWizardEchoContext,
    collectArtifactActiveBuffIdentityKeys,
    buildEchoAdvisorSummary,
    collectEchoAdvisorWarnings,
    validateEchoRequiredForTowerWizard,
} from './tower-wizard-echo-advisor.js';
import type {
    ActiveBuffMode,
    DefensePackageId,
    DeliveryMode,
    OffenseActiveOverride,
    OffenseActiveVariant,
    OffenseActivePick,
    OffensePackageId,
    PackageGrantKey,
    PackagePowerOverride,
    GuidedAttackDelivery,
    TowerWizardSelection,
    TowerWizardStep,
    WeakenSaveChoice,
} from './tower-wizard-types.js';
import type { CastingAttribute, SpellResolution } from '../../types/item.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const STEP_ORDER: TowerWizardStep[] = WIZARD_STEP_ORDER;

function defaultSelection(): Partial<TowerWizardSelection> {
    return {
        defenseId: undefined,
        passive1TemplateId: undefined,
        secondPassiveTemplateId: undefined,
        activeBuffMode: 'defensive',
        offensiveActiveBuffId: undefined,
        customizedSlots: undefined,
        offenseId: undefined,
        offenseActivePicks: undefined,
        guidedAttackDelivery: undefined,
        delivery: 'melee',
        weakenSave: null,
        offenseActiveOverrides: undefined,
        powerOverrides: undefined,
    };
}

/** Identity (early-step) fields that survive a power restart. */
const IDENTITY_SELECTION_KEYS: Array<keyof TowerWizardSelection> = [
    'echoKey',
    'subChoiceKey',
    'veiledFormKey',
    'attributeValues',
    'stoneAssignments',
    'echoImprintIds',
    'specializations',
    'masteryRank',
    'skipIdentitySteps',
];

export class TowerWizardDialog extends BaseDialog {
    private actor: Actor;
    private step: TowerWizardStep = 'echo';
    private selection: Partial<TowerWizardSelection> = defaultSelection();
    private secondPassiveNeedsReselect = false;
    /** Early-step edits since Powers were chosen (drives the reconciliation preview). */
    private earlyChanges = new Set<WizardEarlyChange>();

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
        const sys = (actor.system as any) ?? {};
        // Identity steps only run during creation; mature characters rebuild Powers only.
        const inCreation = sys?.creation?.complete === false;
        this.selection = {
            ...defaultSelection(),
            ...readActorIdentityPrefill(sys),
            masteryRank: Math.max(1, Math.floor(Number(sys?.mastery?.rank) || 2)),
            skipIdentitySteps: !inCreation,
            ...(options.manualBuildMode === true ? { manualBuildMode: true } : {}),
        };
        // Quick (manual) walks echo → attributes → imprints → specs, then jumps to review.
        this.step = getVisibleWizardSteps(this.selection)[0] ?? 'review';
    }

    #identityCtx(): TowerWizardIdentityContext {
        const sys = (this.actor.system as any) ?? {};
        const attrs: Record<string, number> = {};
        for (const key of ATTRIBUTE_KEYS) {
            attrs[key] = Math.max(0, Math.floor(Number(sys?.attributes?.[key]?.value) || 0));
        }
        return {
            masteryRank: this.selection.masteryRank,
            actorAttributes: attrs,
            hasEcho: !!String(sys?.echo?.key || '').trim(),
        };
    }

    /** Mirror `actor.system.echo` into the selection DTO (the Echo dialog is the writer). */
    #syncEchoFromActor(): void {
        const echo = ((this.actor.system as any)?.echo ?? {}) as {
            key?: string; subChoiceKey?: string; veiledFormKey?: string;
        };
        this.selection.echoKey = echo.key ? String(echo.key) : undefined;
        this.selection.subChoiceKey = echo.subChoiceKey ? String(echo.subChoiceKey) : undefined;
        this.selection.veiledFormKey = echo.veiledFormKey ? String(echo.veiledFormKey) : undefined;
    }

    #identityStepError(step: TowerWizardStep): string | null {
        return validateWizardIdentityStep(step, this.selection, this.#identityCtx());
    }

    #reconciliationLines(): string[] {
        const echo = ((this.actor.system as any)?.echo ?? {}) as { key?: string; subChoiceKey?: string };
        return buildReconciliationPreview(this.selection, this.earlyChanges, {
            echoKey: echo.key ?? null,
            subChoiceKey: echo.subChoiceKey ?? null,
        });
    }

    /** Update status text / Next button / counters without re-rendering (keeps input focus). */
    #refreshIdentityStatus(): void {
        const root = $(this.element);
        const err = this.#identityStepError(this.step);
        root.find('.js-tw-identity-status').text(err ?? '').toggle(!!err);
        root.find('.js-tw-next').prop('disabled', !!err);
        const summary = buildWizardAttributeSummary(this.selection, this.#identityCtx());
        root.find('.js-tw-stones-placed').text(String(summary.stonesPlaced));
        root.find('.js-tw-imprint-count').text(String(this.selection.echoImprintIds?.length ?? 0));
        const lines = this.#reconciliationLines();
        const box = root.find('.js-tw-reconcile');
        box.toggle(lines.length > 0);
        box.find('ul').empty().append(lines.map((l) => $('<li>').text(l)));
    }

    #recordEarlyChange(kind: WizardEarlyChange): void {
        this.earlyChanges.add(kind);
        this.#refreshIdentityStatus();
    }

    #fullSelection(): TowerWizardSelection | null {
        if (isManualBuildMode(this.selection)) {
            const err = validateTowerWizardSelection(this.selection, this.#identityCtx());
            if (err) return null;
            const specs = buildPackageGrantSpecsFromOverrides(this.selection);
            if (!specs) return null;
            const p1 = resolvePassive1TemplateId(this.selection);
            return {
                ...this.selection,
                defenseId: this.selection.defenseId ?? deriveDefenseIdFromPassive1(p1),
                secondPassiveTemplateId: this.selection.secondPassiveTemplateId ?? '',
                activeBuffMode: this.selection.activeBuffMode ?? 'defensive',
                delivery: this.selection.delivery ?? 'melee',
                weakenSave: this.selection.weakenSave ?? null,
                manualBuildMode: true,
            } as TowerWizardSelection;
        }
        const passive1Id = resolvePassive1TemplateId(this.selection);
        if (!passive1Id || !this.selection.secondPassiveTemplateId) {
            return null;
        }
        if (!this.selection.defenseId) {
            this.selection.defenseId = deriveDefenseIdFromPassive1(passive1Id);
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
        if (this.selection.activeBuffMode === 'support' && !this.selection.offensiveActiveBuffId) {
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
        this.#syncEchoFromActor();
        const identityCtx = this.#identityCtx();
        const visibleSteps = getVisibleWizardSteps(this.selection);
        const firstStep = visibleSteps[0];
        const stepIndex = Math.max(1, visibleSteps.indexOf(this.step) + 1);
        const copy = localizedTowerWizardCopy();
        const echoSys = this.actor.system as { echo?: { key?: string; subChoiceKey?: string } };
        const echoKey = echoSys?.echo?.key ?? null;
        const echoSubChoiceKey = echoSys?.echo?.subChoiceKey ?? null;
        const echoContext = buildTowerWizardEchoContext(this.actor);

        const passive1Id = resolvePassive1TemplateId(this.selection);
        if (passive1Id && !this.selection.defenseId) {
            this.selection.defenseId = deriveDefenseIdFromPassive1(passive1Id);
        }
        const defense = this.selection.defenseId ? getDefensePackage(this.selection.defenseId) : undefined;

        const firstPassiveIntentGroups = this.step === 'passive1'
            ? getFirstPassiveIntentGroups(echoKey, echoSubChoiceKey)
            : [];

        const secondPassiveIntentGroups = this.step === 'passive2' && passive1Id
            ? getSecondPassiveIntentGroups(
                this.selection.defenseId,
                passive1Id,
                echoKey,
                echoSubChoiceKey,
            )
            : [];

        const defensePackagePreview = buildDefensePackagePreview(this.selection);
        const firstPassiveEntry = passive1Id ? findCatalogEntry(passive1Id) : null;
        const firstPassivePreview = passive1Id
            ? {
                label: passiveWizardChoiceLabel(
                    firstPassiveEntry?.templateName ?? firstPassiveEntry?.name ?? passive1Id,
                ),
                canonicalName: firstPassiveEntry?.name ?? `Passive: ${passive1Id}`,
            }
            : null;
        const passive2Subtitle = copy.passive2.subtitleForCategory();

        const selectedPickIds = new Set((this.selection.offenseActivePicks ?? []).map((p) => p.pickId));
        const offenseSpecialGroups = getOffenseActiveSpecialGroups(echoKey, selectedPickIds);
        const offensePickCount = this.selection.offenseActivePicks?.length ?? 0;

        const selectedSpecialPickId = this.selection.offenseActivePicks?.[1]?.pickId;
        const guidedSpecialFocusGroups = getGuidedSpecialFocusGroups(
            this.selection.guidedAttackDelivery,
            echoKey,
            selectedSpecialPickId,
        );
        const guidedCoreAttackPreview = this.selection.guidedAttackDelivery
            ? resolveGuidedCoreAttackPick(this.selection.guidedAttackDelivery)
            : null;

        const fullSelection = this.#fullSelection();
        const manualMode = isManualBuildMode(this.selection);
        const review = manualMode
            ? buildManualPackageReview(this.selection)
            : fullSelection
                ? buildPackageReview(fullSelection)
                : {
                    defenseRows: [],
                    offenseRows: [],
                    reviewPowerRows: [],
                    mainDefensePackageRows: [],
                    offenseReviewRows: [],
                    customizationNotes: [],
                    allOk: false,
                    packageId: '',
                };

        const warnings = fullSelection
            ? collectRelevantWarnings(fullSelection, echoContext)
            : collectEchoAdvisorWarnings(this.selection, echoContext);
        const echoRequiredError = validateEchoRequiredForTowerWizard(echoContext);
        const identityError = this.selection.skipIdentitySteps
            ? validateTowerWizardIdentity(this.selection, identityCtx)
            : validateTowerWizardIdentity(this.selection, identityCtx, { requireComplete: true });
        const validationError = echoRequiredError
            || identityError
            || (manualMode || fullSelection
                ? validateTowerWizardSelection(this.selection, identityCtx)
                : null);
        const echoSystem = ((this.actor.system as any)?.echo ?? {}) as { key?: string };
        const identityView = {
            echoLabel: echoContext.echoLabel,
            hasEcho: echoContext.hasEcho,
            echoKey: echoSystem.key ?? '',
            attributeRows: buildWizardAttributeRows(this.selection),
            attributeSummary: buildWizardAttributeSummary(this.selection, identityCtx),
            imprintGroups: this.step === 'echoImprints'
                ? buildWizardImprintGroups(this.selection, identityCtx)
                : [],
            imprintCount: this.selection.echoImprintIds?.length ?? 0,
            imprintMax: Math.max(1, Math.floor(Number(this.selection.masteryRank) || 2)),
            specRows: this.step === 'specializations' ? buildWizardSpecRows(this.selection) : [],
            stepError: isIdentityWizardStep(this.step) ? this.#identityStepError(this.step) : null,
            reconciliation: this.#reconciliationLines(),
        };

        const roleRating = this.step === 'review' && review.allOk
            ? computeBuildRoleRating(review.reviewPowerRows)
            : null;

        return {
            progressLabel: copy.progress(stepIndex, visibleSteps.length),
            copy,
            selection: this.selection,
            defensePackages: TOWER_WIZARD_DEFENSE_PACKAGES,
            defensePackagePreview,
            firstPassiveIntentGroups,
            secondPassiveIntentGroups,
            firstPassivePreview,
            secondPassiveNeedsReselect: this.secondPassiveNeedsReselect,
            passive2Subtitle,
            offenseSpecialGroups,
            offensePickCount,
            offensePickLabel: copy.offense.pickCount(offensePickCount),
            review,
            roleRating,
            warnings,
            validationError,
            identity: identityView,
            isEcho: this.step === 'echo',
            isAttributesStones: this.step === 'attributesStones',
            isEchoImprints: this.step === 'echoImprints',
            isSpecializations: this.step === 'specializations',
            isIdentityStep: isIdentityWizardStep(this.step),
            canApply: echoContext.hasEcho && !identityError && (manualMode
                ? review.allOk && !validationError
                : !!fullSelection && review.allOk && !validationError),
            manualBuildMode: manualMode,
            echoContext,
            echoAdvisorSummary: buildEchoAdvisorSummary(echoContext),
            defensePackagesWithEcho: buildDefensePackagesWithEcho(echoContext),
            defaultActiveBuffPreview: this.selection.defenseId
                ? getDefaultActiveBuffPreview(this.selection.defenseId)
                : null,
            offensiveActiveBuffGroups: getOffensiveActiveBuffGroups(),
            supportActiveBuffGroups: getSupportActiveBuffGroups(this.selection.defenseId),
            guidedDeliveryOptions: GUIDED_DELIVERY_OPTIONS,
            guidedSpecialFocusGroups,
            guidedCoreAttackPreview,
            defensiveActiveBuffChoiceBody: this.selection.defenseId
                ? getDefensiveActiveBuffChoiceBody(this.selection.defenseId)
                : '',
            isDefense: false,
            isPassive1: this.step === 'passive1',
            isDefensePassiveVariant: false,
            isPassive2: this.step === 'passive2',
            isActiveBuffChoice: this.step === 'activeBuffChoice',
            isOffensiveBuff: this.step === 'offensiveBuff',
            isOffenseDelivery: false,
            isOffenseSpecial: this.step === 'offenseSpecial',
            isOffense: this.step === 'offense',
            isWeakenSave: this.step === 'weakenSave',
            isDelivery: this.step === 'delivery',
            isReview: this.step === 'review',
            showBack: this.step === 'review' ? manualMode : this.step !== firstStep,
            showNext: this.step === 'offense' || isIdentityWizardStep(this.step),
            canAdvance: this.#canAdvance(),
        };
    }

    #syncGuidedOffenseOverrides(): void {
        if (!this.selection.guidedAttackDelivery) return;
        const core = resolveGuidedCoreAttackPick(this.selection.guidedAttackDelivery);
        if (!core) return;

        const overrides = [...(this.selection.offenseActiveOverrides ?? [])];
        const coreIdx = overrides.findIndex((o) => o.grantKey === 'offense-0');
        const prevCore = coreIdx >= 0 ? overrides[coreIdx] : undefined;
        const coreOverride = {
            grantKey: 'offense-0',
            isSpell: prevCore?.isSpell ?? core.coreIsSpell,
            castingAttribute: (prevCore?.castingAttribute ?? 'intellect') as CastingAttribute,
            spellResolution: (prevCore?.spellResolution ?? 'spellAttack') as SpellResolution,
        };
        if (coreIdx >= 0) overrides[coreIdx] = { ...overrides[coreIdx], ...coreOverride };
        else overrides.push(coreOverride);

        const specialPick = this.selection.offenseActivePicks?.[1];
        const deliveryIsSpell = this.selection.guidedAttackDelivery === 'spell';
        if (deliveryIsSpell && specialPick) {
            const specialIdx = overrides.findIndex((o) => o.grantKey === 'offense-1');
            const prevSpecial = specialIdx >= 0 ? overrides[specialIdx] : undefined;
            const specialOverride = {
                grantKey: 'offense-1',
                isSpell: prevSpecial?.isSpell ?? true,
                castingAttribute: (prevSpecial?.castingAttribute ?? 'intellect') as CastingAttribute,
                spellResolution: (prevSpecial?.spellResolution ?? 'spellAttack') as SpellResolution,
            };
            if (specialIdx >= 0) overrides[specialIdx] = { ...overrides[specialIdx], ...specialOverride };
            else overrides.push(specialOverride);
        }

        this.selection.offenseActiveOverrides = overrides;
    }

    #canAdvance(): boolean {
        switch (this.step) {
            case 'echo':
            case 'attributesStones':
            case 'echoImprints':
            case 'specializations':
                return !this.#identityStepError(this.step);
            case 'passive1':
                return !!resolvePassive1TemplateId(this.selection);
            case 'defense':
                return !!resolvePassive1TemplateId(this.selection);
            case 'passive2':
                return !!this.selection.secondPassiveTemplateId && !this.secondPassiveNeedsReselect;
            case 'activeBuffChoice':
                return !!this.selection.activeBuffMode;
            case 'offensiveBuff':
                return !!this.selection.offensiveActiveBuffId;
            case 'offenseSpecial':
                return (this.selection.offenseActivePicks?.length ?? 0) === 2;
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

    #nextStep(from: TowerWizardStep): TowerWizardStep {
        if (isManualBuildMode(this.selection)) {
            const visible = getVisibleWizardSteps(this.selection);
            return visible[visible.indexOf(from) + 1] ?? 'review';
        }
        const idx = STEP_ORDER.indexOf(from);
        let next = STEP_ORDER[idx + 1];
        while (next) {
            if (isIdentityWizardStep(next) && this.selection.skipIdentitySteps) {
                next = STEP_ORDER[STEP_ORDER.indexOf(next) + 1];
                continue;
            }
            if (next === 'offensiveBuff' && !packageNeedsReplacementBuffStep(this.selection)) {
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

    #prevStep(from: TowerWizardStep): TowerWizardStep {
        if (isManualBuildMode(this.selection)) {
            const visible = getVisibleWizardSteps(this.selection);
            return visible[Math.max(0, visible.indexOf(from) - 1)] ?? 'review';
        }
        const idx = STEP_ORDER.indexOf(from);
        let prev = STEP_ORDER[idx - 1];
        while (prev) {
            if (isIdentityWizardStep(prev) && this.selection.skipIdentitySteps) {
                prev = STEP_ORDER[STEP_ORDER.indexOf(prev) - 1];
                continue;
            }
            if (prev === 'offensiveBuff' && !packageNeedsReplacementBuffStep(this.selection)) {
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
        return prev ?? getVisibleWizardSteps(this.selection)[0] ?? 'passive1';
    }

    #advanceAfterSelection(): void {
        if (!this.#canAdvance()) return;
        this.step = this.#nextStep(this.step);
        if (this.step === 'review') {
            const sel = this.#fullSelection();
            if (sel) {
                this.#syncGuidedOffenseOverrides();
                this.selection.offenseActiveOverrides = initializeOffenseOverrides(sel);
            }
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
        const manualMode = isManualBuildMode(this.selection);
        if (!manualMode && !this.#fullSelection()) return;

        const excludeIdentityKeys = manualMode
            ? collectOverrideIdentityKeys(this.selection.powerOverrides ?? [], grantKey)
            : collectPackageIdentityKeys(
                buildPackageGrantSpecs(this.#fullSelection()!),
                grantKey,
            );
        const reviewRows = manualMode
            ? buildManualPackageReview(this.selection).reviewPowerRows
            : buildPackageReview(this.#fullSelection()!).reviewPowerRows;
        const row = reviewRows.find((r) => r.grantKey === grantKey);

        // Forbid two passives sharing the same subfamily: exclude the sibling
        // passive slot's subfamily from this picker.
        const excludeSubfamilies = new Set<string>();
        const passiveSibling: Partial<Record<PackageGrantKey, PackageGrantKey>> = {
            'passive-1': 'passive-2',
            'passive-2': 'passive-1',
        };
        const siblingKey = passiveSibling[grantKey];
        if (siblingKey) {
            const siblingRow = reviewRows.find((r) => r.grantKey === siblingKey);
            const sub = siblingRow?.spec.templateId
                ? getCatalogSubfamily(siblingRow.spec.templateId, siblingRow.spec.special)
                : null;
            if (sub) excludeSubfamilies.add(sub);
        }

        const echoContext = buildTowerWizardEchoContext(this.actor);
        if (grantKey === 'active-buff') {
            for (const key of collectArtifactActiveBuffIdentityKeys(echoContext)) {
                excludeIdentityKeys.add(key);
            }
        }

        const echo = this.actor.system as { echo?: { key?: string; subChoiceKey?: string } };
        const echoKey = echo?.echo?.key ?? null;
        const echoSubChoiceKey = echo?.echo?.subChoiceKey ?? null;
        const echoPickerNote = grantKey === 'active-buff' && echoContext.artifactActiveBuffs.length > 0
            ? TOWER_WIZARD_COPY.echo.activeBuffPickerNote
            : undefined;
        const result = await showTowerWizardPowerPicker({
            grantKey,
            roleLabel: row?.role ?? grantKey,
            excludeIdentityKeys,
            excludeSubfamilies,
            actorEchoKey: echoKey,
            actorSubChoiceKey: echoSubChoiceKey,
            echoPickerNote,
            currentTemplateId: row?.spec.templateId || undefined,
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

    static startManualBuild(actor: Actor): TowerWizardDialog {
        return new TowerWizardDialog(actor, { manualBuildMode: true });
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

        /* ---- DF 2026 early identity steps ---- */
        root.find('.js-tw-choose-echo').on('click', async () => {
            const before = JSON.stringify((this.actor.system as any)?.echo?.key ?? '')
                + JSON.stringify((this.actor.system as any)?.echo?.subChoiceKey ?? '');
            const { showEchoCreationDialog } = await import('../../sheets/character-sheet-echo-dialog.js');
            await showEchoCreationDialog(this.actor);
            const after = JSON.stringify((this.actor.system as any)?.echo?.key ?? '')
                + JSON.stringify((this.actor.system as any)?.echo?.subChoiceKey ?? '');
            if (before !== after) this.earlyChanges.add('echo');
            this.render();
        });

        root.find('.js-tw-attr-value').on('change', (ev) => {
            const key = String($(ev.currentTarget).data('attr') || '') as typeof ATTRIBUTE_KEYS[number];
            if (!ATTRIBUTE_KEYS.includes(key)) return;
            const raw = String($(ev.currentTarget).val() ?? '');
            const next = { ...(this.selection.attributeValues ?? {}) };
            if (raw === '') delete next[key];
            else next[key] = Math.floor(Number(raw) || 0);
            this.selection.attributeValues = next;
            this.#recordEarlyChange('attributes');
        });

        root.find('.js-tw-stone-value').on('change input', (ev) => {
            const key = String($(ev.currentTarget).data('attr') || '') as typeof ATTRIBUTE_KEYS[number];
            if (!ATTRIBUTE_KEYS.includes(key)) return;
            const n = Math.max(0, Math.floor(Number($(ev.currentTarget).val()) || 0));
            this.selection.stoneAssignments = { ...(this.selection.stoneAssignments ?? {}), [key]: n };
            this.#recordEarlyChange('stones');
        });

        root.find('.js-tw-imprint-pick').on('change', (ev) => {
            const id = String($(ev.currentTarget).val() || '');
            const max = Math.max(1, Math.floor(Number(this.selection.masteryRank) || 2));
            const ids = new Set(this.selection.echoImprintIds ?? []);
            if ($(ev.currentTarget).is(':checked')) {
                if (ids.size >= max) {
                    $(ev.currentTarget).prop('checked', false);
                    ui.notifications?.warn(`At most ${max} Echo Imprint${max === 1 ? '' : 's'} at Mastery Rank ${max}.`);
                    return;
                }
                ids.add(id);
            } else {
                ids.delete(id);
            }
            this.selection.echoImprintIds = [...ids];
            this.#recordEarlyChange('imprints');
        });

        root.find('.js-tw-spec-input').on('change input', () => {
            const rows: Array<{ name?: string; field?: string; scope?: string }> = [];
            root.find('.js-tw-spec-row').each((_i, el) => {
                const row = $(el);
                rows.push({
                    name: String(row.find('[data-prop="name"]').val() ?? ''),
                    field: String(row.find('[data-prop="field"]').val() ?? ''),
                    scope: String(row.find('[data-prop="scope"]').val() ?? ''),
                });
            });
            const records = specRecordsFromDraft(rows);
            this.selection.specializations = records.length ? records : undefined;
            this.#recordEarlyChange('specializations');
        });

        root.find('.js-tw-select-passive1').on('click', (ev) => {
            const el = $(ev.currentTarget);
            el.addClass('is-picked');
            const templateId = String(el.data('passive-id') || '');
            if (!templateId) return;
            this.selection.manualBuildMode = false;
            this.selection.passive1TemplateId = templateId;
            this.selection.defenseId = deriveDefenseIdFromPassive1(templateId);
            this.selection.activeBuffMode = 'defensive';
            this.selection.offensiveActiveBuffId = undefined;
            this.selection.customizedSlots = { passive1: true, activeBuff: false, reaction: false };
            this.selection.offenseId = undefined;
            this.selection.offenseActivePicks = undefined;
            this.selection.guidedAttackDelivery = undefined;
            this.selection.offenseActiveOverrides = undefined;
            this.#clearPowerOverrides();

            const echoSys = this.actor.system as { echo?: { key?: string; subChoiceKey?: string } };
            const prevSecond = this.selection.secondPassiveTemplateId;
            if (prevSecond) {
                const stillLegal = isAllowedSecondPassive(
                    prevSecond,
                    templateId,
                    echoSys?.echo?.key ?? null,
                    echoSys?.echo?.subChoiceKey ?? null,
                );
                if (stillLegal) {
                    this.secondPassiveNeedsReselect = false;
                } else {
                    this.selection.secondPassiveTemplateId = undefined;
                    this.secondPassiveNeedsReselect = true;
                }
            } else {
                this.secondPassiveNeedsReselect = false;
            }

            this.#removePowerOverride('passive-1');
            this.#removePowerOverride('passive-2');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-select-delivery').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            const mode = String($(ev.currentTarget).data('delivery-mode') || '') as GuidedAttackDelivery;
            const resolved = resolveGuidedCoreAttackPick(mode);
            if (!resolved) {
                ui.notifications?.warn('No Core Attack is available for that style in the catalog.');
                return;
            }
            this.selection.guidedAttackDelivery = mode;
            this.selection.delivery = resolved.delivery;
            // Core Attack only — special focus is chosen on the same step.
            this.selection.offenseActivePicks = [resolved.pick];
            this.selection.offenseId = undefined;
            this.selection.offenseActiveOverrides = undefined;
            this.#removePowerOverride('offense-0');
            this.#removePowerOverride('offense-1');
            this.#syncGuidedOffenseOverrides();
            this.render();
        });

        root.find('.js-tw-select-special-focus').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            const pickId = String($(ev.currentTarget).data('pick-id') || '');
            const templateId = String($(ev.currentTarget).data('template-id') || '');
            const specialRaw = $(ev.currentTarget).data('special');
            const special = specialRaw === undefined || specialRaw === null || specialRaw === ''
                ? null
                : String(specialRaw);
            const core = this.selection.offenseActivePicks?.[0];
            if (!core) return;
            this.selection.offenseActivePicks = [{ ...core }, { pickId, templateId, special }];
            this.selection.offenseId = undefined;
            this.selection.offenseActiveOverrides = undefined;
            this.#removePowerOverride('offense-1');
            this.#syncGuidedOffenseOverrides();
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-select-passive2').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.secondPassiveTemplateId = String($(ev.currentTarget).data('passive-id') || '');
            this.secondPassiveNeedsReselect = false;
            this.#removePowerOverride('passive-2');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-active-buff-mode').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            const mode = String($(ev.currentTarget).data('buff-mode') || 'defensive') as ActiveBuffMode;
            this.selection.activeBuffMode = mode;
            if (mode === 'defensive') {
                this.selection.offensiveActiveBuffId = undefined;
                this.selection.customizedSlots = {
                    ...(this.selection.customizedSlots ?? {}),
                    activeBuff: false,
                };
            } else {
                this.selection.offensiveActiveBuffId = undefined;
            }
            this.#removePowerOverride('active-buff');
            window.setTimeout(() => this.#advanceAfterSelection(), 120);
        });

        root.find('.js-tw-select-offensive-buff').on('click', (ev) => {
            $(ev.currentTarget).addClass('is-picked');
            this.selection.offensiveActiveBuffId = String($(ev.currentTarget).data('buff-id') || '');
            this.selection.customizedSlots = {
                ...(this.selection.customizedSlots ?? {}),
                activeBuff: true,
            };
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
            } else {
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
            if (grantKey === 'offense-0' && !this.selection.manualBuildMode) return;
            await this.#openPowerPicker(grantKey);
        });

        root.find('.js-tw-reset-power').on('click', (ev) => {
            const grantKey = String($(ev.currentTarget).data('grant-key') || '') as PackageGrantKey;
            if (grantKey === 'passive-1') {
                // Guided builds choose Passive 1 freely — reset only clears a review override.
                this.selection.customizedSlots = {
                    ...(this.selection.customizedSlots ?? {}),
                    passive1: false,
                };
            }
            if (grantKey === 'active-buff') {
                this.selection.activeBuffMode = 'defensive';
                this.selection.offensiveActiveBuffId = undefined;
                this.selection.customizedSlots = {
                    ...(this.selection.customizedSlots ?? {}),
                    activeBuff: false,
                };
            }
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
            if (
                isManualBuildMode(this.selection)
                && this.step === 'review'
                && getVisibleWizardSteps(this.selection)[0] === 'review'
            ) {
                this.close();
                return;
            }
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
            if (isManualBuildMode(this.selection)) {
                // Restart Powers only — keep the identity steps already completed.
                const identity: Record<string, unknown> = {};
                for (const key of IDENTITY_SELECTION_KEYS) identity[key] = this.selection[key];
                this.selection = {
                    ...defaultSelection(),
                    ...identity,
                    manualBuildMode: true,
                };
                this.step = 'review';
            } else {
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
            if (!sel) return;
            const ok = await applyTowerWizardPackage(this.actor, sel);
            if (ok) this.close();
        });
    }
}

export async function showTowerWizardDialog(
    actor: Actor,
    options?: { manualBuildMode?: boolean },
): Promise<void> {
    const echoContext = buildTowerWizardEchoContext(actor);
    if (!echoContext.hasEcho) {
        ui.notifications?.warn(
            'Select your Echo in the Echo dialog before building your combat package.',
        );
    }
    const dialog = options?.manualBuildMode
        ? TowerWizardDialog.startManualBuild(actor)
        : new TowerWizardDialog(actor);
    await dialog.render(true);
}
