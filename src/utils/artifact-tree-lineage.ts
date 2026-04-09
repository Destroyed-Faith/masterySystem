/**
 * Artifact evolution tree: root discovery, depth, locked profile fields for descendants.
 * Used by Node Editor, Embedded Power Dialog, and Artifact Builder sync.
 */

import type { ArtifactKind, ArtifactWeaponProfile, ArtifactWeaponSpecialRef } from '../types/item.js';

/** Minimal item shape for lineage (Foundry Item satisfies this). */
export interface LineageItemLike {
  id: string;
  getFlag(scope: string, key: string): unknown;
  system: unknown;
}

export function buildArtifactNodeIdMap(items: LineageItemLike[]): Map<string, LineageItemLike> {
  const m = new Map<string, LineageItemLike>();
  for (const it of items) {
    const nid = it.getFlag('mastery-system', 'nodeId');
    if (typeof nid === 'string' && nid) m.set(nid, it);
  }
  return m;
}

/** Ancestors from root down to immediate parent (excludes `item`). */
export function getAncestorChainRootFirst(item: LineageItemLike, nodeIdMap: Map<string, LineageItemLike>): LineageItemLike[] {
  const reversed: LineageItemLike[] = [];
  let cur: LineageItemLike | undefined = item;
  const seen = new Set<string>();
  while (cur) {
    const pids = (cur.getFlag('mastery-system', 'parentIds') as string[]) || [];
    if (!pids.length) break;
    const pid = pids[0];
    if (!pid || seen.has(pid)) break;
    seen.add(pid);
    const p = nodeIdMap.get(pid);
    if (!p) break;
    reversed.push(p);
    cur = p;
  }
  return reversed.reverse();
}

export function findRootItem(item: LineageItemLike, nodeIdMap: Map<string, LineageItemLike>): LineageItemLike {
  const chain = getAncestorChainRootFirst(item, nodeIdMap);
  return chain.length ? chain[0]! : item;
}

/** Tree depth: root = 1, child of root = 2, … */
export function getTreeDepth(item: LineageItemLike, nodeIdMap: Map<string, LineageItemLike>): number {
  return getAncestorChainRootFirst(item, nodeIdMap).length + 1;
}

export function isLineageRootItem(item: LineageItemLike): boolean {
  const pids = (item.getFlag('mastery-system', 'parentIds') as string[]) || [];
  if (pids.length === 0) return true;
  if (item.getFlag('mastery-system', 'isRoot') === true) return true;
  return false;
}

export function getLockedWeaponBasics(rootSystem: any): {
  artifactKind: ArtifactKind;
  gearSlot: string;
  weaponType: 'melee' | 'ranged';
  hands: number;
} {
  const w = (rootSystem?.artifactWeapon || {}) as Partial<ArtifactWeaponProfile>;
  const kind = rootSystem?.artifactKind;
  const artifactKind: ArtifactKind =
    kind === 'armor' || kind === 'shield' || kind === 'gear' || kind === 'weapon' ? kind : 'weapon';
  const handsRaw = w.hands;
  const hands = handsRaw === 2 ? 2 : 1;
  const wt = w.weaponType === 'ranged' ? 'ranged' : 'melee';
  return {
    artifactKind,
    gearSlot: typeof rootSystem?.gearSlot === 'string' ? rootSystem.gearSlot : '',
    weaponType: wt,
    hands
  };
}

/** Ordered union of innates from root → parent along `ancestors`. */
export function mergeInnatesFromAncestors(ancestors: LineageItemLike[]): { ordered: string[]; set: Set<string> } {
  const ordered: string[] = [];
  const set = new Set<string>();
  for (const a of ancestors) {
    const sys = a.system as any;
    const w = sys?.artifactWeapon || {};
    for (const inn of w.innateAbilities || []) {
      const s = String(inn).trim();
      if (!s || set.has(s)) continue;
      set.add(s);
      ordered.push(s);
    }
  }
  return { ordered, set };
}

export function specialRefKey(ref: ArtifactWeaponSpecialRef): string {
  return `${ref.specialId}|${ref.value ?? ''}`;
}

/** Ordered union of weapon specials from ancestors (root → parent). */
export function mergeSpecialRefsFromAncestors(ancestors: LineageItemLike[]): {
  ordered: ArtifactWeaponSpecialRef[];
  keySet: Set<string>;
} {
  const ordered: ArtifactWeaponSpecialRef[] = [];
  const keySet = new Set<string>();
  for (const a of ancestors) {
    const sys = a.system as any;
    const w = sys?.artifactWeapon || {};
    const specs: ArtifactWeaponSpecialRef[] = Array.isArray(w.specials) ? w.specials : [];
    for (const raw of specs) {
      if (!raw || typeof raw !== 'object') continue;
      const ref: ArtifactWeaponSpecialRef = {
        specialId: String((raw as any).specialId || '').trim(),
        value:
          (raw as any).value != null && (raw as any).value !== '' && Number.isFinite(Number((raw as any).value))
            ? Number((raw as any).value)
            : undefined
      };
      if (!ref.specialId) continue;
      const k = specialRefKey(ref);
      if (keySet.has(k)) continue;
      keySet.add(k);
      ordered.push(ref);
    }
  }
  return { ordered, keySet };
}

