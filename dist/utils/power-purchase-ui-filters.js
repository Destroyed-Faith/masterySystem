/**
 * UI-only filter metadata for the Character Sheet Power Purchase Dialog.
 *
 * Does NOT change Power Categories, template IDs, costs, eligibility, or combat
 * resolution. Values are discovery labels so players can find approved Actives
 * and Active Buffs without reading technical subfamilies.
 */
/** What the Active Power accomplishes (multi-label). */
export const ACTIVE_UI_EFFECTS = [
    'damage',
    'special',
    'control',
    'healing',
    'cleanse',
    'protection',
    'illusion',
    'utility',
];
/** How the Active is delivered / applied (multi-label). */
export const ACTIVE_UI_DELIVERIES = [
    'single-target',
    'area',
    'zone-persistent',
    'self',
];
export const ACTIVE_UI_EFFECT_LABELS = {
    damage: 'Damage',
    special: 'Special',
    control: 'Control',
    healing: 'Healing',
    cleanse: 'Cleanse',
    protection: 'Protection',
    illusion: 'Illusion',
    utility: 'Utility',
};
export const ACTIVE_UI_DELIVERY_LABELS = {
    'single-target': 'Single Target',
    area: 'Area of Effect',
    'zone-persistent': 'Zone / Persistent Area',
    self: 'Self',
};
/**
 * UI-only Active Buff focus filter (not a mechanical Power Category).
 * `all` exposes every approved buff; Defensive / Offensive narrow by purpose.
 * A buff may appear under both foci (e.g. Thorns) without duplicating list rows.
 */
export const ACTIVE_BUFF_UI_FOCI = ['defensive', 'offensive'];
export const ACTIVE_BUFF_UI_FOCUS_LABELS = {
    defensive: 'Defensive',
    offensive: 'Offensive',
};
/**
 * Canonical Active Buff templateId → UI focus labels (multi allowed).
 * Covers the final 25; retired Combined / Penetration / Healing stay omitted.
 * Offensive = 12 (5 prior + 7 expansion); Defensive = 14 (Thorns overlap).
 */
export const ACTIVE_BUFF_UI_FOCUS_BY_TEMPLATE_ID = {
    'ab-armor': ['defensive'],
    'ab-evade': ['defensive'],
    'ab-armor-aura': ['defensive'],
    'ab-temp-hp': ['defensive'],
    'ab-damage-reduction': ['defensive'],
    'ab-phasing': ['defensive'],
    'ab-spell-resistance': ['defensive'],
    'ab-cleanse-maintenance': ['defensive'],
    'ab-invisibility': ['defensive'],
    'ab-reinforced-parry': ['defensive'],
    'ab-reinforced-damage-negation': ['defensive'],
    'ab-summon-armor-aura': ['defensive'],
    'ab-intensified-absorption': ['defensive'],
    'ab-damage': ['offensive'],
    'ab-critical': ['offensive'],
    'ab-damage-aura': ['offensive'],
    'ab-summon-damage-aura': ['offensive'],
    // Retaliation: defensive posture with offensive payload — discoverable in both.
    'ab-thorns': ['defensive', 'offensive'],
    'ab-armor-reduction': ['offensive'],
    'ab-enemy-evade-reduction': ['offensive'],
    'ab-spell-resistance-piercing': ['offensive'],
    'ab-maximization': ['offensive'],
    'ab-armor-reduction-aura': ['offensive'],
    'ab-allied-damage-aura': ['offensive'],
    'ab-area-expansion': ['offensive'],
};
/**
 * Complete auditable mapping: every selectable Active templateId → UI filters.
 * Derived from real template mechanics (damage riders, specialSlot, aoe/range,
 * cleanse/heal/control/illusion/barrier/mental), not from Kind labels alone.
 *
 * Templates may list multiple effects and deliveries. Filter dimensions AND
 * across Effect / Delivery / Special; within a dimension, any listed label matches.
 */
