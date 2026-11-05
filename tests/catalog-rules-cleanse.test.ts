/**
 * Catalog ↔ Actives.md alignment for Ranged Single Target Cleanse.
 * Source: docs/Rules/Canonical/Actives.md 1223–1238 (Decision 14.1 / Vorbatch B0).
 * Control values: PL 4 = Cleanse(6), PL 10 = Cleanse(10).
 */
import { describe, expect, it } from 'vitest';
import { getTemplate } from '../src/utils/powers/templates/index.js';

/** Actives.md 1223–1238 — Cleanse(X) at PL 1..16. */
const ACTIVES_MD_RANGED_SINGLE_CLEANSE: readonly number[] = [
  3, 4, 5, 6, 7, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
];

describe('CLEANSE_RANGED_SINGLE ↔ Actives.md 1223–1238', () => {
  const tpl = getTemplate('active-ranged-single-cleanse');

  it('template exists', () => {
    expect(tpl).toBeDefined();
  });

  it('matches printed Cleanse(X) for every Power Level 1..16', () => {
    expect(tpl).toBeDefined();
    for (let pl = 1; pl <= 16; pl++) {
      const row = tpl!.levels[String(pl) as keyof typeof tpl.levels];
      const cleanse = (row.specials ?? []).find((s) => s.key === 'cleanse');
      expect(cleanse, `PL ${pl} missing cleanse special`).toBeDefined();
      expect(cleanse!.rank, `PL ${pl} Cleanse rank`).toBe(ACTIVES_MD_RANGED_SINGLE_CLEANSE[pl - 1]);
      expect(String(row.effect?.text ?? ''), `PL ${pl} effect text`).toContain(
        `Cleanse(${ACTIVES_MD_RANGED_SINGLE_CLEANSE[pl - 1]})`,
      );
    }
  });

  it('control values: PL 4 = Cleanse(6), PL 10 = Cleanse(10)', () => {
    expect(tpl).toBeDefined();
    expect(tpl!.levels['4'].specials?.find((s) => s.key === 'cleanse')?.rank).toBe(6);
    expect(tpl!.levels['10'].specials?.find((s) => s.key === 'cleanse')?.rank).toBe(10);
  });
});
