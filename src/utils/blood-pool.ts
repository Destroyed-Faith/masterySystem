/**
 * Blood Pool / Blutlache System
 * Visual blood effects under a hit token, tinted with the actor's bloodColor.
 *
 * - splatter: a few small droplets when HP is chipped within the same health level
 * - puddle: a large blood pool when a health level is lost (bar depleted / currentBar advances)
 */

export type BloodEffectIntensity = 'splatter' | 'puddle';

export interface BloodEffectOptions {
  /** Raw or bar damage amount (used as a mild size hint). */
  damage?: number;
  /** Prefer sheet color; falls back to actor then default dark red. */
  bloodColor?: string;
  /** If omitted, inferred from healthLevelLost + damage. */
  intensity?: BloodEffectIntensity;
  /** True when the hit depleted a health bar / advanced currentBar. */
  healthLevelLost?: boolean;
  /**
   * Persistent TileDocument (legacy). Default false — temporary PIXI graphics
   * support animation and avoid Foundry tile quirks.
   */
  persistent?: boolean;
}

const DEFAULT_BLOOD = '#8b0000';

/** Decide visual intensity from combat outcome. */
export function resolveBloodIntensity(opts: {
  barDamage: number;
  healthLevelLost: boolean;
  intensity?: BloodEffectIntensity;
}): BloodEffectIntensity | null {
  if (opts.intensity === 'splatter' || opts.intensity === 'puddle') return opts.intensity;
  if (opts.healthLevelLost) return 'puddle';
  if (opts.barDamage > 0) return 'splatter';
  return null;
}

/** True when at least one health bar went from >0 HP to 0, or currentBar advanced. */
export function didLoseHealthLevel(opts: {
  oldBarIndex: number;
  newBarIndex: number;
  barsBefore: Array<{ current?: number }>;
  barsAfter: Array<{ current?: number }>;
}): boolean {
  if (opts.newBarIndex > opts.oldBarIndex) return true;
  const n = Math.min(opts.barsBefore.length, opts.barsAfter.length);
  for (let i = 0; i < n; i++) {
    const before = Math.max(0, Math.floor(Number(opts.barsBefore[i]?.current) || 0));
    const after = Math.max(0, Math.floor(Number(opts.barsAfter[i]?.current) || 0));
    if (before > 0 && after === 0) return true;
  }
  return false;
}

function normalizeBloodColor(color?: string): string {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  return DEFAULT_BLOOD;
}

function hexToRgb(hex: string): { r: number; g: number; b: number; pixi: number } {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b, pixi: (r << 16) | (g << 8) | b };
}

function darkerPixi(r: number, g: number, b: number, factor = 0.4): number {
  const dr = Math.max(0, Math.floor(r * factor));
  const dg = Math.max(0, Math.floor(g * factor));
  const db = Math.max(0, Math.floor(b * factor));
  return (dr << 16) | (dg << 8) | db;
}

function resolveTokenCenter(token: any): { x: number; y: number } | null {
  const placeable = token?.center ? token : token?.object;
  const c = placeable?.center;
  if (c && Number.isFinite(c.x) && Number.isFinite(c.y)) return { x: c.x, y: c.y };
  const x = Number(token?.x);
  const y = Number(token?.y);
  const w = Number(token?.w ?? token?.width ?? 0);
  const h = Number(token?.h ?? token?.height ?? 0);
  const grid = Number((globalThis as any).canvas?.grid?.size || 100);
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return { x: x + (w || grid) / 2, y: y + (h || grid) / 2 };
  }
  return null;
}

function getBackgroundContainer(): any | null {
  const canvas = (globalThis as any).canvas;
  if (!canvas?.ready) return null;

  const candidates = [canvas.primary, canvas.background, canvas.tiles, canvas.stage];
  for (const layer of candidates) {
    if (!layer) continue;
    if (layer.container && typeof layer.container.addChild === 'function') return layer.container;
    if (typeof layer.addChild === 'function') return layer;
  }
  return null;
}

