/**
 * Rituals configuration for Mastery System
 */

export interface RitualDefinition {
  name: string;
  description: string;
  type: string;
  cost: string;
  duration: string;
  requirement?: string;
  roll: string;
  raises: Array<{
    level: string;
    effect: string;
  }>;
  danger?: string;
}

export const RITUALS: RitualDefinition[] = [
  {
    name: 'Identify',
    description: 'You trace runes and whisper truths into an unknown item — and it whispers back.',
    type: 'Ritual',
    cost: '1 Stone',
    duration: '10 minutes',
    requirement: 'You must touch or hold the item throughout the ritual.',
    roll: 'Intellect keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You learn the item\'s name, level, known powers, magical school, and any command words or activation rites. The item\'s surface thoughts or emotional tone briefly echo in your mind.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'You glimpse the item\'s history and last wielder — flashes of imagery, emotions, or spoken names. Gain one hint toward its crafting origin.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You perceive the Taint\'s personality: its desires, virtues, and obsessions. The item now subtly recognizes you as a potential bearer.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'You sense hidden restrictions, dormant powers, or Thread-Point requirements for further awakening. You may intuit one condition or event needed to unlock its next level.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'You uncover the true origin of the artifact — god, demon, or mortal craftsman. The item forms a faint bond and remembers you thereafter; future Identifies gain +2 dice.'
      }
    ],
    danger: 'Powerful or ancient items may resist identification. An Identify ritual is a two-way exchange. When you look into the item, it looks back into you.'
  },
  {
    name: 'Detect Magic',
    description: 'You attune your senses to the lingering pulse of the unseen. The world bleeds color where power flows.',
    type: 'Ritual',
    cost: '1 Stone',
    duration: 'Concentration, up to 10 minutes',
    requirement: 'The caster must focus eyes or hands upon the area or object.',
    roll: 'Intellect keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You perceive faint auras of active or latent magic within 10 meters — basic schools (divine, arcane, natural, infernal).'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'You discern the strength and structure of each aura, identifying magical traps, wards, or enchantments.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You sense the emotional tone or purpose behind each magic — protection, control, hunger, sorrow.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'You may trace the aura\'s path back to its source (the caster, focus, or leyline) within 100 meters.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'You pierce veils and illusions; hidden or masked magics are revealed in their true form, and for 1 round you can see into the Fade (the spirit layer between worlds).'
      }
    ],
    danger: 'Extended exposure may attract entities that notice you noticing them. The veil between worlds thins wherever your gaze lingers too long.'
  },
  {
    name: 'Locate Object',
    description: 'You close your eyes, tracing a pattern in the air — a pull forms within your mind, guiding you toward what you seek.',
    type: 'Ritual',
    cost: '1 Stone',
    duration: 'Concentration, up to 10 minutes',
    requirement: 'You must have seen or touched the object, or know its precise form.',
    roll: 'Intellect keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You sense the direction of a specific object you describe within 60 meters, provided there is no heavy lead, consecrated, or anti-magic barrier in the way. The sensation is like a faint magnetic pull in your chest or mind.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'The range expands to 300 meters. You can distinguish between multiple similar items (e.g., several swords) and sense which one matches your mental image.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You receive short sensory flashes — a smell, texture, or surrounding sound — revealing the object\'s immediate environment.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'The ritual penetrates thin wards or shallow ground; you can locate the item through up to 2 meters of stone or one divine barrier. Range extends to 1 kilometer.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'The link deepens: you momentarily see through the object\'s "memory", perceiving who last touched it or where it was last resting. The range becomes 5 kilometers, or unlimited if the object shares your Taint or soul signature.'
      }
    ],
    danger: 'Each use of Locate Object briefly binds your mind to the object\'s echo. Powerful or cursed items may notice your search — and look back.'
  },
  {
    name: 'Augury',
    description: 'You cast marked stones, whisper prayers, or let blood fall upon sacred ground — asking the world itself for an omen.',
    type: 'Ritual',
    cost: '1 Stone',
    duration: '10 minutes',
    roll: 'Intellect keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You receive a simple omen: "weal" (good) or "woe" (bad) regarding a specific action you plan to take within the next 24 hours.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'The omen becomes more specific, revealing a general outcome (success, failure, danger, opportunity) and a vague timeframe.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You glimpse a symbolic image or phrase that hints at the nature of the coming event — a broken sword, a rising sun, a whispered name.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'The vision clarifies: you see a specific moment or decision point that will determine the outcome, along with one potential consequence.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'You receive a clear, detailed vision of the most likely outcome, including key participants, locations, and the emotional tone of the event.'
      }
    ]
  },
  {
    name: 'Clairvoyance',
    description: 'Your consciousness drifts beyond your body, seeing through walls and across distances as if you were there.',
    type: 'Ritual',
    cost: '2 Stones',
    duration: 'Concentration, up to 10 minutes',
    requirement: 'You must have visited the location before or possess a clear mental image of it.',
    roll: 'Intellect keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You see and hear as if standing at a location within 100 meters, provided you have been there before or have a clear mental image.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'Range extends to 1 kilometer. You can move your viewpoint slowly (walking pace) within the area.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You can perceive magical auras, hidden objects, or invisible creatures at the location.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'Range extends to 10 kilometers. You can hear conversations clearly and perceive fine details.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'Range becomes unlimited. You can perceive the location as it was up to 1 hour in the past, or glimpse 1 round into the future.'
      }
    ],
    danger: 'While your consciousness is away, your body is vulnerable. If interrupted, you take 2d8 Stress and are Disoriented for 1 round.'
  },
  {
    name: 'Word of Recall',
    description: 'You inscribe a mark upon a location, binding it to your memory. When you speak the word, you return.',
    type: 'Ritual',
    cost: '3 Stones',
    duration: 'Permanent (until used or dispelled)',
    requirement: 'You must perform this ritual at the location you wish to mark.',
    roll: 'Intellect keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You mark a location. Once per day, you may speak the word and instantly return to that location from anywhere within 1 kilometer.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'Range extends to 10 kilometers. You may bring one willing creature with you.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'Range extends to 100 kilometers. You may bring up to 3 willing creatures.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'Range becomes unlimited. You may bring up to 5 willing creatures and 50 kg of objects.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'You may mark a second location. You can choose which location to return to when you speak the word.'
      }
    ]
  },
  {
    name: 'Greater Restoration',
    description: 'You channel pure life-force through your hands, mending wounds of body, mind, and soul.',
    type: 'Ritual',
    cost: '4 Stones',
    duration: '1 hour',
    requirement: 'You must touch the target throughout the ritual.',
    roll: 'Resolve keep Mastery + Medicine',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You restore 2d8 HP and remove one condition (Blind, Deaf, Paralyzed, etc.).'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'Restore 4d8 HP and remove all conditions. Restore one scarred Health Bar.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'Restore 6d8 HP, remove all conditions, and restore all scarred Health Bars. Reduce Stress by 10.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'Restore 8d8 HP, remove all conditions, restore all Health Bars, and reduce Stress by 20. The target gains +2 to all saves for 24 hours.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'Restore 10d8 HP, remove all conditions, restore all Health Bars, reduce Stress to 0, and remove one Faith Fracture. The target is fully restored.'
      }
    ]
  },
  {
    name: 'Commune',
    description: 'You open a channel to the unseen — speaking with spirits, echoes, or the lingering will of the dead.',
    type: 'Ritual',
    cost: '3 Stones',
    duration: '30 minutes',
    requirement: 'You must have a focus related to the entity you wish to contact (a personal item, name, or location).',
    roll: 'Resolve keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You establish contact with a spirit or echo. You may ask 3 yes/no questions and receive truthful answers.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'You may ask 5 questions. The entity can provide short phrases or single words in addition to yes/no.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You may ask 7 questions. The entity can speak in full sentences and provide detailed information.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'You may ask 10 questions. The entity can share memories, emotions, or visions related to your questions.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'The connection deepens: the entity can manifest briefly (visible to all present) and may offer unsolicited information or warnings.'
      }
    ],
    danger: 'Opening channels to the unseen attracts attention. Powerful or malevolent entities may attempt to hijack the connection or follow it back to you.'
  },
  {
    name: 'Atonement',
    description: 'You perform a ritual of purification, seeking to cleanse a soul of sin, curse, or spiritual corruption.',
    type: 'Ritual',
    cost: '5 Stones',
    duration: '1 hour',
    requirement: 'The target must be willing and present throughout the ritual.',
    roll: 'Resolve keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You remove one minor curse or spiritual affliction. The target gains +1 to saves against mental effects for 24 hours.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'You remove all curses and spiritual afflictions. The target gains +2 to saves against mental effects for 1 week.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You remove all curses, afflictions, and one Faith Fracture. The target gains +3 to saves against mental effects for 1 month.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'You remove all curses, afflictions, and up to 3 Faith Fractures. The target is protected from new curses for 1 year.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'You completely purify the target\'s soul, removing all curses, afflictions, and Faith Fractures. The target gains permanent +1 to all saves and is immune to curses for life.'
      }
    ]
  },
  {
    name: 'Dreamwalk',
    description: 'You enter the realm of dreams, walking through the sleeping minds of others.',
    type: 'Ritual',
    cost: '2 Stones',
    duration: 'Until you choose to leave or are forced out',
    requirement: 'The target must be sleeping within 10 meters.',
    roll: 'Intellect keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You enter the target\'s dream. You can observe and communicate, but cannot alter the dream.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'You can subtly influence the dream, changing minor details or guiding the narrative.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'You can reshape the dream entirely, creating new scenes or altering the dreamer\'s perception.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'You can access the dreamer\'s memories and plant suggestions that persist after waking.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'You can enter multiple dreams simultaneously (up to your Mastery Rank) and create shared dreamscapes.'
      }
    ],
    danger: 'If the dreamer becomes aware of your presence, they may attempt to expel you, dealing 2d8 Stress. Powerful dreamers may trap you in their nightmares.'
  },
  {
    name: 'Last Light',
    description: 'You channel the final spark of a dying soul, preserving their essence or guiding them to peace.',
    type: 'Ritual',
    cost: '6 Stones',
    duration: '10 minutes',
    requirement: 'The target must be dying or recently deceased (within 1 hour).',
    roll: 'Resolve keep Mastery + Medicine',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'You stabilize the dying target, preventing death. They remain unconscious for 1d4 hours.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'The target is restored to 1 HP and consciousness. They are exhausted but alive.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'The target is restored to half their maximum HP. They may speak their final words or share crucial information.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'The target is fully restored to life with all HP. They suffer no lasting effects from their death.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'The target is restored to life with full HP and all conditions removed. They gain +1 to all attributes for 24 hours as a gift from the beyond.'
      }
    ],
    danger: 'Performing Last Light on a soul that has already passed beyond may attract the attention of death itself. You take 3d8 Stress and gain one Faith Fracture.'
  },
  {
    name: 'Raise Dead',
    description: 'You call a soul back from the void, binding it once more to its mortal form.',
    type: 'Ritual',
    cost: '8 Stones',
    duration: '2 hours',
    requirement: 'The target must have been dead for no more than 7 days. The body must be mostly intact.',
    roll: 'Resolve keep Mastery + Occultism',
    raises: [
      {
        level: 'Raise 0 (Base Success)',
        effect: 'The target is restored to life with 1 HP. They are exhausted and suffer -2 to all attributes for 1 week.'
      },
      {
        level: 'Raise 1 (+4 over TN)',
        effect: 'The target is restored with half HP. They suffer -1 to all attributes for 1 week.'
      },
      {
        level: 'Raise 2 (+8 over TN)',
        effect: 'The target is restored with full HP. They suffer no attribute penalties but are emotionally shaken for 1 month.'
      },
      {
        level: 'Raise 3 (+12 over TN)',
        effect: 'The target is fully restored with no penalties. They retain all memories and experiences from before death.'
      },
      {
        level: 'Raise 4 (+16 over TN)',
        effect: 'The target is perfectly restored, as if they never died. They may even gain insight from their brief journey beyond, gaining +1 to one attribute permanently.'
      }
    ],
    danger: 'Raising the dead is an act that defies the natural order. You take 4d8 Stress and gain 2 Faith Fractures. The raised individual may bear scars or changes reflecting their time beyond the veil.'
  }
];

/**
 * Get all rituals
 */
export function getAllRituals(): RitualDefinition[] {
  return RITUALS;
}

/**
 * Get ritual by name
 */
export function getRitual(name: string): RitualDefinition | undefined {
  return RITUALS.find(r => r.name.toLowerCase() === name.toLowerCase());
}





