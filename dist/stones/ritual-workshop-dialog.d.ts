/**
 * Ritual Workshop — catalog + declared-raise Skill Check UI.
 * Lives on the character sheet Rituals tab (no extra window).
 */
export declare class RitualWorkshopController {
    #private;
    actor: Actor;
    selectedId: string;
    declaredRaise: number;
    ritualMR: number;
    gmMod: number;
    skillKey: string;
    attributeKey: string;
    placed: string[];
    uiScrollTop: number;
    private onRefresh;
    constructor(actor: Actor, opts: {
        onRefresh: () => void | Promise<void>;
        ritualId?: string;
    });
    select(ritualId: string): void;
    prepareContext(): Record<string, unknown>;
    bind(root: HTMLElement): void;
}
/** Open the character sheet on the Rituals tab (no floating dialog). */
export declare function showRitualWorkshopOnSheet(actor: Actor, ritualId?: string): Promise<void>;
/** @deprecated Use showRitualWorkshopOnSheet — kept for existing callers. */
export declare const RitualWorkshopDialog: {
    show: typeof showRitualWorkshopOnSheet;
};
//# sourceMappingURL=ritual-workshop-dialog.d.ts.map