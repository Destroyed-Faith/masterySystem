/**
 * GM stone audit: Lifetime track vs live pools vs Summon/Familiar holds.
 * Same sources Stone Powers uses (effective assignments + resolved caps).
 */
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
/** Sustained counts that Summon Bonds / Familiars currently hold. */
export declare function summonBoundSustainedByAttr(actor: any): Record<string, number>;
export declare function listStoneAuditBonds(actor: any): StoneAuditBondRow[];
/** Full audit snapshot — same math as Stone Powers caps. */
export declare function buildStoneAuditReport(actor: any): StoneAuditReport;
//# sourceMappingURL=stone-audit.d.ts.map