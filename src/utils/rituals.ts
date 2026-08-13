/**
 * Ritual System — out-of-combat Skill Checks.
 *
 * Base Ritual TN = 8 × Ritual MR (target / creator / artifact / power / scene).
 * Player declares Raise Level before the roll.
 * Ritual Raise TN = Base + declared Raises × 4.
 * Fail below Base. Meet Base but miss Raise TN → Raise 0 only.
 * Meet Raise TN → declared level and all lower Raise effects.
 * Stones are Sealed on the attempt (success or failure) until Safe Haven Rest.
 * Any Stone color may pay the cost.
 */

import { resolveRaiseOutcome } from '../combat/raise-resolution.js';

export type RitualSkillCategory =
  | 'physical'
  | 'knowledge'
  | 'social'
  | 'survival'
  | 'martial';

export interface RitualDefinition {
  id: string;
  name: string;
  description: string;
  stoneCost: number;
  /** Overrides stoneCost at a declared Raise (Seal Passage Raise 4 = 3). */
  stoneCostAtDeclaredRaise?: Partial<Record<number, number>>;
  allowedSkillCategories: RitualSkillCategory[];
  /** `raises[i]` = effect at Raise i (0–4). */
  raises: string[];
  maxRaise?: number;
  castingTime: string;
  duration: string;
  requirement?: string;
  danger?: string;
  specialCostNote?: string;
  /** @deprecated Kept for old callers. */
  attribute?: string;
}

export const RITUAL_SKILLS_BY_CATEGORY: Record<RitualSkillCategory, readonly string[]> = {
  physical: ['Athletics', 'Acrobatics', 'Stealth', 'Concealment', 'Ride', 'Sleight of Hand'],
  knowledge: [
    'Lore',
    'Alchemy',
    'Crafting',
    'Artisanry',
    'Engineering',
    'Medicine',
    'Navigation',
    'Occultism',
    'Investigation',
  ],
  social: [
    'Persuasion',
    'Deception',
    'Intimidation',
    'Leadership',
    'Performance',
    'Streetwise',
    'Empathy',
    'Negotiation',
    'Seduction',
    'Etiquette',
  ],
  survival: ['Survival', 'Animal Handling', 'Tracking', 'Herbalism', 'Weather Sense'],
  martial: ['Hand-to-Hand', 'Melee Weapons', 'Ranged Weapons', 'Defensive Combat', 'Combat Reflexes'],
};

export function calculateRitualTN(ritualMR: number, modifier = 0): number {
  const mr = Math.max(1, Math.floor(Number(ritualMR) || 1));
  const mod = Math.floor(Number(modifier) || 0);
  return 8 * mr + mod;
}

export function calculateRitualRaiseTN(baseTn: number, declaredRaises: number): number {
  const base = Math.max(0, Math.floor(Number(baseTn) || 0));
  const declared = Math.max(0, Math.floor(Number(declaredRaises) || 0));
  return base + declared * 4;
}

export function ritualStoneCost(ritual: RitualDefinition, declaredRaises: number): number {
  const declared = Math.max(0, Math.floor(Number(declaredRaises) || 0));
  const override = ritual.stoneCostAtDeclaredRaise?.[declared];
  if (Number.isFinite(Number(override))) return Math.max(1, Math.floor(Number(override)));
  return Math.max(1, Math.floor(Number(ritual.stoneCost) || 1));
}

export function ritualMaxRaise(ritual: RitualDefinition): number {
  const listed = Math.max(0, (ritual.raises?.length ?? 1) - 1);
  const cap = Math.max(0, Math.floor(Number(ritual.maxRaise ?? 4) || 4));
  return Math.min(listed, cap);
}

export type RitualDeclaredOutcome = {
  success: boolean;
  appliedRaise: number;
  kind: 'fail' | 'raise0' | 'full';
};

/** Declared-raise resolution: fail / Raise 0 only / full declared level. */
export function resolveRitualDeclaredOutcome(opts: {
  rollTotal: number;
  baseTn: number;
  declaredRaises: number;
}): RitualDeclaredOutcome {
  const declared = Math.max(0, Math.floor(Number(opts.declaredRaises) || 0));
  const outcome = resolveRaiseOutcome(opts.rollTotal, opts.baseTn, declared);
  if (outcome === 'fail') return { success: false, appliedRaise: 0, kind: 'fail' };
  if (outcome === 'partial') return { success: true, appliedRaise: 0, kind: 'raise0' };
  return { success: true, appliedRaise: declared, kind: 'full' };
}

