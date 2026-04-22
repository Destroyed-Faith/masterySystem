/**
 * Skill / Check Tag Registry
 *
 * Maps canonical skill names to semantic tags used by the Auto-Fail engine.
 * Currently the only consumer is Blinded, which forces `success: false` on
 * any check that carries the `sight` tag.
 *
 * This list is deliberately conservative: only skills whose core mechanic
 * requires sight land in the `sight` bucket. Non-sight variants (e.g.
 * "Perception (hearing)") should be tagged per-roll via the `checkContext`
 * hook passed into `masteryRoll`, not hardcoded here.
 *
 * GM-overridable via `CONFIG['mastery-system']?.skillTags` at runtime (merged
 * over these defaults; see `getSkillTags(name)`).
 */

export type SkillTag = 'sight' | 'hearing' | 'touch' | 'smell' | 'concentration';

const DEFAULT_SKILL_TAGS: Record<string, SkillTag[]> = {
  // Perception / scouting — default to sight; per-roll override via
  // `checkContext.tags = ['hearing']` is respected by the auto-fail engine.
  perception: ['sight'],
  investigation: ['sight'],
  tracking: ['sight'],
  spotting: ['sight'],
  search: ['sight'],

  // Social read-the-room checks rely on facial/body-language cues.
  insight: ['sight'],

  // Sight-based ranged or precision tasks.
  archery: ['sight'],
  marksmanship: ['sight'],

  // Non-sight senses (present for future extensions; unused by Blinded).
  listen: ['hearing'],
  eavesdrop: ['hearing'],
  smell: ['smell'],
};

function canonicalize(name: string): string {
  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function readOverrides(): Record<string, SkillTag[]> {
  try {
    const cfg: any = (globalThis as any).CONFIG;
    const raw = cfg?.['mastery-system']?.skillTags;
    if (raw && typeof raw === 'object') return raw;
  } catch {
    /* ignore */
  }
  return {};
}

/**
 * Lookup the tag list for a skill. Overrides from
 * `CONFIG['mastery-system'].skillTags` take precedence over the defaults.
 * Unknown skills yield an empty array (no tags → no auto-fail applies).
 */
export function getSkillTags(skillName: string): SkillTag[] {
  const key = canonicalize(skillName);
  if (!key) return [];
  const overrides = readOverrides();
  const merged: Record<string, SkillTag[]> = { ...DEFAULT_SKILL_TAGS };
  for (const [k, v] of Object.entries(overrides)) {
    if (Array.isArray(v)) merged[canonicalize(k)] = v.slice() as SkillTag[];
  }
  return merged[key] ?? [];
}

/** Expose the default table (useful for tests + settings UIs). */
export function getDefaultSkillTags(): Record<string, SkillTag[]> {
  return { ...DEFAULT_SKILL_TAGS };
}
