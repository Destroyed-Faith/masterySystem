/**
 * General Artifact Catalog
 *
 * Bound (non-Echo) Artifacts from the Player's Guide "Artifact Examples"
 * chapter. Unlike Echo Artifacts these are not granted at character creation —
 * they are seeded as Artifact-Builder trees into the world library (folder
 * "General Artifacts") and handed out by the GM.
 *
 * Each definition reuses the `EchoArtifactDefinition` authoring shape with
 * `echoKey: ''`; the tree builder detects the empty echo key and emits
 * `binding: 'bound'` nodes without `echoBound` flags. The authored
 * `levelProgression` tables below are the source of truth (1:1 from the
 * rulebook) — they are NOT recompiled from progression picks.
 */

import type { EchoArtifactDefinition } from './echo-artifacts.js';

/**
 * General artifact authoring entry. Adds an optional paperdoll override for
 * "Main Hand or Off Hand" artifacts (one-handed items usable in either hand).
 */
export interface GeneralArtifactDefinition extends EchoArtifactDefinition {
  /** Override for `system.equipSlots` (e.g. ['mainhand', 'offhand']). */
  paperdollSlots?: string[];
}

// ----------------------------------------------------------------------
// Moonlight Greatsword (Two-Handed Weapon, Main Hand + Off Hand)
// ----------------------------------------------------------------------

const MOONLIGHT_GREATSWORD: GeneralArtifactDefinition = {
  key: 'moonlightGreatsword',
  name: 'Moonlight Greatsword',
  echoKey: '',
  slot: 'bothHands',
  baseProfile: 'twoHandedWeapon',
  description:
    'A two-handed Artifact Weapon forged from pale lunar radiance. Moonlight Greatsword attacks may use Might or Agility.',
  restriction:
    'The Moonlight Greatsword occupies both hand Slots. A character with the Moonlight Greatsword cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item at the same time.',
  baseValues: [
    { slot: 'a', label: 'Weapon Damage', note: '4d8 to 16d8 across levels.' },
    { slot: 'b', label: 'Weapon Special', note: 'Smite(4) from L4, Smite(8) from L7.' },
    { slot: 'c', label: 'Weapon Special', note: 'Expose(4) from L7, Expose(8) + True Moonlight at L10.' },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Moonlight Mending I',
      type: 'Active',
      range: '20 m',
      duration: 'Instant',
      effect: 'Heal one creature for 10d8 HP.',
      special: 'Restore 1 Health Level per Safe Haven Rest.',
    },
    {
      level: 2,
      name: 'Moonlight Judgment I',
      type: 'Active',
      range: '20 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect:
        'Make one ranged attack against the Primary Target. On hit, the Primary Target takes Weapon Damage plus +7d8 Smite Damage. Secondary Targets with a valid Smite tag take +7d8 Smite Damage.',
      special: 'Smite',
    },
    {
      level: 3,
      name: 'Moonlight Shadow I',
      type: 'Artifact Only Active Buff',
      range: 'Self',
      aoe: '2 m radius',
      duration: 'Mastery Rank Rounds',
      effect:
        'At the end of each of your turns, enemies in the aura take 3d8 Smite. Uses per Safe Haven Rest: half the wielder\u2019s Mastery Rank, rounded up.',
      special: 'Smite Aura',
    },
    {
      level: 4,
      name: 'Moonlight Mending II',
      type: 'Active',
      range: '44 m',
      duration: 'Instant',
      effect: 'Heal one creature for 25d8 HP.',
      special: 'Restore 2 Health Levels per Safe Haven Rest.',
    },
    {
      level: 5,
      name: 'Moonlight Judgment II',
      type: 'Active',
      range: '32 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect:
        'Make one ranged attack against the Primary Target. On hit, the Primary Target takes Weapon Damage plus +29d8 Smite Damage. Secondary Targets with a valid Smite tag take +29d8 Smite Damage.',
      special: 'Smite',
    },
    {
      level: 6,
      name: 'Moonlight Shadow II',
      type: 'Artifact Only Active Buff',
      range: 'Self',
      aoe: '3 m radius',
      duration: 'Mastery Rank Rounds',
      effect:
        'At the end of each of your turns, enemies in the aura take 8d8 Smite. Uses per Safe Haven Rest: half the wielder\u2019s Mastery Rank, rounded up.',
      special: 'Smite Aura',
    },
    {
      level: 7,
      name: 'Moonlight Mending III',
      type: 'Active',
      range: '68 m',
      duration: 'Instant',
      effect: 'Heal one creature for 40d8 HP.',
      special: 'Restore 4 Health Levels per Safe Haven Rest.',
    },
    {
      level: 8,
      name: 'Moonlight Judgment III',
      type: 'Active',
      range: '32 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect:
        'Make one ranged attack against the Primary Target. On hit, the Primary Target takes Weapon Damage plus +53d8 Smite Damage. Secondary Targets with a valid Smite tag take +53d8 Smite Damage.',
      special: 'Smite',
    },
    {
      level: 9,
      name: 'Moonlight Shadow III',
      type: 'Artifact Only Active Buff',
      range: 'Self',
      aoe: '4 m radius',
      duration: 'Mastery Rank Rounds',
      effect:
        'At the end of each of your turns, enemies in the aura take 13d8 Smite. Uses per Safe Haven Rest: half the wielder\u2019s Mastery Rank, rounded up.',
      special: 'Smite Aura',
    },
    {
      level: 10,
      name: 'True Moonlight',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Moonlight Greatsword fully awakens. Choose or define one final Moonlight effect with GM approval.',
      special: 'True Moonlight',
    },
  ],
};

