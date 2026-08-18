/**
 * Read and write native Foundry WallDocuments. The editor never invents its
 * own collision or vision rules — it only maps our three kinds onto V14 fields.
 */
import type { DoorState, EditorWallView, GeometryKind, Point, WallOrigin } from './types.js';
export declare function wallDoorTypes(): {
    NONE: number;
    DOOR: number;
    SECRET: number;
};
export declare function wallDoorStates(): {
    CLOSED: number;
    OPEN: number;
    LOCKED: number;
};
export declare function wallSense(): {
    NONE: number;
    LIMITED: number;
    NORMAL: number;
    PROXIMITY: number;
};
export declare function wallMove(): {
    NONE: number;
    NORMAL: number;
};
/** Central window defaults — proximity vision, movement still blocked. */
export declare const WINDOW_THRESHOLD: {
    sight: number;
    light: number;
    sound: number;
    attenuation: boolean;
};
export declare function coordsOf(wall: any): [Point, Point];
export declare function classifyWall(wall: any): {
    kind: GeometryKind;
    doorState: DoorState | null;
    secret: boolean;
};
export declare function readWallView(wall: any): EditorWallView;
export declare function readSceneWalls(scene: any): EditorWallView[];
export declare function wallPayload(a: Point, b: Point, kind: GeometryKind, options?: {
    doorState?: DoorState | null;
    origin?: WallOrigin;
    suggestionId?: string;
}): Record<string, unknown>;
export declare function typeChangePatch(kind: GeometryKind, doorState?: DoorState | null): Record<string, unknown>;
export declare function doorStatePatch(state: DoorState): Record<string, unknown>;
export declare function coordPatch(a: Point, b: Point): Record<string, unknown>;
export declare function createWalls(scene: any, payloads: Record<string, unknown>[]): Promise<any[]>;
export declare function updateWalls(scene: any, updates: Array<{
    _id: string;
} & Record<string, unknown>>): Promise<any[]>;
export declare function deleteWalls(scene: any, ids: string[]): Promise<any[]>;
export declare function snapshotWall(wall: any): Record<string, unknown>;
export declare function activeScene(): any | null;
//# sourceMappingURL=wall-adapter.d.ts.map