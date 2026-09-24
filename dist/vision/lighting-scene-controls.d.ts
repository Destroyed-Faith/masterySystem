/**
 * Scene Controls → "Lighting" group (GM).
 *
 * Mode buttons AUTO / DAY / DIM / NIGHT / DARK persist on the scene and
 * re-render immediately; the group title reads e.g.
 * "Lighting: AUTO — Fourth Watch → NIGHT". Light-source buttons put a
 * mundane light profile on the selected tokens using Foundry's native token
 * light. A small field in the Scene Configuration edits the same flag.
 */
export declare function buildLightingSceneControl(isGM: boolean): any;
/** Click routing for Foundry builds that ignore `tool.onClick` on buttons. */
export declare function handleLightingToolClick(toolName: string): boolean;
/** Scene Configuration: a select bound to the same flag (persistent setting). */
export declare function injectSceneConfigLightingField(app: any, html: any): void;
export declare function initializeLightingSceneControls(): void;
//# sourceMappingURL=lighting-scene-controls.d.ts.map