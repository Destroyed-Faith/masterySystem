/**
 * Healing bar — pure state for the floating panel (same chrome as Minor
 * Expressions). Resolve Healing is a prepared Round charge. Passive:
 * Restoration is a separate Tyhran-day Scarred-Bar pool.
 */
export declare const HEALING_BAR_COLLAPSED_SETTING = "healingBarCollapsed";
export declare const HEALING_BAR_POSITION_SETTING = "healingBarPosition";
export declare const HEALING_BAR_HIDDEN_SETTING = "healingBarHidden";
export interface HealingBarPosition {
    x: number;
    y: number;
}
export declare const DEFAULT_HEALING_BAR_POSITION: HealingBarPosition;
export type ResolveHealBarStatus = 'ready' | 'spent' | 'idle';
export interface HealingBarModel {
    resolveStatus: ResolveHealBarStatus;
    /** `8d8 within 4 m` when a rank is prepared, otherwise a status sentence. */
    resolveDetail: string;
    resolveCanUse: boolean;
    restorationVisible: boolean;
    restorationRemaining: number;
    restorationPoolMax: number;
    restorationScarred: number;
    restorationCanUse: boolean;
    restorationDetail: string;
    /** Collapsed grip, e.g. `Heal 8d8 · Rest 1/2`. */
    handleLabel: string;
    show: boolean;
}
export declare function sanitizeHealingBarPosition(raw: unknown): HealingBarPosition;
export declare function clampHealingBarPosition(pos: HealingBarPosition, viewport: {
    width: number;
    height: number;
}, size: {
    width: number;
    height: number;
}): HealingBarPosition;
export declare function healingHandleLabel(args: {
    resolveStatus: ResolveHealBarStatus;
    dice: number;
    inCombat: boolean;
    owned: boolean;
    poolMax: number;
    remaining: number;
}): string;
export declare function buildHealingBarModel(args: {
    resolveStatus: ResolveHealBarStatus;
    resolveDetail: string;
    dice: number;
    inCombat: boolean;
    restoration: {
        owned: boolean;
        poolMax: number;
        remaining: number;
        scarred: number;
        blocked: boolean;
    };
}): HealingBarModel;
export declare function registerHealingBarSettings(): void;
export declare function readHealingBarCollapsed(): boolean;
export declare function setHealingBarCollapsed(collapsed: boolean): Promise<void>;
export declare function readHealingBarHidden(): boolean;
export declare function setHealingBarHidden(hidden: boolean): Promise<void>;
export declare function readHealingBarPosition(): HealingBarPosition;
export declare function setHealingBarPosition(pos: HealingBarPosition): Promise<void>;
/**
 * Player: assigned character, else the first owned character.
 * GM: the selected character token, else the assigned character.
 */
export declare function resolveHealingBarActor(user: any, actors: Iterable<any> | null | undefined, selected: any): any | null;
//# sourceMappingURL=healing-bar.d.ts.map