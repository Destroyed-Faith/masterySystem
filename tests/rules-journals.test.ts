/**
 * Destroyed Faith Rules Journals — generator integrity.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractChapters, groupChapters } from '../scripts/rules-journals/extract-chapters.mjs';
import { CHAPTER_SPECS, PACK_META } from '../scripts/rules-journals/chapter-map.mjs';
import { cleanHomebreweryMarkdown, isEffectivelyEmpty } from '../scripts/rules-journals/homebrewery-clean.mjs';
import { markdownToJournalHtml } from '../scripts/rules-journals/md-to-html.mjs';

const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, 'docs', 'Rules', 'players-guide.md');

describe('Rules Journals — source corrections', () => {
  it('Player\'s Guide includes Oct-21 Active Buff / Passive corrections', () => {
    const md = readFileSync(SOURCE, 'utf8');
    expect(md).toMatch(/Active Buffs activate only in Preparation/i);
    expect(md).toMatch(/Active Buffs reaching their final\s+\*\*Round End\*\*/i);
    expect(md).toMatch(/Passive:\s*Self Cleanse/i);
    expect(md).toMatch(/Special Amplification/i);
    expect(md).toMatch(/Passive:\s*Critical/i);
    expect(md).toMatch(/Passive:\s*Maximization/i);
  });
});

