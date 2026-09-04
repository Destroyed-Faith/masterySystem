/**
 * Minor Expressions (cantrips) — catalog and tier/scaling helpers.
 * Vitality has no catalog entries; selections are capped by mastery rank and require attribute ≥ 8.
 */

export const MINOR_EXPRESSION_MIN_ATTRIBUTE = 8;

export const MINOR_EXPRESSION_TIERS = [8, 16, 24, 32, 40] as const;
export type MinorExpressionTier = (typeof MINOR_EXPRESSION_TIERS)[number];

export type MinorExpressionAttribute =
  | 'might'
  | 'agility'
  | 'intellect'
  | 'resolve'
  | 'influence'
  | 'wits';

export interface MinorExpressionDefinition {
  id: string;
  attribute: MinorExpressionAttribute;
  name: string;
  tagline: string;
  /** Optional rules capsule (e.g. Minor Conjuration limits), shown once in the UI */
  constraints?: string;
  tiers: Record<MinorExpressionTier, string>;
}

const M: MinorExpressionAttribute = 'might';
const A: MinorExpressionAttribute = 'agility';
const I: MinorExpressionAttribute = 'intellect';
const R: MinorExpressionAttribute = 'resolve';
const F: MinorExpressionAttribute = 'influence';
const W: MinorExpressionAttribute = 'wits';

