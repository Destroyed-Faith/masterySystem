/**
 * Small helpers for d8-only damage formulas used by Raise Cost / Power snapshots.
 */
/** Parse the d8 count from strings like "8d8", "0", "2d8+1d8". Returns 0 when unparseable. */
export declare function parseD8Count(formula: string | number | null | undefined): number;
/** Format a non-negative d8 count as `"Nd8"` (0 → `"0"`). */
export declare function formatD8Count(count: number): string;
export declare function clampAtZero(n: number): number;
/** Add d8 counts and return a formula string. */
export declare function addD8Formulas(a: string, extraDice: number): string;
//# sourceMappingURL=dice-formula.d.ts.map