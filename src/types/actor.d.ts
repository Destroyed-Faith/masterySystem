/**
 * Type definitions for Mastery System Actors
 */

export interface MasteryActorData {
  type: 'character' | 'npc' | 'summon' | 'divine';
  system: CharacterData | NpcData | SummonData | DivineData;
}

// Attribute structure
export interface AttributeData {
  value: number;
  stones?: number;
}

// Mastery progression
export interface MasteryData {
  rank: number;
  points: number;
  experience: number;
}

// Health bar structure
export interface HealthBar {
  name: string;
  max: number;
  current: number;
  penalty: number;
}

// Combat stats
export interface CombatData {
  initiative: number;
  evade: number;
  armor: number;
  speed: number;
}

// Resource tracking
export interface ResourceData {
  value: number;
  max: number;
}

export interface ResourcesData {
  reactions: ResourceData;
  movement: ResourceData;
  actions: ResourceData;
}

// === Character Data ===
export interface CharacterData {
  bio: {
    name: string;
    echo: string;
    concept: string;
    appearance: string;
    notes: string;
  };
  attributes: {
    might: AttributeData;
    agility: AttributeData;
    vitality: AttributeData;
    intellect: AttributeData;
    resolve: AttributeData;
    influence: AttributeData;
    wits: AttributeData;
  };
  mastery: MasteryData;
  stones: {
    total: number;
    vitality: number;
    current: number;
    maximum: number;
  };
  health: {
    bars: HealthBar[];
    currentBar: number;
    tempHP: number;
  };
  stress: {
    current: number;
    maximum: number;
  };
  combat: CombatData;
  resources: ResourcesData;
  skills: Record<string, number>;
  conditions: any[];
  notes: {
    schticks: string;
    faithFractures: string;
    background: string;
  };
}

// === NPC Data ===
export interface NpcData {
  bio: {
    name: string;
    type: string;
    faction: string;
    description: string;
  };
  attributes: {
    might: AttributeData;
    agility: AttributeData;
    vitality: AttributeData;
    intellect: AttributeData;
    resolve: AttributeData;
    influence: AttributeData;
    wits: AttributeData;
  };
  mastery: {
    rank: number;
  };
  health: {
    bars: HealthBar[];
    currentBar: number;
    tempHP: number;
  };
  combat: CombatData;
  resources: ResourcesData;
  skills: Record<string, number>;
  conditions: any[];
  notes: string;
}

// === Summon Data ===
export interface SummonData {
  bio: {
    name: string;
    summonType: string;
    duration: string;
    description: string;
  };
  attributes: {
    might: { value: number };
    agility: { value: number };
    vitality: { value: number };
    wits: { value: number };
  };
  health: {
    current: number;
    maximum: number;
  };
  combat: {
    evade: number;
    armor: number;
    speed: number;
  };
  abilities: any[];
  notes: string;
}

// === Divine Entity Data ===
export interface DivineData {
  bio: {
    name: string;
    title: string;
    description: string;
  };
  stones: {
    vitality: number;
    pool: number;
  };
  divineClash: {
    attack: number;
    defense: number;
    overhang: number;
  };
  artifacts: any[];
  notes: string;
}




























