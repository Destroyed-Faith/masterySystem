/**
 * Minimal character JSON exporter (round-trips through the importer).
 *
 * Emits a `mastery-foundry-actor` document (`actor.system` + items + flags) so
 * `importMasteryCharacter` can recreate the character, including the DF 2026
 * `system.specializations` and `system.echoImprints`. Legacy `skills` /
 * `minorExpressions` stay in `system` as archive fields only.
 */
import { type MasteryFoundryActorImportDocument } from './character-import-types.js';
/** Build the export document (pure — safe for tests). */
export declare function buildMasteryCharacterExport(actor: any, opts?: {
    systemVersion?: string;
    exportedAt?: string;
}): MasteryFoundryActorImportDocument;
/** JSON string for `actor`, ready to save and re-import. */
export declare function exportMasteryCharacterJson(actor: any, opts?: {
    pretty?: boolean;
}): string;
/** Browser download of the export (Foundry helper when available). */
export declare function downloadMasteryCharacterJson(actor: any): void;
//# sourceMappingURL=character-export.d.ts.map