describe('Rules Journals — Homebrewery cleanup', () => {
  it('removes \\page, images, and wrappers while keeping note text', () => {
    const raw = [
      '\\page',
      '{{pageNumber,auto}}',
      '{{note',
      '##### Echo choice in practice',
      'An Echo should support both the fiction and the ways a character approaches scenes.',
      '}}',
      '![banner](https://example.com/x.png){position:absolute,top:1px}',
      '<img src="https://example.com/y.png" />',
      'Keep this paragraph.',
    ].join('\n');
    const cleaned = cleanHomebreweryMarkdown(raw);
    expect(cleaned).not.toMatch(/\\page/);
    expect(cleaned).not.toMatch(/\{\{/);
    expect(cleaned).not.toMatch(/!\[/);
    expect(cleaned).not.toMatch(/<img/i);
    expect(cleaned).toMatch(/Echo choice in practice/);
    expect(cleaned).toMatch(/Keep this paragraph/);
    expect(isEffectivelyEmpty(cleaned)).toBe(false);
  });

  it('markdownToJournalHtml produces table and note classes', () => {
    const html = markdownToJournalHtml(
      '## Title\n\n> A note\n\n| A | B |\n|---|---|\n| 1 | 2 |\n',
      { pageTitle: 'Title' },
    );
    expect(html).toMatch(/df-rules-journal/);
    expect(html).toMatch(/df-rules-note|blockquote/);
    expect(html).toMatch(/df-rules-table|<table/);
    expect(html).not.toMatch(/\\page/);
  });

  it('does not inject a duplicate page-title heading (Foundry TOC / page name)', () => {
    const same = markdownToJournalHtml('## Attributes\n\nBody text.\n', { pageTitle: 'Attributes' });
    expect(same).not.toMatch(/df-rules-page-header/);
    expect(same).not.toMatch(/<h[1-4][^>]*>\s*Attributes\s*<\/h[1-4]>/i);
    expect(same).toMatch(/Body text/);

    const distinct = markdownToJournalHtml(
      '## Example: Alaris Chooses Her Attributes\n\nAlaris is a skirmisher.\n',
      { pageTitle: 'Example: Attributes' },
    );
    expect(distinct).not.toMatch(/df-rules-page-header/);
    expect(distinct).not.toMatch(/<h1[^>]*>\s*Example: Attributes\s*<\/h1>/i);
    expect(distinct).toMatch(/Example: Alaris Chooses Her Attributes/);

    const quoted = markdownToJournalHtml(
      '> ## Core Terms\n>\n> **Pool & Keep:** Roll d8.\n',
      { pageTitle: 'Core Terms' },
    );
    expect(quoted).not.toMatch(/<h[1-4][^>]*>\s*Core Terms\s*<\/h[1-4]>/i);
    expect(quoted).toMatch(/Pool &amp; Keep|Pool & Keep/);

    const midPage = markdownToJournalHtml(
      '## Skills\n\nIntro.\n\n## Skills\n\nAgain.\n',
      { pageTitle: 'Skills' },
    );
    expect(midPage.match(/<h[1-4][^>]*>\s*Skills\s*<\/h[1-4]>/gi) || []).toHaveLength(0);
    expect(midPage).toMatch(/Intro/);
    expect(midPage).toMatch(/Again/);
  });
});

describe('Rules Journals — chapter extraction', () => {
  it('matches every chapter spec and excludes Minor Expressions Catalogue', () => {
    const md = readFileSync(SOURCE, 'utf8');
    const { chapters, missing } = extractChapters(md, CHAPTER_SPECS);
    expect(missing).toEqual([]);
    expect(chapters.length).toBe(CHAPTER_SPECS.length);

    const excluded = chapters.filter((c) => c.exclude);
    expect(excluded.some((c) => /Minor Expressions Catalogue/i.test(c.page))).toBe(true);

    const included = chapters.filter((c) => !c.exclude);
    const grouped = groupChapters(included);
    expect(grouped.has('rules-core')).toBe(true);
    expect(grouped.has('rules-world')).toBe(true);
    expect(grouped.has('rules-quickref')).toBe(true);

    const corePages = [...(grouped.get('rules-core')?.values() ?? [])].flat();
    expect(corePages.some((p) => p.page === 'Combat Core')).toBe(true);
    expect(corePages.some((p) => p.page === 'Stone Abilities')).toBe(true);
    expect(corePages.some((p) => p.page === 'Round Structure')).toBe(true);

    const worldPages = [...(grouped.get('rules-world')?.values() ?? [])].flat();
    expect(worldPages.some((p) => p.journal === 'Humans')).toBe(true);
    expect(worldPages.some((p) => p.journal === 'Unbound')).toBe(true);
    expect(worldPages.some((p) => p.journal === 'Deathless')).toBe(true);

    const quick = [...(grouped.get('rules-quickref')?.values() ?? [])].flat();
    expect(quick.some((p) => p.page === 'Core Flow')).toBe(true);
    expect(quick.some((p) => p.page === 'Defense & Resources')).toBe(true);
  });

  it('does not import external Power Catalogue share links as page bodies', () => {
    const md = readFileSync(SOURCE, 'utf8');
    const { chapters } = extractChapters(md, CHAPTER_SPECS);
    const includedBodies = chapters.filter((c) => !c.exclude).map((c) => c.body).join('\n');
    // TOC may mention catalogues in excluded regions only
    expect(includedBodies).not.toMatch(/# Minor Expressions Catalogue/);
    for (const ch of chapters.filter((c) => !c.exclude)) {
      expect(ch.page).not.toMatch(/Actives Catalogue|Passives Catalogue|Active Buffs Catalogue/i);
    }
  });
});

describe('Rules Journals — generated packs', () => {
  const packs = Object.keys(PACK_META);

  it.each(packs)('pack %s has source JSON and LevelDB output', (pack) => {
    const srcDir = join(ROOT, 'src', 'packs', pack);
    const packDir = join(ROOT, 'packs', pack);
    expect(existsSync(srcDir), srcDir).toBe(true);
    expect(existsSync(packDir), packDir).toBe(true);
    const files = readdirSync(srcDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    const journals = files.filter((f) => f.startsWith('journal_'));
    expect(journals.length).toBeGreaterThan(0);

    let linkedPages = 0;
    for (const file of journals) {
      const doc = JSON.parse(readFileSync(join(srcDir, file), 'utf8'));
      expect(Array.isArray(doc.pages)).toBe(true);
      expect(doc.pages.length).toBeGreaterThan(0);
      linkedPages += doc.pages.length;
      for (const page of doc.pages.slice(0, 3)) {
        expect(page._id).toBeTruthy();
        expect(page._key).toMatch(/^!journal\.pages!/);
        expect(page.type).toBe('text');
        expect(page.text?.format).toBe(1);
        expect(String(page.text?.content || '')).toMatch(/df-rules-journal/);
        expect(String(page.text?.content || '')).not.toMatch(/\\page\b/);
        expect(String(page.text?.content || '')).not.toMatch(/<img\b/i);
      }
    }
    expect(linkedPages).toBeGreaterThan(0);
  });

  it('report file lists three packs with no empty pages', () => {
    const reportPath = join(ROOT, 'docs', 'rules-journals-report.json');
    expect(existsSync(reportPath)).toBe(true);
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    expect(report.missing).toEqual([]);
    expect(report.emptyPages).toEqual([]);
    expect(report.packs['rules-core']?.pages).toBeGreaterThan(40);
    expect(report.packs['rules-world']?.pages).toBeGreaterThan(15);
    expect(report.packs['rules-quickref']?.pages).toBeGreaterThanOrEqual(8);
  });
});
