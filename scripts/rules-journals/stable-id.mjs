/** Deterministic 16-char alphanumeric Foundry id from any seed string. */
export function stableId(seed) {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  let counter = 0;
  while (out.length < 16) {
    let h = 0x811c9dc5;
    const s = `${seed}#${counter++}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    while (h > 0 && out.length < 16) {
      out += ALPHA[h % ALPHA.length];
      h = Math.floor(h / ALPHA.length);
    }
  }
  return out.slice(0, 16);
}

export function slugify(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
