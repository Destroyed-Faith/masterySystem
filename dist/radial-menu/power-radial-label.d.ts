/**
 * Player-facing label for a power on the token radial menu.
 * Strips internal tier suffixes and marks spells clearly.
 */
/** Remove trailing "Tier 3", "T3", "· T4", etc. from catalog-generated names. */
export declare function stripPowerTierSuffixFromName(name: string): string;
/**
 * Final radial label: tier noise removed, split-attack suffix, spell wording.
 */
export declare function formatRadialPowerDisplayName(item: any, opts?: {
    splitAttack?: boolean;
}): string;
//# sourceMappingURL=power-radial-label.d.ts.map