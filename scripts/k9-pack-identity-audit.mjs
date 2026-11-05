#!/usr/bin/env node
/**
 * K9 — Echo Artifact compendium identity audit (read-only on world data).
 *
 * Compares the *old* pack source documents (git ref or directory) against the
 * *new* ones in `src/packs/echo-artifacts/`, validates every new document
 * against the canonical builder + identity contracts (K1/K2/K3) and writes a
 * machine-readable report.
 *
 * Usage:
 *   node scripts/k9-pack-identity-audit.mjs [--old-ref <git-ref>] [--old <dir>]
 *        [--new <dir>] [--out <file>] [--verify-leveldb] [--strict]
 *
 * Defaults: --old-ref HEAD, --new src/packs/echo-artifacts,
 *           --out docs/audits/K9_PACK_REBUILD_DIFF.json
 * `--strict` exits non-zero when unexpected (non-identity) changes, contract
 * violations, builder-parity drift or id instability are found.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { echoPackFolderId, echoPackItemId, echoPackRootFolderId } from './lib/echo-pack-ids.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACK_SRC_REL = 'src/packs/echo-artifacts';

const IDENTITY_FIELDS = [
  'powerTemplateId',
  'artifactFunctionId',
  'rank',
  'limited',
  'isSpell',
  'castingAttribute',
  'spellResolution',
  'chosenSpecialKey',
];
const IDENTITY_PATH_RE = new RegExp(
  `^system\\.(levelProgression\\[\\d+\\]|progressionPicks\\[\\d+\\](\\.authoredStages\\[\\d+\\])?)\\.(${IDENTITY_FIELDS.join('|')})$`,
);

function parseArgs(argv) {
  const out = {
    oldRef: 'HEAD',
    old: null,
    new: path.join(ROOT, PACK_SRC_REL),
    out: path.join(ROOT, 'docs/audits/K9_PACK_REBUILD_DIFF.json'),
    verifyLevelDb: false,
    strict: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--old-ref') out.oldRef = argv[++i];
    else if (a === '--old') out.old = path.resolve(argv[++i]);
    else if (a === '--new') out.new = path.resolve(argv[++i]);
    else if (a === '--out') out.out = path.resolve(argv[++i]);
    else if (a === '--verify-leveldb') out.verifyLevelDb = true;
    else if (a === '--strict') out.strict = true;
  }
  return out;
}

function readDocsFromDir(dir) {
  const docs = new Map();
  if (!existsSync(dir)) return docs;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const doc = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
    docs.set(doc._id, { file: f, doc });
  }
  return docs;
}

function readDocsFromGit(ref) {
  const docs = new Map();
  let listing;
  try {
    listing = execFileSync('git', ['ls-tree', '--name-only', ref, `${PACK_SRC_REL}/`], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  } catch (err) {
    throw new Error(`git ls-tree failed for ${ref}: ${err.message}`);
  }
  for (const rel of listing.split(/\r?\n/).filter(Boolean)) {
    if (!rel.endsWith('.json')) continue;
    const raw = execFileSync('git', ['show', `${ref}:${rel}`], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const doc = JSON.parse(raw);
    docs.set(doc._id, { file: path.basename(rel), doc });
  }
  return docs;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Leaf-level diff; arrays diffed by index (progression rows are positional). */
function diffLeaves(a, b, prefix, out) {
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) diffLeaves(a[k], b[k], prefix ? `${prefix}.${k}` : k, out);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) diffLeaves(a[i], b[i], `${prefix}[${i}]`, out);
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.push({ path: prefix, old: a === undefined ? undefined : a, new: b === undefined ? undefined : b });
  }
}

function classifyChange(change) {
  const { path: p, old: o, new: n } = change;
  const identityPath = IDENTITY_PATH_RE.test(p);
  if (identityPath && (o === undefined || o === null) && n !== undefined && n !== null) {
    return 'expected-identity-addition';
  }
  if (identityPath) return 'identity-value-change';
  return 'unexpected';
}

