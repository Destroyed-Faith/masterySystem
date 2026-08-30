/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Single, read-only summary card: meta (slot / profile / level), the current
 * Base Values, and the up-to-3 active Level Progression abilities. No tabs, no
 * editable fields. GMs get an "Edit in Node Editor" link; all authoring still
 * happens in the Artifact Builder / Node Editor, never on this sheet.
 */
import { ARTIFACT_SLOT_LABELS, BASE_PROFILE_LABELS, } from '../utils/artifact-rules.js';
import { ARTIFACT_LINK_STONE_COST, ARTIFACT_UPGRADE_XP_COST, isArtifactLinkedOnActor, listArtifactSpendableStonePools, usesStonePoolEconomy, } from '../utils/artifact-actor-rules.js';
import { displayFromArtifactSystem, resolveNextArtifactPreviews, } from '../utils/artifact-sheet-preview.js';
import { buildArtifactEvolutionCards } from '../artifacts/artifact-evolution-actions.js';
import { openFoundryImagePopout } from '../ui/image-url-share.js';
import { getFilePickerClass } from '../utils/foundry-v14.js';
const BaseArtifactSheet = foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2);
function readChosenPath(wrap, btn) {
    const pathSel = wrap?.querySelector('.artifact-sheet-path-select');
    const worldId = String((pathSel instanceof HTMLSelectElement
        ? pathSel.selectedOptions[0]?.dataset.worldId
        : pathSel?.dataset.worldId) ||
        btn.dataset.worldId ||
        '');
    const nodeId = String(pathSel?.value || btn.dataset.nodeId || '');
    if (!worldId || !nodeId)
        return null;
    return { worldId, nodeId };
}
export class ArtifactSheetV2 extends BaseArtifactSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['mastery-system', 'sheet', 'item', 'artifact-sheet-v2'],
        position: { width: 520, height: 'auto' },
        window: { resizable: true },
        form: { submitOnChange: false, closeOnSubmit: false },
    };
    /** @override */
    static PARTS = {
        body: { template: 'systems/mastery-system/templates/item/artifact-sheet-v2.hbs' },
    };
    get title() {
        return String(this.item?.name || 'Artifact');
    }
    /** @override */
    async _prepareContext(_options) {
        const context = {};
        const item = this.item;
        const system = item.system;
        // ---- Read-friendly summary (what the artifact is + what it does) ----
        const slotKey = String(system.slot || '');
        const profileKey = String(system.baseProfile || '');
        const currentLevel = Math.max(1, Math.min(10, Number(system.currentLevel) || Number(system.level) || 1));
        const parentActor = item.parent?.documentName === 'Actor' ? item.parent : null;
        const mechanicallyActive = parentActor
            ? isArtifactLinkedOnActor(parentActor, item)
            : true;
        const current = displayFromArtifactSystem(system);
        const activation = mechanicallyActive ? current : displayFromArtifactSystem(system, { level: 1 });
        const nextPreviews = mechanicallyActive ? resolveNextArtifactPreviews(item) : [];
        const i18n = globalThis.game?.i18n;
        const loc = (key, fallback, data) => {
            const raw = data ? i18n?.format?.(key, data) : i18n?.localize?.(key);
            if (typeof raw === 'string' && raw && raw !== key)
                return raw;
            if (!data)
                return fallback;
            return fallback.replace(/\{(\w+)\}/g, (_, k) => data[k] ?? '');
        };
        context.item = item;
        context.system = system;
        context.cssClass = item.isOwner ? 'editable' : 'locked';
        context.isEditable = this.isEditable;
        context.isGM = !!game.user?.isGM;
        context.mechanicallyActive = mechanicallyActive;
        context.labels = {
            inactive: loc('MASTERY.artifact.sheet.inactive', 'Inactive — activate here or via Artifacts'),
            whenActivated: loc('MASTERY.artifact.sheet.whenActivated', 'When activated'),
            whenActivatedHint: loc('MASTERY.artifact.sheet.whenActivatedHint', 'These values and abilities unlock when you activate this artifact.'),
            nextLevelHint: loc('MASTERY.artifact.sheet.nextLevelHint', 'Unlocked when you raise this artifact.'),
            imgAlt: loc('MASTERY.artifact.sheet.imgAlt', 'Alternative image'),
            upgrade: loc('MASTERY.artifact.sheet.upgrade', 'Upgrade ({xp} XP)', {
                xp: String(ARTIFACT_UPGRADE_XP_COST),
            }),
            upgradeGm: loc('MASTERY.artifact.sheet.upgradeGm', 'GM: Upgrade (no XP)'),
            activate: loc('MASTERY.artifact.sheet.activate', 'Activate ({n} Stone)', {
                n: String(ARTIFACT_LINK_STONE_COST),
            }),
            choosePool: loc('MASTERY.artifact.sheet.choosePool', 'Stone pool'),
            path: loc('MASTERY.artifact.sheet.path', 'Path'),
            unwired: loc('MASTERY.artifact.sheet.unwired', 'This artifact is not linked to its evolution tree yet.'),
            wire: loc('MASTERY.artifact.sheet.wire', 'Link to world tree'),
        };
        context.imgAlt = String(system.imgAlt || '').trim();
        context.summary = {
            slotLabel: ARTIFACT_SLOT_LABELS[slotKey] || '',
            baseProfileLabel: BASE_PROFILE_LABELS[profileKey] || '',
            currentLevel,
            baseValues: activation.baseValues,
            abilities: activation.abilities,
            hasAbilities: activation.hasAbilities,
            hasBaseValues: activation.hasBaseValues,
        };
        context.nextPreviews = nextPreviews.map((preview) => ({
            ...preview,
            title: loc('MASTERY.artifact.sheet.nextLevel', 'Next: Level {level}', {
                level: String(preview.level),
            }),
        }));
        context.hasNextPreview = nextPreviews.length > 0;
        context.hasActivationPreview = !mechanicallyActive && (activation.hasBaseValues || activation.hasAbilities);
        const card = parentActor
            ? buildArtifactEvolutionCards(parentActor).find((c) => c.embeddedId === item.id)
            : undefined;
        const usesPools = parentActor ? usesStonePoolEconomy(parentActor) : false;
        const defaultPath = card?.nextUpgrade || card?.nextGmUpgrade || card?.paths?.[0] || null;
        context.actorActions = parentActor
            ? {
                show: true,
                isOwner: !!parentActor.isOwner,
                unwired: !card,
                linked: !!card?.linked,
                canActivate: !!card?.canActivate,
                canUpgrade: !!card?.canUpgrade,
                linkDisabledReason: card?.linkDisabledReason || '',
                upgradeDisabledReason: card?.upgradeDisabledReason || '',
                rootWorldId: card?.rootWorldId || '',
                embeddedId: item.id,
                paths: card?.paths ?? [],
                hasPaths: !!(card?.paths?.length),
                manyPaths: (card?.paths?.length ?? 0) > 1,
                selectedWorldId: defaultPath?.worldItemId || '',
                selectedNodeId: defaultPath?.nodeId || '',
                usesStonePools: usesPools,
                stonePools: usesPools ? listArtifactSpendableStonePools(parentActor) : [],
                nextGmUpgrade: !!card?.nextGmUpgrade,
            }
            : { show: false };
        return context;
    }
    /** @override */
    async _onRender(context, options) {
        await super._onRender?.(context, options);
        const root = this.element;
        if (!root)
            return;
        const item = this.item;
        const title = String(item.name || 'Artifact');
        const imgAlt = String(item.system?.imgAlt || '').trim();
        root.querySelector('[data-action="popout-img"]')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            void openFoundryImagePopout(String(item.img || ''), title);
        });
        root.querySelector('[data-action="popout-img-alt"]')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            if (imgAlt)
                void openFoundryImagePopout(imgAlt, `${title} — Alternative`);
        });
        root.querySelector('[data-action="edit-img-alt"]')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            if (!item.canUserModify?.(game.user, 'update'))
                return;
            const FilePickerImpl = getFilePickerClass();
            if (!FilePickerImpl)
                return;
            const fp = new FilePickerImpl({
                type: 'image',
                current: imgAlt,
                callback: (path) => {
                    void item.update({ 'system.imgAlt': path });
                },
            });
            fp.browse();
        });
        const parentActor = item.parent?.documentName === 'Actor' ? item.parent : null;
        const refresh = async () => {
            await this.render({ force: true });
        };
        root.querySelector('[data-action="sheet-activate"]')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            if (!parentActor?.isOwner)
                return;
            const btn = ev.currentTarget;
            const wrap = btn.closest('.artifact-card-actions');
            const poolSel = wrap?.querySelector('.artifact-sheet-pool-select');
            const { linkArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
            const ok = await linkArtifactForActor(parentActor, String(btn.dataset.rootId || ''), String(btn.dataset.embId || item.id), poolSel?.value || undefined);
            if (ok)
                await refresh();
        });
        root.querySelector('[data-action="sheet-upgrade"]')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            if (!parentActor?.isOwner)
                return;
            const btn = ev.currentTarget;
            const chosen = readChosenPath(btn.closest('.artifact-card-actions'), btn);
            if (!chosen) {
                ui.notifications?.warn('Choose a valid upgrade path.');
                return;
            }
            const { upgradeArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
            const ok = await upgradeArtifactForActor(parentActor, String(btn.dataset.rootId || ''), String(btn.dataset.embId || item.id), chosen.worldId, chosen.nodeId);
            if (ok)
                await refresh();
        });
        root.querySelector('[data-action="sheet-gm-upgrade"]')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            if (!game.user?.isGM || !parentActor)
                return;
            const btn = ev.currentTarget;
            const chosen = readChosenPath(btn.closest('.artifact-card-actions'), btn);
            if (!chosen) {
                ui.notifications?.warn('Choose a valid upgrade path.');
                return;
            }
            const confirmed = await Dialog.confirm({
                title: 'GM: Upgrade artifact (no XP)',
                content: `<p><strong>${item.name}</strong> along this path?</p>` +
                    '<p>No XP is spent. Mastery Rank cap and the once-per-step rule do not apply.</p>',
                yes: () => true,
                no: () => false,
                defaultYes: false,
            });
            if (!confirmed)
                return;
            const { upgradeArtifactForActor } = await import('../artifacts/artifact-evolution-actions.js');
            const ok = await upgradeArtifactForActor(parentActor, String(btn.dataset.rootId || ''), String(btn.dataset.embId || item.id), chosen.worldId, chosen.nodeId, { gmFree: true });
            if (ok)
                await refresh();
        });
        root.querySelector('[data-action="sheet-wire"]')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            if (!game.user?.isGM || !parentActor)
                return;
            const { wireEmbeddedArtifactToWorldTree } = await import('../utils/artifact-tree-grant.js');
            const wire = await wireEmbeddedArtifactToWorldTree(parentActor, item, { notify: true });
            if (wire?.ok)
                await refresh();
        });
        if (!game.user?.isGM)
            return;
        const btn = root.querySelector?.('[data-action="open-node-editor"]');
        if (!btn)
            return;
        btn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const { NodeEditor } = await import('../artifacts/node-editor.js');
            const self = this;
            const editor = new NodeEditor(this.item, {
                onSaved: async () => {
                    await self.render(false);
                },
            });
            editor.render(true);
        });
    }
}
//# sourceMappingURL=artifact-sheet-v2.js.map