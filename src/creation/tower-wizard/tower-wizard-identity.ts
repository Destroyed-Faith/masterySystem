/**
 * Tower Wizard — DF 2026 early identity steps (view models + apply DTO).
 *
 * Pure helpers (no Foundry globals) shared by the dialog, the apply step and tests.
 * Skills are NOT written here: the legacy fixed-skill ratings are left untouched.
 */

import {
    ECHO_IMPRINTS,
    ECHO_IMPRINT_MIN_ATTRIBUTE,
    echoImprintTierFromAttribute,
    type EchoImprintAttribute,
} from '../../rules/echo-imprints.js';
import {
    SKILL_FIELDS,
    SKILL_FIELD_LABELS,
    isSkillField,
    specializationIdentityKey,
    type SkillField,
    type SpecializationRecord,
} from '../../rules/specializations.js';
import { readSpecializations } from '../../rules/specialization-roll.js';
import {
    ATTRIBUTE_KEYS,
    NEW_STARTING_PACKAGE,
    startingPackageIsValid,
    type AttributeKeyName,
} from '../../progression/v099-rules.js';
import {
    TOWER_WIZARD_STARTING_SPECIALIZATIONS,
    TOWER_WIZARD_STARTING_STONES,
    resolveWizardMasteryRank,
    wizardStoneCap,
    type TowerWizardIdentityContext,
} from './tower-wizard-validation.js';
import {
    isManualBuildMode,
    isValidWizardPassive1,
    resolvePassive1TemplateId,
} from './tower-wizard-packages.js';
import { isAllowedSecondPassive } from './tower-wizard-passive-categories.js';
import type { TowerWizardAttributeMap, TowerWizardSelection } from './tower-wizard-types.js';

export const WIZARD_ATTRIBUTE_LABELS: Record<AttributeKeyName, string> = {
    might: 'Might',
    agility: 'Agility',
    vitality: 'Vitality',
    intellect: 'Intellect',
    resolve: 'Resolve',
    influence: 'Influence',
    wits: 'Wits',
};

/** Allowed starting Attribute values (package 4,4,3,3,2,2,2). */
export const WIZARD_ATTRIBUTE_CHOICES: readonly number[] = [4, 3, 2];
export const WIZARD_STARTING_PACKAGE_TEXT = NEW_STARTING_PACKAGE.join(', ');

export interface WizardAttributeRow {
    key: AttributeKeyName;
    label: string;
    value: number | null;
    stones: number;
    options: Array<{ value: number; selected: boolean }>;
}

export function buildWizardAttributeRows(selection: Partial<TowerWizardSelection>): WizardAttributeRow[] {
    return ATTRIBUTE_KEYS.map((key) => {
        const raw = selection.attributeValues?.[key];
        const value = raw === undefined || raw === null ? null : Math.floor(Number(raw) || 0);
        return {
            key,
            label: WIZARD_ATTRIBUTE_LABELS[key],
            value,
            stones: Math.max(0, Math.floor(Number(selection.stoneAssignments?.[key]) || 0)),
            options: WIZARD_ATTRIBUTE_CHOICES.map((v) => ({ value: v, selected: v === value })),
        };
    });
}

export interface WizardAttributeSummary {
    packageText: string;
    stonesPlaced: number;
    stonesTotal: number;
    stoneCap: number;
}

export function buildWizardAttributeSummary(
    selection: Partial<TowerWizardSelection>,
    ctx: TowerWizardIdentityContext = {},
): WizardAttributeSummary {
    const placed = ATTRIBUTE_KEYS.reduce(
        (sum, k) => sum + Math.max(0, Math.floor(Number(selection.stoneAssignments?.[k]) || 0)),
        0,
    );
    return {
        packageText: WIZARD_STARTING_PACKAGE_TEXT,
        stonesPlaced: placed,
        stonesTotal: TOWER_WIZARD_STARTING_STONES,
        stoneCap: wizardStoneCap(resolveWizardMasteryRank(selection, ctx)),
    };
}

export interface WizardImprintChoice {
    id: string;
    name: string;
    tagline: string;
    tierText: string;
    echoMemory: string;
    selected: boolean;
}

export interface WizardImprintGroup {
    attribute: EchoImprintAttribute;
    label: string;
    value: number;
    eligible: boolean;
    tier: number;
    candidateSummary: string;
    imprints: WizardImprintChoice[];
}