export const MINOR_EXPRESSIONS: MinorExpressionDefinition[] = [
  {
    id: 'might-hold-fast',
    attribute: M,
    name: 'Hold the Door',
    tagline:
      'You can hold something back for a moment that really should not be holdable.',
    tiers: {
      8: 'You hold a door, a gate, a heavy beam, or a falling load just long enough to buy a moment.',
      16: 'You hold stronger pressure, heavier gates, or a failing barrier long enough for 1–2 people to react or escape.',
      24: 'You catch a small collapse, massive pressure, or a breaking obstacle for a clearly heroic moment.',
      32: 'You buy a small group time against something that should be too much for one person alone.',
      40: 'You create a legendary “Hold the Door” moment and briefly hold back something everyone else would have given up on long ago.'
    }
  },
  {
    id: 'might-force-open',
    attribute: M,
    name: 'Iron Grip',
    tagline: 'When you hold something, you really hold it.',
    tiers: {
      8: 'You do not lose rope, edge, grip, or support so easily.',
      16: 'You can hold someone securely, cinch something down reliably, or stabilize a slipping object.',
      24: 'Even under hard pull, wetness, weight, or panic, your grip stays astonishingly sure.',
      32: 'You hold things that would have slipped from others long ago, and can secure others with you.',
      40: 'Your grip feels like a vise; once you truly seize something, it feels as if the world would have to give before your hand does.'
    }
  },
  {
    id: 'might-clear-path',
    attribute: M,
    name: 'Break Through',
    tagline: 'You do not go around an obstacle — you go through.',
    tiers: {
      8: 'You push through light barricades, loose furniture, blocked doors, or dense crowds.',
      16: 'You break through more serious blockades of wood, clutter, furniture, or dense resistance.',
      24: 'You force a path through massive obstacles, makeshift barriers, or chaotically barricaded passages.',
      32: 'You create openings or paths through things others would first have to clear the hard way.',
      40: 'You move like a force of nature and go through almost anything physical that was not explicitly built to stop you.'
    }
  },
  {
    id: 'might-shoulder-the-burden',
    attribute: M,
    name: 'Titan Carry',
    tagline:
      'You carry people, loads, or bulky things as if they mattered less to you than to others.',
    tiers: {
      8: 'You carry an injured person or heavy load a short distance safely.',
      16: 'You shoulder someone with their gear or move heavy loads a solid distance.',
      24: 'You haul wounded, bulky loads, or several heavy things farther under bad conditions than others could.',
      32: 'You move heavy loads or people through stairs, mud, rubble, or chaotic paths with impressive endurance.',
      40: 'You seem almost monstrously reliable when carrying, and get people or loads where they need to go no matter how hard the path is.'
    }
  },
  {
    id: 'might-menace-of-flesh',
    attribute: M,
    name: "Tyrant's Aura",
    tagline: 'You enter a room and people physically sense that you are dangerous.',
    tiers: {
      8: 'Individual people register your physical danger immediately.',
      16: 'Small groups grow quieter, more careful, or intuitively step back.',
      24: 'Your presence colors a room physically; people instinctively expect violence even if you stay calm.',
      32: 'Even hard people realize they should take you seriously.',
      40: 'Your mere presence tips the air in the room; bodies react before thoughts.'
    }
  },
  {
    id: 'might-set-your-feet',
    attribute: M,
    name: 'Immovable',
    tagline: 'You can set yourself like an anchor.',
    tiers: {
      8: 'You hold your footing surprisingly well on awkward, slippery, or pressing ground.',
      16: 'You are not easily shifted from stance, grip, or position.',
      24: 'Even several disrupting factors at once barely move you once you have set yourself.',
      32: 'Others have to reckon with you like a pillar; you hold lines, passages, or positions with your body.',
      40: 'When you plant yourself, it almost feels as if everything around you has to go the long way around.'
    }
  },
  {
    id: 'agility-soft-step',
    attribute: A,
    name: 'Feather Step',
    tagline: 'Your steps and landings are so light that you barely create weight.',
    tiers: {
      8: 'You walk clearly quieter and leave only little noticeable weight.',
      16: 'Floorboards, rubble, cloth, leaves, or lightly sensitive surfaces react much less to you.',
      24: 'You move with an almost unnaturally light tread through problematic ground.',
      32: 'Your steps often feel as if you barely truly load the ground.',
      40: 'You seem to walk almost without weight; step, landing, and contact are minimal.'
    }
  },
  {
    id: 'agility-light-fingers',
    attribute: A,
    name: 'Bounding Leap',
    tagline:
      'You can jump clearly farther and higher than normal movement would suggest.',
    tiers: {
      8: 'You clear small gaps, wall edges, and height differences clearly better than usual.',
      16: 'Your jumps carry you far enough to reach places others only manage with help.',
      24: 'You bridge impressive distances or heights and make movement much freer vertically.',
      32: 'Your jumps feel clearly superhuman in range and safety.',
      40: 'You move in bounds that look almost like brief moments of flight.'
    }
  },
  {
    id: 'agility-catch-yourself',
    attribute: A,
    name: 'Catfall',
    tagline:
      'You can catch large falls or jumps extremely softly, rolling or springing.',
    tiers: {
      8: 'You catch jumps, steps, edges, and smaller falls cleanly.',
      16: 'Even clear height differences or hard landings feel controlled and soft on you.',
      24: 'You can blunt large jumps or deep descents by rolling or springing.',
      32: 'Even heights that look dangerous can often be caught by you with surprising elegance.',
      40: 'You land from absurd heights or distances with an unreality that makes others look clumsy.'
    }
  },
  {
    id: 'agility-fine-hands',
    attribute: A,
    name: 'Wall Spring',
    tagline:
      'You can use walls, ledges, or angled surfaces for an extra bound or change of direction.',
    tiers: {
      8: 'You use edges, low walls, or angled surfaces for small corrections or extra bounds.',
      16: 'You visibly gain extra movement or height from walls and ledges.',
      24: 'You can make more complex direction changes or follow-up moves across vertical surfaces.',
      32: 'Tight spaces, roofs, walls, and vertical obstacles become playable movement surfaces for you.',
      40: 'You feel almost impossibly free in vertical movement as long as some surface still exists to push off from.'
    }
  },
  {
    id: 'agility-perfect-balance',
    attribute: A,
    name: 'Reed on the Wind',
    tagline: 'You can stand securely on absurdly small, narrow, or unstable surfaces.',
    tiers: {
      8: 'You hold securely on narrow edges, beams, or unstable ground.',
      16: 'You can stand calmly or move carefully on small, wobbly, or awkward surfaces.',
      24: 'You balance on absurdly small or problematic surfaces as long as there is still physical room.',
      32: 'Even wet, loose, or strongly swaying surfaces throw you off balance astonishingly little.',
      40: 'Your balance feels almost weightless; where others would not even step, you can stand securely.'
    }
  },
  {
    id: 'agility-slip-through',
    attribute: A,
    name: 'Flow Through',
    tagline:
      'You can move through tight, chaotic, or vertical environments almost like flowing water.',
    tiers: {
      8: 'You get cleanly through choke points, obstacles, or chaotic spaces.',
      16: 'When climbing, squeezing, ducking, or weaving past obstacles, you barely lose your rhythm.',
      24: 'Even vertical, tight, or messy environments slow you only a little.',
      32: 'You move through difficult spaces like water through cracks.',
      40: 'Obstacle-rich environments seem more like paths than problems for you.'
    }
  },
  {
    id: 'intellect-mage-hand',
    attribute: I,
    name: 'Mage Hand',
    tagline:
      'You create a small magical force/hand that can move, fetch, or tip light objects at short range.',
    tiers: {
      8: 'You move, fetch, or tip small light objects at short range.',
      16: 'You manipulate objects more reliably, more precisely, and a bit farther away.',
      24: 'You carry out several small remote hand actions cleanly in succession.',
      32: 'Your magical hand becomes clearly more skilled, farther-reaching, and more versatile.',
      40: 'Your remote manipulation of light things feels almost like a natural extension of your own hand.'
    }
  },
  {
    id: 'intellect-message',
    attribute: I,
    name: 'Message',
    tagline:
      'You can whisper a quiet, targeted message to a person at short range that only they hear.',
    tiers: {
      8: 'A short whispered sentence to a person nearby.',
      16: 'More range, more clarity, a short reply possible.',
      24: 'A short back-and-forth exchange over usable distance.',
      32: 'Several short messages even across noise or simple obstacles.',
      40: 'Almost like a discreet invisible conversation on a small scale.'
    }
  },
  {
    id: 'intellect-arcane-spark',
    attribute: I,
    name: 'Arcane Spark',
    tagline:
      'You create small points of light, sparks, glyph flicker, or visible arcane marks.',
    tiers: {
      8: 'A small point of light, spark, or glowing mark.',
      16: 'Several small lights or brief magical marks.',
      24: 'Moving points of light, small symbols, or more stable signs.',
      32: 'Clean arcane displays, longer glow duration, and more complex small light patterns.',
      40: 'A masterful small language of light and glyphs that feels like a real tool.'
    }
  },
  {
    id: 'intellect-detect-trace',
    attribute: I,
    name: 'Detect Trace',
    tagline:
      'You can sense faint magical residue, resonances, or ritual traces.',
    tiers: {
      8: 'You sense that magic or something unnatural was here.',
      16: 'Rough direction, freshness, or strength becomes recognizable.',
      24: 'You can better tell whether the residue came more from a ritual, an object, or a person.',
      32: 'Subtle differences and finer remnants become reliably perceptible.',
      40: 'You read even delicate arcane afterimages with surprising certainty, without replacing true analysis.'
    }
  },
  {
    id: 'intellect-script-whisper',
    attribute: I,
    name: 'Script Whisper',
    tagline:
      'You create secret, invisible runes or marks that become readable only under the right circumstances.',
    tiers: {
      8: 'You can leave a single short hidden mark, word, or symbol.',
      16: 'You leave short secret messages or small rune sequences that can be made visible on purpose.',
      24: 'Your hidden runes can carry small paragraphs, several marks, or simple structured clues.',
      32: 'You lay down more complex secret script layers, mark paths, or nested runes that stay reliably hidden.',
      40: 'You create masterful invisible writing and rune-work that is wide-ranging, fine, and hard to discover.'
    }
  },
  {
    id: 'intellect-minor-conjuration',
    attribute: I,
    name: 'Minor Conjuration',
    tagline:
      'You create a small amount of simple matter or substance for a short time.',
    constraints:
      'Important limit: only simple matter; nothing precision-built; nothing complexly living; nothing meant to replace real crafting, rituals, or Powers.',
    tiers: {
      8: 'A handful of a simple substance: water, earth, sand, ash, metal shavings, gravel, clay, or similar.',
      16: 'About a bucketful of a simple substance.',
      24: 'About a bathtub full of a simple substance.',
      32: 'A large chest, tub, or small cartload of a simple substance.',
      40: 'An impressively large amount of simple matter, big enough to visibly fill or clearly change a small area.'
    }
  },
  {
    id: 'resolve-alarm',
    attribute: R,
    name: 'Alarm',
    tagline:
      'You set a silent warning on an object, sleeping place, entrance, or small area that alerts you when it is broken.',
    tiers: {
      8: 'An object, pack, bedroll, or personal spot.',
      16: 'An entrance, window, door, or small campsite.',
      24: 'A small room or clear radius.',
      32: 'Several entrances or a larger area.',
      40: 'An entire camp, a hall, or a cleanly set small safe space.'
    }
  },
  {
    id: 'resolve-still-mind',
    attribute: R,
    name: 'Still Mind',
    tagline:
      'You can gather, order, and shield your mind in a short time against panic, confusion, or rising unrest.',
    tiers: {
      8: 'You quickly find calm and focus.',
      16: 'You push strong unrest or mental pressure back for a while.',
      24: 'Even fierce inner turbulence can be ordered more clearly.',
      32: 'You can gather yourself again almost immediately and become ready to act.',
      40: 'Your inner order feels exceptionally firm and hard to shake.'
    }
  },
  {
    id: 'resolve-read-omen',
    attribute: R,
    name: 'Read Omen',
    tagline:
      'You can read a good or ill omen from mood, signs, chance, animal behavior, wind, silence, or small dissonances.',
    tiers: {
      8: 'A rough feeling: good, bad, wrong, uneasy.',
      16: 'Clearer tendencies tied to place, travel, action, or encounter.',
      24: 'Several small signs can be assembled into a usable omen-picture.',
      32: 'Your reading becomes astonishingly concrete in its direction.',
      40: 'You read reliable warnings or signs of hope from the smallest breaks in the world.'
    }
  },
  {
    id: 'resolve-cold-comfort',
    attribute: R,
    name: 'Cold Comfort',
    tagline:
      'You can give someone steadiness with quiet certainty, dark honesty, or silent confidence, without offering false hope.',
    tiers: {
      8: 'One person settles through your words or presence.',
      16: 'Someone tipping inside finds their footing again through you.',
      24: 'Your calm can help stabilize small groups as well.',
      32: 'Even in bleak situations you create durable emotional quiet.',
      40: 'You feel like a dark anchor others can hold onto.'
    }
  },
  {
    id: 'resolve-sense-taint',
    attribute: R,
    name: 'Sense Taint',
    tagline:
      'You can sense on places, things, or people whether something is spoiled, wrong, ill-omened, or mentally “dirty.”',
    tiers: {
      8: 'You dimly sense that something is off.',
      16: 'You can better tell whether a person, object, or area is the source.',
      24: 'Freshness, strength, or kind of taint become clearer.',
      32: 'Even subtle impurity or mental rot becomes perceptible.',
      40: 'Your sense for false presence, corruption, and mental weight is exceptionally fine.'
    }
  },
  {
    id: 'resolve-keep-watch',
    attribute: R,
    name: 'Keep Watch',
    tagline:
      'You can stay awake, attentive, and inwardly taut in quiet concentration for a long time, almost as if listening for something invisible.',
    tiers: {
      8: 'You keep watch more reliably than others.',
      16: 'Tiredness, monotony, and long silence dull you much less.',
      24: 'Fine changes in sound, air, or mood are more likely to catch your notice.',
      32: 'Over long watches you stay remarkably clear and taut.',
      40: 'Your vigilance feels almost unnaturally gathered, as if you were listening along even for the invisible.'
    }
  },
  {
    id: 'influence-carry-voice',
    attribute: F,
    name: 'Mirror Shade',
    tagline:
      'You create a brief mix-up or double-image effect around yourself.',
    tiers: {
      8: 'A brief false impression, a glance-trick, or a mixable afterimage of you.',
      16: 'Observers hang for a moment on a false position or version of you.',
      24: 'In groups or moving scenes, clear confusion arises about exactly where you are.',
      32: 'Pursuers, observers, or fleeting witnesses often remember the false version of you first.',
      40: 'Your image can socially detach from the actual moment almost like a ghostly twin.'
    }
  },
  {
    id: 'influence-read-the-room',
    attribute: F,
    name: 'Read the Room',
    tagline: 'You read not only the mood, but the hidden social truth of a scene.',
    tiers: {
      8: 'You sense the basic mood and obvious tension.',
      16: 'You recognize who is only playing along, who is about to tip, and where the fault lines lie.',
      24: 'Power, fear, insecurity, and emotional triggers of a small group become clearly readable.',
      32: 'Even veiled tensions or unspoken social roles rarely escape you.',
      40: 'You read social spaces almost as if you could hear the unspoken subtext.'
    }
  },
  {
    id: 'influence-ease-tension',
    attribute: F,
    name: 'Glamour',
    tagline: 'You lay a deceptive appearance over yourself.',
    tiers: {
      8: 'Clothing, style, bearing, or social impression can be visibly shifted.',
      16: 'You come across credibly as another origin, role, class, or age.',
      24: 'The appearance becomes clearly more flexible and can rewrite whole social impressions.',
      32: 'You can strongly change your perceived outward appearance.',
      40: 'Your glamour can produce almost a complete outer reinterpretation of your person.'
    }
  },
  {
    id: 'influence-command-presence',
    attribute: F,
    name: 'Vanish',
    tagline: 'You can slip out of the moment socially and visually and be “gone.”',
    tiers: {
      8: 'You use a brief break in attention to leave the focus.',
      16: 'In a crowd, unrest, or motion you are quickly no longer where people expect you.',
      24: 'Observers lose you noticeably more easily from sight and from the scene’s memory.',
      32: 'You are often already “gone” before others have sorted their gaze.',
      40: 'Your vanishing feels like a small social blink effect, without being true teleportation.'
    }
  },
  {
    id: 'influence-silver-tongue',
    attribute: F,
    name: 'Silver Tongue',
    tagline:
      'Your words can make others forget their own interests, reservations, wounds, or caution for a short moment.',
    tiers: {
      8: 'People listen to you noticeably more than usual.',
      16: 'Individuals can be pulled for a moment out of their caution or agenda.',
      24: 'Conversations run noticeably more on your frame than on theirs.',
      32: 'Even difficult counterparts come farther toward you than they originally meant to.',
      40: 'Your words can briefly almost resort the priorities in the room.'
    }
  },
  {
    id: 'influence-silken-barb',
    attribute: F,
    name: 'Silken Barb',
    tagline: 'You set an elegant, subtle line that sticks in the mind and keeps working.',
    tiers: {
      8: 'A doubt or small barb is left with one person.',
      16: 'The remark visibly colors the aftereffect of a conversation.',
      24: 'The planted thought works longer and deeper on self-image, insecurity, or stance.',
      32: 'Even small groups can come to see someone or something differently through a planted line.',
      40: 'Your fine social blades leave elegant, long-lasting mental aftereffects.'
    }
  },
  {
    id: 'wits-nose-for-trouble',
    attribute: W,
    name: 'Nose for Trouble',
    tagline:
      'You quickly sense when a situation is tipping, something is rotten, or trouble is in the air.',
    tiers: {
      8: 'You notice early that something is off.',
      16: 'You perceive tipping situations, ambushes, or sources of trouble more clearly.',
      24: 'You often sense where trouble is about to come from.',
      32: 'Even well-camouflaged bad mood or looming problems rarely escape you.',
      40: 'Your instinct for trouble feels almost uncannily reliable.'
    }
  },
  {
    id: 'wits-quick-read',
    attribute: W,
    name: 'Quick Read',
    tagline:
      'You can size up a person, object, or situation in a few moments roughly, but often accurately.',
    tiers: {
      8: 'A first usable read in seconds.',
      16: 'Character, condition, or the catch in a thing become clear quickly.',
      24: 'You read situations or people with striking certainty.',
      32: 'Even more complex setups quickly form a coherent picture for you.',
      40: 'Your first impressions are frighteningly often on target.'
    }
  },
  {
    id: 'wits-find-the-angle',
    attribute: W,
    name: 'Find the Angle',
    tagline:
      'You quickly spot the simplest, cleverest, or most practical point of attack in a situation.',
    tiers: {
      8: 'You quickly find the obvious workable path.',
      16: 'You often discover the better lever, access, or trick.',
      24: 'Even chaotic situations usually have some working angle for you somewhere.',
      32: 'In hard spots you quickly see where you really need to apply pressure.',
      40: 'Almost every stuck scene shows you some usable angle.'
    }
  },
  {
    id: 'wits-keep-the-thread',
    attribute: W,
    name: 'Keep the Thread',
    tagline:
      'In chaotic conversations, scenes, or search moments you do not lose the thread so easily.',
    tiers: {
      8: 'You keep the essentials more easily in mind.',
      16: 'Even with distraction or chaos, the central line stays intact for you.',
      24: 'You can hold several trails, suspicions, or conversation threads together more cleanly.',
      32: 'Even in messy scenes you barely lose the actual matter at hand.',
      40: 'Where others fray mentally, you hold the inner line almost effortlessly.'
    }
  },
  {
    id: 'wits-improvised-solution',
    attribute: W,
    name: 'Improvised Solution',
    tagline: 'You can quickly turn simple things into a usable small makeshift solution.',
    tiers: {
      8: 'Simple provisional aids, wedges, hooks, markers, or stopgaps.',
      16: 'More useful small constructions from whatever is at hand.',
      24: 'Surprisingly reliable improvisations with clearly recognizable use.',
      32: 'From almost any environment something usable can be pulled quickly.',
      40: 'Your improvisations feel, in the small scale, almost like a craft style of their own.'
    }
  },
  {
    id: 'wits-street-sense',
    attribute: W,
    name: 'Street Sense',
    tagline:
      'You find your way quickly in alleys, markets, camps, taverns, and cluttered everyday spaces.',
    tiers: {
      8: 'You quickly spot exits, choke points, and useful spots.',
      16: 'You quickly understand how a place works socially and practically.',
      24: 'Even unfamiliar everyday spaces become quickly readable and usable for you.',
      32: 'You almost always find the right people, paths, or places to vanish, watch, or get through.',
      40: 'In human everyday spaces you are almost never truly lost.'
    }
  }
];