// ----------------------------------------------------------------------
// Soul Sigil (Body, Soul Sigil / Soul Tattoo)
// ----------------------------------------------------------------------

const SOUL_SIGIL: GeneralArtifactDefinition = {
  key: 'soulSigil',
  name: 'Soul Sigil',
  echoKey: '',
  slot: 'body',
  baseProfile: 'noArmorBody',
  description:
    'A bound Body Artifact that appears as thin silver lines running across the bearer\u2019s skin. It pulls the bearer slightly out of harm\u2019s path, catches damage in a temporary soul shell, and slowly knits the body back together through silver soul-light.',
  restriction:
    'The Soul Sigil occupies the Body Slot. It counts as Body Armor for Slot purposes, but it grants no Armor. The Soul Sigil cannot be worn together with another Body Artifact. Silver Veil is not Armor: if the bearer is hit without Temporary HP, the Soul Sigil provides no Armor against that damage.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'vitality',
    stonePowerId: 'vitality.tempHp',
    level: 1,
  },
  baseValues: [
    { slot: 'a', label: 'Evade (Silver Veil)', note: '+8 to +26 Evade across levels; Armor stays 0.' },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Soul Shell I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'The Soul Sigil supports the Temporary HP Stone Power and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
      special: 'Temporary HP Stone Power',
    },
    {
      level: 2,
      name: 'Uncanny Soul I',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering damage instance only',
      effect:
        'When you would take damage, gain 20 Temporary HP against the triggering damage instance. After that damage instance is resolved, these Temporary HP immediately disappear.',
      special: 'Temporary HP',
    },
    {
      level: 3,
      name: 'Resting Soul I',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank +1 rounds',
      effect:
        'Use the normal Active Buff: Healing at Power Level 4. At the start of each of your turns while active, heal 32 HP.',
      special: 'Healing',
    },
    {
      level: 4,
      name: 'Soul Shell II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'The Soul Sigil now pre-fills Tier 3 of the Temporary HP Stone Power. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.',
      special: 'Temporary HP Stone Power',
    },
    {
      level: 5,
      name: 'Uncanny Soul II',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering damage instance only',
      effect:
        'When you would take damage, gain 50 Temporary HP against the triggering damage instance. After that damage instance is resolved, these Temporary HP immediately disappear.',
      special: 'Temporary HP',
    },
    {
      level: 6,
      name: 'Resting Soul II',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank +1 rounds',
      effect:
        'Use the normal Active Buff: Healing at Power Level 10. At the start of each of your turns while active, heal 77 HP.',
      special: 'Healing',
    },
    {
      level: 7,
      name: 'Soul Shell III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'The Soul Sigil now pre-fills Tier 4 of the Temporary HP Stone Power. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If Tier 1, Tier 2, and Tier 3 are not paid, the pre-filled Tier 4 has no effect.',
      special: 'Temporary HP Stone Power',
    },
    {
      level: 8,
      name: 'Uncanny Soul III',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering damage instance only',
      effect:
        'When you would take damage, gain 80 Temporary HP against the triggering damage instance. After that damage instance is resolved, these Temporary HP immediately disappear.',
      special: 'Temporary HP',
    },
    {
      level: 9,
      name: 'Resting Soul III',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank +1 rounds',
      effect:
        'Use the normal Active Buff: Healing at Power Level 16. At the start of each of your turns while active, heal 122 HP.',
      special: 'Healing',
    },
    {
      level: 10,
      name: 'True Soul Sigil',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Soul Sigil fully awakens. Choose or define one final Soul effect with GM approval.',
      special: 'True Soul Sigil',
    },
  ],
};

