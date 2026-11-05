/**
 * Temporary read-model for artifact levelProgression identity (K2 / Fable F4–F5).
 *
 * Until Batch E persists IDs onto embedded rows / packs, consumers may fill
 * missing identity from the live source catalog. Rules:
 * - Never overwrite a row that already carries powerTemplateId or artifactFunctionId
 *   (protects GM Node-Editor reassignments).
 * - Copy identity fields atomically from the matching catalog row — no per-field
 *   `||` / `??` merges that could splice two different lines.
 * - Artifact key comes only from `flags['mastery-system'].echoArtifactKey`
 *   (never `system.echoKey`, which is the Echo imprint key).
 */
import { ECHO_ARTIFACTS } from './echo-artifacts.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';
/** Identity fields that may be filled from the catalog for blank rows. */
const IDENTITY_FIELDS = [
    'powerTemplateId',
    'artifactFunctionId',
    'rank',
    'limited',
    'isSpell',
    'castingAttribute',
    'spellResolution',
    'chosenSpecialKey',
];
export function resolveEchoArtifactKey(item) {
    // Intentionally ignore system.echoKey — that is the Echo imprint key, not an artifact id.
    void item?.system?.echoKey;
    return String(item?.flags?.['mastery-system']?.echoArtifactKey || '').trim();
}
export function rowHasStructuredIdentity(row) {
    if (!row)
        return false;
    return !!(row.powerTemplateId || row.artifactFunctionId);
}
function catalogDefinition(key) {
    const echo = ECHO_ARTIFACTS[key];
    if (echo)
        return echo;
    const general = GENERAL_ARTIFACTS[key];
    return general || null;
}
/**
 * If the row already has structured identity, return it unchanged.
 * If not, and a catalog row exists for (echoArtifactKey, level), return a shallow
 * copy of `row` with identity fields taken wholly from that catalog row.
 */
export function enrichArtifactRowIdentity(item, row) {
    if (rowHasStructuredIdentity(row))
        return row;
    const key = resolveEchoArtifactKey(item);
    if (!key)
        return row;
    const def = catalogDefinition(key);
    if (!def?.levelProgression)
        return row;
    const catalogRow = def.levelProgression.find((r) => Number(r.level) === Number(row.level));
    if (!catalogRow || !rowHasStructuredIdentity(catalogRow))
        return row;
    const enriched = { ...row };
    for (const field of IDENTITY_FIELDS) {
        const value = catalogRow[field];
        if (value === undefined)
            continue;
        switch (field) {
            case 'powerTemplateId':
                enriched.powerTemplateId = value;
                break;
            case 'artifactFunctionId':
                enriched.artifactFunctionId = value;
                break;
            case 'rank':
                enriched.rank = value;
                break;
            case 'limited':
                enriched.limited = value;
                break;
            case 'isSpell':
                enriched.isSpell = value;
                break;
            case 'castingAttribute':
                enriched.castingAttribute = value;
                break;
            case 'spellResolution':
                enriched.spellResolution = value;
                break;
            case 'chosenSpecialKey':
                enriched.chosenSpecialKey = value;
                break;
        }
    }
    return enriched;
}
/** Map every progression row through {@link enrichArtifactRowIdentity}. */
export function enrichArtifactLevelProgression(item, rows) {
    const list = Array.isArray(rows)
        ? rows
        : Array.isArray(item?.system?.levelProgression)
            ? item.system.levelProgression
            : [];
    return list.map((row) => enrichArtifactRowIdentity(item, row));
}
//# sourceMappingURL=artifact-row-identity.js.map