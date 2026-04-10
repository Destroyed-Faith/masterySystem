/**
 * Propagate merged artifact profile + powers from a parent item to all descendants in the same folder.
 * Used by Artifact Builder and Node Editor after saves.
 */
import { normalizePowersForEditor } from './embedded-power-ui-constants.js';
import { buildArtifactNodeIdMap, getAncestorChainRootFirst, mergeArtifactArmorForChildSync, mergeArtifactShieldForChildSync, mergeArtifactWeaponForChildSync, mergeInnatesFromAncestors, mergePowersParentToChild, mergeSpecialRefsFromAncestors } from './artifact-tree-lineage.js';
import { pushWorldArtifactNodeToEmbeddedActors } from './artifact-embedded-sync.js';
import { inferArtifactEquipSlots } from './equip-slots.js';
function getFolderArtifactItems(parentItem) {
    const folderId = parentItem.folder?.id;
    if (!folderId)
        return [];
    return (game.items?.filter((item) => item.folder?.id === folderId && item.type === 'artifact') || []);
}
function findItemByNodeId(nodeId, items) {
    return items.find((it) => it.getFlag('mastery-system', 'nodeId') === nodeId);
}
/**
 * Recursively merge parent → children (direct childIds only per step); weapon damage/range follow the parent; innates/specials/powers merge as in lineage helpers.
 */
export async function syncArtifactInheritedFromParent(parentItem) {
    const parentSystem = parentItem.system;
    const parentBonuses = parentSystem.bonuses || {
        attack: 0,
        damage: '',
        defense: 0,
        specials: []
    };
    const defaultWeapon = {
        weaponType: 'melee',
        damage: '1d8',
        range: '0m',
        hands: 1,
        innateAbilities: [],
        specials: []
    };
    const defaultArmor = { type: 'light', armorValue: 0, evadeModifier: 0, skillPenalty: '' };
    const defaultShield = { type: 'parry', shieldValue: 0, evadeBonus: 0, skillPenalty: '' };
    const parentFlags = parentItem.getFlag('mastery-system', 'childIds') || [];
    if (parentFlags.length === 0)
        return;
    const folderItems = getFolderArtifactItems(parentItem);
    const nodeIdMap = buildArtifactNodeIdMap(folderItems);
    const parentWeapon = foundry.utils.duplicate(parentSystem.artifactWeapon || defaultWeapon);
    const parentArmor = parentSystem.artifactArmor || defaultArmor;
    const parentShield = parentSystem.artifactShield || defaultShield;
    for (const childNodeId of parentFlags) {
        const childItem = findItemByNodeId(childNodeId, folderItems);
        if (!childItem)
            continue;
        const ancestorChain = getAncestorChainRootFirst(childItem, nodeIdMap);
        const { ordered: lockedInnates, set: lockedInnateSet } = mergeInnatesFromAncestors(ancestorChain);
        const { ordered: lockedSpecs, keySet: lockedSpecKeys } = mergeSpecialRefsFromAncestors(ancestorChain);
        const childSystem = childItem.system;
        const childWeapon = foundry.utils.duplicate(childSystem.artifactWeapon || defaultWeapon);
        const mergedWeapon = mergeArtifactWeaponForChildSync(parentWeapon, childWeapon, lockedInnates, lockedInnateSet, lockedSpecs, lockedSpecKeys);
        const mergedArmor = mergeArtifactArmorForChildSync(parentArmor, childSystem.artifactArmor || defaultArmor);
        const mergedShield = mergeArtifactShieldForChildSync(parentShield, childSystem.artifactShield || defaultShield);
        const mergedPowers = normalizePowersForEditor(mergePowersParentToChild(parentSystem.powers || [], childSystem.powers || []));
        const updates = {
            'system.artifactKind': parentSystem.artifactKind || 'weapon',
            'system.gearSlot': parentSystem.gearSlot || '',
            'system.artifactWeapon': mergedWeapon,
            'system.artifactArmor': mergedArmor,
            'system.artifactShield': mergedShield,
            'system.bonuses.attack': parentBonuses.attack || 0,
            'system.bonuses.damage': parentBonuses.damage || '',
            'system.bonuses.defense': parentBonuses.defense || 0,
            'system.bonuses.specials': [...(parentBonuses.specials || [])],
            'system.powers': mergedPowers
        };
        const inferredSlots = inferArtifactEquipSlots({
            artifactKind: parentSystem.artifactKind || 'weapon',
            gearSlot: parentSystem.gearSlot || '',
            artifactWeapon: mergedWeapon
        });
        if (inferredSlots) {
            updates['system.equipSlots'] = inferredSlots;
        }
        await childItem.update(updates);
        await pushWorldArtifactNodeToEmbeddedActors(childItem);
        await syncArtifactInheritedFromParent(childItem);
    }
}
//# sourceMappingURL=artifact-folder-sync.js.map