const IMPRINT_ATTRIBUTE_ORDER: EchoImprintAttribute[] = [
    'might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits',
];

/** Imprints grouped by Attribute; ineligible Attributes (< 4) are listed but locked. */
export function buildWizardImprintGroups(
    selection: Partial<TowerWizardSelection>,
    ctx: TowerWizardIdentityContext = {},
): WizardImprintGroup[] {
    const attrs = (selection.attributeValues ?? ctx.actorAttributes ?? {}) as Record<string, number>;
    const selected = new Set(selection.echoImprintIds ?? []);
    return IMPRINT_ATTRIBUTE_ORDER.map((attribute) => {
        const value = Math.max(0, Math.floor(Number(attrs[attribute]) || 0));
        const eligible = value >= ECHO_IMPRINT_MIN_ATTRIBUTE;
        const tier = echoImprintTierFromAttribute(value);
        const defs = ECHO_IMPRINTS.filter((d) => d.attribute === attribute);
        const label = WIZARD_ATTRIBUTE_LABELS[attribute as AttributeKeyName];
        return {
            attribute,
            label,
            value,
            eligible,
            tier,
            candidateSummary: eligible
                ? `${label} ${value} → ${defs.length} candidates (Tier ${tier})`
                : `${label} ${value} → locked (needs ${ECHO_IMPRINT_MIN_ATTRIBUTE}+)`,
            imprints: eligible
                ? defs.map((d) => ({
                    id: d.id,
                    name: d.name,
                    tagline: d.tagline,
                    tierText: d.tiers[tier],
                    echoMemory: d.echoMemory,
                    selected: selected.has(d.id),
                }))
                : [],
        };
    });
}

export interface WizardSpecRow {
    index: number;
    name: string;
    field: SkillField;
    scope: string;
    rank: number;
    fieldOptions: Array<{ value: SkillField; label: string; selected: boolean }>;
}

/** Always returns five editable rows (Rank 2 each), padded from the current draft. */
export function buildWizardSpecRows(selection: Partial<TowerWizardSelection>): WizardSpecRow[] {
    const specs = selection.specializations ?? [];
    return Array.from({ length: TOWER_WIZARD_STARTING_SPECIALIZATIONS }, (_, index) => {
        const spec = specs[index];
        const field: SkillField = isSkillField(spec?.field) ? spec!.field : 'physical';
        return {
            index,
            name: spec?.name ?? '',
            field,
            scope: spec?.scope ?? '',
            rank: 2,
            fieldOptions: SKILL_FIELDS.map((f) => ({
                value: f,
                label: SKILL_FIELD_LABELS[f],
                selected: f === field,
            })),
        };
    });
}

/** Normalize draft rows into Rank-2 records; drops fully blank rows. */
export function specRecordsFromDraft(
    rows: Array<{ name?: string; field?: string; scope?: string }>,
): SpecializationRecord[] {
    const out: SpecializationRecord[] = [];
    for (const row of rows) {
        const name = String(row.name ?? '').trim();
        const scope = String(row.scope ?? '').trim();
        if (!name && !scope) continue;
        const field: SkillField = isSkillField(row.field) ? row.field : 'physical';
        out.push({ id: specializationIdentityKey(name, field), name, field, scope, rank: 2 });
    }
    return out;
}

/** Read the actor's existing identity data so the dialog opens pre-filled. */
export function readActorIdentityPrefill(system: any): Partial<TowerWizardSelection> {
    const out: Partial<TowerWizardSelection> = {};
    const echo = system?.echo ?? {};
    if (echo.key) {
        out.echoKey = String(echo.key);
        out.subChoiceKey = String(echo.subChoiceKey ?? '');
        out.veiledFormKey = String(echo.veiledFormKey ?? '');
    }
    const attrs: TowerWizardAttributeMap = {};
    for (const key of ATTRIBUTE_KEYS) {
        attrs[key] = Math.max(0, Math.floor(Number(system?.attributes?.[key]?.value) || 0));
    }
    if (startingPackageIsValid(attrs as Record<string, number>)) out.attributeValues = attrs;
    const stones: TowerWizardAttributeMap = {};
    let total = 0;
    for (const key of ATTRIBUTE_KEYS) {
        const n = Math.max(0, Math.floor(Number(system?.progression?.stoneAssignments?.[key]) || 0));
        stones[key] = n;
        total += n;
    }
    if (total === TOWER_WIZARD_STARTING_STONES) out.stoneAssignments = stones;
    const imprints = system?.echoImprints;
    if (Array.isArray(imprints) && imprints.length) {
        out.echoImprintIds = [...new Set(imprints.map((v: unknown) => String(v ?? '').trim()).filter(Boolean))];
    }
    const specs = readSpecializations(system);
    if (specs.length) out.specializations = specs;
    return out;
}

