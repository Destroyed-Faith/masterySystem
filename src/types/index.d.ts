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
  /**
   * When set, the roll was forced to `success: false` by an auto-fail
   * condition (e.g. `'blinded-sight'` when a Blinded actor tried a
   * sight-tagged check). The dice are still rolled and displayed, but
   * `success` and `raises` reflect the forced failure.
   */
  autoFailReason?: string;
  /**
   * Number of voluntary Auto-Raises the roller bought by shrinking their
   * pool (each costs AUTO_RAISE_DICE_COST dice and grants +1 raise on
   * success). Already folded into `raises`; exposed for display/audit.
   */
  autoRaises?: number;
}

// System constants
export interface SystemConstants {
  TNS: Record<string, number>;
  RAISE_INCREMENT: number;
  EXPLODE_VALUE: number;
}


















































