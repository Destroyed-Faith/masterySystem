/** Normalize weapon display names for icon lookup (hyphens, repeated spaces). */
export declare function normalizeWeaponNameKey(name: string): string;
/** Normalize gear keys so curly apostrophes match GEAR_ICONS (ASCII '). */
export declare function normalizeGearIconKey(name: string): string;
/**
 * Custom icon for a seeded Echo or General Artifact tree (all levels share the same art).
 * Returns null when no dedicated PNG exists for the key.
 */
export declare function getEchoArtifactIcon(echoArtifactKey: string): string | null;
/** Alternative / combined art for an Echo or General Artifact, if authored. */
export declare function getEchoArtifactAltIcon(echoArtifactKey: string): string | null;
export type ItemIconSystemHint = {
    type?: string;
    echoArtifactKey?: string;
};
/** Build an icon lookup hint from a live or pending Item document. */
export declare function getItemIconHintFromItem(item: {
    system?: ItemIconSystemHint | null;
    getFlag?: (scope: string, key: string) => unknown;
}): ItemIconSystemHint;
/** Build an icon lookup hint from preCreateItem data (flags may not be on `system`). */
export declare function getItemIconHintFromCreateData(data: {
    system?: ItemIconSystemHint | null;
    flags?: Record<string, Record<string, unknown>>;
}): ItemIconSystemHint;
/**
 * Resolve the best icon path for an item by name and type.
 * For armor and shields, pass `system` (with `type` tier) so renamed items still match the correct art.
 * Returns null if no custom icon is available.
 */
export declare function getItemIcon(name: string, type: string, system?: ItemIconSystemHint | null): string | null;
//# sourceMappingURL=item-icons.d.ts.map