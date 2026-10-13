/**
 * GM stone audit: Lifetime track vs live pools vs Summon/Familiar holds.
 * Ready numbers come from `stone-ready.ts` (same source as Stone Powers Available).
 */
export { summonBoundSustainedByAttr } from './stone-ready.js';
export interface StoneAuditBondRow {
    kind: 'summon' | 'familiar';
    name: string;
    stones: number;
    byAttr: string;
}
export interface StoneAuditSlotRow {
    index: number;
    label: string;
    unlocked: boolean;
    attribute: string | null;
    abbrev: string;
}
export interface StoneAuditPoolRow {
    key: string;
    name: string;
    assigned: number;
    max: number;
    current: number;
    sealed: number;
    burned: number;
    sustained: number;
    summonBound: number;
    readyExpected: number;
    mismatch: boolean;
    notes: string;
}
export interface StoneAuditReport {
    actorName: string;
    lifetimeXp: number;
    permanentStones: number;
    permanentColorless: number;
    assignedTotal: number;
    unassigned: number;
    slots: StoneAuditSlotRow[];
    pools: StoneAuditPoolRow[];
    bonds: StoneAuditBondRow[];
    hasMismatch: boolean;
}
export declare function listStoneAuditBonds(actor: any): StoneAuditBondRow[];
/** Full audit snapshot — Ready column uses the same math as Stone Powers Available. */
export declare function buildStoneAuditReport(actor: any): StoneAuditReport;
//# sourceMappingURL=stone-audit.d.ts.map