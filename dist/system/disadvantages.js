/**
 * Disadvantages System for Mastery System
 * Defines all available disadvantages that characters can take during creation
 */
/**
 * All available Disadvantages
 * Based on Mastery System rules - players can select 0-8 points of disadvantages
 * Disadvantage Points = Starting Faith Fractures (both current and maximum)
 */
export const DISADVANTAGES = [
    {
        id: 'addiction',
        name: 'Addiction',
        basePoints: 2,
        description: 'You are addicted to a substance, ritual, faith, or communion. Withdrawal effects: After 1 day without: -1k0 on all rolls. After 1 week: -2k0 on all rolls. After 1 month: no Raises possible. If pushed beyond that: Stress(3) and Disoriented(2) until restored.',
        fields: [
            {
                name: 'substance',
                type: 'text',
                label: 'Substance/Ritual/Faith/Communion',
                placeholder: 'e.g., Alcohol, Ritual Prayer, Faith Communion, etc.',
                required: true
            }
        ],
        effect: 'Withdrawal: 1 day = -1k0 all rolls; 1 week = -2k0 all rolls; 1 month = no Raises; if pushed = Stress(3) + Disoriented(2)'
    },
    {
        id: 'berserkers-curse',
        name: "Berserker's Curse",
        basePoints: 2,
        description: 'When your Wounds reach or exceed your Vitality, you must make a Resolve k1 check vs TN 8. On failure, you enter Berserk state for 1d8/2 rounds. While berserk: +1k1 on damage rolls, must attack nearest target (friend or foe). Each round: Resolve k1 TN 8 to regain control.',
        effect: 'Trigger: Wounds ≥ Vitality → Resolve k1 TN 8 or Berserk (1d8/2 rounds). Berserk: +1k1 damage, must attack nearest. Each round: Resolve k1 TN 8 to end.'
    },
    {
        id: 'hunted',
        name: 'Hunted',
        basePoints: [1, 2, 3],
        description: 'Someone or something is hunting you. The GM can introduce chases, ambushes, or other threats. Rank 1: Single bounty hunter/rival. Rank 2: Cult/Order/Nobility/Organization. Rank 3: Demonic patron, witch circle, celestial warden, etc.',
        fields: [
            {
                name: 'rank',
                type: 'number',
                label: 'Threat Rank (1-3 points)',
                min: 1,
                max: 3,
                required: true
            },
            {
                name: 'hunter',
                type: 'text',
                label: 'Who hunts you?',
                placeholder: 'e.g., The Inquisition, A rival clan, Demonic patron, etc.',
                required: true
            }
        ],
        effect: 'Rank 1: Single hunter/rival. Rank 2: Organization. Rank 3: Major threat. GM can trigger chases/ambushes.'
    },
    {
        id: 'physical-scars',
        name: 'Physical Scars',
        basePoints: [1, 2, 3],
        description: 'You bear physical scars that impose mechanical penalties. Choose one scar type. Each scar is purchased separately with its own point cost.',
        fields: [
            {
                name: 'scar',
                type: 'select',
                label: 'Scar Type',
                options: [
                    { value: 'one-eyed', label: 'One-Eyed (1 point) - -1k0 to ranged attacks and perception checks' },
                    { value: 'one-handed', label: 'One-Handed (2 points) - Cannot dual wield or use shield+sword' },
                    { value: 'heavy-sleeper', label: 'Heavy Sleeper (1 point) - Cannot wake unless damaged or physically shaken' },
                    { value: 'fragile-frame', label: 'Fragile Frame (3 points) - Health track has one fewer box on every level' }
                ],
                required: true
            }
        ],
        effect: 'One-Eyed(1pt): -1k0 ranged/perception. One-Handed(2pt): no dual wield/shield+sword. Heavy Sleeper(1pt): wake only if damaged/shaken. Fragile Frame(3pt): -1 health box per level.'
    },
    {
        id: 'mental-restrictions',
        name: 'Mental Restrictions',
        basePoints: 2,
        description: 'You have a mental restriction: an Oath, Fear, or Personality trait. To act against your restriction, you must make a Resolve k1 check. TN 6: Oath (small resistance). TN 8: Fear (strong inner conflict). TN 16: Personality (violates core belief).',
        fields: [
            {
                name: 'type',
                type: 'select',
                label: 'Restriction Type',
                options: [
                    { value: 'oath', label: 'Oath (TN 6) - e.g., "No killing", "Chivalric code", "Honor bound"' },
                    { value: 'fear', label: 'Fear (TN 8) - e.g., Claustrophobia, Paranoia, Hatred of group' },
                    { value: 'personality', label: 'Personality Trait (TN 16) - e.g., Arrogant, Coward, Vengeful, In love with XXX' }
                ],
                required: true
            },
            {
                name: 'restriction',
                type: 'text',
                label: 'Restriction Description',
                placeholder: 'e.g., "Never harm an innocent", "Fear of heights", "Always helps the weak", "In love with the princess"',
                required: true
            }
        ],
        effect: 'Act against restriction = Resolve k1: Oath TN 6, Fear TN 8, Personality TN 16'
    },
    {
        id: 'unluck',
        name: 'Unluck',
        basePoints: [1, 2, 3],
        description: 'You are cursed with misfortune. Each session, the GM gains misfortune tokens based on your rank. The GM can spend these tokens to worsen a failed roll result or introduce unlikely narrative obstacles (can affect allies).',
        fields: [
            {
                name: 'rank',
                type: 'number',
                label: 'Unluck Rank (1-3 points)',
                min: 1,
                max: 3,
                required: true
            }
        ],
        effect: 'Misfortune tokens per session: Rank 1 = 1d8/2, Rank 2 = 1d8, Rank 3 = 2d8. GM can worsen failed rolls or add obstacles.'
    },
    {
        id: 'vulnerability',
        name: 'Vulnerability',
        basePoints: 3,
        description: 'You take double damage from a specific damage type or special ability. Choose the vulnerability type (e.g., Fire, Cold, Lightning, Poison, Bleed, Freeze, Shock, etc.).',
        fields: [
            {
                name: 'vulnerability',
                type: 'text',
                label: 'Vulnerability Type',
                placeholder: 'e.g., Fire, Cold, Lightning, Poison, Bleed, Freeze, Shock, etc.',
                required: true
            }
        ],
        effect: 'Double damage from chosen damage/special type'
    }
];
/**
 * Get disadvantage definition by ID
 */
