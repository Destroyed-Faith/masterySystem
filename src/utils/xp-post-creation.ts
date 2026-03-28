/**
 * Immutable post-character-creation progression snapshot (for GM reset).
 */

const ATTRIBUTE_KEYS = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'] as const;

function deepClone<T>(v: T): T {
  try {
    return JSON.parse(JSON.stringify(v === undefined ? {} : v)) as T;
  } catch {
    return (v ?? ({} as T)) as T;
  }
}

export interface PostCreationProgress {
  attributes: Record<string, number>;
  skills: Record<string, number>;
  skillsSpent: Record<string, number>;
  powerLevels: Record<string, number>;
}

export function buildPostCreationSnapshot(actor: any): PostCreationProgress {
  const system = actor.system || {};
  const attributes: Record<string, number> = {};
  for (const k of ATTRIBUTE_KEYS) {
    attributes[k] = system.attributes?.[k]?.value ?? 2;
  }
  const skills = deepClone(system.skills || {});
  const skillsSpent = deepClone(system.skillsSpent || {});
  const powerLevels: Record<string, number> = {};
  const items = actor.items?.filter((i: any) => i.type === 'power') || [];
  for (const item of items) {
    powerLevels[item.id] = item.system?.level ?? 1;
  }
  return { attributes, skills, skillsSpent, powerLevels };
}

export function actorHasPostCreationSnapshot(actor: any): boolean {
  const snap = actor.system?.xp?.postCreationProgress;
  if (!snap?.attributes || !snap.powerLevels) return false;
  return ATTRIBUTE_KEYS.every(k => typeof snap.attributes[k] === 'number');
}

/**
 * GM: restore attributes, skills, power levels, and session skill spend to post-creation snapshot;
 * return all earned XP to the available pool (totalSpent / spentAttributes cleared).
 */
export async function resetActorProgressToPostCreation(
  actor: any,
  options: { gmUserId: string; gmUserName: string }
): Promise<{ ok: boolean; error?: string }> {
  const xp = actor.system?.xp;
  const snap = xp?.postCreationProgress as PostCreationProgress | undefined;
  if (!snap?.attributes || !snap.powerLevels || !actorHasPostCreationSnapshot(actor)) {
    return {
      ok: false,
      error:
        'No post-creation snapshot. This character must complete creation on a current version of the system (or use a new actor).'
    };
  }

  const totalEarned = xp.totalEarned ?? 0;
  const beforeState = {
    available: actor.system.points?.xp ?? 0,
    totalEarned,
    totalSpent: xp.totalSpent ?? 0,
    spentAttributes: xp.spentAttributes ?? 0
  };

  const updates: Record<string, any> = {};

  for (const k of ATTRIBUTE_KEYS) {
    updates[`system.attributes.${k}.value`] = snap.attributes[k] ?? 2;
  }

  for (const key of Object.keys(snap.skills || {})) {
    updates[`system.skills.${key}`] = snap.skills[key];
  }
  for (const key of Object.keys(actor.system.skills || {})) {
    if (!Object.prototype.hasOwnProperty.call(snap.skills, key)) {
      updates[`system.skills.${key}`] = 0;
    }
  }

  const spentSnap = snap.skillsSpent || {};
  for (const key of Object.keys(spentSnap)) {
    updates[`system.skillsSpent.${key}`] = spentSnap[key];
  }
  for (const key of Object.keys(actor.system.skillsSpent || {})) {
    if (!Object.prototype.hasOwnProperty.call(spentSnap, key)) {
      updates[`system.skillsSpent.${key}`] = 0;
    }
  }

  updates['system.points.xp'] = totalEarned;
  updates['system.xp.totalSpent'] = 0;
  updates['system.xp.spentAttributes'] = 0;

  const historyEntry = {
    ts: Date.now(),
    userId: options.gmUserId,
    userName: options.gmUserName,
    kind: 'adjust' as const,
    category: 'xp' as const,
    amount: 0,
    note: 'GM reset: progression restored to post-creation snapshot; all earned XP returned to pool.',
    details: { resetToPostCreation: true },
    before: beforeState,
    after: {
      available: totalEarned,
      totalEarned,
      totalSpent: 0,
      spentAttributes: 0
    }
  };
  const prior = Array.isArray(xp.history) ? [...xp.history] : [];
  prior.push(historyEntry);
  updates['system.xp.history'] = prior.length > 200 ? prior.slice(-200) : prior;

  await actor.update(updates);

  for (const item of actor.items.filter((i: any) => i.type === 'power')) {
    const target = snap.powerLevels[item.id];
    if (target !== undefined && target !== (item.system?.level ?? 1)) {
      await item.update({ 'system.level': target });
    }
  }

  return { ok: true };
}
