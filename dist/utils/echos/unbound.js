export const UNBOUND_ECHO = {
    key: 'unbound',
    name: 'Unbound',
    tagline: 'The Wyld does not name us. It uses us.',
    theme: 'Living answers without a stable self. You survive by adapting, masking, and turning pressure into motion.',
    summary: 'The world\u2019s reaction when something is forced to become what it was never meant to be. Beasts, Witches, and Banes \u2014 not one people, one response. Not gentle, not evil \u2014 corrective, instinctive, made to oppose what does not belong.',
    creatureType: 'Manifestation',
    size: 'medium',
    speed: 8,
    coreTraits: [
        {
            id: 'the-response-takes-over',
            name: 'The Response Takes Over',
            effect: 'When an Unbound is pushed too far, the response may take over. The Beast becomes the shape that hunts. The Witch becomes the curse that speaks through flesh. The Bane becomes the weapon that can no longer stop hunting. Powerful, useful, and never fully theirs.',
            flavor: 'Echo Burden',
            usage: 'passive',
        },
    ],
    subChoiceLabel: 'Unbound Response',
    subChoices: [
        {
            key: 'beast',
            name: 'Beast',
            trait: {
                id: 'beast-response',
                name: 'Beast',
                effect: 'The body\'s response. Predator Crown occupies the Head Slot. Choose a Predator Shape and one Predator Stone path (Might, Wits, or Intellect).',
                flavor: 'Fang, horn, claw, feather, hunger.',
                usage: 'passive',
            },
        },
        {
            key: 'witch-root',
            name: 'Root Witch',
            trait: {
                id: 'root-witch',
                name: 'Root Staff',
                effect: 'Tradition Special: Slow. Binding Circle is Ranged AoE Special: Root. Main Spell is Ranged Single Target Special: Weaken. Witch Staff occupies both hands.',
                flavor: 'Buried wood, grave roots, old circles.',
                usage: 'passive',
            },
        },
        {
            key: 'witch-ruin',
            name: 'Ruin Witch',
            trait: {
                id: 'ruin-witch',
                name: 'Ruin Staff',
                effect: 'Tradition Special: Hex. Binding Circle is Ranged AoE Special: Root. Main Spell is Ranged Single Target Special: Ruin. Witch Staff occupies both hands.',
                flavor: 'Blackened wood, ash, erased names.',
                usage: 'passive',
            },
        },
        {
            key: 'witch-blight',
            name: 'Blight Witch',
            trait: {
                id: 'blight-witch',
                name: 'Blight Staff',
                effect: 'Tradition Special: Corrode. Binding Circle is Ranged AoE Special: Root. Main Spell is Ranged Single Target Special: Blight. Witch Staff occupies both hands.',
                flavor: 'Fungus, rust, living decay.',
                usage: 'passive',
            },
        },
        {
            key: 'bane-alchemist',
            name: 'Bane Alchemist',
            trait: {
                id: 'bane-alchemist',
                name: 'Alchemist Coat',
                effect: 'Medium Armor. Red Potion is Active Buff: Damage. Black Potion is Active Buff: Critical. Alchemist Stone is Potion Active Buff Empowerment (+1/+2/+3 PL and Rounds).',
                flavor: 'Preparation, not transformation.',
                usage: 'passive',
            },
        },
        {
            key: 'bane-greenwarden',
            name: 'Bane Greenwarden',
            trait: {
                id: 'bane-greenwarden',
                name: 'Green Warden Mantle',
                effect: 'Medium Armor. Thorns is Active Buff: Thorns. Warden\'s Guard is Reaction: Ally Armor. Green Warden Stone supports Resolve Ability: Ward.',
                flavor: 'Bark, thorn, patient violence.',
                usage: 'passive',
            },
        },
        {
            key: 'bane-relic-hunter',
            name: 'Bane Relic Hunter',
            trait: {
                id: 'bane-relic-hunter',
                name: "Hunter's Scourge",
                effect: 'Two-handed chain-whip. Scourge Strike is Limited Melee Single Target Attack. Maximization Support is Vitality: Maximization. Unmask the Prey is Melee Single Target Special: Expose.',
                flavor: 'Pull the monster close.',
                usage: 'passive',
            },
        },
    ],
};
//# sourceMappingURL=unbound.js.map