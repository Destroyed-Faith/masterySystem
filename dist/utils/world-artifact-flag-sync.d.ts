/**
 * Sync `actorLevels` on world artifact tree roots.
 *
 * World Items are GM-owned; players updating their character must not call
 * `rootItem.setFlag` directly. GMs update locally; players emit a socket
 * request so a connected GM client applies the change.
 */
import { type ArtifactActorProgress } from './artifact-actor-rules.js';
export declare function canUpdateWorldItem(item: any): boolean;
/**
 * Replace the full `actorLevels` map on a world artifact root.
 * Returns true when applied locally; false when deferred to GM socket (non-fatal).
 */
export declare function setRootActorLevels(rootItem: any, levels: Record<string, unknown>): Promise<boolean>;
/** Merge one actor's progress entry onto the root's `actorLevels` flag. */
export declare function upsertRootActorProgress(rootItem: any, actorId: string, progress: ArtifactActorProgress): Promise<boolean>;
/** Convenience: merge progress using the root's default node id when omitted. */
export declare function upsertRootActorProgressForActor(rootItem: any, actorId: string, patch: Partial<ArtifactActorProgress> & {
    nodeId?: string;
}): Promise<boolean>;
/** GM client: apply player-requested world artifact flag updates. */
export declare function registerWorldArtifactFlagSyncSocket(): void;
//# sourceMappingURL=world-artifact-flag-sync.d.ts.map