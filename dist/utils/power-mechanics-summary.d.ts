/**
 * Power-mechanics summarizer — turns a `PowerMechanics` block into a short
 * human-readable string for UI tooltips (e.g. Combat Carousel status icons).
 *
 * The output is deliberately compact: 1–2 concatenated segments joined by
 * " \u00b7 " (` · `). Zero / empty fields are skipped. When nothing
 * meaningful is present the function returns `''` so callers can fall back
 * to just the power name.
 *
 * Example outputs:
 *   "+4 Armor \u00b7 +20% DR"
 *   "+2d8 Attack vs Hexed"
 *   "Regen 10 HP/turn \u00b7 +1 Movement"
 *   "Temp HP 1d8 \u00b7 Heal 2d8"
 */
import type { PowerMechanics } from '../types/item.js';
/**
 * Produce a compact summary string for a mechanics block. Returns `''` if
 * the block has no summarizable fields (so callers can skip the extra
 * tooltip line).
 */
export declare function summarizePowerMechanics(mech: PowerMechanics | null | undefined): string;
//# sourceMappingURL=power-mechanics-summary.d.ts.map