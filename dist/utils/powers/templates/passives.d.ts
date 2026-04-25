/**
 * Passive Power Templates (45 + 1 Special Aura)
 *
 * Source: d:\DestroyedFaith\Powers\Passives.md — Levels 1..16.
 *
 * Structure:
 *   - base (20): single-axis canonical passives
 *   - combined (12): two-axis combinations (non-conditional)
 *   - conditional-combined (12): same as combined but gated on a condition
 *   - special-aura (1): grants/applies a Special to nearby creatures
 *
 * Numeric scaling follows the ~1.25× Active Buff curve described in the md.
 * For non-numeric or narrative entries we emit effect.text plus a minimal
 * mechanics block; the aggregator gracefully falls back to descriptive
 * behaviour for rows that carry no mechanical deltas.
 */
import type { PowerTemplate } from './_shared.js';
export declare const PASSIVE_TEMPLATES: PowerTemplate[];
//# sourceMappingURL=passives.d.ts.map