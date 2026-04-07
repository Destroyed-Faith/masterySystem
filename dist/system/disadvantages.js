/**
 * Disadvantages System for Mastery System
 * Defines all available disadvantages that characters can take during creation
 */
/**
 * All available Disadvantages
 * Based on Mastery System rules - during character creation players must take at least
 * CONFIG.MASTERY.creation.minDisadvantagePoints (default 2) and at most maxDisadvantagePoints (8).
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
                type: 'select',
                label: 'Threat Rank',
                options: [
                    { value: '1', label: 'Rank 1 (1 point) - Single bounty hunter/rival' },
                    { value: '2', label: 'Rank 2 (2 points) - Cult/Order/Nobility/Organization' },
                    { value: '3', label: 'Rank 3 (3 points) - Demonic patron, witch circle, celestial warden' }
                ],
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
        basePoints: [1, 2, 3],
        description: 'Mental Restrictions (1–3 points). You are bound by your past, beliefs, or mind.\n\n' +
            'Oaths (examples): No killing; Chivalric code (always fair, no helpless targets, no lying); Honor bound (always keeps promises).\n\n' +
            'Fears (examples): Claustrophobia; Paranoia (“Just because you can’t see them…”); Hatred for a group – attacks on sight.\n\n' +
            'Personality traits (examples): Arrogant – always needs to prove superiority; Coward – retreats from fights when wounded; Vengeful – cannot forgive; Gullible – big eyes and sad stories get to you easily; In love with XXX – acts irrationally if the loved one is in danger.\n\n' +
            'Rule: To act against your flaw, make a Resolve k1 roll. Easy: TN 6 (minor resistance), 1 point. Normal: TN 10 (strong internal conflict), 2 points. Hard: TN 14 (violates a core belief), 3 points.',
        fields: [
            {
                name: 'severity',
                type: 'select',
                label: 'Severity (TN when acting against the flaw)',
                options: [
                    { value: 'easy', label: 'Easy (1 pt) — TN 6: minor resistance' },
                    { value: 'normal', label: 'Normal (2 pt) — TN 10: strong internal conflict' },
                    { value: 'hard', label: 'Hard (3 pt) — TN 14: violates a core belief' }
                ],
                required: true
            },
            {
                name: 'restriction',
                type: 'text',
                label: 'Your restriction',
                placeholder: 'e.g., No killing, Chivalric code, Claustrophobia, Paranoia, Vengeful, In love with the captain',
                required: true
            }
        ],
        effect: 'Against your flaw: Resolve k1. Easy TN 6 (1 pt), Normal TN 10 (2 pt), Hard TN 14 (3 pt).'
    },
    {
        id: 'unluck',
        name: 'Unluck',
        basePoints: [1, 2, 3],
        description: 'You are cursed with misfortune. Each session, the GM gains misfortune tokens based on your rank. The GM can spend these tokens to worsen a failed roll result or introduce unlikely narrative obstacles (can affect allies).',
        fields: [
            {
                name: 'rank',
                type: 'select',
                label: 'Unluck Rank',
                options: [
                    { value: '1', label: 'Rank 1 (1 point) - 1d8/2 misfortune tokens per session' },
                    { value: '2', label: 'Rank 2 (2 points) - 1d8 misfortune tokens per session' },
                    { value: '3', label: 'Rank 3 (3 points) - 2d8 misfortune tokens per session' }
                ],
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
 * Legacy mental-restrictions rows used a `type` field and flat 2 pts. Preselect Normal (2 pt) until the player picks a tier.
 */
export function detailsForMentalRestrictionsDialog(details) {
    const d = { ...(details || {}) };
    if (!d.severity)
        d.severity = 'normal';
    return d;
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
            const rank = parseInt(details.rank) || 1; // Convert string to number for select fields
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
        if (disadvantageId === 'mental-restrictions') {
            const severity = details.severity;
            if (severity === 'easy')
                return 1;
            if (severity === 'normal')
                return 2;
            if (severity === 'hard')
                return 3;
            // Legacy saves (old type + flat 2 pt): keep 2 points
            return 2;
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