// ----------------------------------------------------------------------
// Frostbound Returning Axe (One-Handed Weapon, Main Hand)
// ----------------------------------------------------------------------

const FROSTBOUND_RETURNING_AXE: GeneralArtifactDefinition = {
  key: 'frostboundReturningAxe',
  name: 'Frostbound Returning Axe',
  echoKey: '',
  slot: 'mainHand',
  baseProfile: 'oneHandedWeapon',
  description:
    'A one-handed Artifact Weapon marked by winter runes and returning force. When thrown, it cuts through the air and returns to the wielder\u2019s hand after the attack resolves.',
  restriction:
    'Returning does not grant an additional attack and does not change the action cost of attacks or Actives. After a thrown attack or Active granted by this Artifact is resolved, the Axe returns to the wielder.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.ignoreArmor',
    level: 1,
  },
  baseValues: [
    { slot: 'a', label: 'Weapon Damage', note: '2d8 to 11d8 across levels.' },
    { slot: 'b', label: 'Thrown Return', note: 'Thrown 9\u201315 m, Returning, from L4. True Frostbound Return at L10.' },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Stormpower I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'This Artifact supports the Ignore Armor Stone Power and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
      special: 'Ignore Armor',
    },
    {
      level: 2,
      name: 'Frost Throw I',
      type: 'Active',
      range: 'Thrown Range',
      duration: 'Instant',
      effect:
        'Throw the Axe at one target using the normal thrown weapon Active rules. The Axe returns after the attack resolves.',
      special: 'Freeze',
    },
    {
      level: 3,
      name: 'Rainshield I',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack only',
      effect:
        'When a creature hits you with an attack within the legal Reaction range, use Reaction: Counter Damage + Push at Power Level 4.',
      special: 'Counter Damage + Push',
    },
    {
      level: 4,
      name: 'Stormpower II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'This Artifact now pre-fills Tier 3 of the Ignore Armor Stone Power. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.',
      special: 'Ignore Armor',
    },
    {
      level: 5,
      name: 'Frost Throw II',
      type: 'Active',
      range: 'Thrown Range',
      duration: 'Instant',
      effect: 'Frost Throw improves to Power Level 10. The Axe returns after the attack resolves.',
      special: 'Freeze',
    },
    {
      level: 6,
      name: 'Rainshield II',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack only',
      effect: 'Use Reaction: Counter Damage + Push at Power Level 10.',
      special: 'Counter Damage + Push',
    },
    {
      level: 7,
      name: 'Stormpower III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'This Artifact now pre-fills Tier 4 of the Ignore Armor Stone Power. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If the lower tiers are not paid, the pre-filled Tier 4 has no effect.',
      special: 'Ignore Armor',
    },
    {
      level: 8,
      name: 'Frost Throw III',
      type: 'Active',
      range: 'Thrown Range',
      duration: 'Instant',
      effect: 'Frost Throw improves to Power Level 16. The Axe returns after the attack resolves.',
      special: 'Freeze',
    },
    {
      level: 9,
      name: 'Rainshield III',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack only',
      effect: 'Use Reaction: Counter Damage + Push at Power Level 16.',
      special: 'Counter Damage + Push',
    },
    {
      level: 10,
      name: 'True Frostbound Return',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Axe fully awakens. Choose or define one final Frostbound Return effect with GM approval.',
      special: 'True Frostbound Return',
    },
  ],
};

// ----------------------------------------------------------------------
// Shadowgrave Armor (Body, Shadow Armor)
// ----------------------------------------------------------------------

