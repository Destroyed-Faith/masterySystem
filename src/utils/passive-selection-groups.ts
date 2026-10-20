/**
 * Passive Selection Groups — UI browsing metadata only.
 * Not mechanical categories; slot exclusivity still uses
 * `tower-wizard-passive-categories.ts`.
 */

export type PassiveSelectionGroupId = 'offensive' | 'defensive' | 'utility';

export const PASSIVE_SELECTION_GROUP_ORDER: readonly PassiveSelectionGroupId[] = [
  'offensive',
  'defensive',
  'utility',
] as const;

export const PASSIVE_SELECTION_GROUP_LABELS: Readonly<Record<PassiveSelectionGroupId, string>> = {
  offensive: 'Offensive',
  defensive: 'Defensive',
  utility: 'Utility & Mobility',
};

/**
 * Canonical Expanded Playtest catalogue (28 Passives).
 * Order within each group matches the approved overview.
 */
export const PASSIVE_SELECTION_GROUPS: Readonly<
  Record<PassiveSelectionGroupId, readonly string[]>
> = {
  offensive: [
    'passive-killing-intent', // Damage
    'passive-armor-reduction',
    'passive-critical',
    'passive-maximization',
    'passive-special-aura',
    'passive-enemy-evade-reduction',
    'passive-spell-resistance-piercing',
    'passive-special-amplification',
  ],
  defensive: [
    'passive-fortified-frame', // Armor
    'passive-evade',
    'passive-damage-reduction',
    'passive-deep-vitality', // Health
    'passive-fortitude',
    'passive-regeneration', // Restoration (R-05 identity preserved)
    'passive-ghostform', // Phasing
    'passive-spell-resistance',
    'passive-ward', // Special Negation
    'passive-invisibility',
    'passive-parry',
    'passive-thornhide', // Thorns
    'passive-damage-negation',
    'passive-temp-hp',
    'passive-self-cleanse',
  ],
  utility: [
    'passive-telepathy-mind-link',
    'passive-initiative',
    'passive-bound-host', // Summon Tokens
    'passive-absorption',
    'passive-speed',
  ],
};

/** Flat set of the 28 catalogue templateIds. */
export const CANONICAL_PASSIVE_TEMPLATE_IDS: ReadonlySet<string> = new Set(
  PASSIVE_SELECTION_GROUP_ORDER.flatMap((g) => PASSIVE_SELECTION_GROUPS[g]),
);

export function passiveSelectionGroupFor(templateId: string): PassiveSelectionGroupId | null {
  const id = String(templateId || '').toLowerCase();
  for (const group of PASSIVE_SELECTION_GROUP_ORDER) {
    if (PASSIVE_SELECTION_GROUPS[group].includes(id)) return group;
  }
  return null;
}

export function isCanonicalPassiveTemplateId(templateId: string): boolean {
  return CANONICAL_PASSIVE_TEMPLATE_IDS.has(String(templateId || '').toLowerCase());
}
