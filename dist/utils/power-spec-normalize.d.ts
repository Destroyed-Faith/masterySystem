/**
 * Power spec consistency — canonical shapes after import / before persist.
 *
 * Power-spec normalization rules:
 * - PowerSpecial: canonical persisted form uses lowercase `key` + `rank` (not type/value).
 * - AoE: do not persist both radiusM and sizeM for radius-class shapes.
 * - PowerMechanics: usageLimit canonical; triggerLimit read once then stripped on persist.
 * - condition vs conditionExpr: if enum `condition` is set, clear redundant `conditionExpr`.
 */
import type { AoeSpec, PowerMechanics, PowerSpecial } from '../types/item.js';
/**
 * Normalize one special entry to canonical `{ key, rank?, ... }` (lowercase key; no type/value).
 */
export declare function normalizePowerSpecial(raw: unknown): PowerSpecial | null;
/** Normalize an array of specials (drops nulls). */
export declare function normalizePowerSpecialArray(raw: unknown): PowerSpecial[];
/**
 * Collapse sizeM into radiusM for radius-like shapes; never persist both.
 */
export declare function normalizeAoeSpec(raw: unknown): AoeSpec | null;
/**
 * Prepare a mechanics object for persistence: limits, gates, nested specials.
 * Returns a deep-cloned, normalized copy (safe for JSON.parse results).
 */
export declare function persistPowerMechanics(input: PowerMechanics): PowerMechanics;
//# sourceMappingURL=power-spec-normalize.d.ts.map