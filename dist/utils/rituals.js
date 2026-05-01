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
/**
 * Skills available per category (Players Guide 8980–8986).  Used by the
 * skill-picker to filter Skills the player may choose for a given Ritual.
 */
export const RITUAL_SKILLS_BY_CATEGORY = {
    physical: [
        'Athletics', 'Acrobatics', 'Stealth', 'Concealment', 'Ride', 'Sleight of Hand',
    ],
    knowledge: [
        'Lore', 'Alchemy', 'Crafting', 'Artisanry', 'Engineering', 'Medicine',
        'Navigation', 'Occultism', 'Investigation',
    ],
    social: [
        'Persuasion', 'Deception', 'Intimidation', 'Leadership', 'Performance',
        'Streetwise', 'Empathy', 'Negotiation', 'Seduction', 'Etiquette',
    ],
    survival: [
        'Survival', 'Animal Handling', 'Tracking', 'Herbalism', 'Weather Sense',
    ],
    martial: [
        'Hand-to-Hand', 'Melee Weapons', 'Ranged Weapons', 'Defensive Combat', 'Combat Reflexes',
    ],
};
/**
 * Standard Ritual TN: `8 × Ritual MR`.  GMs may shift by ±4 per modifier.
 *
 * @param ritualMR  MR of the *target* (creature, item, place, …) — not the caster.
 * @param modifier  Optional flat ±4 step modifier (positive = harder).
 */
export function calculateRitualTN(ritualMR, modifier = 0) {
    const mr = Math.max(1, Math.floor(Number(ritualMR) || 1));
    const mod = Math.floor(Number(modifier) || 0);
    return 8 * mr + mod;
}
/**
 * Count Raises from a Ritual roll result.  Every full +4 over TN = 1 Raise;
 * failure = 0 Raises.
 */
export function countRitualRaises(rollTotal, tn) {
    if (!Number.isFinite(rollTotal) || rollTotal < tn)
        return 0;
    return Math.floor((rollTotal - tn) / 4);
}
/**
 * Return all Skills that may be chosen for a Ritual based on its allowed
 * categories.  De-duplicates across categories.
 */
export function eligibleSkillsForRitual(ritual) {
    const out = new Set();
    for (const cat of ritual.allowedSkillCategories) {
        for (const s of RITUAL_SKILLS_BY_CATEGORY[cat])
            out.add(s);
    }
    return Array.from(out);
}
/**
 * Core ritual catalog.  The catalog intentionally stays small — Players
 * Guide 9180+ lists the canonical Rituals (Detect Magic, Locate Object,
 * Augury, …); add more entries here as they ship.
 */
