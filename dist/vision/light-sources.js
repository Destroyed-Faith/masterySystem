/**
 * Mundane light sources and the lighting state at a point.
 *
 * Foundry renders the light itself (token / ambient light `bright` / `dim`
 * radii). The Mastery layer only needs to know whether a location is
 * effectively Daylight (inside a Bright radius), Dim Light (inside a Dim
 * radius) or falls back to the scene lighting state.
 */
import { brighterLighting } from './scene-lighting.js';
export const LIGHT_SOURCE_PROFILES = {
    candle: { id: 'candle', label: 'Candle / Tiny Light', brightM: 2, dimM: 4, color: '#ffd8a0', icon: 'fas fa-fire-alt' },
    torch: { id: 'torch', label: 'Torch', brightM: 8, dimM: 16, color: '#ffb86b', icon: 'fas fa-fire' },
    lantern: { id: 'lantern', label: 'Lantern', brightM: 12, dimM: 24, color: '#ffd27a', icon: 'fas fa-lightbulb' },
};
export const LIGHT_SOURCE_PROFILE_IDS = ['candle', 'torch', 'lantern'];
export function isLightSourceProfileId(value) {
    return typeof value === 'string' && LIGHT_SOURCE_PROFILE_IDS.includes(value);
}
/** Token / AmbientLight document `light` data for a profile (Foundry native rendering). */
export function foundryLightDataForProfile(profile) {
    return {
        bright: profile.brightM,
        dim: profile.dimM,
        color: profile.color,
        alpha: 0.35,
        luminosity: 0.5,
        angle: 360,
        animation: { type: 'torch', speed: 3, intensity: 3 },
    };
}
/** Removing a carried light source: no bright, no dim, no animation. */
export function foundryLightDataOff() {
    return { bright: 0, dim: 0, animation: { type: null, speed: 5, intensity: 5 } };
}
/**
 * Lighting at `point`: Bright radius → Daylight, Dim radius → Dim Light,
 * otherwise the scene state. Light only ever improves the scene state.
 */
export function lightingStateAtPoint(sceneState, sources, point, distanceM) {
    let state = sceneState;
    for (const src of sources) {
        const d = distanceM(src, point);
        if (src.brightM > 0 && d <= src.brightM) {
            state = brighterLighting(state, 'daylight');
            if (state === 'daylight')
                return state;
        }
        else if (src.dimM > 0 && d <= src.dimM) {
            state = brighterLighting(state, 'dim');
        }
    }
    return state;
}
/** Light sources from Foundry documents (AmbientLight docs and lit tokens). */
export function collectPointLightSources(scene) {
    const out = [];
    const push = (doc) => {
        const cfg = doc?.config ?? doc?.light ?? null;
        if (!cfg)
            return;
        if (doc?.hidden === true)
            return;
        const brightM = Math.max(0, Number(cfg.bright) || 0);
        const dimM = Math.max(0, Number(cfg.dim) || 0);
        if (brightM <= 0 && dimM <= 0)
            return;
        const center = doc?.object?.center ?? doc?.center ?? null;
        const x = Number(center?.x ?? doc?.x);
        const y = Number(center?.y ?? doc?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y))
            return;
        out.push({ x, y, brightM, dimM });
    };
    const iter = (coll) => {
        if (!coll)
            return [];
        if (Array.isArray(coll))
            return coll;
        if (Array.isArray(coll.contents))
            return coll.contents;
        if (typeof coll[Symbol.iterator] === 'function')
            return Array.from(coll);
        return [];
    };
    for (const light of iter(scene?.lights))
        push(light);
    for (const token of iter(scene?.tokens))
        push(token);
    return out;
}
//# sourceMappingURL=light-sources.js.map