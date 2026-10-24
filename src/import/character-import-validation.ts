/**
 * Validation for homepage character import JSON.
 */

import { validateTowerWizardSelection } from '../creation/tower-wizard/tower-wizard-validation.js';
import { MAX_ATTRIBUTE } from '../utils/constants.js';
import { findCatalogEntry, CREATION_POWER_TOTAL } from '../utils/power-catalog.js';
import type { PowerGrantSpec } from '../utils/power-item-builder.js';
import {
  CHARACTER_IMPORT_ATTRIBUTE_KEYS,
  CHARACTER_IMPORT_EXPORT_KIND,
  CHARACTER_IMPORT_SCHEMA_VERSION,
  CHARACTER_IMPORT_SYSTEM_ID,
  FOUNDRY_ACTOR_IMPORT_EXPORT_KIND,
  type CharacterImportDocument,
  type CharacterImportPayload,
  type CharacterImportValidationResult,
  type MasteryCharacterImportDocument,
  type MasteryFoundryActorImportDocument,
} from './character-import-types.js';
import {
  disadvantagePointsTotal,
  expectedPowerCount,
  IMPORT_STARTING_ATTRIBUTE_STONES,
  isKnownMinorExpressionId,
  isKnownSkillKey,
  normalizeDisadvantageEntries,
  normalizeImportPermanentColorless,
  normalizeImportStoneAssignments,
  resolveEchoArtifactImportKeys,
  resolvePowerGrantSpecs,
  sumImportStoneAssignments,
  validateArtifactImportSpec,
} from './character-import-build.js';
import {
  validateEchoImprintSelections,
  validateSpecializationList,
  type EchoImprintAttribute,
  type SpecializationRecord,
} from '../rules/index.js';
import { ECHO_ARTIFACTS, validateEchoArtifactSelection } from '../utils/echo-artifacts.js';
import type { CharacterImportDisadvantage } from './character-import-types.js';
import { getMinorExpressionDefinition } from '../utils/minor-expressions.js';
import { getDisadvantageDefinition } from '../system/disadvantages.js';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function validatePowerGrantSpecs(specs: PowerGrantSpec[]): string[] {
  const errors: string[] = [];
  if (specs.length !== CREATION_POWER_TOTAL) {
    errors.push(`Expected exactly ${CREATION_POWER_TOTAL} powers, got ${specs.length}.`);
  }
  const seen = new Set<string>();
  for (const spec of specs) {
    const tid = String(spec?.templateId ?? '').trim();
    if (!tid) {
      errors.push('Power grant is missing templateId.');
      continue;
    }
    const entry = findCatalogEntry(tid, spec.special ?? null);
    if (!entry) {
      errors.push(`Unknown power template "${tid}"${spec.special ? ` (${spec.special})` : ''}.`);
      continue;
    }
    const rank = Math.floor(Number(spec.rank));
    if (!Number.isFinite(rank) || rank < 1 || rank > 16) {
      errors.push(`Power "${tid}" has invalid rank ${spec.rank}.`);
      continue;
    }
    const levels = (entry.raw as { levels?: Record<string, unknown> })?.levels;
    if (!levels?.[String(rank)]) {
      errors.push(`Power "${tid}" has no data for rank ${rank}.`);
    }
    const identity = `${tid}::${spec.special ?? ''}::${rank}`;
    if (seen.has(identity)) {
      errors.push(`Duplicate power grant: ${tid}.`);
    }
    seen.add(identity);
  }
  return errors;
}

/** @deprecated Legacy archive ceiling only — Specs are the creation budget. */
const LEGACY_SKILL_ARCHIVE_CAP = 40;
const MAX_DISADVANTAGE_POINTS = 8;

