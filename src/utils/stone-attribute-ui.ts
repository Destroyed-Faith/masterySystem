/**
 * UI colors for attribute stone gems / pools (Player-facing names in German notes).
 * Game keys: might, agility, vitality, intellect, resolve, influence; optional separate `wits` pool on the sheet.
 */

export type StonePoolAttributeKey =
  | 'might'
  | 'agility'
  | 'vitality'
  | 'intellect'
  | 'resolve'
  | 'influence'
  | 'wits';

export interface StoneAttributeGemStyle {
  /** Main gem / fill color */
  fill: string;
  /** Rim / highlight stroke */
  stroke: string;
}

/**
 * Farben laut Spielleitung:
 * Might schwarz, Agility grün, Vitality rot, Intelligence blau, Resolve lila,
 * Intellect orange, Wits gelb.
 * Im System: ein Pool `intellect` → Füllung orange, Rand blau.
 * `influence` → Wits gelb.
 * Separater Pool `wits` (falls am Bogen vorhanden): helleres Gelb.
 */
export const STONE_ATTRIBUTE_GEM_STYLES: Record<StonePoolAttributeKey, StoneAttributeGemStyle> = {
  might: { fill: '#0d0d0d', stroke: '#757575' },
  agility: { fill: '#1b5e20', stroke: '#66bb6a' },
  vitality: { fill: '#b71c1c', stroke: '#ef5350' },
  intellect: { fill: '#e65100', stroke: '#1565c0' },
  resolve: { fill: '#4a148c', stroke: '#ba68c8' },
  influence: { fill: '#f9a825', stroke: '#f57f17' },
  wits: { fill: '#ffee58', stroke: '#fbc02d' }
};

export function getStoneGemStyle(key: string): StoneAttributeGemStyle | undefined {
  return STONE_ATTRIBUTE_GEM_STYLES[key as StonePoolAttributeKey];
}
