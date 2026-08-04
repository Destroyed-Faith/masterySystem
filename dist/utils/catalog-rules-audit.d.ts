/**
 * Rules ↔ Foundry catalog audit engine.
 *
 * Compares power / artifact catalogs against docs/Rules/*.md and curated
 * expected manifests. Pure & testable — no Foundry runtime required.
 */
import type { PowerTemplate } from './powers/templates/_shared.js';
export type CatalogAuditStatus = 'correct' | 'corrected' | 'missing' | 'obsolete' | 'requires-rule-decision';
export type CatalogAuditCategory = 'active' | 'activeBuff' | 'passive' | 'reaction' | 'movement' | 'artifact' | 'artifact-rule';
export interface CatalogAuditEntry {
    category: CatalogAuditCategory;
    id: string;
    name: string;
    status: CatalogAuditStatus;
    notes: string;
}
export interface CatalogAuditSummary {
    correct: number;
    corrected: number;
    missing: number;
    obsolete: number;
    'requires-rule-decision': number;
}
export interface CatalogAuditReport {
    version: string;
    generatedAt: string;
    summary: CatalogAuditSummary;
    entries: CatalogAuditEntry[];
}
export interface CatalogAuditOptions {
    /** Repo root (defaults to package root inferred from this module). */
    rootDir?: string;
    /** System / package version string written into the report. */
    version?: string;
    /** ISO timestamp; defaults to now. */
    generatedAt?: string;
    /**
     * Template IDs that were corrected in this audit pass (curves / values
     * aligned to Rules). Reported as status `corrected` instead of `correct`.
     */
    correctedIds?: ReadonlySet<string>;
    /** Optional preloaded Rules markdown (keyed by basename without .md). */
    rulesMarkdown?: Partial<Record<RulesBook, string>>;
}
export type RulesBook = 'actives' | 'active-buffs' | 'passives' | 'reactions' | 'movement' | 'artefacts';
/** Awareness / Heightened Senses — retired; Sense Slot replaces them. */
export declare const RETIRED_AWARENESS_PASSIVE_IDS: readonly ["passive-heightened-senses", "passive-awareness-evade", "passive-awareness-damage", "conditional-passive-awareness-evade", "conditional-passive-awareness-damage"];
/**
 * Template IDs corrected against Rules/active-buffs.md in the catalog audit pass
 * (Active Buff Evade pure curve + Evade combinations).
 */
export declare const AUDIT_CORRECTED_TEMPLATE_IDS: Set<string>;
/** Expected Rules Active Buff display names → Foundry templateId. */
export declare const RULES_EXPECTED_ACTIVE_BUFFS: ReadonlyArray<{
    rulesName: string;
    id: string;
}>;
/** Expected Rules Reaction names → Foundry templateId. */
export declare const RULES_EXPECTED_REACTIONS: ReadonlyArray<{
    rulesName: string;
    id: string;
}>;
/** Expected Movement Power names. */
export declare const RULES_EXPECTED_MOVEMENT: ReadonlyArray<{
    rulesName: string;
    id: string;
}>;
/**
 * Curated Active families (Rules special-first + named templates).
 * MD parsing alone is ambiguous for Special-slot expansions.
 */
export declare const RULES_EXPECTED_ACTIVES: ReadonlyArray<{
    rulesName: string;
    id: string;
}>;
/**
 * Foundry support / empowerment passives (not obsolete — system scaffolding
 * for Active Buff empowerment & extension axes).
 */
export declare const SYSTEM_SUPPORT_PASSIVE_IDS: ReadonlyArray<{
    rulesName: string;
    id: string;
}>;
/** Core Passives expected from Rules/passives.md (non-awareness). */
export declare const RULES_EXPECTED_PASSIVES: ReadonlyArray<{
    rulesName: string;
    id: string;
}>;
/** Named artifacts expected from Rules/artefacts.md (+ echo set). */
export declare const RULES_EXPECTED_ARTIFACTS: ReadonlyArray<{
    rulesName: string;
    id: string;
    source: 'echo' | 'general';
}>;
/** Expected Active Buff: Evade L1…L16 values (Rules). */
export declare const RULES_AB_EVADE_CURVE: readonly [8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92, 98];
/** Expected Active Buff: Armor L1…L16 values (Rules). */
export declare const RULES_AB_ARMOR_CURVE: readonly [5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65];
/** Extract `Active Buff: X` / `Reaction: X` style titles from Rules markdown. */
export declare function parsePrefixedPowerNames(markdown: string, prefix: string): string[];
/** Passive names from `<h3>Name (Passive: …)</h3>` and `Passive: X` headings. */
export declare function parsePassiveNamesFromRules(markdown: string): string[];
/** Movement power section titles from Rules/movement.md. */
export declare function parseMovementNamesFromRules(markdown: string): string[];
/** Detect Artifact Summon Token Generator conversion table (4 tokens / stone). */
export declare function parseArtifactSummonTokenRatio(markdown: string): number | null;
export interface StructuralIssue {
    id: string;
    name: string;
    issue: string;
}
/** Every template must have 16 levels, non-empty name, and a category. */
export declare function checkTemplateStructure(template: PowerTemplate): StructuralIssue[];
/** Read a curve of a numeric mechanics field across levels 1–16. */
export declare function readMechanicsCurve(template: PowerTemplate, field: 'armor' | 'evade' | 'critical'): Array<number | undefined>;
/**
 * Run the full Rules ↔ Foundry catalog audit and return a report object.
 */
export declare function runCatalogRulesAudit(options?: CatalogAuditOptions): CatalogAuditReport;
/** Write audit report JSON to docs/catalog-audit.json (or custom path). */
export declare function writeCatalogAuditReport(report: CatalogAuditReport, outPath: string): void;
/** Convenience: run audit and write docs/catalog-audit.json under rootDir. */
export declare function runAndWriteCatalogAudit(options?: CatalogAuditOptions & {
    outPath?: string;
}): CatalogAuditReport;
/** Entries that should fail CI unless documented as expected. */
export declare function getBlockingAuditEntries(report: CatalogAuditReport, opts?: {
    allowMissingIds?: ReadonlySet<string>;
    allowObsoleteIds?: ReadonlySet<string>;
}): CatalogAuditEntry[];
//# sourceMappingURL=catalog-rules-audit.d.ts.map