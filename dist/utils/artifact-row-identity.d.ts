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
import type { ArtifactLevelProgressionRow } from '../types/item.js';
/** Identity fields that may be filled from the catalog for blank rows. */
declare const IDENTITY_FIELDS: readonly ["powerTemplateId", "artifactFunctionId", "rank", "limited", "isSpell", "castingAttribute", "spellResolution", "chosenSpecialKey"];
export type ArtifactRowIdentityField = (typeof IDENTITY_FIELDS)[number];
/** Minimal item shape needed to resolve catalog identity for a progression row. */
export interface ArtifactIdentityHost {
    flags?: {
        'mastery-system'?: {
            echoArtifactKey?: unknown;
        };
    };
    system?: {
        echoKey?: unknown;
        levelProgression?: ArtifactLevelProgressionRow[];
    } | null;
}
export declare function resolveEchoArtifactKey(item: ArtifactIdentityHost | null | undefined): string;
export declare function rowHasStructuredIdentity(row: Pick<ArtifactLevelProgressionRow, 'powerTemplateId' | 'artifactFunctionId'> | null | undefined): boolean;
/**
 * If the row already has structured identity, return it unchanged.
 * If not, and a catalog row exists for (echoArtifactKey, level), return a shallow
 * copy of `row` with identity fields taken wholly from that catalog row.
 */
export declare function enrichArtifactRowIdentity(item: ArtifactIdentityHost | null | undefined, row: ArtifactLevelProgressionRow): ArtifactLevelProgressionRow;
/** Map every progression row through {@link enrichArtifactRowIdentity}. */
export declare function enrichArtifactLevelProgression(item: ArtifactIdentityHost | null | undefined, rows?: ArtifactLevelProgressionRow[] | null): ArtifactLevelProgressionRow[];
export {};
//# sourceMappingURL=artifact-row-identity.d.ts.map