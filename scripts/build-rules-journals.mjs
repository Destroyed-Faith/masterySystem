#!/usr/bin/env node
/**
 * Build Destroyed Faith Rules Journal Compendium Packs from the Player's Guide.
 *
 * Pipeline:
 *   docs/Rules/players-guide.md
 *     → chapter extraction (chapter-map.mjs)
 *     → Homebrewery cleanup + Markdown→HTML
 *     → src/packs/{rules-core,rules-world,rules-quickref}/*.json
 *     → packs/{...} LevelDB via @foundryvtt/foundryvtt-cli
 *
 * Usage: npm run build:rules-journals
 */

import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTER_SPECS, PACK_META } from './rules-journals/chapter-map.mjs';
import { extractChapters, groupChapters } from './rules-journals/extract-chapters.mjs';
import { markdownToJournalHtml } from './rules-journals/md-to-html.mjs';
import { cleanHomebreweryMarkdown, isEffectivelyEmpty } from './rules-journals/homebrewery-clean.mjs';
import { stableId, slugify } from './rules-journals/stable-id.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs', 'Rules', 'players-guide.md');
const REPORT_PATH = path.join(ROOT, 'docs', 'rules-journals-report.json');

const TEXT_FORMAT_HTML = 1; // CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML

function journalDoc(id, name, sort, ownershipDefault, pages = []) {
  return {
    _id: id,
    name,
    // Full page docs (with _key). compilePack embeds them as !journal.pages!jid.pid
    // and stores page IDs on the JournalEntry — empty pages[] leaves Foundry bodies blank.
    pages,
    folder: null,
    sort,
    ownership: { default: ownershipDefault },
    flags: {
      'mastery-system': {
        rulesJournal: true,
        generatedFrom: 'docs/Rules/players-guide.md',
      },
    },
    _key: `!journal!${id}`,
  };
}

function pageDoc(journalId, pageId, name, html, sort) {
  return {
    _id: pageId,
    name,
    type: 'text',
    title: { show: true, level: 1 },
    text: {
      format: TEXT_FORMAT_HTML,
      content: html,
    },
    sort,
    ownership: {},
    flags: {
      'mastery-system': {
        rulesJournalPage: true,
      },
    },
    _key: `!journal.pages!${journalId}.${pageId}`,
  };
}

function assertCorrections(md) {
  const checks = [
    { name: 'Passive: Self Cleanse', re: /Passive:\s*Self Cleanse/i },
    { name: 'Special Amplification', re: /Special Amplification/i },
    { name: 'Active Buffs activate only in Preparation', re: /Active Buffs activate only in Preparation/i },
    { name: 'Round End buff expiry', re: /Active Buffs reaching their final\s+\*\*Round End\*\*/i },
  ];
  const failed = checks.filter((c) => !c.re.test(md)).map((c) => c.name);
  if (failed.length) {
    console.error('[rules-journals] Source is missing required Oct-21 corrections:');
    for (const f of failed) console.error(`  - ${f}`);
    console.error(`[rules-journals] Expected corrected guide at ${path.relative(ROOT, SOURCE)}`);
    process.exit(1);
  }
}

function validateHtml(html, label) {
  const issues = [];
  if (/\\page\b/.test(html)) issues.push('residual \\page');
  if (/\{\{/.test(html) || /\}\}/.test(html)) issues.push('residual {{ }} Homebrewery');
  if (/<img\b/i.test(html)) issues.push('img element');
  if (/!\[[^\]]*]\([^)]*\)/.test(html)) issues.push('markdown image');
  if (isEffectivelyEmpty(html.replace(/<[^>]+>/g, ' '))) issues.push('effectively empty');
  return issues.map((i) => `${label}: ${i}`);
}