const SHADOWGRAVE_ARMOR: GeneralArtifactDefinition = {
  key: 'shadowgraveArmor',
  name: 'Shadowgrave Armor',
  echoKey: '',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description:
    'A bound Body Artifact formed from living shadow, grave-cold mist, and deathly sigils.',
  restriction:
    'Shadowgrave Armor occupies the Body Slot. The bearer cannot wear another Body Artifact or mundane armor while Shadowgrave Armor is bound. Shadowgrave Armor does not grant Damage Reduction and does not grant Phasing.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'vitality',
    stonePowerId: 'vitality.tempHp',
    level: 1,
  },
  baseValues: [
    { slot: 'a', label: 'Hybrid Defense', note: '4\u20139 Armor and +4 to +13 Evade across levels. True Shadowgrave Armor at L10.' },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Shadow Shell I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Shadowgrave Armor supports the Temporary HP Stone Power and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
      special: 'Temporary HP Stone Power',
    },
    {
      level: 2,
      name: 'Deathly Reprisal I',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering melee attack only',
      effect:
        'When a creature hits you with a melee attack, deal 2d8 damage to the triggering creature and push it 4 m. The triggering creature applies Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally.',
      special: 'Counter Damage + Push',
    },
    {
      level: 3,
      name: 'Hands of the Grave I',
      type: 'Active',
      range: '20 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect:
        'Spectral hands claw out of the ground at a target point within range. Affected creatures take no damage and suffer Root(2). Hands of the Grave does not push, knock Prone, or create difficult terrain.',
      special: 'Root(2)',
    },
    {
      level: 4,
      name: 'Shadow Shell II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Shadowgrave Armor pre-fills Tier 3 of the Temporary HP Stone Power. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.',
      special: 'Temporary HP Stone Power',
    },
    {
      level: 5,
      name: 'Deathly Reprisal II',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering melee attack only',
      effect:
        'When a creature hits you with a melee attack, deal 6d8 damage to the triggering creature and push it 8 m. The triggering creature applies Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally.',
      special: 'Counter Damage + Push',
    },
    {
      level: 6,
      name: 'Hands of the Grave II',
      type: 'Active',
      range: '44 m',
      aoe: 'Radius 5 m',
      duration: 'Instant',
      effect:
        'Spectral hands claw out of the ground at a target point within range. Affected creatures take no damage and suffer Root(4). Hands of the Grave does not push, knock Prone, or create difficult terrain.',
      special: 'Root(4)',
    },
    {
      level: 7,
      name: 'Shadow Shell III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Shadowgrave Armor pre-fills Tier 4 of the Temporary HP Stone Power. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If the lower tiers are not paid, the pre-filled Tier 4 has no effect.',
      special: 'Temporary HP Stone Power',
    },
    {
      level: 8,
      name: 'Deathly Reprisal III',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering melee attack only',
      effect:
        'When a creature hits you with a melee attack, deal 12d8 damage to the triggering creature and push it 8 m. The triggering creature applies Armor, Damage Reduction, resistance, immunity, and other legal mitigation normally.',
      special: 'Counter Damage + Push',
    },
    {
      level: 9,
      name: 'Hands of the Grave III',
      type: 'Active',
      range: '68 m',
      aoe: 'Radius 7 m',
      duration: 'Instant',
      effect:
        'Spectral hands claw out of the ground at a target point within range. Affected creatures take no damage and suffer Root(5). Hands of the Grave does not push, knock Prone, or create difficult terrain.',
      special: 'Root(5)',
    },
    {
      level: 10,
      name: 'True Shadowgrave Armor',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Shadowgrave Armor fully awakens. Choose or define one final Shadowgrave effect with GM approval.',
      special: 'True Shadowgrave Armor',
    },
  ],
};

// ----------------------------------------------------------------------
// Staff of the Dark (One-Handed Arcane Staff, Main Hand or Off Hand)
// ----------------------------------------------------------------------

