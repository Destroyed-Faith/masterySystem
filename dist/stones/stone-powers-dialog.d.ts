/**
 * Stone Powers Dialog — Steine pro Macht in Segmenten (1→2→4→8) verteilen.
 * Voll bezahlte Wellen werden beim Schließen des Dialogs abgerechnet (Pools, RoundState, Radial); beim Klick/Drop bleiben Steine in den Slots.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class StonePowersDialog extends BaseDialog {
    #private;
    /**
     * Teilzahlungs-Lanes überleben Foundry-V2-`render`/`_prepareContext`, falls die App-Instanz
     * intern neu verdrahtet wird (Akku-Map sonst leer → nie slot-filled / kein Grün).
     * Schlüssel: `${ownerActorId}\\0${powerId}:${attr}:${uses}` oder unified `...:msGenMulti:${uses}`
     */
    private static _sessionStoneLanes;
    private actor;
    private combatant;
    private resolve?;
    private _generalAttrSelection;
    /** Belegte Lanes: Attribut-Macht `number[]`; General `GenericLaneOcc[]` unter `genericUnifiedAccKey`. */
    private _stoneDropAccumulators;
    /** Lane des Steins bei Rückzug Pool←Feld (dragstart). */
    private _stoneReturnLane;
    /** Entfernt Root‑Listener von #bindStoneDragAndDrop (bei jedem Render neu binden). */
    private _stoneDndCleanup?;
    /** Attribut des aktuellen Zugs — Foundry/Electron liefert oft kein dataTransfer.getData beim drop. */
    private _stoneDragAttribute;
    /** Akku-Schlüssel beim Ziehen eines Steins aus dem Feld zurück in den Pool. */
    private _stoneReturnAccKey;
    /** Pool-Zeile für Rückgabe (bei General-Multi aus data-return-attribute-key). */
    private _stoneReturnPoolAttr;
    /** Avoid re-hydrating the confirmed plan over in-progress edits on every render. */
    private _stoneRoundPlanHydratedKey;
    /** Stones already confirmed this round — show assignment, do not spend again. */
    private _stoneReviewMode;
    /** Waves paid in this combat round: displayed, never charged again. */
    private _stonePaidLanes;
    /** True while a render triggered from `_onRender` is still pending. */
    private _stoneRenderQueued;
    /** Scroll im Dialog-Inhalt vor Re-Render merken (Stein setzen sonst springt nach oben). */
    private _stonePowersContentScrollTop;
    /** Stone Recovery (round 2+): stones the player takes back, per pool. */
    private _recoveryAlloc;
    /** Round the current recovery belongs to — a new round starts from scratch. */
    private _recoveryRound;
    /** Recovery still open: the power matrix below stays locked. */
    private _recoveryActive;
    /** Guard against a second click while the recovery is being written. */
    private _recoveryCommitting;
    /** Stones staged for the Initiative Exchange (the convert button spends them). */
    private _colorlessConvertCount;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            title: string;
            resizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    /**
     * Show stone powers dialog for an actor
     */
    static showForActor(actor: Actor, combatant?: Combatant | null): Promise<boolean>;
    constructor(actor: Actor, combatant: Combatant | null, resolve: (success: boolean) => void);
    _prepareContext(_options: any): Promise<any>;
    _onRender(_context: any, _options: any): Promise<void>;
    _onClose(_options: any): Promise<void>;
}
export {};
//# sourceMappingURL=stone-powers-dialog.d.ts.map