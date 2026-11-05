/**
 * Read-only identity preflight (Batch B / plan §9.2, K4).
 * Never writes documents. Used by audit:identity, GM whispers, and report export.
 */
import { resolvePowerIdentity } from './power-identity.js';
import { ALL_POWER_TEMPLATES } from './powers/templates/index.js';
import { ECHO_ARTIFACTS } from './echo-artifacts.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';
import { enrichArtifactRowIdentity, lookupArtifactDefinition, resolveCanonicalArtifactKey, resolveEchoArtifactKey, rowHasStructuredIdentity, } from './artifact-row-identity.js';
import { buildEchoArtifactTree } from '../artifacts/echo-artifact-tree-builder.js';
const NON_ACTIVATABLE_TYPES = /stone\s*(power\s*)?support|stone\s*pool|stone\s*refresh|^passive$|base\s*value/i;
function exactTemplateNameMap() {
    const counts = new Map();
    const ids = new Map();
    for (const t of ALL_POWER_TEMPLATES) {
        const name = String(t.templateName || '').trim();
        if (!name)
            continue;
        counts.set(name, (counts.get(name) || 0) + 1);
        ids.set(name, t.templateId);
    }
    const out = new Map();
    for (const [name, id] of ids) {
        if (counts.get(name) === 1)
            out.set(name, id);
    }
    return out;
}
let cachedNameMap = null;
function templateNameMap() {
    if (!cachedNameMap)
        cachedNameMap = exactTemplateNameMap();
    return cachedNameMap;
}
function catalogArtifactByKey(key) {
    // Alias-aware (titanScarsIntellect → titanScars, etc.).
    return lookupArtifactDefinition(key);
}
/** Cache builder trees so actor scans do not rebuild per row. */
const builderTreeCache = new Map();
function builderTreeFor(def) {
    const cacheKey = String(def.key || '');
    if (!cacheKey)
        return null;
    let tree = builderTreeCache.get(cacheKey);
    if (!tree) {
        try {
            tree = buildEchoArtifactTree(def);
            builderTreeCache.set(cacheKey, tree);
        }
        catch {
            return null;
        }
    }
    return tree;
}
function snapshotIdentity(row) {
    const rankRaw = row?.rank;
    const rankNum = rankRaw == null || rankRaw === '' ? null : Number(rankRaw);
    return {
        powerTemplateId: row?.powerTemplateId ? String(row.powerTemplateId) : null,
        artifactFunctionId: row?.artifactFunctionId ? String(row.artifactFunctionId) : null,
        rank: Number.isFinite(rankNum) ? Math.floor(rankNum) : null,
        limited: row?.limited === true ? true : row?.limited === false ? false : null,
    };
}
/**
 * Authoritative compiled row for (canonicalKey, currentLevel, row.level).
 * Prefers the builder (same source packs are rebuilt from); falls back to
 * source levelProgression when the builder has no matching row.
 */
function authoritativeCatalogRow(def, currentLevel, rowLevel) {
    const tree = builderTreeFor(def);
    if (tree) {
        const node = tree.nodes.find((n) => Number(n.level) === Number(currentLevel));
        const system = (node?.itemData?.system ?? null);
        const rows = system?.levelProgression;
        if (Array.isArray(rows)) {
            const match = rows.find((r) => Number(r?.level) === Number(rowLevel));
            if (match)
                return match;
        }
    }
    return (def.levelProgression?.find((r) => Number(r?.level) === Number(rowLevel)) ?? null);
}
/** True when an existing structured identity disagrees with the catalog/builder. */
function structuredIdentitiesConflict(observed, expected) {
    const obsHas = !!(observed.powerTemplateId || observed.artifactFunctionId);
    const expHas = !!(expected.powerTemplateId || expected.artifactFunctionId);
    if (!obsHas || !expHas)
        return false;
    if (observed.powerTemplateId !== expected.powerTemplateId)
        return true;
    if (observed.artifactFunctionId !== expected.artifactFunctionId)
        return true;
    if (expected.limited === true && observed.limited !== true)
        return true;
    if (expected.limited === false && observed.limited === true)
        return true;
    if (observed.rank != null &&
        expected.rank != null &&
        observed.rank !== expected.rank) {
        return true;
    }
    return false;
}
function pushDiagnostic(report, entry) {
    report.totals.sources += 1;
    report.totals.unresolved += 1;
    if (entry.severity === 'blocks-activation')
        report.totals.blocksActivation += 1;
    else if (entry.severity === 'omits-contribution')
        report.totals.omitsContribution += 1;
    else
        report.totals.informational += 1;
    report.entries.push(entry);
}
/**
 * Detect wrong-but-valid identities and legacy alias keys (Forge Reality Audit W1).
 * Never writes. Never proposes auto-migration for these diagnostics.
 */