const STAFF_OF_THE_DARK: GeneralArtifactDefinition = {
  key: 'staffOfTheDark',
  name: 'Staff of the Dark',
  echoKey: '',
  // Not a melee weapon — a Spell Focus. `custom` keeps it out of the weapon
  // kind so it never surfaces a weapon attack in the radial menu; it occupies
  // one hand slot via `paperdollSlots`.
  slot: 'mainHand',
  baseProfile: 'custom',
  paperdollSlots: ['mainhand', 'offhand'],
  description:
    'A bound arcane staff made from dark metallic wood, curved sharp edges, and an emerald-green core of living death. It is not a melee weapon — it is a Spell Focus. The Staff of the Dark may be used with Resolve or Influence and adds its Spell Focus Bonus to damage of Spells cast through it.',
  restriction:
    'The Staff of the Dark occupies one hand Slot (Main Hand or Off Hand). It cannot be used to make melee weapon attacks unless another rule explicitly allows it. The Spell Focus Bonus applies only to Spells cast through this Staff, never to weapon attacks.',
  baseValues: [
    {
      slot: 'a',
      label: 'Spell Focus Bonus',
      note: '+2d8 (L1) to +11d8 (L10) damage to Spells cast through this Staff. Does not apply to weapon attacks.',
    },
    {
      slot: 'b',
      label: 'Focus Special',
      note: 'Hex(2) from L4, Hex(3) from L6, Hex(4) from L8, Hex(5) at L10. Applies only if the Spell can legally carry it.',
    },
  ],
  // Special Boost Support: pre-fills the Intellect Ability "Special Boost"
  // Stone Power (Tier 2 at L1, Tier 3 at L4, Tier 4 at L7). The character must
  // always pay the lower tiers themselves.
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'intellect',
    stonePowerId: 'intellect.specialBoost',
    level: 1,
    name: 'Special Boost Support',
  },
  levelProgression: [
    {
      level: 1,
      name: 'Special Boost Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'The Staff of the Dark supports the Intellect Ability Special Boost Stone Power and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
      special: 'Special Boost',
    },
    {
      level: 2,
      name: 'Life Taken I',
      type: 'Active, Spell',
      range: '20 m',
      duration: 'Instant',
      effect:
        'Roll Spell Focus Bonus + 7d8 damage on hit. Split the total in half, rounded down. One half is dealt as damage. One willing creature within 20 m heals HP equal to the other half.',
    },
    {
      level: 3,
      name: 'Aura of the End I',
      type: 'Artifact Only Active Buff, Spell',
      range: 'Self',
      aoe: '3 m radius',
      duration: 'Mastery Rank Rounds',
      effect:
        'Enemies in the aura gain Frightened(2) while they remain in the aura. When an enemy leaves the aura, this Frightened value ends immediately. Aura of the End deals no damage and does not stack with itself.',
      special: 'Frightened(2)',
    },
    {
      level: 4,
      name: 'Special Boost Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'The Staff of the Dark pre-fills Tier 3 of the Intellect Ability Special Boost Stone Power. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.',
      special: 'Special Boost',
    },
    {
      level: 5,
      name: 'Life Taken II',
      type: 'Active, Spell',
      range: '44 m',
      duration: 'Instant',
      effect:
        'Roll Spell Focus Bonus + 17d8 damage on hit. Split the total in half, rounded down. One half is dealt as damage. One willing creature within 44 m heals HP equal to the other half.',
    },
    {
      level: 6,
      name: 'Aura of the End II',
      type: 'Artifact Only Active Buff, Spell',
      range: 'Self',
      aoe: '5 m radius',
      duration: 'Mastery Rank Rounds',
      effect:
        'Enemies in the aura gain Frightened(4) while they remain in the aura. When an enemy leaves the aura, this Frightened value ends immediately. Aura of the End deals no damage and does not stack with itself.',
      special: 'Frightened(4)',
    },
    {
      level: 7,
      name: 'Special Boost Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'The Staff of the Dark pre-fills Tier 4 of the Intellect Ability Special Boost Stone Power. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If the lower tiers are not paid, the pre-filled Tier 4 has no effect.',
      special: 'Special Boost',
    },
    {
      level: 8,
      name: 'Life Taken III',
      type: 'Active, Spell',
      range: '68 m',
      duration: 'Instant',
      effect:
        'Roll Spell Focus Bonus + 27d8 damage on hit. Split the total in half, rounded down. One half is dealt as damage. One willing creature within 68 m heals HP equal to the other half.',
    },
    {
      level: 9,
      name: 'Aura of the End III',
      type: 'Artifact Only Active Buff, Spell',
      range: 'Self',
      aoe: '7 m radius',
      duration: 'Mastery Rank Rounds',
      effect:
        'Enemies in the aura gain Frightened(6) while they remain in the aura. When an enemy leaves the aura, this Frightened value ends immediately. Aura of the End deals no damage and does not stack with itself.',
      special: 'Frightened(6)',
    },
    {
      level: 10,
      name: 'True Staff of the Dark',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Staff of the Dark fully awakens. Choose or define one final Staff of the Dark effect with GM approval.',
      special: 'True Staff of the Dark',
    },
  ],
};

// ----------------------------------------------------------------------
// Starfallen Forceshield (Medium Shield, Main Hand or Off Hand)
// ----------------------------------------------------------------------

