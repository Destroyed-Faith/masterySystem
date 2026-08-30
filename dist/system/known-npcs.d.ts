/**
 * Important NPCs released to players (portraits + names).
 * GM controls the roster; order is preserved in a world setting.
 */
export declare const KNOWN_NPCS_SETTING = "knownNpcs";
export declare const KNOWN_NPCS_COLLAPSED_SETTING = "knownNpcsBarCollapsed";
export declare const KNOWN_NPCS_POSITION_SETTING = "knownNpcsBarPosition";
export declare const FLAG_SCOPE = "mastery-system";
export interface KnownNpcsBarPosition {
    x: number;
    y: number;
}
export declare const DEFAULT_KNOWN_NPCS_BAR_POSITION: KnownNpcsBarPosition;
export interface KnownNpcsState {
    ids: string[];
}
export interface KnownNpcView {
    actorId: string;
    name: string;
    img: string;
    faction: string;
}
export declare function sanitizeKnownNpcIds(raw: unknown): string[];
export declare function sanitizeKnownNpcsBarPosition(raw: unknown): KnownNpcsBarPosition;
export declare function clampKnownNpcsBarPosition(pos: KnownNpcsBarPosition, viewport: {
    width: number;
    height: number;
}, size: {
    width: number;
    height: number;
}): KnownNpcsBarPosition;
export declare function portraitSrcForActor(actor: any): string;
export declare function toKnownNpcView(actor: any): KnownNpcView | null;
export declare function collectReleasedKnownNpcs(actors: {
    get?: (id: string) => any;
} | Iterable<any> | null | undefined, ids: string[]): KnownNpcView[];
export declare function listNpcsForGmDialog(actors: Iterable<any> | null | undefined, releasedIds: string[]): Array<KnownNpcView & {
    released: boolean;
}>;
export declare function registerKnownNpcSettings(): void;
export declare function readKnownNpcIds(): string[];
export declare function isKnownNpcReleased(actorId: string): boolean;
export declare function setKnownNpcReleased(actorId: string, released: boolean): Promise<string[]>;
export declare function toggleKnownNpc(actorId: string): Promise<{
    released: boolean;
    ids: string[];
}>;
export declare function moveKnownNpc(actorId: string, delta: -1 | 1): Promise<string[]>;
export declare function removeKnownNpc(actorId: string): Promise<string[]>;
export declare function readKnownNpcsBarCollapsed(): boolean;
export declare function setKnownNpcsBarCollapsed(collapsed: boolean): Promise<void>;
export declare function readKnownNpcsBarPosition(): KnownNpcsBarPosition;
export declare function setKnownNpcsBarPosition(pos: KnownNpcsBarPosition): Promise<KnownNpcsBarPosition>;
//# sourceMappingURL=known-npcs.d.ts.map