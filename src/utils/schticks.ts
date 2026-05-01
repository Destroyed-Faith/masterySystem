/**
 * Schticks configuration for Mastery System.
 *
 * Players Guide ~3134+: Schticks are **purely cosmetic** character traits
 * — colour, quirks, narrative hooks. The base game grants `+1` Schtick per
 * Mastery Rank, and an *optional* extra Schtick may be purchased for 2
 * Mastery Points during character creation. They never grant mechanical
 * dice/HP/save bonuses, so the catalog must read as pure roleplay flavour.
 */

export interface SchtickDefinition {
  id: string;
  name: string;
  short: string;
  tags?: string[];
  relatedAttribute?: string;
}

export const SCHTICKS: SchtickDefinition[] = [
  {
    id: 'quick-reflexes',
    name: 'Quick Reflexes',
    short:
      'You move with practiced economy — flicking a knife back into its sheath, stepping through a doorway just as someone reaches for it. Pure flavour: react fast in narration, no mechanical bonus.',
    relatedAttribute: 'Agility'
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    short:
      'Setbacks roll off you. You frame your stoicism in private rituals or trained breathing. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Resolve'
  },
  {
    id: 'keen-eye',
    name: 'Keen Eye',
    short:
      'Wherever you go, you mention details others overlook — a chipped paint, a missing pendant, a freshly oiled lock. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Wits'
  },
  {
    id: 'natural-leader',
    name: 'Natural Leader',
    short:
      'You speak with calm authority and people defer to you in tight spots. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Influence'
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    short:
      'You always carry a slim journal or chapbook and quote it at odd moments. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Intellect'
  },
  {
    id: 'tough-as-nails',
    name: 'Tough as Nails',
    short:
      'You shrug off bruises and cracked ribs in the moment, sometimes underplaying serious wounds. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Vitality'
  },
  {
    id: 'brawler',
    name: 'Brawler',
    short:
      'You set your stance early in any room — boots planted, chin tucked, ready for a fight. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Might'
  },
  {
    id: 'lucky',
    name: 'Lucky',
    short:
      'You collect stories of close calls — a coin flipped at the right moment, a stranger who paid your tab. Pure flavour, no mechanical bonus.',
    tags: ['utility']
  },
  {
    id: 'fast-healer',
    name: 'Fast Healer',
    short:
      'Cuts close up quickly on you, even ones the medic was worried about. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Vitality'
  },
  {
    id: 'silver-tongue',
    name: 'Silver Tongue',
    short:
      'Words come easily to you, especially with strangers in low light. Pure flavour, no mechanical bonus.',
    relatedAttribute: 'Influence'
  }
];

/**
 * Get all schticks
 */
export function getAllSchticks(): SchtickDefinition[] {
  return SCHTICKS;
}

/**
 * Get schtick by ID
 */
export function getSchtick(id: string): SchtickDefinition | undefined {
  return SCHTICKS.find(s => s.id === id);
}

/**
 * Get schticks by attribute affinity
 */
export function getSchticksByAttribute(attribute: string): SchtickDefinition[] {
  return SCHTICKS.filter(s => s.relatedAttribute === attribute);
}

