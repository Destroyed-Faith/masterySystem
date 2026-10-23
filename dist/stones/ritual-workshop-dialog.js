/**
 * Ritual Workshop — Core Ritual catalogue + Named Tier / Raise Skill Check UI (DF 2026).
 * Lives on the character sheet Rituals tab (no extra window).
 */
import { performRitualRoll } from '../combat/ritual-roll-handler.js';
import { CORE_RITUALS, coreRitualTierText, getCoreRitualById, isSealPassage, stripRitualMarkdown, } from '../rules/core-rituals.js';
import { RITUAL_MAX_NAMED_TIER, RITUAL_MAX_TOTAL_RAISES, planRitualRaises, ritualFreeRaisesFromSpecialization, ritualSealedStoneCost, } from '../rules/ritual-tn.js';
import { poolSpendableStones } from '../utils/artifact-actor-rules.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import { masteryLocalize } from '../utils/mastery-localize.js';
const POOL_ATTRS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
const ATTR_LABELS = {
    might: 'Might',
    agility: 'Agility',
    vitality: 'Vitality',
    intellect: 'Intellect',
    resolve: 'Resolve',
    influence: 'Influence',
    wits: 'Wits',
};
function attrLabel(key) {
    return ATTR_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
function specKeyOf(spec, index) {
    return String(spec.id || `${spec.field ?? ''}:${spec.name}` || `spec-${index}`);
}
/** Split `exampleApproaches` ("Occult (…), Science & Craft (…).") into individual chips. */
function parseExampleApproaches(text) {
    const cleaned = stripRitualMarkdown(text).replace(/\.\s*$/, '');
    if (!cleaned)
        return [];
    return cleaned
        .split(/(?<=\))\s*,\s*/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
        const m = part.match(/^(.*?)\s*\((.*)\)$/);
        return m ? { label: m[1].trim(), text: part } : { label: part, text: part };
    });
}
export class RitualWorkshopController {
    actor;
    selectedId;
    /** Free-text description of how the Ritual is performed. */
    approach = '';
    /** Named tier 0–4 (Seal Passage Tier 4 = opening mode). */
    namedTier = 0;
    /** Extra generic Raises beyond the named tier. */
    genericRaises = 0;
    /** Source / task level; Base TN = 4 × max(3, level). */
    taskLevel = 3;
    gmMod = 0;
    attributeKey = POOL_ATTRS[0];
    /** Selected Specialization key ('' = none). */
    specKey = '';
    placed = [];
    uiScrollTop = 0;
    onRefresh;
    constructor(actor, opts) {
        this.actor = actor;
        this.onRefresh = opts.onRefresh;
        const initial = (opts.ritualId && getCoreRitualById(opts.ritualId)) || CORE_RITUALS[0];
        this.selectedId = initial?.id ?? '';
    }
    select(ritualId) {
        const ritual = getCoreRitualById(ritualId);
        if (!ritual)
            return;
        this.selectedId = ritual.id;
        this.namedTier = 0;
        this.genericRaises = 0;
        this.placed = [];
    }
    #selectedRitual() {
        return getCoreRitualById(this.selectedId) ?? CORE_RITUALS[0];
    }
    #specializations() {
        const raw = this.actor?.system?.specializations;
        const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
        return list
            .filter((s) => s && String(s.name ?? '').trim())
            .map((s) => ({
            id: s.id,
            name: String(s.name),
            field: s.field,
            scope: s.scope,
            rank: Math.max(0, Math.floor(Number(s.rank) || 0)),
        }));
    }
    #selectedSpec() {
        if (!this.specKey)
            return null;
        const specs = this.#specializations();
        const idx = specs.findIndex((s, i) => specKeyOf(s, i) === this.specKey);
        return idx >= 0 ? specs[idx] : null;
    }
    #clampRaises() {
        this.namedTier = Math.max(0, Math.min(RITUAL_MAX_NAMED_TIER, Math.floor(Number(this.namedTier) || 0)));
        const maxGeneric = Math.max(0, RITUAL_MAX_TOTAL_RAISES - this.namedTier);
        this.genericRaises = Math.max(0, Math.min(maxGeneric, Math.floor(Number(this.genericRaises) || 0)));
        this.taskLevel = Math.max(1, Math.floor(Number(this.taskLevel) || 1));
        if (!POOL_ATTRS.includes(this.attributeKey))
            this.attributeKey = POOL_ATTRS[0];
        if (this.specKey && !this.#selectedSpec())
            this.specKey = '';
    }
    #plan() {
        return planRitualRaises({
            taskLevel: this.taskLevel,
            namedTier: this.namedTier,
            genericRaises: this.genericRaises,
            specializationRank: this.#selectedSpec()?.rank ?? 0,
        });
    }
    #trimPlacedToCost() {
        const cost = this.#plan().sealedStones;
        if (this.placed.length > cost)
            this.placed = this.placed.slice(0, cost);
    }
    #canRoll(plan) {
        return (!!this.#selectedRitual() &&
            plan.ok &&
            this.placed.length === plan.sealedStones &&
            POOL_ATTRS.includes(this.attributeKey));
    }
    prepareContext() {
        const ritual = this.#selectedRitual();
        this.#clampRaises();
        this.#trimPlacedToCost();
        const plan = this.#plan();
        const spec = this.#selectedSpec();
        const stoneCost = plan.sealedStones;
        const baseTn = plan.baseTn + this.gmMod;
        const finalTn = plan.finalTn + this.gmMod;
        const sealPassage = !!ritual && isSealPassage(ritual);
        const specs = this.#specializations();
        const specOptions = [
            { key: '', label: 'None', selected: !this.specKey },
            ...specs.map((s, i) => {
                const key = specKeyOf(s, i);
                const free = ritualFreeRaisesFromSpecialization(s.rank);
                return {
                    key,
                    label: `${s.name} (Rank ${s.rank}${free ? `, ${free} Free` : ''})`,
                    selected: key === this.specKey,
                };
            }),
        ];
        const attrOptions = POOL_ATTRS.map((key) => ({
            key,
            label: attrLabel(key),
            selected: key === this.attributeKey,
        }));
        const tierOptions = Array.from({ length: RITUAL_MAX_NAMED_TIER + 1 }, (_, level) => ({
            level,
            label: sealPassage && level === 4 ? 'Tier 4 — Open passage (alternate)' : `Tier ${level}`,
            selected: level === this.namedTier,
        }));
        const placedCount = {};
        for (const attr of this.placed)
            placedCount[attr] = (placedCount[attr] ?? 0) + 1;
        const pools = POOL_ATTRS.map((attr) => {
            const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
            const spendable = Math.max(0, poolSpendableStones(this.actor, attr) - (placedCount[attr] ?? 0));
            return {
                attr,
                label: ATTR_LABELS[attr],
                spendable,
                gemStyle: style,
                gemSlots: Array.from({ length: spendable }, (_, index) => ({
                    attr,
                    index,
                    fill: style.fill,
                    stroke: style.stroke,
                })),
            };
        }).filter((p) => p.spendable > 0 || (placedCount[p.attr] ?? 0) > 0);
        const slots = Array.from({ length: stoneCost }, (_, index) => {
            const attr = this.placed[index];
            if (!attr)
                return { index, filled: false };
            const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
            return {
                index,
                filled: true,
                attr,
                label: attrLabel(attr),
                gemStyle: style,
            };
        });
        const raises = ritual
            ? [0, 1, 2, 3, 4].map((level) => ({
                level,
                text: coreRitualTierText(ritual, level),
                cost: ritualSealedStoneCost(level),
                selected: level === this.namedTier,
            }))
            : [];
        const approachChips = ritual ? parseExampleApproaches(ritual.exampleApproaches) : [];
        return {
            tabs: CORE_RITUALS.map((r) => ({
                id: r.id,
                name: r.name,
                active: r.id === this.selectedId,
            })),
            ritual: ritual
                ? {
                    id: ritual.id,
                    name: ritual.name,
                    description: ritual.tagline,
                    raises,
                }
                : null,
            meta: ritual
                ? {
                    castingTime: ritual.time,
                    duration: stripRitualMarkdown(ritual.effectDuration),
                    requirement: ritual.requirement ?? '',
                    baseTnNote: stripRitualMarkdown(ritual.baseTnNote),
                    exampleApproaches: stripRitualMarkdown(ritual.exampleApproaches),
                    danger: ritual.danger ?? '',
                    limits: stripRitualMarkdown(ritual.limits ?? ''),
                    specialCostNote: sealPassage
                        ? masteryLocalize('MASTERY.df2026.rituals.sealPassageAlt', 'Tier 4 is an alternate mode: open an existing sealed passage instead of sealing one. Declare before rolling.')
                        : '',
                }
                : null,
            approach: this.approach,
            approachChips,
            taskLevel: this.taskLevel,
            gmMod: this.gmMod,
            namedTier: this.namedTier,
            genericRaises: this.genericRaises,
            maxGenericRaises: Math.max(0, RITUAL_MAX_TOTAL_RAISES - this.namedTier),
            tierOptions,
            specOptions,
            hasSpecializations: specs.length > 0,
            specRank: spec?.rank ?? 0,
            freeRaises: plan.freeRaises,
            paidRaises: plan.paidRaises,
            totalRaises: plan.totalRaises,
            planError: plan.ok ? '' : (plan.error ?? ''),
            baseTn,
            raiseTn: finalTn,
            finalTn,
            stoneCost,
            attrOptions,
            pools,
            slots,
            canRoll: this.#canRoll(plan),
            ruleTips: [
                {
                    label: 'Skill Check',
                    text: 'Rituals are Skill Checks. Describe your Approach (free text or an example), pick any Attribute pool, and optionally a relevant Specialization. The GM has final approval.',
                },
                {
                    label: 'TN',
                    text: 'Base Ritual TN = 4 × max(3, Task Level) — minimum 12. Final TN = Base + 4 × Paid Raises. Missing the Final TN fails the whole attempt.',
                },
                {
                    label: 'Raises',
                    text: `Named Tier (0–4) plus generic Raises, max ${RITUAL_MAX_TOTAL_RAISES} total. A relevant Specialization at Rank 4 / 6 / 8 makes 1 / 2 / 3 Raises Free (+0 TN).`,
                },
                {
                    label: 'Stones',
                    text: 'Sealed Stones by total Raises (Paid + Free): 0–1 = 1, 2–3 = 2, 4+ = 3. Any color. They stay Sealed on the attempt, even on failure, until a Safe Haven Rest.',
                },
                {
                    label: 'Time',
                    text: `${ritual?.time ?? '1 Tyhran Hour'}. A rushed Ritual (GM) takes 1 Forearm and at least +4 TN.`,
                },
            ],
        };
    }
    bind(root) {
        const main = root.querySelector('.rw-main');
        if (main && this.uiScrollTop) {
            const top = this.uiScrollTop;
            main.scrollTop = top;
            requestAnimationFrame(() => {
                main.scrollTop = top;
            });
        }
        const refresh = (preserveScroll = true) => {
            const current = root.querySelector('.rw-main');
            this.uiScrollTop = preserveScroll ? (current?.scrollTop ?? 0) : 0;
            void this.onRefresh();
        };
        root.querySelectorAll('.js-rw-tab').forEach((el) => {
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const id = el.dataset.id ?? '';
                if (!id || id === this.selectedId)
                    return;
                this.select(id);
                refresh(false);
            });
        });
        root.querySelector('.js-rw-approach')?.addEventListener('input', (ev) => {
            this.approach = ev.target.value;
        });
        root.querySelector('.js-rw-approach')?.addEventListener('change', (ev) => {
            this.approach = ev.target.value;
        });
        root.querySelectorAll('.js-rw-approach-chip').forEach((el) => {
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                this.approach = el.dataset.text ?? '';
                refresh();
            });
        });
        root.querySelector('.js-rw-task-level')?.addEventListener('change', (ev) => {
            this.taskLevel = Math.max(1, Math.floor(Number(ev.target.value) || 1));
            refresh();
        });
        root.querySelector('.js-rw-gm-mod')?.addEventListener('change', (ev) => {
            this.gmMod = Math.floor(Number(ev.target.value) || 0);
            refresh();
        });
        root.querySelector('.js-rw-tier')?.addEventListener('change', (ev) => {
            this.namedTier = Math.floor(Number(ev.target.value) || 0);
            this.#clampRaises();
            this.#trimPlacedToCost();
            refresh();
        });
        root.querySelector('.js-rw-generic')?.addEventListener('change', (ev) => {
            this.genericRaises = Math.floor(Number(ev.target.value) || 0);
            this.#clampRaises();
            this.#trimPlacedToCost();
            refresh();
        });
        root.querySelector('.js-rw-spec')?.addEventListener('change', (ev) => {
            this.specKey = ev.target.value;
            this.#trimPlacedToCost();
            refresh();
        });
        root.querySelector('.js-rw-attr')?.addEventListener('change', (ev) => {
            this.attributeKey = ev.target.value;
            refresh();
        });
        root.querySelectorAll('.js-rw-pool-gem').forEach((el) => {
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const cost = this.#plan().sealedStones;
                if (this.placed.length >= cost)
                    return;
                const attr = el.dataset.attr;
                if (!attr)
                    return;
                this.placed.push(attr);
                refresh();
            });
        });
        root.querySelectorAll('.js-rw-slot-filled').forEach((el) => {
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const index = Number(el.dataset.index);
                if (!Number.isFinite(index) || index < 0)
                    return;
                this.placed.splice(index, 1);
                refresh();
            });
        });
        root.querySelector('.js-rw-roll')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            void this.#roll();
        });
    }
    async #roll() {
        const ritual = this.#selectedRitual();
        if (!ritual)
            return;
        this.#clampRaises();
        const plan = this.#plan();
        if (!plan.ok) {
            ui.notifications?.warn(plan.error ?? 'Invalid Ritual Raises.');
            return;
        }
        if (!this.#canRoll(plan))
            return;
        const spec = this.#selectedSpec();
        await performRitualRoll(this.actor, ritual, {
            attributeKey: this.attributeKey,
            taskLevel: this.taskLevel,
            approach: this.approach,
            specialization: spec
                ? { id: spec.id, name: spec.name, field: spec.field, rank: spec.rank }
                : null,
            namedTier: this.namedTier,
            genericRaises: this.genericRaises,
            gmMod: this.gmMod,
            placedAttrs: [...this.placed],
        });
        this.placed = [];
        await this.onRefresh();
    }
}
/** Open the character sheet on the Rituals tab (no floating dialog). */
export async function showRitualWorkshopOnSheet(actor, ritualId) {
    const sheet = actor.sheet;
    if (sheet?.openRitualWorkshop) {
        await sheet.openRitualWorkshop(ritualId);
        return;
    }
    ui.notifications?.warn('Open the character sheet to perform a Ritual.');
}
/** @deprecated Use showRitualWorkshopOnSheet — kept for existing callers. */
export const RitualWorkshopDialog = {
    show: showRitualWorkshopOnSheet,
};
//# sourceMappingURL=ritual-workshop-dialog.js.map