/**
 * DF 2026-10-23 migration review — pure planning / update helpers (no Foundry globals).
 *
 * The review dialog (`df-2026-migration-review-dialog.ts`) is a thin UI on top
 * of these functions so the rules stay unit-testable:
 *
 * - Legacy Skill names become Specialization *suggestions* only. No Rank is
 *   ever auto-assigned (no Rank 2 conversion); the GM types the name, Field,
 *   scope and Rank.
 * - Minor Expressions with no exact Echo Imprint mapping are listed as
 *   "unmapped" so the GM can pick an Imprint by hand.
 * - Imprint proposals exceeding Mastery Rank are flagged for trimming.
 * - Saving writes ONLY `system.specializations`, `system.echoImprints` and a
 *   review-stamp flag. XP / Stones / Powers / Artifacts are never touched.
 */

import {
  ECHO_IMPRINTS,
  findEchoImprint,
  isSkillField,
  normalizeSpecializationName,
  specializationIdentityKey,
  validateEchoImprintSelections,
  validateSpecializationList,
  readSpecializations,
  SPECIALIZATION_MAX_RANK,
  type EchoImprintAttribute,
  type SkillField,
  type SpecializationRecord,
} from '../rules/index.js';
import { DF_2026_RULES_SCHEMA_VERSION } from '../rules/index.js';
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getMinorExpressionDefinition } from '../utils/minor-expressions.js';
import {
  DF_2026_LEGACY_SNAPSHOT_FLAG,
  MINOR_EXPRESSION_TO_IMPRINT,
} from './df-2026-rules-migration.js';

/** Flag key stamped on an actor once the GM saved its review. */
export const DF_2026_REVIEWED_FLAG = 'df2026ReviewedAt';

const IMPRINT_ATTRIBUTES: EchoImprintAttribute[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
];

/** Legacy Skill category → closest Specialization Field (suggestion only). */
const CATEGORY_TO_FIELD: Record<string, SkillField> = {
  [SKILL_CATEGORIES.AWARENESS]: 'investigation',
  [SKILL_CATEGORIES.PHYSICAL]: 'physical',
  [SKILL_CATEGORIES.KNOWLEDGE_CRAFT]: 'science-craft',
  [SKILL_CATEGORIES.SOCIAL]: 'social',
  [SKILL_CATEGORIES.SURVIVAL]: 'survival',
};

export interface SpecSuggestion {
  /** Legacy skill key (e.g. `stealth`). */
  skillKey: string;
  /** Suggested free name — the legacy skill's display name. */
  suggestedName: string;
  suggestedField: SkillField;
  /** Legacy rating, shown for context only. It is NEVER converted to a Rank. */
  legacyRating: number;
}

export interface UnmappedExpression {
  id: string;
  name: string;
  attribute: string;
}

export interface Df2026ReviewPlan {
  actorId: string;
  actorName: string;
  masteryRank: number;
  /** Suggestions only; excludes names the character already has as a Specialization. */
  specSuggestions: SpecSuggestion[];
  currentSpecializations: SpecializationRecord[];
  unmappedExpressions: UnmappedExpression[];
  /** Imprint ids that map 1:1 from legacy Minor Expressions. */
  mappedImprintIds: string[];
  currentImprintIds: string[];
  /** current ∪ mapped, in order, before trimming. */
  proposedImprintIds: string[];
  /** Imprints beyond Mastery Rank that must be dropped. */
  trimmedImprintIds: string[];
  /** Set when proposed Imprints exceed Mastery Rank. */
  imprintTrimWarning: string | null;
  warnings: string[];
  alreadyReviewed: boolean;
  /** True when there is something for the GM to decide. */
  needsReview: boolean;
}

export interface Df2026ReviewInput {
  specializations: Array<Partial<SpecializationRecord>>;
  echoImprints: string[];
}

export interface Df2026ReviewUpdateResult {
  ok: boolean;
  errors: string[];
  /** Foundry update payload — only Spec / Imprint / review-stamp keys. */
  update: Record<string, unknown> | null;
  specializations: SpecializationRecord[];
  echoImprints: string[];
}

function readFlag(actor: any, key: string): unknown {
  try {
    const v = actor?.getFlag?.('mastery-system', key);
    if (v !== undefined) return v;
  } catch {
    /* fall through */
  }
  return actor?.flags?.['mastery-system']?.[key];
}

