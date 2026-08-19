/**
 * Actor preferences for which standard combat maneuvers appear in the token radial menu.
 */
/** Maneuver IDs the radial menu can show (subset of COMBAT_MANEUVERS + weapon-attack). */
export const RADIAL_STANDARD_MANEUVER_IDS = [
    'move',
    'dash',
    'disengage',
    'stand-up',
    'flee',
    'quick-load',
    'weapon-swap',
    'weapon-attack',
    'parry-stance',
    'aid',
    'interpose',
];
export function isStandardRadialManeuverId(id) {
    return RADIAL_STANDARD_MANEUVER_IDS.includes(id);
}
export function isManeuverHiddenFromActorRadial(actor, maneuverId) {
    const prefs = actor?.system?.radialManeuverPrefs;
    if (!prefs)
        return false;
    if (prefs.hideAllStandard === true && isStandardRadialManeuverId(maneuverId)) {
        return true;
    }
    const hideIds = prefs.hideIds || {};
    return !!hideIds[maneuverId];
}
const RADIAL_PREFS_ROWS = [
    { id: 'move', name: 'Move', group: 'Bewegung' },
    { id: 'dash', name: 'Dash', group: 'Bewegung' },
    { id: 'disengage', name: 'Disengage', group: 'Bewegung' },
    { id: 'stand-up', name: 'Stand Up', group: 'Bewegung' },
    { id: 'flee', name: 'Flee', group: 'Bewegung' },
    { id: 'quick-load', name: 'Quick Load', group: 'Bewegung' },
    { id: 'weapon-swap', name: 'Weapon Swap', group: 'Bewegung' },
    { id: 'weapon-attack', name: 'Basic Attack', group: 'Angriff' },
    { id: 'parry-stance', name: 'Parry Stance', group: 'Angriff' },
    { id: 'aid', name: 'Aid', group: 'Reaktion' },
    { id: 'interpose', name: 'Interpose', group: 'Reaktion' },
];
/**
 * Data for the character sheet collapsible panel (checkbox = hide from radial).
 */
export function buildRadialManeuverPrefsContext(system) {
    const prefs = system?.radialManeuverPrefs || {};
    const hideAll = prefs.hideAllStandard === true;
    const hideIds = prefs.hideIds || {};
    const rows = RADIAL_PREFS_ROWS.map((r) => ({
        ...r,
        hideFromRadial: hideAll || !!hideIds[r.id],
        masterHideAll: hideAll,
    }));
    const groupOrder = ['Bewegung', 'Angriff', 'Reaktion', 'Initiative'];
    const rowsByGroup = groupOrder
        .map((group) => ({ group, rows: rows.filter((r) => r.group === group) }))
        .filter((g) => g.rows.length > 0);
    return { hideAllStandard: hideAll, rows, rowsByGroup };
}
//# sourceMappingURL=radial-maneuver-prefs.js.map