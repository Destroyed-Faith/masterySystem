/**
 * Minor Expressions bar — pure state + row builder for the floating player
 * panel (mirrors the Important NPCs bar). Lists the character's chosen Minor
 * Expressions with the resolved tier text and tracks uses per Safe Haven Rest
 * (Mastery Rank × 2, as on the print sheet).
 */
import { type MinorExpressionAttribute } from '../utils/minor-expressions.js';
export declare const FLAG_SCOPE = "mastery-system";
export declare const MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING = "minorExpressionsBarCollapsed";
export declare const MINOR_EXPRESSIONS_BAR_POSITION_SETTING = "minorExpressionsBarPosition";
export declare const MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING = "minorExpressionsBarHidden";
/** Actor flag: uses since the last Safe Haven Rest. */
export declare const MINOR_EXPRESSION_USES_FLAG = "minorExpressionUses";
export interface MinorExpressionsBarPosition {
    x: number;
    y: number;
}
export declare const DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION: MinorExpressionsBarPosition;
export interface MinorExpressionBarRow {
    id: string;
    name: string;
    attribute: MinorExpressionAttribute;
    attributeLabel: string;
    attributeValue: number;
    /** Resolved tier threshold (2/4/6/8/10) or null below the minimum. */
    tier: number | null;
    tagline: string;
    constraints: string;
    /** Effect text at the current tier (tagline when locked). */
    body: string;
}
export interface MinorExpressionsBarModel {
    rows: MinorExpressionBarRow[];
    masteryRank: number;
    usesMax: number;
    usesSpent: number;
    usesLeft: number;
}
export declare function sanitizeMinorExpressionsBarPosition(raw: unknown): MinorExpressionsBarPosition;
export declare function clampMinorExpressionsBarPosition(pos: MinorExpressionsBarPosition, viewport: {
    width: number;
    height: number;
}, size: {
    width: number;
    height: number;
}): MinorExpressionsBarPosition;
/** Uses per Safe Haven Rest: Mastery Rank × 2 (print sheet rule). */
export declare function minorExpressionUsesMax(masteryRank: number): number;
export declare function readMinorExpressionUses(actor: any): number;
/** Rows + use budget for one character actor (system data only, no Foundry globals). */
export declare function buildMinorExpressionsBarModel(actor: any): MinorExpressionsBarModel;
/**
 * Character shown on this client's bar: the user's assigned character, else
 * the first owned world character. GM gets nothing (the bar is a player aid).
 */
export declare function resolveMinorExpressionsBarActor(user: any, actors: Iterable<any> | null | undefined): any | null;
export declare function registerMinorExpressionsBarSettings(): void;
export declare function readMinorExpressionsBarCollapsed(): boolean;
export declare function setMinorExpressionsBarCollapsed(collapsed: boolean): Promise<void>;
export declare function readMinorExpressionsBarHidden(): boolean;
export declare function setMinorExpressionsBarHidden(hidden: boolean): Promise<void>;
export declare function readMinorExpressionsBarPosition(): MinorExpressionsBarPosition;
export declare function setMinorExpressionsBarPosition(pos: MinorExpressionsBarPosition): Promise<void>;
//# sourceMappingURL=minor-expressions-bar.d.ts.map