function masteryRankOf(system: any): number {
  return Math.max(1, Math.floor(Number(system?.mastery?.rank) || 2));
}

function legacyRating(value: unknown): number {
  if (typeof value === 'number') return Math.max(0, Math.floor(value));
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return Math.max(0, Math.floor(Number(v.rating ?? v.value ?? v.rank) || 0));
  }
  return Math.max(0, Math.floor(Number(value) || 0));
}

function legacyExpressionIds(source: any): string[] {
  const list: unknown[] = Array.isArray(source?.selected)
    ? source.selected
    : Array.isArray(source)
      ? source
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function currentImprintIds(system: any): string[] {
  const raw = Array.isArray(system?.echoImprints) ? system.echoImprints : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of raw) {
    const id = String(v ?? '').trim();
    if (!id || seen.has(id) || !findEchoImprint(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function titleCase(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

/** Build the per-character review plan. Never mutates the actor. */
export function buildDf2026ReviewPlan(actor: any): Df2026ReviewPlan {
  const system = actor?.system ?? {};
  const snapshot = readFlag(actor, DF_2026_LEGACY_SNAPSHOT_FLAG) as Record<string, any> | undefined;
  const legacySkills = snapshot?.skills ?? system.skills ?? null;
  const legacyExpressions = snapshot?.minorExpressions ?? system.minorExpressions ?? null;
  const mr = masteryRankOf(system);

  const currentSpecs = readSpecializations(system);
  const haveNames = new Set(currentSpecs.map((s) => normalizeSpecializationName(s.name)));

  const specSuggestions: SpecSuggestion[] = [];
  if (legacySkills && typeof legacySkills === 'object') {
    for (const [skillKey, value] of Object.entries(legacySkills as Record<string, unknown>)) {
      const rating = legacyRating(value);
      if (rating <= 0) continue;
      const def = SKILLS[skillKey];
      const suggestedName = def?.name ?? titleCase(skillKey);
      if (haveNames.has(normalizeSpecializationName(suggestedName))) continue;
      specSuggestions.push({
        skillKey,
        suggestedName,
        suggestedField: (def && CATEGORY_TO_FIELD[def.category]) || 'physical',
        legacyRating: rating,
      });
    }
    specSuggestions.sort((a, b) => b.legacyRating - a.legacyRating || a.suggestedName.localeCompare(b.suggestedName));
  }

  const exprIds = legacyExpressionIds(legacyExpressions);
  const mappedImprintIds: string[] = [];
  const unmappedExpressions: UnmappedExpression[] = [];
  for (const id of exprIds) {
    const mapped = MINOR_EXPRESSION_TO_IMPRINT[id];
    if (mapped && findEchoImprint(mapped)) {
      if (!mappedImprintIds.includes(mapped)) mappedImprintIds.push(mapped);
    } else {
      const def = getMinorExpressionDefinition(id);
      unmappedExpressions.push({
        id,
        name: def?.name ?? id,
        attribute: def?.attribute ?? '',
      });
    }
  }

  const current = currentImprintIds(system);
  const proposed = [...current];
  for (const id of mappedImprintIds) if (!proposed.includes(id)) proposed.push(id);
  const trimmed = proposed.length > mr ? proposed.slice(mr) : [];
  const imprintTrimWarning = trimmed.length
    ? `Imprints (${proposed.length}) exceed Mastery Rank ${mr}; drop ${trimmed.length} before saving.`
    : null;

  const warnings: string[] = [];
  if (specSuggestions.length && !currentSpecs.length) {
    warnings.push('No Specializations yet. Legacy Skills are suggestions only — Ranks are not converted.');
  }
  for (const u of unmappedExpressions) {
    warnings.push(`Minor Expression "${u.name}" needs a manual Echo Imprint choice.`);
  }
  if (imprintTrimWarning) warnings.push(imprintTrimWarning);

  const alreadyReviewed = !!readFlag(actor, DF_2026_REVIEWED_FLAG);
  const needsReview =
    !alreadyReviewed &&
    (specSuggestions.length > 0 || unmappedExpressions.length > 0 || !!imprintTrimWarning);

  return {
    actorId: String(actor?.id ?? ''),
    actorName: String(actor?.name ?? ''),
    masteryRank: mr,
    specSuggestions,
    currentSpecializations: currentSpecs,
    unmappedExpressions,
    mappedImprintIds,
    currentImprintIds: current,
    proposedImprintIds: proposed,
    trimmedImprintIds: trimmed,
    imprintTrimWarning,
    warnings,
    alreadyReviewed,
    needsReview,
  };
}

/** Review plans for every character; by default only those with open decisions. */
export function listDf2026ReviewPlans(
  actors: Iterable<any> | null | undefined,
  opts: { includeReviewed?: boolean; onlyIds?: string[] } = {},
): Df2026ReviewPlan[] {
  const only = opts.onlyIds ? new Set(opts.onlyIds) : null;
  const plans: Df2026ReviewPlan[] = [];
  for (const actor of actors ?? []) {
    if (!actor || actor.type !== 'character') continue;
    if (only && !only.has(String(actor.id))) continue;
    // Pre-migration actors have no legacy snapshot yet and are handled by the migration itself.
    const version = String(actor.system?.progression?.rulesSchemaVersion ?? '');
    if (version !== DF_2026_RULES_SCHEMA_VERSION) continue;
    const plan = buildDf2026ReviewPlan(actor);
    if (opts.includeReviewed || plan.needsReview) plans.push(plan);
  }
  return plans;
}

/** Normalize one GM-entered Specialization row (identity id, clamped rank). */
export function normalizeReviewSpecialization(
  raw: Partial<SpecializationRecord>,
): SpecializationRecord | null {
  const name = String(raw?.name ?? '').trim();
  if (!name) return null;
  const field: SkillField = isSkillField(String(raw?.field ?? '')) ? (raw!.field as SkillField) : 'physical';
  return {
    id: specializationIdentityKey(name, field),
    name,
    field,
    scope: String(raw?.scope ?? '').trim(),
    rank: Math.max(0, Math.min(SPECIALIZATION_MAX_RANK, Math.floor(Number(raw?.rank) || 0))),
  };
}

/**
 * Validate GM input and build the actor update. Touches ONLY
 * `system.specializations`, `system.echoImprints` and the review stamp flag.
 */
export function buildDf2026ReviewUpdate(
  actor: any,
  input: Df2026ReviewInput,
  now: Date = new Date(),
): Df2026ReviewUpdateResult {
  const system = actor?.system ?? {};
  const specs: SpecializationRecord[] = [];
  for (const row of input?.specializations ?? []) {
    const spec = normalizeReviewSpecialization(row);
    if (spec) specs.push(spec);
  }
  const imprintIds = [...new Set((input?.echoImprints ?? []).map((v) => String(v ?? '').trim()).filter(Boolean))];

  const errors: string[] = [];
  errors.push(...validateSpecializationList(specs).errors);

  const attributes = {} as Partial<Record<EchoImprintAttribute, number>>;
  for (const attr of IMPRINT_ATTRIBUTES) {
    attributes[attr] = Math.floor(Number(system?.attributes?.[attr]?.value) || 0);
  }
  errors.push(
    ...validateEchoImprintSelections({
      selectedIds: imprintIds,
      masteryRank: masteryRankOf(system),
      attributes,
    }).errors,
  );

  if (errors.length) {
    return { ok: false, errors, update: null, specializations: specs, echoImprints: imprintIds };
  }
  return {
    ok: true,
    errors: [],
    update: {
      'system.specializations': specs,
      'system.echoImprints': imprintIds,
      [`flags.mastery-system.${DF_2026_REVIEWED_FLAG}`]: now.toISOString(),
    },
    specializations: specs,
    echoImprints: imprintIds,
  };
}

/** Validate and write one character's review. */
export async function applyDf2026Review(
  actor: any,
  input: Df2026ReviewInput,
): Promise<Df2026ReviewUpdateResult> {
  const result = buildDf2026ReviewUpdate(actor, input);
  if (result.ok && result.update) {
    await actor.update(result.update);
  }
  return result;
}

/** Catalogue helper for the dialog: Imprints grouped by attribute. */
export function imprintsByAttribute(): Array<{
  attribute: EchoImprintAttribute;
  imprints: Array<{ id: string; name: string }>;
}> {
  return IMPRINT_ATTRIBUTES.map((attribute) => ({
    attribute,
    imprints: ECHO_IMPRINTS.filter((e) => e.attribute === attribute).map((e) => ({
      id: e.id,
      name: e.name,
    })),
  })).filter((g) => g.imprints.length > 0);
}
