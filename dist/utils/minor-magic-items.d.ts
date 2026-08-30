/**
 * Minor Magic Items — store one use of a purchased Active Power in a
 * temporary object (potion, grenade, rune, prepared weapon, trap, charm).
 *
 * Create / replace / dismiss only during a Safe Haven Rest. No Stones.
 * Combat resolution of the stored Power comes in a later pass.
 */
export declare const MINOR_MAGIC_FLAG = "minorMagic";
export declare const MINOR_MAGIC_LEDGER_FLAG = "minorMagicLedger";
export declare const MINOR_MAGIC_REST_FLAG = "minorMagicRest";
/** Artifact Actives may be stored only at Basic / Improved (row level ≤ 6). */
export declare const MINOR_MAGIC_ARTIFACT_LEVEL_CAP = 6;
export declare const MINOR_MAGIC_FORMS: readonly ["potion", "grenade", "rune", "weapon", "trap", "charm"];
export type MinorMagicForm = (typeof MINOR_MAGIC_FORMS)[number];
/** True for a PC assigned to a player — not GM-only character sheets or NPCs. */
export declare function isPlayerCharacterActor(actor: any): boolean;
export declare const MINOR_MAGIC_FORM_LABELS: Record<MinorMagicForm, string>;
export interface MinorMagicAttackPool {
    attribute: string;
    numDice: number;
    keepDice: number;
}
export interface MinorMagicSnapshot {
    powerId: string;
    powerName: string;
    templateId: string;
    templateName: string;
    powerLevel: number;
    definitionRank: number;
    category: 'active';
    actionCost: string;
    isSpell: boolean;
    castingAttribute: string;
    attackPool: MinorMagicAttackPool;
    damage: string;
    healing: string;
    range: string;
    aoe: string;
    aoeShape: string;
    targets: number | null;
    duration: string;
    specials: string;
    effect: string;
    chosenSpecialKey: string;
}
export interface MinorMagicItemFlag {
    creatorId: string;
    creatorName: string;
    /** Stable id that survives being given to another character. */
    instanceId?: string;
    form: MinorMagicForm;
    released?: boolean;
    armedAsTrap?: boolean;
    trapTrigger?: string;
    snapshot: MinorMagicSnapshot;
}
export interface MinorMagicLedger {
    itemIds: string[];
    /** Display names for given-away items (keyed by instance id). */
    labels?: Record<string, string>;
}
/** Delete option: the item is moving to another actor, not being spent. */
export declare const MINOR_MAGIC_TRANSFER_DELETE = "masterySystemMinorMagicTransfer";
export declare function emptyMinorMagicLedger(): MinorMagicLedger;
export declare function normalizeMinorMagicLedger(raw: unknown): MinorMagicLedger;
export declare function ledgerKeyForMinorMagic(flag: Pick<MinorMagicItemFlag, 'instanceId'> | null | undefined, itemId?: string): string;
export declare function newMinorMagicInstanceId(fallback?: string): string;
export declare function prepareMinorMagicFlagForTransfer(flag: MinorMagicItemFlag, sourceItemId: string): MinorMagicItemFlag;
export declare function shouldReleaseMinorMagicOnDelete(flag: MinorMagicItemFlag | null | undefined, options?: Record<string, unknown> | null): boolean;
export declare function countHeldMinorMagicItems(ledger: MinorMagicLedger): number;
export declare function applyCreateToLedger(ledger: MinorMagicLedger, itemId: string, label?: string): MinorMagicLedger;
export declare function applyReleaseToLedger(ledger: MinorMagicLedger, itemId: string): MinorMagicLedger | null;
export declare function canManageMinorMagic(actor: any): boolean;
export declare function beginMinorMagicRest(actor: {
    setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown>;
}): Promise<void>;
export declare function endMinorMagicRest(actor: {
    getFlag?: (scope: string, key: string) => unknown;
    unsetFlag?: (scope: string, key: string) => Promise<unknown>;
}): Promise<void>;
export declare function endMinorMagicRestForCombat(combat: {
    combatants?: Iterable<any>;
}): Promise<void>;
export declare function isMinorMagicForm(value: string): value is MinorMagicForm;
export declare function defaultMinorMagicName(form: MinorMagicForm, powerName: string): string;
export declare function iconForMinorMagicForm(form: MinorMagicForm): string;
export declare function actorMasteryRank(actor: {
    system?: {
        mastery?: {
            rank?: unknown;
        };
    };
}): number;
export declare function minorMagicLimit(actor: {
    system?: {
        mastery?: {
            rank?: unknown;
        };
    };
}): number;
export declare function isEligibleMinorMagicPower(item: {
    type?: string;
    system?: Record<string, unknown>;
    getFlag?: (scope: string, key: string) => unknown;
}): boolean;
/**
 * Minor Magic may store a power from an artifact that is worn now or prepared
 * on either Weaponslot. Inventory-only artifacts stay excluded.
 */
