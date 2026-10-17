/**
 * Growth Form riders that sit on the active buff besides the stat package:
 * melee reach, forced-movement reduction, and Prone resistance.
 */
export interface GrowthFormRider {
    reachBonusM: number;
    pushReductionM: number;
    proneImmunity: 'none' | 'smaller' | 'standard';
    footprintHexes: number;
}
export declare function readGrowthFormRider(actor: any): GrowthFormRider | null;
/**
 * `smaller`: sources with a smaller footprint cannot knock you Prone.
 * `standard`: only a larger footprint than 1 hex can knock you Prone.
 */
export declare function growthFormBlocksProne(defender: any, attacker: any): boolean;
export declare function reduceForcedMeters(actor: any, meters: number): number;
//# sourceMappingURL=growth-form.d.ts.map