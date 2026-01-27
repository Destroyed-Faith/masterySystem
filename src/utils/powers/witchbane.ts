/**
 * Witchbane Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const WITCHBANE_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Null Field',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Spells cast in the area suffer −1 die to their casting pool' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Spells cast in the area suffer −2 dice to their casting pool' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 5 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Spells cast in the area suffer −3 dice to their casting pool' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Spells cast in the area suffer −4 dice to their casting pool' },
                specials: []
            }
        }
    },
    {
        name: 'Dispel Pulse',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'When a spell is cast within range',
        cost: {
            action: 'reaction',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Spells must overcome +2 Raises to succeed' },
                specials: [],
                trigger: 'When a spell is cast within 6m'
            },
            '2': {
                lvl: 2,
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Spells must overcome +3 Raises to succeed' },
                specials: [],
                trigger: 'When a spell is cast within 8m'
            },
            '3': {
                lvl: 3,
                type: 'reaction',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Spells must overcome +4 Raises to succeed' },
                specials: [],
                trigger: 'When a spell is cast within 10m'
            },
            '4': {
                lvl: 4,
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Spells must overcome +5 Raises to succeed' },
                specials: [],
                trigger: 'When a spell is cast within 12m'
            }
        }
    },
    {
        name: 'Spell Mirror',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Reflects the next Spell of Level 1 targeting you' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Reflects the next two Spells of Level 1 targeting you' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Reflects the next Spell of Level 2 or lower targeting you' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Reflects the next two Spells of Level 2 or lower targeting you' },
                specials: []
            }
        }
    },
    {
        name: 'Spellbreaker\'s Step',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: {
            action: 'movement',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'movement',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move 4m, ignoring magical terrain or barriers from Spell Level 1' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'movement',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move 6m, ignoring magical terrain or barriers from Spell Level 2' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'movement',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move 8m, ignoring magical terrain or barriers from Spell Level 3' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'movement',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move 10m, ignoring magical terrain or barriers from Spell Level 4' },
                specials: []
            }
        }
    },
    {
        name: 'Anti-Magic Sense',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 3 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Detect active spells or enchantments within 3m' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Detect magical items, traps, or curses within 6m' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 9 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Sense ongoing auras or hidden casters within 9m' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 12 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Automatically detect any spellcasting or teleportation within 12m' },
                specials: []
            }
        }
    },
    {
        name: 'Fade-Tether',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +1d8 on Saves vs Mind and Spirit effects', dice: '1d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2d8 on Saves vs Mind and Spirit effects', dice: '2d8' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +3d8 on Saves vs Mind and Spirit effects', dice: '3d8' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4d8 on Saves vs Mind and Spirit effects', dice: '4d8' },
                specials: []
            }
        }
    }
];
