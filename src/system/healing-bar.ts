/**
 * Healing bar — pure state for the floating panel (same chrome as Minor
 * Expressions). Resolve Healing is a prepared Round charge. Passive:
 * Restoration is a separate Tyhran-day Scarred-Bar pool.
 */

const FLAG_SCOPE = 'mastery-system';

export const HEALING_BAR_COLLAPSED_SETTING = 'healingBarCollapsed';
export const HEALING_BAR_POSITION_SETTING = 'healingBarPosition';
export const HEALING_BAR_HIDDEN_SETTING = 'healingBarHidden';

export interface HealingBarPosition {
  x: number;
  y: number;
}

export const DEFAULT_HEALING_BAR_POSITION: HealingBarPosition = { x: 90, y: 214 };
const BAR_EDGE_PAD = 8;

export type ResolveHealBarStatus = 'ready' | 'spent' | 'idle';

export interface HealingBarModel {
  resolveStatus: ResolveHealBarStatus;
  /** `8d8 within 4 m` when a rank is prepared, otherwise a status sentence. */
  resolveDetail: string;
  resolveCanUse: boolean;
  restorationVisible: boolean;
  restorationRemaining: number;
  restorationPoolMax: number;
  restorationScarred: number;
  restorationCanUse: boolean;
  restorationDetail: string;
  /** Collapsed grip, e.g. `Heal 8d8 · Rest 1/2`. */
  handleLabel: string;
  show: boolean;
}

export function sanitizeHealingBarPosition(raw: unknown): HealingBarPosition {
  const obj = raw && typeof raw === 'object' ? (raw as { x?: unknown; y?: unknown }) : {};
  const x = Number(obj.x);
  const y = Number(obj.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { ...DEFAULT_HEALING_BAR_POSITION };
  return { x: Math.round(x), y: Math.round(y) };
}

export function clampHealingBarPosition(
  pos: HealingBarPosition,
  viewport: { width: number; height: number },
  size: { width: number; height: number },
): HealingBarPosition {
  const width = Math.max(0, Number(size.width) || 0);
  const height = Math.max(0, Number(size.height) || 0);
  const maxX = Math.max(BAR_EDGE_PAD, (Number(viewport.width) || 0) - width - BAR_EDGE_PAD);
  const maxY = Math.max(BAR_EDGE_PAD, (Number(viewport.height) || 0) - height - BAR_EDGE_PAD);
  return {
    x: Math.min(maxX, Math.max(BAR_EDGE_PAD, pos.x)),
    y: Math.min(maxY, Math.max(BAR_EDGE_PAD, pos.y)),
  };
}

export function healingHandleLabel(args: {
  resolveStatus: ResolveHealBarStatus;
  dice: number;
  inCombat: boolean;
  poolMax: number;
  remaining: number;
}): string {
  const parts: string[] = [];
  const showHeal = args.inCombat || args.resolveStatus !== 'idle';
  if (showHeal) {
    if (args.resolveStatus === 'ready' && args.dice > 0) parts.push(`Heal ${args.dice}d8`);
    else if (args.resolveStatus === 'spent') parts.push('Heal used');
    else parts.push('Heal —');
  }
  if (args.poolMax > 0) parts.push(`Rest ${Math.max(0, args.remaining)}/${args.poolMax}`);
  return parts.join(' · ');
}

export function buildHealingBarModel(args: {
  resolveStatus: ResolveHealBarStatus;
  resolveDetail: string;
  dice: number;
  inCombat: boolean;
  restoration: { poolMax: number; remaining: number; scarred: number; blocked: boolean };
}): HealingBarModel {
  const poolMax = Math.max(0, Math.floor(Number(args.restoration.poolMax) || 0));
  const remaining = Math.max(0, Math.min(poolMax, Math.floor(Number(args.restoration.remaining) || 0)));
  const scarred = Math.max(0, Math.floor(Number(args.restoration.scarred) || 0));
  const restorationVisible = poolMax > 0;
  const show = args.inCombat || args.resolveStatus !== 'idle' || restorationVisible;
  return {
    resolveStatus: args.resolveStatus,
    resolveDetail: args.resolveDetail,
    resolveCanUse: args.resolveStatus === 'ready',
    restorationVisible,
    restorationRemaining: remaining,
    restorationPoolMax: poolMax,
    restorationScarred: scarred,
    restorationCanUse: restorationVisible && remaining > 0 && scarred > 0 && !args.restoration.blocked,
    restorationDetail: restorationVisible
      ? `${remaining}/${poolMax} Scarred Bars left today. Scarred now: ${scarred}.`
      : '',
    handleLabel: healingHandleLabel({
      resolveStatus: args.resolveStatus,
      dice: Math.max(0, Math.floor(Number(args.dice) || 0)),
      inCombat: args.inCombat,
      poolMax,
      remaining,
    }),
    show,
  };
}

export function registerHealingBarSettings(): void {
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, HEALING_BAR_COLLAPSED_SETTING, {
      name: 'Healing bar collapsed',
      scope: 'client',
      config: false,
      type: Boolean,
      default: false,
    });
    g.game.settings.register(FLAG_SCOPE, HEALING_BAR_POSITION_SETTING, {
      name: 'Healing bar position',
      scope: 'client',
      config: false,
      type: Object,
      default: { ...DEFAULT_HEALING_BAR_POSITION },
    });
    g.game.settings.register(FLAG_SCOPE, HEALING_BAR_HIDDEN_SETTING, {
      name: 'Healing bar',
      hint: 'Hide the floating Healing panel on this client.',
      scope: 'client',
      config: true,
      type: Boolean,
      default: false,
      onChange: () => {
        try {
          g.Hooks?.callAll?.('masteryHealingBarRefresh');
        } catch {
          /* ignore */
        }
      },
    });
  } catch (err) {
    console.warn('Mastery System | registerHealingBarSettings failed', err);
  }
}

