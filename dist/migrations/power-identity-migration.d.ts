/**
 * Batch E — Identity migration infrastructure (plan §10.3).
 * Writes ONLY identity fields. Never deletes documents. Fixture-safe.
 */
import type { ArtifactLevelProgressionRow } from '../types/item.js';
export declare const IDENTITY_BACKUP_FLAG = "identityMigrationBackup";
export declare const IDENTITY_REVIEW_FLAG = "identityReview";
export type IdentityMigrationDisposition = 'auto-stable-key' | 'auto-provenance' | 'manual' | 'skip';
export interface IdentityMigrationProposal {
    actorId?: string;
    itemId?: string;
    effectId?: string;
    path: string;
    disposition: IdentityMigrationDisposition;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    basis: string;
    selected: boolean;
}
export interface IdentityMigrationReport {
    generatedAt: string;
    dryRun: boolean;
    proposals: IdentityMigrationProposal[];
    applied: number;
    skipped: number;
}
/** Four-section dry-run report (plan §10.3). */
export interface IdentityMigrationDryRunSections {
    generatedAt: string;
    autoStableKey: IdentityMigrationProposal[];
    autoProvenance: IdentityMigrationProposal[];
    manual: IdentityMigrationProposal[];
    notActivatable: IdentityMigrationProposal[];
}
/** Narrow document shapes used by the migration (fixtures + Foundry). */
interface MigrationFlags {
    'mastery-system'?: Record<string, unknown> & {
        echoArtifactKey?: string;
        activeBuff?: unknown;
        artifactActiveBuff?: unknown;
        powerId?: string;
        powerTemplateId?: string;
        [IDENTITY_BACKUP_FLAG]?: IdentityBackupEntry | IdentityBackupEntry[];
        [IDENTITY_REVIEW_FLAG]?: {
            status: string;
            at: string;
            by: string;
        };
    };
}
interface MigrationItemSystem {
    templateId?: string | null;
    templateName?: string | null;
    rank?: number | string | null;
    echoKey?: string | null;
    levelProgression?: ArtifactLevelProgressionRow[];
    progressionPicks?: Array<{
        authoredStages?: ArtifactLevelProgressionRow[];
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}
interface MigrationItem {
    id?: string;
    type?: string;
    system?: MigrationItemSystem;
    flags?: MigrationFlags;
    update?: (data: Record<string, unknown>) => Promise<unknown> | unknown;
}
interface MigrationEffect {
    id?: string;
    flags?: MigrationFlags;
    update?: (data: Record<string, unknown>) => Promise<unknown> | unknown;
}
export interface IdentityBackupEntry {
    version: number;
    at: string;
    path: string;
    old: Record<string, unknown>;
}
interface MigrationActor {
    id?: string;
    items?: Iterable<MigrationItem> | MigrationItem[] | {
        values?: () => Iterable<MigrationItem>;
    };
    effects?: Iterable<MigrationEffect> | MigrationEffect[] | {
        values?: () => Iterable<MigrationEffect>;
    };
}
/** Build the four-section dry-run report from proposals. */
export declare function buildIdentityMigrationDryRunSections(proposals: IdentityMigrationProposal[]): IdentityMigrationDryRunSections;
export declare function formatIdentityMigrationDryRunMarkdown(sections: IdentityMigrationDryRunSections): string;
/** Dry-run / apply proposals for one actor (fixture-safe). */
export declare function planActorIdentityMigration(actor: MigrationActor | null | undefined): IdentityMigrationProposal[];
/**
 * Apply selected proposals. Mutates fixture actor objects in memory when
 * `update` methods are absent (tests). Never deletes. Writes backup flag.
 */
export declare function applyIdentityMigrationProposals(actor: MigrationActor, proposals: IdentityMigrationProposal[], opts?: {
    dryRun?: boolean;
}): Promise<IdentityMigrationReport>;
/**
 * Build a Foundry flag/system patch that restores `old` identity fields.
 * Keys whose backup value is null/undefined become `-=key` deletions
 * (Foundry merge does not remove keys on plain omit / `delete`).
 */
export declare function buildIdentityRollbackFieldPatch(old: Record<string, unknown>): Record<string, unknown>;
/**
 * Restore identity fields from backup flag array.
 * K7b: Foundry updates use explicit `-=key` deletions so newly introduced
 * identity keys (and the backup flag itself) are actually removed.
 */
export declare function rollbackIdentityMigration(actor: MigrationActor): Promise<number>;
/** Acknowledge remaining unresolved entry on a document. */
export declare function acknowledgeIdentityReview(doc: {
    flags?: MigrationFlags;
}, by: string): void;
/** Validate that a proposal's `after` resolves via resolvePowerIdentity. */
export declare function proposalResolves(proposal: IdentityMigrationProposal, rowOrItem: Record<string, unknown> | MigrationItem | null | undefined): boolean;
export {};
//# sourceMappingURL=power-identity-migration.d.ts.map