/**
 * Immutable post-character-creation progression snapshot (for GM reset).
 */
export interface PostCreationProgress {
    attributes: Record<string, number>;
    powerLevels: Record<string, number>;
}
export declare function buildPostCreationSnapshot(actor: any): PostCreationProgress;
export declare function actorHasPostCreationSnapshot(actor: any): boolean;
/**
 * GM: restore attributes and power levels to the post-creation snapshot;
 * return all earned XP to the available pool (totalSpent cleared).
 */
export declare function resetActorProgressToPostCreation(actor: any, options: {
    gmUserId: string;
    gmUserName: string;
}): Promise<{
    ok: boolean;
    error?: string;
}>;
//# sourceMappingURL=xp-post-creation.d.ts.map