function collectArtifactCatalogDiagnostics(report, actor, item) {
    const storedKey = resolveEchoArtifactKey(item);
    if (!storedKey)
        return;
    const { canonicalKey, isAlias } = resolveCanonicalArtifactKey(storedKey);
    const def = catalogArtifactByKey(storedKey);
    const actorRef = {
        actorId: actor?.id ? String(actor.id) : undefined,
        actorName: actor?.name ? String(actor.name) : undefined,
        itemId: item?.id ? String(item.id) : undefined,
        itemName: item?.name ? String(item.name) : undefined,
        echoArtifactKey: storedKey,
    };
    if (isAlias) {
        pushDiagnostic(report, {
            ok: false,
            reason: 'legacy-alias-key',
            severity: 'informational',
            diagnostic: `echoArtifactKey "${storedKey}" is a legacy alias of "${canonicalKey}". Remap only after GM review — do not auto-migrate affinity/progression.`,
            ref: actorRef,
            disposition: 'manual',
            affected: 'unknown',
            canonicalArtifactKey: canonicalKey,
        });
    }
    if (!def)
        return;
    const defWithKey = {
        key: String(def.key || canonicalKey),
        levelProgression: def.levelProgression,
    };
    const currentLevel = Number(item.system?.currentLevel ?? item.system?.level ?? 10);
    const rows = Array.isArray(item.system?.levelProgression) ? item.system.levelProgression : [];
    for (const rawRow of rows) {
        if (Number(rawRow?.level) > currentLevel)
            continue;
        // Only flag wrong-but-valid identities. Blank rows are handled by resolve + suggest.
        if (!rowHasStructuredIdentity(rawRow))
            continue;
        const expectedRow = authoritativeCatalogRow(defWithKey, currentLevel, Number(rawRow.level));
        if (!expectedRow || !rowHasStructuredIdentity(expectedRow))
            continue;
        const observed = snapshotIdentity(rawRow);
        const expected = snapshotIdentity(expectedRow);
        if (!structuredIdentitiesConflict(observed, expected))
            continue;
        pushDiagnostic(report, {
            ok: false,
            reason: 'catalog-divergence',
            severity: 'informational',
            diagnostic: `Row L${rawRow.level} identity disagrees with catalog/builder for ${canonicalKey} at artifact level ${currentLevel}. Manual review required — do not overwrite customized progressions.`,
            ref: { ...actorRef, rowLevel: Number(rawRow.level) },
            disposition: 'manual',
            affected: 'activation',
            observedIdentity: observed,
            expectedIdentity: expected,
            canonicalArtifactKey: canonicalKey,
            // Intentionally omit suggestedIdentity — never auto-migrate divergences.
        });
    }
}
/**
 * Migration suggestion for unresolved sources. Never guesses under ambiguity.
 */
