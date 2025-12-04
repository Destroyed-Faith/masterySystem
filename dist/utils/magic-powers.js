/**
 * Magic Powers (Spell Schools) configuration for Mastery System
 * These are powers from the 6 Spell Schools (Mastery Spell Trees)
 */
export const MAGIC_POWERS = {
    'Pyromancy': [
        {
            name: 'Firebolt',
            school: 'Pyromancy',
            description: 'A bolt of fire that ignites targets and explodes in a small radius.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '1d8 Fire damage', special: 'Ignite(1)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '2d8 Fire damage', special: 'Ignite(1)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '3d8 Fire damage', special: 'Ignite(2)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '4d8 Fire damage', special: 'Ignite(2)' }
            ]
        },
        {
            name: 'Flame Weapon',
            school: 'Pyromancy',
            description: 'Your weapon erupts in disciplined flame, its edge shimmering with heat.',
            levels: [
                { level: 1, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +1d8 damage', special: 'Ignite(1)' },
                { level: 2, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +2d8 damage', special: 'Ignite(1)' },
                { level: 3, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +3d8 damage', special: 'Ignite(2)' },
                { level: 4, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +4d8 damage', special: 'Ignite(2)' }
            ]
        },
        {
            name: 'Firewall',
            school: 'Pyromancy',
            description: 'A wall of fire that damages those crossing it.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: '2×2×2 m', duration: '1 rd', effect: 'Crossing takes 1d8 damage', special: 'Ignite(1)' },
                { level: 2, type: 'Ranged', range: '8 m', aoe: '4×2×2 m', duration: '1 rd', effect: 'Crossing takes 1d8 damage', special: 'Ignite(2)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: '6×2×4 m', duration: '1 rd', effect: 'Crossing takes 2d8 damage', special: 'Ignite(2)' },
                { level: 4, type: 'Ranged', range: '16 m', aoe: '8×2×3 m', duration: '1 rd', effect: 'Crossing takes 3d8 damage', special: 'Ignite(3)' }
            ]
        },
        {
            name: 'Blazing Burst',
            school: 'Pyromancy',
            description: 'A cone of fire that blinds and ignites enemies.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Cone 90°, length 2 m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Cone 90°, length 4 m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Cone 90°, length 6 m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1), Ignite(2)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Cone 90°, length 8 m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1), Ignite(3)' }
            ]
        },
        {
            name: 'Scorching Ray',
            school: 'Pyromancy',
            description: 'One or more rays of fire that can target multiple enemies.',
            levels: [
                { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: 'One ray (Autofire 0) with 1d8 Damage', special: 'Ignite(2)' },
                { level: 2, type: 'Ranged', range: '20 m', duration: 'Instant', effect: 'Two rays (Autofire 1) with 1d8 Damage', special: 'Ignite(2)' },
                { level: 3, type: 'Ranged', range: '12 m', duration: 'Instant', effect: 'Two rays (Autofire 1) with 2d8 Damage', special: 'Ignite(4)' },
                { level: 4, type: 'Ranged', range: '12 m', duration: 'Instant', effect: 'Three rays (Autofire 2) with 2d8 Damage', special: 'Ignite(4)' }
            ]
        },
        {
            name: 'Blazing Speed',
            school: 'Pyromancy',
            description: 'Flames surge through your body, pushing you to impossible speed.',
            levels: [
                { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+4m Movement, +1 Attack Die', special: '—' },
                { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+6m Movement, +2 Attack Dice', special: '—' },
                { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+8m Movement, +2 Attack Dice, +1 Keep', special: '—' },
                { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+10m Movement, +3 Attack Dice, +1 Keep', special: '—' }
            ]
        }
    ],
    'Malefic Arts': [
        {
            name: 'Eldritch Bolt',
            school: 'Malefic Arts',
            description: 'A chain of pact lightning leaps from mark to mark.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', duration: 'Instant', effect: '2d8 damage', special: '—' },
                { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '2d8 damage', special: 'Autofire (1)' },
                { level: 3, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '2d8 damage', special: 'Autofire (2)' },
                { level: 4, type: 'Ranged', range: '32 m', duration: 'Instant', effect: '2d8 damage', special: 'Autofire (3)' }
            ]
        },
        {
            name: 'Blight Surge',
            school: 'Malefic Arts',
            description: 'A wave of black sigils spreads like wildfire across cursed ground.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '—', special: 'Hex (3)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '—', special: 'Hex (4)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '—', special: 'Hex (5)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '—', special: 'Hex (6)' }
            ]
        },
        {
            name: 'Soul Drain',
            school: 'Malefic Arts',
            description: 'You tear at a Hexed foe\'s spirit and draw its fading essence into your own.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', duration: 'Instant', effect: 'Heal 2d8 HP from a Hexed target; deal 1d8 damage', special: '—' },
                { level: 2, type: 'Ranged', range: '10 m', duration: 'Instant', effect: 'Heal 3d8 HP from a Hexed target; deal 2d8 damage', special: '—' },
                { level: 3, type: 'Ranged', range: '12 m', duration: 'Instant', effect: 'Heal 4d8 HP from a Hexed target; deal 3d8 damage', special: '—' },
                { level: 4, type: 'Ranged', range: '14 m', duration: 'Instant', effect: 'Heal 5d8 HP from a Hexed target; deal 4d8 damage', special: '—' }
            ]
        },
        {
            name: 'Agony Lash',
            school: 'Malefic Arts',
            description: 'A whip of burning malice lashes through the air, pain weaving into the curse itself.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', duration: 'Instant', effect: '1d8 damage', special: 'Hex (2)' },
                { level: 2, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '1d8 damage', special: 'Hex (3)' },
                { level: 3, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '2d8 damage', special: 'Hex (4)' },
                { level: 4, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '2d8 damage', special: 'Hex (5)' }
            ]
        },
        {
            name: 'Maddening Whisper',
            school: 'Malefic Arts',
            description: 'A cursed voice claws at the mind, pain blooming into ever-deeper torment.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '1d8 damage', special: 'Torment (2)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '2d8 damage', special: 'Torment (3)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '2d8 damage', special: 'Torment (4)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '2d8 damage', special: 'Torment (5)' }
            ]
        },
        {
            name: 'Void Maw',
            school: 'Malefic Arts',
            description: 'You tear a hole in the world; light dies within and dread gnaws at the mind.',
            levels: [
                { level: 1, type: 'Ranged', range: '12 m', aoe: 'Radius 4 m', duration: '1 round', effect: 'Create a darkness zone that blocks normal sight; creatures inside suffer Torment (1) each round', special: '—' },
                { level: 2, type: 'Ranged', range: '16 m', aoe: 'Radius 6 m', duration: '2 rounds', effect: 'Darkness blocks sight and darkvision; creatures inside suffer Torment (2) each round', special: '—' },
                { level: 3, type: 'Ranged', range: '20 m', aoe: 'Radius 8 m', duration: '3 rounds', effect: 'Darkness blocks sight, darkvision, and tremorsense; creatures inside suffer Torment (3) each round', special: '—' },
                { level: 4, type: 'Ranged', range: '24 m', aoe: 'Radius 10 m', duration: '4 rounds', effect: 'Darkness suppresses all common visual/motion senses; creatures inside suffer Torment (4) each round', special: '—' }
            ]
        },
        {
            name: 'Rift Step',
            school: 'Malefic Arts',
            description: 'You tear through the void, stepping between worlds, dragging those bound to your soul through the rift.',
            levels: [
                { level: 1, type: 'Movement', range: '8 m', aoe: 'Self + 1 ally (2 m)', duration: 'Instant', effect: 'Teleport up to 8 m', special: 'Torment(1) self' },
                { level: 2, type: 'Movement', range: '12 m', aoe: 'Self + 2 allies (2 m)', duration: 'Instant', effect: 'Teleport up to 12 m', special: 'Torment(1) self' },
                { level: 3, type: 'Movement', range: '16 m', aoe: 'Self + 3 allies (2 m)', duration: 'Instant', effect: 'Teleport up to 16 m', special: 'Torment(1) self' },
                { level: 4, type: 'Movement', range: '20 m', aoe: 'Self + 4 allies (2 m)', duration: 'Instant', effect: 'Teleport up to 20 m', special: 'Torment(1) self' }
            ]
        }
    ],
    'Old Pact': [
        {
            name: 'Entangle',
            school: 'Old Pact',
            description: 'Roots and vines surge from the ground, gripping all who stand upon the cursed earth.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', duration: '1 round', effect: '—', special: 'Entangle (3)' },
                { level: 2, type: 'Ranged', range: '12 m', duration: '1 round', effect: '—', special: 'Entangle (4)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 2 m', duration: '2 rounds', effect: '—', special: 'Entangle (5)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 4 m', duration: '3 rounds', effect: '—', special: 'Entangle (6)' }
            ]
        },
        {
            name: 'Healing Pulse',
            school: 'Old Pact',
            description: 'Ancient vitality flows through the ground, mending wounds and purging corruption.',
            levels: [
                { level: 1, type: 'Support', range: '8 m', duration: 'Instant', effect: 'Heal 2d8 HP (1 ally)', special: '—' },
                { level: 2, type: 'Support', range: '12 m', duration: 'Instant', effect: 'Heal 3d8 HP (1 ally)', special: 'Cleanse (1)' },
                { level: 3, type: 'Support', range: '12 m', aoe: 'Radius 2 m', duration: 'Instant', effect: 'Heal 3d8 HP (all allies)', special: 'Cleanse (2)' },
                { level: 4, type: 'Support', range: '16 m', aoe: 'Radius 4 m', duration: 'Instant', effect: 'Heal 4d8 HP (all allies)', special: 'Cleanse (3)' }
            ]
        },
        {
            name: 'Lightning of the Old Sky',
            school: 'Old Pact',
            description: 'Forked stormlight spears through the battlefield, searing nerves and locking limbs.',
            levels: [
                { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '1d8 damage', special: 'Shock (2)' },
                { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '1d8 damage', special: 'Shock (2); Autofire (1)' },
                { level: 3, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '2d8 damage', special: 'Shock (3); Autofire (1)' },
                { level: 4, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '2d8 damage', special: 'Shock (3); Autofire (2)' }
            ]
        },
        {
            name: 'Call Storm',
            school: 'Old Pact',
            description: 'A roaring storm coalesces above, tearing at those trapped within its reach.',
            levels: [
                { level: 1, type: 'Zone', range: '12 m', aoe: 'Radius 2 m', duration: '1 round', effect: 'Enemies inside take 1d8 Damage each round', special: 'Shock (1)' },
                { level: 2, type: 'Zone', range: '16 m', aoe: 'Radius 3 m', duration: '2 rounds', effect: 'Enemies inside take 2d8 Damage each round', special: 'Shock (1)' },
                { level: 3, type: 'Zone', range: '20 m', aoe: 'Radius 4 m', duration: '2 rounds', effect: 'Enemies inside take 3d8 Damage each round', special: 'Shock (2)' },
                { level: 4, type: 'Zone', range: '24 m', aoe: 'Radius 5 m', duration: '3 rounds', effect: 'Enemies inside take 4d8 Damage each round', special: 'Shock (2)' }
            ]
        },
        {
            name: 'Shapechange',
            school: 'Old Pact',
            description: 'You take the form of a harmless woodland creature (rabbit, fox, raven, owl, etc.).',
            levels: [
                { level: 1, type: 'Utility', range: 'Self', duration: '1 min', effect: 'Transform, +4 Stealth & +4 Move', special: '—' },
                { level: 2, type: 'Utility', range: 'Self', duration: '5 min', effect: 'As above', special: '—' },
                { level: 3, type: 'Utility', range: 'Self', duration: '10 min', effect: 'Resume/dismiss form as free action', special: '—' },
                { level: 4, type: 'Utility', range: 'Self', duration: '15 min', effect: 'Understand simple animal speech', special: '—' }
            ]
        },
        {
            name: 'Barkskin',
            school: 'Old Pact',
            description: 'Your skin hardens like bark; life flows beneath, mending wounds with every breath.',
            levels: [
                { level: 1, type: 'Buff', range: '8 m', duration: '2 rounds', effect: 'Target gains +3 Armor', special: '—' },
                { level: 2, type: 'Buff', range: '12 m', duration: '3 rounds', effect: 'Target gains +4 Armor', special: '—' },
                { level: 3, type: 'Buff', range: '12 m', duration: '3 rounds', effect: 'Target gains +4 Armor and Regeneration (3)', special: '—' },
                { level: 4, type: 'Buff', range: '16 m', duration: '4 rounds', effect: 'Target gains +5 Armor and Regeneration (6)', special: '—' }
            ]
        },
        {
            name: 'Whispering Woods',
            school: 'Old Pact',
            description: 'The forest whispers with ancient dread — unseen eyes in the dark press against every mind.',
            levels: [
                { level: 1, type: 'Zone', range: 'Self', aoe: 'Radius 4 m', duration: '1 round', effect: 'Area becomes filled with psychic whispers and dread', special: 'Frightened(1)' },
                { level: 2, type: 'Zone', range: 'Self', aoe: 'Radius 6 m', duration: '1 round', effect: 'All creatures in the area must resist or flee in panic', special: 'Frightened(1)' },
                { level: 3, type: 'Zone', range: 'Self', aoe: 'Radius 8 m', duration: '2 rounds', effect: 'Minds crumble under ancient fear', special: 'Frightened(2)' },
                { level: 4, type: 'Zone', range: 'Self', aoe: 'Radius 10 m', duration: '2 rounds', effect: 'The forest itself howls; all enemies are seized by primal terror', special: 'Frightened(3)' }
            ]
        },
        {
            name: 'Moonbeam',
            school: 'Old Pact',
            description: 'A column of silver moonlight descends — serene, merciless, and pure.',
            levels: [
                { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '2d8 damage', special: 'Disoriented (1)' },
                { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '3d8 damage', special: 'Disoriented (2)' },
                { level: 3, type: 'Ranged', range: '20 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '4d8 damage', special: 'Disoriented (3)' },
                { level: 4, type: 'Ranged', range: '24 m', aoe: 'Radius 4 m', duration: 'Instant', effect: '5d8 damage', special: 'Disoriented (4)' }
            ]
        }
    ],
    'Thorn & Whisper': [
        {
            name: 'Beguiling Glance',
            school: 'Thorn & Whisper',
            description: 'Your eyes shimmer with impossible grace — the will of your prey bends like silk in the wind.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', duration: '1 Round', effect: 'Charmed (3)', special: '—' },
                { level: 2, type: 'Ranged', range: '12 m', duration: '1 Round', effect: 'Charmed (6)', special: '—' },
                { level: 3, type: 'Ranged', range: '16 m', duration: '1 Round', effect: 'Charmed (9)', special: '—' },
                { level: 4, type: 'Ranged', range: '20 m', duration: '1 Round', effect: 'Charmed (12)', special: '—' }
            ]
        },
        {
            name: 'Nightshade Cloud',
            school: 'Thorn & Whisper',
            description: 'A noxious mist seeps from the ground, smelling sweet but burning the lungs.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: '1 Round', effect: '1d8 damage', special: 'Poisoned(2)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 2 m', duration: '1 Round', effect: '1d8 damage', special: 'Poisoned(3)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 3 m', duration: '2 Rounds', effect: '2d8 damage', special: 'Poisoned(4)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 3 m', duration: '2 Rounds', effect: '2d8 damage', special: 'Poisoned(5)' }
            ]
        },
        {
            name: 'Serpent\'s Kiss',
            school: 'Thorn & Whisper',
            description: 'Your lips whisper venom, conjuring spectral fangs that pierce with toxic bite.',
            levels: [
                { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (3)' },
                { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (4)' },
                { level: 3, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (5)' },
                { level: 4, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (6)' }
            ]
        },
        {
            name: 'Ivy Lash',
            school: 'Thorn & Whisper',
            description: 'Barbed vines whip forward, tearing flesh and seeding venom into wounds.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Line 4 m × 1 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (2)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Line 6 m × 1 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (3)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Line 8 m × 1 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (4)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Line 10 m × 1 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (5)' }
            ]
        }
    ],
    'Breach & Break': [
        {
            name: 'Arcane Pierce',
            school: 'Breach & Break',
            description: 'An arcane bolt drills through armor like a spear of pure force.',
            levels: [
                { level: 1, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '2d8 damage', special: 'Penetration (1)' },
                { level: 2, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '3d8 damage', special: 'Penetration (2)' },
                { level: 3, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '4d8 damage', special: 'Penetration (2)' },
                { level: 4, type: 'Ranged', range: '28 m', duration: 'Instant', effect: '5d8 damage', special: 'Penetration (3)' }
            ]
        },
        {
            name: 'Fang of Daggers',
            school: 'Breach & Break',
            description: 'A whirl of spectral blades erupts around you, stripping armor from those too close to escape.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '1d8 damage', special: 'Corrode(1)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 4 m', duration: 'Instant', effect: '2d8 damage', special: 'Corrode(2)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 6 m', duration: 'Instant', effect: '2d8 damage', special: 'Corrode(2)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 8 m', duration: 'Instant', effect: '3d8 damage', special: 'Corrode(2)' }
            ]
        },
        {
            name: 'Call of Force',
            school: 'Breach & Break',
            description: 'A burst of telekinetic daggers explodes outward, flinging foes aside in a whirling storm of force.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '1d8 damage', special: 'Push(2)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 4 m', duration: 'Instant', effect: '2d8 damage', special: 'Push(3)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 6 m', duration: 'Instant', effect: '2d8 damage', special: 'Push(4)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 8 m', duration: 'Instant', effect: '3d8 damage', special: 'Push(6)' }
            ]
        },
        {
            name: 'Force Hammer',
            school: 'Breach & Break',
            description: 'A massive hammer of force smashes armor and knocks enemies flat.',
            levels: [
                { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '2d8 damage', special: 'Penetration(1), Prone(1)' },
                { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '3d8 damage', special: 'Penetration(2), Prone(1)' },
                { level: 3, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '4d8 damage', special: 'Penetration(2), Prone(2)' },
                { level: 4, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '5d8 damage', special: 'Penetration(3), Prone(2)' }
            ]
        }
    ],
    'Aegis & Benedictions': [
        {
            name: 'Aid',
            school: 'Aegis & Benedictions',
            description: 'Sacred vigor infuses the chosen, empowering body or mind.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', duration: '1 round', effect: 'Target gains +1 Attribute (not Vitality)', special: '—' },
                { level: 2, type: 'Ranged', range: '12 m', duration: '1 round', effect: 'Target gains +2 Attributes (not Vitality)', special: '—' },
                { level: 3, type: 'Ranged', range: '16 m', duration: '1 round', effect: 'Target gains +3 Attributes (not Vitality)', special: '—' },
                { level: 4, type: 'Ranged', range: '20 m', duration: '1 round', effect: 'Target gains +4 Attributes (not Vitality)', special: '—' }
            ]
        },
        {
            name: 'Bless',
            school: 'Aegis & Benedictions',
            description: 'A radiant pulse of faith blesses those within the light.',
            levels: [
                { level: 1, type: 'Zone', range: '8 m', aoe: 'Radius 2 m', duration: '1 round', effect: 'All allies gain +2 Attack Dice and +1 Save Die', special: '—' },
                { level: 2, type: 'Zone', range: '10 m', aoe: 'Radius 4 m', duration: '1 round', effect: 'All allies gain +3 Attack Dice and +1 Save Die', special: '—' },
                { level: 3, type: 'Zone', range: '12 m', aoe: 'Radius 6 m', duration: '1 round', effect: 'All allies gain +4 Attack Dice and +2 Save Dice', special: '—' },
                { level: 4, type: 'Zone', range: '14 m', aoe: 'Radius 8 m', duration: '1 round', effect: 'All allies gain +5 Attack Dice and +2 Save Dice', special: '—' }
            ]
        },
        {
            name: 'Beacon of Grace',
            school: 'Aegis & Benedictions',
            description: 'A radiant aura steadies the soul, warding off darkness in a moment of need.',
            levels: [
                { level: 1, type: 'Utility', range: '8 m', aoe: 'Radius 2 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 1 Save', special: '—' },
                { level: 2, type: 'Utility', range: '10 m', aoe: 'Radius 4 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 2 Saves', special: '—' },
                { level: 3, type: 'Utility', range: '12 m', aoe: 'Radius 6 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 3 Saves', special: '—' },
                { level: 4, type: 'Utility', range: '14 m', aoe: 'Radius 8 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 4 Saves', special: '—' }
            ]
        },
        {
            name: 'Feather Fall',
            school: 'Aegis & Benedictions',
            description: 'A shimmering aura slows every descent — wings of air cradle those within.',
            levels: [
                { level: 1, type: 'Utility', range: '8 m', aoe: 'Radius 2 m', duration: '—', effect: 'All creatures in the area descend slowly and take no fall damage', special: 'Glide Rate: 6 m / round' },
                { level: 2, type: 'Utility', range: '12 m', aoe: 'Radius 4 m', duration: '—', effect: 'As above; larger area and faster glide', special: 'Glide Rate: 12 m / round' },
                { level: 3, type: 'Utility', range: '16 m', aoe: 'Radius 6 m', duration: '—', effect: 'As above; allows minor horizontal drift (2 m / round)', special: 'Glide Rate: 20 m / round' },
                { level: 4, type: 'Utility', range: '20 m', aoe: 'Radius 8 m', duration: '—', effect: 'As above; perfect slow-fall control, drift up to 4 m / round', special: 'Glide Rate: 26 m / round' }
            ]
        },
        {
            name: 'Wings of Faith',
            school: 'Aegis & Benedictions',
            description: 'Radiant energy lifts you skyward, carrying you on unseen wings.',
            levels: [
                { level: 1, type: 'Utility', range: '8 m', aoe: 'Radius 2 m', duration: '1 Round', effect: 'All creatures in area may fly up to 4 m for 1 round', special: '—' },
                { level: 2, type: 'Utility', range: '12 m', aoe: 'Radius 4 m', duration: '1 Round', effect: 'As above; wider area and faster ascent', special: '—' },
                { level: 3, type: 'Utility', range: '16 m', aoe: 'Radius 6 m', duration: '1 Round', effect: 'As above; allows hovering', special: '—' },
                { level: 4, type: 'Utility', range: '20 m', aoe: 'Radius 8 m', duration: '1 Round', effect: 'As above; perfect flight control', special: '—' }
            ]
        }
    ]
};
/**
 * Get all magic powers for a specific school
 */
export function getMagicPowersBySchool(schoolName) {
    return MAGIC_POWERS[schoolName] || [];
}
/**
 * Get a specific magic power
 */
export function getMagicPower(schoolName, powerName) {
    const powers = getMagicPowersBySchool(schoolName);
    return powers.find(p => p.name === powerName);
}
/**
 * Get all magic powers across all schools
 */
export function getAllMagicPowers() {
    return Object.values(MAGIC_POWERS).flat();
}
//# sourceMappingURL=magic-powers.js.map