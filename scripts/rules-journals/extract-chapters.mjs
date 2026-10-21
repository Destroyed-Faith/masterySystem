/**
 * Locate chapter starts in the Player's Guide and slice page bodies.
 *
 * Multiple packs may claim the same heading (e.g. Core + Quick Reference).
 * They share the same body slice.
 */

import { CHAPTER_SPECS } from './chapter-map.mjs';

/**
 * @param {string} markdown
 * @param {import('./chapter-map.mjs').ChapterSpec[]} [specs]
 */
export function extractChapters(markdown, specs = CHAPTER_SPECS) {
  const lines = markdown.split(/\r?\n/);
  const used = new Set();
  /** @type {Array<{ line: number, spec: import('./chapter-map.mjs').ChapterSpec, key: string }>} */
  const hits = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const spec of specs) {
      const key = `${spec.pack}::${spec.journal}::${spec.page}`;
      if (used.has(key)) continue;
      if (spec.start.test(line)) {
        hits.push({ line: i, spec, key });
        used.add(key);
        // Do not break — another pack may also start on this heading.
      }
    }
  }

  hits.sort((a, b) => a.line - b.line || a.key.localeCompare(b.key));

  const uniqueStarts = [...new Set(hits.map((h) => h.line))].sort((a, b) => a - b);

  /** @type {Array<{
   *   pack: string,
   *   journal: string,
   *   page: string,
   *   gmOnly: boolean,
   *   exclude: boolean,
   *   startLine: number,
   *   endLine: number,
   *   body: string,
   *   matched: boolean,
   * }>} */
  const chapters = [];

  for (const cur of hits) {
    const idx = uniqueStarts.indexOf(cur.line);
    const endLine = idx >= 0 && idx + 1 < uniqueStarts.length
      ? uniqueStarts[idx + 1]
      : lines.length;
    const body = lines.slice(cur.line, endLine).join('\n');
    chapters.push({
      pack: cur.spec.pack,
      journal: cur.spec.journal,
      page: cur.spec.page,
      gmOnly: !!cur.spec.gmOnly,
      exclude: !!cur.spec.exclude,
      startLine: cur.line,
      endLine,
      body,
      matched: true,
    });
  }

  const missing = specs
    .filter((s) => !used.has(`${s.pack}::${s.journal}::${s.page}`))
    .map((s) => ({ pack: s.pack, journal: s.journal, page: s.page, start: String(s.start) }));

  return { chapters, missing, hits };
}

/**
 * Group included chapters by pack → journal → pages.
 * @param {ReturnType<typeof extractChapters>['chapters']} chapters
 */
export function groupChapters(chapters) {
  /** @type {Map<string, Map<string, typeof chapters>>} */
  const packs = new Map();
  for (const ch of chapters) {
    if (ch.exclude) continue;
    if (!packs.has(ch.pack)) packs.set(ch.pack, new Map());
    const journals = packs.get(ch.pack);
    if (!journals.has(ch.journal)) journals.set(ch.journal, []);
    journals.get(ch.journal).push(ch);
  }
  return packs;
}
