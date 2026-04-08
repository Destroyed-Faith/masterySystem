/**
 * Actor preferences for which standard combat maneuvers appear in the token radial menu.
 */

/** Maneuver IDs the radial menu can show (subset of COMBAT_MANEUVERS + weapon-attack). */
export const RADIAL_STANDARD_MANEUVER_IDS: readonly string[] = [
  'move',
  'dash',
  'disengage',
  'stand-up',
  'weapon-attack',
  'parry-stance',
  'dodge-stance',
  'aid',
  'interpose',
  'brace',
  'dodge',
  'parry',
  'block'
];

export function isStandardRadialManeuverId(id: string): boolean {
  return RADIAL_STANDARD_MANEUVER_IDS.includes(id);
}

export function isManeuverHiddenFromActorRadial(actor: any, maneuverId: string): boolean {
  const prefs = (actor?.system as any)?.radialManeuverPrefs;
  if (!prefs) return false;
  if (prefs.hideAllStandard === true && isStandardRadialManeuverId(maneuverId)) {
    return true;
  }
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
  { id: 'weapon-attack', name: 'Weapon Attack', group: 'Angriff' },
  { id: 'parry-stance', name: 'Parry Stance', group: 'Angriff' },
  { id: 'dodge-stance', name: 'Dodge Stance', group: 'Angriff' },
  { id: 'aid', name: 'Aid', group: 'Reaktion' },
  { id: 'interpose', name: 'Interpose', group: 'Reaktion' },
  { id: 'brace', name: 'Brace', group: 'Reaktion' },
  { id: 'dodge', name: 'Dodge', group: 'Reaktion' },
  { id: 'parry', name: 'Parry', group: 'Reaktion' },
  { id: 'block', name: 'Block', group: 'Reaktion' }
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

  const rows: RadialManeuverPrefsRow[] = RADIAL_PREFS_ROWS.map((r) => ({
    ...r,
    hideFromRadial: hideAll || !!hideIds[r.id],
    masterHideAll: hideAll
  }));

  const groupOrder = ['Bewegung', 'Angriff', 'Reaktion'];
  const byGroup = new Map<string, RadialManeuverPrefsRow[]>();
  for (const row of rows) {
    const list = byGroup.get(row.group) || [];
    list.push(row);
    byGroup.set(row.group, list);
  }
  const rowsByGroup = groupOrder
    .filter((g) => byGroup.has(g))
    .map((group) => ({ group, rows: byGroup.get(group)! }));

  return { hideAllStandard: hideAll, rows, rowsByGroup };
}
