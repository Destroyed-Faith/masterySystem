/**
 * v0.9.9.5 Movement Reduction on the actual movement distance.
 *
 * Order: normal distance for this action (Dash doubles Speed first), then
 * Movement Enhancement once, then one halve. A second Movement Action is
 * halved from that same total, not from the already-halved remainder.
 * Forced movement and Reactions are not Movement Actions.
 */
export type MovementActionKind = 'move' | 'dash' | 'disengage' | 'flee' | 'power' | 'forced' | 'reaction';
export declare function movementActionMeters(input: {
    kind: MovementActionKind;
    speed: number;
    enhancement?: number;
    /** Printed Movement Power distance, before enhancement and before the halve. */
    powerMeters?: number;
    reduced: boolean;
}): {
    meters: number;
    movementAction: boolean;
};
export declare function enhancementMetersFromActor(actor: any): number;
export declare function classifyTokenMovement(tokenDoc: any): MovementActionKind | null;
export declare function sceneMeters(tokenDoc: any, dx: number, dy: number): number;
/**
 * Mutates `change` so a Movement Action cannot land past its once-halved allowance.
 * Guided commits that are already inside the allowance are left untouched.
 * Forced movement and Reactions are not clamped and do not count as a Movement Action.
 */
export declare function applyMovementCapToTokenChange(tokenDoc: any, change: {
    x?: number;
    y?: number;
}, combat?: {
    id?: string;
    round?: number;
} | null): {
    clamped: boolean;
    allowedMeters: number;
    movedMeters: number;
    movementAction: boolean;
    feedback: string;
};
//# sourceMappingURL=movement-allowance.d.ts.map