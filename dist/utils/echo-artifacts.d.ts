/**
 * Echo Artifact Catalog
 *
 * Per the Player's Guide (Echo Artifacts chapter), each Echo has zero or
 * more Echo-bound Artifacts that must be selected at character creation:
 *
 *   • Human:      0 required, 0 maximum.
 *   • Dwarf:      1 required, 1 maximum.   (Stonebound Soles — Feet)
 *   • Elorian:    1 required, 1 maximum.   (Elorian Stride — Feet)
 *   • Sentinel:   1 required, 1 maximum.   (One frame per Order)
 *   • Titanborn:  1 required, 1 maximum.   (Titan Scars — Body)
 *   • Dragonborn: 1 required, 3 maximum.   (Dragon Claws, Dragon Head, and one
 *                  of Wyrm Scales / Serpent Scales — the two body armors are
 *                  mutually exclusive.)
 *   • Unbound:    1 required, 1 maximum.   (one identity artifact)
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
import type { ArtifactBaseProfileKey, ArtifactSlotKey, ArtifactLevelProgressionRow, ArtifactStoneFunctionKind, PowerLevelKey } from '../types/item.js';
import { type MartialDelivery } from './artifact-power-pick.js';
/**
 * Authoring shorthand for an Echo Artifact's single canonical Stone Function.
 * The generator copies this onto `system.stoneFunction` (so the actor-side
 * aggregator applies it) and emits a matching `progressionPicks` entry at
 * `level` (so the Node Editor's editable picks reflect it). Any of the 7
 * Attributes may be authored — the old per-slot attribute restriction
 * (`ATTRIBUTE_ACCESS_BY_SLOT`) was dropped; every slot accepts every Attribute.
 */
export interface EchoArtifactStoneFunctionHint {
    kind: ArtifactStoneFunctionKind;
    /** Attribute pool (any of the 7 Attributes). */
    attribute: string;
    /** For Stone Power Support: the supported Stone Power id. */
    stonePowerId?: string;
    /** Basic level (1-3) that introduces the Stone Function. */
    level: 1 | 2 | 3;
    /** Optional flavor/display name for the generated rows (e.g. "Draconic Recovery"). */
    name?: string;
}
/**
 * Rich Level Progression pick authoring for an Echo Artifact. Lets a definition
 * map a Basic level (1-3) onto a real, editable catalog Power — either a
 * martial damage pick (delivery + Special, tier derived from the Special) or a
 * non-martial catalog template (e.g. `ab-armor-aura`) — with an optional flavor
 * name (e.g. "Breath Weapon"). The underlying mechanics stay editable in the
 * Node Editor; only the displayed name is overridden.
 */
