/**
 * Blood stains under a hit token, tinted with the actor's bloodColor.
 *
 * Textures live in assets/fx/blood:
 *   light  → drops/   (small HP chips)
 *   medium → impacts/ (heavy chips)
 *   heavy  → pools/   (health level lost)
 *   trail  → trails/  (badly wounded tokens dragging across the map)
 *
 * Drawn on canvas.primary between tiles and tokens so stains sit on the
 * map, not on top of the character.
 */
const DEFAULT_BLOOD = '#8b0000';
const SYSTEM_ID = 'mastery-system';
const BLOOD_ROOT = `systems/${SYSTEM_ID}/assets/fx/blood`;
const MAX_SCENE_STAINS = 14;
/** Trail art points bottom-left → top-right in canvas space. */
export const BLOOD_TRAIL_TEXTURE_ANGLE = -Math.PI / 4;
export const BLOOD_TEXTURES = {
    light: [`${BLOOD_ROOT}/drops/drops-01.png`, `${BLOOD_ROOT}/drops/drops-02.png`],
    medium: [
        `${BLOOD_ROOT}/impacts/impact-01.png`,
        `${BLOOD_ROOT}/impacts/impact-02.png`,
        `${BLOOD_ROOT}/impacts/impact-03.png`,
        `${BLOOD_ROOT}/impacts/impact-04.png`,
    ],
    heavy: [
        `${BLOOD_ROOT}/pools/pool-01.png`,
        `${BLOOD_ROOT}/pools/pool-02.png`,
        `${BLOOD_ROOT}/pools/pool-03.png`,
        `${BLOOD_ROOT}/pools/pool-04.png`,
    ],
};
export const BLOOD_TRAIL_TEXTURES = [
    `${BLOOD_ROOT}/trails/trail-01.png`,
    `${BLOOD_ROOT}/trails/trail-02.png`,
];
const GRID_SPAN = {
    light: { base: 0.55, damageDiv: 80, cap: 0.75 },
    medium: { base: 0.8, damageDiv: 50, cap: 1.05 },
    heavy: { base: 1.05, damageDiv: 40, cap: 1.35 },
};
/** Map legacy names and pass through the three current intensities. */
export function normalizeBloodIntensity(intensity) {
    if (intensity === 'splatter')
        return 'light';
    if (intensity === 'puddle')
        return 'heavy';
    if (intensity === 'light' || intensity === 'medium' || intensity === 'heavy')
        return intensity;
    return undefined;
}
/** Decide visual intensity from combat outcome. */
export function resolveBloodIntensity(opts) {
    const explicit = normalizeBloodIntensity(opts.intensity);
    if (explicit)
        return explicit;
    if (opts.healthLevelLost)
        return 'heavy';
    if (opts.barDamage <= 0)
        return null;
    const mediumFloor = opts.barMax && opts.barMax > 0 ? Math.max(3, Math.ceil(opts.barMax * 0.4)) : 4;
    return opts.barDamage >= mediumFloor ? 'medium' : 'light';
}
export function pickBloodTexturePath(intensity, seed) {
    const list = BLOOD_TEXTURES[intensity];
    const n = list.length;
    const idx = Math.abs(Math.floor((seededJitter(seed) + 1) * 0.5 * n)) % n;
    return list[idx];
}
export function pickBloodTrailPath(seed) {
    const n = BLOOD_TRAIL_TEXTURES.length;
    const idx = Math.abs(Math.floor((seededJitter(seed) + 1) * 0.5 * n)) % n;
    return BLOOD_TRAIL_TEXTURES[idx];
}
/**
 * Wounded / Broken / Incapacitated — second half of the wound track.
 * Healthy, Bruised, and Injured do not drip while walking.
 */
