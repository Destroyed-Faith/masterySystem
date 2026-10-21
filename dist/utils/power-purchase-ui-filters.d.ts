/**
 * UI-only filter metadata for the Character Sheet Power Purchase Dialog.
 *
 * Does NOT change Power Categories, template IDs, costs, eligibility, or combat
 * resolution. Values are discovery labels so players can find approved Actives
 * and Active Buffs without reading technical subfamilies.
 */
/** What the Active Power accomplishes (multi-label). */
export declare const ACTIVE_UI_EFFECTS: readonly ["damage", "special", "control", "healing", "cleanse", "protection", "illusion", "utility"];
export type ActiveUiEffect = (typeof ACTIVE_UI_EFFECTS)[number];
/** How the Active is delivered / applied (multi-label). */
export declare const ACTIVE_UI_DELIVERIES: readonly ["single-target", "area", "zone-persistent", "self"];
export type ActiveUiDelivery = (typeof ACTIVE_UI_DELIVERIES)[number];
export declare const ACTIVE_UI_EFFECT_LABELS: Record<ActiveUiEffect, string>;
export declare const ACTIVE_UI_DELIVERY_LABELS: Record<ActiveUiDelivery, string>;
export interface ActiveUiFilterMeta {
    effects: readonly ActiveUiEffect[];
    deliveries: readonly ActiveUiDelivery[];
}
/**
 * UI-only Active Buff focus filter (not a mechanical Power Category).
 * `all` exposes every approved buff; Defensive / Offensive narrow by purpose.
 * A buff may appear under both foci (e.g. Thorns) without duplicating list rows.
 */
export declare const ACTIVE_BUFF_UI_FOCI: readonly ["defensive", "offensive"];
export type ActiveBuffUiFocus = (typeof ACTIVE_BUFF_UI_FOCI)[number];
export declare const ACTIVE_BUFF_UI_FOCUS_LABELS: Record<ActiveBuffUiFocus, string>;
/**
 * Canonical Active Buff templateId → UI focus labels (multi allowed).
 * Covers the final 18 only; retired Combined / Penetration / Healing stay omitted.
 */
export declare const ACTIVE_BUFF_UI_FOCUS_BY_TEMPLATE_ID: Readonly<Record<string, readonly ActiveBuffUiFocus[]>>;
/**
 * Complete auditable mapping: every selectable Active templateId → UI filters.
 * Derived from real template mechanics (damage riders, specialSlot, aoe/range,
 * cleanse/heal/control/illusion/barrier/mental), not from Kind labels alone.
 *
 * Templates may list multiple effects and deliveries. Filter dimensions AND
 * across Effect / Delivery / Special; within a dimension, any listed label matches.
 */
export declare const ACTIVE_UI_FILTER_BY_TEMPLATE_ID: Readonly<Record<string, ActiveUiFilterMeta>>;
export declare function getActiveUiFilterMeta(templateId: string): ActiveUiFilterMeta | null;
export declare function activeMatchesUiEffect(templateId: string, effect: string | null | undefined): boolean;
export declare function activeMatchesUiDelivery(templateId: string, delivery: string | null | undefined): boolean;
export declare function getActiveBuffUiFoci(templateId: string): readonly ActiveBuffUiFocus[];
/** True when focus is empty/`all`, or the buff lists that focus. */
export declare function activeBuffMatchesUiFocus(templateId: string, focus: string | null | undefined): boolean;
export declare function labelActiveUiEffect(key: string): string;
export declare function labelActiveUiDelivery(key: string): string;
//# sourceMappingURL=power-purchase-ui-filters.d.ts.map