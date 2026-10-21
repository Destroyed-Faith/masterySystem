/**
 * Strip Homebrewery / print-only markup while preserving textual content.
 */

/** Remove images (markdown + HTML) and absolute-position image attributes. */
function stripImages(src) {
  let s = src;
  // Markdown images with optional Homebrewery position attrs
  s = s.replace(/!\[[^\]]*]\([^)]*\)(\s*\{[^}]*})?/g, '');
  // HTML <img ...>
  s = s.replace(/<img\b[^>]*>/gi, '');
  // Empty figure / image placeholders
  s = s.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '');
  return s;
}

/** Unwrap Homebrewery mustache blocks; keep inner text. */
function unwrapHomebreweryBlocks(src) {
  let s = src;
  // {{pageNumber,auto}} and similar void directives
  s = s.replace(/\{\{pageNumber[^}]*\}\}/gi, '');
  s = s.replace(/\{\{toc[^}]*\}\}/gi, '');
  // Opening tags: {{wide, {{note, {{descriptive, {{classTable, {{bannerText, etc.
  s = s.replace(/\{\{\s*[\w,-]+(?:\s*,\s*[\w,-]+)*\s*\n?/g, '');
  // Lone closing }}
  s = s.replace(/^\s*\}\}\s*$/gm, '');
  s = s.replace(/\}\}/g, '');
  // \page markers
  s = s.replace(/\\page\b/g, '');
  // Homebrewery column / spacing colon lines
  s = s.replace(/^\s*:\s*$/gm, '');
  s = s.replace(/^:{3,}\s*$/gm, '');
  return s;
}

/** Drop decorative / layout-only HTML wrappers but keep inner HTML text. */
function stripLayoutHtml(src) {
  let s = src;
  // Remove style attributes that are print-layout heavy (keep simple tables)
  s = s.replace(/\sstyle="[^"]*position\s*:\s*absolute[^"]*"/gi, '');
  // title-sub / banner wrappers → keep text
  s = s.replace(/<div\b[^>]*class="[^"]*title-sub[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '$1');
  // Remove empty divs left behind
  s = s.replace(/<div\b[^>]*>\s*<\/div>/gi, '');
  return s;
}

/** Normalize whitespace after cleanup. */
function normalizeWhitespace(src) {
  let s = src.replace(/\r\n/g, '\n');
  // Collapse 4+ blank lines to 2
  s = s.replace(/\n{4,}/g, '\n\n\n');
  return s.trim() + '\n';
}

/**
 * Full Homebrewery cleanup for a markdown fragment.
 * Does not convert to HTML — only removes print/layout chrome.
 */
export function cleanHomebreweryMarkdown(src) {
  let s = String(src ?? '');
  s = stripImages(s);
  s = unwrapHomebreweryBlocks(s);
  s = stripLayoutHtml(s);
  // TOC page-link noise: [{{ Title}}{{ 5}}](#p5) → Title
  s = s.replace(/\[\{\{\s*([^}]+?)\s*\}\}\{\{\s*[^}]*\s*\}\}\]\([^)]*\)/g, '$1');
  // Residual {{ Title }} wrappers
  s = s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, '$1');
  // Broken image reference sentences — light touch
  s = s.replace(/\(\s*see\s+(the\s+)?(image|illustration|portrait|map)\s+above\s*\)/gi, '');
  s = normalizeWhitespace(s);
  return s;
}

/** True if cleaned content is effectively empty (no words). */
export function isEffectivelyEmpty(md) {
  const plain = String(md || '')
    .replace(/[#>*`_\-|]/g, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length < 8;
}