export function shouldLeaveBloodTrail(actor) {
    const bars = actor?.system?.health?.bars;
    if (!Array.isArray(bars) || !bars.length)
        return false;
    const idx = Math.max(0, Math.floor(Number(actor.system?.health?.currentBar) || 0));
    return idx >= Math.floor(bars.length / 2);
}
export function bloodTrailRotation(dx, dy) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) {
        return 0;
    }
    return Math.atan2(dy, dx) - BLOOD_TRAIL_TEXTURE_ANGLE;
}
/** Mid-segment stamps along a move. Empty when the drag is too short. */
export function bloodTrailWaypoints(opts) {
    const grid = Math.max(1, opts.gridSize);
    const dx = opts.to.x - opts.from.x;
    const dy = opts.to.y - opts.from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < grid * 0.35)
        return [];
    const count = Math.min(3, Math.max(1, Math.round(dist / (grid * 0.85))));
    const points = [];
    for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : (i + 1) / (count + 1);
        points.push({ x: opts.from.x + dx * t, y: opts.from.y + dy * t });
    }
    return points;
}
/** Display width/height in canvas pixels for one stain. */
export function bloodSpriteSize(opts) {
    const spec = GRID_SPAN[opts.intensity];
    const damage = Math.max(0, opts.damage);
    const span = Math.min(spec.cap, spec.base + damage / spec.damageDiv);
    const jitter = 0.88 + Math.abs(seededJitter(damage + 19)) * 0.24;
    return Math.max(24, opts.gridSize * span * jitter);
}
/** HP actually lost across the wound track (heals do not count). */
export function hpLostFromHealthUpdate(opts) {
    const n = Math.max(opts.barsBefore.length, opts.barsAfter.length);
    let lost = 0;
    for (let i = 0; i < n; i++) {
        const before = Math.max(0, Math.floor(Number(opts.barsBefore[i]?.current) || 0));
        const after = Math.max(0, Math.floor(Number(opts.barsAfter[i]?.current) || 0));
        lost += Math.max(0, before - after);
    }
    return lost;
}
/** True when at least one health bar went from >0 HP to 0, or currentBar advanced. */
export function didLoseHealthLevel(opts) {
    if (opts.newBarIndex > opts.oldBarIndex)
        return true;
    const n = Math.min(opts.barsBefore.length, opts.barsAfter.length);
    for (let i = 0; i < n; i++) {
        const before = Math.max(0, Math.floor(Number(opts.barsBefore[i]?.current) || 0));
        const after = Math.max(0, Math.floor(Number(opts.barsAfter[i]?.current) || 0));
        if (before > 0 && after === 0)
            return true;
    }
    return false;
}
function normalizeBloodColor(color) {
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color))
        return color;
    return DEFAULT_BLOOD;
}
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return { r, g, b, pixi: (r << 16) | (g << 8) | b };
}
function darkerPixi(r, g, b, factor = 0.4) {
    const dr = Math.max(0, Math.floor(r * factor));
    const dg = Math.max(0, Math.floor(g * factor));
    const db = Math.max(0, Math.floor(b * factor));
    return (dr << 16) | (dg << 8) | db;
}
function resolveTokenCenter(token) {
    const placeable = token?.center ? token : token?.object;
    const c = placeable?.center;
    if (c && Number.isFinite(c.x) && Number.isFinite(c.y))
        return { x: c.x, y: c.y };
    const x = Number(token?.x);
    const y = Number(token?.y);
    const w = Number(token?.w ?? token?.width ?? 0);
    const h = Number(token?.h ?? token?.height ?? 0);
    const grid = Number(globalThis.canvas?.grid?.size || 100);
    if (Number.isFinite(x) && Number.isFinite(y)) {
        return { x: x + (w || grid) / 2, y: y + (h || grid) / 2 };
    }
    return null;
}
function resolveBarMax(source) {
    const actor = source?.actor ?? source?.document?.actor ?? source;
    const bars = actor?.system?.health?.bars;
    if (!Array.isArray(bars) || !bars.length)
        return undefined;
    const idx = Math.max(0, Math.floor(Number(actor.system?.health?.currentBar) || 0));
    const max = Math.floor(Number(bars[idx]?.max) || 0);
    return max > 0 ? max : undefined;
}
/**
 * Stains belong on the primary group, above the map/tiles and below token
 * meshes. Effects / token / interface layers draw on top of the character.
 */
