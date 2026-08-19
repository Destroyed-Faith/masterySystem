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
    /** Active tab, preserved across re-renders (see sheet-v2-compat tabs helper). */
    activeTab?: string;
    openRitualWorkshop(ritualId?: string): Promise<void>;
    openMinorMagicPanel(): Promise<void>;
    /** Initial tab when the sheet is first opened; subclasses override. */
    protected get _initialTab(): string;
    /** @override */
    static DEFAULT_OPTIONS: any;
    /** @override */
    static PARTS: {
        body: {
            template: string;
        };
    };
    /**
     * The "Print" header control only makes sense for player characters —
     * NPC / Summon subclasses inherit the control via DEFAULT_OPTIONS merging.
     * @override
     */
    _getHeaderControls(): any[];
    /**
     * Refresh XP distribution controls when the GM ends an Upgrade Step or
     * grants XP from world settings while this sheet is open.
     */
    _onUpdate(changed: Record<string, unknown>, options: unknown, _userId: string): void;
    /**
     * Rebuild the context shape the V1 `ActorSheet.getData()` used to provide,
     * since the whole sheet (and its templates) were written against it.
     */
    protected _buildV1BaseContext(_options?: any): any;
    /** @override */
    _prepareContext(options?: any): Promise<any>;
    /** @override */
    render(options?: any, _options?: any): Promise<any>;
    /**
     * ApplicationV2 render bridge: re-wire the classic V1 behaviors (tabs,
     * drag & drop, portrait editing, jQuery listeners) after every render,
     * because the part's DOM is replaced each time.
     * @override
     */
    _onRender(context: any, options: any): Promise<void>;
    /** @override */
    activateListeners(html: JQuery): void;
    /** Status UI is button-driven — never let an empty form submit wipe it. */
    _prepareSubmitData(event: any, form: any, formData: any, updateData?: any): any;
    /** @override */
    _onChangeForm(formConfig: any, event: Event): any;
    /** @override */
    _onSubmitForm(formConfig: any, event: Event): Promise<any>;
    /**
     * Handle drag and drop for equipment
     */
    _onDrop(event: DragEvent): Promise<boolean>;
}
export {};
//# sourceMappingURL=character-sheet.d.ts.map