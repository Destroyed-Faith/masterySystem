/**
 * Divine Clash Types and Interfaces
 * Type definitions for the Divine Clash board automation system
 */

/**
 * Divine Clash phase
 */
export type DivineClashPhase = 'planning' | 'reveal';

/**
 * Stone kind (Power or Vitality)
 */
export type StoneKind = 'power' | 'vitality';

/**
 * Stone state (which zone the stone is in)
 */
export type StoneState = 'ready' | 'attack' | 'defense' | 'exhausted' | 'vitality' | 'burned';

/**
 * Seat information stored in scene flags
 */
export interface DivineClashSeat {
  seatIndex: number; // 0 = Enemy, 1..N = Players
  actorId: string | null; // Actor ID (null for enemy if not spawned)
  userId: string | null; // User ID who owns this seat (null for enemy/GM)
  isEnemy: boolean; // true for seat 0
}

/**
 * Divine Clash scene flags structure
 */
export interface DivineClashSceneFlags {
  phase: DivineClashPhase;
  seats: Record<number, DivineClashSeat>; // seatIndex -> seat info
  started: boolean;
}

/**
 * Region information (from Foundry Regions)
 */
export interface RegionInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Token flag structure for Divine Clash tokens
 */
export interface DivineClashTokenFlags {
  isStone?: boolean;
  isAvatar?: boolean;
  stoneKind?: StoneKind;
  seatIndex?: number;
  seatUserId?: string | null; // User who owns this stone (null for GM/enemy)
  state?: StoneState;
}

