/**
 * Passive Slot View — Character Sheet data provider
 *
 * Produces the view-model that the Powers tab uses to render the
 * player-facing Passive Slot Manager (slot dropdowns + activate toggles).
 *
 * Kept separate from `src/powers/passives.ts` so the sheet can stay
 * declarative and the core passives module remains free of UI concerns.
 */
export interface PassiveSlotRow {
    index: number;
    slotKey: string;
    hasPassive: boolean;
    isActive: boolean;
    passiveId: string | null;
    passiveName: string | null;
    summary: string | null;
}
export interface PassiveSlotViewAvailable {
    id: string;
    name: string;
    category: string;
    summary: string;
    slottedInSlot: number | null;
}
export interface PassiveSlotView {
    slots: PassiveSlotRow[];
    availablePassives: PassiveSlotViewAvailable[];
    activeCount: number;
    maxSlots: number;
    canActivateMore: boolean;
}
export declare function buildPassiveSlotView(actor: any): PassiveSlotView;
//# sourceMappingURL=passive-slot-view.d.ts.map