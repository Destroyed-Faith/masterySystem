/**
 * @deprecated Minor Expressions are replaced by Echo Imprints (DF Guide 2026-10-23).
 * Superseded by `echo-imprints-dialog.ts` (character sheet, scene controls).
 * No live path imports this module any more; it remains only for rollback /
 * archive review of legacy `system.minorExpressions` data. Do not wire new UI to it.
 */
import { type MinorExpressionAttribute } from '../utils/minor-expressions.js';
export declare function showMinorExpressionsDialog(actor: any, options: {
    focusAttribute: MinorExpressionAttribute;
}): Promise<void>;
//# sourceMappingURL=minor-expressions-dialog.d.ts.map