export interface EchoArtifactProgressionPickSpec {
    /** Flavor/display name for the generated rows (e.g. "Breath Weapon"). */
    name?: string;
    /** Non-martial catalog power template id (e.g. 'ab-armor-aura'). */
    templateId?: string;
    /** Martial damage delivery form (mutually exclusive with `templateId`). */
    delivery?: 'melee-single' | 'melee-aoe' | 'ranged-single' | 'ranged-aoe';
    /** Martial damage Special key — the damage tier is derived from it. */
    special?: string;
    /**
     * Stone Function for this slot (alternative to a catalog Power). Lets a
     * single artifact carry up to three independent Stone Functions — one per
     * Basic level — instead of the single `def.stoneFunction` shortcut. Used by
     * the Sentinel body frames, whose Stone Pool / Battery / Support lines live
     * on different slots. The actor-side aggregator reads every Stone Function
     * pick, so all of them apply mechanically.
     */
    stoneFunction?: {
        kind: ArtifactStoneFunctionKind;
        attribute: string;
        stonePowerId?: string;
    };
    /** Override staged catalog PL rows (default 4 / 10 / 16). */
    stagePowerLevels?: PowerLevelKey[];
    /** Override stage name suffixes (default I / II / III). */
    stageNumerals?: string[];
    /**
     * Per-stage catalog template ids (length 3). Each stage uses the matching
     * template at PL 4 / 10 / 16 instead of staging one `templateId` three times.
     */
    stageTemplateIds?: [string, string, string];
    /** Full row names per stage when `stageTemplateIds` is set (length 3). */
    stageNames?: [string, string, string];
}
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
    /**
     * Optional canonical Stone Function (see `EchoArtifactStoneFunctionHint`).
     * Any Attribute is legal on any slot; some frames still omit this and keep
     * their stone supports purely as Level Progression abilities.
     */
    stoneFunction?: EchoArtifactStoneFunctionHint;
    /**
     * Catalog Power picks per Basic level (1-3). Each value is a catalog
     * `templateId` (see `ALL_POWER_TEMPLATES`). These are the picks-drive source:
     * the 1-10 Level Progression table is generated from them. A level claimed by
     * `stoneFunction` is filled by the Stone Function pick instead and should be
     * omitted here. Best-effort mappings of the rulebook lines to catalog Powers;
     * a GM can refine them in the Artifact Builder node editor.
     */
    progressionPickIds?: Partial<Record<1 | 2 | 3, string>>;
    /**
     * Rich per-level pick specs (martial delivery+Special or a non-martial
     * catalog template) with optional flavor names. Takes precedence over
     * `progressionPickIds` for any level it covers. Lets named artifact lines
     * (e.g. Dragon Head's Breath Weapon / Draconic Roar) be real, editable
     * catalog Powers instead of fixed text.
     */
    progressionPickSpecs?: Partial<Record<1 | 2 | 3, EchoArtifactProgressionPickSpec>>;
    /**
     * Optional natural/innate weapon for a non-weapon-slot artifact (e.g. Dragon
     * Head's Bite). When set, the tree builder attaches a scaling `artifactWeapon`
     * profile (damage pulled from the `weaponDamage` Base Value table) even though
     * the artifact's `artifactKind` is `gear`/`armor`, so the Bite is a usable
     * attack rather than a purely informational Base Value.
     */
    naturalWeapon?: {
        /** Attack label shown in the radial menu (e.g. "Bite"). Defaults to the item name. */
        name?: string;
        weaponType?: 'melee' | 'ranged';
        /** Hand slots occupied (a Bite occupies none → 0). */
        hands?: number;
        rangeM?: number;
        specials?: string[];
    };
    /**
     * When multiple Echo Artifact defs share the same `variantGroupKey`, the Echo
     * creation dialog renders a comparison table (see `variantRow`).
     */
    variantGroupKey?: string;
    /** One row in the Echo creation variant comparison table. */
    variantRow?: {
        armorClass: string;
        focus: string;
        flightL1: string;
        activeBuffL2: string;
        stonePowerL3: string;
    };
}
export declare const WYRM_SCALES_VARIANT_GROUP = "wyrmScales";
/** Legacy compendium / character keys → current variant keys. */
export declare const ECHO_ARTIFACT_KEY_ALIASES: Record<string, string>;
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
    /**
     * Mutually-exclusive groups: the player may select AT MOST ONE key from each
     * listed group. Used e.g. for Dragonborn body armor where Wyrm Scales and
     * Serpent Scales are an OR choice (both occupy the Body slot).
     */
    exclusiveGroups?: string[][];
}
export declare const ECHO_ARTIFACT_RULES: Record<string, EchoArtifactRules>;
/** Lookup an Echo Artifact by key (legacy aliases resolve to current variant keys). */
export declare function getEchoArtifact(key: string | null | undefined): EchoArtifactDefinition | null;
/** Echo Artifact defs that share a variant comparison group, in display order. */
export declare function listEchoArtifactsInVariantGroup(groupKey: string): EchoArtifactDefinition[];
/** Rules block for an Echo (returns Human default if unknown). */
export declare function getEchoArtifactRules(echoKey: string | null | undefined): EchoArtifactRules;
/**
 * Build the list of Echo Artifacts a character may pick at creation,
 * filtered by sub-choice gating. Used by the Echo creation dialog.
 */
export declare function listSelectableEchoArtifacts(echoKey: string, subChoiceKey?: string | null): EchoArtifactDefinition[];
/**
 * Validate a set of selected Echo Artifact keys against an Echo's rules
 * (count + mutually-exclusive groups). Returns an error string, or null if OK.
 */
export declare function validateEchoArtifactSelection(echoKey: string, selectedKeys: string[]): string | null;
/**
 * Build a partial `system` object for an artifact item from an Echo
 * Artifact definition — used when seeding the embedded artifact item
 * on character creation.
 */
export declare function buildEchoStoneFunction(def: EchoArtifactDefinition): {
    kind: ArtifactStoneFunctionKind;
    attribute: string;
    stonePowerId?: string;
} | null;
/**
 * Build the up-to-three Level Progression picks from an Echo definition.
 * Each Basic level (1-3) becomes a catalog Power pick (from `progressionPickIds`)
 * or, when claimed by `stoneFunction`, the Stone Function pick. The 1-10 table is
 * generated from these picks by `deriveLevelProgressionFromPicks`.
 */
export declare function buildEchoProgressionPicks(def: EchoArtifactDefinition): {
    level: 1 | 2 | 3;
    kind: 'none' | 'power' | 'stoneFunction' | 'authored';
    powerTemplateId?: string;
    stoneFunction?: unknown;
    authoredStages?: unknown[];
    delivery?: MartialDelivery;
    chosenSpecial?: {
        key: string;
        tier: 3 | 4 | 5 | 6;
    };
    displayName?: string;
    stagePowerLevels?: PowerLevelKey[];
    stageNumerals?: string[];
    stageTemplateIds?: [string, string, string];
    stageNames?: [string, string, string];
}[];
export declare function buildArtifactSystemFromEchoDef(def: EchoArtifactDefinition): Record<string, unknown>;
//# sourceMappingURL=echo-artifacts.d.ts.map