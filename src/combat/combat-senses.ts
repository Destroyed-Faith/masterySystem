/**
 * Combat Senses — canonical registry (Players Guide Combat Senses chapter).
 *
 * Senses define what information a character may access, not automatic success.
 * Perception rolls still apply when uncertainty matters.
 */

export type CombatSenseId =
  | 'normalCombatAwareness'
  | 'darkvision'
  | 'lifeSense'
  | 'mageSense'
  | 'tremorSense'
  | 'sonarSense'
  | 'predatorSense';

export interface CombatSenseDefinition {
  id: CombatSenseId;
  label: string;
  rangeM: number;
  primaryChannels: string[];
  /** Darkvision augments Normal Combat Awareness; not a full Sense Slot pick. */
  isMinorUpgrade?: boolean;
  /** Human-readable summary for sheet tooltips. */
  summary: string;
}

export const COMBAT_SENSES: Record<CombatSenseId, CombatSenseDefinition> = {
  normalCombatAwareness: {
    id: 'normalCombatAwareness',
    label: 'Normal Combat Awareness',
    rangeM: 60,
    primaryChannels: ['sight', 'hearing', 'touch', 'smell'],
    summary: 'Default battlefield perception through ordinary senses.',
  },
  darkvision: {
    id: 'darkvision',
    label: 'Darkvision',
    rangeM: 30,
    primaryChannels: ['sight'],
    isMinorUpgrade: true,
    summary: 'Use Normal Combat Awareness through ordinary darkness within 30 m.',
  },
  lifeSense: {
    id: 'lifeSense',
    label: 'Life Sense',
    rangeM: 30,
    primaryChannels: ['supernatural-body'],
    summary: 'Perceive living creatures through vital force (not undead/constructs).',
  },
  mageSense: {
    id: 'mageSense',
    label: 'Mage Sense',
    rangeM: 30,
    primaryChannels: ['supernatural'],
    summary: 'Perceive active magic, illusions, undead force, curses, and supernatural effects.',
  },
  tremorSense: {
    id: 'tremorSense',
    label: 'Tremor Sense',
    rangeM: 20,
    primaryChannels: ['touch'],
    summary: 'Perceive vibration through a shared surface (not flying/hovering).',
  },
  sonarSense: {
    id: 'sonarSense',
    label: 'Sonar Sense',
    rangeM: 30,
    primaryChannels: ['hearing'],
    summary: 'Echolocation — movement and silhouettes through reflected sound.',
  },
  predatorSense: {
    id: 'predatorSense',
    label: 'Predator Sense',
    rangeM: 20,
    primaryChannels: ['smell', 'instinct'],
    summary: 'Blood, wounds, fear, prey-signs, and hunting trails.',
  },
};

/** Sense Slot options (special senses only — not Normal or Darkvision). */
export const SENSE_SLOT_SPECIAL_IDS: CombatSenseId[] = [
  'lifeSense',
  'mageSense',
  'tremorSense',
  'sonarSense',
  'predatorSense',
];

const SENSE_LABEL_ALIASES: Record<string, CombatSenseId> = {
  'normal combat awareness': 'normalCombatAwareness',
  darkvision: 'darkvision',
  'life sense': 'lifeSense',
  'mage sense': 'mageSense',
  'tremor sense': 'tremorSense',
  tremorsense: 'tremorSense',
  'sonar sense': 'sonarSense',
  'predator sense': 'predatorSense',
};

export function parseCombatSenseLabel(raw: string | null | undefined): CombatSenseId | null {
  const key = String(raw ?? '').trim().toLowerCase();
  if (!key) return null;
  return SENSE_LABEL_ALIASES[key] ?? null;
}

export function combatSenseDef(id: CombatSenseId): CombatSenseDefinition {
  return COMBAT_SENSES[id];
}

export function isSpecialCombatSense(id: CombatSenseId): boolean {
  return SENSE_SLOT_SPECIAL_IDS.includes(id);
}

/** Standard skill-check TN for a creature's Mastery Rank (MR × 8). */
export function skillCheckTnByMasteryRank(masteryRank: number): number {
  return Math.max(8, Math.floor(Number(masteryRank) || 1) * 8);
}