function getBloodContainer() {
    const canvas = globalThis.canvas;
    if (!canvas?.ready)
        return null;
    const existing = canvas.msBloodLayer;
    if (existing && !existing.destroyed && existing.parent)
        return existing;
    const PIXI = globalThis.PIXI;
    if (!PIXI?.Container)
        return null;
    const layer = new PIXI.Container();
    layer.eventMode = 'none';
    layer.interactive = false;
    layer.interactiveChildren = false;
    layer.msBloodLayer = true;
    const primary = canvas.primary;
    if (primary && typeof primary.addChild === 'function') {
        const SORT = primary.constructor?.SORT_LAYERS ?? {};
        const tilesSort = Number(SORT.TILES ?? 500);
        const tokensSort = Number(SORT.TOKENS ?? 700);
        layer.sortLayer = tilesSort + Math.max(1, Math.floor((tokensSort - tilesSort) / 2));
        layer.zIndex = layer.sortLayer;
        const tokensNode = primary.tokens;
        if (tokensNode &&
            typeof primary.addChildAt === 'function' &&
            typeof primary.getChildIndex === 'function') {
            try {
                const idx = primary.getChildIndex(tokensNode);
                primary.addChildAt(layer, Math.max(0, idx));
            }
            catch {
                primary.addChild(layer);
            }
        }
        else {
            primary.addChild(layer);
        }
        primary.sortChildren?.();
        canvas.msBloodLayer = layer;
        return layer;
    }
    const tiles = canvas.tiles;
    const host = tiles?.container ?? tiles;
    if (host && typeof host.addChild === 'function') {
        host.addChild(layer);
        canvas.msBloodLayer = layer;
        return layer;
    }
    return null;
}
function markBloodGraphic(g, token, kind) {
    g.eventMode = 'none';
    g.interactive = false;
    g.hitArea = null;
    g.msBloodPool = true;
    g.msBloodKind = kind;
    g.msTokenId = token?.id ?? token?.document?.id;
}
function seededJitter(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
}
function pruneOldStains(container) {
    const kids = (container?.children ?? []).filter((c) => c?.msBloodPool);
    const extra = kids.length - MAX_SCENE_STAINS + 1;
    if (extra <= 0)
        return;
    for (let i = 0; i < extra; i++) {
        const child = kids[i];
        container.removeChild(child);
        child.destroy?.({ children: true, texture: false, baseTexture: false });
    }
}
async function loadBloodTexture(path) {
    const foundry = globalThis.foundry;
    const loader = foundry?.canvas?.loadTexture ??
        foundry?.canvas?.TextureLoader?.loader?.loadTexture?.bind(foundry.canvas.TextureLoader.loader) ??
        globalThis.loadTexture;
    if (typeof loader !== 'function')
        return null;
    try {
        const tex = await loader(path);
        return tex ?? null;
    }
    catch (err) {
        console.warn('Mastery System | Blood texture failed to load', path, err);
        return null;
    }
}
function makeBloodSprite(texture, PIXI) {
    if (!texture || !PIXI?.Sprite)
        return null;
    try {
        return new PIXI.Sprite(texture);
    }
    catch {
        return typeof PIXI.Sprite.from === 'function' ? PIXI.Sprite.from(texture) : null;
    }
}
/** PIXI v7 beginFill/drawEllipse and v8 ellipse/fill — fallback only. */
function fillEllipse(g, x, y, rx, ry, color, alpha) {
    if (typeof g.ellipse === 'function' && typeof g.fill === 'function') {
        g.ellipse(x, y, rx, ry);
        g.fill({ color, alpha });
        return;
    }
    if (typeof g.beginFill === 'function' && typeof g.drawEllipse === 'function') {
        g.beginFill(color, alpha);
        g.drawEllipse(x, y, rx, ry);
        g.endFill?.();
        return;
    }
    if (typeof g.circle === 'function' && typeof g.fill === 'function') {
        g.circle(x, y, (rx + ry) / 2);
        g.fill({ color, alpha });
    }
}
/**
 * Create a blood effect at a token's position.
 * Back-compat: createBloodPool(token, damage, persistent?, bloodColor?)
 */
