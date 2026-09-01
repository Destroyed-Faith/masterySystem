/**
 * Actor preferences for which standard combat maneuvers appear in the token radial menu.
 */

/** Maneuver IDs the radial menu can show (subset of COMBAT_MANEUVERS + weapon-attack). */
export const RADIAL_STANDARD_MANEUVER_IDS: readonly string[] = [
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
];

/** Maneuver IDs hidden by default; only appear when the player opts in. */
export const OPT_IN_RADIAL_MANEUVER_IDS: readonly string[] = ['weapon-attack'];

export function isStandardRadialManeuverId(id: string): boolean {
  return RADIAL_STANDARD_MANEUVER_IDS.includes(id);
}

export function isOptInRadialManeuverId(id: string): boolean {
  return OPT_IN_RADIAL_MANEUVER_IDS.includes(id);
}

export function isManeuverHiddenFromActorRadial(actor: any, maneuverId: string): boolean {
  const prefs = (actor?.system as any)?.radialManeuverPrefs;
  if (prefs?.hideAllStandard === true && isStandardRadialManeuverId(maneuverId)) {
    return true;
  }
  // Basic Attack (and any other opt-in): hidden unless explicitly shown.
  if (isOptInRadialManeuverId(maneuverId)) {
    return prefs?.showIds?.[maneuverId] !== true;
  }
  if (!prefs) return false;
  const hideIds = prefs.hideIds || {};
  return !!hideIds[maneuverId];
}

export type RadialManeuverPrefsRow = {
  id: string;
  name: string;
  group: string;
  /** Checkbox "ausblenden" = hidden from radial */
  hideFromRadial: boolean;
  /** When true, per-row checkboxes are disabled (master hides all). */
  masterHideAll: boolean;
};

const RADIAL_PREFS_ROWS: Array<{ id: string; name: string; group: string }> = [
  { id: 'move', name: 'Move', group: 'Bewegung' },
  { id: 'dash', name: 'Dash', group: 'Bewegung' },
  { id: 'disengage', name: 'Disengage', group: 'Bewegung' },
  { id: 'stand-up', name: 'Stand Up', group: 'Bewegung' },
  { id: 'flee', name: 'Flee', group: 'Bewegung' },
  { id: 'quick-load', name: 'Quick Load', group: 'Bewegung' },
  { id: 'weapon-swap', name: 'Weapon Swap', group: 'Angriff' },
  { id: 'weapon-attack', name: 'Basic Attack', group: 'Angriff' },
  { id: 'parry-stance', name: 'Parry Stance', group: 'Angriff' },
  { id: 'aid', name: 'Aid', group: 'Reaktion' },
];

/**
 * Data for the character sheet collapsible panel (checkbox = hide from radial).
 */
export function buildRadialManeuverPrefsContext(system: any): {
  hideAllStandard: boolean;
  rows: RadialManeuverPrefsRow[];
  rowsByGroup: { group: string; rows: RadialManeuverPrefsRow[] }[];
} {
  const prefs = system?.radialManeuverPrefs || {};
  const hideAll = prefs.hideAllStandard === true;
  const hideIds = prefs.hideIds || {};
  const showIds = prefs.showIds || {};

  const rows: RadialManeuverPrefsRow[] = RADIAL_PREFS_ROWS.map((r) => {
    const optIn = isOptInRadialManeuverId(r.id);
    const hideFromRadial = hideAll || (optIn ? showIds[r.id] !== true : !!hideIds[r.id]);
    return {
      ...r,
      hideFromRadial,
      masterHideAll: hideAll,
    };
  });

  const groupOrder = ['Bewegung', 'Angriff', 'Reaktion', 'Initiative'];
  const rowsByGroup = groupOrder
    .map((group) => ({ group, rows: rows.filter((r) => r.group === group) }))
    .filter((g) => g.rows.length > 0);

  return { hideAllStandard: hideAll, rows, rowsByGroup };
}
