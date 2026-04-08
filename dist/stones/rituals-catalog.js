/**
 * Core Rituals for Stone Powers dialog (fixed stone cost per ritual).
 * Rules text condensed from Mastery / Destroyed Faith ritual chapter.
 */
function repeatSlots(n, allow) {
    return Array.from({ length: n }, () => ({ allow: [...allow] }));
}
export const STONE_RITUALS_CATALOG = [
    {
        id: 'ritual-identify',
        name: 'Identify',
        slots: repeatSlots(1, ['intellect']),
        roll: 'Intellect keep Mastery + Occultism',
        duration: '10 minutes',
        requirement: 'Touch or hold the item for the whole ritual.',
        intro: 'You trace runes and whisper truths into an unknown item — and it whispers back. Learn name, level, powers, school, and command words.',
        raises: [
            { label: 'Raise 0 (Base)', text: 'Name, level, known powers, school, activation; brief emotional tone.' },
            { label: 'Raise 1 (+4 TN)', text: 'History and last wielder; hint at crafting origin.' },
            { label: 'Raise 2 (+8 TN)', text: "Taint personality; item notes you as a possible bearer." },
            { label: 'Raise 3 (+12 TN)', text: 'Hidden limits, dormant powers, Thread-Point hints; one unlock condition.' },
            { label: 'Raise 4 (+16 TN)', text: 'True origin; faint bond; future Identifies gain +2 dice.' }
        ],
        danger: 'Powerful items may resist. Identification is a two-way gaze.'
    },
    {
        id: 'ritual-detect-magic',
        name: 'Detect Magic',
        slots: repeatSlots(1, ['intellect']),
        roll: 'Intellect keep Mastery + Occultism',
        duration: 'Concentration, up to 10 minutes',
        requirement: 'Focus eyes or hands on the area or object.',
        intro: 'Attune to lingering magic; the world shows color where power flows.',
        raises: [
            { label: 'Raise 0', text: 'Faint auras within 10 m — basic schools (divine, arcane, natural, infernal).' },
            { label: 'Raise 1', text: 'Strength and structure of each aura; traps, wards, enchantments.' },
            { label: 'Raise 2', text: 'Emotional tone or purpose — protection, control, hunger, sorrow.' },
            { label: 'Raise 3', text: "Trace aura to source within 100 m (caster, focus, or leyline)." },
            { label: 'Raise 4', text: 'Pierce veils and illusions; 1 round glimpse into the Fade.' }
        ],
        danger: 'Long use may attract things that notice you noticing them.'
    },
    {
        id: 'ritual-locate-object',
        name: 'Locate Object',
        slots: repeatSlots(1, ['intellect']),
        roll: 'Intellect keep Mastery + Occultism',
        duration: 'Concentration, up to 10 minutes',
        requirement: 'You have seen or touched the object, or know its exact form.',
        intro: 'A pull in mind or chest guides you toward what you seek.',
        raises: [
            { label: 'Raise 0', text: 'Direction within 60 m (blocked by heavy lead, consecration, or anti-magic).' },
            { label: 'Raise 1', text: '300 m; distinguish similar items.' },
            { label: 'Raise 2', text: 'Brief sensory flashes of immediate surroundings.' },
            { label: 'Raise 3', text: 'Through thin wards or up to 2 m stone; 1 km range.' },
            { label: 'Raise 4', text: "See through object's memory; 5 km or unlimited if soul-linked." }
        ],
        danger: 'Searching binds your mind; cursed items may notice.'
    },
    {
        id: 'ritual-augury',
        name: 'Augury',
        slots: repeatSlots(1, ['resolve']),
        roll: 'Resolve keep Mastery + Insight',
        duration: '10 minutes',
        requirement: 'Symbolic medium (bones, ink, blood, sand, runes, ashes).',
        intro: 'Ask the world for an omen about a course of action in the coming hours.',
        raises: [
            { label: 'Raise 0', text: 'Weal, Woe, Both, or Nothing.' },
            { label: 'Raise 1', text: 'Clearer omen — brief sensory flash.' },
            { label: 'Raise 2', text: 'Which aspect carries danger — violence, deceit, faith, or chance.' },
            { label: 'Raise 3', text: 'Spiritual echo; one brief follow-up as image or symbol.' },
            { label: 'Raise 4', text: 'Fragment of a future event; costs 1 Vitality Stone; leaves a visible mark.' }
        ],
        danger: 'Repeated augury on the same topic in a day meets resistance.'
    },
    {
        id: 'ritual-clairvoyance',
        name: 'Clairvoyance',
        slots: repeatSlots(2, ['intellect']),
        roll: 'Intellect keep Mastery + Occultism',
        duration: 'Concentration, up to 10 minutes',
        requirement: 'Name a place you know or a familiar creature.',
        intro: 'Project senses where your body is not.',
        raises: [
            { label: 'Raise 0', text: 'Hazy sight within 1 km.' },
            { label: 'Raise 1', text: 'Clearer vision + faint sound.' },
            { label: 'Raise 2', text: 'Shift viewpoint ~20 m or follow creature at half walk speed.' },
            { label: 'Raise 3', text: 'Vivid detail; zoom on small details, text, faces.' },
            { label: 'Raise 4', text: 'Any range or plane; body senseless for 1 round after.' }
        ],
        danger: 'Distance scrying risks leaving awareness behind.'
    },
    {
        id: 'ritual-word-of-recall',
        name: 'Word of Recall',
        slots: repeatSlots(2, ['resolve']),
        roll: 'Resolve keep Mastery + Occultism',
        duration: 'Until used (mark fades on use)',
        requirement: 'Sanctify the place with prayer, blood, or sacrifice.',
        intro: 'Etch a mark of return; once, teleport back to that point.',
        raises: [
            { label: 'Raise 0', text: 'One use return to marked point.' },
            { label: 'Raise 1', text: 'Bring one willing ally within 2 m when activating.' },
            { label: 'Raise 2', text: 'Gentler arrival — allies and fragile gear safe.' },
            { label: 'Raise 3', text: 'Pierces minor wards and barriers.' },
            { label: 'Raise 4', text: 'Weekly return without consuming the mark.' }
        ],
        danger: 'Some doors, once opened, do not close cleanly.'
    },
    {
        id: 'ritual-greater-restoration',
        name: 'Greater Restoration',
        slots: repeatSlots(2, ['resolve']),
        roll: 'Resolve keep Mastery + Medicine or Occultism',
        duration: 'Instant',
        requirement: 'Continuous contact; cannot target yourself.',
        intro: 'Deep harmony mends major afflictions.',
        raises: [
            { label: 'Raise 0', text: 'Remove one major affliction (curse, paralysis, petrification, blindness, exhaustion).' },
            { label: 'Raise 1', text: 'Two lesser effects or another severe condition.' },
            { label: 'Raise 2', text: 'One additional creature within 2 m.' },
            { label: 'Raise 3', text: 'Spiritual ailments — madness, memory corruption, Taint stage 1.' },
            { label: 'Raise 4', text: 'Ancient or god-born afflictions; nearby allies gain emotional clarity.' }
        ],
        danger: 'Deep wounds may echo in the healer.'
    },
    {
        id: 'ritual-commune',
        name: 'Commune',
        slots: repeatSlots(2, ['resolve', 'influence']),
        roll: 'Resolve or Influence keep Mastery + Occultism or Insight',
        duration: '10 minutes',
        requirement: 'Sacred space, relic, or symbol of the entity.',
        intro: 'Reach toward higher planes — few voices still answer.',
        raises: [
            { label: 'Raise 0', text: 'Up to 3 yes/no/unclear questions; often silence.' },
            { label: 'Raise 1', text: 'Sense a presence; +1 question via signs or dreams.' },
            { label: 'Raise 2', text: 'Multiple voices; emotional rather than verbal answers.' },
            { label: 'Raise 3', text: 'Vision of divine memory; answers as metaphor.' },
            { label: 'Raise 4', text: 'Moment of true communion; you are visibly marked.' }
        ],
        lore: 'Gods no longer speak as they once did; most hear only hope reflected through the veil.'
    },
    {
        id: 'ritual-atonement',
        name: 'Atonement',
        slots: repeatSlots(2, ['resolve', 'wits']),
        roll: 'Resolve keep Mastery + Insight or Occultism',
        duration: '1 hour',
        requirement: 'Solitude or sacred witness; symbolic sacrifice (blood, memory, or vow).',
        intro: 'Offer pain to the world to cleanse spiritual stain.',
        raises: [
            { label: 'Raise 0', text: 'Minor moral or spiritual stain eased.' },
            { label: 'Raise 1', text: 'Reduce Taint Stage by one if the bearer accepts the cost.' },
            { label: 'Raise 2', text: 'Include another willing participant — reconciliation.' },
            { label: 'Raise 3', text: 'Cleanse a group or place of despair or corruption.' },
            { label: 'Raise 4', text: 'Divine echoes acknowledge the sacrifice — serenity for participants.' }
        ],
        lore: 'True atonement cannot be bought — only offered.'
    },
    {
        id: 'ritual-dreamwalk',
        name: 'Dreamwalk',
        slots: repeatSlots(2, ['resolve', 'influence']),
        roll: 'Intellect keep Mastery + Empathy or Occultism',
        duration: '~10 min in dream (1 h real time)',
        requirement: 'Target asleep and willing — or soul unguarded.',
        intro: "Enter another's dreamscape for truth or solace.",
        raises: [
            { label: 'Raise 0', text: 'Perceive symbolic fears, memories, desires; speak as a guiding voice.' },
            { label: 'Raise 1', text: 'Interact with dream imagery; calm nightmares.' },
            { label: 'Raise 2', text: 'Messages may persist after waking.' },
            { label: 'Raise 3', text: 'Glimpse buried truths (emotional, not always factual).' },
            { label: 'Raise 4', text: 'Full immersion; changes may echo into waking life.' }
        ],
        lore: 'Every dream you change, changes you.'
    },
    {
        id: 'ritual-last-light',
        name: 'Last Light',
        slots: repeatSlots(1, ['resolve']),
        roll: 'Resolve keep Mastery + Occultism or Empathy',
        duration: '30 minutes',
        requirement: 'Candle, ash, or token; body, grave, or relic in sight. (Faith may substitute Resolve at GM discretion.)',
        intro: 'Kindle a path for the fallen beyond the veil.',
        raises: [
            { label: 'Raise 0', text: 'Sever lingering ties; peaceful passage; resist undeath.' },
            { label: 'Raise 1', text: 'Purify area; lesser undead within 10 m falter.' },
            { label: 'Raise 2', text: 'Carry a final message to or from the dead.' },
            { label: 'Raise 3', text: 'Spirit manifests briefly with one vision or phrase.' },
            { label: 'Raise 4', text: 'Hallow the ground against desecration.' }
        ],
        lore: 'The flame is for the living who remain.'
    },
    {
        id: 'ritual-raise-dead',
        name: 'Raise Dead',
        slots: repeatSlots(8, ['resolve', 'influence']),
        roll: 'Resolve keep Mastery + Occultism',
        duration: '1 hour',
        requirement: 'Mostly intact body; death within seven days; rare sacrifice.',
        intro: 'Call a soul back — the world no longer welcomes it.',
        raises: [
            { label: 'Raise 0', text: 'Soul returns fragile; weakness and memory gaps.' },
            { label: 'Raise 1', text: 'Faster clarity and vitality.' },
            { label: 'Raise 2', text: 'Up to one month dead; drains your vitality for days.' },
            { label: 'Raise 3', text: 'Cleaner return; damaged body ok with relic or soul fragment.' },
            { label: 'Raise 4', text: 'Call from beyond known planes — something ancient notices.' }
        ],
        danger: 'Forbidden in many lands; the Lichking’s stewards despise the restless dead.',
        lore: 'Edict of the Last Breath — no soul returns unscarred.'
    }
];
//# sourceMappingURL=rituals-catalog.js.map