/**
 * Create summon actors and place tokens from Summon Bonds (V2) or legacy familiars.
 */
import type { BoundFamiliarRecord } from './familiar-bind.js';
import type { SummonBondRecord, SummonBodyRecord } from './summon-bond-bind.js';
export declare function buildSummonActorData(familiar: BoundFamiliarRecord, ownerActor: any): Record<string, unknown>;
export declare function createSummonActorForFamiliar(familiar: BoundFamiliarRecord, ownerActor: any): Promise<any | null>;
export declare function placeFamiliarToken(summonActor: any, ownerActor?: any | null): Promise<TokenDocument | null>;
export declare function deleteSummonSceneTokens(summonActorId: string | undefined): Promise<void>;
export declare function deleteSummonActor(summonActorId: string | undefined): Promise<void>;
/** Bond is source of truth — overwrite body actors on Ritual Apply. */
export declare function syncSummonBodyActorsFromBond(bond: SummonBondRecord, ownerActor: any): Promise<void>;
/** Build a world summon actor from a V2 Summon Bond body. */
export declare function buildSummonActorDataFromBond(bond: SummonBondRecord, body: SummonBodyRecord, ownerActor: any): Record<string, unknown>;
export declare function createSummonActorForBondBody(bond: SummonBondRecord, body: SummonBodyRecord, ownerActor: any): Promise<any | null>;
//# sourceMappingURL=familiar-actor-factory.d.ts.map