/**
 * Global Limited Power charge — exactly one declaration per Safe Haven Rest.
 *
 * Shared by every Limited Active (learned, Echo Artifact, general Artifact).
 * Spent at attack declaration (createAttackCard), even on miss / resisted spell /
 * empty Instant AoE. Cleared only by Safe Haven Rest.
 */
export declare const LIMITED_CHARGE_FLAG = "limitedChargeSpent";
/** Canonical Limited Active template ids (exactly four Instant Damage deliveries). */
export declare const LIMITED_POWER_TEMPLATE_IDS: readonly ["active-melee-limited-single", "active-ranged-limited-single", "active-melee-limited-aoe", "active-ranged-limited-aoe"];
export type LimitedPowerTemplateId = (typeof LIMITED_POWER_TEMPLATE_IDS)[number];
export declare function isLimitedPowerTemplateId(templateId: unknown): boolean;
/** Templates that must never be Limited (catalogue gate + runtime refuse). */
export declare function isForbiddenLimitedTemplateId(templateId: unknown): boolean;
/**
 * True when this attack declaration is a Limited Instant Damage Attack.
 * Prefers mechanical flags / Limited template ids; never trusts description alone.
 */
export declare function isLimitedAttackDeclaration(opts: {
    limited?: boolean;
    artifactLimited?: boolean;
    templateId?: string | null;
    item?: {
        system?: {
            limited?: boolean;
            templateId?: string;
        };
    } | null;
}): boolean;
/** Remaining global Limited declarations (0 or 1). */
export declare function limitedChargeRemaining(actor: any): number;
export declare function isLimitedChargeAvailable(actor: any): boolean;
/**
 * Spend the one global Limited charge at declaration.
 * Idempotent for the same declaration via `alreadySpentOnOption` (card recreate).
 */
export declare function spendLimitedCharge(actor: any, opts?: {
    alreadySpentOnOption?: boolean;
}): Promise<{
    ok: true;
    remaining: number;
} | {
    ok: false;
    reason: 'exhausted' | 'missing-actor';
}>;
/** Safe Haven Rest only — never combat end / preparation / level-up. */
export declare function clearLimitedCharge(actor: any): Promise<void>;
//# sourceMappingURL=limited-charge.d.ts.map