export function appliedRitualEffects(ritual: RitualDefinition, appliedRaise: number): string[] {
  const cap = Math.min(Math.max(0, Math.floor(appliedRaise)), ritualMaxRaise(ritual));
  return (ritual.raises || []).slice(0, cap + 1);
}

export function eligibleSkillsForRitual(ritual: RitualDefinition): string[] {
  const out = new Set<string>();
  for (const cat of ritual.allowedSkillCategories) {
    for (const s of RITUAL_SKILLS_BY_CATEGORY[cat]) out.add(s);
  }
  return Array.from(out);
}

export const RITUALS: RitualDefinition[] = [
  {
    id: 'ritual-detect-magic',
    name: 'Detect Magic',
    description:
      'You attune your senses to the lingering pulse of the unseen. The world bleeds color where power flows.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Concentration, up to 10 minutes',
    requirement: 'The caster must focus eyes or hands upon the area or object.',
    danger: 'Extended exposure may attract entities that notice you noticing them.',
    raises: [
      'Faint auras of active or latent magic within 10 m. You learn the basic category (divine, arcane, natural, infernal, necrotic, warded, or unknown).',
      'Strength and structure of each aura: traps, wards, enchantments, or active effects at the surface layer.',
      'Emotional tone or purpose: protection, control, hunger, sorrow, warning, or concealment.',
      'Trace one aura back to its source, focus, caster, or anchor within 100 m, if present and not fully hidden.',
      'Pierce common veils, masks, and illusions. Hidden or masked magic is revealed unless a stronger ward or story protection hides it.',
    ],
    attribute: 'intellect',
  },
  {
    id: 'ritual-locate-object',
    name: 'Locate Object',
    description: 'You close your eyes and trace a pattern in the air. A pull forms toward what you seek.',
    stoneCost: 1,
    allowedSkillCategories: ['survival', 'knowledge'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Concentration, up to 10 minutes',
    requirement: 'You must have seen or touched the object, or know its precise form.',
    danger: 'Powerful, cursed, intelligent, or demonic items may notice your search.',
    raises: [
      'Direction of one described object within 60 m, unless a major ward, consecrated barrier, sealed vault, or anti-magic obstruction blocks the link.',
      'Range 300 m. Distinguish similar items and sense which best matches your mental image.',
      'Short sensory flashes from the object’s immediate environment (smell, texture, temperature, pressure, nearby sound).',
      'Reach through thin barriers, shallow ground, or up to 2 m of stone. Range 1 km.',
      'One brief memory tied to the object (last touch, last rest, clinging emotion). Range 5 km unless a stronger ward blocks the link.',
    ],
    attribute: 'wits',
  },
  {
    id: 'ritual-augury',
    name: 'Augury',
    description:
      'You cast marked stones, whisper prayers, read ash, spill ink, or let blood fall upon sacred ground, asking the world for an omen.',
    stoneCost: 1,
    allowedSkillCategories: ['survival', 'knowledge', 'social'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Instant',
    requirement: 'A symbolic medium: bones, ink, blood, sand, runes, cards, water, or ashes.',
    danger: 'Each additional Augury on the same topic before the next Safe Haven Rest should usually increase the TN by +4.',
    raises: [
      'Vague omen about one course of action in the next few hours: Weal, Woe, Both, or Nothing.',
      'Clearer omen. One short sensory sign (sound, scent, color, taste, pressure, or temperature).',
      'Which aspect of the plan carries the strongest weight (violence, deceit, faith, chance, hunger, delay, loss, or betrayal).',
      'One brief follow-up question. The answer arrives as an image, symbol, emotional pressure, or fragment of remembered words.',
      'One symbolic fragment of a possible future related to the question — not guaranteed, but a pressure already moving toward the situation.',
    ],
    attribute: 'wits',
  },
  {
    id: 'ritual-clairvoyance',
    name: 'Clairvoyance',
    description: 'You open a window through distance, letting your mind wander where your body cannot.',
    stoneCost: 2,
    allowedSkillCategories: ['knowledge'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Concentration, up to 10 minutes',
    requirement: 'You must name a place you know or a creature familiar to you.',
    danger: 'The farther your awareness reaches, the more likely something notices the thread you left behind.',
    raises: [
      'Project senses to a known location or familiar creature within 1 km. Sight is hazy and colorless.',
      'Vision becomes clearer and gains sound. Faint conversations, movement, and nearby noise.',
      'Shift the viewpoint up to 20 m, or follow the creature slowly at half walking speed.',
      'Vivid detail. Focus on small objects, writings, symbols, faces, or gestures.',
      'Scry across any distance on the same plane. With a strong sympathetic link and GM approval, a planar glimpse. After ending, the body is briefly senseless.',
    ],
    attribute: 'intellect',
  },
  {
    id: 'ritual-threshold-alarm',
    name: 'Threshold Alarm',
    description: 'You mark a threshold, camp edge, door, window, or boundary so that the place remembers being crossed.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge', 'survival', 'social'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Until the next Safe Haven Rest or 24 hours, whichever comes first',
    requirement: 'You must mark or touch the threshold, boundary, or protected entry point.',
    specialCostNote:
      'Not a defensive ward. Does not create Armor, Evade, Temporary HP, concealment, a Safe Haven, or a barrier.',
    raises: [
      'Ward one doorway, window, tunnel mouth, room boundary, or camp edge. When a creature crosses, one named wardkeeper within 1 km receives a clear alarm. Does not block, harm, slow, or reveal the creature.',
      'Name up to Mastery Rank creatures who do not trigger the alarm.',
      'Cover a small house, campsite, chamber, or connected room cluster. The wardkeeper senses the direction of the breach.',
      'Approximate number and size of creatures crossing. Mundane stealth does not prevent the alarm.',
      'May wake all named allies inside the warded area. Cannot be silenced or bypassed without overcoming the Ritual TN or a specific countermeasure.',
    ],
    attribute: 'resolve',
  },
  {
    id: 'ritual-seal-passage',
    name: 'Seal Passage',
    description: 'You press power into a door, gate, hatch, tunnel, archway, or ancient seam, telling the world that this way is closed.',
    stoneCost: 2,
    stoneCostAtDeclaredRaise: { 4: 3 },
    allowedSkillCategories: ['knowledge'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Until broken, opened, dismissed, or overcome',
    requirement: 'You must touch the passage, seal, door, gate, hatch, or boundary being affected.',
    specialCostNote: 'Raise 4 (open an existing sealed or forgotten passage) costs 3 Stones. Cannot create a new exit.',
    raises: [
      'Seal or unseal one accessible mundane passage (door, gate, hatch, window, tunnel mouth, or stone seam). A sealed passage closes and locks without a key.',
      'Cannot be opened by mundane keys, latches, or ordinary handling. Must be forced, ritually opened, dismissed, or overcome against the Ritual TN.',
      'Twice as physically durable. If the object has Health, Structure, or similar, double that value for breaking through.',
      'As hard as solid granite for forcing, breaking, burning, cutting, or smashing.',
      'Open an existing sealed, hidden, or forgotten passage if it truly exists. Costs 3 Stones. Cannot create a new tunnel, doorway, road, or exit.',
    ],
    attribute: 'intellect',
  },
  {
    id: 'ritual-purify-ground',
    name: 'Purify Ground',
    description: 'You cleanse a place where something wrong has soaked into the world.',
    stoneCost: 2,
    allowedSkillCategories: ['knowledge', 'survival', 'social'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Instant',
    requirement: 'You must remain within the area being purified for the full Ritual.',
    specialCostNote:
      'Does not create a Safe Haven. Does not hide evidence, remove mundane blood, erase tracks, restore destroyed structures, or undo ordinary consequences.',
    raises: [
      'Purify a small area (room, grave, altar, blood circle, ritual mark, corpse pile, shrine, or battlefield focus) from surface necrotic, demonic, infernal, or corrupt ritual residue.',
      'Before the residue fades, learn its broad type and emotional pressure (hunger, fear, command, grief, sacrifice, binding, or desecration).',
      'Suppress one minor ongoing scene effect (whispers, corpse-stirring, nightmare pressure, ritual sickness, or spiritual contamination).',
      'Purify a larger connected site (crypt chamber, ruined shrine, small battlefield, ritual cellar, desecrated house, or corrupted grove).',
      'Break one active residue-anchor, lingering desecration, corpse-binding, or demonic trace if the Ritual MR is high enough. The GM may require a focus, name, remains, or symbol.',
    ],
    attribute: 'resolve',
  },
  {
    id: 'ritual-learn-artifact',
    name: 'Learn Artifact',
    description: 'You study a relic until its surface stops being an object and starts becoming a history.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Instant',
    requirement: 'You must hold, touch, examine, or remain close to the Artifact or relic for the full Ritual.',
    specialCostNote:
      'Does not force an intelligent Artifact, divine relic, or demonic object to reveal every secret. Powerful relics may reveal only the layers the Ritual reaches.',
    raises: [
      'Visible category, basic function, occupied Slot, binding status, and whether it is mundane, magical, Echo-bound, cursed, awakened, dormant, or unknown.',
      'Origin style, creator tradition, previous owner trace, emotional residue, or broad purpose.',
      'One hidden restriction, cost, dormant function, binding rule, warning sign, or danger of using or bonding with it.',
      'An awakening condition, command phrase, pact mark, curse logic, hidden limitation, or why it rejects or accepts a bearer.',
      'One deeper truth: true creator, true purpose, concealed taint, secret command, hidden price, or a protected memory it is willing or forced to reveal.',
    ],
    attribute: 'intellect',
  },
  {
    id: 'ritual-forgotten-memory',
    name: 'Forgotten Memory',
    description: 'You touch a place or object and listen for the feelings it could not let go.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge', 'social'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Concentration, up to 10 minutes',
    requirement: 'You must touch the object, location, wall, floor, weapon, relic, or remains being read.',
    danger: 'If the memory is violent, demonic, death-bound, or horrific, Raise 4 may deal Stress equal to the Ritual MR.',
    specialCostNote: 'Reads emotional residue, not objective recordings. A memory may be incomplete, symbolic, distorted, or protected.',
    raises: [
      'Strongest emotional residue (fear, grief, hunger, relief, rage, devotion, betrayal, or hope).',
      'One sensory fragment: sound, smell, touch, color, pressure, taste, or a single image.',
      'A brief sequence of events around the memory — emotional and symbolic, but it shows what kind of event created the residue.',
      'One important person, symbol, object, phrase, direction, or relationship connected to the memory.',
      'Step into the memory for a brief moment and experience it from within. Hostile memories may deal Stress equal to the Ritual MR.',
    ],
    attribute: 'influence',
  },
  {
    id: 'ritual-word-of-recall',
    name: 'Word of Recall',
    description: 'You etch a hidden mark of return upon a sanctuary, a promise that you will one day come home.',
    stoneCost: 2,
    allowedSkillCategories: ['survival', 'knowledge', 'social'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Permanent until used or dismissed',
    requirement: 'The place must be meaningful to you and prepared through prayer, blood, sacrifice, craft, memory, or witness.',
    specialCostNote:
      'Stones remain Sealed while the mark exists. They return only after the mark is used, dismissed, broken, or removed, then a Safe Haven Rest. Activating the mark takes at least 1 minute of focus outside combat.',
    raises: [
      'Bind a spiritual mark to the location. Later you may return to that exact point. The mark fades when used.',
      'Bring one willing ally within 2 m of you when the recall is activated.',
      'Gentler recall. Willing allies arrive standing, stable, and with fragile gear intact unless the destination itself is dangerous.',
      'Pass through minor wards, interference, or sanctum pressure unless a stronger effect blocks planar or spatial travel.',
      'Lasting bond. May be used once per week without fading, but the Stones remain Sealed while the bond exists.',
    ],
    attribute: 'resolve',
  },
  {
    id: 'ritual-greater-restoration',
    name: 'Greater Restoration',
    description: 'Your touch calls forth deep harmony that mends what ordinary care cannot reach.',
    stoneCost: 2,
    allowedSkillCategories: ['knowledge', 'survival', 'social'],
    castingTime: '10 minutes to 1 hour',
    duration: 'Instant',
    requirement: 'Continuous contact with the target. Cannot be cast on yourself.',
    specialCostNote:
      'Does not restore HP, lost Health Levels, or Scarred Health Bars. Does not replace First Aid after combat.',
    raises: [
      'Remove or suppress one major long-term affliction with GM approval (curse, petrification, supernatural blindness, long-term paralysis, exhaustion, or a spiritual lock).',
      'Remove one additional lesser long-term affliction from the same target, or reduce the pressure of the main affliction if it cannot be fully removed yet.',
      'Affect one additional willing creature within 2 m if the same affliction or source applies to both.',
      'Reach a spiritual or memory-bound affliction (dream-curse, lingering possession pressure, memory lock, or old magical binding).',
      'Weaken, break, or reveal the key to an ancient, divine, demonic, or god-born affliction if the Ritual MR and story conditions are sufficient.',
    ],
    attribute: 'resolve',
  },
  {
    id: 'ritual-commune',
    name: 'Commune',
    description:
      'Your mind reaches toward higher planes, calling out to gods, spirits, ancestors, dead powers, or forgotten entities.',
    stoneCost: 2,
    allowedSkillCategories: ['social', 'knowledge'],
    castingTime: '10 minutes',
    duration: '10 minutes',
    requirement: 'A sacred space, relic, symbol, name, offering, or meaningful connection to the entity you wish to contact.',
    specialCostNote: 'Does not force truth from a hostile, broken, sleeping, dead, or deceptive entity. Silence is a valid answer.',
    raises: [
      'Ask up to 3 questions. Each may be answered Yes, No, Unclear, silence, or a symbolic impression.',
      'Sense a presence, absence, refusal, hunger, grief, or attention behind the answer. Ask 1 additional question.',
      'Communication deepens. Answers may arrive as emotional pressure, layered voices, remembered prayer, old fear, or symbolic contradiction.',
      'A vision: a fragment of the entity’s memory, domain, prison, wound, desire, or warning.',
      'Momentary communion. Learn one clear truth about what it wants, fears, cannot do, or what price it demands.',
    ],
    attribute: 'influence',
  },
  {
    id: 'ritual-dreamwalk',
    name: 'Dreamwalk',
    description: 'You step through the mirror of sleep, drifting into another’s dreams to seek truth, warning, or solace.',
    stoneCost: 2,
    allowedSkillCategories: ['social', 'knowledge'],
    castingTime: 'Usually 1 hour in the waking world',
    duration: 'Up to 10 minutes in the dream',
    requirement: 'The target must be asleep and willing, or their soul must be unguarded with GM approval.',
    danger: 'If the dream is hostile, demonic, cursed, or traumatic, Raise 4 may deal Stress equal to the Ritual MR.',
    specialCostNote: 'Cannot rewrite a mind, cure trauma by itself, or force a protected target to reveal secrets.',
    raises: [
      'Enter the dreamscape. Perceive symbolic visions of fears, memories, desires, or current emotion. Speak as a guiding voice.',
      'Interact with dream elements, reshape minor symbols, calm a nightmare scene, or create a safe image for conversation.',
      'Communicate with the dreamer’s subconscious. A simple message, warning, apology, or promise may persist after waking.',
      'Glimpse buried memories or truths the target hides even from themselves — emotional and symbolic, not guaranteed records.',
      'Full immersion. The dreamer may see you clearly. Hostile dreams may deal Stress equal to the Ritual MR.',
    ],
    attribute: 'influence',
  },
  {
    id: 'ritual-last-light',
    name: 'Last Light',
    description: 'You kindle a flame for the fallen, guiding what remains beyond the veil so it may rest.',
    stoneCost: 1,
    allowedSkillCategories: ['social', 'knowledge'],
    castingTime: '30 minutes',
    duration: '30 minutes',
    requirement: 'Performed within sight of the body, grave, ashes, relic, or death-place. Needs a candle, ash, name, or token of the deceased.',
    specialCostNote:
      'Not resurrection. Cannot call the dead back to life, destroy active undead by itself, or create a Safe Haven.',
    raises: [
      'Sever lingering ties, helping the soul pass peacefully and preventing ordinary undeath or spiritual corruption from taking hold.',
      'The immediate burial area is purified from minor necrotic residue, corpse-stirring, grave whispers, or restless spiritual pressure.',
      'Carry one short message from the living to the dead (farewell, forgiveness, warning, or love).',
      'If willing or able, the spirit may manifest briefly with one phrase, image, emotion, or final impression.',
      'The grave, body, or death-place becomes hallowed against future desecration or necromantic use unless overcome by a stronger effect.',
    ],
    attribute: 'resolve',
  },
];

export function getRitualByName(name: string): RitualDefinition | undefined {
  const lower = name.trim().toLowerCase();
  return RITUALS.find((r) => r.name.toLowerCase() === lower);
}

export function getRitualById(id: string): RitualDefinition | undefined {
  return RITUALS.find((r) => r.id === id);
}
