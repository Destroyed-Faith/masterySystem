/**
 * DF 2026 — Aid retired.
 *
 * The Players Guide does not define Aid as a Basic Reaction or a +4 Final
 * Result bonus. Active Aid is removed from gameplay.
 *
 * This module only strips leftover `aid-skill-check` buttons from historical
 * chat cards so old messages cannot grant a bonus. It does not apply Aid.
 */
/** Strip Aid buttons from rendered chat HTML (legacy cards). No bonus apply. */
export declare function registerAidReactionClickHandler(): void;
//# sourceMappingURL=aid-reaction-handler.d.ts.map