function seededJitter(seed: number): number {
  // Deterministic-ish but cheap pseudo-random in [-1, 1]
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Create a blood effect at a token's position.
 * Back-compat: createBloodPool(token, damage, persistent?, bloodColor?)
 */
export async function createBloodPool(
  token: any,
  damageOrOptions: number | BloodEffectOptions = 0,
  persistent: boolean = false,
  bloodColor?: string
): Promise<void> {
  const opts: BloodEffectOptions =
    typeof damageOrOptions === 'object' && damageOrOptions !== null
      ? damageOrOptions
      : {
          damage: Number(damageOrOptions) || 0,
          persistent,
          bloodColor,
        };

  const canvas = (globalThis as any).canvas;
  if (!token || !canvas?.ready) {
    console.warn('Mastery System | Cannot create blood pool: canvas not ready or token invalid');
    return;
  }

  const actorSystem = token.actor?.system ?? token.document?.actor?.system;
  const color = normalizeBloodColor(opts.bloodColor || actorSystem?.bloodColor);
  const { r, g, b, pixi } = hexToRgb(color);
  const dark = darkerPixi(r, g, b);

  const damage = Math.max(0, Math.floor(Number(opts.damage) || 0));
  const intensity =
    resolveBloodIntensity({
      barDamage: damage,
      healthLevelLost: !!opts.healthLevelLost,
      intensity: opts.intensity,
    }) ?? (damage > 0 ? 'splatter' : null);

  if (!intensity) return;

  const center = resolveTokenCenter(token);
  if (!center) return;

  const gridSize = canvas.grid?.size || 100;

  if (opts.persistent) {
    await createPersistentBloodTile(center, intensity, damage, gridSize, r, g, b, dark, pixi);
    return;
  }

  if (intensity === 'puddle') {
    createAnimatedPuddle(token, center, damage, gridSize, pixi, dark);
  } else {
    createAnimatedSplatters(token, center, damage, gridSize, pixi, dark);
  }
}

/** Convenience wrapper used by the damage pipeline. */
export async function showDamageBloodEffect(
  token: any,
  opts: {
    barDamage: number;
    healthLevelLost: boolean;
    bloodColor?: string;
  }
): Promise<void> {
  const intensity = resolveBloodIntensity({
    barDamage: opts.barDamage,
    healthLevelLost: opts.healthLevelLost,
  });
  if (!intensity) return;
  await createBloodPool(token, {
    damage: opts.barDamage,
    bloodColor: opts.bloodColor,
    intensity,
    healthLevelLost: opts.healthLevelLost,
    persistent: false,
  });
}

async function createPersistentBloodTile(
  center: { x: number; y: number },
  intensity: BloodEffectIntensity,
  damage: number,
  gridSize: number,
  r: number,
  g: number,
  b: number,
  darkerColor: number,
  pixiColor: number
): Promise<void> {
  try {
    const scene = (globalThis as any).canvas?.scene;
    if (!scene) {
      createAnimatedPuddle(null, center, damage, gridSize, pixiColor, darkerColor);
      return;
    }

    const multiplier =
      intensity === 'puddle'
        ? Math.min(1.6 + damage / 25, 3.2)
        : Math.min(0.55 + damage / 40, 1.1);
    const poolRadius = gridSize * 0.35 * multiplier;

    const offscreen = document.createElement('canvas');
    offscreen.width = 256;
    offscreen.height = 256;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.85)`);
      gradient.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.5)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.12)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(128, 128, 110, 96, 0.15, 0, Math.PI * 2);
      ctx.fill();

      const dr = (darkerColor >> 16) & 0xff;
      const dg = (darkerColor >> 8) & 0xff;
      const db = darkerColor & 0xff;
      ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, 0.45)`;
      ctx.beginPath();
      ctx.arc(108, 140, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(150, 112, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    const TileDoc = (globalThis as any).TileDocument;
    if (!TileDoc) {
      createAnimatedPuddle(null, center, damage, gridSize, pixiColor, darkerColor);
      return;
    }

    await TileDoc.create(
      {
        img: offscreen.toDataURL('image/png'),
        x: center.x - poolRadius,
        y: center.y - poolRadius * 0.85,
        width: poolRadius * 2,
        height: poolRadius * 1.7,
        rotation: 0,
        z: 100,
        alpha: intensity === 'puddle' ? 0.7 : 0.45,
        tint: pixiColor,
        locked: false,
        hidden: false,
      },
      { parent: scene }
    );
  } catch (error) {
    console.error('Mastery System | Error creating blood pool tile', error);
    createAnimatedPuddle(null, center, damage, gridSize, pixiColor, darkerColor);
  }
}

function animateScaleIn(graphic: any, durationMs: number, from = 0.15, to = 1): void {
  const ticker = (globalThis as any).canvas?.app?.ticker;
  if (!ticker || !graphic) {
    graphic.scale?.set?.(to, to);
    graphic.alpha = graphic.alpha || 0.7;
    return;
  }

  graphic.scale.set(from, from);
  const startAlpha = 0;
  const endAlpha = graphic.alpha ?? 0.75;
  graphic.alpha = startAlpha;
  const start = performance.now();

  const tick = (): void => {
    const t = Math.min(1, (performance.now() - start) / durationMs);
    // ease-out cubic
    const e = 1 - Math.pow(1 - t, 3);
    const s = from + (to - from) * e;
    graphic.scale.set(s, s);
    graphic.alpha = startAlpha + (endAlpha - startAlpha) * e;
    if (t >= 1) ticker.remove(tick);
  };
  ticker.add(tick);
}

function createAnimatedSplatters(
  token: any,
  center: { x: number; y: number },
  damage: number,
  gridSize: number,
  pixiColor: number,
  darkerColor: number
): void {
  const PIXI = (globalThis as any).PIXI;
  const container = getBackgroundContainer();
  if (!PIXI?.Graphics || !container) {
    console.warn('Mastery System | Could not find PIXI/background for blood splatters');
    return;
  }

  const group = new PIXI.Graphics();
  const count = 3 + Math.min(3, Math.floor(damage / 8)); // 3–6 droplets
  const spread = gridSize * 0.38;

  for (let i = 0; i < count; i++) {
    const jx = seededJitter(damage * 17 + i * 3.1);
    const jy = seededJitter(damage * 9 + i * 5.7);
    const ox = jx * spread;
    // Bias slightly downward so stains sit "under" the token/hex
    const oy = Math.abs(jy) * spread * 0.55 + gridSize * 0.08;
    const rx = gridSize * (0.06 + Math.abs(seededJitter(i + 2)) * 0.07);
    const ry = rx * (0.65 + Math.abs(seededJitter(i + 4)) * 0.35);
    const rot = seededJitter(i + 8) * 0.8;

    group.beginFill(pixiColor, 0.55);
    group.drawEllipse(ox, oy, rx, ry);
    group.endFill();
    group.beginFill(darkerColor, 0.5);
    group.drawEllipse(ox + rx * 0.15, oy + ry * 0.1, rx * 0.45, ry * 0.4);
    group.endFill();

    // Tiny satellite fleck
    if (i % 2 === 0) {
      group.beginFill(pixiColor, 0.4);
      group.drawEllipse(ox + rot * 12, oy - ry * 0.8, rx * 0.35, ry * 0.28);
      group.endFill();
    }
  }

  group.position.set(center.x, center.y);
  group.alpha = 0.8;
  (group as any).msBloodPool = true;
  (group as any).msBloodKind = 'splatter';
  (group as any).msTokenId = token?.id ?? token?.document?.id;

  container.addChild(group);
  // Keep splatters below tokens when possible
  try {
    container.setChildIndex?.(group, 0);
  } catch {
    /* ignore */
  }
  animateScaleIn(group, 280, 0.25, 1);
}

function createAnimatedPuddle(
  token: any | null,
  center: { x: number; y: number },
  damage: number,
  gridSize: number,
  pixiColor: number,
  darkerColor: number
): void {
  const PIXI = (globalThis as any).PIXI;
  const container = getBackgroundContainer();
  if (!PIXI?.Graphics || !container) {
    console.warn('Mastery System | Could not find PIXI/background for blood puddle');
    return;
  }

  const damageMultiplier = Math.min(1.4 + damage / 18, 3.0);
  const radius = gridSize * 0.55 * damageMultiplier;

  const bloodPool = new PIXI.Graphics();

  // Irregular mega puddle — layered ellipses
  bloodPool.beginFill(pixiColor, 0.35);
  bloodPool.drawEllipse(0, gridSize * 0.06, radius, radius * 0.78);
  bloodPool.endFill();

  bloodPool.beginFill(pixiColor, 0.5);
  bloodPool.drawEllipse(-radius * 0.12, gridSize * 0.08, radius * 0.78, radius * 0.58);
  bloodPool.endFill();

  bloodPool.beginFill(darkerColor, 0.65);
  bloodPool.drawEllipse(radius * 0.08, gridSize * 0.1, radius * 0.48, radius * 0.36);
  bloodPool.endFill();

  // Edge splatters for the "mega" hit
  const flecks = 5;
  for (let i = 0; i < flecks; i++) {
    const ang = (Math.PI * 2 * i) / flecks + seededJitter(damage + i) * 0.4;
    const dist = radius * (0.75 + Math.abs(seededJitter(i * 2)) * 0.35);
    const fx = Math.cos(ang) * dist;
    const fy = Math.sin(ang) * dist * 0.75 + gridSize * 0.05;
    const fr = radius * (0.08 + Math.abs(seededJitter(i + 3)) * 0.08);
    bloodPool.beginFill(pixiColor, 0.45);
    bloodPool.drawEllipse(fx, fy, fr, fr * 0.7);
    bloodPool.endFill();
  }

  bloodPool.position.set(center.x, center.y);
  bloodPool.alpha = 0.85;
  (bloodPool as any).msBloodPool = true;
  (bloodPool as any).msBloodKind = 'puddle';
  (bloodPool as any).msTokenId = token?.id ?? token?.document?.id;

  container.addChild(bloodPool);
  try {
    container.setChildIndex?.(bloodPool, 0);
  } catch {
    /* ignore */
  }
  animateScaleIn(bloodPool, 420, 0.12, 1);
}

/**
 * Remove all temporary blood pools for a specific token
 */
export function removeBloodPoolsForToken(tokenId: string): void {
  const canvas = (globalThis as any).canvas;
  if (!canvas?.ready) return;

  const layers = [canvas.primary, canvas.background, canvas.tiles, canvas.stage].filter(Boolean);

  for (const layer of layers) {
    if (!layer) continue;
    const container = (layer as any).container || layer;
    if (!container?.children) continue;
    for (let i = container.children.length - 1; i >= 0; i--) {
      const child = container.children[i];
      if ((child as any).msBloodPool && (child as any).msTokenId === tokenId) {
        container.removeChild(child);
        child.destroy?.();
      }
    }
  }
}