const STARFALLEN_FORCESHIELD: GeneralArtifactDefinition = {
  key: 'starfallenForceshield',
  name: 'Starfallen Forceshield',
  echoKey: '',
  slot: 'offHand',
  baseProfile: 'shield',
  paperdollSlots: ['mainhand', 'offhand'],
  description:
    'A bound Shield Artifact forged from star-metal and celestial force. In its dormant state, it appears as a claw-like knuckle guard. When activated, it unfolds into a semi-transparent crescent shield of blue, gold, and violet force.',
  restriction:
    'The Starfallen Forceshield occupies one hand Slot. A character with the Starfallen Forceshield cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item in the same hand. Shield Value stacks with Armor Value as normal Armor resolution. Drawback: -2d8 Physical Skill Checks.',
  baseValues: [
    { slot: 'a', label: 'Shield Value', note: '+4 to +8 Armor across levels; drawback -2d8 Physical Skill Checks. True Starfallen Forceshield at L10.' },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Reflection I',
      type: 'Reaction',
      range: '2 m',
      duration: 'Triggering attack only',
      effect:
        'When a creature within range hits you with an attack, deal 2d8 damage to the triggering creature and push it 4 m.',
      special: 'Counter Damage + Push',
    },
    {
      level: 2,
      name: 'Crystalized I',
      type: 'Active',
      range: '20 m',
      aoe: 'Radius 2 m',
      duration: 'Instant',
      effect: 'Deal +1d8 damage on hit.',
      special: 'Root(4)',
    },
    {
      level: 3,
      name: 'Crystal Rain I',
      type: 'Active',
      range: '20 m',
      aoe: 'Radius 2 m',
      duration: 'Instant',
      effect: 'Deal +7d8 damage on hit.',
    },
    {
      level: 4,
      name: 'Reflection II',
      type: 'Reaction',
      range: '2 m',
      duration: 'Triggering attack only',
      effect:
        'When a creature within range hits you with an attack, deal 6d8 damage to the triggering creature and push it 8 m.',
      special: 'Counter Damage + Push',
    },
    {
      level: 5,
      name: 'Crystalized II',
      type: 'Active',
      range: '44 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect: 'Deal +2d8 damage on hit.',
      special: 'Root(8)',
    },
    {
      level: 6,
      name: 'Crystal Rain II',
      type: 'Active',
      range: '44 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect: 'Deal +17d8 damage on hit.',
    },
    {
      level: 7,
      name: 'Reflection III',
      type: 'Reaction',
      range: '2 m',
      duration: 'Triggering attack only',
      effect:
        'When a creature within range hits you with an attack, deal 12d8 damage to the triggering creature and push it 8 m.',
      special: 'Counter Damage + Push',
    },
    {
      level: 8,
      name: 'Crystalized III',
      type: 'Active',
      range: '68 m',
      aoe: 'Radius 4 m',
      duration: 'Instant',
      effect: 'Deal +2d8 damage on hit.',
      special: 'Root(10)',
    },
    {
      level: 9,
      name: 'Crystal Rain III',
      type: 'Active',
      range: '68 m',
      aoe: 'Radius 4 m',
      duration: 'Instant',
      effect: 'Deal +27d8 damage on hit.',
    },
    {
      level: 10,
      name: 'True Starfallen Forceshield',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Starfallen Forceshield fully awakens. Choose or define one final Starfallen Forceshield effect with GM approval.',
      special: 'True Starfallen Forceshield',
    },
  ],
};

// ----------------------------------------------------------------------
// Lantern of the Hollow Star (Amulet, Lantern)
// ----------------------------------------------------------------------

