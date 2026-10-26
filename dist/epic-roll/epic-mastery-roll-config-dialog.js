/**
 * Epic Mastery Roll — unified GM Rolls configuration dialog.
 * Skill Checks publish a chat-driven request (players propose; GM approves in chat).
 * Attribute and Fear checks keep the cinematic session flow.
 */
import { buildDifficultyPresets } from '../dice/roll-context-build.js';
import { standardTnForMasteryRank } from '../utils/constants.js';
import { readSituationalSkills } from '../rules/index.js';
import { defaultRollTitleForKind } from './epic-mastery-roll-types.js';
import { startEpicMasteryRollSession } from './epic-mastery-roll-session.js';
import { isEpicRollPlayerCharacter, listEpicRollCandidateActors, saveEpicRollRecentPreset, } from './epic-mastery-roll-settings.js';
import { resolveActorPortraitSrc, portraitFallbackSrc } from './epic-mastery-roll-portraits.js';
import { ROLLS_ATTRIBUTES, defaultComparativeConfig, taskLevelTnPresets, } from './rolls-skill-panel.js';
import { startSkillWorkflowFromRolls } from './rolls-skill-start.js';
import { registerRollsSkillSuggestionHandlers } from './rolls-skill-suggestions.js';
const ATTRIBUTES = [...ROLLS_ATTRIBUTES];
const CHALLENGE_MR_MIN = 1;
const CHALLENGE_MR_MAX = 8;
const CHALLENGE_MR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
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
    taskDescription = '';
    skillMode = 'standard';
    skillBaseTn = 12;
    comparative = defaultComparativeConfig();
    static DEFAULT_OPTIONS = {
        id: 'mastery-epic-roll-config',
        classes: ['mastery-system', 'epic-mastery-roll-config'],
        position: { width: 960, height: 640 },
        window: {
            title: 'Rolls',
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
        if (preset.roll.kind === 'fear') {
            this.tn.baseTN = 16;
            this.tn.raises = 0;
        }
        this.selectedIds = [...preset.actorIds].filter((id) => isEpicRollPlayerCharacter(game.actors?.get(id)));
    }
    applyGroupAmbushPreset() {
        this.rollKind = 'skill';
        this.skillMode = 'comparative';
        this.comparative = {
            ...defaultComparativeConfig(),
            groupAmbush: true,
            source: 'virtual',
            virtual: {
                name: 'Observers',
                skillName: 'Perception',
                poolDice: 8,
                masteryRank: 2,
                skillRank: 2,
                attributeKey: 'wits',
                allowSkillCrit: false,
            },
        };
        if (!this.sceneTitle.trim())
            this.sceneTitle = 'Group Ambush';
        if (!this.taskDescription.trim())
            this.taskDescription = 'Group Ambush · Stealth';
    }
    listNpcActors() {
        const out = [];
        for (const a of game.actors ?? []) {
            if (a.type === 'npc') {
                out.push({ id: String(a.id), name: String(a.name ?? 'NPC') });
            }
        }
        return out.sort((a, b) => a.name.localeCompare(b.name));
    }
    async _prepareContext(_options) {
        const allActors = listEpicRollCandidateActors();
        const selectedSet = new Set(this.selectedIds);
        const presets = buildDifficultyPresets(this.tn.challengeMR);
        const raiseTn = this.tn.baseTN + this.tn.raises * 4;
        const taskLevelPresets = taskLevelTnPresets();
        const taskLevelTnValues = taskLevelPresets.map((p) => p.tn);
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
            challengeMROptions: CHALLENGE_MR_OPTIONS.map((mr) => ({
                mr,
                standardTn: standardTnForMasteryRank(mr),
            })),
            isFearRoll: this.rollKind === 'fear',
            rollKind: this.rollKind,
            skillKey: this.skillKey,
            attributeKey: this.attributeKey,
            attributes: ATTRIBUTES,
            availableActors: allActors.filter((a) => !selectedSet.has(a.id)).map(mapActorRow),
            selectedActors: allActors.filter((a) => selectedSet.has(a.id)).map(mapActorRow),
            taskDescription: this.taskDescription,
            skillMode: this.skillMode,
            skillBaseTn: this.skillBaseTn,
            skillTnCustom: !taskLevelTnValues.includes(this.skillBaseTn),
            comparative: this.comparative,
            npcActors: this.listNpcActors(),
            taskLevelPresets,
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
            root
                .querySelectorAll(selector)
                .forEach((el) => {
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
        bindInput('[name="emr-task"]', (el) => {
            this.taskDescription = el.value;
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
        bindInput('[name="emr-skill-tn-preset"]', (el) => {
            const val = el.value;
            if (val === 'custom')
                return;
            this.skillBaseTn = parseInt(val) || this.skillBaseTn;
            this.render(false);
        });
        bindInput('[name="emr-skill-tn-custom"]', (el) => {
            this.skillBaseTn = Math.max(0, parseInt(el.value) || 0);
        });
        bindInput('[name="emr-roll-kind"]', (el) => {
            this.rollKind = el.value;
            if (this.rollKind === 'fear') {
                this.tn.baseTN = 16;
                this.tn.raises = 0;
                if (!this.sceneTitle.trim())
                    this.sceneTitle = 'Fear Check';
            }
            else if (this.rollKind !== 'skill') {
                const p = buildDifficultyPresets(this.tn.challengeMR);
                if (this.tn.baseTN === 8 || this.tn.baseTN === 16)
                    this.tn.baseTN = p.standard;
            }
            this.render(false);
        });
        bindInput('[name="emr-attribute-key"]', (el) => {
            this.attributeKey = el.value;
        });
        root.querySelectorAll('input[name="emr-skill-mode"]').forEach((el) => {
            el.addEventListener('change', () => {
                if (!el.checked)
                    return;
                this.skillMode = el.value;
                this.render(false);
            });
        });
        bindInput('[name="emr-opp-source"]', (el) => {
            this.comparative.source = el.value;
            this.render(false);
        });
        bindInput('[name="emr-opp-npc"]', (el) => {
            this.comparative.npcActorId = el.value;
            const npc = game.actors?.get(this.comparative.npcActorId);
            const skills = readSituationalSkills(npc?.system);
            if (skills[0] && !this.comparative.npcSkillKey) {
                this.comparative.npcSkillKey = skills[0].name;
            }
        });
        bindInput('[name="emr-opp-npc-skill"]', (el) => {
            this.comparative.npcSkillKey = el.value;
        });
        bindInput('[name="emr-opp-npc-attr"]', (el) => {
            this.comparative.npcAttributeKey = el.value;
        });
        bindInput('[name="emr-virt-name"]', (el) => {
            this.comparative.virtual.name = el.value;
        });
        bindInput('[name="emr-virt-skill"]', (el) => {
            this.comparative.virtual.skillName = el.value;
        });
        bindInput('[name="emr-virt-pool"]', (el) => {
            this.comparative.virtual.poolDice = Math.max(0, parseInt(el.value) || 0);
        });
        bindInput('[name="emr-virt-mr"]', (el) => {
            this.comparative.virtual.masteryRank = Math.max(1, parseInt(el.value) || 1);
        });
        bindInput('[name="emr-virt-rank"]', (el) => {
            this.comparative.virtual.skillRank = Math.max(0, Math.min(8, parseInt(el.value) || 0));
        });
        bindInput('[name="emr-virt-crit"]', (el) => {
            this.comparative.virtual.allowSkillCrit = el.checked;
        });
        bindInput('[name="emr-group-ambush"]', (el) => {
            this.comparative.groupAmbush = el.checked;
            this.render(false);
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
        if (this.rollKind === 'fear')
            return { kind: 'fear' };
        if (this.rollKind === 'attribute') {
            return { kind: 'attribute', attributeKey: this.attributeKey };
        }
        return { kind: 'skill', skillKey: this.skillKey };
    }
    readCustomTnFromDom() {
        if (this.rollKind === 'fear') {
            this.tn.baseTN = 16;
            this.tn.raises = 0;
            return;
        }
        const root = this.element;
        if (this.rollKind === 'skill') {
            const preset = root.querySelector('[name="emr-skill-tn-preset"]')?.value;
            if (preset === 'custom') {
                const custom = root.querySelector('[name="emr-skill-tn-custom"]');
                if (custom)
                    this.skillBaseTn = parseInt(custom.value) || this.skillBaseTn;
            }
            return;
        }
        const preset = root.querySelector('[name="emr-base-tn-preset"]')?.value;
        if (preset === 'custom') {
            const custom = root.querySelector('[name="emr-custom-tn"]');
            if (custom)
                this.tn.baseTN = parseInt(custom.value) || this.tn.baseTN;
        }
    }
    async startSession() {
        if (this.rollKind === 'skill') {
            this.readCustomTnFromDom();
            const task = this.taskDescription.trim() || this.sceneTitle.trim();
            if (!task) {
                ui.notifications?.warn('Describe the Task / Obstacle first.');
                return;
            }
            const result = await startSkillWorkflowFromRolls({
                title: this.sceneTitle.trim() || 'Skill Check',
                taskDescription: task,
                note: this.flavor.trim(),
                showTn: this.showTn,
                mode: this.skillMode,
                baseTn: this.skillBaseTn,
                invitedActorIds: [...this.selectedIds],
                comparative: this.comparative,
            });
            if (!result.ok) {
                ui.notifications?.warn(result.error || 'Failed to publish Skill Check.');
                return;
            }
            ui.notifications?.info('Skill Check published to chat.');
            this.close();
            return;
        }
        this.readCustomTnFromDom();
        const tn = this.rollKind === 'fear'
            ? { challengeMR: this.tn.challengeMR, baseTN: 16, raises: 0 }
            : { ...this.tn };
        const config = {
            title: this.sceneTitle.trim() || defaultRollTitleForKind(this.rollKind),
            flavor: this.flavor.trim(),
            showTn: this.showTn,
            tn,
            roll: this.buildRollConfig(),
            actorIds: [...this.selectedIds].filter((id) => isEpicRollPlayerCharacter(game.actors?.get(id))),
        };
        if (!config.actorIds.length) {
            ui.notifications?.warn('Select at least one participant.');
            return;
        }
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
/** No-op stub kept so register-epic-mastery-roll import stays stable. */
export { registerRollsSkillSuggestionHandlers };
export function showEpicMasteryRollConfigDialog(preset) {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can start Rolls.');
        return;
    }
    const existing = foundry.applications.instances.get('mastery-epic-roll-config');
    if (existing) {
        existing.bringToFront?.();
        return;
    }
    new EpicMasteryRollConfigDialog(preset).render(true);
}
export function showEpicMasteryRollConfigDialogForGroupAmbush() {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can start Rolls.');
        return;
    }
    const existing = foundry.applications.instances.get('mastery-epic-roll-config');
    if (existing) {
        existing.applyGroupAmbushPreset();
        void existing.render?.(false);
        existing.bringToFront?.();
        return;
    }
    const dlg = new EpicMasteryRollConfigDialog();
    dlg.applyGroupAmbushPreset();
    dlg.render(true);
}
export async function requestEpicMasteryRoll(preset) {
    showEpicMasteryRollConfigDialog(preset);
}
//# sourceMappingURL=epic-mastery-roll-config-dialog.js.map