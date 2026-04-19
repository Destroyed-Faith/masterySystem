/**
 * Mastery System status effects registry.
 *
 * Registers the system's canonical conditions / specials as `CONFIG.statusEffects`,
 * replacing Foundry's core defaults (which include unrelated entries like
 * Ice/Fire/Magic/Holy Shield or Diseased that we do not model).
 *
 * Keys follow the lowercase canonical form established by `power-spec-normalize`
 * and the tree-power audit. Source of truth for the effect catalog is
 * `src/utils/special-effects.ts`; this file only adds UI registration metadata
 * (label, icon, statuses) for the Foundry token HUD radial.
 *
 * Synonym notes (for future normalization passes, not handled here):
 *   - `poison` / `poisoned`          -> canonical `poisoned`
 *   - `bleed` / `bleeding`           -> canonical `bleeding`
 *   - `entangle` / `entangled`       -> canonical `entangled`
 *   - `disorient` / `disoriented`    -> canonical `disoriented`
 * Data in `src/stones/stone-powers.ts` that still uses the short forms is
 * intentionally left unchanged here.
 */
/**
 * Shape aligned with Foundry v12/v13 `CONFIG.statusEffects` entries.
 * `statuses` drives the active-effect status id used by core systems.
 */
export interface MasteryStatusEffect {
    id: string;
    name: string;
    img: string;
    statuses?: string[];
}
/**
 * Single source of truth for the token HUD radial.
 * Keep ordered by gameplay category (debuffs first, then damage-over-time,
 * then buffs, then rider-style effects) for a predictable radial layout.
 */
export declare const MASTERY_STATUS_EFFECTS: MasteryStatusEffect[];
/**
 * Build the array passed to `CONFIG.statusEffects`. Ensures every entry has a
 * matching `statuses` array so Foundry's `statuses` set lookups work both ways.
 */
export declare function buildMasteryStatusEffects(): Required<MasteryStatusEffect>[];
//# sourceMappingURL=status-effects.d.ts.map