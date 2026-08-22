/**
 * Validation for homepage character import JSON.
 */
import { validateTowerWizardSelection } from '../creation/tower-wizard/tower-wizard-validation.js';
import { findCatalogEntry, CREATION_POWER_TOTAL } from '../utils/power-catalog.js';
import { CHARACTER_IMPORT_ATTRIBUTE_KEYS, CHARACTER_IMPORT_EXPORT_KIND, CHARACTER_IMPORT_SCHEMA_VERSION, CHARACTER_IMPORT_SYSTEM_ID, FOUNDRY_ACTOR_IMPORT_EXPORT_KIND, } from './character-import-types.js';
import { disadvantagePointsTotal, expectedPowerCount, isKnownMinorExpressionId, isKnownSkillKey, normalizeDisadvantageEntries, resolveEchoArtifactImportKeys, resolvePowerGrantSpecs, validateArtifactImportSpec, } from './character-import-build.js';
import { ECHO_ARTIFACTS, validateEchoArtifactSelection } from '../utils/echo-artifacts.js';
import { getMinorExpressionDefinition } from '../utils/minor-expressions.js';
import { getDisadvantageDefinition } from '../system/disadvantages.js';
function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
function validatePowerGrantSpecs(specs) {
    const errors = [];
    if (specs.length !== CREATION_POWER_TOTAL) {
        errors.push(`Expected exactly ${CREATION_POWER_TOTAL} powers, got ${specs.length}.`);
    }
    const seen = new Set();
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
        const levels = entry.raw?.levels;
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
const CREATION_SKILL_POINTS = 40;
const MAX_DISADVANTAGE_POINTS = 8;
function validateSkillsAndExpressions(payload) {
    const errors = [];
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
            }
            else {
                spent += Math.floor(rank);
            }
        }
        if (spent > CREATION_SKILL_POINTS) {
            errors.push(`Skills total ${spent} exceeds creation budget (${CREATION_SKILL_POINTS}).`);
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
            if (!id)
                continue;
            if (!isKnownMinorExpressionId(id)) {
                errors.push(`Unknown Minor Expression id "${id}".`);
                continue;
            }
            const def = getMinorExpressionDefinition(id);
            const attrVal = Number(attrs[def.attribute]);
            if (!Number.isFinite(attrVal) || attrVal < 8) {
                errors.push(`Minor Expression "${id}" requires ${def.attribute} ≥ 8 (currently ${attrVal || 'missing'}).`);
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
                const id = String(entry.id ?? '').trim();
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
function validateCharacterPayload(payload) {
    const errors = [];
    const warnings = [];
    const name = String(payload?.name ?? '').trim();
    if (!name)
        errors.push('`character.name` is required.');
    if (!isPlainObject(payload.attributes)) {
        errors.push('`character.attributes` must be an object.');
    }
    else {
        for (const key of CHARACTER_IMPORT_ATTRIBUTE_KEYS) {
            const raw = payload.attributes[key];
            if (raw === undefined || raw === null) {
                warnings.push(`Attribute "${key}" missing — will default to 2.`);
                continue;
            }
            const n = Number(raw);
            if (!Number.isFinite(n) || n < 2 || n > 80) {
                errors.push(`Attribute "${key}" must be a number between 2 and 80.`);
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
        const pkgErr = validateTowerWizardSelection(payload.combatPackage);
        if (pkgErr)
            errors.push(`combatPackage: ${pkgErr}`);
    }
    const specs = resolvePowerGrantSpecs(payload);
    if (!specs) {
        if (hasPackage || hasPowers) {
            errors.push('Could not resolve six power grants from the payload.');
        }
    }
    else {
        errors.push(...validatePowerGrantSpecs(specs));
    }
    if (Array.isArray(payload.artifacts)) {
        for (const art of payload.artifacts) {
            const artErr = validateArtifactImportSpec(art);
            if (artErr)
                errors.push(artErr);
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
    return {
        ok: errors.length === 0,
        errors,
        warnings,
        kind: CHARACTER_IMPORT_EXPORT_KIND,
    };
}
function validateFoundryActorDocument(doc) {
    const errors = [];
    const warnings = [];
    const actor = doc.actor;
    if (!isPlainObject(actor)) {
        return { ok: false, errors: ['`actor` object is required.'], warnings, kind: FOUNDRY_ACTOR_IMPORT_EXPORT_KIND };
    }
    if (!String(actor.name ?? '').trim())
        errors.push('`actor.name` is required.');
    if (actor.type && actor.type !== 'character') {
        errors.push('Only `type: "character"` actors can be imported.');
    }
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
export function parseCharacterImportJson(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        throw new Error('Invalid JSON — could not parse the file.');
    }
    if (!isPlainObject(parsed)) {
        throw new Error('Import document must be a JSON object.');
    }
    return parsed;
}
export function validateCharacterImportDocument(doc) {
    const errors = [];
    const warnings = [];
    if (!isPlainObject(doc)) {
        return { ok: false, errors: ['Document must be a JSON object.'], warnings };
    }
    const schemaVersion = Number(doc.schemaVersion);
    if (schemaVersion !== CHARACTER_IMPORT_SCHEMA_VERSION) {
        errors.push(`Unsupported schemaVersion ${doc.schemaVersion} (expected ${CHARACTER_IMPORT_SCHEMA_VERSION}).`);
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
        const inner = validateCharacterPayload(doc.character);
        return {
            ok: inner.ok && errors.length === 0,
            errors: [...errors, ...inner.errors],
            warnings: [...warnings, ...inner.warnings],
            kind: CHARACTER_IMPORT_EXPORT_KIND,
        };
    }
    if (exportKind === FOUNDRY_ACTOR_IMPORT_EXPORT_KIND) {
        const inner = validateFoundryActorDocument(doc);
        return {
            ok: inner.ok && errors.length === 0,
            errors: [...errors, ...inner.errors],
            warnings: [...warnings, ...inner.warnings],
            kind: FOUNDRY_ACTOR_IMPORT_EXPORT_KIND,
        };
    }
    errors.push(`Unknown exportKind "${exportKind}". Use "${CHARACTER_IMPORT_EXPORT_KIND}" or "${FOUNDRY_ACTOR_IMPORT_EXPORT_KIND}".`);
    return { ok: false, errors, warnings };
}
export function validateCharacterImportJson(text) {
    try {
        const doc = parseCharacterImportJson(text);
        return validateCharacterImportDocument(doc);
    }
    catch (err) {
        return {
            ok: false,
            errors: [err instanceof Error ? err.message : String(err)],
            warnings: [],
        };
    }
}
//# sourceMappingURL=character-import-validation.js.map