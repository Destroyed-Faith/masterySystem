/**
 * Unbound base identities (Player's Guide).
 *
 * Echo key stays `unbound`. The player then picks one Response as the
 * character's base: Beast, one Witch Tradition, or one Bane Call.
 * Each identity grants exactly one Echo Artifact.
 */
export declare const UNBOUND_PREDATOR_SHAPES: readonly ["Wolf", "Bear", "Raven", "Stag", "Fox", "Boar", "Serpent", "Lynx"];
export type UnboundPredatorShape = (typeof UNBOUND_PREDATOR_SHAPES)[number];
export declare const UNBOUND_PREDATOR_STONES: readonly [{
    readonly key: "might";
    readonly label: "Might — Melee Damage";
    readonly artifactKey: "predatorCrownMight";
}, {
    readonly key: "wits";
    readonly label: "Wits — Initiative Boost";
    readonly artifactKey: "predatorCrownWits";
}, {
    readonly key: "intellect";
    readonly label: "Intellect — Spell Raises";
    readonly artifactKey: "predatorCrownIntellect";
}];
export type UnboundPredatorStone = (typeof UNBOUND_PREDATOR_STONES)[number]['key'];
export type UnboundIdentityGroup = 'Beasts' | 'Witches' | 'Banes';
export interface UnboundIdentity {
    key: string;
    group: UnboundIdentityGroup;
    name: string;
    artifactName: string;
    artifactKey: string;
    slotLabel: string;
    summary: string;
    technical: string;
    /** Optional extra creation picks (Beast stone path + predator shape). */
    extras?: 'predator';
}
export declare const UNBOUND_IDENTITIES: UnboundIdentity[];
export declare const UNBOUND_IDENTITY_GROUPS: UnboundIdentityGroup[];
export declare function getUnboundIdentity(key: string | null | undefined): UnboundIdentity | undefined;
export declare function unboundIdentitiesInGroup(group: UnboundIdentityGroup): UnboundIdentity[];
/** Artifact granted by the chosen Unbound identity (Beast also needs the stone path). */
export declare function resolveUnboundArtifactKey(identityKey: string | null | undefined, predatorStone?: string | null): string | null;
export declare function isUnboundIdentityKey(key: string | null | undefined): boolean;
//# sourceMappingURL=unbound-identities.d.ts.map