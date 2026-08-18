/**
 * Read-only artifact sheet: current card plus a grayed next-level preview.
 */
import { visibleAbilityRows } from './artifact-visible-abilities.js';
import { getChildWorldItemsForNode, getWorldArtifactItemsInFolder, } from './artifact-actor-tree.js';
function clampLevel(raw) {
    return Math.max(1, Math.min(10, Math.floor(Number(raw) || 1)));
}
function readFlag(item, key) {
    if (typeof item?.getFlag === 'function')
        return item.getFlag('mastery-system', key);
    return item?.flags?.['mastery-system']?.[key];
}
export function displayFromArtifactSystem(system, opts) {
    const sys = system || {};
    const level = opts?.level != null ? clampLevel(opts.level) : clampLevel(sys.currentLevel ?? sys.level);
    const baseValues = (Array.isArray(sys.baseValues) ? sys.baseValues : []).map((bv) => ({
        slot: String(bv?.slot || '').toUpperCase(),
        label: String(bv?.label || ''),
        value: bv?.value != null && bv.value !== '' ? String(bv.value) : String(bv?.note || ''),
    }));
    const abilities = visibleAbilityRows(Array.isArray(sys.levelProgression) ? sys.levelProgression : [], level).map((row) => ({
        name: String(row?.name || ''),
        type: String(row?.type || ''),
        effect: String(row?.effect || ''),
        special: String(row?.special || ''),
    }));
    return {
        level,
        baseValues,
        abilities,
        hasBaseValues: baseValues.length > 0,
        hasAbilities: abilities.length > 0,
    };
}
function previewLabel(item, level) {
    const name = String(item?.name || '')
        .replace(/\s*-\s*Level\s+\S+\s*$/i, '')
        .trim();
    return name || `Level ${level}`;
}
function abilityKey(ability) {
    return `${ability.name}\0${ability.type}\0${ability.effect}\0${ability.special}`;
}
/** Abilities that appear on `next` but not on the current card. */
export function newAbilitiesAtNextLevel(current, next) {
    const have = new Set(current.map(abilityKey));
    return next.filter((ability) => !have.has(abilityKey(ability)));
}
function toNextPreview(next, abilities, label) {
    if (!abilities.length)
        return null;
    return {
        level: next.level,
        label,
        baseValues: [],
        abilities,
        hasBaseValues: false,
        hasAbilities: true,
    };
}
function resolveChildWorldItems(item) {
    const nodeId = String(readFlag(item, 'evolutionNodeId') || readFlag(item, 'nodeId') || '');
    if (!nodeId)
        return [];
    const rootId = String(readFlag(item, 'evolutionRootItemId') || '');
    const root = rootId ? globalThis.game?.items?.get?.(rootId) : null;
    const folderId = String(root?.folder?.id || item?.folder?.id || '');
    if (!folderId)
        return [];
    const folderItems = getWorldArtifactItemsInFolder(folderId);
    return getChildWorldItemsForNode(nodeId, folderItems);
}
/** Next evolution node(s), or a same-item +1 fallback when the table still has more rows. */
export function resolveNextArtifactPreviews(item) {
    const current = displayFromArtifactSystem(item?.system);
    const children = resolveChildWorldItems(item);
    if (children.length) {
        return children
            .map((child) => {
            const next = displayFromArtifactSystem(child?.system);
            return toNextPreview(next, newAbilitiesAtNextLevel(current.abilities, next.abilities), previewLabel(child, next.level));
        })
            .filter((preview) => !!preview);
    }
    if (current.level >= 10)
        return [];
    const next = displayFromArtifactSystem(item?.system, { level: current.level + 1 });
    const preview = toNextPreview(next, newAbilitiesAtNextLevel(current.abilities, next.abilities), previewLabel(item, next.level));
    return preview ? [preview] : [];
}
//# sourceMappingURL=artifact-sheet-preview.js.map