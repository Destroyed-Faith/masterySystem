/**
 * Convert cleaned Player's Guide Markdown to Foundry Journal HTML.
 * Uses `marked` when available; falls back to a minimal converter.
 */

import { cleanHomebreweryMarkdown } from './homebrewery-clean.mjs';

let markedParse = null;
try {
  const mod = await import('marked');
  const marked = mod.marked ?? mod.default;
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false,
  });
  markedParse = (src) => marked.parse(src);
} catch {
  markedParse = null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text) {
  let t = escapeHtml(text);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  t = t.replace(/_([^_]+)_/g, '<em>$1</em>');
  return t;
}

/** Minimal GFM-ish converter used if `marked` is unavailable. */
function fallbackMarkdownToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  let inBq = false;
  let inTable = false;
  let para = [];

  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inlineFormat(para.join(' '))}</p>`);
    para = [];
  };
  const closeLists = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      out.push('</ol>');
      inOl = false;
    }
  };
  const closeBq = () => {
    if (inBq) {
      out.push('</blockquote>');
      inBq = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push('</tbody></table>');
      inTable = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushPara();
      closeLists();
      closeBq();
      closeTable();
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushPara();
      closeLists();
      closeBq();
      closeTable();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFormat(heading[2].replace(/\*+/g, ''))}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushPara();
      closeLists();
      closeBq();
      closeTable();
      out.push('<hr />');
      i += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushPara();
      closeLists();
      closeTable();
      if (!inBq) {
        out.push('<blockquote class="df-rules-note">');
        inBq = true;
      }
      const body = trimmed.replace(/^>\s?/, '');
      if (body) out.push(`<p>${inlineFormat(body)}</p>`);
      i += 1;
      continue;
    }

    if (/^\|/.test(trimmed) && trimmed.includes('|')) {
      flushPara();
      closeLists();
      closeBq();
      const cells = trimmed
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
      const isSep = cells.every((c) => /^:?-+:?$/.test(c) || c === '');
      if (isSep) {
        i += 1;
        continue;
      }
      if (!inTable) {
        out.push('<table class="df-rules-table"><thead><tr>');
        for (const c of cells) out.push(`<th>${inlineFormat(c)}</th>`);
        out.push('</tr></thead><tbody>');
        inTable = true;
        i += 1;
        // Next separator line?
        continue;
      }
      out.push('<tr>');
      for (const c of cells) out.push(`<td>${inlineFormat(c)}</td>`);
      out.push('</tr>');
      i += 1;
      continue;
    }

    const ul = /^[-*+]\s+(.+)$/.exec(trimmed);
    if (ul) {
      flushPara();
      closeBq();
      closeTable();
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${inlineFormat(ul[1])}</li>`);
      i += 1;
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ol) {
      flushPara();
      closeBq();
      closeTable();
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${inlineFormat(ol[1])}</li>`);
      i += 1;
      continue;
    }

    // Already HTML block — pass through cautiously
    if (/^<\/?[a-z]/i.test(trimmed)) {
      flushPara();
      closeLists();
      closeBq();
      closeTable();
      out.push(trimmed);
      i += 1;
      continue;
    }

    closeLists();
    closeBq();
    closeTable();
    para.push(trimmed);
    i += 1;
  }

  flushPara();
  closeLists();
  closeBq();
  closeTable();
  return out.join('\n');
}

/**
 * Normalize heading / page titles for duplicate detection.
 * @param {string} s
 */
export function normalizeHeadingText(s) {
  return String(s || '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Drop a leading markdown heading that merely repeats the Journal page name.
 * Foundry already shows the page title and builds a TOC from in-page headings —
 * a duplicate H1/H2 creates a second identical sidebar entry under the page.
 * Handles plain headings and Homebrewery note openers (`> ## Title`).
 * @param {string} md
 * @param {string} [pageTitle]
 */
export function stripRedundantLeadingHeading(md, pageTitle) {
  const titleNorm = normalizeHeadingText(pageTitle);
  if (!titleNorm) return md;
  return String(md || '').replace(
    /^(?:\s*\n)*(?:>\s*)*#{1,4}\s+(.+?)\s*(?:\n|$)/,
    (full, headingText) => (normalizeHeadingText(headingText) === titleNorm ? '' : full),
  );
}

/**
 * Remove every in-page H1–H4 whose visible text equals the Journal page name.
 * Prevents Foundry's heading TOC from nesting a second copy of the page title
 * (including headings that appear mid-page or inside notes/blockquotes).
 * @param {string} html
 * @param {string} [pageTitle]
 */
export function stripDuplicateTitleHeadingsFromHtml(html, pageTitle) {
  const titleNorm = normalizeHeadingText(pageTitle);
  if (!titleNorm) return html;
  return String(html || '').replace(/<h([1-4])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (full, _level, _attrs, inner) => {
    const text = String(inner).replace(/<[^>]+>/g, '');
    return normalizeHeadingText(text) === titleNorm ? '' : full;
  });
}

/**
 * Convert a markdown fragment to Journal HTML.
 * @param {string} md
 * @param {{ pageTitle?: string }} [opts]
 */
export function markdownToJournalHtml(md, opts = {}) {
  // Do not inject an extra <h1> for the page title: Foundry Journal pages already
  // render `name` when title.show is true, and in-page H1/H2 feed the TOC sidebar.
  const cleaned = stripRedundantLeadingHeading(
    cleanHomebreweryMarkdown(md),
    opts.pageTitle,
  );
  let html;
  if (markedParse) {
    html = String(markedParse(cleaned));
  } else {
    html = fallbackMarkdownToHtml(cleaned);
  }

  // Post-process: tag notes / tables for CSS
  html = html.replace(/<blockquote>/g, '<blockquote class="df-rules-note">');
  html = html.replace(/<table>/g, '<table class="df-rules-table">');
  html = stripDuplicateTitleHeadingsFromHtml(html, opts.pageTitle);

  return `<div class="df-rules-journal">${html}</div>`;
}
