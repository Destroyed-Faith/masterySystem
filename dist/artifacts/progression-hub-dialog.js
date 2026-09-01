/**
 * Unified Progression Hub — Attributes, Skills, Powers, and Artifacts in one dialog.
 */
import { ARTIFACT_CAPACITY_DEFAULT, ARTIFACT_LINK_STONE_COST, ARTIFACT_MAX_SYSTEM_LEVEL, listArtifactSpendableStonePools, usesStonePoolEconomy, } from '../utils/artifact-actor-rules.js';
import { repairArtifactEvolutionLinks } from '../utils/artifact-echo-repair.js';
import { applyAttributePendingChanges, applyPowerPendingChanges, applySkillPendingChanges, buildProgressionHubContext, calculateAttributePendingNetCost, calculatePowerPendingNetCost, calculateSkillPendingNetCost, getAttributeXpBaseline, hasFreeXp, } from '../progression/progression-hub-actions.js';
import { calculateMaxSkillRank } from '../utils/calculations.js';
import { buildArtifactEvolutionCards, linkArtifactForActor, resetArtifactActivationForActor, upgradeArtifactForActor, } from './artifact-evolution-actions.js';
import { wireEmbeddedArtifactToWorldTree } from '../utils/artifact-tree-grant.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class ProgressionHubDialog extends BaseDialog {
    actor;
    expandSection;
    openSections = new Set();
    scrollTop = 0;
    pendingAttributes = {};
    pendingSkills = {};
    pendingPowers = {};
    static DEFAULT_OPTIONS = {
        id: 'progression-hub-dialog',
        classes: ['mastery-system', 'progression-hub-dialog'],
        position: { width: 700, height: 760 },
        window: {
            title: 'Progression',
            resizable: true,
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/artifacts/progression-hub-dialog.hbs' },
    };
    constructor(actor, options = {}) {
        const mergedOptions = foundry.utils.mergeObject(ProgressionHubDialog.DEFAULT_OPTIONS, options);
        super(mergedOptions);
        this.actor = actor;
        this.expandSection = options.expandSection || 'overview';
        this.openSections.add('overview');
        this.openSections.add(this.expandSection);
    }
    async _prepareContext(_options) {
        const hub = buildProgressionHubContext(this.actor);
        const stonePools = listArtifactSpendableStonePools(this.actor);
        const attrNet = calculateAttributePendingNetCost(this.actor, this.pendingAttributes);
        const skillNet = calculateSkillPendingNetCost(this.actor, this.pendingSkills);
        const powerNet = calculatePowerPendingNetCost(this.actor, this.pendingPowers);
        const remainingAfterPending = hub.xp.available - attrNet - skillNet - powerNet;
        return {
            actor: this.actor,
            expandOverview: this.openSections.has('overview'),
            expandAttributes: this.openSections.has('attributes'),
            expandSkills: this.openSections.has('skills'),
            expandPowers: this.openSections.has('powers'),
            expandArtifacts: this.openSections.has('artifacts'),
            hub,
            stonePools,
            usesStonePools: usesStonePoolEconomy(this.actor),
            isGM: game.user?.isGM === true,
            pendingAttributes: this.pendingAttributes,
            pendingSkills: this.pendingSkills,
            pendingPowers: this.pendingPowers,
            hasPendingAttributes: Object.keys(this.pendingAttributes).length > 0,
            hasPendingSkills: Object.keys(this.pendingSkills).length > 0,
            hasPendingPowers: Object.keys(this.pendingPowers).length > 0,
            attrNet,
            skillNet,
            powerNet,
            remainingAfterPending,
            hasFreeXpPhase: hasFreeXp(this.actor),
            capacity: hub.artifactCapacity,
            cards: buildArtifactEvolutionCards(this.actor, {
                xpAvailable: Math.max(0, remainingAfterPending),
            }),
            hasUnwiredArtifacts: hub.unwiredArtifacts.length > 0,
            constants: {
                linkStone: ARTIFACT_LINK_STONE_COST,
                maxLevel: ARTIFACT_MAX_SYSTEM_LEVEL,
                capacityMax: ARTIFACT_CAPACITY_DEFAULT,
            },
        };
    }
    #dialogRoot() {
        const el = this.element;
        return el?.querySelector('.ph-dialog') ?? el ?? null;
    }
    #firstEnabledOption(select) {
        if (!select)
            return null;
        return Array.from(select.options).find((o) => o.value && !o.disabled) ?? null;
    }
    async _onRender(_context, _options) {
        const root = this.#dialogRoot();
        if (!root)
            return;
        // Preserve which sections are expanded across the full re-renders triggered
        // by every +/- bump, so the section the user is working in does not collapse.
        root.querySelectorAll('details.ph-section[data-section]').forEach((d) => {
            const sec = d.dataset.section;
            if (!sec)
                return;
            d.addEventListener('toggle', () => {
                if (d.open)
                    this.openSections.add(sec);
                else
                    this.openSections.delete(sec);
            });
        });
        // Restore scroll position (a full re-render otherwise jumps back to the top).
        const scrollBody = root.querySelector('.ph-scroll-body');
        if (scrollBody && this.scrollTop > 0) {
            scrollBody.scrollTop = this.scrollTop;
        }
        root.querySelectorAll('.ae-stone-select').forEach((sel) => {
            if (!sel.value) {
                const first = this.#firstEnabledOption(sel);
                if (first)
                    sel.value = first.value;
            }
        });
        root.querySelectorAll('.ae-path-select').forEach((sel) => {
            if (!sel.value || sel.selectedOptions[0]?.disabled) {
                const first = this.#firstEnabledOption(sel);
                if (first)
                    sel.value = first.value;
            }
        });
        root.querySelector('[data-action="ph-close"]').onclick = (ev) => {
            ev.preventDefault();
            this.close();
        };
        root.querySelectorAll('[data-action="ph-attr-dec"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const key = String(btn.dataset.attr);
                this.#bumpPending(this.pendingAttributes, key, -1, () => getAttributeXpBaseline(this.actor, key));
            };
        });
        root.querySelectorAll('[data-action="ph-attr-inc"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const key = String(btn.dataset.attr);
                this.#bumpPending(this.pendingAttributes, key, 1);
            };
        });
        root.querySelectorAll('[data-action="ph-skill-dec"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const key = String(btn.dataset.skill);
                this.#bumpPending(this.pendingSkills, key, -1);
            };
        });
        root.querySelectorAll('[data-action="ph-skill-inc"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const key = String(btn.dataset.skill);
                const masteryRank = this.actor.system?.mastery?.rank ?? 2;
                const maxSkill = calculateMaxSkillRank(masteryRank);
                const current = Number(this.actor.system.skills?.[key] ?? 0) || 0;
                const pending = this.pendingSkills[key] || 0;
                if (current + pending >= maxSkill) {
                    ui.notifications?.warn(`Skill cap ${maxSkill} at Mastery Rank ${masteryRank} (MR × 4).`);
                    return;
                }
                this.#bumpPending(this.pendingSkills, key, 1);
            };
        });
        root.querySelectorAll('[data-action="ph-power-dec"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const id = String(btn.dataset.powerId);
                this.#bumpPending(this.pendingPowers, id, -1);
            };
        });
        root.querySelectorAll('[data-action="ph-power-inc"]').forEach((btn) => {
            btn.onclick = (ev) => {
                ev.preventDefault();
                const id = String(btn.dataset.powerId);
                this.#bumpPending(this.pendingPowers, id, 1);
            };
        });
        root.querySelector('[data-action="ph-confirm-attr"]').onclick = async (ev) => {
            ev.preventDefault();
            const res = await applyAttributePendingChanges(this.actor, this.pendingAttributes);
            if (!res.ok) {
                ui.notifications?.error(res.error || 'Could not apply attribute changes.');
                return;
            }
            this.pendingAttributes = {};
            this.#captureScroll();
            await this.render({ force: true });
        };
        root.querySelector('[data-action="ph-confirm-skills"]').onclick = async (ev) => {
            ev.preventDefault();
            const res = await applySkillPendingChanges(this.actor, this.pendingSkills);
            if (!res.ok) {
                ui.notifications?.error(res.error || 'Could not apply skill changes.');
                return;
            }
            this.pendingSkills = {};
            this.#captureScroll();
            await this.render({ force: true });
        };
        root.querySelector('[data-action="ph-confirm-powers"]').onclick = async (ev) => {
            ev.preventDefault();
            const res = await applyPowerPendingChanges(this.actor, this.pendingPowers);
            if (!res.ok) {
                ui.notifications?.error(res.error || 'Could not apply power changes.');
                return;
            }
            this.pendingPowers = {};
            this.#captureScroll();
            await this.render({ force: true });
        };
        root.querySelectorAll('[data-action="ph-wire-artifact"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const embId = String(btn.dataset.embId);
                const emb = this.actor.items.get(embId);
                if (!emb)
                    return;
                const wire = await wireEmbeddedArtifactToWorldTree(this.actor, emb, { notify: true });
                if (!wire.ok && !wire.alreadyWired) {
                    ui.notifications?.warn(wire.reason || 'Could not link artifact to world tree.');
                    return;
                }
                await this.render({ force: true });
            };
        });
        root.querySelectorAll('[data-action="ae-activate"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const card = btn.closest('.ae-card');
                const sel = card?.querySelector('.ae-stone-select');
                const stoneAttr = sel?.value;
                if (!stoneAttr) {
                    ui.notifications?.warn('Wähle einen Stone aus deinem Pool.');
                    return;
                }
                const ok = await linkArtifactForActor(this.actor, String(btn.dataset.rootId), String(btn.dataset.embId), stoneAttr);
                if (ok)
                    await this.render({ force: true });
            };
        });
        root.querySelectorAll('[data-action="ae-link"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const ok = await linkArtifactForActor(this.actor, String(btn.dataset.rootId), String(btn.dataset.embId));
                if (ok)
                    await this.render({ force: true });
            };
        });
        root.querySelectorAll('[data-action="ae-gm-reset"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const displayName = btn.dataset.displayName || 'Artifact';
                const confirmed = await Dialog.confirm({
                    title: 'GM: Aktivierung zurücksetzen',
                    content: `<p>Stone zurückgeben und <strong>${displayName}</strong> deaktivieren?</p>`,
                    yes: () => true,
                    no: () => false,
                    defaultYes: false,
                });
                if (!confirmed)
                    return;
                const ok = await resetArtifactActivationForActor(this.actor, String(btn.dataset.rootId), String(btn.dataset.embId));
                if (ok)
                    await this.render({ force: true });
            };
        });
        root.querySelectorAll('[data-action="ae-upgrade-selected"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const card = btn.closest('.ae-card');
                const sel = card?.querySelector('.ae-path-select');
                const opt = sel?.selectedOptions[0];
                if (!sel?.value || !opt || opt.disabled) {
                    ui.notifications?.warn('Wähle einen gültigen Evolution-Pfad.');
                    return;
                }
                const ok = await upgradeArtifactForActor(this.actor, String(btn.dataset.rootId), String(btn.dataset.embId), String(opt.dataset.worldId), String(sel.value));
                if (ok)
                    await this.render({ force: true });
            };
        });
        root.querySelectorAll('[data-action="ae-gm-upgrade-selected"]').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const card = btn.closest('.ae-card');
                const sel = card?.querySelector('.ae-path-select');
                const opt = sel?.selectedOptions[0];
                if (!sel?.value || !opt) {
                    ui.notifications?.warn('Wähle einen gültigen Evolution-Pfad.');
                    return;
                }
                if (opt.dataset.gmDisabled === '1' || opt.disabled) {
                    ui.notifications?.warn('Dieser Pfad ist für ein GM-Upgrade nicht verfügbar (Artefakt zuerst aktivieren).');
                    return;
                }
                const displayName = card?.querySelector('.ae-card-title')?.textContent?.trim() || 'Artifact';
                const pathLabel = opt.textContent?.trim() || sel.value;
                const confirmed = await Dialog.confirm({
                    title: 'GM: Artefakt upgraden (ohne XP)',
                    content: `<p><strong>${displayName}</strong> entlang <strong>${pathLabel}</strong> upgraden?</p>` +
                        '<p>Kein XP wird abgezogen; MR-Cap und Upgrade-Step-Regel gelten nicht.</p>',
                    yes: () => true,
                    no: () => false,
                    defaultYes: false,
                });
                if (!confirmed)
                    return;
                const ok = await upgradeArtifactForActor(this.actor, String(btn.dataset.rootId), String(btn.dataset.embId), String(opt.dataset.worldId), String(sel.value), { gmFree: true });
                if (ok)
                    await this.render({ force: true });
            };
        });
    }
    #bumpPending(map, key, delta, minBaseline) {
        const current = map[key] || 0;
        const next = current + delta;
        if (next === 0)
            delete map[key];
        else
            map[key] = next;
        if (minBaseline && delta < 0) {
            const attrKey = key;
            const base = this.actor.system.attributes?.[attrKey]?.value || 0;
            const baseline = minBaseline();
            const effective = base + (map[key] || 0);
            if (effective < baseline) {
                delete map[key];
            }
        }
        this.#captureScroll();
        void this.render({ force: true });
    }
    #captureScroll() {
        const scrollBody = this.#dialogRoot()?.querySelector('.ph-scroll-body');
        this.scrollTop = scrollBody?.scrollTop ?? 0;
    }
}
export async function openProgressionHubDialog(actor, options = {}) {
    try {
        await repairArtifactEvolutionLinks(actor);
    }
    catch (err) {
        console.warn('[mastery-system] artifact evolution repair failed', err);
    }
    const existing = foundry.applications.instances.get('progression-hub-dialog');
    if (existing) {
        const dlg = existing;
        dlg['expandSection'] = options.expandSection || 'overview';
        dlg['actor'] = actor;
        dlg.bringToFront?.();
        await dlg.render({ force: true });
        return;
    }
    const dlg = new ProgressionHubDialog(actor, options);
    dlg.render(true);
}
//# sourceMappingURL=progression-hub-dialog.js.map