export async function createBloodPool(token, damageOrOptions = 0, persistent = false, bloodColor) {
    const opts = typeof damageOrOptions === 'object' && damageOrOptions !== null
        ? damageOrOptions
        : {
            damage: Number(damageOrOptions) || 0,
            persistent,
            bloodColor,
        };
    const canvas = globalThis.canvas;
    if (!token || !canvas?.ready) {
        console.warn('Mastery System | Cannot create blood pool: canvas not ready or token invalid');
        return;
    }
    const actorSystem = token.actor?.system ?? token.document?.actor?.system;
    const color = normalizeBloodColor(opts.bloodColor || actorSystem?.bloodColor);
    const { r, g, b, pixi } = hexToRgb(color);
    const dark = darkerPixi(r, g, b);
    const damage = Math.max(0, Math.floor(Number(opts.damage) || 0));
    const intensity = resolveBloodIntensity({
        barDamage: damage,
        healthLevelLost: !!opts.healthLevelLost,
        barMax: opts.barMax ?? resolveBarMax(token),
        intensity: opts.intensity,
    }) ?? (damage > 0 ? 'light' : null);
    if (!intensity)
        return;
    const center = resolveTokenCenter(token);
    if (!center)
        return;
    const gridSize = canvas.grid?.size || 100;
    const path = pickBloodTexturePath(intensity, damage * 13 + (token?.id ? String(token.id).length : 0));
    const size = bloodSpriteSize({ intensity, damage, gridSize });
    if (opts.persistent) {
        await createPersistentBloodTile(center, intensity, path, size, pixi, color);
        return;
    }
    const placed = await createTexturedStain(token, center, intensity, path, size, pixi, gridSize, damage);
    if (!placed) {
        createFallbackGraphic(token, center, intensity, damage, gridSize, pixi, dark);
    }
}
/** Convenience wrapper used by the damage pipeline. */
export async function showDamageBloodEffect(token, opts) {
    const intensity = resolveBloodIntensity({
        barDamage: opts.barDamage,
        healthLevelLost: opts.healthLevelLost,
        barMax: opts.barMax ?? resolveBarMax(token),
    });
    if (!intensity)
        return;
    await createBloodPool(token, {
        damage: opts.barDamage,
        bloodColor: opts.bloodColor,
        intensity,
        healthLevelLost: opts.healthLevelLost,
        barMax: opts.barMax ?? resolveBarMax(token),
        persistent: false,
    });
}
async function createPersistentBloodTile(center, intensity, path, size, pixiColor, hex) {
    try {
        const scene = globalThis.canvas?.scene;
        if (!scene)
            return;
        const TileDoc = globalThis.TileDocument;
        if (!TileDoc)
            return;
        const alpha = intensity === 'light' ? 0.55 : intensity === 'medium' ? 0.7 : 0.82;
        await TileDoc.create({
            texture: { src: path, tint: hex },
            img: path,
            x: center.x - size / 2,
            y: center.y - size / 2,
            width: size,
            height: size,
            rotation: Math.floor(Math.abs(seededJitter(size)) * 360),
            z: 100,
            alpha,
            tint: pixiColor,
            locked: false,
            hidden: false,
        }, { parent: scene });
    }
    catch (error) {
        console.error('Mastery System | Error creating blood pool tile', error);
    }
}
/**
 * Pop the stain in without resetting PIXI scale to 1.
 * width/height already set the display size; scale 1 is the raw 1254px texture.
 */
