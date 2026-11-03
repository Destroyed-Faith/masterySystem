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
 *   - `poison` / `poisoned` / `blight` -> canonical `blight`
 *   - `bleed` / `bleeding` / `lacerate` -> canonical `lacerate`
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
    /**
     * When false, Foundry's Token HUD palette hides this entry.
     * Combat / Powers may still resolve the id. Default true.
     */
    hud?: boolean;
}
/**
 * Ongoing Specials a GM may newly pick in the Status dialog / Token HUD.
 * Authoritative list matches DF Core Special Effects Reference (persistent).
 */
export declare const SELECTABLE_STATUS_IDS: readonly string[];
/**
 * System-managed statuses that stay writable and keep token icons, but are not
 * offered as generic "add Special" choices (instant / derived / Passive / Crit).
 */
export declare const SYSTEM_MANAGED_STATUS_IDS: readonly string[];
export declare function isSelectableStatusId(id: string | null | undefined): boolean;
/** Writable via setActorCatalogStatus / token icon sync (selectable + system-managed). */
export declare function isSystemStatusId(id: string | null | undefined): boolean;
/**
 * Token HUD / CONFIG registry.
 * Selectable Specials appear in the palette. System-managed and Invisible stay
 * registered for icons with `hud: false`. Retired names (Charmed, Cursed, …)
 * are intentionally omitted so they cannot be newly selected; stored Actor
 * records with those ids are left untouched.
 */
export declare const MASTERY_STATUS_EFFECTS: MasteryStatusEffect[];
/**
 * Build the array passed to `CONFIG.statusEffects`. Ensures every entry has a
 * matching `statuses` array so Foundry's `statuses` set lookups work both ways.
 */
export declare function buildMasteryStatusEffects(): Required<MasteryStatusEffect>[];
/**
 * Mastery Invisibility is soft ghosting (token alpha) + perception gates.
 * Foundry's special INVISIBLE status hides the token from other clients and
 * makes allies unable to target for Heal etc. — never wire that up.
 */
export declare function disableFoundryInvisibleTokenHide(): void;
/**
 * Register mastery conditions on `CONFIG.statusEffects`.
 * Foundry v12/v13 use an array; v14+ uses a record keyed by effect id.
 */
export declare function applyMasteryStatusEffects(): void;
//# sourceMappingURL=status-effects.d.ts.map