/** All embedded power `id`s appearing on any ancestor item (root → parent). */
export function getMergedAncestorPowerIds(ancestors: LineageItemLike[]): Set<string> {
  const ids = new Set<string>();
  for (const a of ancestors) {
    const sys = a.system as any;
    const powers = sys?.powers;
    if (!Array.isArray(powers)) continue;
    for (const p of powers) {
      const id = p && typeof p === 'object' && typeof (p as any).id === 'string' ? (p as any).id.trim() : '';
      if (id) ids.add(id);
    }
  }
  return ids;
}

/** Non-root: ancestor power id union + tree depth (extra capacity per tier). Root: unlimited. */
export function getMaxTotalEmbeddedPowers(isRoot: boolean, depth: number, ancestorUniquePowerIdCount: number): number {
  if (isRoot) return Number.POSITIVE_INFINITY;
  return ancestorUniquePowerIdCount + Math.max(1, depth);
}

/**
 * Merge parent weapon into child: lock type/hands from parent; **damage/range from parent** (propagate down the tree);
 * innates/specials = locked (from full ancestor chain) then child-only extras.
 */
export function mergeArtifactWeaponForChildSync(
  parentWeapon: ArtifactWeaponProfile,
  childWeapon: ArtifactWeaponProfile,
  lockedInnateOrdered: string[],
  lockedInnateSet: Set<string>,
  lockedSpecialOrdered: ArtifactWeaponSpecialRef[],
  lockedSpecialKeySet: Set<string>
): ArtifactWeaponProfile {
  const childInnates = (childWeapon.innateAbilities || []).map((s) => String(s).trim()).filter(Boolean);
  const extraInnates = childInnates.filter((s) => !lockedInnateSet.has(s));

  const childSpecs: ArtifactWeaponSpecialRef[] = Array.isArray(childWeapon.specials) ? childWeapon.specials : [];
  const extraSpecs = childSpecs.filter((r) => r?.specialId && !lockedSpecialKeySet.has(specialRefKey(r)));

  const dmg =
    parentWeapon.damage != null && String(parentWeapon.damage).trim() !== ''
      ? String(parentWeapon.damage)
      : childWeapon.damage != null
        ? String(childWeapon.damage)
        : '1d8';
  const rng =
    parentWeapon.range != null && String(parentWeapon.range).trim() !== ''
      ? String(parentWeapon.range)
      : childWeapon.range != null
        ? String(childWeapon.range)
        : '0m';

  return {
    ...childWeapon,
    weaponType: parentWeapon.weaponType,
    hands: parentWeapon.hands,
    damage: dmg,
    range: rng,
    innateAbilities: [...lockedInnateOrdered, ...extraInnates],
    specials: [...lockedSpecialOrdered, ...extraSpecs]
  };
}

/** Merge armor: keep child's numeric fields; sync `type` from parent. */
export function mergeArtifactArmorForChildSync(parentArmor: any, childArmor: any): any {
  return {
    ...(childArmor && typeof childArmor === 'object' ? childArmor : {}),
    type: parentArmor?.type || childArmor?.type || 'light'
  };
}

export function mergeArtifactShieldForChildSync(parentShield: any, childShield: any): any {
  return {
    ...(childShield && typeof childShield === 'object' ? childShield : {}),
    type: parentShield?.type || childShield?.type || 'parry'
  };
}

/**
 * Child powers = parent's list (canonical order) plus child-only extras (ids not in parent).
 */
export function mergePowersParentToChild(parentPowers: unknown[], childPowers: unknown[]): unknown[] {
  const pl = Array.isArray(parentPowers) ? parentPowers : [];
  const cl = Array.isArray(childPowers) ? childPowers : [];
  const parentIds = new Set<string>();
  for (const p of pl) {
    const id = p && typeof p === 'object' && typeof (p as any).id === 'string' ? (p as any).id.trim() : '';
    if (id) parentIds.add(id);
  }
  const out = pl.map((p) => JSON.parse(JSON.stringify(p)));
  for (const c of cl) {
    const id = c && typeof c === 'object' && typeof (c as any).id === 'string' ? (c as any).id.trim() : '';
    if (id && !parentIds.has(id)) {
      out.push(JSON.parse(JSON.stringify(c)));
    }
  }
  return out;
}
