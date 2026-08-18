/**
 * Read and write native Foundry WallDocuments. The editor never invents its
 * own collision or vision rules — it only maps our three kinds onto V14 fields.
 */

import type { DoorState, EditorWallView, GeometryKind, Point, WallOrigin } from './types.js';
import { SCENE_EDITOR_WALL_FLAG } from './types.js';

const SYSTEM = 'mastery-system';

function wallConst(group: string, key: string, fallback: number): number {
  const table = (globalThis as any).CONST?.[group];
  const value = table?.[key];
  return typeof value === 'number' ? value : fallback;
}

export function wallDoorTypes() {
  return {
    NONE: wallConst('WALL_DOOR_TYPES', 'NONE', 0),
    DOOR: wallConst('WALL_DOOR_TYPES', 'DOOR', 1),
    SECRET: wallConst('WALL_DOOR_TYPES', 'SECRET', 2),
  };
}

export function wallDoorStates() {
  return {
    CLOSED: wallConst('WALL_DOOR_STATES', 'CLOSED', 0),
    OPEN: wallConst('WALL_DOOR_STATES', 'OPEN', 1),
    LOCKED: wallConst('WALL_DOOR_STATES', 'LOCKED', 2),
  };
}

export function wallSense() {
  return {
    NONE: wallConst('WALL_SENSE_TYPES', 'NONE', 0),
    LIMITED: wallConst('WALL_SENSE_TYPES', 'LIMITED', 10),
    NORMAL: wallConst('WALL_SENSE_TYPES', 'NORMAL', 20),
    PROXIMITY: wallConst('WALL_SENSE_TYPES', 'PROXIMITY', 30),
  };
}

export function wallMove() {
  return {
    NONE: wallConst('WALL_MOVEMENT_TYPES', 'NONE', 0),
    NORMAL: wallConst('WALL_MOVEMENT_TYPES', 'NORMAL', 20),
  };
}

/** Central window defaults — proximity vision, movement still blocked. */
export const WINDOW_THRESHOLD = {
  sight: 10,
  light: 10,
  sound: 0,
  attenuation: true,
};

export function coordsOf(wall: any): [Point, Point] {
  const c = Array.isArray(wall?.c) ? wall.c : wall?.document?.c;
  const nums = (c ?? [0, 0, 0, 0]).map((n: unknown) => Number(n) || 0);
  return [
    { x: nums[0] ?? 0, y: nums[1] ?? 0 },
    { x: nums[2] ?? 0, y: nums[3] ?? 0 },
  ];
}

export function classifyWall(wall: any): { kind: GeometryKind; doorState: DoorState | null; secret: boolean } {
  const doors = wallDoorTypes();
  const states = wallDoorStates();
  const sense = wallSense();
  const door = Number(wall.door ?? 0);
  const ds = Number(wall.ds ?? 0);
  if (door === doors.DOOR || door === doors.SECRET) {
    const doorState: DoorState =
      ds === states.OPEN ? 'open' : ds === states.LOCKED ? 'locked' : 'closed';
    return { kind: 'door', doorState, secret: door === doors.SECRET };
  }
  const sight = Number(wall.sight ?? sense.NORMAL);
  const light = Number(wall.light ?? sense.NORMAL);
  // Only proximity walls are windows. Limited/terrain walls stay "wall" so the
  // editor does not rewrite Foundry types it did not create.
  const isWindow = sight === sense.PROXIMITY || light === sense.PROXIMITY;
  if (isWindow) return { kind: 'window', doorState: null, secret: false };
  return { kind: 'wall', doorState: null, secret: false };
}

export function readWallView(wall: any): EditorWallView {
  const [a, b] = coordsOf(wall);
  const cls = classifyWall(wall);
  return {
    id: String(wall.id ?? wall._id ?? ''),
    a,
    b,
    kind: cls.kind,
    doorState: cls.doorState,
    secret: cls.secret,
    extra: {},
  };
}

export function readSceneWalls(scene: any): EditorWallView[] {
  const walls = scene?.walls;
  const list = walls?.contents ?? (typeof walls === 'object' ? Array.from(walls) : []);
  return (list as any[]).filter((w) => w).map(readWallView);
}

function typeFields(kind: GeometryKind, doorState: DoorState | null = 'closed'): Record<string, unknown> {
  const doors = wallDoorTypes();
  const states = wallDoorStates();
  const sense = wallSense();
  const move = wallMove();
  if (kind === 'door') {
    const ds =
      doorState === 'open' ? states.OPEN : doorState === 'locked' ? states.LOCKED : states.CLOSED;
    return {
      door: doors.DOOR,
      ds,
      move: move.NORMAL,
      sight: sense.NORMAL,
      light: sense.NORMAL,
      sound: sense.NORMAL,
    };
  }
  if (kind === 'window') {
    const prox = sense.PROXIMITY || sense.LIMITED;
    return {
      door: doors.NONE,
      ds: states.CLOSED,
      move: move.NORMAL,
      sight: prox,
      light: prox,
      sound: sense.NONE,
      threshold: { ...WINDOW_THRESHOLD },
    };
  }
  return {
    door: doors.NONE,
    ds: states.CLOSED,
    move: move.NORMAL,
    sight: sense.NORMAL,
    light: sense.NORMAL,
    sound: sense.NORMAL,
  };
}

export function wallPayload(
  a: Point,
  b: Point,
  kind: GeometryKind,
  options: { doorState?: DoorState | null; origin?: WallOrigin; suggestionId?: string } = {},
): Record<string, unknown> {
  const fields = typeFields(kind, options.doorState ?? 'closed');
  const flags: Record<string, unknown> = {
    origin: options.origin ?? 'manual',
    created: Date.now(),
  };
  if (options.suggestionId) flags.suggestionId = options.suggestionId;
  return {
    c: [a.x, a.y, b.x, b.y],
    ...fields,
    flags: { [SYSTEM]: { [SCENE_EDITOR_WALL_FLAG]: flags } },
  };
}

export function typeChangePatch(kind: GeometryKind, doorState: DoorState | null = 'closed'): Record<string, unknown> {
  return typeFields(kind, doorState);
}

export function doorStatePatch(state: DoorState): Record<string, unknown> {
  const states = wallDoorStates();
  const ds = state === 'open' ? states.OPEN : state === 'locked' ? states.LOCKED : states.CLOSED;
  return { ds };
}

export function coordPatch(a: Point, b: Point): Record<string, unknown> {
  return { c: [a.x, a.y, b.x, b.y] };
}

export async function createWalls(scene: any, payloads: Record<string, unknown>[]): Promise<any[]> {
  if (!scene || !payloads.length) return [];
  return (await scene.createEmbeddedDocuments('Wall', payloads, { keepId: false })) ?? [];
}

export async function updateWalls(scene: any, updates: Array<{ _id: string } & Record<string, unknown>>): Promise<any[]> {
  if (!scene || !updates.length) return [];
  return (await scene.updateEmbeddedDocuments('Wall', updates)) ?? [];
}

export async function deleteWalls(scene: any, ids: string[]): Promise<any[]> {
  if (!scene || !ids.length) return [];
  return (await scene.deleteEmbeddedDocuments('Wall', ids)) ?? [];
}

export function snapshotWall(wall: any): Record<string, unknown> {
  const src = wall.toObject ? wall.toObject() : { ...wall };
  return foundry.utils.deepClone ? foundry.utils.deepClone(src) : JSON.parse(JSON.stringify(src));
}

export function activeScene(): any | null {
  return (globalThis as any).canvas?.scene ?? (globalThis as any).game?.scenes?.active ?? null;
}
