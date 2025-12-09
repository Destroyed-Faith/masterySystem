/**
 * Witchbane Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const WITCHBANE_POWERS: PowerDefinition[] = [
    {
        name: 'Null Field',
        tree: 'Witchbane',
        powerType: 'buff',
        description: 'A zone of calm spreads around you, where magic flickers and dies.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', aoe: 'Radius 3m', duration: 'Mastery Rank rounds', effect: 'Spells cast in the area suffer −1 die to their casting pool.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', aoe: 'Radius 4m', duration: 'Mastery Rank rounds', effect: 'Spells cast in the area suffer −2 dice to their casting pool.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', aoe: 'Radius 5m', duration: 'Mastery Rank rounds', effect: 'Spells cast in the area suffer −3 dice to their casting pool.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', aoe: 'Radius 6m', duration: 'Mastery Rank rounds', effect: 'Spells cast in the area suffer −4 dice to their casting pool.', cost: { action: true } }
        ]
    },
    {
        name: 'Dispel Pulse',
        tree: 'Witchbane',
        powerType: 'reaction',
        description: 'You tear apart magic mid-casting, collapsing its pattern into silence.',
        levels: [
            { level: 1, type: 'Reaction', range: '6m', duration: 'Instant', effect: 'Spells must overcome +2 Raises to succeed.', cost: { reaction: true } },
            { level: 2, type: 'Reaction', range: '8m', duration: 'Instant', effect: 'Spells must overcome +3 Raises to succeed.', cost: { reaction: true } },
            { level: 3, type: 'Reaction', range: '10m', duration: 'Instant', effect: 'Spells must overcome +4 Raises to succeed.', cost: { reaction: true } },
            { level: 4, type: 'Reaction', range: '12m', duration: 'Instant', effect: 'Spells must overcome +5 Raises to succeed.', cost: { reaction: true } }
        ]
    },
    {
        name: 'Spell Mirror',
        tree: 'Witchbane',
        powerType: 'buff',
        description: 'You weave a shimmering shell of inverted resonance, reflecting hostile spells back to their source.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Reflects the next Spell of Level 1 targeting you.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Reflects the next two Spells of Level 1 targeting you.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Reflects the next Spell of Level 2 or lower targeting you.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Reflects the next two Spells of Level 2 or lower targeting you.', cost: { action: true } }
        ]
    },
    {
        name: 'Spellbreaker\'s Step',
        tree: 'Witchbane',
        powerType: 'movement',
        description: 'You move through wards and curses as though through mist.',
        levels: [
            { level: 1, type: 'Movement', range: '4m', duration: 'Instant', effect: 'Move 4m, ignoring magical terrain or barriers from Spell Level 1.', cost: { movement: true } },
            { level: 2, type: 'Movement', range: '6m', duration: 'Instant', effect: 'Move 6m, ignoring magical terrain or barriers from Spell Level 2.', cost: { movement: true } },
            { level: 3, type: 'Movement', range: '8m', duration: 'Instant', effect: 'Move 8m, ignoring magical terrain or barriers from Spell Level 3.', cost: { movement: true } },
            { level: 4, type: 'Movement', range: '10m', duration: 'Instant', effect: 'Move 10m, ignoring magical terrain or barriers from Spell Level 4.', cost: { movement: true } }
        ]
    },
    {
        name: 'Anti-Magic Sense',
        tree: 'Witchbane',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Your perception vibrates with distortions in the Fade.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Detect active spells or enchantments within 3m.' },
            { level: 2, type: 'Passive', effect: 'Detect magical items, traps, or curses within 6m.' },
            { level: 3, type: 'Passive', effect: 'Sense ongoing auras or hidden casters within 9m.' },
            { level: 4, type: 'Passive', effect: 'Automatically detect any spellcasting or teleportation within 12m.' }
        ]
    },
    {
        name: 'Fade-Tether',
        tree: 'Witchbane',
        powerType: 'passive',
        passiveCategory: 'save',
        description: 'You are anchored to the material plane — difficult to charm, curse, or displace.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +1d8 on Saves vs Mind and Spirit effects.' },
            { level: 2, type: 'Passive', effect: 'Gain +2d8 on Saves vs Mind and Spirit effects.' },
            { level: 3, type: 'Passive', effect: 'Gain +3d8 on Saves vs Mind and Spirit effects.' },
            { level: 4, type: 'Passive', effect: 'Gain +4d8 on Saves vs Mind and Spirit effects.' }
        ]
    }
];

