/**
 * Disadvantages System for Mastery System
 * Defines all available disadvantages that characters can take during creation
 */

export interface DisadvantageField {
  name: string;
  type: 'text' | 'number' | 'select';
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  min?: number;
  max?: number;
}

export interface DisadvantageDefinition {
  id: string;
  name: string;
  basePoints: number | number[]; // Single value or array for variable points (e.g., [1, 2, 3])
  description: string;
  fields?: DisadvantageField[];
  effect?: string;
}

/**
 * All available Disadvantages
 */
export const DISADVANTAGES: DisadvantageDefinition[] = [
  {
    id: 'addiction',
    name: 'Addiction',
    basePoints: 2,
    description: 'You are addicted to a substance or ritual. After 1 day without it, you suffer penalties. After 1 week, the penalties worsen. After 1 month, you gain Stress(3) and Disoriented(2) if pushed.',
    fields: [
      {
        name: 'substance',
        type: 'text',
        label: 'Substance/Ritual',
        placeholder: 'e.g., Alcohol, Ritual Prayer, etc.',
        required: true
      }
    ],
    effect: 'Penalties after 1 day/1 week/1 month; Stress(3) + Disoriented(2) if pushed.'
  },
  {
    id: 'berserkers-curse',
    name: "Berserker's Curse",
    basePoints: 2,
    description: 'When your Wounds reach or exceed your Vitality, you must make a Resolve k1 check vs TN 8 or enter a Berserk state for 1d8/2 rounds. While berserk, you gain +1k1 damage but must attack the nearest target. Each round, make a Resolve check to end the berserk state.',
    effect: 'Trigger: Wounds ≥ Vitality => Resolve k1 TN8 or Berserk for 1d8/2 rounds; +1k1 damage; must attack nearest; resolve check each round to end.'
  },
  {
    id: 'hunted',
    name: 'Hunted',
    basePoints: [1, 2, 3],
    description: 'Someone or something is hunting you. The GM can introduce chases, ambushes, or other threats related to your hunter.',
    fields: [
      {
        name: 'rank',
        type: 'number',
        label: 'Threat Rank',
        min: 1,
        max: 3,
        required: true
      },
      {
        name: 'hunter',
        type: 'text',
        label: 'Who hunts you?',
        placeholder: 'e.g., The Inquisition, A rival clan, etc.',
        required: true
      }
    ],
    effect: 'Threat table; DM can insert chases etc.'
  },
  {
    id: 'physical-scars',
    name: 'Physical Scars',
    basePoints: [1, 2, 3],
    description: 'You bear physical scars that impose mechanical penalties. Choose one or more from the table below.',
    fields: [
      {
        name: 'scar',
        type: 'select',
        label: 'Scar Type',
        options: [
          { value: 'one-eyed', label: 'One-Eyed (1 point) -1k0 to ranged attacks/perception' },
          { value: 'one-handed', label: 'One-Handed (2 points) - Cannot dual wield or shield+sword' },
          { value: 'heavy-sleeper', label: 'Heavy Sleeper (1 point) - Cannot wake unless damaged or shaken' },
          { value: 'fragile-frame', label: 'Fragile Frame (3 points) - Health track one fewer box on every level' }
        ],
        required: true
      }
    ],
    effect: 'One-Eyed(1): -1k0 to ranged attacks/perception. One-Handed(2): cannot dual wield or shield+sword. Heavy Sleeper(1): cannot wake unless damaged or shaken. Fragile Frame(3): health track one fewer box on every level.'
  },
  {
    id: 'mental-restrictions',
    name: 'Mental Restrictions',
    basePoints: 2,
    description: 'You have a mental restriction: an Oath, Fear, or Personality trait. To act against it, you must make a Resolve k1 check vs TN 6 (Oath), TN 8 (Fear), or TN 16 (Personality).',
    fields: [
      {
        name: 'type',
        type: 'select',
        label: 'Restriction Type',
        options: [
          { value: 'oath', label: 'Oath (TN 6)' },
          { value: 'fear', label: 'Fear (TN 8)' },
          { value: 'personality', label: 'Personality Trait (TN 16)' }
        ],
        required: true
      },
      {
        name: 'restriction',
        type: 'text',
        label: 'Restriction Description',
        placeholder: 'e.g., "Never harm an innocent", "Fear of heights", "Always helps the weak"',
        required: true
      }
    ],
    effect: 'Oaths/Fears/Personality traits; act against it = Resolve k1 vs TN 6/8/16'
  },
  {
    id: 'unluck',
    name: 'Unluck',
    basePoints: [1, 2, 3],
    description: 'You are cursed with misfortune. Each session, you gain misfortune tokens based on your rank.',
    fields: [
      {
        name: 'rank',
        type: 'number',
        label: 'Unluck Rank',
        min: 1,
        max: 3,
        required: true
      }
    ],
    effect: 'Misfortune tokens per session: (1) 1d8/2, (2) 1d8, (3) 2d8'
  },
  {
    id: 'vulnerability',
    name: 'Vulnerability',
    basePoints: 3,
    description: 'You take double damage from a specific damage type or special ability.',
    fields: [
      {
        name: 'vulnerability',
        type: 'text',
        label: 'Vulnerability Type',
        placeholder: 'e.g., Fire, Cold, Lightning, Poison, etc.',
        required: true
      }
    ],
    effect: 'Double damage from chosen special/damage type'
  }
];

/**
 * Get disadvantage definition by ID
 */
export function getDisadvantageDefinition(id: string): DisadvantageDefinition | undefined {
  return DISADVANTAGES.find(d => d.id === id);
}

/**
 * Get all disadvantage definitions
 */
export function getDisadvantageDefinitions(): DisadvantageDefinition[] {
  return DISADVANTAGES;
}

/**
 * Calculate points for a disadvantage selection
 */
export function calculateDisadvantagePoints(
  disadvantageId: string,
  details: Record<string, any>
): number {
  const def = getDisadvantageDefinition(disadvantageId);
  if (!def) return 0;

  if (Array.isArray(def.basePoints)) {
    // Variable points - use the rank/value from details
    if (disadvantageId === 'hunted' || disadvantageId === 'unluck') {
      const rank = details.rank || 1;
      return def.basePoints[rank - 1] || def.basePoints[0];
    }
    if (disadvantageId === 'physical-scars') {
      const scar = details.scar;
      const scarPoints: Record<string, number> = {
        'one-eyed': 1,
        'one-handed': 2,
        'heavy-sleeper': 1,
        'fragile-frame': 3
      };
      return scarPoints[scar] || 1;
    }
    return def.basePoints[0];
  }

  return def.basePoints;
}

/**
 * Validate disadvantage selection
 */
export function validateDisadvantageSelection(
  selections: Array<{ id: string; details: Record<string, any> }>
): { valid: boolean; totalPoints: number; error?: string } {
  let totalPoints = 0;

  for (const selection of selections) {
    const points = calculateDisadvantagePoints(selection.id, selection.details);
    totalPoints += points;
  }

  if (totalPoints > 8) {
    return {
      valid: false,
      totalPoints,
      error: `Total disadvantage points (${totalPoints}) exceeds maximum of 8.`
    };
  }

  return { valid: true, totalPoints };
}

