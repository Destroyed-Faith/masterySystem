/**
 * Artifact → Radial Menu options
 *
 * Surfaces unlocked artifact actives, movement powers, active buffs and
 * Stone Power Supports from every equipped artifact (`system.binding`
 * is `bound` or `echo`) up to the artifact's `currentLevel`.
 *
 * Two data sources are merged:
 *   1. `system.powers` — legacy `EmbeddedPowerData` entries (the
 *      structured power-mechanics editor). Filtered by tree-depth /
 *      level when available.
 *   2. `system.levelProgression` — the new spec's per-level Active /
 *      Active Buff / Movement / Support / Stone Power Support rows.
 *      Filtered by `level <= currentLevel`.
 *
 * The function returns lightweight `RadialCombatOption` entries that
 * carry enough metadata for the radial-menu pipeline to render them
 * even though there is no backing `Item` document. The `item` field
 * points to the artifact item, with a synthetic `system.artifactPowerKey`
 * attached so downstream consumers can identify the row.
 */
import type { RadialCombatOption } from './types.js';
/**
 * Build radial-menu options derived from every equipped artifact on `actor`.
 * Returns `[]` when the actor has no artifacts or none are equipped.
 */
export declare function buildArtifactRadialOptions(actor: any): RadialCombatOption[];
/**
 * Build the list of unlocked artifact Reaction rows on `actor`.
 * Returned shape mirrors `RadialCombatOption` with `slot: 'reaction'`
 * so the defender-reactions pipeline can consume it directly.
 */
export declare function buildArtifactReactionOptions(actor: any): RadialCombatOption[];
//# sourceMappingURL=artifact-options.d.ts.map