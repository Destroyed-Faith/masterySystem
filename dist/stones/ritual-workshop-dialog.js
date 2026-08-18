/**
 * Ritual Workshop — catalog + declared-raise Skill Check UI.
 * Lives on the character sheet Rituals tab (no extra window).
 */
import { performRitualRoll } from '../combat/ritual-roll-handler.js';
import { poolSpendableStones } from '../utils/artifact-actor-rules.js';
import { RITUALS, RITUAL_STONE_COST_BY_RAISE, calculateRitualRaiseTN, calculateRitualTN, eligibleSkillsForRitual, getRitualById, ritualCategoryLabels, ritualMaxRaise, ritualStoneCost, } from '../utils/rituals.js';
import { SKILLS } from '../utils/skills.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
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
function skillKeyFromDisplayName(name) {
    const entry = Object.entries(SKILLS).find(([, def]) => def.name.toLowerCase() === name.toLowerCase());
    return entry ? entry[0] : null;
}
function actorMasteryRank(actor) {
    return Math.max(1, Math.floor(Number(actor.system?.mastery?.rank) || 1));
}
function attrLabel(key) {
    return ATTR_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
export class RitualWorkshopController {
    actor;
    selectedId;
    declaredRaise = 0;
    ritualMR;
    gmMod = 0;
    skillKey = '';
    attributeKey = '';
    placed = [];
    uiScrollTop = 0;
    onRefresh;
    constructor(actor, opts) {
        this.actor = actor;
        this.onRefresh = opts.onRefresh;
        this.ritualMR = actorMasteryRank(actor);
        const initial = (opts.ritualId && getRitualById(opts.ritualId)) || RITUALS[0];
        this.selectedId = initial?.id ?? '';
        this.#applyRitualDefaults(initial, true);
    }
    select(ritualId) {
        const ritual = getRitualById(ritualId);
        if (!ritual)
            return;
        this.selectedId = ritual.id;
        this.declaredRaise = 0;
        this.#applyRitualDefaults(ritual, true);
    }
    #selectedRitual() {
        return getRitualById(this.selectedId) ?? RITUALS[0];
    }
    #eligibleSkillKeys(ritual) {
        if (!ritual)
            return [];
        const keys = [];
        for (const display of eligibleSkillsForRitual(ritual)) {
            const key = skillKeyFromDisplayName(display);
            if (key && SKILLS[key])
                keys.push(key);
        }
        return keys;
    }
    #applyRitualDefaults(ritual, resetPlaced) {
        if (resetPlaced)
            this.placed = [];
        const keys = this.#eligibleSkillKeys(ritual);
        this.skillKey = keys.includes(this.skillKey) ? this.skillKey : (keys[0] ?? '');
        const attrs = SKILLS[this.skillKey]?.attributes ?? [];
        this.attributeKey = attrs.includes(this.attributeKey) ? this.attributeKey : (attrs[0] ?? '');
        const max = ritual ? ritualMaxRaise(ritual) : 4;
        this.declaredRaise = Math.max(0, Math.min(max, this.declaredRaise));
        this.#trimPlacedToCost(ritual);
    }
    #trimPlacedToCost(ritual) {
        if (!ritual) {
            this.placed = [];
            return;
        }
        const cost = ritualStoneCost(ritual, this.declaredRaise);
        if (this.placed.length > cost)
            this.placed = this.placed.slice(0, cost);
    }
    #canRoll(ritual, stoneCost) {
        return !!ritual && this.placed.length === stoneCost && !!this.skillKey && !!this.attributeKey;
    }
    prepareContext() {
        const ritual = this.#selectedRitual();
        const maxRaise = ritual ? ritualMaxRaise(ritual) : 0;
        this.declaredRaise = Math.max(0, Math.min(maxRaise, this.declaredRaise));
        this.#trimPlacedToCost(ritual);
        const categoryLabel = ritual ? ritualCategoryLabels(ritual) : '';
        const stoneCost = ritual ? ritualStoneCost(ritual, this.declaredRaise) : 1;
        const baseTn = calculateRitualTN(this.ritualMR, this.gmMod);
        const raiseTn = calculateRitualRaiseTN(baseTn, this.declaredRaise);
        const skillKeys = this.#eligibleSkillKeys(ritual);
        const skillOptions = skillKeys.map((key) => ({
            key,
            label: SKILLS[key]?.name ?? key,
            selected: key === this.skillKey,
        }));
        const attrKeys = SKILLS[this.skillKey]?.attributes ?? [];
        const attrOptions = attrKeys.map((key) => ({
            key,
            label: attrLabel(key),
            selected: key === this.attributeKey,
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
        const raises = (ritual?.raises ?? []).map((text, level) => ({
            level,
            text,
            cost: ritual ? ritualStoneCost(ritual, level) : RITUAL_STONE_COST_BY_RAISE[level] ?? 1,
        }));
        return {
            tabs: RITUALS.map((r) => ({
                id: r.id,
                name: r.name,
                active: r.id === this.selectedId,
            })),
            ritual: ritual
                ? {
                    ...ritual,
                    categoryLabel,
                    raises,
                }
                : null,
            meta: ritual
                ? {
                    castingTime: ritual.castingTime,
                    duration: ritual.duration,
                    requirement: ritual.requirement ?? '',
                    categoryLabel,
                    danger: ritual.danger ?? '',
                    limits: ritual.limits ?? '',
                    specialCostNote: ritual.specialCostNote ?? '',
                }
                : null,
            ritualMR: this.ritualMR,
            gmMod: this.gmMod,
            declaredRaise: this.declaredRaise,
            raiseOptions: Array.from({ length: maxRaise + 1 }, (_, level) => ({
                level,
                label: `Raise ${level}`,
                selected: level === this.declaredRaise,
            })),
            baseTn,
            raiseTn,
            stoneCost,
            skillOptions,
            attrOptions,
            pools,
            slots,
            canRoll: this.#canRoll(ritual, stoneCost),
            ruleTips: [
                {
                    label: 'Skill Check',
                    text: 'Rituals are normal Skill Checks. Choose a Skill from an allowed category that matches how you perform the Ritual. The GM has final approval. Skill Points may be spent after the roll.',
                },
                {
                    label: 'Ritual MR',
                    text: 'The MR of the thing affected (target, creator/owner, Artifact level, Power tier, or scene). Not your own MR. Your MR only decides how many dice you keep.',
                },
                {
                    label: 'TN',
                    text: 'Base Ritual TN = 8 x Ritual MR. Declare Raise before rolling. Raise TN = Base + declared Raises x 4. Below Base = fail. Base met but Raise TN missed = Raise 0 only. Extra margin does not unlock undeclared Raises.',
                },
                {
                    label: 'Stones',
                    text: `Cost by declared Raise: 0-1 = ${RITUAL_STONE_COST_BY_RAISE[0]} Stone, 2-3 = ${RITUAL_STONE_COST_BY_RAISE[2]}, 4 = ${RITUAL_STONE_COST_BY_RAISE[4]}. Any color. Paid Stones become Sealed on the attempt, even on failure or Raise 0 only. They return after a Safe Haven Rest.`,
                },
                {
                    label: 'Time',
                    text: 'Standard Ritual takes 1 Tyhran Hour. A rushed Ritual (GM) takes 1 Forearm and at least +4 TN.',
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
        root.querySelector('.js-rw-mr')?.addEventListener('change', (ev) => {
            this.ritualMR = Math.max(1, Math.floor(Number(ev.target.value) || 1));
            refresh();
        });
        root.querySelector('.js-rw-gm-mod')?.addEventListener('change', (ev) => {
            this.gmMod = Math.floor(Number(ev.target.value) || 0);
            refresh();
        });
        root.querySelector('.js-rw-raise')?.addEventListener('change', (ev) => {
            const ritual = this.#selectedRitual();
            const max = ritual ? ritualMaxRaise(ritual) : 4;
            this.declaredRaise = Math.max(0, Math.min(max, Math.floor(Number(ev.target.value) || 0)));
            this.#trimPlacedToCost(ritual);
            refresh();
        });
        root.querySelector('.js-rw-skill')?.addEventListener('change', (ev) => {
            this.skillKey = ev.target.value;
            const attrs = SKILLS[this.skillKey]?.attributes ?? [];
            if (!attrs.includes(this.attributeKey))
                this.attributeKey = attrs[0] ?? '';
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
                const ritual = this.#selectedRitual();
                if (!ritual)
                    return;
                const cost = ritualStoneCost(ritual, this.declaredRaise);
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
        const stoneCost = ritualStoneCost(ritual, this.declaredRaise);
        if (!this.#canRoll(ritual, stoneCost))
            return;
        const baseTn = calculateRitualTN(this.ritualMR, this.gmMod);
        await performRitualRoll(this.actor, ritual, {
            skillKey: this.skillKey,
            attributeKey: this.attributeKey,
            baseTn,
            ritualMR: this.ritualMR,
            gmMod: this.gmMod,
            declaredRaises: this.declaredRaise,
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