const LANTERN_OF_THE_HOLLOW_STAR: GeneralArtifactDefinition = {
  key: 'lanternOfTheHollowStar',
  name: 'Lantern of the Hollow Star',
  echoKey: '',
  slot: 'amulet',
  baseProfile: 'lantern',
  description:
    'A bound Amulet Artifact shaped like a black lantern filled with pale inner fire. It is not a shield. It grants no Armor, no Evade, no Weapon Damage, and no Base Value \u2014 all of its power is written into its Level Progression.',
  restriction:
    'The Lantern of the Hollow Star occupies the Amulet Slot. A character with the Lantern of the Hollow Star cannot bind another Amulet Artifact at the same time.',
  stoneFunction: {
    kind: 'stoneBattery',
    attribute: 'resolve',
    level: 1,
  },
  baseValues: [],
  levelProgression: [
    {
      level: 1,
      name: 'Stone Battery I',
      type: 'Stone Battery',
      range: 'Self',
      duration: 'Passive',
      effect:
        'The Lantern is a Stone Battery with a capacity of 10 Stones. It starts empty. It does not refill after a Safe Haven Rest. It can only be charged through GM-approved sources.',
      special: 'Stone Battery',
    },
    {
      level: 2,
      name: 'Lantern Glow I',
      type: 'Support',
      range: 'Self',
      aoe: 'Radius 8 m',
      duration: 'Passive',
      effect:
        'The Lantern sheds pale light in the area. The light may reveal magical darkness, hidden deathly traces, spirit marks, or similar supernatural traces if the GM allows it.',
      special: 'Lantern Light',
    },
    {
      level: 3,
      name: 'Soul Reserve I',
      type: 'Resource Support',
      range: 'Self',
      duration: 'Passive',
      effect:
        'Once per Safe Haven Rest, you may spend 1 Stone from the Lantern Battery for a Power you use, ignoring the Artifact\u2019s normal Slot-function restriction.',
      special: 'Free Stone',
    },
    {
      level: 4,
      name: 'Stone Battery II',
      type: 'Stone Battery',
      range: 'Self',
      duration: 'Passive',
      effect:
        'The Lantern Battery capacity increases to 20 Stones. It starts empty. It does not refill after a Safe Haven Rest. It can only be charged through GM-approved sources.',
      special: 'Stone Battery',
    },
    {
      level: 5,
      name: 'Lantern Glow II',
      type: 'Support',
      range: 'Self',
      aoe: 'Radius 16 m',
      duration: 'Passive',
      effect:
        'The Lantern sheds pale light in the area. The light may reveal stronger magical darkness, deathly traces, spirit marks, cursed residue, or similar supernatural traces if the GM allows it.',
      special: 'Lantern Light',
    },
    {
      level: 6,
      name: 'Soul Reserve II',
      type: 'Resource Support',
      range: 'Self',
      duration: 'Passive',
      effect:
        'Twice per Safe Haven Rest, you may spend 1 Stone from the Lantern Battery for a Power you use, ignoring the Artifact\u2019s normal Slot-function restriction.',
      special: 'Free Stone',
    },
    {
      level: 7,
      name: 'Stone Battery III',
      type: 'Stone Battery',
      range: 'Self',
      duration: 'Passive',
      effect:
        'The Lantern Battery capacity increases to 40 Stones. It starts empty. It does not refill after a Safe Haven Rest. It can only be charged through GM-approved sources.',
      special: 'Stone Battery',
    },
    {
      level: 8,
      name: 'Lantern Glow III',
      type: 'Support',
      range: 'Self',
      aoe: 'Radius 24 m',
      duration: 'Passive',
      effect:
        'The Lantern sheds pale light in the area. The light may reveal magical darkness, deathly traces, spirit marks, cursed residue, hidden undead, or similar supernatural traces if the GM allows it.',
      special: 'Lantern Light',
    },
    {
      level: 9,
      name: 'Soul Reserve III',
      type: 'Resource Support',
      range: 'Self',
      duration: 'Passive',
      effect:
        'Three times per Safe Haven Rest, you may spend 1 Stone from the Lantern Battery for a Power you use, ignoring the Artifact\u2019s normal Slot-function restriction.',
      special: 'Free Stone',
    },
    {
      level: 10,
      name: 'True Hollow Star',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Lantern fully awakens. Choose or define one final Stone Battery, soul reserve, lantern light, or stored-stone effect with GM approval.',
      special: 'True Hollow Star',
    },
  ],
};

// ----------------------------------------------------------------------
// Lor-Keth's Staff (Two-Handed Stone Staff, Main Hand + Off Hand)
// ----------------------------------------------------------------------

