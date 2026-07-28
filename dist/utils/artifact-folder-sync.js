/**
 * Propagate merged artifact profile + powers from a parent item to all descendants in the same folder.
 * Used by Artifact Builder and Node Editor after saves.
 */
import { buildArtifactNodeIdMap, getAncestorChainRootFirst, mergeArtifactArmorForChildSync, mergeArtifactShieldForChildSync, mergeArtifactWeaponForChildSync, mergeInnatesFromAncestors, mergeSpecialRefsFromAncestors } from './artifact-tree-lineage.js';
import { pushWorldArtifactNodeToEmbeddedActors } from './artifact-embedded-sync.js';
import { inferArtifactEquipSlots } from './equip-slots.js';
import { deriveLevelProgressionFromPicks } from '../artifacts/progression-compiler.js';
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
        // Free Trait: the root's free pick reaches children via the locked innate
        // list. When the root swaps the pick, the child's previously synced trait
        // must not survive as an "own extra" — drop the stored freeTrait first.
        const childFreeTrait = String(childSystem.freeTrait || '').trim();
        if (childFreeTrait && !lockedInnateSet.has(childFreeTrait)) {
            childWeapon.innateAbilities = (childWeapon.innateAbilities || []).filter((s) => String(s).trim() !== childFreeTrait);
        }
        const mergedWeapon = mergeArtifactWeaponForChildSync(parentWeapon, childWeapon, lockedInnates, lockedInnateSet, lockedSpecs, lockedSpecKeys);
        const mergedArmor = mergeArtifactArmorForChildSync(parentArmor, childSystem.artifactArmor || defaultArmor);
        const mergedShield = mergeArtifactShieldForChildSync(parentShield, childSystem.artifactShield || defaultShield);
        // Picks drive the progression: the whole tree shares the parent's picks and
        // the derived Level Progression table. Embedded powers are no longer used.
        const inheritedPicks = Array.isArray(parentSystem.progressionPicks)
            ? parentSystem.progressionPicks
            : [];
        const inheritedProgression = deriveLevelProgressionFromPicks(inheritedPicks);
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
            'system.stoneFunction': parentSystem.stoneFunction ?? null,
            'system.freeTrait': String(parentSystem.freeTrait || '').trim(),
            'system.progressionPicks': inheritedPicks,
            'system.levelProgression': inheritedProgression,
            'system.powers': []
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