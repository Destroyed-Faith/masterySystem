/**
 * Pure helpers to turn a homepage import payload into Foundry actor/item data.
 * No Foundry globals — safe for unit tests.
 */
import { type PowerGrantSpec } from '../utils/power-item-builder.js';
import { type SpecializationRecord } from '../rules/index.js';
import type { CharacterImportArtifact, CharacterImportAttributeKey, CharacterImportDisadvantage, CharacterImportGearItem, CharacterImportPayload, CharacterImportSpecialization } from './character-import-types.js';
export declare function normalizeImportAttributes(raw: Partial<Record<CharacterImportAttributeKey, number>> | undefined): Record<CharacterImportAttributeKey, number>;
/** Starting Attribute Stones at Lifetime XP 0 (Creation package). */
export declare const IMPORT_STARTING_ATTRIBUTE_STONES: number;
/**
 * Normalize `character.stones` into a full attribute map (missing keys → 0).
 * Negative / non-finite values clamp to 0.
 */
export declare function normalizeImportStoneAssignments(raw: Partial<Record<CharacterImportAttributeKey, number>> | undefined): Record<CharacterImportAttributeKey, number>;
export declare function sumImportStoneAssignments(stones: Record<CharacterImportAttributeKey, number>): number;
export declare function normalizeImportPermanentColorless(raw: unknown): number;
export declare function isKnownArtifactImportKey(key: string): boolean;
/**
 * Echo Artifact keys to grant echo-bound (same resolution as the Echo dialog):
 * Unbound resolves from identity + predator stone; everyone else uses the
 * explicit `echo.artifactKeys` list.
 */
export declare function resolveEchoArtifactImportKeys(payload: CharacterImportPayload): string[];
export declare function resolvePowerGrantSpecs(payload: CharacterImportPayload): PowerGrantSpec[] | null;
export declare function buildPowerItemsFromGrantSpecs(specs: PowerGrantSpec[]): Record<string, unknown>[];
export declare function buildGearItemData(gear: CharacterImportGearItem): Record<string, unknown>;
export declare function isKnownSkillKey(key: string): boolean;
export declare function isKnownMinorExpressionId(id: string): boolean;
/** Turn homepage disadvantage shorthand into actor `system.disadvantages` rows. */
export declare function normalizeDisadvantageEntries(raw: Array<string | CharacterImportDisadvantage> | undefined): Record<string, unknown>[];
export declare function disadvantagePointsTotal(disadvantages: Record<string, unknown>[]): number;
export declare function normalizeSkillRanks(raw: Record<string, number> | undefined): Record<string, number>;
export declare function normalizeMinorExpressionIds(raw: string[] | undefined, masteryRank: number): string[];
/** Normalize import Specializations (identity id, valid Field, clamped Rank, de-duplicated). */
export declare function normalizeImportSpecializations(raw: CharacterImportSpecialization[] | undefined): SpecializationRecord[];
/** Known, de-duplicated Echo Imprint ids capped at Mastery Rank. */
export declare function normalizeImportEchoImprintIds(raw: string[] | undefined, masteryRank: number): string[];
export declare function buildActorSystemFromPayload(payload: CharacterImportPayload): Record<string, unknown>;
export declare function buildActorCreateDataFromPayload(payload: CharacterImportPayload): Record<string, unknown>;
export declare function validateArtifactImportSpec(spec: CharacterImportArtifact): string | null;
export declare function expectedPowerCount(): number;
//# sourceMappingURL=character-import-build.d.ts.map