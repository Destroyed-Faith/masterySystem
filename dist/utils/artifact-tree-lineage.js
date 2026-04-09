/**
 * Artifact evolution tree: root discovery, depth, locked profile fields for descendants.
 * Used by Node Editor, Embedded Power Dialog, and Artifact Builder sync.
 */
export function buildArtifactNodeIdMap(items) {
    const m = new Map();
    for (const it of items) {
        const nid = it.getFlag('mastery-system', 'nodeId');
        if (typeof nid === 'string' && nid)
            m.set(nid, it);
    }
    return m;
}
/** Ancestors from root down to immediate parent (excludes `item`). */
export function getAncestorChainRootFirst(item, nodeIdMap) {
    const reversed = [];
    let cur = item;
    const seen = new Set();
    while (cur) {
        const pids = cur.getFlag('mastery-system', 'parentIds') || [];
        if (!pids.length)
            break;
        const pid = pids[0];
        if (!pid || seen.has(pid))
            break;
        seen.add(pid);
        const p = nodeIdMap.get(pid);
        if (!p)
            break;
        reversed.push(p);
        cur = p;
    }
    return reversed.reverse();
}
export function findRootItem(item, nodeIdMap) {
    const chain = getAncestorChainRootFirst(item, nodeIdMap);
    return chain.length ? chain[0] : item;
}
/** Tree depth: root = 1, child of root = 2, … */
export function getTreeDepth(item, nodeIdMap) {
    return getAncestorChainRootFirst(item, nodeIdMap).length + 1;
}
export function isLineageRootItem(item) {
    const pids = item.getFlag('mastery-system', 'parentIds') || [];
    if (pids.length === 0)
        return true;
    if (item.getFlag('mastery-system', 'isRoot') === true)
        return true;
    return false;
}
export function getLockedWeaponBasics(rootSystem) {
    const w = (rootSystem?.artifactWeapon || {});
    const kind = rootSystem?.artifactKind;
    const artifactKind = kind === 'armor' || kind === 'shield' || kind === 'gear' || kind === 'weapon' ? kind : 'weapon';
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
export function mergeInnatesFromAncestors(ancestors) {
    const ordered = [];
    const set = new Set();
    for (const a of ancestors) {
        const sys = a.system;
        const w = sys?.artifactWeapon || {};
        for (const inn of w.innateAbilities || []) {
            const s = String(inn).trim();
            if (!s || set.has(s))
                continue;
            set.add(s);
            ordered.push(s);
        }
    }
    return { ordered, set };
}
export function specialRefKey(ref) {
    return `${ref.specialId}|${ref.value ?? ''}`;
}
/** Ordered union of weapon specials from ancestors (root → parent). */
export function mergeSpecialRefsFromAncestors(ancestors) {
    const ordered = [];
    const keySet = new Set();
    for (const a of ancestors) {
        const sys = a.system;
        const w = sys?.artifactWeapon || {};
        const specs = Array.isArray(w.specials) ? w.specials : [];
        for (const raw of specs) {
            if (!raw || typeof raw !== 'object')
                continue;
            const ref = {
                specialId: String(raw.specialId || '').trim(),
                value: raw.value != null && raw.value !== '' && Number.isFinite(Number(raw.value))
                    ? Number(raw.value)
                    : undefined
            };
            if (!ref.specialId)
                continue;
            const k = specialRefKey(ref);
            if (keySet.has(k))
                continue;
            keySet.add(k);
            ordered.push(ref);
        }
    }
    return { ordered, keySet };
}
/** All embedded power `id`s appearing on any ancestor item (root → parent). */
export function getMergedAncestorPowerIds(ancestors) {
    const ids = new Set();
    for (const a of ancestors) {
        const sys = a.system;
        const powers = sys?.powers;
        if (!Array.isArray(powers))
            continue;
        for (const p of powers) {
            const id = p && typeof p === 'object' && typeof p.id === 'string' ? p.id.trim() : '';
            if (id)
                ids.add(id);
        }
    }
    return ids;
}
export function getMaxTotalEmbeddedPowers(isRoot, depth, ancestorUniquePowerIdCount) {
    if (isRoot)
        return Number.POSITIVE_INFINITY;
    return ancestorUniquePowerIdCount + Math.max(0, depth - 1);
}
/**
 * Merge parent weapon into child: lock type/hands from parent; keep child damage/range;
 * innates/specials = locked (from full ancestor chain) then child-only extras.
 */
export function mergeArtifactWeaponForChildSync(parentWeapon, childWeapon, lockedInnateOrdered, lockedInnateSet, lockedSpecialOrdered, lockedSpecialKeySet) {
    const childInnates = (childWeapon.innateAbilities || []).map((s) => String(s).trim()).filter(Boolean);
    const extraInnates = childInnates.filter((s) => !lockedInnateSet.has(s));
    const childSpecs = Array.isArray(childWeapon.specials) ? childWeapon.specials : [];
    const extraSpecs = childSpecs.filter((r) => r?.specialId && !lockedSpecialKeySet.has(specialRefKey(r)));
    return {
        ...childWeapon,
        weaponType: parentWeapon.weaponType,
        hands: parentWeapon.hands,
        damage: childWeapon.damage != null ? String(childWeapon.damage) : parentWeapon.damage,
        range: childWeapon.range != null ? String(childWeapon.range) : parentWeapon.range,
        innateAbilities: [...lockedInnateOrdered, ...extraInnates],
        specials: [...lockedSpecialOrdered, ...extraSpecs]
    };
}
/** Merge armor: keep child's numeric fields; sync `type` from parent. */
export function mergeArtifactArmorForChildSync(parentArmor, childArmor) {
    return {
        ...(childArmor && typeof childArmor === 'object' ? childArmor : {}),
        type: parentArmor?.type || childArmor?.type || 'light'
    };
}
export function mergeArtifactShieldForChildSync(parentShield, childShield) {
    return {
        ...(childShield && typeof childShield === 'object' ? childShield : {}),
        type: parentShield?.type || childShield?.type || 'parry'
    };
}
/**
 * Child powers = parent's list (canonical order) plus child-only extras (ids not in parent).
 */
export function mergePowersParentToChild(parentPowers, childPowers) {
    const pl = Array.isArray(parentPowers) ? parentPowers : [];
    const cl = Array.isArray(childPowers) ? childPowers : [];
    const parentIds = new Set();
    for (const p of pl) {
        const id = p && typeof p === 'object' && typeof p.id === 'string' ? p.id.trim() : '';
        if (id)
            parentIds.add(id);
    }
    const out = pl.map((p) => JSON.parse(JSON.stringify(p)));
    for (const c of cl) {
        const id = c && typeof c === 'object' && typeof c.id === 'string' ? c.id.trim() : '';
        if (id && !parentIds.has(id)) {
            out.push(JSON.parse(JSON.stringify(c)));
        }
    }
    return out;
}
//# sourceMappingURL=artifact-tree-lineage.js.map