function validateSkillsAndExpressions(payload: CharacterImportPayload): string[] {
  const errors: string[] = [];

  if (payload.skills && typeof payload.skills === 'object') {
    let spent = 0;
    for (const [key, value] of Object.entries(payload.skills)) {
      if (!isKnownSkillKey(key)) {
        errors.push(`Unknown skill key "${key}".`);
        continue;
      }
      const rank = Number(value);
      if (!Number.isFinite(rank) || rank < 0) {
        errors.push(`Skill "${key}" must be a non-negative number.`);
      } else {
        spent += Math.floor(rank);
      }
    }
    if (spent > LEGACY_SKILL_ARCHIVE_CAP) {
      errors.push(`Legacy archive skills total ${spent} exceeds historical cap (${LEGACY_SKILL_ARCHIVE_CAP}).`);
    }
  }

  const mr = Math.max(1, Math.min(8, Math.floor(Number(payload.masteryRank) || 4)));
  if (Array.isArray(payload.minorExpressions)) {
    if (payload.minorExpressions.length > mr) {
      errors.push(`At most ${mr} Minor Expression(s) allowed at Mastery Rank ${mr}.`);
    }
    const attrs = payload.attributes ?? {};
    for (const rawId of payload.minorExpressions) {
      const id = String(rawId ?? '').trim();
      if (!id) continue;
      if (!isKnownMinorExpressionId(id)) {
        errors.push(`Unknown Minor Expression id "${id}".`);
        continue;
      }
      const def = getMinorExpressionDefinition(id)!;
      const attrVal = Number(attrs[def.attribute]);
      if (!Number.isFinite(attrVal) || attrVal < 2) {
        errors.push(
          `Minor Expression "${id}" requires ${def.attribute} ≥ 2 (currently ${attrVal || 'missing'}).`,
        );
      }
    }
  }

  if (Array.isArray(payload.disadvantages)) {
    for (const entry of payload.disadvantages) {
      if (typeof entry === 'string') {
        if (!getDisadvantageDefinition(entry.trim())) {
          errors.push(`Unknown disadvantage id "${entry}".`);
        }
        continue;
      }
      if (entry && typeof entry === 'object') {
        const id = String((entry as CharacterImportDisadvantage).id ?? '').trim();
        if (!getDisadvantageDefinition(id)) {
          errors.push(`Unknown disadvantage id "${id}".`);
        }
      }
    }
    // Zero disadvantages are allowed at creation — only enforce the maximum.
    const normalized = normalizeDisadvantageEntries(payload.disadvantages);
    const pts = disadvantagePointsTotal(normalized);
    if (payload.creationComplete !== false && pts > MAX_DISADVANTAGE_POINTS) {
      errors.push(`Disadvantages sum to ${pts} points; maximum is ${MAX_DISADVANTAGE_POINTS}.`);
    }
  }

  return errors;
}

const IMPRINT_ATTRIBUTE_KEYS: EchoImprintAttribute[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
];

/** DF 2026 Specializations + Echo Imprints (shared by payload and actor-document imports). */
function validateSpecsAndImprints(opts: {
  specializations: unknown;
  echoImprints: unknown;
  masteryRank: number;
  attributes: Partial<Record<EchoImprintAttribute, number>>;
  requireStartingBudget?: boolean;
}): string[] {
  const errors: string[] = [];

  if (opts.specializations !== undefined && opts.specializations !== null) {
    if (!Array.isArray(opts.specializations)) {
      errors.push('`specializations` must be an array.');
    } else {
      const rows = opts.specializations as Array<Partial<SpecializationRecord>>;
      const bad = rows.findIndex((r) => !isPlainObject(r));
      if (bad >= 0) {
        errors.push(`specializations[${bad}] must be an object.`);
      } else {
        errors.push(
          ...validateSpecializationList(rows, {
            requireStartingBudget: opts.requireStartingBudget === true,
          }).errors,
        );
      }
    }
  } else if (opts.requireStartingBudget) {
    errors.push('Starting characters need exactly five Specializations at Rank 2.');
  }

  if (opts.echoImprints !== undefined && opts.echoImprints !== null) {
    if (!Array.isArray(opts.echoImprints)) {
      errors.push('`echoImprints` must be an array of Echo Imprint ids.');
    } else {
      errors.push(
        ...validateEchoImprintSelections({
          selectedIds: (opts.echoImprints as unknown[]).map((v) => String(v ?? '').trim()),
          masteryRank: opts.masteryRank,
          attributes: opts.attributes,
        }).errors,
      );
    }
  }
  return errors;
}

function validateDf2026Fields(payload: CharacterImportPayload): {
  errors: string[];
  warnings: string[];
} {
  const mr = Math.max(1, Math.min(8, Math.floor(Number(payload.masteryRank) || 4)));
  const attributes: Partial<Record<EchoImprintAttribute, number>> = {};
  for (const key of IMPRINT_ATTRIBUTE_KEYS) {
    attributes[key] = Math.floor(Number(payload.attributes?.[key]) || 0);
  }
  // Complete characters (default) must ship the starting Spec budget; incomplete
  // imports may carry a partial Spec list for sheet finalize.
  const requireStartingBudget = payload.creationComplete !== false;
  const errors = validateSpecsAndImprints({
    specializations: payload.specializations,
    echoImprints: payload.echoImprints,
    masteryRank: mr,
    attributes,
    requireStartingBudget,
  });
  const warnings: string[] = [];
  if (payload.skills && Object.keys(payload.skills).length > 0) {
    warnings.push('Legacy `skills` are archive-only — define `specializations` instead; Ratings are not converted.');
  }
  if (Array.isArray(payload.minorExpressions) && payload.minorExpressions.length > 0) {
    warnings.push('Legacy `minorExpressions` are archive-only — define `echoImprints` instead.');
  }
  return { errors, warnings };
}

