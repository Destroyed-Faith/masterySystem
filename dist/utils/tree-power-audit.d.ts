/**
 * Static audit of embedded tree powers (NewArtifactPowerData) against spec consistency rules.
 * Used by tests/scripts to produce reports; does not modify data.
 */
export type TreePowerAuditCode = 'SPECIAL_KEY_NOT_LOWERCASE' | 'SPECIAL_HAS_TYPE_FIELD' | 'SPECIAL_HAS_VALUE_FIELD' | 'AOE_RADIUS_AND_SIZE_M' | 'AOE_WOULD_NORMALIZE' | 'MECHANICS_HAS_TRIGGER_LIMIT' | 'MECHANICS_CONDITION_AND_EXPR' | 'MODIFY_SPECIAL_TYPE_NOT_LOWERCASE';
export interface TreePowerAuditIssue {
    tree: string;
    power: string;
    /** e.g. L3 or mechanics */
    path: string;
    code: TreePowerAuditCode;
    detail: string;
}
/**
 * Audit one embedded power. Legacy `PowerDefinition` entries are skipped.
 */
export declare function auditEmbeddedTreePower(tree: string, power: unknown): TreePowerAuditIssue[];
/** Run audit across every active mastery tree (embedded powers only). */
export declare function auditAllMasteryTreePowers(): TreePowerAuditIssue[];
export declare function formatTreePowerAuditMarkdown(issues: TreePowerAuditIssue[]): string;
//# sourceMappingURL=tree-power-audit.d.ts.map