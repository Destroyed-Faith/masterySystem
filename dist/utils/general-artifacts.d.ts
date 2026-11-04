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
 * `binding: 'bound'` nodes without `echoBound` flags. L1–9 come from
 * `progressionPickSpecs` (official catalog templates); L10 is authored as
 * universal Artifact Awakening via `artifactAwakeningRow`.
 */
import { type EchoArtifactDefinition } from './echo-artifacts.js';
/**
 * General artifact authoring entry. Adds an optional paperdoll override for
 * "Main Hand or Off Hand" artifacts (one-handed items usable in either hand).
 */
export interface GeneralArtifactDefinition extends EchoArtifactDefinition {
    /** Override for `system.equipSlots` (e.g. ['mainhand', 'offhand']). */
    paperdollSlots?: string[];
    /**
     * Batch 9G.4 — SOURCE MISSING hold: skip *fresh* world-library seed creates only.
     * Existing world trees and actor items stay resolvable; remove this flag to reopen.
     * Does **not** rewrite, revoke, or hide owned Actor Items.
     */
    newGrantHold?: boolean;
}
/** True when a General Artifact is on the temporary SOURCE MISSING new-grant hold. */
export declare function isArtifactNewGrantHeld(key: string | null | undefined): boolean;
/**
 * Whether seed/refresh may create a brand-new world tree for this catalog key.
 * Existing world items (count > 0) are never blocked — only empty-world creates.
 */
export declare function shouldCreateNewWorldArtifactTree(key: string | null | undefined, existingWorldItemCount: number): boolean;
export declare const GENERAL_ARTIFACTS: Record<string, GeneralArtifactDefinition>;
/** Lookup a General Artifact by key. */
export declare function getGeneralArtifact(key: string | null | undefined): GeneralArtifactDefinition | null;
//# sourceMappingURL=general-artifacts.d.ts.map