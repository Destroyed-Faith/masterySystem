/**
 * Test/player "Start Encounter": pick scene tokens, create combat, run setup.
 * Players emit to the GM; the GM writes the Combat document.
 */
export interface SceneEncounterToken {
    tokenId: string;
    actorId: string;
    name: string;
    img: string;
    actorType: string;
    isCharacter: boolean;
    hidden: boolean;
}
export declare function listSceneEncounterTokens(scene?: any): SceneEncounterToken[];
export declare function requestStartEncounter(opts: {
    tokenIds: string[];
    openLocally: boolean;
    sceneId?: string;
}): Promise<void>;
export declare function createAndBeginEncounter(opts: {
    tokenIds: string[];
    sceneId: string;
    openLocally: boolean;
}): Promise<Combat | null>;
//# sourceMappingURL=start-encounter.d.ts.map