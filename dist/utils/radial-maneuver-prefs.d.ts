/**
 * Actor preferences for which standard combat maneuvers appear in the token radial menu.
 */
/** Maneuver IDs the radial menu can show (subset of COMBAT_MANEUVERS + weapon-attack). */
export declare const RADIAL_STANDARD_MANEUVER_IDS: readonly string[];
export declare function isStandardRadialManeuverId(id: string): boolean;
export declare function isManeuverHiddenFromActorRadial(actor: any, maneuverId: string): boolean;
export type RadialManeuverPrefsRow = {
    id: string;
    name: string;
    group: string;
    /** Checkbox "ausblenden" = hidden from radial */
    hideFromRadial: boolean;
    /** When true, per-row checkboxes are disabled (master hides all). */
    masterHideAll: boolean;
};
/**
 * Data for the character sheet collapsible panel (checkbox = hide from radial).
 */
export declare function buildRadialManeuverPrefsContext(system: any): {
    hideAllStandard: boolean;
    rows: RadialManeuverPrefsRow[];
    rowsByGroup: {
        group: string;
        rows: RadialManeuverPrefsRow[];
    }[];
};
//# sourceMappingURL=radial-maneuver-prefs.d.ts.map