export declare function isArtifactAvailableForMinorMagic(actor: any, item: any): boolean;
export declare function listEligibleArtifactMinorMagicPowers(actor: any): any[];
export declare function listEligibleMinorMagicPowers(actor: any): any[];
export declare function resolveMinorMagicPower(actor: any, powerId: string): any | null;
export declare function readMinorMagicFlag(item: {
    getFlag?: (scope: string, key: string) => unknown;
    flags?: Record<string, Record<string, unknown>>;
}): MinorMagicItemFlag | null;
export declare function listMinorMagicItemsOnActor(actor: {
    items?: Iterable<any>;
}): any[];
export declare function snapshotPowerForMinorMagic(actor: {
    id?: string;
    name?: string;
    system?: any;
}, power: {
    id?: string;
    name?: string;
    system?: any;
}): MinorMagicSnapshot;
export declare function formatAttackPool(pool: MinorMagicAttackPool): string;
export declare function snapshotSummaryLines(snapshot: MinorMagicSnapshot): string[];
export declare function findInventorySlotForMinorMagic(actor: {
    items?: Iterable<any>;
}): {
    band: 'not' | 'enc' | 'heavy';
    x: number;
    y: number;
} | null;
export declare function getActorMinorMagicLedger(actor: {
    getFlag?: (scope: string, key: string) => unknown;
}): MinorMagicLedger;
export declare function setActorMinorMagicLedger(actor: {
    setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown>;
}, ledger: MinorMagicLedger): Promise<void>;
export declare const MINOR_MAGIC_REST_REQUIRED = "Create, replace, or dismiss Minor Magic Items only during a Safe Haven Rest.";
export declare function validateCreateMinorMagic(actor: any, power: any, form: MinorMagicForm): string | null;
export declare function createMinorMagicItem(actor: any, opts: {
    powerId: string;
    form: MinorMagicForm;
    name?: string;
}): Promise<{
    ok: true;
    item: any;
} | {
    ok: false;
    error: string;
}>;
export declare function releaseMinorMagicItem(actor: any, item: any): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function consumeMinorMagicItem(actor: any, item: any, mode: 'use' | 'trap' | 'dismiss', trapTrigger?: string): Promise<{
    ok: true;
    flag: MinorMagicItemFlag;
} | {
    ok: false;
    error: string;
}>;
export declare function buildMinorMagicChatHtml(itemName: string, flag: MinorMagicItemFlag, mode: 'use' | 'trap' | 'dismiss'): string;
export declare function useMinorMagicItem(actor: any, item: any, mode?: 'use' | 'trap', trapTrigger?: string): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function dismissMinorMagicItem(actor: any, item: any): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function onMinorMagicItemDeleted(item: any, options?: Record<string, unknown> | null): Promise<void>;
export declare function minorMagicSheetView(actor: any): {
    limit: number;
    held: number;
    remaining: number;
    givenAway: number;
    canManage: boolean;
    items: Array<{
        id: string;
        name: string;
        formLabel: string;
        powerName: string;
        summary: string;
        actionCost: string;
        givenAway?: boolean;
        canGive?: boolean;
    }>;
};
//# sourceMappingURL=minor-magic-items.d.ts.map