function animateScaleIn(graphic, durationMs, fromFactor = 0.22) {
    const toX = Number(graphic.scale?.x) || 1;
    const toY = Number(graphic.scale?.y) || toX;
    const ticker = globalThis.canvas?.app?.ticker;
    if (!ticker || !graphic?.scale?.set) {
        graphic.scale?.set?.(toX, toY);
        return;
    }
    graphic.scale.set(toX * fromFactor, toY * fromFactor);
    const startAlpha = 0;
    const endAlpha = graphic.alpha ?? 0.75;
    graphic.alpha = startAlpha;
    const start = performance.now();
    const tick = () => {
        const t = Math.min(1, (performance.now() - start) / durationMs);
        const e = 1 - Math.pow(1 - t, 3);
        const f = fromFactor + (1 - fromFactor) * e;
        graphic.scale.set(toX * f, toY * f);
        graphic.alpha = startAlpha + (endAlpha - startAlpha) * e;
        if (t >= 1)
            ticker.remove(tick);
    };
    ticker.add(tick);
}
async function createTexturedStain(token, center, intensity, path, size, pixiColor, gridSize, damage) {
    const PIXI = globalThis.PIXI;
    const container = getBloodContainer();
    if (!PIXI || !container) {
        console.warn('Mastery System | Could not find under-token layer for blood');
        return false;
    }
    const texture = await loadBloodTexture(path);
    const sprite = makeBloodSprite(texture, PIXI);
    if (!sprite)
        return false;
    pruneOldStains(container);
    if (sprite.anchor?.set)
        sprite.anchor.set(0.5);
    sprite.width = size;
    sprite.height = size;
    sprite.tint = pixiColor;
    sprite.alpha = intensity === 'light' ? 0.7 : intensity === 'medium' ? 0.78 : 0.86;
    sprite.rotation = seededJitter(damage * 7 + size) * Math.PI;
    const ox = seededJitter(damage + 3) * gridSize * 0.12;
    const oy = Math.abs(seededJitter(damage + 5)) * gridSize * 0.1 + gridSize * 0.04;
    sprite.position.set(center.x + ox, center.y + oy);
    markBloodGraphic(sprite, token, intensity);
    container.addChild(sprite);
    animateScaleIn(sprite, intensity === 'heavy' ? 420 : 280, 0.22);
    return true;
}
function tokenDocCenter(doc, x, y) {
    const grid = Number(doc?.parent?.grid?.size ?? globalThis.canvas?.grid?.size ?? 100);
    const w = Number(doc?.width ?? 1) * grid;
    const h = Number(doc?.height ?? 1) * grid;
    return { x: x + w / 2, y: y + h / 2 };
}
async function placeTrailSprite(token, position, path, size, pixiColor, rotation) {
    const PIXI = globalThis.PIXI;
    const container = getBloodContainer();
    if (!PIXI || !container)
        return false;
    const texture = await loadBloodTexture(path);
    const sprite = makeBloodSprite(texture, PIXI);
    if (!sprite)
        return false;
    pruneOldStains(container);
    if (sprite.anchor?.set)
        sprite.anchor.set(0.5);
    sprite.width = size;
    sprite.height = size;
    sprite.tint = pixiColor;
    sprite.alpha = 0.62;
    sprite.rotation = rotation;
    sprite.position.set(position.x, position.y);
    markBloodGraphic(sprite, token, 'trail');
    container.addChild(sprite);
    animateScaleIn(sprite, 220, 0.35);
    return true;
}
/** Drag smear under a badly wounded token. `fromTopLeft` is the pre-move document xy. */
export async function showBloodTrailForToken(tokenDoc, fromTopLeft) {
    const canvas = globalThis.canvas;
    if (!canvas?.ready || !tokenDoc)
        return;
    if (tokenDoc.hidden)
        return;
    const actor = tokenDoc.actor;
    if (!shouldLeaveBloodTrail(actor))
        return;
    const from = tokenDocCenter(tokenDoc, Number(fromTopLeft.x), Number(fromTopLeft.y));
    const to = tokenDocCenter(tokenDoc, Number(tokenDoc.x), Number(tokenDoc.y));
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const gridSize = Number(canvas.grid?.size || 100);
    const points = bloodTrailWaypoints({ from, to, gridSize });
    if (!points.length)
        return;
    const color = normalizeBloodColor(actor?.system?.bloodColor);
    const { pixi } = hexToRgb(color);
    const rotation = bloodTrailRotation(dx, dy);
    const size = gridSize * 0.9;
    for (let i = 0; i < points.length; i++) {
        const path = pickBloodTrailPath(dx + dy * 3 + i * 17 + Number(tokenDoc.x || 0));
        await placeTrailSprite(tokenDoc, points[i], path, size, pixi, rotation);
    }
}
function createFallbackGraphic(token, center, intensity, damage, gridSize, pixiColor, darkerColor) {
    const PIXI = globalThis.PIXI;
    const container = getBloodContainer();
    if (!PIXI?.Graphics || !container)
        return;
    const g = new PIXI.Graphics();
    const radius = intensity === 'heavy'
        ? gridSize * Math.min(0.48 + damage / 40, 0.62)
        : intensity === 'medium'
            ? gridSize * 0.38
            : gridSize * 0.22;
    fillEllipse(g, 0, gridSize * 0.05, radius, radius * 0.78, pixiColor, 0.45);
    fillEllipse(g, radius * 0.08, gridSize * 0.08, radius * 0.42, radius * 0.32, darkerColor, 0.55);
    g.position.set(center.x, center.y);
    g.alpha = 0.8;
    markBloodGraphic(g, token, intensity);
    pruneOldStains(container);
    container.addChild(g);
    animateScaleIn(g, 300, 0.18);
}
/**
 * Remove all temporary blood pools for a specific token
 */
