#!/usr/bin/env node
/**
 * Offline adapter: run identity preflight + migration dry-run against a
 * Forge/browser Identity Snapshot JSON (macros/export-identity-snapshot.js).
 *
 * Usage:
 *   node scripts/run-identity-snapshot-audit.mjs path/to/snapshot.json
 *   node scripts/run-identity-snapshot-audit.mjs path/to/snapshot.json --out docs/audits/snapshot-dryrun
 *
 * Requires a prior `npm run build` (imports from dist/).
 * READ-ONLY against the snapshot file — never touches Foundry or world data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FORMAT = 'mastery-identity-snapshot';

function fail(msg) {
  console.error(`[identity-snapshot-audit] ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { input: null, outDir: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.outDir = argv[++i];
    else if (a.startsWith('-')) fail(`Unknown flag: ${a}`);
    else args.input = a;
  }
  return args;
}

function assertSnapshot(snap) {
  if (!snap || typeof snap !== 'object') fail('Snapshot is not an object');
  if (snap.format !== FORMAT) {
    fail(`Unexpected format "${snap.format}" (expected ${FORMAT})`);
  }
  const fv = Number(snap.formatVersion);
  // v1 = original export; v2 = X1–X4 corrections (MR path, picks level/kind, provenance flags).
  if (!Number.isFinite(fv) || fv < 1 || fv > 2) {
    fail(`Unsupported formatVersion ${snap.formatVersion} (expected 1 or 2)`);
  }
  if (!Array.isArray(snap.actors)) fail('Snapshot.actors missing');
}

/** Map snapshot actor → shape expected by preflightActor / planActorIdentityMigration. */
function toAuditActor(snapActor) {
  return {
    id: snapActor.id,
    name: snapActor.name,
    type: snapActor.type,
    flags: snapActor.flags || {},
    system: snapActor.system || {},
    items: Array.isArray(snapActor.items) ? snapActor.items : [],
    effects: Array.isArray(snapActor.effects) ? snapActor.effects : [],
  };
}

