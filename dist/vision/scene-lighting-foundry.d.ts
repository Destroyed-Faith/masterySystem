/**
 * Scene lighting — Foundry integration.
 *
 * Persists the GM's lighting mode on the Scene, derives the effective state
 * (AUTO → current Watch), maps it onto Foundry's native darkness / global
 * illumination for rendering, and caps the *rendered* vision radius of
 * player tokens without ever rewriting their 60 m baseline. Mechanical
 * perception (Combat Senses, Surprise, Grapple's unaware hint, stealth) does
 * not read any of this.
 */
import { type LightingMode, type LightingState, type LightingStatus, type WatchIndex } from './scene-lighting.js';
export declare const LIGHTING_MODE_FLAG = "lightingMode";
export declare const LIGHTING_STATE_FLAG = "lightingState";
export declare function getSceneLightingMode(scene: any): LightingMode;
/** Last effective state written on the scene (fallback when the Watch is unknown). */
export declare function getStoredSceneLightingState(scene: any): LightingState | null;
/**
 * Current Watch from the Tyhra calendar, or null when the calendar is off /
 * unavailable. Reads the world setting directly so every client agrees.
 */
export declare function getCurrentWatch(): WatchIndex | null;
/** Effective lighting state of a scene (manual override, else Watch, else stored). */
export declare function getSceneLightingState(scene: any): LightingState | null;
export declare function getSceneLightingStatus(scene: any): LightingStatus;
export declare function actorHasDarkvision(actor: any): boolean;
/**
 * Rendered sight cap (metres) for a token under the scene state. Player
 * tokens keep their configured range when it is lower; NPC tokens and
 * tokens without vision are not touched. Null = no cap.
 */
export declare function renderedSightCapM(tokenDoc: any, state: LightingState | null): number | null;
/** Scene update that renders `state`, or null when the scene already matches. */
export declare function planSceneRenderUpdate(scene: any, state: LightingState): Record<string, unknown> | null;
/** Re-render vision on this client after lighting changed. */
export declare function refreshVisionRendering(): void;
/**
 * Apply the effective state to the scene's native lighting. Returns the
 * state applied, or null when it is unknown (AUTO without Watch and no stored
 * state) — nothing is invented in that case.
 */
export declare function applySceneLighting(scene: any): Promise<LightingState | null>;
/** GM control: persist the mode and render immediately. */
export declare function setSceneLightingMode(scene: any, mode: LightingMode): Promise<LightingStatus | null>;
/**
 * Cap the rendered vision radius by the Mastery effective sight range. The
 * token document keeps its 60 m; only the runtime vision source shrinks.
 * Guarded: if this Foundry build has no `_getVisionSourceData`, rendering
 * falls back to native darkness handling and the Mastery layer still holds
 * the effective range for rules purposes.
 */
export declare function installVisionRangeCap(): boolean;
export declare function registerSceneLightingHooks(): void;
//# sourceMappingURL=scene-lighting-foundry.d.ts.map