export function removeBloodPoolsForToken(tokenId) {
    const canvas = globalThis.canvas;
    if (!canvas?.ready)
        return;
    const layers = [
        canvas.msBloodLayer,
        canvas.primary,
        canvas.tiles,
        canvas.effects,
        canvas.foreground,
        canvas.tokens,
        canvas.interface,
        canvas.stage,
        canvas.background,
    ].filter(Boolean);
    for (const layer of layers) {
        if (!layer)
            continue;
        const container = layer.container || layer;
        if (!container?.children)
            continue;
        for (let i = container.children.length - 1; i >= 0; i--) {
            const child = container.children[i];
            if (child.msBloodPool && child.msTokenId === tokenId) {
                container.removeChild(child);
                child.destroy?.();
            }
        }
    }
}
function getChangedHealthBars(changes) {
    if (Array.isArray(changes?.system?.health?.bars))
        return changes.system.health.bars;
    if (Array.isArray(changes?.['system.health.bars']))
        return changes['system.health.bars'];
    const dotted = globalThis.foundry?.utils?.getProperty?.(changes, 'system.health.bars');
    return Array.isArray(dotted) ? dotted : null;
}
function getChangedCurrentBar(changes, fallback) {
    const nested = changes?.system?.health?.currentBar;
    if (Number.isFinite(Number(nested)))
        return Number(nested);
    const flat = changes?.['system.health.currentBar'];
    if (Number.isFinite(Number(flat)))
        return Number(flat);
    const dotted = globalThis.foundry?.utils?.getProperty?.(changes, 'system.health.currentBar');
    if (Number.isFinite(Number(dotted)))
        return Number(dotted);
    return fallback;
}
function tokensForActor(actor) {
    const fromActor = actor?.getActiveTokens?.() ?? [];
    if (fromActor.length)
        return fromActor;
    const id = String(actor?.id ?? '');
    if (!id)
        return [];
    return (globalThis.canvas?.tokens?.placeables ?? []).filter((t) => t?.actor?.id === id);
}
async function showBloodForActor(actor, payload) {
    if (!globalThis.canvas?.ready)
        return;
    const tokens = tokensForActor(actor);
    for (const token of tokens) {
        await showDamageBloodEffect(token, payload);
    }
}
/**
 * Sheet HP minus, token-bar edits, and any other health.bars write.
 * Combat applyDamageToTarget draws its own FX and passes masteryBloodHandled.
 */
export function initializeBloodPoolHooks() {
    const pending = new Map();
    const pendingMoves = new Map();
    Hooks.on('canvasReady', () => {
        const canvas = globalThis.canvas;
        if (canvas)
            canvas.msBloodLayer = null;
        pendingMoves.clear();
    });
    Hooks.on('preUpdateToken', (tokenDoc, changes) => {
        if (changes?.x === undefined && changes?.y === undefined)
            return;
        const id = String(tokenDoc?.id ?? '');
        if (!id)
            return;
        pendingMoves.set(id, { x: Number(tokenDoc.x), y: Number(tokenDoc.y) });
    });
    Hooks.on('updateToken', (tokenDoc, changes) => {
        if (changes?.x === undefined && changes?.y === undefined)
            return;
        const id = String(tokenDoc?.id ?? '');
        const from = pendingMoves.get(id);
        pendingMoves.delete(id);
        if (!from)
            return;
        void showBloodTrailForToken(tokenDoc, from);
    });
    Hooks.on('preUpdateActor', (actor, changes, options) => {
        try {
            if (options?.masteryBloodHandled)
                return;
            const nextBars = getChangedHealthBars(changes);
            if (!nextBars)
                return;
            const actorId = String(actor?.id ?? '');
            if (!actorId)
                return;
            pending.delete(actorId);
            const prevBars = actor?.system?.health?.bars;
            if (!Array.isArray(prevBars))
                return;
            const barDamage = hpLostFromHealthUpdate({ barsBefore: prevBars, barsAfter: nextBars });
            if (barDamage <= 0)
                return;
            const oldBarIndex = Math.max(0, Math.floor(Number(actor.system?.health?.currentBar) || 0));
            const newBarIndex = Math.max(0, Math.floor(getChangedCurrentBar(changes, oldBarIndex)));
            pending.set(actorId, {
                barDamage,
                healthLevelLost: didLoseHealthLevel({
                    oldBarIndex,
                    newBarIndex,
                    barsBefore: prevBars,
                    barsAfter: nextBars,
                }),
                bloodColor: actor.system?.bloodColor,
                barMax: resolveBarMax(actor),
            });
        }
        catch (err) {
            console.warn('Mastery System | Blood FX preUpdate failed', err);
        }
    });
    Hooks.on('updateActor', (actor) => {
        const actorId = String(actor?.id ?? '');
        if (!actorId)
            return;
        const payload = pending.get(actorId);
        if (!payload)
            return;
        pending.delete(actorId);
        void showBloodForActor(actor, payload);
    });
}
//# sourceMappingURL=blood-pool.js.map