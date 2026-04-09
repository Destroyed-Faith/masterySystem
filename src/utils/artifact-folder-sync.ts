/**
 * Propagate merged artifact profile + powers from a parent item to all descendants in the same folder.
 * Used by Artifact Builder and Node Editor after saves.
 */

import { normalizePowersForEditor } from './embedded-power-ui-constants.js';
import {
  buildArtifactNodeIdMap,
  getAncestorChainRootFirst,
  mergeArtifactArmorForChildSync,
  mergeArtifactShieldForChildSync,
  mergeArtifactWeaponForChildSync,
  mergeInnatesFromAncestors,
  mergePowersParentToChild,
  mergeSpecialRefsFromAncestors
} from './artifact-tree-lineage.js';

function getFolderArtifactItems(parentItem: Item): Item[] {
  const folderId = (parentItem as any).folder?.id;
  if (!folderId) return [];
  return (
    (game as any).items?.filter((item: any) => item.folder?.id === folderId && item.type === 'artifact') || []
  );
}

function findItemByNodeId(nodeId: string, items: Item[]): Item | undefined {
  return items.find((it: Item) => (it as any).getFlag('mastery-system', 'nodeId') === nodeId);
}

/**
 * Recursively merge parent → children (direct childIds only per step); weapon damage/range follow the parent; innates/specials/powers merge as in lineage helpers.
 */
export async function syncArtifactInheritedFromParent(parentItem: Item): Promise<void> {
  const parentSystem = parentItem.system as any;
  const parentBonuses = parentSystem.bonuses || {
    attack: 0,
    damage: '',
    defense: 0,
    specials: []
  };

  const defaultWeapon = {
    weaponType: 'melee' as const,
    damage: '1d8',
    range: '0m',
    hands: 1,
    innateAbilities: [] as string[],
    specials: [] as string[]
  };
  const defaultArmor = { type: 'light', armorValue: 0, evadeModifier: 0, skillPenalty: '' };
  const defaultShield = { type: 'parry', shieldValue: 0, evadeBonus: 0, skillPenalty: '' };

  const parentFlags = (parentItem as any).getFlag('mastery-system', 'childIds') || [];
  if (parentFlags.length === 0) return;

  const folderItems = getFolderArtifactItems(parentItem);
  const nodeIdMap = buildArtifactNodeIdMap(folderItems as any);

  const parentWeapon = foundry.utils.duplicate(parentSystem.artifactWeapon || defaultWeapon);
  const parentArmor = parentSystem.artifactArmor || defaultArmor;
  const parentShield = parentSystem.artifactShield || defaultShield;

  for (const childNodeId of parentFlags) {
    const childItem = findItemByNodeId(childNodeId, folderItems);
    if (!childItem) continue;

    const ancestorChain = getAncestorChainRootFirst(childItem as any, nodeIdMap);
    const { ordered: lockedInnates, set: lockedInnateSet } = mergeInnatesFromAncestors(ancestorChain as any);
    const { ordered: lockedSpecs, keySet: lockedSpecKeys } = mergeSpecialRefsFromAncestors(ancestorChain as any);

    const childSystem = childItem.system as any;
    const childWeapon = foundry.utils.duplicate(childSystem.artifactWeapon || defaultWeapon);

    const mergedWeapon = mergeArtifactWeaponForChildSync(
      parentWeapon,
      childWeapon,
      lockedInnates,
      lockedInnateSet,
      lockedSpecs,
      lockedSpecKeys
    );

    const mergedArmor = mergeArtifactArmorForChildSync(parentArmor, childSystem.artifactArmor || defaultArmor);
    const mergedShield = mergeArtifactShieldForChildSync(parentShield, childSystem.artifactShield || defaultShield);

    const mergedPowers = normalizePowersForEditor(
      mergePowersParentToChild(parentSystem.powers || [], childSystem.powers || []) as any[]
    );

    const updates: any = {
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

    await childItem.update(updates);

    await syncArtifactInheritedFromParent(childItem);
  }
}