export function getDisadvantageDefinition(id) {
    return DISADVANTAGES.find(d => d.id === id);
}
/**
 * Get all disadvantage definitions
 */
export function getDisadvantageDefinitions() {
    return DISADVANTAGES;
}
/**
 * Calculate points for a disadvantage selection
 */
export function calculateDisadvantagePoints(disadvantageId, details) {
    const def = getDisadvantageDefinition(disadvantageId);
    if (!def)
        return 0;
    if (Array.isArray(def.basePoints)) {
        // Variable points - use the rank/value from details
        if (disadvantageId === 'hunted' || disadvantageId === 'unluck') {
            const rank = details.rank || 1;
            return def.basePoints[rank - 1] || def.basePoints[0];
        }
        if (disadvantageId === 'physical-scars') {
            const scar = details.scar;
            const scarPoints = {
                'one-eyed': 1,
                'one-handed': 2,
                'heavy-sleeper': 1,
                'fragile-frame': 3
            };
            return scarPoints[scar] || 1;
        }
        return def.basePoints[0];
    }
    return def.basePoints;
}
/**
 * Validate disadvantage selection
 */
export function validateDisadvantageSelection(selections) {
    let totalPoints = 0;
    for (const selection of selections) {
        const points = calculateDisadvantagePoints(selection.id, selection.details);
        totalPoints += points;
    }
    if (totalPoints > 8) {
        return {
            valid: false,
            totalPoints,
            error: `Total disadvantage points (${totalPoints}) exceeds maximum of 8.`
        };
    }
    return { valid: true, totalPoints };
}
//# sourceMappingURL=disadvantages.js.map