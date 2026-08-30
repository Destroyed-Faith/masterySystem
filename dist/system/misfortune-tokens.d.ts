/**
 * Shared Misfortune Token pool (world setting).
 * Filled by Unluck at session start and by Stress Breakdown “Push It Down”.
 */
export declare const MISFORTUNE_SETTING = "misfortuneTokens";
export declare const FLAG_SCOPE = "mastery-system";
export declare function registerMisfortuneTokenSettings(): void;
export declare function readMisfortuneTokens(): number;
export declare function setMisfortuneTokens(amount: number): Promise<number>;
export declare function addMisfortuneTokens(amount: number): Promise<number>;
export declare function spendMisfortuneTokens(amount?: number): Promise<{
    ok: true;
    remaining: number;
} | {
    ok: false;
    remaining: number;
}>;
//# sourceMappingURL=misfortune-tokens.d.ts.map