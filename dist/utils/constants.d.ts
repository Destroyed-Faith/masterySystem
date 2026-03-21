/**
 * Constants for the Mastery System
 * Based on Player's Guide v0.5.26
 */
export declare const EXPLODE_VALUE = 8;
export declare const RAISE_INCREMENT = 4;
export declare const MIN_ATTRIBUTE = 0;
export declare const MAX_ATTRIBUTE = 80;
export declare const ATTACK_ACTIONS_PER_TURN = 1;
export declare const REACTIONS_PER_ROUND = 1;
export declare const MOVEMENT_PER_TURN = 1;
export declare const HEALTH_BARS_COUNT = 4;
export declare const HEALTH_PENALTIES: number[];
export declare const MAX_MASTERY_RANK = 8;
export declare const INITIATIVE_SHOP: {
    MOVEMENT: {
        COST: number;
        INCREMENT: number;
    };
    SWAP: {
        COST: number;
    };
    EXTRA_REACTION: {
        COST: number;
    };
    REMOVE_STRESS: {
        COST: number;
    };
    EXTRA_ATTACK: {
        COST: number;
    };
};
export declare const CREATION: {
    ATTRIBUTE_DISTRIBUTION: readonly number[];
    ATTRIBUTE_ALLOWED_VALUES: readonly number[];
    SKILL_POINTS: number;
    MAX_ATTRIBUTE_AT_CREATION: number;
    MAX_SKILL_AT_CREATION: number;
    MAX_DISADVANTAGE_POINTS: number;
};
export declare const XP_COSTS: {
    ATTRIBUTE: {
        min: number;
        max: number;
        cost: number;
    }[];
    SKILL_PER_RANK: number;
    POWER_LEVEL: number[];
    NEW_TREE: number;
    ARTIFACT_ACCESS: number;
    ARTIFACT_LEVEL: number;
};
export declare const MR_ADVANCEMENT: {
    stones: number;
    mr: number;
    tier: string;
}[];
export declare const SAVING_THROWS: {
    body: string[];
    mind: string[];
    spirit: string[];
};
export declare const SAVE_DC_BY_MR: Record<number, number>;
export declare const ECHO_SPEEDS: Record<string, number>;
//# sourceMappingURL=constants.d.ts.map