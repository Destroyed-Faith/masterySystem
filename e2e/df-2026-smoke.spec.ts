/**
 * DF 2026 Foundry smoke — runs ONLY against an isolated test world.
 *
 * Guard: set FOUNDRY_ISOLATED_TEST=1 in e2e/.env AND point FOUNDRY_GAME_URL
 * at a dedicated empty/test world (never the campaign world).
 *
 * Without that flag this file skips entirely so CI / accidental runs cannot
 * mutate a live game.
 */
import { test, expect } from './fixtures/foundry';

const isolated = process.env.FOUNDRY_ISOLATED_TEST === '1';

test.describe('DF 2026 smoke (isolated world only)', () => {
  test.skip(!isolated, 'Set FOUNDRY_ISOLATED_TEST=1 for an isolated Foundry 14 test world.');

  test('system is loaded as mastery-system', async ({ page }) => {
    const id = await page.evaluate(() => (globalThis as any).game?.system?.id);
    expect(id).toBe('mastery-system');
  });

  // Further steps (character creation, Specs, Imprints, Ritual Workshop,
  // migration review, import/export, reload persistence) require seeded
  // actors in the isolated world — add when the test world is provisioned.
});
