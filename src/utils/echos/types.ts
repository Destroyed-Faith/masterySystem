/**
 * Echo Types — shared shape for all playable Echo ancestries.
 *
 * An Echo is a pack of Core Traits (some with sub-choices, some gated by
 * Mastery Rank) plus an Echo Deck of 4 cards, each with 4 skill-based options.
 *
 * Data is stored on the Actor under `system.echo.*`; no Item-type is used.
 */

/**
 * Describes how a trait/resource is consumed.
 * - `mr-per-rest`: usable Mastery Rank times per Safe Haven Rest.
 * - `once-per-rest`: usable once per Safe Haven Rest.
 * - `passive`: always-on, no per-day limit.
 * - `unlock-mr3`: passive ability available starting at Mastery Rank 3.
 * - `unlock-mr6`: passive ability available starting at Mastery Rank 6.
 * - `unlock-mr6-once`: unlocks at MR 6, then usable once per Safe Haven Rest.
 */
export type EchoUsage =
  | 'mr-per-rest'
  | 'once-per-rest'
  | 'passive'
  | 'unlock-mr3'
  | 'unlock-mr6'
  | 'unlock-mr6-once';

/** A single Core Trait on an Echo (or within a SubChoice). */
export interface EchoTrait {
  id: string;
  name: string;
  effect: string;
  flavor?: string;
  usage: EchoUsage;
}

/** A mutually-exclusive sub-choice on an Echo (Elves lineage, Sentinels order). */
export interface EchoSubChoice {
  key: string;
  name: string;
  trait: EchoTrait;
}

/** Creature size tiers (mirrors the SRD size table). */
export type EchoSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

/** Full Echo definition. */
export interface EchoDefinition {
  key: string;
  name: string;
  tagline: string;
  theme: string;
  summary: string;
  creatureType: string;
  size: EchoSize;
  speed: number;
  coreTraits: EchoTrait[];
  /** Label shown above the sub-choice radio, e.g. "Elemental Lineage". */
  subChoiceLabel?: string;
  /** Mutually-exclusive sub-choices (Elves/Sentinels). */
  subChoices?: EchoSubChoice[];
  /** If true, character must additionally pick a Veiled Form at creation (Dragonborn). */
  veiledForm?: boolean;
}
