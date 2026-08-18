/**
 * Epic Mastery Roll — GM configuration dialog.
 */
import { SKILLS } from '../utils/skills.js';
import { buildDifficultyPresets } from '../dice/roll-context-build.js';
import { defaultRollTitleForKind } from './epic-mastery-roll-types.js';
import { startEpicMasteryRollSession } from './epic-mastery-roll-session.js';
import { listEpicRollCandidateActors, saveEpicRollRecentPreset, } from './epic-mastery-roll-settings.js';
import { resolveActorPortraitSrc, portraitFallbackSrc } from './epic-mastery-roll-portraits.js';
const ATTRIBUTES = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
const CHALLENGE_MR_MIN = 2;
const CHALLENGE_MR_MAX = 8;
const CHALLENGE_MR_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
function clampChallengeMR(value) {
    return Math.max(CHALLENGE_MR_MIN, Math.min(CHALLENGE_MR_MAX, Math.floor(value) || CHALLENGE_MR_MIN));
}
function defaultTnConfig() {
    const challengeMR = CHALLENGE_MR_MIN;
    const presets = buildDifficultyPresets(challengeMR);
    return {
        challengeMR,
        baseTN: presets.standard,
        raises: 0,
    };
}
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class EpicMasteryRollConfigDialog extends BaseDialog {
    sceneTitle = '';
    flavor = '';
    showTn = true;
    tn = defaultTnConfig();
    rollKind = 'skill';
    skillKey = 'athletics';
    attributeKey = 'might';
    selectedIds = [];
    preset = null;
    static DEFAULT_OPTIONS = {
        id: 'mastery-epic-roll-config',
        classes: ['mastery-system', 'epic-mastery-roll-config'],
        position: { width: 920, height: 640 },
        window: {
            title: 'Skill Roll',
            resizable: true,
        },
    };
    static PARTS = {
        content: {
            template: 'systems/mastery-system/templates/epic-roll/config-dialog.hbs',
        },
    };
    constructor(preset) {
        super();
        if (preset) {
            this.applyPreset(preset);
        }
        else {
            this.selectedIds = [];
        }
    }
    applyPreset(preset) {
        this.preset = preset;
        this.sceneTitle = preset.title;
        this.flavor = preset.flavor;
        this.showTn = preset.showTn;
        this.tn = { ...preset.tn, challengeMR: clampChallengeMR(preset.tn.challengeMR) };
        this.rollKind = preset.roll.kind;
        if (preset.roll.kind === 'skill')
            this.skillKey = preset.roll.skillKey;
        if (preset.roll.kind === 'attribute')
            this.attributeKey = preset.roll.attributeKey;
        this.selectedIds = [...preset.actorIds].filter((id) => {
            const actor = game.actors?.get(id);
            return actor?.type === 'character';
        });
    }
    async _prepareContext(_options) {
        const allActors = listEpicRollCandidateActors();
        const selectedSet = new Set(this.selectedIds);
        const presets = buildDifficultyPresets(this.tn.challengeMR);
        const raiseTn = this.tn.baseTN + this.tn.raises * 4;
        const skills = Object.entries(SKILLS)
            .map(([key, def]) => ({ key, name: def.name, category: def.category }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const mapActorRow = (a) => ({
            ...a,
            img: resolveActorPortraitSrc(game.actors?.get(a.id), a.img),
        });
        return {
            title: this.sceneTitle,
            flavor: this.flavor,
            showTn: this.showTn,
            tn: this.tn,
            raiseTn,
            presets,
            challengeMROptions: CHALLENGE_MR_OPTIONS,
            rollKind: this.rollKind,
            skillKey: this.skillKey,
            attributeKey: this.attributeKey,
            attributes: ATTRIBUTES,
            skills,
            availableActors: allActors.filter((a) => !selectedSet.has(a.id)).map(mapActorRow),
            selectedActors: allActors.filter((a) => selectedSet.has(a.id)).map(mapActorRow),
        };
    }
    async _onRender(context, options) {
        await super._onRender(context, options);
        const root = this.element;
        const fallback = portraitFallbackSrc();
        root.querySelectorAll('.emr-actor-thumb').forEach((img) => {
            img.onerror = () => {
                if (img.src !== fallback)
                    img.src = fallback;
            };
        });
        const bindInput = (selector, handler) => {
            root.querySelectorAll(selector).forEach((el) => {
                el.addEventListener('input', () => handler(el));
                el.addEventListener('change', () => handler(el));
            });
        };
        bindInput('[name="emr-title"]', (el) => {
            this.sceneTitle = el.value;
        });
        bindInput('[name="emr-flavor"]', (el) => {
            this.flavor = el.value;
        });
        bindInput('[name="emr-show-tn"]', (el) => {
            this.showTn = el.checked;
        });
        bindInput('[name="emr-challenge-mr"]', (el) => {
            this.tn.challengeMR = clampChallengeMR(parseInt(el.value) || CHALLENGE_MR_MIN);
            const p = buildDifficultyPresets(this.tn.challengeMR);
            this.tn.baseTN = p.standard;
            this.render(false);
        });
        bindInput('[name="emr-base-tn-preset"]', (el) => {
            const val = el.value;
            if (val === 'custom')
                return;
            this.tn.baseTN = parseInt(val) || this.tn.baseTN;
            this.render(false);
        });
        bindInput('[name="emr-custom-tn"]', (el) => {
            this.tn.baseTN = parseInt(el.value) || 0;
            this.render(false);
        });
        bindInput('[name="emr-raises"]', (el) => {
            this.tn.raises = Math.max(0, parseInt(el.value) || 0);
            this.render(false);
        });
        bindInput('[name="emr-roll-kind"]', (el) => {
            this.rollKind = el.value;
            this.render(false);
        });
        bindInput('[name="emr-skill-key"]', (el) => {
            this.skillKey = el.value;
        });
        bindInput('[name="emr-attribute-key"]', (el) => {
            this.attributeKey = el.value;
        });
        root.querySelectorAll('[data-action="emr-add-actor"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const id = btn.dataset.actorId;
                if (id && !this.selectedIds.includes(id)) {
                    this.selectedIds.push(id);
                    this.render(false);
                }
            };
        });
        root.querySelectorAll('[data-action="emr-remove-actor"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const id = btn.dataset.actorId;
                if (id) {
                    this.selectedIds = this.selectedIds.filter((x) => x !== id);
                    this.render(false);
                }
            };
        });
        const startBtn = root.querySelector('[data-action="emr-start"]');
        if (startBtn) {
            startBtn.onclick = async (ev) => {
                ev.preventDefault();
                await this.startSession();
            };
        }
    }
    buildRollConfig() {
        if (this.rollKind === 'attribute') {
            return { kind: 'attribute', attributeKey: this.attributeKey };
        }
        return { kind: 'skill', skillKey: this.skillKey };
    }
    readCustomTnFromDom() {
        const root = this.element;
        const preset = root.querySelector('[name="emr-base-tn-preset"]')?.value;
        if (preset === 'custom') {
            const custom = root.querySelector('[name="emr-custom-tn"]');
            if (custom)
                this.tn.baseTN = parseInt(custom.value) || this.tn.baseTN;
        }
    }
    async startSession() {
        this.readCustomTnFromDom();
        const config = {
            title: this.sceneTitle.trim() || defaultRollTitleForKind(this.rollKind),
            flavor: this.flavor.trim(),
            showTn: this.showTn,
            tn: { ...this.tn },
            roll: this.buildRollConfig(),
            actorIds: [...this.selectedIds].filter((id) => game.actors?.get(id)?.type === 'character'),
        };
        const session = await startEpicMasteryRollSession(config);
        if (!session)
            return;
        await saveEpicRollRecentPreset({
            title: config.title,
            flavor: config.flavor,
            showTn: config.showTn,
            tn: config.tn,
            roll: config.roll,
            actorIds: config.actorIds,
        });
        this.close();
    }
}
export function showEpicMasteryRollConfigDialog(preset) {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can start a Skill Roll.');
        return;
    }
    const existing = foundry.applications.instances.get('mastery-epic-roll-config');
    if (existing) {
        existing.bringToFront?.();
        return;
    }
    new EpicMasteryRollConfigDialog(preset).render(true);
}
export async function requestEpicMasteryRoll(preset) {
    showEpicMasteryRollConfigDialog(preset);
}
//# sourceMappingURL=epic-mastery-roll-config-dialog.js.map