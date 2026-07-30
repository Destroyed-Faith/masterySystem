/**
 * Pure helpers to turn a homepage import payload into Foundry actor/item data.
 * No Foundry globals — safe for unit tests.
 */
import { buildPackageGrantSpecs, buildPackageGrantSpecsFromOverrides, isManualBuildMode, } from '../creation/tower-wizard/tower-wizard-packages.js';
import { CREATION_MASTERY_RANK, CREATION_POWER_TOTAL, findCatalogEntry, } from '../utils/power-catalog.js';
import { buildPowerItemFromCatalogEntry, } from '../utils/power-item-builder.js';
import { getGeneralArtifact } from '../utils/general-artifacts.js';
import { ECHO_ARTIFACTS } from '../utils/echo-artifacts.js';
import { calculateDisadvantagePoints, getDisadvantageDefinition, } from '../system/disadvantages.js';
import { getMinorExpressionDefinition } from '../utils/minor-expressions.js';
import { SKILLS } from '../utils/skills.js';
import { CHARACTER_IMPORT_ATTRIBUTE_KEYS } from './character-import-types.js';
export function normalizeImportAttributes(raw) {
    const out = {};
    for (const key of CHARACTER_IMPORT_ATTRIBUTE_KEYS) {
        const n = Math.floor(Number(raw?.[key]));
        out[key] = Number.isFinite(n) ? Math.max(2, Math.min(80, n)) : 2;
    }
    return out;
}
export function isKnownArtifactImportKey(key) {
    const k = String(key || '').trim();
    if (!k)
        return false;
    return !!getGeneralArtifact(k) || k in ECHO_ARTIFACTS;
}
export function resolvePowerGrantSpecs(payload) {
    if (Array.isArray(payload.powers) && payload.powers.length > 0) {
        return payload.powers;
    }
    const pkg = payload.combatPackage;
    if (!pkg)
        return null;
    if (isManualBuildMode(pkg)) {
        return buildPackageGrantSpecsFromOverrides(pkg);
    }
    return buildPackageGrantSpecs(pkg);
}
export function buildPowerItemsFromGrantSpecs(specs) {
    const items = [];
    for (const spec of specs) {
        const entry = findCatalogEntry(spec.templateId, spec.special ?? null);
        if (!entry) {
            throw new Error(`Catalog entry not found: ${spec.templateId}${spec.special ? ` (${spec.special})` : ''}`);
        }
        const itemData = buildPowerItemFromCatalogEntry(entry, spec.rank, {
            isSpell: !!spec.isSpell,
            castingAttribute: spec.castingAttribute,
            spellResolution: spec.spellResolution,
        });
        if (!itemData) {
            throw new Error(`Rank ${spec.rank} missing for ${entry.name}`);
        }
        items.push(itemData);
    }
    return items;
}
export function buildGearItemData(gear) {
    return {
        name: String(gear.name || 'Item').trim(),
        type: 'gear',
        system: {
            description: String(gear.description ?? ''),
            inventorySize: String(gear.inventorySize ?? '1x1'),
            quantity: Math.max(1, Math.floor(Number(gear.quantity) || 1)),
            equipSlots: [],
            equipped: false,
        },
    };
}
export function isKnownSkillKey(key) {
    return key in SKILLS;
}
export function isKnownMinorExpressionId(id) {
    return !!getMinorExpressionDefinition(id);
}
/** Turn homepage disadvantage shorthand into actor `system.disadvantages` rows. */
export function normalizeDisadvantageEntries(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const entry of raw) {
        if (typeof entry === 'string') {
            const id = entry.trim();
            const def = getDisadvantageDefinition(id);
            if (!def)
                continue;
            const details = {};
            const points = calculateDisadvantagePoints(id, details);
            out.push({
                id: def.id,
                name: def.name,
                points,
                details,
                description: def.description,
            });
            continue;
        }
        if (!entry || typeof entry !== 'object')
            continue;
        const id = String(entry.id ?? '').trim();
        const def = getDisadvantageDefinition(id);
        if (!def)
            continue;
        const details = { ...(entry.details ?? {}) };
        const points = Number.isFinite(Number(entry.points)) && Number(entry.points) > 0
            ? Math.floor(Number(entry.points))
            : calculateDisadvantagePoints(id, details);
        out.push({
            id: def.id,
            name: def.name,
            points,
            details,
            description: def.description,
        });
    }
    return out;
}
export function disadvantagePointsTotal(disadvantages) {
    return disadvantages.reduce((sum, d) => sum + Math.max(0, Math.floor(Number(d.points) || 0)), 0);
}
export function normalizeSkillRanks(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object')
        return out;
    for (const [key, value] of Object.entries(raw)) {
        if (!isKnownSkillKey(key))
            continue;
        const rank = Math.max(0, Math.floor(Number(value) || 0));
        if (rank > 0)
            out[key] = rank;
    }
    return out;
}
export function normalizeMinorExpressionIds(raw, masteryRank) {
    if (!Array.isArray(raw))
        return [];
    const cap = Math.max(0, Math.floor(masteryRank));
    const seen = new Set();
    const out = [];
    for (const rawId of raw) {
        const id = String(rawId ?? '').trim();
        if (!id || seen.has(id) || !isKnownMinorExpressionId(id))
            continue;
        if (out.length >= cap)
            break;
        seen.add(id);
        out.push(id);
    }
    return out;
}
export function buildActorSystemFromPayload(payload) {
    const attrs = normalizeImportAttributes(payload.attributes);
    const masteryRank = Math.max(1, Math.min(8, Math.floor(Number(payload.masteryRank) || CREATION_MASTERY_RANK)));
    const echo = payload.echo ?? { key: '' };
    const attributeBlock = Object.fromEntries(CHARACTER_IMPORT_ATTRIBUTE_KEYS.map((key) => [
        key,
        { value: attrs[key], stones: Math.floor(attrs[key] / 8) },
    ]));
    const stonePools = Object.fromEntries(CHARACTER_IMPORT_ATTRIBUTE_KEYS.map((key) => {
        const max = Math.floor(attrs[key] / 8);
        return [key, { current: max, max, sustained: 0 }];
    }));
    const skills = normalizeSkillRanks(payload.skills);
    const skillsSpent = normalizeSkillRanks(payload.skillsSpent);
    const disadvantages = normalizeDisadvantageEntries(payload.disadvantages);
    const minorExpressions = normalizeMinorExpressionIds(payload.minorExpressions, masteryRank);
    const faithPts = disadvantagePointsTotal(disadvantages);
    return {
        bio: {
            name: String(payload.name || '').trim(),
            echo: String(echo.key ?? ''),
            concept: String(payload.bio?.concept ?? ''),
            appearance: String(payload.bio?.appearance ?? ''),
            notes: String(payload.bio?.notes ?? ''),
        },
        echo: {
            key: String(echo.key ?? ''),
            subChoiceKey: String(echo.subChoiceKey ?? ''),
            veiledFormKey: String(echo.veiledFormKey ?? ''),
            selectedCardIds: Array.isArray(echo.selectedCardIds) ? [...echo.selectedCardIds] : [],
            cardUses: {},
            traitUses: {},
        },
        attributes: attributeBlock,
        stonePools,
        mastery: { rank: masteryRank, points: 0, experience: 0 },
        skills,
        skillsSpent,
        disadvantages,
        minorExpressions,
        languages: {
            known: Array.isArray(payload.languages?.known) ? [...payload.languages.known] : ['common'],
        },
        creation: {
            complete: payload.creationComplete !== false,
            importSource: 'homepage',
            importSchemaVersion: 1,
            disadvantagesReviewed: disadvantages.length > 0,
        },
        conditions: [],
        notes: {
            schticks: '',
            faithFractures: '',
            background: '',
        },
        faithFractures: { current: faithPts, maximum: faithPts },
        schticks: { ranks: [] },
        familiars: [],
        ...(payload.systemOverrides ?? {}),
    };
}
export function buildActorCreateDataFromPayload(payload) {
    return {
        name: String(payload.name || '').trim(),
        type: 'character',
        img: payload.img || 'icons/svg/mystery-man.svg',
        folder: payload.folder ?? null,
        system: buildActorSystemFromPayload(payload),
        flags: {
            'mastery-system': {
                importSource: 'homepage',
                importSchemaVersion: 1,
            },
        },
    };
}
export function validateArtifactImportSpec(spec) {
    const key = String(spec?.key ?? '').trim();
    if (!key)
        return 'Artifact entry is missing `key`.';
    if (!isKnownArtifactImportKey(key))
        return `Unknown artifact key "${key}".`;
    const level = Number(spec.level ?? 1);
    if (!Number.isFinite(level) || level < 1 || level > 10) {
        return `Artifact "${key}" level must be 1–10.`;
    }
    return null;
}
export function expectedPowerCount() {
    return CREATION_POWER_TOTAL;
}
//# sourceMappingURL=character-import-build.js.map