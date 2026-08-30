/**
 * Shared read helpers for a creature's active Special Effects.
 *
 * On-hit specials are stored on the actor as `system.statusEffects[]` entries
 * (`{ id?, name?, value? }`). These helpers resolve them to canonical ids and
 * numeric values so derived-stat maluses (Slow, Corrode, Expose, Soulburn,
 * Weaken, Disoriented), the start-of-turn Tick, and combat riders can read a
 * single normalized view.
 */
export interface ActiveSpecial {
    id: string;
    value: number;
}
interface RawStatusEntry {
    id?: string;
    name?: string;
    value?: number | null;
}
/** Resolve the canonical special id for a stored status entry. */
export declare function statusEntryId(entry: RawStatusEntry): string | undefined;
/** Normalized list of a creature's active Specials (id + value). */
export declare function readActiveSpecials(actor: any): ActiveSpecial[];
/**
 * Total value of a given active Special on a creature (0 when absent).
 * Diminishing Specials track a single stack value, so entries are summed.
 */
export declare function getActiveSpecialValue(actor: any, id: string): number;
/**
 * Whether a given Special is present on a creature at all — including
 * valueless conditions (Stunned, Prone, Immovable) whose entries carry no
 * numeric stack.
 */
export declare function hasActiveSpecial(actor: any, id: string): boolean;
/** Coerce Foundry object-shaped `statusEffects` to a real array. */
export declare function coerceStatusEffectsArray(raw: unknown): RawStatusEntry[];
/**
 * Reduce (or remove) one statusEffects entry by `steps`.
 * Non-positive / missing values are treated as a single stack (any reduce removes).
 */
export declare function reduceStatusEffectAt(list: unknown, index: number, steps: number): RawStatusEntry[];
export {};
//# sourceMappingURL=active-specials.d.ts.map