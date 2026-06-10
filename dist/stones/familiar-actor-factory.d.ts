/**
 * Create summon actors and place tokens from bound familiar records.
 */
import type { BoundFamiliarRecord } from './familiar-bind.js';
export declare function buildSummonActorData(familiar: BoundFamiliarRecord, ownerActor: any): Record<string, unknown>;
export declare function createSummonActorForFamiliar(familiar: BoundFamiliarRecord, ownerActor: any): Promise<any | null>;
export declare function placeFamiliarToken(summonActor: any, ownerActor?: any | null): Promise<TokenDocument | null>;
export declare function deleteSummonActor(summonActorId: string | undefined): Promise<void>;
//# sourceMappingURL=familiar-actor-factory.d.ts.map