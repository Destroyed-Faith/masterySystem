/**
 * Manual Adjustments — player/GM-authored additive overrides.
 *
 * The `CharacterData.manual` block lets a player (or GM) layer static
 * bonuses on top of the computed stats (armor / evade / DR% / initiative),
 * add flat + bonus-d8 to specific roll kinds, and tack extra HP / stress
 * onto each bar without having to change the underlying attribute values.
 *
 * Every field is additive — `0` means "no bonus". The helpers below normalize
 * partial objects coming from older save files into the full canonical shape
 * so the rest of the codebase can read `system.manual.combat.evade` without
 * null-checking every layer.
 */
import type { ManualAdjustments, ManualRollBonus } from '../types/actor.js';
/** Canonical default — every bonus field is zero. */
export declare const DEFAULT_MANUAL_ADJUSTMENTS: ManualAdjustments;
/**
 * Return a fully-populated `ManualAdjustments` object, filling in zeros for
 * any missing fields. Safe to call on `system.manual` even when it is
 * `undefined` (old actors). Never mutates the input.
 */
export declare function normalizeManualAdjustments(raw: any): ManualAdjustments;
/**
 * Read the manual adjustments from an actor, returning zero-defaults when
 * the actor has never opened the Manual Adjustments card.
 */
export declare function readManualAdjustments(actor: any): ManualAdjustments;
/**
 * Total bonus for a specific roll kind = `rolls.any` + `rolls[kind]`.
 * Returns zeros when the kind is unknown (e.g. generic rolls).
 */
export declare function manualRollBonusForKind(adj: ManualAdjustments, kind: 'attack' | 'skill' | 'save' | 'damage' | null | undefined): ManualRollBonus;
/**
 * Normalize the roll-handler's `rollKind` strings
 * (`'attack' | 'skill' | 'saveBody' | 'saveMind' | 'saveSpirit' | ...`)
 * into the manual-adjustments bucket key.
 */
export declare function manualKindFromRollKind(rollKind: string | null | undefined): 'attack' | 'skill' | 'save' | 'damage' | null;
//# sourceMappingURL=manual-adjustments.d.ts.map