/**
 * Actor update payload for the identity steps. Writes `system.specializations`
 * and `system.echoImprints`; never touches legacy `system.skills` / `skillsSpent`.
 */
export function buildIdentityUpdateData(selection: Partial<TowerWizardSelection>): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (selection.attributeValues) {
        for (const key of ATTRIBUTE_KEYS) {
            const v = selection.attributeValues[key];
            if (v !== undefined) data[`system.attributes.${key}.value`] = Math.floor(Number(v) || 0);
        }
    }
    if (selection.stoneAssignments) {
        for (const key of ATTRIBUTE_KEYS) {
            data[`system.progression.stoneAssignments.${key}`] = Math.max(
                0,
                Math.floor(Number(selection.stoneAssignments[key]) || 0),
            );
        }
    }
    if (selection.echoImprintIds) data['system.echoImprints'] = [...new Set(selection.echoImprintIds)];
    if (selection.specializations) {
        data['system.specializations'] = selection.specializations.map((s) => ({
            id: s.id || specializationIdentityKey(s.name, s.field),
            name: String(s.name).trim(),
            field: s.field,
            scope: String(s.scope).trim(),
            rank: Math.floor(Number(s.rank) || 2),
        }));
    }
    return data;
}

export type WizardEarlyChange = 'echo' | 'attributes' | 'stones' | 'imprints' | 'specializations';

/** True once the player has picked any of the six combat Powers. */
export function wizardHasPowerChoices(selection: Partial<TowerWizardSelection>): boolean {
    if (isManualBuildMode(selection)) return (selection.powerOverrides?.length ?? 0) > 0;
    return !!(
        resolvePassive1TemplateId(selection)
        || selection.secondPassiveTemplateId
        || selection.offenseActivePicks?.length
        || selection.offenseId
        || selection.powerOverrides?.length
    );
}

/**
 * Short reconciliation preview after an early-step change when Powers are already
 * chosen. Lists what may need re-checking; never edits the Power choices itself.
 */
export function buildReconciliationPreview(
    selection: Partial<TowerWizardSelection>,
    changes: Iterable<WizardEarlyChange>,
    ctx: { echoKey?: string | null; subChoiceKey?: string | null } = {},
): string[] {
    if (!wizardHasPowerChoices(selection)) return [];
    const changed = new Set(changes);
    if (!changed.size) return [];
    const lines: string[] = [];
    const echoKey = ctx.echoKey ?? selection.echoKey ?? null;
    const sub = ctx.subChoiceKey ?? selection.subChoiceKey ?? null;
    if (changed.has('echo')) {
        lines.push('Echo changed — Echo-gated Powers and Echo Artifact Buffs may no longer apply.');
        const p1 = resolvePassive1TemplateId(selection);
        if (p1 && !isValidWizardPassive1(p1, echoKey, sub)) {
            lines.push('Your first Passive is no longer legal for this Echo — choose it again.');
        } else if (
            p1 && selection.secondPassiveTemplateId
            && !isAllowedSecondPassive(selection.secondPassiveTemplateId, p1, echoKey, sub)
        ) {
            lines.push('Your second Passive is no longer legal for this Echo — choose it again.');
        }
    }
    if (changed.has('attributes') || changed.has('stones')) {
        lines.push('Attributes or Stones changed — re-check spell Casting Attributes and Stone-based Powers.');
    }
    if (changed.has('imprints')) {
        lines.push('Echo Imprints changed — no Power depends on them, but review the summary.');
    }
    if (changed.has('specializations')) {
        lines.push('Specializations changed — Powers are unaffected; check Spec-gated tasks on your sheet.');
    }
    lines.push('Later steps were kept — step through them again to confirm before applying.');
    return lines;
}
