import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readLang(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'lang', file), 'utf8'));
}

function flattenLeafKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flattenLeafKeys(value, path));
    } else {
      out.push(path);
    }
  }
  return out.sort();
}

describe('MASTERY.df2026 i18n parity', () => {
  it('en and de expose the same df2026 key paths', () => {
    const enBlock = (readLang('en.json').MASTERY as Record<string, unknown>).df2026;
    const deBlock = (readLang('de.json').MASTERY as Record<string, unknown>).df2026;
    expect(enBlock).toBeTruthy();
    expect(deBlock).toBeTruthy();
    const enKeys = flattenLeafKeys(enBlock);
    const deKeys = flattenLeafKeys(deBlock);
    expect(deKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(20);
  });
});