const LOR_KETHS_STAFF: GeneralArtifactDefinition = {
  key: 'lorKethsStaff',
  name: "Lor-Keth's Staff",
  echoKey: '',
  slot: 'bothHands',
  baseProfile: 'twoHandedWeapon',
  description:
    "Lor-Keth's Staff is a two-handed Rod of the Storm Ancestors. It was forged for giants, shaped from smooth blue-gray stone, and awakened by old runes of storm and bloodline.\n\nThe Staff changes with its bearer.\n\nIt is not a wand. It is a giant's weapon.",
  restriction:
    "Lor-Keth's Staff requires both hands.\n\nWhile wielding it, the character cannot wield another weapon, shield, or Hand Artifact.",
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.ignoreArmor',
    level: 1,
  },
  baseValues: [
    { slot: 'a', label: 'Staff Damage', note: '1d8 to 10d8 across levels.' },
    {
      slot: 'b',
      label: 'Storm Rune',
      note: 'Shock Rune from L4, Greater Shock Rune from L7, True Shock Rune at L10.',
    },
    {
      slot: 'c',
      label: 'Giant Weight',
      note: 'Giant Weight from L7, True Giant Weight at L10.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Giant Shock Strike I',
      type: 'Active',
      range: 'Melee Reach',
      duration: 'Instant',
      effect:
        "Use Melee — Damage + Start PP 6 Special at Power Level 4. Make a melee attack with Lor-Keth's Staff. On hit, deal Staff Weapon Damage + 2d8 damage.",
      special: 'Shock(5)',
    },
    {
      level: 2,
      name: 'Ancestor Guard I',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack or damage instance only',
      effect:
        'Use Reaction: Armor at Power Level 4. When you are hit or would take damage, gain +10 Armor against the triggering attack or damage instance.',
      special: 'Armor',
    },
    {
      level: 3,
      name: 'Might Ignore Armor Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        "Lor-Keth's Staff supports the Might Ability Ignore Armor and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.",
      special: 'Ignore Armor',
    },
    {
      level: 4,
      name: 'Giant Shock Strike II',
      type: 'Active',
      range: 'Melee Reach',
      duration: 'Instant',
      effect:
        "Use Melee — Damage + Start PP 6 Special at Power Level 10. Make a melee attack with Lor-Keth's Staff. On hit, deal Staff Weapon Damage + 2d8 damage.",
      special: 'Shock(9)',
    },
    {
      level: 5,
      name: 'Ancestor Guard II',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack or damage instance only',
      effect:
        'Use Reaction: Armor at Power Level 10. When you are hit or would take damage, gain +26 Armor against the triggering attack or damage instance.',
      special: 'Armor',
    },
    {
      level: 6,
      name: 'Might Ignore Armor Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        "Lor-Keth's Staff pre-fills Tier 3 of the Might Ability Ignore Armor. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.",
      special: 'Ignore Armor',
    },
    {
      level: 7,
      name: 'Giant Shock Strike III',
      type: 'Active',
      range: 'Melee Reach',
      duration: 'Instant',
      effect:
        "Use Melee — Damage + Start PP 6 Special at Power Level 16. Make a melee attack with Lor-Keth's Staff. On hit, deal Staff Weapon Damage + 2d8 damage.",
      special: 'Shock(11)',
    },
    {
      level: 8,
      name: 'Ancestor Guard III',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack or damage instance only',
      effect:
        'Use Reaction: Armor at Power Level 16. When you are hit or would take damage, gain +42 Armor against the triggering attack or damage instance.',
      special: 'Armor',
    },
    {
      level: 9,
      name: 'Might Ignore Armor Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        "Lor-Keth's Staff pre-fills Tier 4 of the Might Ability Ignore Armor. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If the lower tiers are not paid, the pre-filled Tier 4 has no effect.",
      special: 'Ignore Armor',
    },
    {
      level: 10,
      name: 'Heart of the Storm Ancestors',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Staff fully awakens as a giant-forged ancestral weapon. Choose or define one final Storm Ancestor effect with GM approval.',
      special: 'True Storm Ancestor',
    },
  ],
};

// ----------------------------------------------------------------------
// Registry
// ----------------------------------------------------------------------

export const GENERAL_ARTIFACTS: Record<string, GeneralArtifactDefinition> = {
  moonlightGreatsword: MOONLIGHT_GREATSWORD,
  soulSigil: SOUL_SIGIL,
  frostboundReturningAxe: FROSTBOUND_RETURNING_AXE,
  shadowgraveArmor: SHADOWGRAVE_ARMOR,
  staffOfTheDark: STAFF_OF_THE_DARK,
  starfallenForceshield: STARFALLEN_FORCESHIELD,
  lanternOfTheHollowStar: LANTERN_OF_THE_HOLLOW_STAR,
  lorKethsStaff: LOR_KETHS_STAFF,
};

/** Lookup a General Artifact by key. */
export function getGeneralArtifact(key: string | null | undefined): GeneralArtifactDefinition | null {
  if (!key) return null;
  return GENERAL_ARTIFACTS[key] ?? null;
}
