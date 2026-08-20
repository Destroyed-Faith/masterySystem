/**
 * Unbound base identities (Player's Guide).
 *
 * Echo key stays `unbound`. The player then picks one Response as the
 * character's base: Beast, one Witch Tradition, or one Bane Call.
 * Each identity grants exactly one Echo Artifact.
 */
export const UNBOUND_PREDATOR_SHAPES = [
    'Wolf',
    'Bear',
    'Raven',
    'Stag',
    'Fox',
    'Boar',
    'Serpent',
    'Lynx',
];
export const UNBOUND_PREDATOR_STONES = [
    { key: 'might', label: 'Might — Melee Damage', artifactKey: 'predatorCrownMight' },
    { key: 'wits', label: 'Wits — Initiative Boost', artifactKey: 'predatorCrownWits' },
    { key: 'intellect', label: 'Intellect — Spell Raises', artifactKey: 'predatorCrownIntellect' },
];
export const UNBOUND_IDENTITIES = [
    {
        key: 'beast',
        group: 'Beasts',
        name: 'Beast',
        artifactName: 'Predator Crown',
        artifactKey: 'predatorCrownMight',
        slotLabel: 'Head',
        summary: 'The body’s response: transformation, instinct, and sacred violence. Choose a Predator Shape and one Predator Stone path.',
        technical: 'Bite Damage / Head Armor / Predator Sense / Stone Power Support / Reaction: Damage / Active Buff: Damage',
        extras: 'predator',
    },
    {
        key: 'witch-root',
        group: 'Witches',
        name: 'Root Witch',
        artifactName: 'Root Staff',
        artifactKey: 'witchStaffRoot',
        slotLabel: 'Main Hand + Off Hand',
        summary: 'Root Witches bind, entangle, hold, and awaken the deep green will of the land.',
        technical: 'Ranged Attack + Slow / Active Buff: Special Increase + Slow / Intellect Ability: Spell Raises',
    },
    {
        key: 'witch-ruin',
        group: 'Witches',
        name: 'Ruin Witch',
        artifactName: 'Ruin Staff',
        artifactKey: 'witchStaffRuin',
        slotLabel: 'Main Hand + Off Hand',
        summary: 'Ruin Witches curse, break, hex, and turn certainty into collapse.',
        technical: 'Ranged Attack + Hex / Active Buff: Special Increase + Hex / Intellect Ability: Spell Raises',
    },
    {
        key: 'witch-blight',
        group: 'Witches',
        name: 'Blight Witch',
        artifactName: 'Blight Staff',
        artifactKey: 'witchStaffBlight',
        slotLabel: 'Main Hand + Off Hand',
        summary: 'Blight Witches poison, corrode, wither, and teach flesh, metal, and faith how to decay.',
        technical: 'Ranged Attack + Corrode / Active Buff: Special Increase + Corrode / Intellect Ability: Spell Raises',
    },
    {
        key: 'bane-alchemist',
        group: 'Banes',
        name: 'Bane Alchemist',
        artifactName: 'Alchemist Coat',
        artifactKey: 'alchemistCoat',
        slotLabel: 'Body',
        summary: 'Survive the hunt through potions, oils, and preparation — not by becoming the monster.',
        technical: 'Medium Armor / Active Buff: Damage / Active Buff: Critical / Vitality Ability: Extend Active Buff',
    },
    {
        key: 'bane-greenwarden',
        group: 'Banes',
        name: 'Bane Greenwarden',
        artifactName: 'Green Warden Mantle',
        artifactKey: 'greenWardenMantle',
        slotLabel: 'Body',
        summary: 'Bark, thorn, and old green wrath. Endurance and retaliation, not animal shape.',
        technical: 'Medium Armor / Active Buff: Thorns / Reaction: Ally Armor / Resolve Ability: Special Reduction',
    },
    {
        key: 'bane-relic-hunter',
        group: 'Banes',
        name: 'Bane Relic Hunter',
        artifactName: "Hunter's Scourge",
        artifactKey: 'huntersScourge',
        slotLabel: 'Main Hand + Off Hand',
        summary: 'Pull the monster close and burn it out of the world with chain, lash, and exorcism.',
        technical: 'Melee Attack + Exorcism / Artifact Reaction: Damage + Pull / Melee AoE Attack + Exorcism',
    },
];
export const UNBOUND_IDENTITY_GROUPS = ['Beasts', 'Witches', 'Banes'];
export function getUnboundIdentity(key) {
    if (!key)
        return undefined;
    return UNBOUND_IDENTITIES.find((id) => id.key === key);
}
export function unboundIdentitiesInGroup(group) {
    return UNBOUND_IDENTITIES.filter((id) => id.group === group);
}
/** Artifact granted by the chosen Unbound identity (Beast also needs the stone path). */
export function resolveUnboundArtifactKey(identityKey, predatorStone) {
    const identity = getUnboundIdentity(identityKey);
    if (!identity)
        return null;
    if (identity.extras === 'predator') {
        const stone = UNBOUND_PREDATOR_STONES.find((s) => s.key === predatorStone);
        return stone?.artifactKey ?? null;
    }
    return identity.artifactKey;
}
export function isUnboundIdentityKey(key) {
    return !!getUnboundIdentity(key);
}
//# sourceMappingURL=unbound-identities.js.map