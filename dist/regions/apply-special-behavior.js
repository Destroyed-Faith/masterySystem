/**
 * Region Behavior: Destroyed Faith — Apply Specials
 * Applies a configured Special on TOKEN_ENTER and/or TOKEN_ROUND_END (while inside).
 */
import { applyGmEffect, listGmAssignableSpecials, matchesSide, } from '../combat/gm-effect-service.js';
import { getEffectBaseName, getEffectById } from '../utils/special-effects.js';
/** System RegionBehavior subtype (no package prefix — matches system.json documentTypes). */
export const APPLY_SPECIAL_BEHAVIOR_TYPE = 'applySpecial';
/** Pure: whether this trigger should fire given system toggles (default on when undefined). */
export function regionSpecialTriggerEnabled(sys, trigger) {
    if (!sys)
        return false;
    if (trigger === 'enter')
        return sys.applyOnEnter !== false;
    return sys.applyOnRoundEnd !== false;
}
export function regionSpecialPassesSideFilter(disposition, sideFilter) {
    const raw = String(sideFilter || 'all');
    const allowed = ['all', 'friendly', 'neutral', 'hostile'];
    const side = allowed.includes(raw) ? raw : 'all';
    return matchesSide(disposition, side);
}
export function gmEffectTargetFromTokenDoc(token) {
    if (!token)
        return null;
    const actor = token.actor;
    const actorId = String(actor?.id || token.actorId || '');
    const tokenId = String(token.id || '');
    if (!actorId && !tokenId)
        return null;
    return {
        actorId: actorId || null,
        tokenId: tokenId || null,
        combatantId: null,
        name: String(actor?.name || token.name || ''),
        disposition: Number(token.disposition ?? actor?.token?.disposition ?? 0),
    };
}
export function buildSpecialChoices() {
    const out = {};
    for (const s of listGmAssignableSpecials()) {
        out[s.id] = getEffectBaseName(s.name);
    }
    if (!Object.keys(out).length) {
        out.ignite = 'Ignite';
    }
    return out;
}
async function applyFromBehavior(behaviorSystem, token, trigger, reason) {
    const g = globalThis;
    if (!g.game?.user?.isGM)
        return;
    if (!regionSpecialTriggerEnabled(behaviorSystem, trigger))
        return;
    const specialId = String(behaviorSystem.specialId || '')
        .trim()
        .toLowerCase();
    if (!specialId)
        return;
    const ref = gmEffectTargetFromTokenDoc(token);
    if (!ref)
        return;
    if (!regionSpecialPassesSideFilter(ref.disposition, behaviorSystem.sideFilter))
        return;
    const def = getEffectById(specialId);
    const value = def?.hasValue ? Math.max(1, Math.floor(Number(behaviorSystem.value) || 1)) : null;
    const mode = (String(behaviorSystem.mode || 'rules') === 'exact' ? 'exact' : 'rules');
    try {
        await applyGmEffect({
            targets: [ref],
            specialId,
            value,
            mode,
            reason,
        });
    }
    catch (err) {
        console.warn('Mastery System | Region Apply Specials failed', err);
    }
}
function BehaviorBase() {
    return globalThis.foundry?.data?.regionBehaviors?.RegionBehaviorType;
}
export function createApplySpecialRegionBehaviorType() {
    const Base = BehaviorBase();
    if (!Base) {
        console.warn('Mastery System | RegionBehaviorType unavailable — Apply Specials not registered');
        return null;
    }
    class ApplySpecialRegionBehaviorType extends Base {
        static LOCALIZATION_PREFIXES = ['MASTERY.regionBehavior.applySpecial'];
        static defineSchema() {
            const fields = globalThis.foundry.data.fields;
            const choices = buildSpecialChoices();
            const first = Object.keys(choices)[0] || 'ignite';
            return {
                specialId: new fields.StringField({
                    required: true,
                    blank: false,
                    initial: first,
                    choices,
                    label: 'MASTERY.regionBehavior.applySpecial.FIELDS.specialId.label',
                    hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.specialId.hint',
                }),
                value: new fields.NumberField({
                    required: false,
                    nullable: true,
                    integer: true,
                    initial: 1,
                    min: 1,
                    max: 40,
                    label: 'MASTERY.regionBehavior.applySpecial.FIELDS.value.label',
                    hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.value.hint',
                }),
                sideFilter: new fields.StringField({
                    required: true,
                    blank: false,
                    initial: 'all',
                    choices: {
                        all: 'MASTERY.regionBehavior.applySpecial.SIDE.all',
                        friendly: 'MASTERY.regionBehavior.applySpecial.SIDE.friendly',
                        neutral: 'MASTERY.regionBehavior.applySpecial.SIDE.neutral',
                        hostile: 'MASTERY.regionBehavior.applySpecial.SIDE.hostile',
                    },
                    label: 'MASTERY.regionBehavior.applySpecial.FIELDS.sideFilter.label',
                    hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.sideFilter.hint',
                }),
                applyOnEnter: new fields.BooleanField({
                    required: true,
                    initial: true,
                    label: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnEnter.label',
                    hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnEnter.hint',
                }),
                applyOnRoundEnd: new fields.BooleanField({
                    required: true,
                    initial: true,
                    label: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnRoundEnd.label',
                    hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnRoundEnd.hint',
                }),
                mode: new fields.StringField({
                    required: true,
                    blank: false,
                    initial: 'rules',
                    choices: {
                        rules: 'MASTERY.regionBehavior.applySpecial.MODE.rules',
                        exact: 'MASTERY.regionBehavior.applySpecial.MODE.exact',
                    },
                    label: 'MASTERY.regionBehavior.applySpecial.FIELDS.mode.label',
                    hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.mode.hint',
                }),
            };
        }
        static events = {
            tokenEnter: async function (event) {
                const sys = this;
                if (!regionSpecialTriggerEnabled(sys, 'enter'))
                    return;
                const token = event?.data?.token ?? event?.token;
                const regionName = String(this?.region?.name || this?.behavior?.parent?.name || 'Region');
                await applyFromBehavior(sys, token, 'enter', `Region enter: ${regionName}`);
            },
            tokenRoundEnd: async function (event) {
                const sys = this;
                if (!regionSpecialTriggerEnabled(sys, 'roundEnd'))
                    return;
                const token = event?.data?.token ?? event?.token;
                const regionName = String(this?.region?.name || this?.behavior?.parent?.name || 'Region');
                await applyFromBehavior(sys, token, 'roundEnd', `Region round end: ${regionName}`);
            },
        };
    }
    const CONST = globalThis.CONST;
    if (CONST?.REGION_EVENTS?.TOKEN_ENTER) {
        ApplySpecialRegionBehaviorType.events[CONST.REGION_EVENTS.TOKEN_ENTER] =
            ApplySpecialRegionBehaviorType.events.tokenEnter;
    }
    if (CONST?.REGION_EVENTS?.TOKEN_ROUND_END) {
        ApplySpecialRegionBehaviorType.events[CONST.REGION_EVENTS.TOKEN_ROUND_END] =
            ApplySpecialRegionBehaviorType.events.tokenRoundEnd;
    }
    return ApplySpecialRegionBehaviorType;
}
export function registerApplySpecialRegionBehavior() {
    const config = globalThis.CONFIG?.RegionBehavior;
    if (!config?.dataModels) {
        console.warn('Mastery System | CONFIG.RegionBehavior.dataModels missing — Apply Specials not registered');
        return false;
    }
    const Type = createApplySpecialRegionBehaviorType();
    if (!Type)
        return false;
    config.dataModels[APPLY_SPECIAL_BEHAVIOR_TYPE] = Type;
    if (config.typeIcons)
        config.typeIcons[APPLY_SPECIAL_BEHAVIOR_TYPE] = 'fa-solid fa-bolt';
    if (config.typeLabels) {
        config.typeLabels[APPLY_SPECIAL_BEHAVIOR_TYPE] = 'TYPES.RegionBehavior.applySpecial';
    }
    if (config.typeHints) {
        config.typeHints[APPLY_SPECIAL_BEHAVIOR_TYPE] = 'MASTERY.regionBehavior.applySpecial.TypeHint';
    }
    return true;
}
//# sourceMappingURL=apply-special-behavior.js.map