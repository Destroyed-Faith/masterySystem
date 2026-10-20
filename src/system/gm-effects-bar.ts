/**
 * Client settings for the floating GM Effects bar (Manage Effects mode).
 */

const FLAG_SCOPE = 'mastery-system';

export const GM_EFFECTS_BAR_COLLAPSED_SETTING = 'gmEffectsBarCollapsed';
export const GM_EFFECTS_BAR_POSITION_SETTING = 'gmEffectsBarPosition';

export interface GmEffectsBarPosition {
  x: number;
  y: number;
}

export const DEFAULT_GM_EFFECTS_BAR_POSITION: GmEffectsBarPosition = { x: 120, y: 120 };
const BAR_EDGE_PAD = 8;

export function sanitizeGmEffectsBarPosition(raw: unknown): GmEffectsBarPosition {
  const obj = raw && typeof raw === 'object' ? (raw as { x?: unknown; y?: unknown }) : {};
  const x = Number(obj.x);
  const y = Number(obj.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { ...DEFAULT_GM_EFFECTS_BAR_POSITION };
  return { x: Math.round(x), y: Math.round(y) };
}

export function clampGmEffectsBarPosition(
  pos: GmEffectsBarPosition,
  viewport: { width: number; height: number },
  size: { width: number; height: number },
): GmEffectsBarPosition {
  const width = Math.max(0, Number(size.width) || 0);
  const height = Math.max(0, Number(size.height) || 0);
  const maxX = Math.max(BAR_EDGE_PAD, (Number(viewport.width) || 0) - width - BAR_EDGE_PAD);
  const maxY = Math.max(BAR_EDGE_PAD, (Number(viewport.height) || 0) - height - BAR_EDGE_PAD);
  return {
    x: Math.min(maxX, Math.max(BAR_EDGE_PAD, pos.x)),
    y: Math.min(maxY, Math.max(BAR_EDGE_PAD, pos.y)),
  };
}

export function registerGmEffectsBarSettings(): void {
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, GM_EFFECTS_BAR_COLLAPSED_SETTING, {
      name: 'GM Effects bar collapsed',
      scope: 'client',
      config: false,
      type: Boolean,
      default: false,
    });
    g.game.settings.register(FLAG_SCOPE, GM_EFFECTS_BAR_POSITION_SETTING, {
      name: 'GM Effects bar position',
      scope: 'client',
      config: false,
      type: Object,
      default: { ...DEFAULT_GM_EFFECTS_BAR_POSITION },
    });
  } catch (err) {
    console.warn('Mastery System | registerGmEffectsBarSettings failed', err);
  }
}

export function readGmEffectsBarCollapsed(): boolean {
  try {
    return !!(globalThis as any).game?.settings?.get?.(FLAG_SCOPE, GM_EFFECTS_BAR_COLLAPSED_SETTING);
  } catch {
    return false;
  }
}

export async function setGmEffectsBarCollapsed(collapsed: boolean): Promise<void> {
  try {
    await (globalThis as any).game?.settings?.set?.(FLAG_SCOPE, GM_EFFECTS_BAR_COLLAPSED_SETTING, !!collapsed);
  } catch (err) {
    console.warn('Mastery System | setGmEffectsBarCollapsed failed', err);
  }
}

export function readGmEffectsBarPosition(): GmEffectsBarPosition {
  try {
    return sanitizeGmEffectsBarPosition(
      (globalThis as any).game?.settings?.get?.(FLAG_SCOPE, GM_EFFECTS_BAR_POSITION_SETTING),
    );
  } catch {
    return { ...DEFAULT_GM_EFFECTS_BAR_POSITION };
  }
}

export async function setGmEffectsBarPosition(pos: GmEffectsBarPosition): Promise<void> {
  try {
    await (globalThis as any).game?.settings?.set?.(
      FLAG_SCOPE,
      GM_EFFECTS_BAR_POSITION_SETTING,
      sanitizeGmEffectsBarPosition(pos),
    );
  } catch (err) {
    console.warn('Mastery System | setGmEffectsBarPosition failed', err);
  }
}