function validateCharacterPayload(payload: CharacterImportPayload): CharacterImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = String(payload?.name ?? '').trim();
  if (!name) errors.push('`character.name` is required.');

  if (!isPlainObject(payload.attributes)) {
    errors.push('`character.attributes` must be an object.');
  } else {
    for (const key of CHARACTER_IMPORT_ATTRIBUTE_KEYS) {
      const raw = payload.attributes[key];
      if (raw === undefined || raw === null) {
        warnings.push(`Attribute "${key}" missing — will default to 2.`);
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 1 || n > MAX_ATTRIBUTE) {
        errors.push(`Attribute "${key}" must be a number between 1 and ${MAX_ATTRIBUTE}.`);
      }
    }
  }

  const hasPackage = !!payload.combatPackage;
  const hasPowers = Array.isArray(payload.powers) && payload.powers.length > 0;
  if (!hasPackage && !hasPowers) {
    errors.push('Provide either `character.combatPackage` or `character.powers` (6 grants).');
  }
  if (hasPackage && hasPowers) {
    warnings.push('Both combatPackage and powers provided — `powers` wins if non-empty.');
  }

  if (hasPackage) {
    const pkgErr = validateTowerWizardSelection(payload.combatPackage!);
    if (pkgErr) errors.push(`combatPackage: ${pkgErr}`);
  }

  const specs = resolvePowerGrantSpecs(payload);
  if (!specs) {
    if (hasPackage || hasPowers) {
      errors.push('Could not resolve six power grants from the payload.');
    }
  } else {
    errors.push(...validatePowerGrantSpecs(specs));
  }

  if (Array.isArray(payload.artifacts)) {
    for (const art of payload.artifacts) {
      const artErr = validateArtifactImportSpec(art);
      if (artErr) errors.push(artErr);
    }
  }

  if (payload.echo?.key) {
    const echoArtifactKeys = resolveEchoArtifactImportKeys(payload);
    for (const key of echoArtifactKeys) {
      if (!(key in ECHO_ARTIFACTS)) {
        errors.push(`Unknown echo artifact key "${key}".`);
      }
    }
    const selectionError = validateEchoArtifactSelection(payload.echo.key, echoArtifactKeys);
    if (selectionError) {
      warnings.push(`Echo artifacts: ${selectionError}`);
    }
  }

  errors.push(...validateSkillsAndExpressions(payload));
  const df2026 = validateDf2026Fields(payload);
  errors.push(...df2026.errors);
  warnings.push(...df2026.warnings);
  errors.push(...validateStartingStones(payload));

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    kind: CHARACTER_IMPORT_EXPORT_KIND,
  };
}

/** Starting Attribute Stones + permanent Colorless for complete characters. */
function validateStartingStones(payload: CharacterImportPayload): string[] {
  const errors: string[] = [];
  const requireBudget = payload.creationComplete !== false;

  if (payload.stones !== undefined && payload.stones !== null) {
    if (!isPlainObject(payload.stones)) {
      errors.push('`stones` must be an object of attribute → stone count.');
      return errors;
    }
    for (const key of Object.keys(payload.stones)) {
      if (!(CHARACTER_IMPORT_ATTRIBUTE_KEYS as readonly string[]).includes(key)) {
        errors.push(`Unknown stone attribute "${key}".`);
        continue;
      }
      const n = Number((payload.stones as Record<string, unknown>)[key]);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        errors.push(`Stone count for "${key}" must be a non-negative integer.`);
      }
    }
    const assignments = normalizeImportStoneAssignments(payload.stones);
    const total = sumImportStoneAssignments(assignments);
    if (requireBudget && total !== IMPORT_STARTING_ATTRIBUTE_STONES) {
      errors.push(
        `Place exactly ${IMPORT_STARTING_ATTRIBUTE_STONES} starting Attribute Stones (placed ${total}).`,
      );
    }
  } else if (requireBudget) {
    errors.push(
      `Starting characters need exactly ${IMPORT_STARTING_ATTRIBUTE_STONES} Attribute Stones in \`stones\`.`,
    );
  }

  if (payload.permanentColorless !== undefined && payload.permanentColorless !== null) {
    const n = Number(payload.permanentColorless);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      errors.push('`permanentColorless` must be a non-negative integer.');
    } else if (requireBudget && normalizeImportPermanentColorless(n) !== 0) {
      // Creation at Lifetime XP 0 has 0 permanent Colorless; higher values are progression.
      errors.push('Starting characters must set `permanentColorless` to 0.');
    }
  }

  return errors;
}