async function writePack(packKey, journalMap, report) {
  const meta = PACK_META[packKey];
  const srcDir = path.join(ROOT, 'src', 'packs', packKey);
  const packDir = path.join(ROOT, 'packs', packKey);

  await rm(srcDir, { recursive: true, force: true });
  await mkdir(srcDir, { recursive: true });

  const docs = [];
  let journalSort = 0;
  let pageCount = 0;
  let journalCount = 0;

  for (const [journalName, chapters] of journalMap.entries()) {
    journalCount += 1;
    const jid = stableId(`journal:${packKey}:${slugify(journalName)}`);
    // Building Encounters journal is GM-leaning if any page is gmOnly
    const gmOnly = chapters.some((c) => c.gmOnly);
    const ownershipDefault = gmOnly ? 0 : 2; // NONE vs OBSERVER

    const pages = [];
    let pageSort = 0;
    for (const ch of chapters) {
      const pid = stableId(`page:${packKey}:${slugify(journalName)}:${slugify(ch.page)}`);
      const html = markdownToJournalHtml(ch.body, { pageTitle: ch.page });
      const issues = validateHtml(html, `${packKey}/${journalName}/${ch.page}`);
      report.issues.push(...issues);
      if (issues.some((x) => x.includes('empty'))) {
        report.emptyPages.push({ pack: packKey, journal: journalName, page: ch.page });
      }
      pages.push(pageDoc(jid, pid, ch.page, html, pageSort));
      pageSort += 100000;
      pageCount += 1;
      report.pages.push({
        pack: packKey,
        journal: journalName,
        page: ch.page,
        startLine: ch.startLine + 1,
        endLine: ch.endLine,
        chars: ch.body.length,
        htmlChars: html.length,
        gmOnly: !!ch.gmOnly,
      });
    }

    docs.push(journalDoc(jid, journalName, journalSort, ownershipDefault, pages));
    journalSort += 100000;
  }

  let written = 0;
  for (const doc of docs) {
    const safe = slugify(doc.name || 'journal') || 'journal';
    const file = path.join(srcDir, `journal_${safe}_${doc._id}.json`);
    await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    written += 1;
  }

  report.packs[packKey] = {
    label: meta.label,
    journals: journalCount,
    pages: pageCount,
    sourceDocs: written,
    srcDir: path.relative(ROOT, srcDir),
  };

  let compiled = false;
  try {
    const { compilePack } = await import('@foundryvtt/foundryvtt-cli');
    await rm(packDir, { recursive: true, force: true });
    await mkdir(packDir, { recursive: true });
    await compilePack(srcDir, packDir, { log: false });
    compiled = true;
    report.packs[packKey].packDir = path.relative(ROOT, packDir);
  } catch (err) {
    console.warn(`[rules-journals] LevelDB compile skipped for ${packKey}:`, err?.message || err);
    report.packs[packKey].compileError = String(err?.message || err);
  }

  console.log(
    `[rules-journals] ${meta.label}: ${journalCount} journals, ${pageCount} pages`
      + (compiled ? ' (LevelDB OK)' : ' (source JSON only)'),
  );
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`[rules-journals] Missing source: ${SOURCE}`);
    process.exit(1);
  }

  const md = await readFile(SOURCE, 'utf8');
  assertCorrections(md);

  const { chapters, missing } = extractChapters(md, CHAPTER_SPECS);
  const included = chapters.filter((c) => !c.exclude);
  const excluded = chapters.filter((c) => c.exclude);

  /** @type {any} */
  const report = {
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, SOURCE),
    sourceBytes: Buffer.byteLength(md, 'utf8'),
    chapterSpecs: CHAPTER_SPECS.length,
    matched: chapters.length,
    missing,
    excluded: excluded.map((c) => ({ journal: c.journal, page: c.page, startLine: c.startLine + 1 })),
    packs: {},
    pages: [],
    emptyPages: [],
    issues: [],
  };

  if (missing.length) {
    console.warn(`[rules-journals] ${missing.length} chapter start(s) not found:`);
    for (const m of missing) console.warn(`  - ${m.pack} / ${m.journal} / ${m.page}`);
  }

  const grouped = groupChapters(included);
  for (const packKey of Object.keys(PACK_META)) {
    const journalMap = grouped.get(packKey) ?? new Map();
    await writePack(packKey, journalMap, report);
  }

  // Quick sanity: no power-catalogue leakage
  const blob = included.map((c) => c.body).join('\n');
  const catalogueLeak =
    /homebrewery\.naturalcrit\.com\/share\//i.test(blob)
    && /### Power Catalogues/i.test(md);
  report.powerCatalogueLinksInSourceToc = /### Power Catalogues/i.test(md);
  report.excludedMinorExpressionsCatalogue = excluded.some((c) =>
    /Minor Expressions Catalogue/i.test(c.page),
  );

  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`[rules-journals] report → ${path.relative(ROOT, REPORT_PATH)}`);

  if (report.emptyPages.length) {
    console.warn(`[rules-journals] ${report.emptyPages.length} effectively empty page(s).`);
  }
  const hardIssues = report.issues.filter((i) => !i.includes('empty'));
  if (hardIssues.length) {
    console.warn(`[rules-journals] ${hardIssues.length} conversion issue(s):`);
    for (const i of hardIssues.slice(0, 20)) console.warn(`  - ${i}`);
  }

  // Fail if critical chapters missing
  const criticalMissing = missing.filter((m) =>
    ['Combat Core', 'Stone Abilities', 'Tyhra', 'Humans', 'Core Flow'].includes(m.page)
    || m.page === 'Combat Core'
    || m.journal === 'Combat Core' && m.page === 'Combat Core',
  );
  if (criticalMissing.length) {
    console.error('[rules-journals] Critical chapters missing — aborting.');
    process.exit(1);
  }

  void catalogueLeak;
  console.log('[rules-journals] done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
