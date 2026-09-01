/**
 * Homepage → Foundry character import schema (v1).
 *
 * See `docs/character-import-schema.md` for the full specification and examples.
 */
import type { TowerWizardSelection } from '../creation/tower-wizard/tower-wizard-types.js';
import type { PowerGrantSpec } from '../utils/power-item-builder.js';
export declare const CHARACTER_IMPORT_SCHEMA_VERSION: 1;
export declare const CHARACTER_IMPORT_EXPORT_KIND: "mastery-character-import";
export declare const FOUNDRY_ACTOR_IMPORT_EXPORT_KIND: "mastery-foundry-actor";
export declare const CHARACTER_IMPORT_SYSTEM_ID: "mastery-system";
export declare const CHARACTER_IMPORT_ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export type CharacterImportAttributeKey = (typeof CHARACTER_IMPORT_ATTRIBUTE_KEYS)[number];
export interface CharacterImportBio {
    concept?: string;
    appearance?: string;
    notes?: string;
}
export interface CharacterImportEcho {
    key: string;
    subChoiceKey?: string;
    veiledFormKey?: string;
    selectedCardIds?: string[];
    /** Unbound Beast: free-text predator shape (e.g. `Wolf`). */
    unboundShape?: string;
    /** Unbound Beast: predator stone path key — resolves the Echo Artifact. */
    predatorStone?: string;
    /**
     * Echo Artifact catalog keys chosen at creation (e.g. `stoneboundSoles`).
     * These are granted echo-bound and auto-equipped, exactly like the in-game
     * Echo dialog. Unbound characters may omit this — the artifact is resolved
     * from `subChoiceKey` / `predatorStone`.
     */
    artifactKeys?: string[];
}
export interface CharacterImportArtifact {
    /** Catalog key, e.g. `moonlightGreatsword`, `dragonClaws`. */
    key: string;
    /** Artifact tree level 1–10 (default 1). */
    level?: number;
    /** Defaults to active. Set false to import an explicitly inactive artifact. */
    activated?: boolean;
    /** Legacy field — activation no longer reserves a Stone. */
    activationStoneAttribute?: string;
    /** Paperdoll equip after import (default true for weapons/armor). */
    equipped?: boolean;
}
export interface CharacterImportGearItem {
    name: string;
    quantity?: number;
    inventorySize?: string;
    description?: string;
}
export interface CharacterImportEquipment {
    gear?: CharacterImportGearItem[];
}
/**
 * Compact homepage payload — powers are resolved from `combatPackage` or an
 * explicit `powers` grant list at import time.
 */
export interface CharacterImportDisadvantage {
    /** Catalog id, e.g. `addiction`, `hunted`. */
    id: string;
    /** Player-specific fields (substance, hunter, severity, …). */
    details?: Record<string, unknown>;
    /** Override points; otherwise calculated from `details`. */
    points?: number;
}
export interface CharacterImportPayload {
    name: string;
    img?: string;
    folder?: string | null;
    bio?: CharacterImportBio;
    echo?: CharacterImportEcho;
    /** Plain attribute totals (not `{ value, stones }` objects). */
    attributes: Partial<Record<CharacterImportAttributeKey, number>>;
    masteryRank?: number;
    skills?: Record<string, number>;
    skillsSpent?: Record<string, number>;
    /** Catalog ids or full disadvantage entries (see schema doc). */
    disadvantages?: Array<string | CharacterImportDisadvantage>;
    /** Minor Expression catalog ids, e.g. `might-hold-fast`. Max = masteryRank. */
    minorExpressions?: string[];
    languages?: {
        known?: string[];
    };
    /** Tower Wizard selection (preferred for homepage builds). */
    combatPackage?: TowerWizardSelection;
    /** Explicit six power grants — alternative to `combatPackage`. */
    powers?: PowerGrantSpec[];
    artifacts?: CharacterImportArtifact[];
    equipment?: CharacterImportEquipment;
    /** When false, actor stays in creation mode (`system.creation.complete`). */
    creationComplete?: boolean;
    /** Advanced: merge extra fields onto `actor.system` after defaults. */
    systemOverrides?: Record<string, unknown>;
}
export interface MasteryCharacterImportDocument {
    schemaVersion: typeof CHARACTER_IMPORT_SCHEMA_VERSION;
    exportKind: typeof CHARACTER_IMPORT_EXPORT_KIND;
    systemId: typeof CHARACTER_IMPORT_SYSTEM_ID;
    systemVersion?: string;
    exportedAt?: string;
    character: CharacterImportPayload;
}
export interface MasteryFoundryActorImportDocument {
    schemaVersion: typeof CHARACTER_IMPORT_SCHEMA_VERSION;
    exportKind: typeof FOUNDRY_ACTOR_IMPORT_EXPORT_KIND;
    systemId: typeof CHARACTER_IMPORT_SYSTEM_ID;
    systemVersion?: string;
    exportedAt?: string;
    actor: {
        name: string;
        type?: 'character';
        img?: string;
        folder?: string | null;
        system?: Record<string, unknown>;
        items?: Array<Record<string, unknown>>;
        flags?: Record<string, unknown>;
    };
}
export type CharacterImportDocument = MasteryCharacterImportDocument | MasteryFoundryActorImportDocument;
export interface CharacterImportValidationResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
    kind?: typeof CHARACTER_IMPORT_EXPORT_KIND | typeof FOUNDRY_ACTOR_IMPORT_EXPORT_KIND;
}
export interface CharacterImportResult {
    ok: boolean;
    actor?: Actor;
    errors?: string[];
    warnings?: string[];
}
//# sourceMappingURL=character-import-types.d.ts.map