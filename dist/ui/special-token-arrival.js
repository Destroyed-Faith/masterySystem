/**
 * When a negative diminishing Special gains stacks, the struck token shakes
 * and that many coins fly into the special tray.
 */
import { statusEntryId } from '../system/active-specials.js';
import { isHudTokenSpecialId } from '../combat/special-application.js';
import { specialTokenAsset } from './special-token-assets.js';
import { refreshSpecialTokenArea, resolveSpecialTokenHudActor } from './special-token-area.js';
const SHAKE_MS = 500;
const FLY_MS = 480;
const MAX_COINS = 5;
export function hudStackTotals(list) {
    const out = {};
    for (const entry of list || []) {
        const id = statusEntryId(entry);
        if (!id || !isHudTokenSpecialId(id, entry?.name))
            continue;
        const value = Math.max(0, Math.floor(Number(entry?.value) || 0));
        if (value <= 0)
            continue;
        out[id] = (out[id] || 0) + value;
    }
    return out;
}
/** New stacks only. Decay and removal produce nothing. */
export function hudStackGains(before, after) {
    const prev = hudStackTotals(before);
    const next = hudStackTotals(after);
    const gains = [];
    for (const id of Object.keys(next)) {
        const added = next[id] - (prev[id] || 0);
        if (added > 0)
            gains.push({ id, added });
    }
    return gains;
}
function canvasToken(actor) {
    const placeables = globalThis.canvas?.tokens?.placeables || [];
    const id = actor?.id;
    return placeables.find((token) => token?.actor?.id === id || token?.document?.actorId === id) || null;
}
function tokenScreenCenter(actor) {
    const token = canvasToken(actor);
    const canvas = globalThis.canvas;
    if (!token || !canvas?.stage?.toGlobal)
        return null;
    const center = token.center || {
        x: (token.x || 0) + (token.w || 0) / 2,
        y: (token.y || 0) + (token.h || 0) / 2,
    };
    const point = canvas.stage.toGlobal(center);
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y))
        return null;
    return { x: point.x, y: point.y };
}
function shakeCanvasToken(actor) {
    const mesh = canvasToken(actor)?.mesh;
    const pos = mesh?.position;
    if (!pos || typeof pos.set !== 'function')
        return;
    const ox = pos.x;
    const oy = pos.y;
    const start = performance.now();
    const step = (now) => {
        const t = now - start;
        if (t >= SHAKE_MS) {
            pos.set(ox, oy);
            return;
        }
        const amp = 5 * (1 - t / SHAKE_MS);
        pos.set(ox + Math.sin(t / 28) * amp, oy + Math.cos(t / 22) * amp);
        requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
function landShake(specialId) {
    const landed = document.querySelector(`#mastery-special-token-area .sta-token[data-special-id="${specialId}"]`);
    if (!landed)
        return;
    landed.classList.remove('is-landing');
    void landed.offsetWidth;
    landed.classList.add('is-landing');
    window.setTimeout(() => landed.classList.remove('is-landing'), SHAKE_MS);
}
function flyCoin(from, specialId, delay) {
    window.setTimeout(() => {
        const board = document.querySelector('#mastery-special-token-area .sta-board');
        const dest = board?.getBoundingClientRect();
        if (!dest || dest.width < 2)
            return;
        const size = 46;
        const img = document.createElement('img');
        img.className = 'sta-fly';
        img.src = specialTokenAsset(specialId);
        img.alt = '';
        img.style.left = `${from.x - size / 2}px`;
        img.style.top = `${from.y - size / 2}px`;
        img.style.setProperty('--sta-dx', `${dest.left + dest.width / 2 - from.x}px`);
        img.style.setProperty('--sta-dy', `${dest.top + dest.height * 0.72 - from.y}px`);
        document.body.appendChild(img);
        let finished = false;
        const done = () => {
            if (finished)
                return;
            finished = true;
            img.remove();
            landShake(specialId);
        };
        img.addEventListener('animationend', done, { once: true });
        window.setTimeout(done, FLY_MS + 80);
    }, delay);
}
export async function announceStatusGains(actor, before, after) {
    const gains = hudStackGains(before, after);
    if (!gains.length || typeof document === 'undefined')
        return;
    shakeCanvasToken(actor);
    const hud = resolveSpecialTokenHudActor();
    const same = hud && (hud.id === actor?.id || hud.uuid === actor?.uuid);
    if (!same)
        return;
    await refreshSpecialTokenArea();
    const from = tokenScreenCenter(actor);
    if (!from)
        return;
    let delay = 0;
    for (const gain of gains) {
        const coins = Math.min(gain.added, MAX_COINS);
        for (let i = 0; i < coins; i += 1) {
            flyCoin(from, gain.id, delay);
            delay += 70;
        }
    }
}
//# sourceMappingURL=special-token-arrival.js.map