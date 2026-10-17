/**
 * The ten Movement Powers as distinct token movements.
 *
 * A successful use spends one Movement and replaces that Movement's distance
 * and mode. The same technical Power cannot be used twice in one round.
 * Other Movements stay available. Phase Passage travels at Speed; its printed
 * number is material thickness and is not increased by Movement Enhancement.
 *
 * Flight, Leap, Wall Walk, Burrow, and Phase Passage need a player or GM
 * confirmation for height, surface, or material. That confirmation is not an
 * automatic collision or material scan.
 */
import { type ThreatPlan } from './threat-zone.js';
export type MovementPowerMode = 'ground-dash' | 'safe' | 'teleport' | 'teleport-ally' | 'flight' | 'leap' | 'wall-walk' | 'burrow' | 'phase-passage' | 'trample';
export interface MovementPowerLevel {
    templateId: string;
    name: string;
    mode: MovementPowerMode;
    level: number;
    available: boolean;
    /** Printed travel meters. Null for Phase Passage, which uses Speed. */
    travelMeters: number | null;
    verticalMeters: number;
    materialMeters: number;
    trampleDice: number;
    traversal: 'path' | 'teleport' | 'safe';
    /** Height, surface, or material is confirmed, not scanned. */
    needsGuidance: boolean;
}
export interface MovementGuidance {
    destinationVisible?: boolean;
    destinationFree?: boolean;
    landingLegal?: boolean;
    canRemainAloft?: boolean;
    surfaceContact?: boolean;
    suitableMaterial?: boolean;
    materialThicknessMeters?: number;
    endsOutsideSolid?: boolean;
    arcLegal?: boolean;
}
export declare function movementPowerLevel(templateId: string, level: number): MovementPowerLevel | null;
export declare function movementPowerBudget(input: {
    templateId: string;
    level: number;
    speed: number;
    enhancement?: number;
    reduced?: boolean;
}): {
    available: boolean;
    basisMeters: number;
    allowedMeters: number;
    materialMeters: number;
    level: MovementPowerLevel;
} | null;
/** Tokens of other creatures currently within `maxMeters` of the mover (top-left). */
export declare function listTeleportAllyCandidates(mover: any, tokens: any[], maxMeters?: number): Array<{
    token: any;
    meters: number;
    name: string;
}>;
/**
 * Ask for a willing ally within 2 m and place their destination with the same
 * relative offset as the mover's teleport. Used by the guided movement path.
 */
export declare function resolveTeleportAllyForGuidedMove(input: {
    mover: any;
    dest: {
        x: number;
        y: number;
        elevation?: number;
    };
    tokens?: any[];
}): Promise<{
    token: any;
    dest: {
        x: number;
        y: number;
        elevation?: number;
    };
    willing: boolean;
} | null>;
export declare function creaturesOnMovementPath(mover: any, from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}, tokens: any[]): any[];
export declare function executeMovementPower(input: {
    token: any;
    templateId: string;
    level: number;
    dest: {
        x: number;
        y: number;
        elevation?: number;
    };
    ally?: {
        token: any;
        dest: {
            x: number;
            y: number;
            elevation?: number;
        };
        willing: boolean;
    };
    tokens?: any[];
    guidance?: MovementGuidance;
    /** Already-rolled Trample total. Omitted totals are rolled as plain d8s. */
    trampleTotal?: number;
    combat?: {
        id?: string;
        round?: number;
        started?: boolean;
        combatant?: any;
    } | null;
}): Promise<{
    ok: boolean;
    reason: string;
    spent: boolean;
    traversal: string;
    allowedMeters: number;
    threat: ThreatPlan | null;
    trample: Array<{
        id: string;
        raw: number;
        applied: number;
    }>;
}>;
//# sourceMappingURL=movement-powers.d.ts.map