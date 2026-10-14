/**
 * Visual presentation for live Invisibility:
 * - status entry on the actor (sheet + carousel coins)
 * - token status-bar ActiveEffect icon
 * - reduced token opacity while Invisible (not when Downed)
 */
export declare const INVISIBLE_STATUS_ID = "invisible";
export declare const INVISIBLE_STATUS_NAME = "Invisible";
export declare const INVISIBLE_IMG = "systems/mastery-system/assets/icons/status/invisible.svg";
/** Soft ghosting so allies/enemies still see the footprint. */
export declare const INVIS_TOKEN_ALPHA = 0.5;
export declare const PRE_INVIS_ALPHA_FLAG = "preInvisAlpha";
export declare const INVIS_ALPHA_ACTIVE_FLAG = "invisAlphaActive";
/**
 * Keep sheet status, token icon, and opacity in sync with live Invisibility bonus.
 * Call after power sync / health changes that may suppress Invisibility.
 */
export declare function syncInvisibilityPresentation(actor: any): Promise<void>;
//# sourceMappingURL=invisibility-presentation.d.ts.map