/**
 * Runtime constant for the 1..16 power/spell level keys. Defined here rather
 * than in `item.d.ts` because `.d.ts` files may not hold value declarations.
 */

import type { PowerLevelKey } from './item.js';

export const POWER_LEVEL_KEYS: readonly PowerLevelKey[] = [
    '1', '2', '3', '4', '5', '6', '7', '8',
    '9', '10', '11', '12', '13', '14', '15', '16',
] as const;
