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
}

// System constants
export interface SystemConstants {
  TNS: Record<string, number>;
  RAISE_INCREMENT: number;
  EXPLODE_VALUE: number;
}





