async function loadModules() {
  const preflightUrl = pathToFileURL(path.join(root, 'dist/utils/identity-preflight.js')).href;
  const migrationUrl = pathToFileURL(
    path.join(root, 'dist/migrations/power-identity-migration.js'),
  ).href;
  try {
    const [preflight, migration] = await Promise.all([
      import(preflightUrl),
      import(migrationUrl),
    ]);
    return { preflight, migration };
  } catch (err) {
    fail(
      `Failed to import dist modules. Run \`npm run build\` first.\n${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function mergeReports(parts, systemVersion) {
  const report = {
    generatedAt: new Date().toISOString(),
    systemVersion,
    scope: 'snapshot-world',
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
  for (const part of parts) {
    report.totals.sources += part.totals.sources;
    report.totals.resolved += part.totals.resolved;
    report.totals.unresolved += part.totals.unresolved;
    report.totals.blocksActivation += part.totals.blocksActivation;
    report.totals.omitsContribution += part.totals.omitsContribution;
    report.totals.informational += part.totals.informational;
    report.entries.push(
      ...part.entries.map((e) => ({
        ...e,
        ref: {
          ...(e.ref || {}),
          snapshotActorId: part._snapshotActorId,
          snapshotActorName: part._snapshotActorName,
          snapshotSource: part._snapshotSource,
        },
      })),
    );
    report.errors.push(...(part.errors || []));
  }
  return report;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input) {
    fail(
      'Usage: node scripts/run-identity-snapshot-audit.mjs <snapshot.json> [--out dir]',
    );
  }
  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) fail(`File not found: ${inputPath}`);

  const snap = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  assertSnapshot(snap);

  const { preflight, migration } = await loadModules();

  const auditActors = [
    ...snap.actors.map((a) => ({ ...a, _source: a.source || 'world' })),
    ...(Array.isArray(snap.tokenOverrides)
      ? snap.tokenOverrides
          .filter((t) => Array.isArray(t.items) || Array.isArray(t.effects))
          .map((a) => ({ ...a, _source: a.source || 'token-override' }))
      : []),
  ];

  // Compendium Actor docs (Item-only packs are scanned via catalog in-repo, not as actors).
  if (Array.isArray(snap.compendiumDocuments)) {
    for (const doc of snap.compendiumDocuments) {
      if (doc.documentName === 'Actor' || Array.isArray(doc.items)) {
        auditActors.push({ ...doc, _source: doc.source || `compendium:${doc.pack || '?'}` });
      }
    }
  }

  const preflightParts = [];
  const allProposals = [];
  const actorSummaries = [];

  for (const snapActor of auditActors) {
    if (snapActor.incomplete) {
      actorSummaries.push({
        id: snapActor.id,
        name: snapActor.name,
        source: snapActor._source,
        skipped: true,
        reason: 'incomplete-snapshot',
        error: snapActor.error || null,
      });
      continue;
    }
    const actor = toAuditActor(snapActor);
    const part = preflight.preflightActor(actor);
    part._snapshotActorId = snapActor.id;
    part._snapshotActorName = snapActor.name;
    part._snapshotSource = snapActor._source;
    preflightParts.push(part);

    const proposals = migration.planActorIdentityMigration(actor).map((p) => ({
      ...p,
      actorId: snapActor.id,
      actorName: snapActor.name,
      snapshotSource: snapActor._source,
    }));
    allProposals.push(...proposals);

    actorSummaries.push({
      id: snapActor.id,
      name: snapActor.name,
      source: snapActor._source,
      preflight: { ...part.totals },
      proposals: proposals.length,
      incomplete: !!snapActor.incomplete,
    });
  }

  const systemVersion = String(snap.system?.version || 'snapshot');
  const preflightReport = mergeReports(preflightParts, systemVersion);
  // Attach snapshot-level export errors as scan errors.
  for (const e of snap.errors || []) {
    preflightReport.errors.push({
      where: `snapshot-export:${e.where}`,
      message: e.message,
    });
  }

  const sections = migration.buildIdentityMigrationDryRunSections(allProposals);
  const dryRunMd = migration.formatIdentityMigrationDryRunMarkdown(sections);

  const outDir = path.resolve(
    args.outDir ||
      path.join(
        root,
        'docs/audits',
        `identity-snapshot-dryrun-${String(snap.world?.id || 'world').replace(/[^\w.-]+/g, '_')}`,
      ),
  );
  fs.mkdirSync(outDir, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    snapshot: {
      exportedAt: snap.exportedAt,
      worldId: snap.world?.id ?? null,
      worldTitle: snap.world?.title ?? null,
      systemVersion: snap.system?.version ?? null,
      coreVersion: snap.core?.version ?? null,
      hostIsForge: !!snap.host?.isForge,
      stats: snap.stats ?? null,
      exportErrors: (snap.errors || []).length,
      exportWarnings: (snap.warnings || []).length,
    },
    actorsAudited: actorSummaries.filter((a) => !a.skipped).length,
    actorsSkippedIncomplete: actorSummaries.filter((a) => a.skipped).length,
    preflightTotals: preflightReport.totals,
    migrationProposalCounts: {
      total: allProposals.length,
      autoStableKey: sections.autoStableKey.length,
      autoProvenance: sections.autoProvenance.length,
      manual: sections.manual.length,
      notActivatable: sections.notActivatable.length,
    },
    note: 'Dry-run only. No world documents were modified. Apply nothing without an isolated world copy + GM review.',
  };

  fs.writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(
    path.join(outDir, 'preflight-report.json'),
    `${JSON.stringify(preflightReport, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, 'migration-proposals.json'),
    `${JSON.stringify({ generatedAt: summary.generatedAt, proposals: allProposals }, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(outDir, 'migration-dry-run.md'), dryRunMd);
  fs.writeFileSync(
    path.join(outDir, 'actor-summaries.json'),
    `${JSON.stringify(actorSummaries, null, 2)}\n`,
  );

  const md = [
    '# Identity Snapshot Offline Audit',
    '',
    `- Snapshot exported: ${snap.exportedAt}`,
    `- World: ${snap.world?.title || '?'} (\`${snap.world?.id || '?'}\`)`,
    `- System: ${snap.system?.id}@${snap.system?.version}`,
    `- Actors audited: ${summary.actorsAudited} (skipped incomplete: ${summary.actorsSkippedIncomplete})`,
    `- Preflight unresolved: ${preflightReport.totals.unresolved} (blocking activation: ${preflightReport.totals.blocksActivation})`,
    `- Migration proposals: ${allProposals.length} (auto-stable ${sections.autoStableKey.length}, auto-provenance ${sections.autoProvenance.length}, manual ${sections.manual.length})`,
    '',
    '## Important',
    '',
    '- This is a **dry-run** against an exported snapshot.',
    '- **Do not apply** migrations to the productive Forge world from these results.',
    '- Use an isolated world copy before any apply.',
    '',
    `Output directory: \`${path.relative(root, outDir)}\``,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'README.md'), md);

  console.log(JSON.stringify(summary, null, 2));
  console.error(`[identity-snapshot-audit] wrote ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
