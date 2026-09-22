/**
 * Token HUD "Assign Status Effects".
 *
 * Left click toggles. Right click and double click always put the status
 * on the token status bar and into `system.statusEffects`, for PCs and NPCs.
 * Core only toggles an ActiveEffect, and a double click toggles it back off.
 */
export declare function statusIdFromHudTarget(target: any): string;
/**
 * Bind status-palette gestures. Capture phase runs before Foundry's toggle,
 * so a double click cannot turn the icon straight back off.
 */
export declare function bindStatusHudGestures(root: HTMLElement, actor: any, app?: any): void;
export declare function registerStatusHud(): void;
//# sourceMappingURL=status-hud.d.ts.map