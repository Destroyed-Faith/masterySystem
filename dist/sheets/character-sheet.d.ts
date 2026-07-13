/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
declare const BaseActorSheet: any;
export declare class MasteryCharacterSheet extends BaseActorSheet {
    #private;
    /** Preserves <details open> for Token-Radial prefs across re-renders (checkbox updates call render). */
    private _radialManeuverPrefsDetailsOpen?;
    /**
     * Preserves <details open> for the grouped powers list.
     * `undefined` means first paint: expanded (see getData: `!== false`).
     */
    private _powersListDetailsOpen?;
    private _pendingAttributeChanges;
    private _pendingPowerLevelChanges;
    private _pendingSkillRankChanges;
    /** @override */
    static get defaultOptions(): any;
    /**
     * Add a "Print / Export" button to the sheet window header that opens the
     * printable 3-page character sheet with all values filled in.
     * @override
     */
    _getHeaderButtons(): any[];
    /** @override */
    get template(): string;
    /**
     * Refresh XP distribution controls when the GM ends an Upgrade Step or
     * grants XP from world settings while this sheet is open.
     */
    _onUpdate(changed: Record<string, unknown>, options: unknown, _userId: string): void;
    /** @override */
    getData(options?: any): Promise<any>;
    /** @override */
    render(force?: boolean, options?: any): Promise<any>;
    /** @override */
    activateListeners(html: JQuery): void;
    /** @override */
    _onSubmit(event: Event, options?: any): Promise<any>;
    /**
     * Handle drag and drop for equipment
     */
    _onDrop(event: DragEvent): Promise<boolean>;
}
export {};
//# sourceMappingURL=character-sheet.d.ts.map