function stableStringify(v) {
  return JSON.stringify(v);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const dist = (rel) => new URL(`../dist/${rel}`, import.meta.url);
  for (const rel of ['artifacts/echo-artifact-tree-builder.js', 'utils/power-identity.js']) {
    if (!existsSync(fileURLToPath(dist(rel)))) {
      console.error(`[k9-audit] dist missing (${rel}) — run \`npm run build\` first.`);
      process.exit(1);
    }
  }
  const { buildAllEchoArtifactTrees, ECHO_ARTIFACT_SEED_VERSION } = await import(
    dist('artifacts/echo-artifact-tree-builder.js')
  );
  const { resolvePowerIdentity } = await import(dist('utils/power-identity.js'));
  const { ARTIFACT_FUNCTION_CONTRACT, isArtifactFunctionId } = await import(
    dist('utils/artifact-functions.js')
  );
  const { enrichArtifactRowIdentity } = await import(dist('utils/artifact-row-identity.js'));
  const { getTemplate } = await import(dist('utils/powers/templates/index.js'));
  const { ECHO_ARTIFACTS } = await import(dist('utils/echo-artifacts.js'));

  const oldDocs = args.old ? readDocsFromDir(args.old) : readDocsFromGit(args.oldRef);
  const newDocs = readDocsFromDir(args.new);

  const report = {
    generatedAt: new Date().toISOString(),
    baseline: { oldSource: args.old ? args.old : `git:${args.oldRef}`, newSource: path.relative(ROOT, args.new) },
    seedVersion: ECHO_ARTIFACT_SEED_VERSION,
    counts: {},
    ids: {},
    builderParity: {},
    diff: { summary: {}, perDocument: [] },
    identity: {},
    contracts: {},
    enrichmentNoOp: {},
    echoBound: {},
    knownFindings: {},
    levelDb: null,
    verdict: null,
  };

  // ---------------------------------------------------------------- counts
  const isFolder = (d) => String(d._key || '').startsWith('!folders!');
  const count = (m) => {
    let items = 0;
    let folders = 0;
    for (const { doc } of m.values()) (isFolder(doc) ? folders++ : items++);
    return { total: m.size, items, folders };
  };
  report.counts.old = count(oldDocs);
  report.counts.new = count(newDocs);
  report.counts.catalogArtifacts = Object.keys(ECHO_ARTIFACTS).length;

  // ------------------------------------------------------------------- ids
  const oldIds = new Set(oldDocs.keys());
  const newIds = new Set(newDocs.keys());
  const added = [...newIds].filter((id) => !oldIds.has(id));
  const removed = [...oldIds].filter((id) => !newIds.has(id));
  const idDerivationMismatch = [];
  const nameMismatch = [];
  const folderMismatch = [];
  for (const [id, { doc }] of newDocs) {
    if (isFolder(doc)) {
      const expected =
        doc.folder == null
          ? echoPackRootFolderId()
          : (() => {
              // sub folder: derive from the first contained item's echoArtifactKey
              const child = [...newDocs.values()].find(
                (e) => !isFolder(e.doc) && e.doc.folder === id,
              );
              const key = child?.doc?.flags?.['mastery-system']?.echoArtifactKey;
              return key ? echoPackFolderId(key) : null;
            })();
      if (expected && expected !== id) idDerivationMismatch.push({ id, expected, name: doc.name });
    } else {
      const nodeId = doc.flags?.['mastery-system']?.nodeId;
      const expected = nodeId ? echoPackItemId(nodeId) : null;
      if (expected !== id) idDerivationMismatch.push({ id, expected, nodeId, name: doc.name });
    }
    const oldEntry = oldDocs.get(id);
    if (oldEntry) {
      if (oldEntry.doc.name !== doc.name) nameMismatch.push({ id, old: oldEntry.doc.name, new: doc.name });
      if ((oldEntry.doc.folder ?? null) !== (doc.folder ?? null)) {
        folderMismatch.push({ id, old: oldEntry.doc.folder ?? null, new: doc.folder ?? null });
      }
    }
  }
  report.ids = {
    stable: added.length === 0 && removed.length === 0 && idDerivationMismatch.length === 0,
    added,
    removed,
    derivationMismatches: idDerivationMismatch,
    nameChanges: nameMismatch,
    folderChanges: folderMismatch,
  };

  // --------------------------------------------------------- builder parity
  const trees = buildAllEchoArtifactTrees();
  const builderDocs = new Map();
  for (const tree of trees) {
    const subId = echoPackFolderId(tree.echoArtifactKey);
    for (const node of tree.nodes) {
      const id = echoPackItemId(node.nodeId);
      builderDocs.set(id, { ...node.itemData, _id: id, folder: subId, _key: `!items!${id}` });
    }
  }
  const parityDrift = [];
  for (const [id, built] of builderDocs) {
    const entry = newDocs.get(id);
    if (!entry) {
      parityDrift.push({ id, reason: 'missing-in-pack', name: built.name });
      continue;
    }
    if (stableStringify(entry.doc) !== stableStringify(built)) {
      const leaves = [];
      diffLeaves(entry.doc, built, '', leaves);
      parityDrift.push({ id, name: built.name, reason: 'content-drift', changes: leaves.slice(0, 20) });
    }
  }
  const packItemIds = [...newDocs.values()].filter((e) => !isFolder(e.doc)).map((e) => e.doc._id);
  const extraInPack = packItemIds.filter((id) => !builderDocs.has(id));
  report.builderParity = {
    builderItems: builderDocs.size,
    packItems: packItemIds.length,
    identical: parityDrift.length === 0 && extraInPack.length === 0,
    drift: parityDrift,
    extraInPack,
  };

  // ------------------------------------------------------------------ diff
  const summary = {
    documentsCompared: 0,
    documentsChanged: 0,
    documentsUnchanged: 0,
    expectedIdentityAdditions: 0,
    identityValueChanges: 0,
    unexpectedChanges: 0,
    byField: {},
  };
  for (const [id, { doc: newDoc, file }] of newDocs) {
    const oldEntry = oldDocs.get(id);
    if (!oldEntry) continue;
    summary.documentsCompared += 1;
    const leaves = [];
    diffLeaves(oldEntry.doc, newDoc, '', leaves);
    if (leaves.length === 0) {
      summary.documentsUnchanged += 1;
      continue;
    }
    summary.documentsChanged += 1;
    const classified = leaves.map((c) => ({ ...c, kind: classifyChange(c) }));
    for (const c of classified) {
      if (c.kind === 'expected-identity-addition') summary.expectedIdentityAdditions += 1;
      else if (c.kind === 'identity-value-change') summary.identityValueChanges += 1;
      else summary.unexpectedChanges += 1;
      const field = c.path.replace(/\[\d+\]/g, '[]');
      summary.byField[field] = (summary.byField[field] || 0) + 1;
    }
    report.diff.perDocument.push({
      id,
      file,
      name: newDoc.name,
      echoArtifactKey: newDoc.flags?.['mastery-system']?.echoArtifactKey ?? null,
      level: newDoc.system?.level ?? null,
      expectedIdentityAdditions: classified.filter((c) => c.kind === 'expected-identity-addition').length,
      unexpected: classified.filter((c) => c.kind !== 'expected-identity-addition'),
      changes: classified,
    });
  }
  report.diff.summary = summary;

  // -------------------------------------------------------------- identity
  const rowStats = {
    rowsTotal: 0,
    rowsWithPowerTemplateId: 0,
    rowsWithArtifactFunctionId: 0,
    rowsWithRank: 0,
    rowsLimited: 0,
    rowsSpell: 0,
    rowsResolvedByIdentity: 0,
    rowsNoIdentity: 0,
    rowsNoIdentityInapplicable: 0,
    rowsUnresolved: 0,
  };
  const oldRowStats = { rowsTotal: 0, rowsWithRank: 0, rowsWithArtifactFunctionId: 0, rowsWithPowerTemplateId: 0 };
  for (const { doc } of oldDocs.values()) {
    if (isFolder(doc)) continue;
    for (const r of doc.system?.levelProgression || []) {
      oldRowStats.rowsTotal += 1;
      if (r.rank != null) oldRowStats.rowsWithRank += 1;
      if (r.artifactFunctionId) oldRowStats.rowsWithArtifactFunctionId += 1;
      if (r.powerTemplateId) oldRowStats.rowsWithPowerTemplateId += 1;
    }
  }
  const unresolvedRows = [];
  const inapplicableRows = [];
  const contractViolations = [];
  const rankIssues = [];
  const afidCounts = {};
  const stageStats = { authoredStagesTotal: 0, authoredStagesWithIdentity: 0, authoredStagesWithout: [] };
  const enrichmentDiffs = [];
  const seedVersions = {};
  const echoBoundTypes = {};
  const echoBoundByBinding = {};

  const isInapplicableRow = (row) => {
    const t = String(row.type || '').toLowerCase();
    const n = String(row.name || '').toLowerCase();
    return (
      t.includes('stone') ||
      t.includes('support') ||
      /stone (pool|battery|refresh|support)/.test(n) ||
      t === 'passive'
    );
  };

  for (const { doc } of newDocs.values()) {
    if (isFolder(doc)) continue;
    const flags = doc.flags?.['mastery-system'] || {};
    seedVersions[String(flags.seedVersion)] = (seedVersions[String(flags.seedVersion)] || 0) + 1;
    const eb = flags.echoBound;
    const ebType = eb === undefined ? 'absent' : typeof eb;
    echoBoundTypes[ebType] = (echoBoundTypes[ebType] || 0) + 1;
    const binding = String(doc.system?.binding || '');
    echoBoundByBinding[binding] = echoBoundByBinding[binding] || {};
    echoBoundByBinding[binding][ebType] = (echoBoundByBinding[binding][ebType] || 0) + 1;

    const key = flags.echoArtifactKey;
    const rows = doc.system?.levelProgression || [];
    for (const row of rows) {
      rowStats.rowsTotal += 1;
      if (row.powerTemplateId) rowStats.rowsWithPowerTemplateId += 1;
      if (row.artifactFunctionId) {
        rowStats.rowsWithArtifactFunctionId += 1;
        afidCounts[row.artifactFunctionId] = (afidCounts[row.artifactFunctionId] || 0) + 1;
      }
      if (row.rank != null) rowStats.rowsWithRank += 1;
      if (row.limited === true) rowStats.rowsLimited += 1;
      if (row.isSpell === true) rowStats.rowsSpell += 1;

      const ref = { id: doc._id, name: doc.name, key, level: row.level, row: row.name };

      // Contract checks (K2 / K3).
      if (row.artifactFunctionId) {
        if (!isArtifactFunctionId(row.artifactFunctionId)) {
          contractViolations.push({ ...ref, reason: 'unknown-artifact-function-id', afid: row.artifactFunctionId });
        } else {
          const c = ARTIFACT_FUNCTION_CONTRACT[row.artifactFunctionId];
          if (c.klass === 'K2' && row.powerTemplateId) {
            contractViolations.push({ ...ref, reason: 'K2-has-powerTemplateId', afid: row.artifactFunctionId, tid: row.powerTemplateId });
          }
          if (c.klass === 'K3' && row.powerTemplateId !== c.requiresTemplateId) {
            contractViolations.push({ ...ref, reason: 'K3-template-mismatch', afid: row.artifactFunctionId, tid: row.powerTemplateId ?? null });
          }
        }
      }
      if (row.powerTemplateId) {
        const tpl = getTemplate(row.powerTemplateId);
        if (!tpl) {
          rankIssues.push({ ...ref, reason: 'unknown-template', tid: row.powerTemplateId });
        } else if (row.rank == null) {
          rankIssues.push({ ...ref, reason: 'rank-missing', tid: row.powerTemplateId });
        } else if (!tpl.levels?.[String(row.rank)]) {
          rankIssues.push({ ...ref, reason: 'rank-not-in-template', tid: row.powerTemplateId, rank: row.rank });
        }
      }

      if (!row.powerTemplateId && !row.artifactFunctionId) {
        rowStats.rowsNoIdentity += 1;
        if (isInapplicableRow(row)) {
          rowStats.rowsNoIdentityInapplicable += 1;
          inapplicableRows.push({ ...ref, type: row.type });
        } else {
          rowStats.rowsUnresolved += 1;
          unresolvedRows.push({ ...ref, type: row.type, reason: 'no-structured-identity' });
        }
      } else {
        const res = resolvePowerIdentity({ kind: 'artifact-row', artifact: doc, row });
        if (res.ok) rowStats.rowsResolvedByIdentity += 1;
        else {
          rowStats.rowsUnresolved += 1;
          unresolvedRows.push({ ...ref, type: row.type, reason: res.reason, detail: res.message });
        }
      }

      // P1: K2 read-time enrichment must be a no-op on pack rows.
      const enriched = enrichArtifactRowIdentity(doc, row);
      if (stableStringify(enriched) !== stableStringify(row)) {
        const leaves = [];
        diffLeaves(row, enriched, '', leaves);
        enrichmentDiffs.push({ ...ref, added: leaves });
      }
    }

    for (const pick of doc.system?.progressionPicks || []) {
      if (pick.kind !== 'authored' || !Array.isArray(pick.authoredStages)) continue;
      for (const st of pick.authoredStages) {
        stageStats.authoredStagesTotal += 1;
        if (st.powerTemplateId || st.artifactFunctionId) stageStats.authoredStagesWithIdentity += 1;
        else if (!isInapplicableRow(st)) {
          stageStats.authoredStagesWithout.push({ id: doc._id, name: doc.name, key, level: st.level, row: st.name, type: st.type });
        }
      }
    }
  }

  report.identity = {
    old: oldRowStats,
    new: rowStats,
    artifactFunctionCounts: afidCounts,
    authoredStages: stageStats,
    unresolvedRows,
    inapplicableRows: {
      count: inapplicableRows.length,
      byType: inapplicableRows.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {}),
    },
  };
  report.contracts = { violations: contractViolations, rankIssues };
  report.enrichmentNoOp = { ok: enrichmentDiffs.length === 0, rowsEnrichmentWouldChange: enrichmentDiffs };
  report.echoBound = {
    byType: echoBoundTypes,
    byBinding: echoBoundByBinding,
    note:
      'W5: builder emits echoBound as the echoKey string for echo-bound trees and omits it for general (bound) artifacts; ' +
      'runtime readers use truthiness except src/module.ts (=== true). Semantics not changed in K9 — reported only.',
  };
  report.knownFindings = {
    seedVersions,
    N1: `Pack/builder seedVersion ${ECHO_ARTIFACT_SEED_VERSION}; world artifacts (seed 57) intentionally NOT touched by K9.`,
    N2: 'Elorian Stride legacy node ids in world — not rewritten by K9 (pack nodeIds are canonical `<key>-l<level>`).',
    W1: 'Titan Scars pack rows carry artifactFunctionId titan-growth (K2, no powerTemplateId); Lor-Keth world item (ab-armor-temp-hp) untouched; K8 holdout retained.',
    W2: 'Draconic Roar rows remain ab-armor-aura (rank 4/10/16) exactly as authored — no mechanical change.',
  };

  // --------------------------------------------------------------- LevelDB
  if (args.verifyLevelDb) {
    try {
      const { extractPack } = await import('@foundryvtt/foundryvtt-cli');
      const tmp = mkdtempSync(path.join(tmpdir(), 'k9-ldb-'));
      await extractPack(path.join(ROOT, 'packs', 'echo-artifacts'), tmp, { log: false });
      const extracted = readDocsFromDir(tmp);
      const ldbIds = new Set(extracted.keys());
      const missing = [...newIds].filter((id) => !ldbIds.has(id));
      const extra = [...ldbIds].filter((id) => !newIds.has(id));
      let contentMismatch = 0;
      for (const [id, { doc }] of extracted) {
        const src = newDocs.get(id)?.doc;
        if (!src) continue;
        // extractPack may add/normalise `_stats`; compare system/flags/name only.
        const pick = (d) => ({ name: d.name, type: d.type, img: d.img, folder: d.folder ?? null, system: d.system, flags: d.flags });
        if (stableStringify(pick(doc)) !== stableStringify(pick(src))) contentMismatch += 1;
      }
      report.levelDb = {
        verified: missing.length === 0 && extra.length === 0 && contentMismatch === 0,
        documents: extracted.size,
        missing,
        extra,
        contentMismatch,
        extractedTo: tmp,
      };
    } catch (err) {
      report.levelDb = { verified: false, error: String(err?.message || err) };
    }
  }

  // --------------------------------------------------------------- verdict
  const blockers = [];
  if (!report.ids.stable) blockers.push('document ids not stable');
  if (report.counts.new.items !== report.counts.old.items) blockers.push('item count changed');
  if (!report.builderParity.identical) blockers.push('pack differs from canonical builder output');
  if (summary.unexpectedChanges > 0) blockers.push(`${summary.unexpectedChanges} unexpected non-identity change(s)`);
  if (summary.identityValueChanges > 0) blockers.push(`${summary.identityValueChanges} identity value change(s) (not pure additions)`);
  if (contractViolations.length) blockers.push(`${contractViolations.length} K2/K3 contract violation(s)`);
  if (rankIssues.length) blockers.push(`${rankIssues.length} template/rank issue(s)`);
  if (unresolvedRows.length) blockers.push(`${unresolvedRows.length} unresolved identity row(s)`);
  if (!report.enrichmentNoOp.ok) blockers.push('K2 read-time enrichment still adds identity (P1 open)');
  if (report.levelDb && !report.levelDb.verified) blockers.push('LevelDB pack does not match source docs');
  report.verdict = { pass: blockers.length === 0, blockers };

  writeFileSync(args.out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  // ------------------------------------------------------------------ log
  const c = report.counts;
  console.log(`[k9-audit] docs old=${c.old.items}i/${c.old.folders}f new=${c.new.items}i/${c.new.folders}f (catalog ${c.catalogArtifacts} artifacts)`);
  console.log(`[k9-audit] ids stable=${report.ids.stable} added=${added.length} removed=${removed.length}`);
  console.log(`[k9-audit] builder parity identical=${report.builderParity.identical} drift=${parityDrift.length}`);
  console.log(
    `[k9-audit] diff: changed=${summary.documentsChanged} unchanged=${summary.documentsUnchanged} identity+=${summary.expectedIdentityAdditions} identity~=${summary.identityValueChanges} unexpected=${summary.unexpectedChanges}`,
  );
  console.log(
    `[k9-audit] rows: total=${rowStats.rowsTotal} tid=${rowStats.rowsWithPowerTemplateId} afid=${rowStats.rowsWithArtifactFunctionId} rank=${rowStats.rowsWithRank} resolved=${rowStats.rowsResolvedByIdentity} inapplicable=${rowStats.rowsNoIdentityInapplicable} unresolved=${rowStats.rowsUnresolved}`,
  );
  console.log(`[k9-audit] old rows: total=${oldRowStats.rowsTotal} tid=${oldRowStats.rowsWithPowerTemplateId} afid=${oldRowStats.rowsWithArtifactFunctionId} rank=${oldRowStats.rowsWithRank}`);
  console.log(`[k9-audit] afid: ${JSON.stringify(afidCounts)}  authoredStages: ${stageStats.authoredStagesWithIdentity}/${stageStats.authoredStagesTotal}`);
  console.log(`[k9-audit] contracts: violations=${contractViolations.length} rankIssues=${rankIssues.length}; enrichment no-op=${report.enrichmentNoOp.ok}`);
  console.log(`[k9-audit] echoBound: ${JSON.stringify(echoBoundTypes)} seedVersions: ${JSON.stringify(seedVersions)}`);
  if (report.levelDb) console.log(`[k9-audit] leveldb verified=${report.levelDb.verified} docs=${report.levelDb.documents ?? 'n/a'}`);
  console.log(`[k9-audit] verdict: ${report.verdict.pass ? 'PASS' : 'FAIL'} ${blockers.length ? '— ' + blockers.join('; ') : ''}`);
  console.log(`[k9-audit] report → ${path.relative(ROOT, args.out)}`);
  if (args.strict && !report.verdict.pass) process.exit(2);
}

main().catch((err) => {
  console.error('[k9-audit] failed:', err);
  process.exit(1);
});
