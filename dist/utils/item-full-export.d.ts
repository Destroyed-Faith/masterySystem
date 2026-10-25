/**
 * Read-only Full Item export for Foundry parent Items (especially Echo Artifacts).
 *
 * Produces:
 *  - exact JSON of the stored Item document (`toObject`)
 *  - human-readable Markdown that separates STORED data from REGISTRY/resolved data
 *
 * Never writes to the Item. Never migrates / resyncs / regenerates.
 */
import type { ArtifactLevelProgressionRow } from '../types/item.js';
export declare const ITEM_FULL_EXPORT_KIND: "mastery-item-full-export";
export declare const ITEM_FULL_EXPORT_SCHEMA_VERSION: 1;
/** Exact stored document snapshot (Foundry `toObject` when available). */
export declare function readStoredItemDocument(item: any): Record<string, unknown>;
/** Group stored levelProgression rows by level 1–10 for Markdown. */
export declare function groupProgressionByLevel(rows: ArtifactLevelProgressionRow[] | null | undefined): Map<number, ArtifactLevelProgressionRow[]>;
export interface ItemFullExportBundle {
    exportKind: typeof ITEM_FULL_EXPORT_KIND;
    schemaVersion: typeof ITEM_FULL_EXPORT_SCHEMA_VERSION;
    exportedAt: string;
    systemVersion: string | null;
    /** Exact stored Item document. */
    storedItem: Record<string, unknown>;
    /** Identity / location hints (not always inside toObject). */
    identity: {
        id: string | null;
        uuid: string | null;
        parentActorId: string | null;
        parentActorName: string | null;
        isEmbedded: boolean;
        echoArtifactKey: string | null;
        generalArtifactKey: string | null;
    };
    /**
     * Registry snapshot for comparison — clearly NOT stored on the Item.
     * Present only when an Echo / General definition key resolves.
     */
    registryReference: {
        source: 'echo' | 'general' | null;
        key: string | null;
        definition: Record<string, unknown> | null;
    };
    /** Human-readable Markdown. */
    markdown: string;
}
/** Build the full export bundle (pure aside from reading the Item). */
export declare function buildItemFullExportBundle(item: any, opts?: {
    exportedAt?: string;
    systemVersion?: string | null;
}): ItemFullExportBundle;
/** JSON document written to disk (includes registry for debugging). */
export declare function buildItemFullExportJsonDocument(bundle: ItemFullExportBundle): Record<string, unknown>;
export declare function exportItemFullJson(item: any, opts?: {
    pretty?: boolean;
}): string;
export declare function exportItemFullMarkdown(item: any): string;
/**
 * Download JSON + Markdown via Foundry `saveDataToFile` when available.
 * Read-only — never updates the Item.
 */
export declare function downloadItemFullExport(item: any): {
    jsonName: string;
    mdName: string;
};
//# sourceMappingURL=item-full-export.d.ts.map