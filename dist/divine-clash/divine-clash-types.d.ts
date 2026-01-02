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
    seatIndex: number;
    actorId: string | null;
    userId: string | null;
    isEnemy: boolean;
}
/**
 * Divine Clash scene flags structure
 */
export interface DivineClashSceneFlags {
    phase: DivineClashPhase;
    seats: Record<number, DivineClashSeat>;
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
    isPlayer?: boolean;
    playerIndex?: number;
    stoneKind?: StoneKind;
    seatIndex?: number;
    seatUserId?: string | null;
    state?: StoneState;
    stoneIndex?: number;
}
//# sourceMappingURL=divine-clash-types.d.ts.map