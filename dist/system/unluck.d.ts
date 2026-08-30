/**
 * Unluck — session-start Misfortune Tokens (Players Guide).
 *
 * Rank 1 → 1d8 / 2, Rank 2 → 1d8, Rank 3 → 2d8.
 * Rolls are automatic; the GM menu starts a session and spends tokens.
 */
export declare const UNLUCK_SESSION_SETTING = "unluckSession";
export declare const UNLUCK_SPEND_REASONS: readonly [{
    readonly id: "worsen-fail";
    readonly label: "Worsen a failed roll";
}, {
    readonly id: "obstacle";
    readonly label: "Unlikely narrative obstacle";
}, {
    readonly id: "complication";
    readonly label: "Inconvenient complication";
}, {
    readonly id: "ally";
    readonly label: "Affect an ally caught in the bad luck";
}, {
    readonly id: "worse";
    readonly label: "Make a bad situation worse";
}];
export type UnluckSpendReasonId = (typeof UNLUCK_SPEND_REASONS)[number]['id'];
export interface UnluckDiceSpec {
    formula: string;
    divideBy: number;
    label: string;
}
export interface UnluckCharacter {
    actorId: string;
    name: string;
    rank: number;
}
export interface UnluckSessionRoll {
    actorId: string;
    name: string;
    rank: number;
    formula: string;
    diceTotal: number;
    tokens: number;
}
export interface UnluckSessionState {
    rolled: boolean;
    rolledAt: number;
    rolls: UnluckSessionRoll[];
    added: number;
}
export declare function unluckRankFromDetails(details: unknown): number;
export declare function unluckDiceSpec(rank: number): UnluckDiceSpec;
export declare function tokensFromUnluckDice(diceTotal: number, divideBy: number): number;
export declare function collectUnluckCharacters(actors: Iterable<any>): UnluckCharacter[];
export declare function registerUnluckSettings(): void;
export declare function readUnluckSession(): UnluckSessionState;
export declare function clearUnluckSession(): Promise<void>;
export declare function spendReasonLabel(reasonId: string): string;
export declare function rollUnluckForSession(opts?: {
    actors?: Iterable<any>;
    force?: boolean;
}): Promise<{
    alreadyRolled: boolean;
    added: number;
    rolls: UnluckSessionRoll[];
    totalTokens: number;
}>;
//# sourceMappingURL=unluck.d.ts.map