export function readHealingBarCollapsed(): boolean {
  try {
    return !!(globalThis as any).game?.settings?.get?.(FLAG_SCOPE, HEALING_BAR_COLLAPSED_SETTING);
  } catch {
    return false;
  }
}

export async function setHealingBarCollapsed(collapsed: boolean): Promise<void> {
  try {
    await (globalThis as any).game?.settings?.set?.(FLAG_SCOPE, HEALING_BAR_COLLAPSED_SETTING, !!collapsed);
  } catch (err) {
    console.warn('Mastery System | setHealingBarCollapsed failed', err);
  }
}

export function readHealingBarHidden(): boolean {
  try {
    return !!(globalThis as any).game?.settings?.get?.(FLAG_SCOPE, HEALING_BAR_HIDDEN_SETTING);
  } catch {
    return false;
  }
}

export async function setHealingBarHidden(hidden: boolean): Promise<void> {
  try {
    await (globalThis as any).game?.settings?.set?.(FLAG_SCOPE, HEALING_BAR_HIDDEN_SETTING, !!hidden);
  } catch (err) {
    console.warn('Mastery System | setHealingBarHidden failed', err);
  }
}

export function readHealingBarPosition(): HealingBarPosition {
  try {
    return sanitizeHealingBarPosition(
      (globalThis as any).game?.settings?.get?.(FLAG_SCOPE, HEALING_BAR_POSITION_SETTING),
    );
  } catch {
    return { ...DEFAULT_HEALING_BAR_POSITION };
  }
}

export async function setHealingBarPosition(pos: HealingBarPosition): Promise<void> {
  try {
    await (globalThis as any).game?.settings?.set?.(
      FLAG_SCOPE,
      HEALING_BAR_POSITION_SETTING,
      sanitizeHealingBarPosition(pos),
    );
  } catch (err) {
    console.warn('Mastery System | setHealingBarPosition failed', err);
  }
}

/**
 * Player: assigned character, else the first owned character.
 * GM: the selected character token, else the assigned character.
 */
export function resolveHealingBarActor(user: any, actors: Iterable<any> | null | undefined, selected: any): any | null {
  if (!user) return null;
  const selectedActor = selected?.type ? selected : selected?.actor ?? null;
  if (user.isGM) {
    if (selectedActor && String(selectedActor.type || '') === 'character') return selectedActor;
    if (user.character && String(user.character.type || '') === 'character') return user.character;
    return null;
  }
  if (user.character && String(user.character.type || '') === 'character') return user.character;
  for (const actor of actors ?? []) {
    if (String(actor?.type || '') !== 'character') continue;
    if (actor?.isOwner || actor?.testUserPermission?.(user, 'OWNER')) return actor;
  }
  return null;
}
