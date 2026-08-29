/**
 * Important NPCs released to players (portraits + names).
 * GM controls the roster; order is preserved in a world setting.
 */

export const KNOWN_NPCS_SETTING = 'knownNpcs';
export const KNOWN_NPCS_COLLAPSED_SETTING = 'knownNpcsBarCollapsed';
export const KNOWN_NPCS_POSITION_SETTING = 'knownNpcsBarPosition';
export const FLAG_SCOPE = 'mastery-system';

export interface KnownNpcsBarPosition {
  x: number;
  y: number;
}

export const DEFAULT_KNOWN_NPCS_BAR_POSITION: KnownNpcsBarPosition = { x: 90, y: 76 };
const BAR_EDGE_PAD = 8;

export interface KnownNpcsState {
  ids: string[];
}

export interface KnownNpcView {
  actorId: string;
  name: string;
  img: string;
  faction: string;
}

const EMPTY: KnownNpcsState = { ids: [] };

export function sanitizeKnownNpcIds(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as KnownNpcsState).ids)
      ? (raw as KnownNpcsState).ids
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of list) {
    const id = String(value || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function sanitizeKnownNpcsBarPosition(raw: unknown): KnownNpcsBarPosition {
  const obj = raw && typeof raw === 'object' ? (raw as { x?: unknown; y?: unknown }) : {};
  const x = Number(obj.x);
  const y = Number(obj.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { ...DEFAULT_KNOWN_NPCS_BAR_POSITION };
  return { x: Math.round(x), y: Math.round(y) };
}

export function clampKnownNpcsBarPosition(
  pos: KnownNpcsBarPosition,
  viewport: { width: number; height: number },
  size: { width: number; height: number },
): KnownNpcsBarPosition {
  const width = Math.max(0, Number(size.width) || 0);
  const height = Math.max(0, Number(size.height) || 0);
  const maxX = Math.max(BAR_EDGE_PAD, (Number(viewport.width) || 0) - width - BAR_EDGE_PAD);
  const maxY = Math.max(BAR_EDGE_PAD, (Number(viewport.height) || 0) - height - BAR_EDGE_PAD);
  return {
    x: Math.min(maxX, Math.max(BAR_EDGE_PAD, pos.x)),
    y: Math.min(maxY, Math.max(BAR_EDGE_PAD, pos.y)),
  };
}

function actorById(actors: { get?: (id: string) => any } | Iterable<any> | null | undefined, id: string): any {
  if (actors && typeof (actors as { get?: (id: string) => any }).get === 'function') {
    return (actors as { get: (id: string) => any }).get(id);
  }
  for (const actor of (actors as Iterable<any>) ?? []) {
    if (String(actor?.id || '') === id) return actor;
  }
  return null;
}

export function portraitSrcForActor(actor: any): string {
  const raw =
    actor?.img ||
    actor?.prototypeToken?.texture?.src ||
    actor?.texture?.src ||
    'icons/svg/mystery-man.svg';
  return String(raw || 'icons/svg/mystery-man.svg');
}

export function toKnownNpcView(actor: any): KnownNpcView | null {
  if (!actor || String(actor.type || '') !== 'npc') return null;
  const actorId = String(actor.id || '').trim();
  if (!actorId) return null;
  return {
    actorId,
    name: String(actor.name || 'NPC'),
    img: portraitSrcForActor(actor),
    faction: String(actor.system?.bio?.faction || '').trim(),
  };
}

export function collectReleasedKnownNpcs(
  actors: { get?: (id: string) => any } | Iterable<any> | null | undefined,
  ids: string[],
): KnownNpcView[] {
  const out: KnownNpcView[] = [];
  for (const id of sanitizeKnownNpcIds(ids)) {
    const view = toKnownNpcView(actorById(actors, id));
    if (view) out.push(view);
  }
  return out;
}

export function listNpcsForGmDialog(
  actors: Iterable<any> | null | undefined,
  releasedIds: string[],
): Array<KnownNpcView & { released: boolean }> {
  const order = sanitizeKnownNpcIds(releasedIds);
  const rank = new Map(order.map((id, i) => [id, i]));
  const released: Array<KnownNpcView & { released: boolean }> = [];
  const hidden: Array<KnownNpcView & { released: boolean }> = [];
  for (const actor of actors ?? []) {
    const view = toKnownNpcView(actor);
    if (!view) continue;
    if (rank.has(view.actorId)) released.push({ ...view, released: true });
    else hidden.push({ ...view, released: false });
  }
  released.sort((a, b) => (rank.get(a.actorId) ?? 0) - (rank.get(b.actorId) ?? 0));
  hidden.sort((a, b) => a.name.localeCompare(b.name));
  return [...released, ...hidden];
}

export function registerKnownNpcSettings(): void {
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, KNOWN_NPCS_SETTING, {
      name: 'Important NPCs',
      hint: 'Actor IDs the GM has released to the player portrait bar.',
      scope: 'world',
      config: false,
      type: Object,
      default: EMPTY,
    });
  } catch (err) {
    console.warn('Mastery System | knownNpcs setting register failed', err);
  }
  try {
    g.game.settings.register(FLAG_SCOPE, KNOWN_NPCS_COLLAPSED_SETTING, {
      name: 'Important NPCs bar collapsed',
      scope: 'client',
      config: false,
      type: Boolean,
      default: false,
    });
  } catch (err) {
    console.warn('Mastery System | knownNpcsBarCollapsed setting register failed', err);
  }
  try {
    g.game.settings.register(FLAG_SCOPE, KNOWN_NPCS_POSITION_SETTING, {
      name: 'Important NPCs bar position',
      scope: 'client',
      config: false,
      type: Object,
      default: DEFAULT_KNOWN_NPCS_BAR_POSITION,
    });
  } catch (err) {
    console.warn('Mastery System | knownNpcsBarPosition setting register failed', err);
  }
}

export function readKnownNpcIds(): string[] {
  const g = globalThis as any;
  try {
    return sanitizeKnownNpcIds(g.game?.settings?.get?.(FLAG_SCOPE, KNOWN_NPCS_SETTING));
  } catch {
    return [];
  }
}

export function isKnownNpcReleased(actorId: string): boolean {
  const id = String(actorId || '').trim();
  return !!id && readKnownNpcIds().includes(id);
}

async function writeKnownNpcIds(ids: string[]): Promise<string[]> {
  const next = sanitizeKnownNpcIds(ids);
  const g = globalThis as any;
  try {
    await g.game?.settings?.set?.(FLAG_SCOPE, KNOWN_NPCS_SETTING, { ids: next });
  } catch (err) {
    console.warn('Mastery System | knownNpcs set failed', err);
  }
  return next;
}

export async function setKnownNpcReleased(actorId: string, released: boolean): Promise<string[]> {
  const id = String(actorId || '').trim();
  const ids = readKnownNpcIds();
  if (!id) return ids;
  const has = ids.includes(id);
  if (released && !has) return writeKnownNpcIds([...ids, id]);
  if (!released && has) return writeKnownNpcIds(ids.filter((x) => x !== id));
  return ids;
}

export async function toggleKnownNpc(actorId: string): Promise<{ released: boolean; ids: string[] }> {
  const released = !isKnownNpcReleased(actorId);
  const ids = await setKnownNpcReleased(actorId, released);
  return { released, ids };
}

export async function moveKnownNpc(actorId: string, delta: -1 | 1): Promise<string[]> {
  const id = String(actorId || '').trim();
  const ids = readKnownNpcIds();
  const i = ids.indexOf(id);
  if (i < 0) return ids;
  const j = i + delta;
  if (j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  const swap = next[i];
  next[i] = next[j]!;
  next[j] = swap!;
  return writeKnownNpcIds(next);
}

export async function removeKnownNpc(actorId: string): Promise<string[]> {
  return setKnownNpcReleased(actorId, false);
}

export function readKnownNpcsBarCollapsed(): boolean {
  const g = globalThis as any;
  try {
    return !!g.game?.settings?.get?.(FLAG_SCOPE, KNOWN_NPCS_COLLAPSED_SETTING);
  } catch {
    return false;
  }
}

export async function setKnownNpcsBarCollapsed(collapsed: boolean): Promise<void> {
  const g = globalThis as any;
  try {
    await g.game?.settings?.set?.(FLAG_SCOPE, KNOWN_NPCS_COLLAPSED_SETTING, !!collapsed);
  } catch (err) {
    console.warn('Mastery System | knownNpcsBarCollapsed set failed', err);
  }
}

export function readKnownNpcsBarPosition(): KnownNpcsBarPosition {
  const g = globalThis as any;
  try {
    return sanitizeKnownNpcsBarPosition(g.game?.settings?.get?.(FLAG_SCOPE, KNOWN_NPCS_POSITION_SETTING));
  } catch {
    return { ...DEFAULT_KNOWN_NPCS_BAR_POSITION };
  }
}

export async function setKnownNpcsBarPosition(pos: KnownNpcsBarPosition): Promise<KnownNpcsBarPosition> {
  const next = sanitizeKnownNpcsBarPosition(pos);
  const g = globalThis as any;
  try {
    await g.game?.settings?.set?.(FLAG_SCOPE, KNOWN_NPCS_POSITION_SETTING, next);
  } catch (err) {
    console.warn('Mastery System | knownNpcsBarPosition set failed', err);
  }
  return next;
}