function validateFoundryActorDocument(doc: MasteryFoundryActorImportDocument): CharacterImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const actor = doc.actor;
  if (!isPlainObject(actor)) {
    return { ok: false, errors: ['`actor` object is required.'], warnings, kind: FOUNDRY_ACTOR_IMPORT_EXPORT_KIND };
  }
  if (!String(actor.name ?? '').trim()) errors.push('`actor.name` is required.');
  if (actor.type && actor.type !== 'character') {
    errors.push('Only `type: "character"` actors can be imported.');
  }
  const system = isPlainObject(actor.system) ? actor.system : {};
  const attrBlock = isPlainObject(system.attributes) ? system.attributes : {};
  const attributes: Partial<Record<EchoImprintAttribute, number>> = {};
  for (const key of IMPRINT_ATTRIBUTE_KEYS) {
    const node = attrBlock[key];
    attributes[key] = Math.floor(Number(isPlainObject(node) ? node.value : node) || 0);
  }
  const mastery = isPlainObject(system.mastery) ? system.mastery : {};
  // Full actor dumps may carry in-play data that is stricter than creation rules
  // (e.g. a trimmed Imprint list); report problems as warnings so round-trips never fail.
  warnings.push(
    ...validateSpecsAndImprints({
      specializations: system.specializations,
      echoImprints: system.echoImprints,
      masteryRank: Math.max(1, Math.min(8, Math.floor(Number(mastery.rank) || 4))),
      attributes,
    }),
  );
  const items = Array.isArray(actor.items) ? actor.items : [];
  const powers = items.filter((i) => i?.type === 'power');
  if (powers.length > 0 && powers.length !== expectedPowerCount()) {
    warnings.push(`Actor has ${powers.length} power items (creation expects ${expectedPowerCount()}).`);
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    kind: FOUNDRY_ACTOR_IMPORT_EXPORT_KIND,
  };
}

export function parseCharacterImportJson(text: string): CharacterImportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON — could not parse the file.');
  }
  if (!isPlainObject(parsed)) {
    throw new Error('Import document must be a JSON object.');
  }
  return parsed as unknown as CharacterImportDocument;
}

export function validateCharacterImportDocument(doc: unknown): CharacterImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(doc)) {
    return { ok: false, errors: ['Document must be a JSON object.'], warnings };
  }

  const schemaVersion = Number(doc.schemaVersion);
  if (schemaVersion !== CHARACTER_IMPORT_SCHEMA_VERSION) {
    errors.push(
      `Unsupported schemaVersion ${doc.schemaVersion} (expected ${CHARACTER_IMPORT_SCHEMA_VERSION}).`,
    );
  }

  if (doc.systemId && doc.systemId !== CHARACTER_IMPORT_SYSTEM_ID) {
    errors.push(`Wrong systemId "${doc.systemId}" (expected "${CHARACTER_IMPORT_SYSTEM_ID}").`);
  }

  const exportKind = String(doc.exportKind ?? '');
  if (exportKind === CHARACTER_IMPORT_EXPORT_KIND) {
    if (!isPlainObject(doc.character)) {
      errors.push('`character` object is required.');
      return { ok: false, errors, warnings, kind: CHARACTER_IMPORT_EXPORT_KIND };
    }
    const inner = validateCharacterPayload(doc.character as unknown as CharacterImportPayload);
    return {
      ok: inner.ok && errors.length === 0,
      errors: [...errors, ...inner.errors],
      warnings: [...warnings, ...inner.warnings],
      kind: CHARACTER_IMPORT_EXPORT_KIND,
    };
  }

  if (exportKind === FOUNDRY_ACTOR_IMPORT_EXPORT_KIND) {
    const inner = validateFoundryActorDocument(doc as unknown as MasteryFoundryActorImportDocument);
    return {
      ok: inner.ok && errors.length === 0,
      errors: [...errors, ...inner.errors],
      warnings: [...warnings, ...inner.warnings],
      kind: FOUNDRY_ACTOR_IMPORT_EXPORT_KIND,
    };
  }

  errors.push(
    `Unknown exportKind "${exportKind}". Use "${CHARACTER_IMPORT_EXPORT_KIND}" or "${FOUNDRY_ACTOR_IMPORT_EXPORT_KIND}".`,
  );
  return { ok: false, errors, warnings };
}

export function validateCharacterImportJson(text: string): CharacterImportValidationResult {
  try {
    const doc = parseCharacterImportJson(text);
    return validateCharacterImportDocument(doc);
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : String(err)],
      warnings: [],
    };
  }
}
