/**
 * GM dialogs for carousel Special apply / area apply.
 */
import { type GmEffectTargetRef } from '../combat/gm-effect-service.js';
export declare function openGmApplySpecialDialog(targets: GmEffectTargetRef[]): Promise<void>;
export declare function openGmRemoveSpecialDialog(targets: GmEffectTargetRef[]): Promise<void>;
export declare function openGmAdjustSpecialDialog(targets: GmEffectTargetRef[]): Promise<void>;
export declare function openGmApplyToAreaDialog(selected: GmEffectTargetRef[]): Promise<void>;
export declare function requestUndoLastGmEffect(): Promise<void>;
//# sourceMappingURL=gm-effect-dialogs.d.ts.map