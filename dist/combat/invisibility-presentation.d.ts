/**
 * Visual presentation for live Invisibility:
 * - status entry on the actor (sheet + carousel coins)
 * - token status-bar ActiveEffect icon
 * - reduced token opacity while Invisible (not when Downed)
 *
 * Tokens stay on the canvas for everyone (ghosted). Foundry's special
 * INVISIBLE hide is disabled in `applyMasteryStatusEffects` so allies can
 * still target for Heal etc. Combat targeting of Obscured foes uses
 * perception gates, not token visibility.
 */
export declare const INVISIBLE_STATUS_ID = "invisible";
export declare const INVISIBLE_STATUS_NAME = "Invisible";
export declare const INVISIBLE_IMG = "systems/mastery-system/assets/icons/status/invisible.svg";
/** Soft ghosting so allies/enemies still see the footprint. */
export declare const INVIS_TOKEN_ALPHA = 0.5;
export declare const PRE_INVIS_ALPHA_FLAG = "preInvisAlpha";
export declare const INVIS_ALPHA_ACTIVE_FLAG = "invisAlphaActive";
/** `false` hides the token icon and the ghost opacity. Mechanics stay. Missing means on. */
export declare const INVIS_TOKEN_EFFECT_FLAG = "invisibilityTokenEffect";
/** Sheet status id used for the Invisible presentation row. */
export declare function isInvisibleStatusId(id: string | null | undefined): boolean;
/** Token icon + opacity. Default on. An explicit false turns the token effect off. */
export declare function invisibilityTokenEffectEnabled(actor: any): boolean;
export declare function invisibilityTokenVisualWanted(bonus: number, effectEnabled: boolean): boolean;
/**
 * Keep sheet status, token icon, and opacity in sync with live Invisibility bonus.
 * Call after power sync / health changes that may suppress Invisibility.
 */
export declare function syncInvisibilityPresentation(actor: any): Promise<void>;
/** Persist the token-effect switch and apply or clear the icon and opacity. */
export declare function setInvisibilityTokenEffect(actor: any, enabled: boolean): Promise<void>;
/** Token HUD switch. Shown while Invisibility is live, for whoever may update the actor. */
export declare function registerInvisibilityTokenEffectToggle(): void;
//# sourceMappingURL=invisibility-presentation.d.ts.map