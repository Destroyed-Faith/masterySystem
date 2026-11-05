/**
 * R-20 Artifact Library Diagnostic (READ-ONLY).
 *
 * Inspects world library keys, seedVersions, and which actor-owned artifacts
 * would be overwritten by a seedVersion refresh — without writing anything.
 *
 * Console (GM): await game.masterySystem.diagnoseArtifactLibrary()
 */
export interface R20ArtifactLibraryReport {
    format: 'mastery-r20-artifact-library-diagnostic';
    formatVersion: 1;
    generatedAt: string;
    systemVersion: string | null;
    expectedSeedVersion: number;
    holdArtifactLibraryAutoRefresh: boolean | null;
    worldLibrary: {
        artifactItemCount: number;
        distinctKeys: number;
        staleNodeCount: number;
        keys: Array<{
            echoArtifactKey: string;
            nodeCount: number;
            seedVersions: number[];
            staleNodes: number;
            wouldRefresh: boolean;
            nodes: Array<{
                id: string;
                name: string;
                nodeId: string;
                seedVersion: number;
                isRoot: boolean;
                folder: string | null;
                echoBound: unknown;
            }>;
        }>;
    };
    embeddedArtifacts: {
        count: number;
        linkedCount: number;
        wouldBePushedOnRefresh: number;
        items: Array<Record<string, unknown>>;
    };
    notes: string[];
}
export declare function buildArtifactLibraryDiagnosticReport(): R20ArtifactLibraryReport;
/**
 * Build the report, download JSON via Foundry saveDataToFile, notify GM.
 * Returns the report object for console inspection.
 */
export declare function diagnoseArtifactLibrary(options?: {
    download?: boolean;
}): Promise<R20ArtifactLibraryReport>;
//# sourceMappingURL=r20-artifact-library-diagnostic.d.ts.map