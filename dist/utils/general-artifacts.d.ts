/**
 * General Artifact Catalog
 *
 * Bound (non-Echo) Artifacts from the Player's Guide "Artifact Examples"
 * chapter. Unlike Echo Artifacts these are not granted at character creation —
 * they are seeded as Artifact-Builder trees into the world library (folder
 * "General Artifacts") and handed out by the GM.
 *
 * Each definition reuses the `EchoArtifactDefinition` authoring shape with
 * `echoKey: ''`; the tree builder detects the empty echo key and emits
 * `binding: 'bound'` nodes without `echoBound` flags. The authored
 * `levelProgression` tables below are the source of truth (1:1 from the
 * rulebook) — they are NOT recompiled from progression picks.
 */
import type { EchoArtifactDefinition } from './echo-artifacts.js';
/**
 * General artifact authoring entry. Adds an optional paperdoll override for
 * "Main Hand or Off Hand" artifacts (one-handed items usable in either hand).
 */
export interface GeneralArtifactDefinition extends EchoArtifactDefinition {
    /** Override for `system.equipSlots` (e.g. ['mainhand', 'offhand']). */
    paperdollSlots?: string[];
}
export declare const GENERAL_ARTIFACTS: Record<string, GeneralArtifactDefinition>;
/** Lookup a General Artifact by key. */
export declare function getGeneralArtifact(key: string | null | undefined): GeneralArtifactDefinition | null;
//# sourceMappingURL=general-artifacts.d.ts.map