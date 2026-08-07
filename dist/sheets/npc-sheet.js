/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */
import { MasteryCharacterSheet } from './character-sheet.js';
import { ALL_SPECIAL_EFFECTS, getEffectBaseName, } from '../utils/special-effects.js';
import { sumNpcAttackSlotsFromPowers } from '../utils/npc-attack-model.js';
import { openNpcPrintSheet } from './npc-print.js';
function dup(obj) {
    const fn = foundry.utils?.duplicate;
    return fn ? fn(obj) : JSON.parse(JSON.stringify(obj));
}
function ensureNpcBaseShape(b) {
    const o = b && typeof b === 'object' ? dup(b) : {};
    if (!Array.isArray(o.specials))
        o.specials = [];
    if (o.name == null || o.name === '')
        o.name = 'Waffenangriff';
    return o;
}
function newExtraNpcPower() {
    return {
        name: '',
        attackDiceCount: 6,
        damageDiceCount: 4,
        npcAttacksPerRound: 1,
        specials: []
    };
}
/** Legacy object-shaped `attackValues` (numeric keys) → array of entries. */
function normalizeAttackValuesArray(raw) {
    if (Array.isArray(raw))
        return dup(raw);
    if (raw && typeof raw === 'object') {
        const o = raw;
        return Object.keys(o)
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            .map((k) => dup(o[k]));
    }
    return [];
}
/** Coerce sheet / FormData strings so attack & damage pool &lt;select&gt; `eq` matches. */
function normalizeNpcAttackRowForContext(row) {
    const o = row && typeof row === 'object' ? { ...row } : {};
    const intKeys = [
        'attackDiceCount',
        'damageDiceCount',
        'npcRangeMeters',
        'npcRangeMinMeters',
        'npcAoeRadiusM',
        'npcStressD8',
    ];
    for (const k of intKeys) {
        const raw = o[k];
        if (raw === '' || raw === null || raw === undefined) {
            delete o[k];
            continue;
        }
        const n = Math.floor(Number(raw));
        if (Number.isFinite(n) && n > 0)
            o[k] = n;
        else
            delete o[k];
    }
    if (o.npcSplitAttack === true || o.npcSplitAttack === 'true' || o.npcSplitAttack === 'on') {
        o.npcSplitAttack = true;
    }
    else {
        delete o.npcSplitAttack;
    }
    if (o.npcIsSpell === true || o.npcIsSpell === 'true' || o.npcIsSpell === 'on') {
        o.npcIsSpell = true;
    }
    else {
        delete o.npcIsSpell;
    }
    {
        const apr = Math.floor(Number(o.npcAttacksPerRound));
        o.npcAttacksPerRound =
            Number.isFinite(apr) && apr >= 1 ? Math.min(5, apr) : 1;
    }
    const rk = String(o.npcRangeKind || '').toLowerCase();
    if (rk === 'ranged') {
        o.npcRangeKind = 'ranged';
        // Fernkampf: Min 12 / Max 24 (sheet defaults + clamps for display).
        const maxRaw = Math.floor(Number(o.npcRangeMeters));
        const minRaw = Math.floor(Number(o.npcRangeMinMeters));
        const maxM = Number.isFinite(maxRaw) && maxRaw > 0 ? Math.min(24, Math.max(12, maxRaw)) : 24;
        let minM = Number.isFinite(minRaw) && minRaw > 0 ? Math.min(24, Math.max(12, minRaw)) : 12;
        if (minM > maxM)
            minM = maxM;
        o.npcRangeMeters = maxM;
        o.npcRangeMinMeters = minM;
    }
    else {
        delete o.npcRangeKind;
        // Reach: 1–8 m (default 2 when empty).
        const reachRaw = Math.floor(Number(o.npcRangeMeters));
        if (Number.isFinite(reachRaw) && reachRaw > 0) {
            o.npcRangeMeters = Math.min(8, Math.max(1, reachRaw));
        }
        else {
            o.npcRangeMeters = 2;
        }
        delete o.npcRangeMinMeters;
    }
    const sh = String(o.npcAoeShape || '').toLowerCase();
    if (sh === 'radius' || sh === 'cone' || sh === 'line')
        o.npcAoeShape = sh;
    else
        delete o.npcAoeShape;
    return o;
}
const NPC_SPECIAL_CATEGORY_ORDER = [
    'instant',
    'diminishing',
    'timed',
    'untilUsed',
    'support',
];
const NPC_SPECIAL_CATEGORY_LABELS = {
    instant: 'Sofort',
    diminishing: 'Abklingend',
    timed: 'Zeitlich',
    untilUsed: 'Bis verbraucht',
    support: 'Support',
    multiAttack: 'Multi-Angriff',
};
/** Catalog specials for NPC attacks — no Legacy keys, no Extra Attack / multiAttack. */
function buildNpcSpecialSelectGroups() {
    const byCat = new Map();
    for (const e of ALL_SPECIAL_EFFECTS) {
        if (e.category === 'multiAttack')
            continue; // Extra Attack is not an NPC raise special
        const label = getEffectBaseName(e.name).replace(/\(X\)/gi, '').trim() || e.id;
        const list = byCat.get(e.category) ?? [];
        list.push({ value: e.id, label });
        byCat.set(e.category, list);
    }
    const groups = [];
    for (const category of NPC_SPECIAL_CATEGORY_ORDER) {
        const options = byCat.get(category);
        if (!options?.length)
            continue;
        options.sort((a, b) => a.label.localeCompare(b.label, 'de', { sensitivity: 'base' }));
        groups.push({
            category,
            label: NPC_SPECIAL_CATEGORY_LABELS[category] ?? category,
            options,
        });
    }
    return groups;
}
export class MasteryNpcSheet extends MasteryCharacterSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['npc'],
        position: { width: 720, height: 820 },
        window: {
            controls: [
                {
                    icon: 'fas fa-print',
                    label: 'Bogen drucken',
                    action: 'msNpcPrintSheet',
                },
            ],
        },
        actions: {
            msNpcPrintSheet: function () {
                void openNpcPrintSheet(this.actor);
            },
        },
    };
    /**
     * Parent strips the PC print control for non-characters; keep the NPC print
     * control and drop the inherited PC one if it ever leaks through.
     * @override
     */
    _getHeaderControls() {
        const controls = super._getHeaderControls?.() ?? [];
        return controls.filter((c) => c?.action !== 'msPrintSheet');
    }
    /** Prefer short type label "NPC: Name" via i18n; fall back to actor name. */
    get title() {
        const name = String(this.document?.name ?? '').trim();
        const typeLabel = game?.i18n?.localize?.('TYPES.Actor.npc');
        if (typeLabel && typeLabel !== 'TYPES.Actor.npc') {
            return name ? `${typeLabel}: ${name}` : typeLabel;
        }
        return name || 'NPC';
    }
    /** @override */
    static PARTS = {
        body: {
            template: 'systems/mastery-system/templates/actor/npc-sheet.hbs',
        },
    };
    /** @override */
    get _initialTab() {
        return 'phase-0';
    }
    /**
     * ApplicationV2 unions `classes` across the inheritance chain; strip the
     * parent's `character` class so character-sheet CSS never applies here.
     * @override
     */
    _initializeApplicationOptions(options) {
        const opts = super._initializeApplicationOptions(options);
        opts.classes = (opts.classes || []).filter((c) => c !== 'character');
        return opts;
    }
    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        // Normalize health.bars: convert object to array if needed
        if (context.system?.health?.bars) {
            const bars = context.system.health.bars;
            if (!Array.isArray(bars) && typeof bars === 'object') {
                const barsArray = Object.keys(bars)
                    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                    .map((key) => bars[key]);
                context.system.health.bars = barsArray;
            }
            if (Array.isArray(context.system.health.bars)) {
                context.system.health.bars = context.system.health.bars.map((bar, index) => ({
                    name: bar.name || `Bar ${index + 1}`,
                    max: bar.max !== undefined && bar.max !== null ? bar.max : 30,
                    current: bar.current !== undefined && bar.current !== null
                        ? bar.current
                        : bar.max !== undefined && bar.max !== null
                            ? bar.max
                            : 30,
                    penalty: bar.penalty !== undefined && bar.penalty !== null ? bar.penalty : 0
                }));
            }
        }
        if (context.actor?.type === 'npc' && context.system) {
            if (context.system.creatureType == null || context.system.creatureType === undefined) {
                // Legacy: bio.type may already hold a free-text creature label.
                context.system.creatureType = String(context.system.bio?.type ?? '');
            }
            context.system.npcBaseAttack = ensureNpcBaseShape(context.system.npcBaseAttack);
            if (Array.isArray(context.system.phases) &&
                context.system.phases.length > 0 &&
                (context.system.npcActivePhaseIndex == null || !Number.isFinite(Number(context.system.npcActivePhaseIndex)))) {
                context.system.npcActivePhaseIndex = 0;
            }
            if (Array.isArray(context.system.phases)) {
                context.system.phases = context.system.phases.map((phase) => ({
                    ...phase,
                    npcBaseAttack: ensureNpcBaseShape(phase.npcBaseAttack)
                }));
            }
        }
        if (context.system?.phases && Array.isArray(context.system.phases)) {
            context.system.phases = context.system.phases.map((phase) => {
                if (phase.health?.bars) {
                    const phaseBars = phase.health.bars;
                    if (!Array.isArray(phaseBars) && typeof phaseBars === 'object') {
                        const barsArray = Object.keys(phaseBars)
                            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                            .map((key) => phaseBars[key]);
                        phase.health.bars = barsArray;
                    }
                    if (Array.isArray(phase.health.bars)) {
                        phase.health.bars = phase.health.bars.map((bar, index) => ({
                            name: bar.name || `Bar ${index + 1}`,
                            max: bar.max !== undefined && bar.max !== null ? bar.max : 30,
                            current: bar.current !== undefined && bar.current !== null
                                ? bar.current
                                : bar.max !== undefined && bar.max !== null
                                    ? bar.max
                                    : 30,
                            penalty: bar.penalty !== undefined && bar.penalty !== null ? bar.penalty : 0
                        }));
                    }
                }
                return phase;
            });
        }
        if (context.actor?.type === 'npc' && context.system) {
            context.npcSpecialSelectGroups = buildNpcSpecialSelectGroups();
            context.system.npcBaseAttack = normalizeNpcAttackRowForContext(context.system.npcBaseAttack);
            if (Array.isArray(context.system.attackValues)) {
                context.system.attackValues = context.system.attackValues.map((r) => normalizeNpcAttackRowForContext(r));
            }
            if (Array.isArray(context.system.phases)) {
                context.system.phases = context.system.phases.map((ph) => ({
                    ...ph,
                    npcBaseAttack: normalizeNpcAttackRowForContext(ph.npcBaseAttack),
                    attackValues: Array.isArray(ph.attackValues)
                        ? ph.attackValues.map((r) => normalizeNpcAttackRowForContext(r))
                        : ph.attackValues
                }));
            }
            // ATK = Summe der Angriffe/Runde-Kopien (aktive Phase bzw. Root-Liste).
            context.system.attackSlots = sumNpcAttackSlotsFromPowers(context.system);
        }
        return context;
    }
    /**
     * Empty/"none" AoE selects must clear persisted shape+radius. Blank
     * `<option value="">` was previously omitted from FormData, so old AoE
     * values stuck forever on the actor.
     * @override
     */
    _prepareSubmitData(event, form, formData, updateData) {
        const self = this;
        const parentFn = (() => {
            let proto = Object.getPrototypeOf(self);
            while (proto) {
                const desc = Object.getOwnPropertyDescriptor(proto, '_prepareSubmitData');
                if (desc?.value && desc.value !== self._prepareSubmitData) {
                    return desc.value;
                }
                proto = Object.getPrototypeOf(proto);
            }
            return null;
        })();
        const data = parentFn ? parentFn.call(this, event, form, formData, updateData) : {};
        const scrubAttack = (atk) => {
            if (!atk || typeof atk !== 'object')
                return;
            const shape = String(atk.npcAoeShape ?? '').toLowerCase();
            if (!shape || shape === 'none') {
                // Must overwrite persisted "radius"/cone/line — deleting the key
                // would leave the old value untouched by the Actor update merge.
                atk.npcAoeShape = '';
                atk.npcAoeRadiusM = null;
            }
        };
        if (data?.system) {
            scrubAttack(data.system.npcBaseAttack);
            if (Array.isArray(data.system.attackValues)) {
                for (const atk of data.system.attackValues)
                    scrubAttack(atk);
            }
            if (Array.isArray(data.system.phases)) {
                for (const ph of data.system.phases) {
                    scrubAttack(ph?.npcBaseAttack);
                    if (Array.isArray(ph?.attackValues)) {
                        for (const atk of ph.attackValues)
                            scrubAttack(atk);
                    }
                }
            }
        }
        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        const syncColorPickerToText = (e) => {
            const colorPicker = $(e.currentTarget);
            const textInput = colorPicker.siblings('.blood-color-text');
            const colorValue = colorPicker.val();
            if (textInput.length > 0 && colorValue) {
                textInput.val(colorValue);
                textInput.data('last-valid-value', colorValue);
                textInput.removeClass('invalid');
            }
        };
        html
            .find('.blood-color-picker, input[type="color"][name="system.bloodColor"]')
            .on('input', syncColorPickerToText)
            .on('change', syncColorPickerToText);
        const syncTextToColorPicker = (e) => {
            const textInput = $(e.currentTarget);
            const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
            const colorValue = (textInput.val() || '').trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
                if (colorPicker.length > 0) {
                    colorPicker.val(colorValue);
                    colorPicker.trigger('change');
                }
                textInput.data('last-valid-value', colorValue);
                textInput.removeClass('invalid');
            }
            else if (colorValue.length > 0) {
                textInput.addClass('invalid');
            }
        };
        html.find('.blood-color-text').on('input', syncTextToColorPicker).on('change', syncTextToColorPicker);
        html.find('.blood-color-text').on('blur', (e) => {
            const textInput = $(e.currentTarget);
            const colorValue = (textInput.val() || '').trim();
            if (!/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
                const lastValid = textInput.data('last-valid-value') || '#8b0000';
                textInput.val(lastValid);
                textInput.removeClass('invalid');
                const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
                if (colorPicker.length > 0) {
                    colorPicker.val(lastValid);
                    colorPicker.trigger('change');
                }
            }
        });
        html.find('.effect-remove').on('click', this.#onRemoveStatusEffect.bind(this));
        html.find('.attack-value-add').on('click', this.#onAttackValueAdd.bind(this));
        html.find('.attack-value-delete').on('click', this.#onAttackValueDelete.bind(this));
        html.find('.phase-add-btn').on('click', this.#onPhaseAdd.bind(this));
        html.find('.phase-delete-btn').on('click', this.#onPhaseDelete.bind(this));
        html.find('.npc-power-special-add').on('click', this.#onNpcPowerSpecialAdd.bind(this));
        html.find('.npc-power-special-del').on('click', this.#onNpcPowerSpecialDel.bind(this));
    }
    async #onRemoveStatusEffect(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).data('effect-index') || '0', 10);
        const phaseIndex = $(event.currentTarget).data('phase-index');
        const system = this.actor.system;
        if (phaseIndex !== undefined && phaseIndex !== null) {
            if (!system.phases || !system.phases[phaseIndex] || !system.phases[phaseIndex].statusEffects) {
                return;
            }
            if (index >= 0 && index < system.phases[phaseIndex].statusEffects.length) {
                system.phases[phaseIndex].statusEffects.splice(index, 1);
                await this.actor.update({
                    [`system.phases.${phaseIndex}.statusEffects`]: system.phases[phaseIndex].statusEffects
                });
            }
        }
        else {
            if (!system.statusEffects || !Array.isArray(system.statusEffects)) {
                return;
            }
            if (index >= 0 && index < system.statusEffects.length) {
                system.statusEffects.splice(index, 1);
                await this.actor.update({ 'system.statusEffects': system.statusEffects });
            }
        }
    }
    async #onAttackValueAdd(event) {
        event.preventDefault();
        const phaseIndex = $(event.currentTarget).data('phase-index');
        const system = this.actor.system;
        const row = newExtraNpcPower();
        if (phaseIndex !== undefined && phaseIndex !== null) {
            const pi = Number(phaseIndex);
            if (!system.phases || !system.phases[pi]) {
                return;
            }
            const phases = dup(system.phases);
            const pav = normalizeAttackValuesArray(phases[pi].attackValues);
            pav.push(row);
            phases[pi].attackValues = pav;
            await this.actor.update({ 'system.phases': phases });
        }
        else {
            const av = normalizeAttackValuesArray(system.attackValues);
            av.push(row);
            await this.actor.update({ 'system.attackValues': av });
        }
    }
    async #onAttackValueDelete(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).data('attack-index') || '0', 10);
        const phaseIndex = $(event.currentTarget).data('phase-index');
        const system = this.actor.system;
        if (phaseIndex !== undefined && phaseIndex !== null) {
            const pi = Number(phaseIndex);
            if (!system.phases || !system.phases[pi]) {
                return;
            }
            const phases = dup(system.phases);
            const pav = normalizeAttackValuesArray(phases[pi].attackValues);
            if (index >= 0 && index < pav.length) {
                pav.splice(index, 1);
                phases[pi].attackValues = pav;
                await this.actor.update({ 'system.phases': phases });
            }
        }
        else {
            const av = normalizeAttackValuesArray(system.attackValues);
            if (index >= 0 && index < av.length) {
                av.splice(index, 1);
                await this.actor.update({ 'system.attackValues': av });
            }
        }
    }
    async #onNpcPowerSpecialAdd(event) {
        event.preventDefault();
        const $t = $(event.currentTarget);
        const scope = String($t.data('scope') || '');
        const phaseRaw = $t.data('phase-index');
        const attackRaw = $t.data('attack-index');
        const system = this.actor.system;
        const entry = { special: '' };
        if (scope === 'base') {
            const base = ensureNpcBaseShape(system.npcBaseAttack);
            base.specials = [...(base.specials || []), entry];
            await this.actor.update({ 'system.npcBaseAttack': base });
            return;
        }
        if (scope === 'phase-base') {
            const pi = Number(phaseRaw);
            if (!Number.isFinite(pi) || !system.phases?.[pi])
                return;
            const phases = dup(system.phases);
            const base = ensureNpcBaseShape(phases[pi].npcBaseAttack);
            base.specials = [...(base.specials || []), entry];
            phases[pi].npcBaseAttack = base;
            await this.actor.update({ 'system.phases': phases });
            return;
        }
        if (scope === 'extra') {
            const ai = Number(attackRaw);
            if (!Number.isFinite(ai))
                return;
            if (phaseRaw !== undefined && phaseRaw !== null && phaseRaw !== '') {
                const pi = Number(phaseRaw);
                if (!Number.isFinite(pi) || !system.phases?.[pi]?.attackValues?.[ai])
                    return;
                const phases = dup(system.phases);
                const att = dup(phases[pi].attackValues[ai]);
                att.specials = [...(att.specials || []), entry];
                phases[pi].attackValues[ai] = att;
                await this.actor.update({ 'system.phases': phases });
            }
            else {
                if (!system.attackValues?.[ai])
                    return;
                const av = dup(system.attackValues);
                const att = dup(av[ai]);
                att.specials = [...(att.specials || []), entry];
                av[ai] = att;
                await this.actor.update({ 'system.attackValues': av });
            }
        }
    }
    async #onNpcPowerSpecialDel(event) {
        event.preventDefault();
        const $t = $(event.currentTarget);
        const scope = String($t.data('scope') || '');
        const si = parseInt(String($t.data('special-index') ?? '-1'), 10);
        if (si < 0)
            return;
        const phaseRaw = $t.data('phase-index');
        const attackRaw = $t.data('attack-index');
        const system = this.actor.system;
        if (scope === 'base') {
            const base = ensureNpcBaseShape(system.npcBaseAttack);
            if (si >= base.specials.length)
                return;
            base.specials.splice(si, 1);
            await this.actor.update({ 'system.npcBaseAttack': base });
            return;
        }
        if (scope === 'phase-base') {
            const pi = Number(phaseRaw);
            if (!Number.isFinite(pi) || !system.phases?.[pi])
                return;
            const phases = dup(system.phases);
            const base = ensureNpcBaseShape(phases[pi].npcBaseAttack);
            if (si >= base.specials.length)
                return;
            base.specials.splice(si, 1);
            phases[pi].npcBaseAttack = base;
            await this.actor.update({ 'system.phases': phases });
            return;
        }
        if (scope === 'extra') {
            const ai = Number(attackRaw);
            if (!Number.isFinite(ai))
                return;
            if (phaseRaw !== undefined && phaseRaw !== null && phaseRaw !== '') {
                const pi = Number(phaseRaw);
                if (!Number.isFinite(pi) || !system.phases?.[pi]?.attackValues?.[ai])
                    return;
                const phases = dup(system.phases);
                const att = dup(phases[pi].attackValues[ai]);
                if (!Array.isArray(att.specials) || si >= att.specials.length)
                    return;
                att.specials.splice(si, 1);
                phases[pi].attackValues[ai] = att;
                await this.actor.update({ 'system.phases': phases });
            }
            else {
                if (!system.attackValues?.[ai])
                    return;
                const av = dup(system.attackValues);
                const att = dup(av[ai]);
                if (!Array.isArray(att.specials) || si >= att.specials.length)
                    return;
                att.specials.splice(si, 1);
                av[ai] = att;
                await this.actor.update({ 'system.attackValues': av });
            }
        }
    }
    async #onPhaseAdd(event) {
        event.preventDefault();
        const system = this.actor.system;
        const phases = Array.isArray(system.phases) ? dup(system.phases) : [];
        const defaultAttack = {
            name: 'Waffenangriff',
            attackDiceCount: 6,
            damageDiceCount: 4,
            specials: [],
        };
        const defaultCombat = { initiative: 0, evade: 10, armor: 0, speed: 8 };
        const defaultHealth = {
            bars: [{ name: 'Healthy', max: 30, current: 30, penalty: 0 }],
            currentBar: 0,
            tempHP: 0,
        };
        // First phase: migrate the current (root) stats so adding phases does not
        // wipe Evade / Armor / Speed / HP that were already tuned on the sheet.
        if (phases.length === 0) {
            phases.push({
                name: 'Phase 1',
                health: dup(system.health) || defaultHealth,
                combat: { ...defaultCombat, ...(dup(system.combat) || {}) },
                npcBaseAttack: dup(system.npcBaseAttack) || defaultAttack,
                attackValues: Array.isArray(system.attackValues) ? dup(system.attackValues) : [],
                statusEffects: [],
            });
            await this.actor.update({
                'system.phases': phases,
                'system.npcActivePhaseIndex': 0,
            });
            return;
        }
        // Further phases: copy the previous phase as a starting point.
        const prev = phases[phases.length - 1] || {};
        phases.push({
            name: `Phase ${phases.length + 1}`,
            health: dup(prev.health) || dup(system.health) || defaultHealth,
            combat: { ...defaultCombat, ...(dup(prev.combat) || dup(system.combat) || {}) },
            npcBaseAttack: dup(prev.npcBaseAttack) || dup(system.npcBaseAttack) || defaultAttack,
            attackValues: Array.isArray(prev.attackValues)
                ? dup(prev.attackValues)
                : Array.isArray(system.attackValues)
                    ? dup(system.attackValues)
                    : [],
            statusEffects: [],
        });
        await this.actor.update({ 'system.phases': phases });
    }
    async #onPhaseDelete(event) {
        event.preventDefault();
        const phaseIndex = parseInt($(event.currentTarget).data('phase-index') || '0', 10);
        const system = this.actor.system;
        if (!system.phases || !Array.isArray(system.phases)) {
            return;
        }
        if (phaseIndex >= 0 && phaseIndex < system.phases.length) {
            const phases = dup(system.phases);
            phases.splice(phaseIndex, 1);
            await this.actor.update({ 'system.phases': phases });
        }
    }
}
//# sourceMappingURL=npc-sheet.js.map