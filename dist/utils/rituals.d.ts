/**
 * Ritual System.
 *
 * Source: Players Guide 8954–9171.
 *
 *   • Rituals are out-of-combat Skill Checks against
 *     **TN = 8 × Ritual MR** (the MR of the *target*, not the caster).
 *     The GM may shift the TN in **±4 steps** for situational modifiers.
 *   • Each Ritual lists one or more **Allowed Skill Categories** rather
 *     than a fixed Skill / Attribute.  The player picks any single Skill
 *     from one of the listed categories that fits the described method
 *     (GM has final approval).
 *   • Raises are counted **after** the roll: every full +4 over TN = 1
 *     Raise.  A Ritual can succeed with 0 Raises (basic effect only).
 *   • Costs come out of the caster's Stone Pool and are **Sealed** until
 *     the next Safe Haven Rest.
 */
export type RitualSkillCategory = 'physical' | 'knowledge' | 'social' | 'survival' | 'martial';
export interface RitualDefinition {
    name: string;
    description: string;
    /** Number of Stones consumed (Sealed) when the Ritual succeeds. */
    stoneCost: number;
    /**
     * Skill Categories the player may choose from. The chosen Skill must
     * match the described method.
     */
    allowedSkillCategories: RitualSkillCategory[];
    /**
     * Per-Raise narrative outcomes (`raises[i]` = effect at i Raises over TN).
     */
    raises: string[];
    /** Casting time descriptor (Players Guide 9122–9126). */
    castingTime: string;
    /** Default duration descriptor for the Ritual's effect. */
    duration: string;
    /**
     * @deprecated Single-attribute hint kept for migration. The runtime now
     * uses `allowedSkillCategories` + a player-chosen Skill.
     */
    attribute?: string;
}
/**
 * Skills available per category (Players Guide 8980–8986).  Used by the
 * skill-picker to filter Skills the player may choose for a given Ritual.
 */
export declare const RITUAL_SKILLS_BY_CATEGORY: Record<RitualSkillCategory, readonly string[]>;
/**
 * Standard Ritual TN: `8 × Ritual MR`.  GMs may shift by ±4 per modifier.
 *
 * @param ritualMR  MR of the *target* (creature, item, place, …) — not the caster.
 * @param modifier  Optional flat ±4 step modifier (positive = harder).
 */
export declare function calculateRitualTN(ritualMR: number, modifier?: number): number;
/**
 * Count Raises from a Ritual roll result.  Every full +4 over TN = 1 Raise;
 * failure = 0 Raises.
 */
export declare function countRitualRaises(rollTotal: number, tn: number): number;
/**
 * Return all Skills that may be chosen for a Ritual based on its allowed
 * categories.  De-duplicates across categories.
 */
export declare function eligibleSkillsForRitual(ritual: RitualDefinition): string[];
/**
 * Core ritual catalog.  The catalog intentionally stays small — Players
 * Guide 9180+ lists the canonical Rituals (Detect Magic, Locate Object,
 * Augury, …); add more entries here as they ship.
 */
export declare const RITUALS: RitualDefinition[];
/**
 * Convenience: look up a Ritual by name (case-insensitive).
 */
export declare function getRitualByName(name: string): RitualDefinition | undefined;
//# sourceMappingURL=rituals.d.ts.map