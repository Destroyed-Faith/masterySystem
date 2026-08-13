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
  limits?: string;
  specialCostNote?: string;
  /** @deprecated Kept for old callers. */
  attribute?: string;
}

export const RITUAL_CATEGORY_LABELS: Record<RitualSkillCategory, string> = {
  physical: 'Physical',
  knowledge: 'Knowledge & Craft',
  social: 'Social',
  survival: 'Survival',
  martial: 'Martial',
};

/** Raise 0-1 = 1 Stone, Raise 2-3 = 2, Raise 4 = 3. */
export const RITUAL_STONE_COST_BY_RAISE = [1, 1, 2, 2, 3] as const;

export function ritualCategoryLabels(ritual: RitualDefinition): string {
  return ritual.allowedSkillCategories.map((c) => RITUAL_CATEGORY_LABELS[c] ?? c).join(', ');
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
  const declared = Math.max(0, Math.min(4, Math.floor(Number(declaredRaises) || 0)));
  const override = ritual.stoneCostAtDeclaredRaise?.[declared];
  if (Number.isFinite(Number(override))) return Math.max(1, Math.floor(Number(override)));
  return RITUAL_STONE_COST_BY_RAISE[declared] ?? 1;
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
    id: 'ritual-read-resonance',
    name: 'Read Resonance',
    description:
      'You quiet your senses and listen for the pressure left behind when power touched the world.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge', 'survival'],
    castingTime: '1 Tyhran Hour',
    duration: 'Concentration, up to 1 Forearm',
    requirement:
      'The caster must focus on an area, object, threshold, corpse, mark, relic, symbol, wound, seal, or visible phenomenon.',
    danger:
      'Strong Resonance can answer back. Demonic marks, divine ruins, intelligent Artifacts, death-bound places, and old Seals may notice when someone listens too closely.',
    limits:
      'Does not detect ordinary hidden creatures, mundane traps, mundane locks, normal tracks, or ordinary lies. Does not identify exact Powers, Stone Powers, Stone colors, character builds, Power names, or mechanical values. Does not replace Learn Artifact. A failed or low-Raise result does not prove that no Resonance exists.',
    raises: [
      'You learn whether readable Resonance is present within 10 meters. If Resonance is present, you learn its broad type: Ritual, Artifact, Ward, Seal, Demonic, Divine, Necrotic, Cursed, Spiritual, Planar, or Unknown.',
      'You learn the Resonance’s rough strength and state: faint, strong, active, dormant, fresh, old, fading, unstable, concealed, or corrupted. You can tell whether a Ritual was worked here, an Artifact was active here, a Ward or Seal is present, or a demonic or divine influence touched the area.',
      'You read the Resonance pattern. You learn what kind of thing the Resonance clings to: a place, object, body, threshold, mark, wound, altar, doorway, weapon, blood, name, or spiritual anchor. You may also learn whether the Resonance was created by protection, binding, hunger, command, sacrifice, death, memory, travel, concealment, or corruption.',
      'You may trace one Resonance to its nearest source, anchor, exit point, or strongest remaining direction within 100 meters, if such a trace still exists. This can reveal that a powerful Artifact was carried away, a Ritual was worked from a specific point, a Seal is anchored elsewhere, or a demonic influence entered through a specific mark or threshold.',
      'You pierce common masking, false traces, and concealment. You learn the true dominant Resonance beneath the surface layer, unless it is protected by a stronger story-level ward, Artifact will, divine concealment, demonic deception, or specific GM protection.',
    ],
  },
  {
    id: 'ritual-locate-object',
    name: 'Locate Object',
    description:
      'You close your eyes and trace a pattern in the air. A pull forms within your mind, guiding you toward what you seek.',
    stoneCost: 1,
    allowedSkillCategories: ['survival', 'knowledge'],
    castingTime: '1 Tyhran Hour',
    duration: 'Concentration, up to 1 Forearm',
    requirement: 'You must have seen or touched the object, or know its precise form.',
    danger: 'Powerful, cursed, intelligent, or demonic items may notice your search.',
    limits:
      'Finds a specific object or a clearly defined object type. Does not replace Tracking, Investigation, Navigation, or ordinary searching when those methods are sufficient. Does not find people unless they are carrying the specific object being located. Does not identify what an Artifact does. Use Learn Artifact for that.',
    raises: [
      'You sense the direction of one specific object you describe within 60 meters, provided no major ward, consecrated barrier, sealed vault, or Resonance-blocking obstruction blocks the link.',
      'The range expands to 300 meters. You can distinguish between multiple similar items and sense which one best matches your mental image.',
      'You receive short sensory flashes from the object’s immediate environment, such as smell, texture, temperature, pressure, or nearby sound.',
      'The Ritual can reach through thin barriers, shallow ground, or up to 2 meters of stone. Range extends to 1 kilometer.',
      'You glimpse one brief memory tied to the object, such as who last touched it, where it last rested, or what strong emotion clings to it. Range extends to 5 kilometers, unless a stronger ward blocks the link.',
    ],
  },
  {
    id: 'ritual-clairvoyance',
    name: 'Clairvoyance',
    description: 'You open a window through distance, letting your mind wander where your body cannot.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge'],
    castingTime: '1 Tyhran Hour',
    duration: 'Concentration, up to 1 Forearm',
    requirement: 'You must name a place you know or a creature familiar to you.',
    danger:
      'The farther your awareness reaches, the more likely something notices the thread you left behind.',
    limits:
      'Requires a known place or a familiar creature. Does not reveal hidden truths automatically. Does not bypass story-level wards, divine concealment, demonic deception, Artifact will, or specific GM protection. Does not allow you to act through the vision.',
    raises: [
      'You project your senses to a known location or familiar creature within 1 kilometer. You can see from that point as though present, though sight is hazy and colorless.',
      'The vision becomes clearer and gains sound. You can faintly hear conversations, movement, and nearby environmental noise.',
      'You can shift the viewpoint up to 20 meters around the initial location, or follow the creature slowly at half walking speed.',
      'The image becomes vivid and detailed. You may focus on small objects, writings, symbols, faces, or gestures clearly.',
      'You may scry across any distance on the same plane. With a strong sympathetic connection and GM approval, the Ritual may glimpse across a planar boundary. After ending the Ritual, your body remains senseless for a brief moment.',
    ],
  },
  {
    id: 'ritual-threshold-alarm',
    name: 'Threshold Alarm',
    description:
      'You mark a threshold, camp edge, door, window, or boundary so that the place remembers being crossed.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge', 'survival', 'social'],
    castingTime: '1 Tyhran Hour',
    duration: 'Until the next Safe Haven Rest or one day, whichever comes first',
    requirement: 'You must mark or touch the threshold, boundary, or protected entry point.',
    limits:
      'Not a defensive ward. Does not create Armor, Evade, Temporary HP, concealment, a Safe Haven, or a barrier. Does not stop anyone from entering. It only warns.',
    raises: [
      'Ward one doorway, window, tunnel mouth, room boundary, or camp edge. When a creature crosses it, one named wardkeeper within 1 kilometer receives a clear alarm. This does not block, harm, slow, or reveal the creature.',
      'You may name up to Mastery Rank creatures who do not trigger the alarm.',
      'The alarm can cover a small house, campsite, chamber, or connected room cluster instead of one entry point. The wardkeeper senses the direction of the breach.',
      'The alarm conveys the approximate number and size of creatures crossing the threshold. Mundane stealth does not prevent the alarm.',
      'The alarm may wake all named allies inside the warded area. It cannot be silenced or bypassed without overcoming the Ritual TN or using a specific countermeasure.',
    ],
  },
  {
    id: 'ritual-seal-passage',
    name: 'Seal Passage',
    description:
      'You press power into a door, gate, hatch, tunnel, archway, or ancient seam, telling the world that this way is closed.',
    stoneCost: 1,
    stoneCostAtDeclaredRaise: { 4: 3 },
    allowedSkillCategories: ['knowledge'],
    castingTime: '1 Tyhran Hour',
    duration: 'Until broken, opened, dismissed, or overcome',
    requirement: 'You must touch the passage, seal, door, gate, hatch, or boundary being affected.',
    specialCostNote: 'Raise 4 (open an existing sealed or forgotten passage) costs 3 Stones. Cannot create a new exit.',
    limits:
      'Does not replace Engineering, lockpicking, digging, or breaking objects by mundane means. It creates or breaks a supernatural seal on an existing passage. Opening mode cannot create a passage where none exists.',
    raises: [
      'You seal one accessible mundane passage, such as a door, gate, hatch, window, tunnel mouth, or stone seam. The passage closes and locks without needing a key. If you are attempting to open an existing sealed or forgotten passage, you instead confirm whether such a passage or seal truly exists.',
      'The sealed passage cannot be opened by mundane keys, latches, or ordinary handling. It must be forced, ritually opened, dismissed by the caster, or overcome with an appropriate check against the Ritual TN.',
      'The sealed passage becomes twice as physically durable. If the object has Health, Structure, or a similar value, double that value for the purpose of breaking through.',
      'The sealed passage becomes as hard as solid granite for the purpose of forcing, breaking, burning, cutting, or smashing it.',
      'You may use this Ritual to open an existing sealed, hidden, or forgotten passage, but only if such a passage truly exists. This mode costs 3 Stones. It cannot create a new tunnel, doorway, road, or exit where none exists.',
    ],
  },
  {
    id: 'ritual-purify-ground',
    name: 'Purify Ground',
    description: 'You cleanse a place where something wrong has soaked into the world.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge', 'survival', 'social'],
    castingTime: '1 Tyhran Hour',
    duration: 'Instant, with lasting consequences as described by the Raise result',
    requirement: 'You must remain within the area being purified for the full Ritual.',
    limits:
      'Does not create a Safe Haven. Does not hide evidence, remove mundane blood, erase tracks, restore destroyed structures, or undo ordinary consequences. Does not replace First Aid. Does not restore HP, lost Health Levels, or Scarred Health Bars.',
    raises: [
      'Purify a small area, such as a room, grave, altar, blood circle, ritual mark, corpse pile, shrine, or battlefield focus, from surface-level necrotic, demonic, infernal, or corrupt ritual residue.',
      'Before the residue fades, you learn its broad type and emotional pressure, such as hunger, fear, command, grief, sacrifice, binding, or desecration.',
      'You suppress one minor ongoing scene effect caused by the residue, such as whispers, corpse-stirring, nightmare pressure, ritual sickness, or spiritual contamination.',
      'You purify a larger connected site, such as a crypt chamber, ruined shrine, small battlefield, ritual cellar, desecrated house, or corrupted grove.',
      'You may break one active residue-anchor, lingering desecration, corpse-binding, or demonic trace if the Ritual MR is high enough for the source. The GM may require a specific focus, name, remains, or symbol.',
    ],
  },
  {
    id: 'ritual-learn-artifact',
    name: 'Learn Artifact',
    description: 'You study a relic until its surface stops being an object and starts becoming a history.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge'],
    castingTime: '1 Tyhran Hour',
    duration: 'Instant',
    requirement: 'You must hold, touch, examine, or remain close to the Artifact or relic for the full Ritual.',
    limits:
      'Does not force an intelligent Artifact, divine relic, or demonic object to reveal every secret. Powerful relics may reveal only layers the Ritual reaches. Read Resonance may reveal that an Artifact is powerful or strange. Learn Artifact reveals what that Artifact is, how it binds, what it costs, what it wants, or how it awakens.',
    raises: [
      'You learn the Artifact’s visible category, basic function, occupied Slot, binding status, and whether it is mundane, Resonant, Echo-bound, cursed, awakened, dormant, or unknown.',
      'You learn its origin style, creator tradition, previous owner trace, emotional residue, or broad purpose.',
      'You learn one hidden restriction, cost, dormant function, binding rule, warning sign, or danger connected to using or bonding with it.',
      'You may learn an awakening condition, command phrase, pact mark, curse logic, hidden limitation, or why the Artifact rejects or accepts a bearer.',
      'You reach one deeper truth: true creator, true purpose, concealed taint, secret command, hidden price, or a protected memory the Artifact is willing or forced to reveal.',
    ],
  },
  {
    id: 'ritual-forgotten-memory',
    name: 'Forgotten Memory',
    description: 'You touch a place or object and listen for the feelings it could not let go.',
    stoneCost: 1,
    allowedSkillCategories: ['knowledge', 'social'],
    castingTime: '1 Tyhran Hour',
    duration: 'Concentration, up to 1 Forearm',
    requirement: 'You must touch the object, location, wall, floor, weapon, relic, or remains being read.',
    danger:
      'If the memory is violent, demonic, death-bound, or horrific, Raise 4 may deal Stress equal to the Ritual MR.',
    limits:
      'Does not use the word Echo because Echo refers to playable ancestry. Reads emotional residue, not objective recordings. A memory may be incomplete, symbolic, distorted, or protected. Cannot prove every factual detail of an event. Cannot replace Investigation when ordinary evidence is available.',
    raises: [
      'You sense the strongest emotional residue tied to the place or object, such as fear, grief, hunger, relief, rage, devotion, betrayal, or hope.',
      'You receive one sensory fragment connected to that residue: sound, smell, touch, color, pressure, taste, or a single image.',
      'You witness a brief sequence of events around the memory. The sequence is emotional and symbolic, but it shows what kind of event created the residue.',
      'You identify one important person, symbol, object, phrase, direction, or relationship connected to the memory.',
      'You step into the memory for a brief moment and experience it from within. If the memory is violent, demonic, death-bound, or horrific, the GM may deal Stress equal to the Ritual MR.',
    ],
  },
  {
    id: 'ritual-word-of-recall',
    name: 'Word of Recall',
    description:
      'You etch a hidden mark of return upon a sanctuary, a promise to the world that you will one day come home.',
    stoneCost: 1,
    allowedSkillCategories: ['survival', 'knowledge', 'social'],
    castingTime: '1 Tyhran Hour',
    duration: 'Permanent until used, dismissed, broken, or removed',
    requirement:
      'The place must be meaningful to you and prepared through prayer, blood, sacrifice, craft, memory, or witness.',
    specialCostNote:
      'The Stones paid for Word of Recall remain Sealed while the mark exists. They return only after the mark is used, dismissed, broken, or removed, followed by a Safe Haven Rest. Activating the mark is not a combat action. Unless a specific rule says otherwise, activating the recall requires at least 1 Forearm of focus outside combat.',
    limits:
      'Cannot target a place you have never reached. Cannot create safety at the destination. Cannot be used as a combat escape unless a specific rule explicitly allows it. Cannot bypass story-level seals, divine locks, demonic anchors, or explicit travel bans unless the GM allows it.',
    raises: [
      'You bind a spiritual mark to the location. At a later time, you may return to that exact point. The mark fades when used.',
      'You may bring one willing ally who stands within 2 meters of you when the recall is activated.',
      'The recall becomes gentler. Willing allies arrive standing, stable, and with fragile gear intact unless the destination itself is dangerous.',
      'The recall can pass through minor wards, interference, or sanctum pressure, unless a stronger effect specifically blocks planar or spatial travel.',
      'The mark becomes a lasting bond. It may be used once per week without fading, but the Stones remain Sealed while the bond exists.',
    ],
  },
  {
    id: 'ritual-dreamwalk',
    name: 'Dreamwalk',
    description:
      'You step through the mirror of sleep, drifting into another’s dreams to seek truth, warning, or solace.',
    stoneCost: 1,
    allowedSkillCategories: ['social', 'knowledge'],
    castingTime: '1 Tyhran Hour',
    duration: 'Up to 1 Forearm inside the dream',
    requirement:
      'The target must be asleep and willing, or their soul must be unguarded with GM approval.',
    danger:
      'If the dream is hostile, demonic, cursed, or traumatic, Raise 4 may deal Stress equal to the Ritual MR.',
    limits:
      'Cannot rewrite a mind. Cannot cure trauma by itself. Cannot force a protected target to reveal secrets without appropriate MR, Raise Level, and GM approval. Cannot control the dreamer. Cannot replace Social Skills, therapy, confession, or player choice.',
    raises: [
      'You enter the target’s dreamscape, perceiving symbolic visions of their fears, memories, desires, or current emotional state. You may speak within the dream as a guiding voice.',
      'You may interact with elements of the dream, reshape minor symbols, calm a nightmare scene, or create a safe image for conversation.',
      'You can communicate directly with the dreamer’s subconscious. A simple message, warning, apology, or promise may persist after waking.',
      'You glimpse buried memories or truths the target hides even from themselves. These are emotional and symbolic, not guaranteed factual records.',
      'You risk full immersion, walking the dream as if real. The dreamer may see you clearly. If the dream is hostile, demonic, cursed, or traumatic, the GM may deal Stress equal to the Ritual MR.',
    ],
  },
  {
    id: 'ritual-last-light',
    name: 'Last Light',
    description: 'You kindle a flame for the fallen, guiding what remains beyond the veil so it may rest.',
    stoneCost: 1,
    allowedSkillCategories: ['social', 'knowledge'],
    castingTime: '1 Tyhran Hour',
    duration: 'Instant, with lasting consequences as described by the Raise result',
    requirement:
      'Performed within sight of the body, grave, ashes, relic, or death-place of the deceased.',
    limits:
      'Not resurrection. Cannot call the dead back to life. Does not destroy active undead enemies by itself. Does not create a Safe Haven. Helps the dead pass on and helps prevent ordinary undeath or spiritual corruption from taking hold.',
    raises: [
      'You perform a rite that severs the soul’s lingering ties, helping it pass peacefully and preventing ordinary undeath or spiritual corruption from taking hold.',
      'The immediate burial area is purified from minor necrotic residue, corpse-stirring, grave whispers, or restless spiritual pressure.',
      'You may carry one short message from the living to the dead, such as farewell, forgiveness, warning, or love.',
      'If the spirit is willing or able, it may manifest briefly, sharing one phrase, image, emotion, or final impression before passing beyond reach.',
      'The grave, body, or death-place becomes hallowed against future desecration or necromantic use unless overcome by a stronger effect.',
    ],
  },
];

const LEGACY_RITUAL_IDS: Record<string, string> = {
  'ritual-detect-magic': 'ritual-read-resonance',
};

export function getRitualByName(name: string): RitualDefinition | undefined {
  const lower = name.trim().toLowerCase();
  return RITUALS.find((r) => r.name.toLowerCase() === lower);
}

export function getRitualById(id: string): RitualDefinition | undefined {
  const mapped = LEGACY_RITUAL_IDS[id] ?? id;
  return RITUALS.find((r) => r.id === mapped);
}
