/**
 * Static audit of embedded tree powers (NewArtifactPowerData) against spec consistency rules.
 * Used by tests/scripts to produce reports; does not modify data.
 */
import { normalizeAoeSpec } from './power-spec-normalize.js';
import { MASTERY_TREE_POWER_MAP } from './powers/index.js';
function cloneJson(x) {
    if (typeof structuredClone === 'function')
        return structuredClone(x);
    return JSON.parse(JSON.stringify(x));
}
function isNewStructure(p) {
    return (!!p &&
        typeof p === 'object' &&
        'category' in p &&
        'levels' in p &&
        typeof p.levels === 'object' &&
        !Array.isArray(p.levels));
}
function auditSpecial(tree, powerName, path, raw, issues) {
    if (!raw || typeof raw !== 'object')
        return;
    const s = raw;
    const key = s.key;
    if (typeof key === 'string' && key !== key.toLowerCase()) {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'SPECIAL_KEY_NOT_LOWERCASE',
            detail: `key="${key}"`,
        });
    }
    if ('type' in s) {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'SPECIAL_HAS_TYPE_FIELD',
            detail: 'remove type alias; use key only',
        });
    }
    if ('value' in s) {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'SPECIAL_HAS_VALUE_FIELD',
            detail: 'use rank instead of value',
        });
    }
}
function auditAoe(tree, powerName, path, aoe, issues) {
    if (!aoe || typeof aoe !== 'object')
        return;
    const a = aoe;
    const shape = a.shape;
    const rm = a.radiusM;
    const sm = a.sizeM;
    if ((shape === 'radius' || shape === 'aura' || shape === 'zone') &&
        typeof rm === 'number' &&
        typeof sm === 'number') {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'AOE_RADIUS_AND_SIZE_M',
            detail: `shape=${shape} radiusM=${rm} sizeM=${sm}`,
        });
    }
    const before = cloneJson(aoe);
    const norm = normalizeAoeSpec(cloneJson(aoe));
    if (norm && JSON.stringify(norm) !== JSON.stringify(before)) {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'AOE_WOULD_NORMALIZE',
            detail: JSON.stringify({ before, after: norm }),
        });
    }
}
function auditMechanics(tree, powerName, path, mech, issues) {
    const m = mech;
    if (m.triggerLimit && typeof m.triggerLimit === 'object') {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'MECHANICS_HAS_TRIGGER_LIMIT',
            detail: 'use usageLimit only; triggerLimit is import-only',
        });
    }
    if (m.condition && m.conditionExpr) {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'MECHANICS_CONDITION_AND_EXPR',
            detail: 'set only one of condition or conditionExpr',
        });
    }
    const ms = m.modifySpecial;
    if (ms && typeof ms.type === 'string' && ms.type !== ms.type.toLowerCase()) {
        issues.push({
            tree,
            power: powerName,
            path,
            code: 'MODIFY_SPECIAL_TYPE_NOT_LOWERCASE',
            detail: `type="${ms.type}"`,
        });
    }
    const gnh = m.grantNextHitEffect;
    const arr = gnh?.specials;
    if (Array.isArray(arr)) {
        arr.forEach((sp, i) => {
            auditSpecial(tree, powerName, `${path}.grantNextHitEffect.specials[${i}]`, sp, issues);
        });
    }
}
/**
 * Audit one embedded power. Legacy `PowerDefinition` entries are skipped.
 */
export function auditEmbeddedTreePower(tree, power) {
    const issues = [];
    if (!isNewStructure(power))
        return issues;
    const p = power;
    const name = p.name ?? '(unnamed)';
    const levels = p.levels ?? {};
    for (const k of ['1', '2', '3', '4']) {
        const row = levels[k];
        if (!row || typeof row !== 'object')
            continue;
        const base = `L${k}`;
        const specs = row.specials;
        if (Array.isArray(specs)) {
            specs.forEach((sp, i) => {
                auditSpecial(tree, name, `${base}.specials[${i}]`, sp, issues);
            });
        }
        auditAoe(tree, name, `${base}.aoe`, row.aoe, issues);
        if (row.mechanics && typeof row.mechanics === 'object') {
            auditMechanics(tree, name, `${base}.mechanics`, row.mechanics, issues);
        }
    }
    if (p.mechanics && typeof p.mechanics === 'object') {
        auditMechanics(tree, name, 'power.mechanics', p.mechanics, issues);
    }
    return issues;
}
/** Run audit across every active mastery tree (embedded powers only). */
export function auditAllMasteryTreePowers() {
    const issues = [];
    for (const [tree, powers] of Object.entries(MASTERY_TREE_POWER_MAP)) {
        for (const p of powers) {
            issues.push(...auditEmbeddedTreePower(tree, p));
        }
    }
    return issues;
}
export function formatTreePowerAuditMarkdown(issues) {
    const byCode = new Map();
    for (const i of issues) {
        byCode.set(i.code, (byCode.get(i.code) ?? 0) + 1);
    }
    const summaryLines = byCode.size === 0
        ? ['']
        : [
            '## Summary by code',
            '',
            ...[...byCode.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([c, n]) => `- **${c}**: ${n}`),
            '',
        ];
    const lines = [
        '# Tree power spec audit',
        '',
        `Total findings: **${issues.length}** (embedded \`NewArtifactPowerData\` only; legacy \`PowerDefinition\` rows are skipped).`,
        '',
        ...summaryLines,
    ];
    if (!issues.length) {
        lines.push('No issues matched the current rules (lowercase keys, no type/value on specials, AoE sizeM/radiusM, mechanics triggerLimit / dual gates, etc.).');
        lines.push('');
        return lines.join('\n');
    }
    const byTree = new Map();
    for (const i of issues) {
        const arr = byTree.get(i.tree) ?? [];
        arr.push(i);
        byTree.set(i.tree, arr);
    }
    for (const [tree, arr] of [...byTree.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        lines.push(`## ${tree}`, '');
        for (const i of arr) {
            lines.push(`- **${i.power}** \`${i.path}\` — **${i.code}**: ${i.detail}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=tree-power-audit.js.map