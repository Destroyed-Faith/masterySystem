/**
 * Confirm the one-time v0.9.9 Attribute respec and Stone reassignment.
 * Pure validation so the dialog and tests share one rule.
 */
import { type AttributeKeyName } from './v099-rules.js';
export interface V099RespecInput {
    lifetimeXp?: number | null;
    starting: Record<string, number>;
    attributes: Record<string, number>;
    stones: Record<string, number>;
    permanentColorless?: number;
    stoneSlotOrder?: readonly (string | null)[] | null;
}
export interface V099RespecPlan {
    ok: boolean;
    reason?: string;
    lifetimeXp: number;
    permanentStones: number;
    spentAttributeXp: number;
    leftoverAttributeXp: number;
    permanentColorless: number;
    stoneSlotOrder: string[] | null;
    starting: Record<AttributeKeyName, number>;
    attributes: Record<AttributeKeyName, number>;
    stones: Record<AttributeKeyName, number>;
}
export declare function planV099Respec(actor: any, input: V099RespecInput): V099RespecPlan;
export declare function v099RespecUpdate(actor: any, plan: V099RespecPlan): Record<string, unknown>;
//# sourceMappingURL=v099-respec.d.ts.map