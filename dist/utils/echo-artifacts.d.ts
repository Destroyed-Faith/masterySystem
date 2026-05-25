/**
 * Echo Artifact Catalog
 *
 * Per the Player's Guide (Echo Artifacts chapter), each Echo has zero or
 * more Echo-bound Artifacts that must be selected at character creation:
 *
 *   • Human:      0 required, 0 maximum.
 *   • Dwarf:      1 required, 1 maximum.   (Stonebound Soles — Feet)
 *   • Elf:        1 required, 1 maximum.   (Elven Stride — Feet, lineage sub-choice)
 *   • Sentinel:   1 required, 1 maximum.   (One frame per Order)
 *   • Titanborn:  1 required, 1 maximum.   (Titan Scars — Body)
 *   • Dragonborn: 1 required, 3 maximum.   (Wyrm Scales / Serpent Scales / Dragon Claws)
 *   • Unbound:    0 required, 0 maximum.
 *
 * Each entry below describes:
 *   • `key`           — stable id used by flags / picker lookups.
 *   • `name`          — display name.
 *   • `slot`          — canonical Equipment Slot.
 *   • `baseProfile`   — physical Base Profile per the new spec.
 *   • `baseValues`    — Base Value description (informational; UI shows them).
 *   • `binding`       — always `'echo'` for echo-bound artifacts.
 *   • `description`   — one-line flavor.
 *   • `requiresSubChoice` — when present, the player must have picked this
 *                            Echo sub-choice (e.g. Sentinel order, Elf lineage)
 *                            before this artifact is selectable.
 *   • `levelProgression` — the spec's 1..10 level table.
 *
 * The catalog is pure data; it is consumed by `character-sheet-echo-dialog.ts`
 * during creation, and by `artifact-actor-rules.ts` for echo-bound checks.
 */
import type { ArtifactBaseProfileKey, ArtifactSlotKey, ArtifactLevelProgressionRow } from '../types/item.js';
export interface EchoArtifactBaseValueHint {
    /** Label as it appears in the Player's Guide (Base Value A / B / C). */
    slot: 'a' | 'b' | 'c';
    label: string;
    /** Short narrative effect note. */
    note: string;
}
export interface EchoArtifactDefinition {
    key: string;
    name: string;
    echoKey: string;
    slot: ArtifactSlotKey;
    baseProfile: ArtifactBaseProfileKey;
    description: string;
    /**
     * Optional gate. If present, the player must have selected this
     * Echo sub-choice (e.g. Sentinel order or Dragonborn lineage) at
     * Echo creation for the artifact to be selectable.
     */
    requiresSubChoice?: string;
    baseValues: EchoArtifactBaseValueHint[];
    levelProgression: ArtifactLevelProgressionRow[];
    /** Free-text restriction note (e.g. "occupies both hand slots"). */
    restriction?: string;
}
export declare const ECHO_ARTIFACTS: Record<string, EchoArtifactDefinition>;
/** Per-Echo character-creation rules. */
export interface EchoArtifactRules {
    echoKey: string;
    /** Required count at character creation (>= 0). */
    requiredAtCreation: number;
    /** Maximum count at character creation (>= required). */
    maxAtCreation: number;
    /** Echo-Artifact keys offered to this Echo at character creation. */
    availableKeys: string[];
}
export declare const ECHO_ARTIFACT_RULES: Record<string, EchoArtifactRules>;
/** Lookup an Echo Artifact by key. */
export declare function getEchoArtifact(key: string | null | undefined): EchoArtifactDefinition | null;
/** Rules block for an Echo (returns Human default if unknown). */
export declare function getEchoArtifactRules(echoKey: string | null | undefined): EchoArtifactRules;
/**
 * Build the list of Echo Artifacts a character may pick at creation,
 * filtered by sub-choice gating. Used by the Echo creation dialog.
 */
export declare function listSelectableEchoArtifacts(echoKey: string, subChoiceKey?: string | null): EchoArtifactDefinition[];
/**
 * Build a partial `system` object for an artifact item from an Echo
 * Artifact definition — used when seeding the embedded artifact item
 * on character creation.
 */
export declare function buildArtifactSystemFromEchoDef(def: EchoArtifactDefinition): Record<string, unknown>;
//# sourceMappingURL=echo-artifacts.d.ts.map