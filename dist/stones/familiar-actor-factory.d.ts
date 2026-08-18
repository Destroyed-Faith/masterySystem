/**
 * Create summon actors and place tokens from Summon Bonds (V2) or legacy familiars.
 */
import type { BoundFamiliarRecord } from './familiar-bind.js';
import type { SummonBondRecord, SummonBodyRecord } from './summon-bond-bind.js';
/** OWNER for every GM and the player assigned to the owner character (e.g. Fin). */
export declare function buildSummonActorOwnership(ownerActor: any, users?: Iterable<any> | null, currentUserId?: string | null): Record<string, number>;
export declare function buildSummonActorData(familiar: BoundFamiliarRecord, ownerActor: any): Record<string, unknown>;
export declare function createSummonActorForFamiliar(familiar: BoundFamiliarRecord, ownerActor: any): Promise<any | null>;
export declare function placeFamiliarToken(summonActor: any, ownerActor?: any | null): Promise<TokenDocument | null>;
export declare function deleteSummonSceneTokens(summonActorId: string | undefined): Promise<void>;
export declare function deleteSummonActor(summonActorId: string | undefined): Promise<void>;
/** Resolve a summon actor only by stored Foundry document id — never by name. */
export declare function getLiveSummonActor(summonActorId: string | undefined | null): any | null;
/** Overwrite one existing body actor. Refuses to create if the id is missing. */
export declare function updateSummonActorForBondBody(bond: SummonBondRecord, body: SummonBodyRecord, ownerActor: any): Promise<any | null>;
/** Bond is source of truth — overwrite body actors on Ritual Apply. */
export declare function syncSummonBodyActorsFromBond(bond: SummonBondRecord, ownerActor: any): Promise<void>;
/** Build a world summon actor from a V2 Summon Bond body. */
export declare function buildSummonActorDataFromBond(bond: SummonBondRecord, body: SummonBodyRecord, ownerActor: any): Record<string, unknown>;
export declare function createSummonActorForBondBody(bond: SummonBondRecord, body: SummonBodyRecord, ownerActor: any): Promise<any | null>;
//# sourceMappingURL=familiar-actor-factory.d.ts.map