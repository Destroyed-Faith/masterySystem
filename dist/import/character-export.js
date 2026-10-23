/**
 * Minimal character JSON exporter (round-trips through the importer).
 *
 * Emits a `mastery-foundry-actor` document (`actor.system` + items + flags) so
 * `importMasteryCharacter` can recreate the character, including the DF 2026
 * `system.specializations` and `system.echoImprints`. Legacy `skills` /
 * `minorExpressions` stay in `system` as archive fields only.
 */
import { CHARACTER_IMPORT_SCHEMA_VERSION, CHARACTER_IMPORT_SYSTEM_ID, FOUNDRY_ACTOR_IMPORT_EXPORT_KIND, } from './character-import-types.js';
import { readSpecializations } from '../rules/specialization-roll.js';
import { findEchoImprint } from '../rules/echo-imprints.js';
function plain(value) {
    return JSON.parse(JSON.stringify(value ?? null));
}
function sourceData(actor) {
    if (typeof actor?.toObject === 'function')
        return actor.toObject();
    return {
        name: actor?.name,
        type: actor?.type,
        img: actor?.img,
        system: actor?.system,
        items: Array.isArray(actor?.items)
            ? actor.items
            : actor?.items
                ? Array.from(actor.items.values?.() ?? actor.items).map((i) => i?.toObject?.() ?? i)
                : [],
        flags: actor?.flags,
    };
}
/** Build the export document (pure — safe for tests). */
export function buildMasteryCharacterExport(actor, opts = {}) {
    const data = sourceData(actor);
    const system = plain(data.system ?? actor?.system ?? {});
    // DF 2026 fields are always present and normalized, even for sparse actors.
    system.specializations = readSpecializations(system);
    system.echoImprints = Array.isArray(system.echoImprints)
        ? [...new Set(system.echoImprints.map((v) => String(v ?? '').trim()))].filter((id) => !!id && !!findEchoImprint(id))
        : [];
    const items = Array.isArray(data.items) ? data.items : [];
    return {
        schemaVersion: CHARACTER_IMPORT_SCHEMA_VERSION,
        exportKind: FOUNDRY_ACTOR_IMPORT_EXPORT_KIND,
        systemId: CHARACTER_IMPORT_SYSTEM_ID,
        ...(opts.systemVersion ? { systemVersion: opts.systemVersion } : {}),
        exportedAt: opts.exportedAt ?? new Date().toISOString(),
        actor: {
            name: String(data.name ?? actor?.name ?? ''),
            type: 'character',
            img: String(data.img ?? actor?.img ?? ''),
            folder: null,
            system,
            items: plain(items),
            flags: plain(data.flags ?? {}),
        },
    };
}
/** JSON string for `actor`, ready to save and re-import. */
export function exportMasteryCharacterJson(actor, opts = {}) {
    const systemVersion = String(globalThis.game?.system?.version ?? '') || undefined;
    const doc = buildMasteryCharacterExport(actor, { systemVersion });
    return JSON.stringify(doc, null, opts.pretty === false ? 0 : 2);
}
/** Browser download of the export (Foundry helper when available). */
export function downloadMasteryCharacterJson(actor) {
    const json = exportMasteryCharacterJson(actor);
    const safeName = String(actor?.name ?? 'character').replace(/[^\w.-]+/g, '_') || 'character';
    const filename = `${safeName}.mastery-character.json`;
    const save = globalThis.foundry?.utils?.saveDataToFile;
    if (typeof save === 'function') {
        save(json, 'application/json', filename);
        return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
//# sourceMappingURL=character-export.js.map