export const RITUALS = [
    {
        name: 'Detect Magic',
        description: 'Attune your senses to lingering magical auras; the world bleeds color where power flows.',
        stoneCost: 1,
        allowedSkillCategories: ['knowledge'],
        castingTime: 'Concentration, up to 10 minutes',
        duration: 'Up to 10 minutes',
        raises: [
            'Sense faint auras of active or latent magic within 10 m (basic schools).',
            'Discern strength and structure of each aura (traps, wards, enchantments).',
            'Read the emotional tone or purpose behind each magic.',
            'Trace each aura back to its source within 100 m.',
            'Pierce veils and illusions; for 1 round see into the Fade.',
        ],
        attribute: 'intellect',
    },
    {
        name: 'Locate Object',
        description: 'Trace a pattern in the air; a pull forms in your mind toward what you seek.',
        stoneCost: 1,
        allowedSkillCategories: ['survival'],
        castingTime: 'Concentration, up to 10 minutes',
        duration: 'Up to 10 minutes',
        raises: [
            'Sense direction of a known object within 60 m.',
            'Range expands to 300 m; pick the right item among similar ones.',
            'Receive sensory flashes of the object\'s environment.',
            'Penetrate up to 2 m of stone or one divine barrier; range 1 km.',
            'See through the object\'s memory; range 5 km.',
        ],
        attribute: 'wits',
    },
    {
        name: 'Augury',
        description: 'Cast marked stones, whisper prayers, or let blood fall on sacred ground to ask the world for an omen.',
        stoneCost: 1,
        allowedSkillCategories: ['knowledge', 'social', 'survival'],
        castingTime: '10 minutes',
        duration: 'Instant',
        raises: [
            'Receive a single one-word omen about a chosen path.',
            'Receive a richer impression: emotion, presence, or hint of consequence.',
            'See a fragmentary vision of one possible outcome.',
            'Receive a clear answer to one specific yes/no question.',
            'Glimpse a powerful unfolding truth tied to the path you asked about.',
        ],
        attribute: 'wits',
    },
    {
        name: 'Ward',
        description: 'Lay protective sigils over an area, guarding it from intruders or magic.',
        stoneCost: 1,
        allowedSkillCategories: ['knowledge'],
        castingTime: '1 hour',
        duration: 'Until next Safe Haven Rest',
        raises: [
            'Ward a small area against intrusion; alerts you when crossed.',
            'Ward also blocks scrying / divination.',
            'Ward repels chosen creature type with mild discomfort.',
            'Ward holds firm against forced entry; intruders take Stress.',
            'Ward becomes hidden and self-renewing for the duration.',
        ],
        attribute: 'resolve',
    },
    {
        name: 'Cleansing',
        description: 'Remove curses, corruption, or lingering magical effects from a target.',
        stoneCost: 2,
        allowedSkillCategories: ['knowledge', 'survival'],
        castingTime: '10 minutes',
        duration: 'Instant',
        raises: [
            'Cleanse the surface symptoms of a single affliction.',
            'Cleanse one minor curse, taint, or magical residue.',
            'Cleanse a deep curse or lingering possession.',
            'Cleanse and ward the target against the same curse for 1 day.',
            'Cleanse permanently; restore one Scarred Stress bar.',
        ],
        attribute: 'resolve',
    },
    {
        name: 'Communion',
        description: 'Reach across the Veil to speak with spirits, ancestors, or divine entities.',
        stoneCost: 1,
        allowedSkillCategories: ['social', 'knowledge'],
        castingTime: '30 minutes',
        duration: '1 scene',
        raises: [
            'Receive a brief impression: presence, emotion, or symbol.',
            'Hear a single short response.',
            'Hold a brief two-way conversation.',
            'Receive guidance or warning relevant to the scene.',
            'Bind a lasting agreement, promise, or oath.',
        ],
        attribute: 'influence',
    },
    {
        name: 'Bind Familiar',
        description: 'Establish a lasting magical bond with a chosen creature, awakening it as your Familiar.',
        stoneCost: 2,
        allowedSkillCategories: ['knowledge', 'social', 'survival'],
        castingTime: '1 hour',
        duration: 'Permanent (until broken)',
        raises: [
            'Bond a Familiar of MR equal to your own ÷ 2 (rounded down, min 1).',
            'Bond a Familiar at MR equal to your own.',
            'Bond a Familiar with one upgraded movement mode.',
            'Bond a Familiar that can speak telepathically with you.',
            'Bond a Familiar that shares one of your Passive abilities.',
        ],
        attribute: 'resolve',
    },
    {
        name: 'Summoning',
        description: 'Call forth a creature or entity to serve temporarily.',
        stoneCost: 2,
        allowedSkillCategories: ['knowledge', 'social'],
        castingTime: '30 minutes',
        duration: '1 scene',
        raises: [
            'Summon a minor servant or messenger.',
            'Summon a stronger entity bound by a single task.',
            'Summon multiple entities at once.',
            'Summon for an extended duration.',
            'Bind the summon for repeat callings during this scene.',
        ],
        attribute: 'resolve',
    },
    {
        name: 'Translocation',
        description: 'Open a controlled passage between two known locations.',
        stoneCost: 2,
        allowedSkillCategories: ['knowledge'],
        castingTime: '10 minutes',
        duration: 'Instant',
        raises: [
            'Travel alone to a familiar location within sight.',
            'Bring one passenger.',
            'Range extends to a known location within the same region.',
            'Bring up to 4 passengers across one region boundary.',
            'Bring an entire party across a great distance.',
        ],
        attribute: 'intellect',
    },
    {
        name: 'Transformation',
        description: 'Alter the physical form of yourself or a willing target.',
        stoneCost: 2,
        allowedSkillCategories: ['knowledge', 'survival'],
        castingTime: '1 hour',
        duration: 'Until next Safe Haven Rest',
        raises: [
            'Cosmetic change: face, hair, skin, voice.',
            'Alter physical features and minor anatomy.',
            'Change to another humanoid form.',
            'Take on the form of a known beast.',
            'Take on a strange or supernatural form (GM approval).',
        ],
        attribute: 'vitality',
    },
    {
        name: 'Illusion',
        description: 'Create a convincing sensory illusion in a chosen area.',
        stoneCost: 1,
        allowedSkillCategories: ['social', 'knowledge'],
        castingTime: '30 minutes',
        duration: 'Up to 1 scene',
        raises: [
            'Create a small static visual illusion.',
            'Add motion and small ambient sound.',
            'Affect multiple senses (sight + sound).',
            'Create a complex scene with several moving parts.',
            'Make the illusion respond to observers (limited reactivity).',
        ],
        attribute: 'influence',
    },
];
/**
 * Convenience: look up a Ritual by name (case-insensitive).
 */
export function getRitualByName(name) {
    const lower = name.trim().toLowerCase();
    return RITUALS.find((r) => r.name.toLowerCase() === lower);
}
//# sourceMappingURL=rituals.js.map