export function suggestIdentityForUnresolved(opts) {
    if (opts.kind === 'power-item' && opts.item) {
        const sys = opts.item.system ?? {};
        if (sys.templateId)
            return undefined;
        const exact = sys.templateName
            ? templateNameMap().get(String(sys.templateName).trim())
            : undefined;
        if (exact) {
            return {
                templateId: exact,
                rank: Number(sys.rank) || Number(sys.level) || 1,
                basis: 'templateName-exact',
            };
        }
        return undefined;
    }
    if (opts.kind === 'artifact-row' && opts.row) {
        if (opts.row.powerTemplateId || opts.row.artifactFunctionId)
            return undefined;
        const key = resolveEchoArtifactKey(opts.item);
        if (!key)
            return undefined;
        const def = catalogArtifactByKey(key);
        const catalogRow = def?.levelProgression?.find((r) => Number(r.level) === Number(opts.row.level));
        if (!catalogRow)
            return undefined;
        if (!catalogRow.powerTemplateId && !catalogRow.artifactFunctionId)
            return undefined;
        return {
            templateId: catalogRow.powerTemplateId || undefined,
            artifactFunctionId: catalogRow.artifactFunctionId,
            rank: catalogRow.rank != null
                ? Number(catalogRow.rank)
                : [4, 10, 16][Math.max(0, Math.min(2, Math.floor((Number(opts.row.level) - 1) / 3)))],
            basis: 'echoArtifactKey+level',
        };
    }
    if (opts.kind === 'active-effect' && opts.effect) {
        const flags = opts.effect.flags?.['mastery-system'] || {};
        if (flags.powerTemplateId)
            return undefined;
        const powerId = flags.powerId;
        if (!powerId || !opts.actorItems)
            return undefined;
        const power = opts.actorItems.find((i) => i?.id === powerId);
        const tid = power?.system?.templateId ? String(power.system.templateId) : '';
        if (!tid)
            return undefined;
        return {
            templateId: tid,
            rank: Number(power?.system?.rank) || Number(flags.rank) || 1,
            basis: 'flags.powerId',
        };
    }
    return undefined;
}
function affectedFromUnresolved(u) {
    if (u.severity === 'omits-contribution')
        return 'buff-mechanics';
    if (u.reason === 'special-key-unknown')
        return 'specials';
    return 'activation';
}
function dispositionForRow(row, u) {
    const type = String(row?.type || '');
    if (NON_ACTIVATABLE_TYPES.test(type) && !row?.powerTemplateId && !row?.artifactFunctionId) {
        return 'not-activatable';
    }
    if (u.suggestedIdentity?.basis === 'echoArtifactKey+level')
        return 'auto-stable-key';
    if (u.suggestedIdentity?.basis === 'templateName-exact')
        return 'auto-provenance';
    if (u.suggestedIdentity?.basis === 'flags.powerId')
        return 'auto-stable-key';
    return 'manual';
}
function emptyReport(scope) {
    return {
        generatedAt: new Date().toISOString(),
        systemVersion: String(globalThis?.game?.system?.version ?? 'dev'),
        scope,
        totals: {
            sources: 0,
            resolved: 0,
            unresolved: 0,
            blocksActivation: 0,
            omitsContribution: 0,
            informational: 0,
        },
        entries: [],
        errors: [],
    };
}
function pushResult(report, result, row, opts) {
    report.totals.sources += 1;
    if (result.ok) {
        report.totals.resolved += 1;
        return;
    }
    report.totals.unresolved += 1;
    const withSuggestion = opts?.suggested
        ? { ...result, suggestedIdentity: opts.suggested }
        : result.suggestedIdentity
            ? result
            : result;
    const disposition = dispositionForRow(row, withSuggestion);
    const hasAnyIdentityField = !!(row?.powerTemplateId || row?.artifactFunctionId);
    let severity = withSuggestion.severity;
    if (disposition === 'not-activatable') {
        severity = 'informational';
    }
    else if (opts?.catalogScan &&
        withSuggestion.reason === 'missing-identity' &&
        !hasAnyIdentityField) {
        severity = 'informational';
    }
    if (severity === 'blocks-activation')
        report.totals.blocksActivation += 1;
    else if (severity === 'omits-contribution')
        report.totals.omitsContribution += 1;
    else
        report.totals.informational += 1;
    report.entries.push({
        ...withSuggestion,
        severity,
        affected: affectedFromUnresolved(withSuggestion),
        disposition,
    });
}
function asList(collection) {
    if (!collection)
        return [];
    if (Array.isArray(collection))
        return collection;
    if (typeof collection.values === 'function')
        return Array.from(collection.values());
    return Array.from(collection);
}
/** Scan catalog templates (sanity: every template resolves by id). */
export function preflightCatalogTemplates() {
    const report = emptyReport('catalog');
    for (const tpl of ALL_POWER_TEMPLATES) {
        try {
            const result = resolvePowerIdentity({
                kind: 'power-item',
                item: {
                    name: tpl.templateName,
                    system: { templateId: tpl.templateId, rank: 1, category: tpl.category },
                },
            });
            pushResult(report, result, null);
        }
        catch (err) {
            report.errors.push({
                where: `template:${tpl.templateId}`,
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }
    return report;
}
/**
 * Scan echo + general artifact source definitions (not pack JSON).
 * Activable rows must resolve; stone/passive without identity → informational.
 */
export function preflightArtifactCatalog() {
    const report = emptyReport('catalog');
    const defs = [
        ...Object.values(ECHO_ARTIFACTS || {}),
        ...Object.values(GENERAL_ARTIFACTS || {}),
    ];
    for (const def of defs) {
        if (!def?.levelProgression)
            continue;
        const key = String(def.key || '');
        for (const row of def.levelProgression) {
            try {
                const type = String(row?.type || '');
                const activatable = !!row?.powerTemplateId ||
                    !!row?.artifactFunctionId ||
                    /active|reaction|movement|transformation|melee|ranged|artifact\s*active/i.test(type);
                if (!activatable) {
                    report.totals.sources += 1;
                    report.totals.resolved += 1;
                    continue;
                }
                const result = resolvePowerIdentity({
                    kind: 'artifact-row',
                    artifact: {
                        name: def.name,
                        flags: { 'mastery-system': { echoArtifactKey: key } },
                    },
                    row,
                });
                const suggested = result.ok
                    ? undefined
                    : suggestIdentityForUnresolved({
                        kind: 'artifact-row',
                        item: { flags: { 'mastery-system': { echoArtifactKey: key } } },
                        row,
                    });
                pushResult(report, result, row, { catalogScan: true, suggested });
            }
            catch (err) {
                report.errors.push({
                    where: `artifact:${key}:L${row?.level}`,
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        }
    }
    return report;
}
/** Scan a Foundry actor (power items, artifact rows, active buff effects). Read-only. */
export function preflightActor(actor) {
    const report = emptyReport('actor');
    if (!actor)
        return report;
    let items = [];
    try {
        items = asList(actor.items);
    }
    catch (err) {
        report.errors.push({
            where: `actor:${actor?.id || '?'}.items`,
            message: err instanceof Error ? err.message : String(err),
        });
        return report;
    }
    for (const item of items) {
        try {
            if (item?.type === 'power') {
                const result = resolvePowerIdentity({ kind: 'power-item', item });
                const suggested = result.ok
                    ? undefined
                    : suggestIdentityForUnresolved({ kind: 'power-item', item });
                pushResult(report, result, null, { suggested });
            }
            if (item?.type === 'artifact') {
                // Wrong-but-valid / alias diagnostics first (read-only; never auto-migrate).
                collectArtifactCatalogDiagnostics(report, actor, item);
                const rows = Array.isArray(item.system?.levelProgression)
                    ? item.system.levelProgression
                    : [];
                const current = Number(item.system?.currentLevel ?? item.system?.level ?? 10);
                for (const rawRow of rows) {
                    if (Number(rawRow?.level) > current)
                        continue;
                    // Same temporary read-model as Radial (K2).
                    const row = enrichArtifactRowIdentity(item, rawRow);
                    const type = String(row?.type || '');
                    const activatable = !!row?.powerTemplateId ||
                        !!row?.artifactFunctionId ||
                        /active|reaction|movement|transformation|melee|ranged/i.test(type);
                    if (!activatable) {
                        report.totals.sources += 1;
                        report.totals.resolved += 1;
                        continue;
                    }
                    const result = resolvePowerIdentity({ kind: 'artifact-row', artifact: item, row });
                    // Suggest against the *raw* row so GM still sees what migration would write
                    // even when the temporary enrich already resolved the read path.
                    const suggested = result.ok
                        ? undefined
                        : suggestIdentityForUnresolved({ kind: 'artifact-row', item, row: rawRow });
                    pushResult(report, result, row, { suggested });
                }
            }
        }
        catch (err) {
            report.errors.push({
                where: `actor:${actor?.id || '?'}.item:${item?.id || '?'}`,
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }
    let effects = [];
    try {
        effects = asList(actor.effects);
    }
    catch (err) {
        report.errors.push({
            where: `actor:${actor?.id || '?'}.effects`,
            message: err instanceof Error ? err.message : String(err),
        });
        return report;
    }
    for (const effect of effects) {
        try {
            const flags = effect?.flags?.['mastery-system'];
            if (!flags?.activeBuff && !flags?.artifactActiveBuff)
                continue;
            const result = resolvePowerIdentity({ kind: 'active-effect', effect });
            const suggested = result.ok
                ? undefined
                : suggestIdentityForUnresolved({
                    kind: 'active-effect',
                    effect,
                    actorItems: items,
                });
            pushResult(report, result, null, { suggested });
        }
        catch (err) {
            report.errors.push({
                where: `actor:${actor?.id || '?'}.effect:${effect?.id || '?'}`,
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }
    return report;
}
export function runIdentityPreflight(scope) {
    try {
        if (scope.kind === 'catalog' || scope.kind === 'packs') {
            const a = preflightCatalogTemplates();
            const b = preflightArtifactCatalog();
            return {
                generatedAt: new Date().toISOString(),
                systemVersion: a.systemVersion,
                scope: scope.kind,
                totals: {
                    sources: a.totals.sources + b.totals.sources,
                    resolved: a.totals.resolved + b.totals.resolved,
                    unresolved: a.totals.unresolved + b.totals.unresolved,
                    blocksActivation: a.totals.blocksActivation + b.totals.blocksActivation,
                    omitsContribution: a.totals.omitsContribution + b.totals.omitsContribution,
                    informational: a.totals.informational + b.totals.informational,
                },
                entries: [...a.entries, ...b.entries],
                errors: [...(a.errors || []), ...(b.errors || [])],
            };
        }
        if (scope.kind === 'actor')
            return preflightActor(scope.actor);
        const report = emptyReport('world');
        let actors = [];
        try {
            actors = asList(globalThis?.game?.actors);
        }
        catch (err) {
            report.errors.push({
                where: 'game.actors',
                message: err instanceof Error ? err.message : String(err),
            });
            return report;
        }
        for (const actor of actors) {
            const part = preflightActor(actor);
            report.totals.sources += part.totals.sources;
            report.totals.resolved += part.totals.resolved;
            report.totals.unresolved += part.totals.unresolved;
            report.totals.blocksActivation += part.totals.blocksActivation;
            report.totals.omitsContribution += part.totals.omitsContribution;
            report.totals.informational += part.totals.informational;
            report.entries.push(...part.entries);
            report.errors.push(...(part.errors || []));
        }
        return report;
    }
    catch (err) {
        const report = emptyReport(scope.kind);
        report.errors.push({
            where: `runIdentityPreflight:${scope.kind}`,
            message: err instanceof Error ? err.message : String(err),
        });
        return report;
    }
}
/** Markdown summary for GM chat / clipboard. */
export function formatIdentityPreflightMarkdown(report) {
    const lines = [
        `# Identity Preflight (${report.scope})`,
        '',
        `Generated: ${report.generatedAt}`,
        `System: ${report.systemVersion}`,
        '',
        `Sources: ${report.totals.sources} · Resolved: ${report.totals.resolved} · Unresolved: ${report.totals.unresolved}`,
        `Blocking: ${report.totals.blocksActivation} · Omits contribution: ${report.totals.omitsContribution} · Informational: ${report.totals.informational}`,
        '',
    ];
    const auto = report.entries.filter((e) => e.disposition.startsWith('auto')).length;
    const manual = report.entries.filter((e) => e.disposition === 'manual').length;
    lines.push(`Disposition: ${auto} auto · ${manual} manual · ${report.entries.filter((e) => e.disposition === 'not-activatable').length} not-activatable`);
    lines.push('');
    if (report.entries.length === 0) {
        lines.push('_No unresolved entries._');
    }
    else {
        lines.push('| Severity | Reason | Actor/Item | Disposition | Detail |');
        lines.push('|---|---|---|---|---|');
        for (const e of report.entries.slice(0, 200)) {
            const who = [
                e.ref.actorName,
                e.ref.itemName,
                e.ref.echoArtifactKey &&
                    (e.ref.rowLevel != null ? `${e.ref.echoArtifactKey} L${e.ref.rowLevel}` : e.ref.echoArtifactKey),
            ]
                .filter(Boolean)
                .join(' · ');
            let detail = '—';
            if (e.reason === 'catalog-divergence' && e.observedIdentity && e.expectedIdentity) {
                const fmt = (s) => `tid=${s.powerTemplateId ?? '∅'} afid=${s.artifactFunctionId ?? '∅'} r=${s.rank ?? '∅'} lim=${s.limited ?? '∅'}`;
                detail = `obs{${fmt(e.observedIdentity)}} ≠ exp{${fmt(e.expectedIdentity)}} (${e.canonicalArtifactKey || '—'})`;
            }
            else if (e.reason === 'legacy-alias-key') {
                detail = `${e.ref.echoArtifactKey} → ${e.canonicalArtifactKey || '?'}`;
            }
            else if (e.suggestedIdentity) {
                detail = `${e.suggestedIdentity.templateId || e.suggestedIdentity.artifactFunctionId || '?'} (${e.suggestedIdentity.basis})`;
            }
            lines.push(`| ${e.severity} | ${e.reason} | ${who || '—'} | ${e.disposition} | ${detail} |`);
        }
    }
    if (report.errors?.length) {
        lines.push('', '## Scan errors', '');
        for (const err of report.errors) {
            lines.push(`- \`${err.where}\`: ${err.message}`);
        }
    }
    return lines.join('\n');
}
export function formatIdentityPreflightJson(report) {
    return JSON.stringify(report, null, 2);
}
export function summarizeIdentityPreflight(report) {
    const auto = report.entries.filter((e) => e.disposition.startsWith('auto')).length;
    const manual = report.entries.filter((e) => e.disposition === 'manual').length;
    return `Identity-Preflight: ${report.totals.unresolved} entries (${auto} auto, ${manual} manuell, ${report.totals.informational} informativ) · blocking ${report.totals.blocksActivation} · omits ${report.totals.omitsContribution}`;
}
//# sourceMappingURL=identity-preflight.js.map