const BY_ID = new Map<string, MinorExpressionDefinition>();
for (const def of MINOR_EXPRESSIONS) {
  BY_ID.set(def.id, def);
}

export function getMinorExpressionDefinition(id: string): MinorExpressionDefinition | undefined {
  return BY_ID.get(id);
}

export function listMinorExpressionsByAttribute(attr: MinorExpressionAttribute): MinorExpressionDefinition[] {
  return MINOR_EXPRESSIONS.filter((d) => d.attribute === attr);
}

export function attributeForExpressionId(id: string): MinorExpressionAttribute | undefined {
  return BY_ID.get(id)?.attribute;
}

/** Highest tier threshold not above value; null if value < MIN or unknown. */
export function tierThresholdForAttributeValue(value: number): MinorExpressionTier | null {
  const v = Math.floor(Number(value));
  if (!Number.isFinite(v) || v < MINOR_EXPRESSION_MIN_ATTRIBUTE) return null;
  let best: MinorExpressionTier | null = null;
  for (const t of MINOR_EXPRESSION_TIERS) {
    if (v >= t) best = t;
  }
  return best;
}

/** True when the character's attribute value meets or exceeds this tier threshold. */
export function isTierUnlocked(attributeValue: number, tier: MinorExpressionTier): boolean {
  const v = Math.floor(Number(attributeValue));
  return Number.isFinite(v) && v >= tier;
}

export function tierBodyForExpression(def: MinorExpressionDefinition, attributeValue: number): string {
  const tier = tierThresholdForAttributeValue(attributeValue);
  if (!tier) return def.tagline;
  return def.tiers[tier];
}

export function sanitizeMinorExpressionIds(
  ids: string[] | undefined,
  getAttributeValue: (key: string) => number,
  masteryRank: number
): string[] {
  const cap = Math.max(0, Math.floor(Number(masteryRank)) || 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids || []) {
    const id = String(raw || '').trim();
    if (!id || seen.has(id)) continue;
    const def = BY_ID.get(id);
    if (!def) continue;
    const v = getAttributeValue(def.attribute);
    if (v < MINOR_EXPRESSION_MIN_ATTRIBUTE) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= cap) break;
  }
  return out;
}

export const MINOR_EXPRESSION_ATTRIBUTES: MinorExpressionAttribute[] = [
  'might',
  'agility',
  'intellect',
  'resolve',
  'influence',
  'wits'
];