export const ACTIVE_UI_FILTER_BY_TEMPLATE_ID = {
    // Damage single + Special slot
    'active-melee-damage-t3': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-ranged-damage-t3': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-melee-damage-t4': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-ranged-damage-t4': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-melee-damage-t5': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-ranged-damage-t5': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-melee-damage-t6': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-ranged-damage-t6': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    // Damage transfer (Vampyr) — damage + self-heal on real HP loss
    'active-melee-single-target-damage-transfer': {
        effects: ['damage', 'healing'],
        deliveries: ['single-target'],
    },
    'active-ranged-single-target-damage-transfer': {
        effects: ['damage', 'healing'],
        deliveries: ['single-target'],
    },
    // Damage AoE + Special (melee centered on self)
    'active-melee-aoe-damage-t3': { effects: ['damage', 'special'], deliveries: ['area', 'self'] },
    'active-melee-aoe-damage-t4': { effects: ['damage', 'special'], deliveries: ['area', 'self'] },
    'active-melee-aoe-damage-t5': { effects: ['damage', 'special'], deliveries: ['area', 'self'] },
    'active-melee-aoe-damage-t6': { effects: ['damage', 'special'], deliveries: ['area', 'self'] },
    'active-ranged-aoe-damage-t3': { effects: ['damage', 'special'], deliveries: ['area'] },
    'active-ranged-aoe-damage-t4': { effects: ['damage', 'special'], deliveries: ['area'] },
    'active-ranged-aoe-damage-t5': { effects: ['damage', 'special'], deliveries: ['area'] },
    'active-ranged-aoe-damage-t6': { effects: ['damage', 'special'], deliveries: ['area'] },
    // Persistent zones — Special auto-apply hazard fields (no damage rider)
    'active-ranged-zone-t3': { effects: ['special'], deliveries: ['zone-persistent'] },
    'active-ranged-zone-t4': { effects: ['special'], deliveries: ['zone-persistent'] },
    'active-ranged-zone-t5': { effects: ['special'], deliveries: ['zone-persistent'] },
    'active-ranged-zone-t6': { effects: ['special'], deliveries: ['zone-persistent'] },
    // Soft control (push/pull/disarm/prone)
    'active-melee-control-push-pull': { effects: ['control'], deliveries: ['single-target'] },
    'active-ranged-control-push-pull': { effects: ['control'], deliveries: ['single-target'] },
    'active-melee-control-pull-disarm': { effects: ['control'], deliveries: ['single-target'] },
    'active-ranged-control-pull-disarm': { effects: ['control'], deliveries: ['single-target'] },
    'active-melee-control-push-prone': { effects: ['control'], deliveries: ['single-target'] },
    'active-ranged-control-push-prone': { effects: ['control'], deliveries: ['single-target'] },
    // Hard control — damage + stunned
    'active-melee-damage-stunned': { effects: ['damage', 'control'], deliveries: ['single-target'] },
    'active-ranged-damage-stunned': { effects: ['damage', 'control'], deliveries: ['single-target'] },
    // Cleanse
    'active-melee-single-cleanse': { effects: ['cleanse'], deliveries: ['single-target'] },
    'active-ranged-single-cleanse': { effects: ['cleanse'], deliveries: ['single-target'] },
    'active-melee-aoe-cleanse': { effects: ['cleanse'], deliveries: ['area', 'self'] },
    'active-ranged-aoe-cleanse': { effects: ['cleanse'], deliveries: ['area'] },
    'active-cleanse-absorption': { effects: ['cleanse', 'protection'], deliveries: ['single-target'] },
    // Mixed cleanse-only (R-05: no HP heal)
    'active-melee-heal-cleanse-mixed': { effects: ['cleanse'], deliveries: ['single-target'] },
    'active-ranged-heal-cleanse-mixed': { effects: ['cleanse'], deliveries: ['single-target'] },
    // Healing / restoration (HP Single Target Heal + Scarred Bar Restoration)
    'active-melee-single-heal': { effects: ['healing'], deliveries: ['single-target'] },
    'active-ranged-single-heal': { effects: ['healing'], deliveries: ['single-target'] },
    'active-melee-health-level-heal': { effects: ['healing'], deliveries: ['single-target'] },
    'active-ranged-health-level-heal': { effects: ['healing'], deliveries: ['single-target'] },
    'active-melee-aoe-restoration': { effects: ['healing'], deliveries: ['area', 'self'] },
    'active-ranged-aoe-restoration': { effects: ['healing'], deliveries: ['area'] },
    // Barrier
    'active-ranged-barrier': { effects: ['protection'], deliveries: ['area', 'zone-persistent'] },
    // Illusion (sensory images)
    'active-ranged-illusion-image': { effects: ['illusion'], deliveries: ['single-target', 'area'] },
    // Weapon attacks
    'active-melee-weapon-single': { effects: ['damage'], deliveries: ['single-target'] },
    'active-ranged-weapon-single': { effects: ['damage'], deliveries: ['single-target'] },
    'active-melee-weapon-aoe': { effects: ['damage'], deliveries: ['area', 'self'] },
    'active-ranged-weapon-aoe': { effects: ['damage'], deliveries: ['area'] },
    // Split / Autofire: discrete multi-target chains (shape:'weapon'), not radius AoE
    'active-melee-weapon-split': { effects: ['damage'], deliveries: ['single-target'] },
    'active-ranged-weapon-split': { effects: ['damage'], deliveries: ['single-target'] },
    'active-ranged-weapon-autofire': { effects: ['damage'], deliveries: ['single-target'] },
    // Targeted Special (Exorcism / Requiem) — damage + special
    'active-melee-targeted-special': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-ranged-targeted-special': { effects: ['damage', 'special'], deliveries: ['single-target'] },
    'active-melee-aoe-targeted-special': { effects: ['damage', 'special'], deliveries: ['area', 'self'] },
    'active-ranged-aoe-targeted-special': { effects: ['damage', 'special'], deliveries: ['area'] },
    // Mental
    'active-mental-attack': { effects: ['damage'], deliveries: ['single-target'] },
    'active-mental-control': { effects: ['control'], deliveries: ['single-target'] },
    'active-mind-illusion': { effects: ['illusion'], deliveries: ['single-target', 'area'] },
    'active-mind-probe': { effects: ['utility'], deliveries: ['single-target'] },
};
export function getActiveUiFilterMeta(templateId) {
    const id = String(templateId || '').trim();
    return ACTIVE_UI_FILTER_BY_TEMPLATE_ID[id] ?? null;
}
export function activeMatchesUiEffect(templateId, effect) {
    const key = String(effect || '').trim();
    if (!key)
        return true;
    const meta = getActiveUiFilterMeta(templateId);
    if (!meta)
        return true; // unmapped templates stay visible under Any / still discoverable
    return meta.effects.includes(key);
}
export function activeMatchesUiDelivery(templateId, delivery) {
    const key = String(delivery || '').trim();
    if (!key)
        return true;
    const meta = getActiveUiFilterMeta(templateId);
    if (!meta)
        return true;
    return meta.deliveries.includes(key);
}
export function getActiveBuffUiFoci(templateId) {
    return ACTIVE_BUFF_UI_FOCUS_BY_TEMPLATE_ID[String(templateId || '').trim()] ?? [];
}
/** True when focus is empty/`all`, or the buff lists that focus. */
export function activeBuffMatchesUiFocus(templateId, focus) {
    const key = String(focus || '').trim().toLowerCase();
    if (!key || key === 'all')
        return true;
    const foci = getActiveBuffUiFoci(templateId);
    if (!foci.length)
        return true; // unmapped stay visible under Any/All
    return foci.includes(key);
}
export function labelActiveUiEffect(key) {
    return ACTIVE_UI_EFFECT_LABELS[key] || key;
}
export function labelActiveUiDelivery(key) {
    return ACTIVE_UI_DELIVERY_LABELS[key] || key;
}
//# sourceMappingURL=power-purchase-ui-filters.js.map