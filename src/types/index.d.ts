/**
 * Main type exports for Mastery System
 */

export * from './actor';
export * from './item';

// Roll result interface
export interface MasteryRollResult {
  total: number;
  dice: number[];
  kept: number[];
  skill: number;
  tn: number;
  raises: number;
  success: boolean;
  exploded: number[];
  /** Per pool die: individual d8 faces before summing (exploding 8s). Optional for older stored flags. */
  dieChains?: number[][];
}

// System constants
export interface SystemConstants {
  TNS: Record<string, number>;
  RAISE_INCREMENT: number;
  EXPLODE_VALUE: number;
}


















































