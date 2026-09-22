/**
 * Pick a player for Influence Stone Powers (Regeneration + Movement).
 */
export interface AllyPlayerChoice {
    id: string;
    name: string;
    isSelf: boolean;
}
export declare function nextRegenerationValue(current: number, granted: number): number;
export declare function currentRegenerationValue(actor: any): number;
export declare function listSelectablePlayerActors(actors: Iterable<any> | null | undefined, casterId?: string): AllyPlayerChoice[];
export declare function promptSelectablePlayerTarget(options: {
    caster: any;
    title: string;
    hint: string;
}): Promise<any | null>;
export declare function applyRegenerationAndMove(target: any, regen: number, moveMeters: number): Promise<void>;
//# sourceMappingURL=ally-stone-target.d.ts.map