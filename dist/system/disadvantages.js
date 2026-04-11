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
        name: 'Physical Limitations',
        basePoints: [1, 2, 3],
        description: 'Lasting physical issues (injury, birth, illness). Pick a mechanical weight with the GM, then use the title and note fields for your specific case. You are not limited to the example blurbs in the rules section.',
        infoSections: [
            {
                title: 'What counts as “physical” here',
                items: [
                    'Sensory: deaf or hard of hearing in one/both ears, reduced vision, one eye lost, light sensitivity.',
                    'Sleep & rest: light sleeper (wakes easily), heavy sleeper (hard to wake), nightmares / tormented sleep (often grouped with sleep; work out stress/fear with GM).',
                    'Mobility & pain: limp, missing fingers, chronic pain, reduced stamina.',
                    'Older rulebook scars (one-eyed, one-handed, fragile frame, etc.) can still be modeled by choosing the right tier and describing them.'
                ]
            },
            {
                title: 'Mechanical weight (tiers)',
                items: [
                    '1 pt — Minor but noticeable (e.g. partial deafness one ear, light sleeper, mild chronic pain).',
                    '2 pt — Significant (e.g. one eye / blind one eye, heavy sleeper, serious limp, one functional hand).',
                    '3 pt — Severe (e.g. one hand/arm lost, fragile frame–style limits, major sensory loss) — align with GM.'
                ]
            },
            {
                title: 'Example blurbs (inspiration only)',
                items: [
                    'Deaf / hard of hearing (one ear) — Hard of hearing on the left; disadvantage to notice quiet sounds or locate by hearing on that side; loud environments are exhausting.',
                    'One eye lost / blind one eye — Lost right eye; reduced depth perception; GM may impose penalties on ranged attacks and visual perception where it matters.',
                    'Light sleeper — Wakes at small noises; needs calm to rest; may suffer fatigue if sleep is interrupted often.',
                    'Heavy sleeper — Very hard to wake without strong stimulus (damage, shaking, loud alarm); may miss warnings while sleeping.',
                    'Nightmares / tormented sleep — Disturbing dreams most nights; poor rest; may start days with extra stress or fear checks after bad nights (detail with GM).',
                    'Chronic pain — Old wound aches constantly; harder to push through long marches or focus under strain (work mechanical detail with GM).',
                    'Limp / old leg injury — Slowed on rough ground; longer distances hurt; may affect chase scenes.'
                ]
            }
        ],
        collapsibleRulesBelow: true,
        fields: [
            {
                name: 'sheetTitle',
                type: 'text',
                label: 'Title — what it is (shown on your sheet)',
                placeholder: 'e.g. Heavy sleeper, Deaf (left ear), Nightmares, Chronic pain',
                required: true
            },
            {
                name: 'context',
                type: 'textarea',
                rows: 3,
                label: 'Note (optional) — background, how it shows in play',
                placeholder: 'Optional: why, when it matters, anything you agreed with the GM.',
                required: false
            },
            {
                name: 'tier',
                type: 'select',
                label: 'Mechanical weight (points)',
                options: [
                    { value: '1', label: '1 pt — Minor (partial sensory, light sleeper, mild limitation)' },
                    { value: '2', label: '2 pt — Significant (one eye, heavy sleeper, strong limp, one good hand)' },
                    { value: '3', label: '3 pt — Severe (major limb/sensory loss, fragile-frame–style — GM agreement)' }
                ],
                required: true
            }
        ],
        effect: 'Tier sets points (1–3). Specific mechanics are agreed with the GM based on your description. Legacy “scar type” entries from older sheets still work until you edit them.'
    },
    {
        id: 'mental-restrictions',
        name: 'Mental Restrictions',
        basePoints: [1, 2, 3],
        description: 'You are bound by oaths, fears, or personality. Choose severity with the GM, then use the title and note for your specific restriction. You can write anything personal that fits your character — the lists below are only inspiration.',
        infoSections: [
            {
                title: 'Oaths (examples)',
                items: [
                    'No killing',
                    'Chivalric code — fair fights, no helpless targets, no lying',
                    'Honor bound — always keeps promises'
                ]
            },
            {
                title: 'Fears (examples)',
                items: [
                    'Claustrophobia',
                    'Paranoia — “they’re out there”',
                    'Hatred for a group — may attack on sight'
                ]
            },
            {
                title: 'Personality (examples)',
                items: [
                    'Arrogant — must prove superiority',
                    'Coward — pulls back when wounded',
                    'Vengeful — cannot forgive',
                    'Gullible — swayed by sad stories',
                    'In love with … — irrational if they are in danger'
                ]
            },
            {
                title: 'Example blurbs (inspiration only)',
                items: [
                    'No killing — Will not take a life except in absolute self-defense; must hesitate or use non-lethal options first.',
                    'Chivalric code — No striking downed or helpless foes; keeps word once given; refuses dirty tricks in a “fair” duel.',
                    'Claustrophobia — Panic in tight closed spaces; must fight to enter crawlspaces, cells, or collapsed tunnels.',
                    'Vengeful — Cannot let a serious wrong go; will pursue payback even when it is tactically stupid.',
                    'In love (person) — Acts irrationally when this person is threatened; may abandon the mission to protect them.'
                ]
            }
        ],
        collapsibleRulesBelow: true,
        fields: [
            {
                name: 'sheetTitle',
                type: 'text',
                label: 'Title — what it is (shown on your sheet)',
                placeholder: 'e.g. Phobia, No killing, Vengeful, Chivalric oath',
                required: true
            },
            {
                name: 'context',
                type: 'textarea',
                rows: 3,
                label: 'Note (optional) — details, triggers, why it matters',
                placeholder: 'Optional: flesh out how it shows up at the table.',
                required: false
            },
            {
                name: 'severity',
                type: 'select',
                label: 'Severity — Resolve k1 when acting against the flaw',
                options: [
                    { value: 'easy', label: 'Easy (1 pt) — TN 6: minor resistance' },
                    { value: 'normal', label: 'Normal (2 pt) — TN 10: strong internal conflict' },
                    { value: 'hard', label: 'Hard (3 pt) — TN 14: violates a core belief' }
                ],
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
/** First line → title; remainder → body (for migrating old single text fields). */
function splitTitleBody(text) {
    const t = String(text || '').trim();
    if (!t)
        return { title: '', rest: '' };
    const nl = t.indexOf('\n');
    if (nl === -1)
        return { title: t, rest: '' };
    return { title: t.slice(0, nl).trim(), rest: t.slice(nl + 1).trim() };
}
/**
 * Legacy mental-restrictions: `restriction` textarea, optional `type`, flat 2 pts until severity is set.
 */
export function detailsForMentalRestrictionsDialog(details) {
    const d = { ...(details || {}) };
    // Legacy: title was stored as `name` (clashed with HTML name="name" in some dialogs)
    if (!String(d.sheetTitle || '').trim() && String(d.name || '').trim()) {
        d.sheetTitle = String(d.name).trim();
    }
    if (!String(d.sheetTitle || '').trim() && String(d.restriction || '').trim()) {
        const { title, rest } = splitTitleBody(String(d.restriction));
        d.sheetTitle = title;
        const prev = String(d.context || '').trim();
        d.context = [prev, rest].filter(Boolean).join('\n\n');
    }
    delete d.restriction;
    delete d.type;
    delete d.name;
    if (!d.severity)
        d.severity = 'normal';
    return d;
}
const LEGACY_SCAR_TIER = {
    'one-eyed': '1',
    'heavy-sleeper': '1',
    'one-handed': '2',
    'fragile-frame': '3'
};
const LEGACY_SCAR_DESCRIPTION = {
    'one-eyed': 'One-eyed — reduced depth perception / ranged and perception penalties per GM.',
    'one-handed': 'One-handed — cannot effectively dual-wield or sword+shield per GM.',
    'heavy-sleeper': 'Heavy sleeper — very hard to wake without damage or being physically shaken.',
    'fragile-frame': 'Fragile frame — fewer health boxes per level per GM.'
};
const LEGACY_SCAR_SHORT = {
    'one-eyed': 'One-eyed',
    'one-handed': 'One-handed',
    'heavy-sleeper': 'Heavy sleeper',
    'fragile-frame': 'Fragile frame'
};
/** Migrate old physical-scars (scar / description only) to tier + sheetTitle + context when opening the dialog. */
export function detailsForPhysicalScarsDialog(details) {
    const d = { ...(details || {}) };
    if (!String(d.sheetTitle || '').trim() && String(d.name || '').trim()) {
        d.sheetTitle = String(d.name).trim();
    }
    const sheetTitle = String(d.sheetTitle || '').trim();
    const hasTier = d.tier != null && String(d.tier).trim() !== '';
    if (sheetTitle && hasTier) {
        d.sheetTitle = sheetTitle;
        delete d.name;
        delete d.scar;
        delete d.description;
        return d;
    }
    const scar = d.scar;
    if (scar && LEGACY_SCAR_TIER[scar]) {
        if (!hasTier)
            d.tier = LEGACY_SCAR_TIER[scar];
        if (!String(d.sheetTitle || '').trim()) {
            d.sheetTitle = LEGACY_SCAR_SHORT[scar] || scar.replace(/-/g, ' ');
        }
        const desc = String(d.description || '').trim();
        if (!String(d.context || '').trim()) {
            d.context = desc || LEGACY_SCAR_DESCRIPTION[scar] || '';
        }
        else if (desc) {
            d.context = [String(d.context).trim(), desc].filter(Boolean).join('\n\n');
        }
    }
    else {
        if (!hasTier)
            d.tier = '1';
        const desc = String(d.description || '').trim();
        if (!String(d.sheetTitle || '').trim() && desc) {
            const { title, rest } = splitTitleBody(desc);
            d.sheetTitle = title;
            const prev = String(d.context || '').trim();
            d.context = [prev, rest].filter(Boolean).join('\n\n');
        }
    }
    delete d.scar;
    delete d.description;
    delete d.name;
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
            const tier = parseInt(String(details.tier ?? ''), 10);
            if (tier >= 1 && tier <= 3)
                return tier;
            const scar = details.scar;
            const scarPoints = {
                'one-eyed': 1,
                'one-handed': 2,
                'heavy-sleeper': 1,
                'fragile-frame': 3
            };
            if (scar && scarPoints[scar] != null)
                return scarPoints[scar];
            return 1;
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