/**
 * Dialog: choose Minor Expressions (cantrips) per attribute view, capped
 * by Mastery Rank globally, attribute ≥ 8.
 *
 * Players Guide 8273–8404 (Minor Expressions): each new pick costs **1
 * Reroll Point** and removing one refunds **1 Reroll Point**, capped at
 * the character's maximum Reroll-Point pool. The doc uses "Reroll
 * Points" while the data model historically named the field
 * `system.faithFractures` (see "Reroll Points — Fractures of Faith",
 * Players Guide 5496). The two terms refer to the **same** resource;
 * UI strings now show "Reroll Point" and the field name is preserved
 * for backward compatibility.
 */
import { type MinorExpressionAttribute } from '../utils/minor-expressions.js';
export declare function showMinorExpressionsDialog(actor: any, options: {
    focusAttribute: MinorExpressionAttribute;
}): Promise<void>;
//# sourceMappingURL=minor-expressions-dialog.d.ts.map