import { test, expect } from './fixtures/foundry.js';
import { getSystemInfo } from './helpers/foundry-session.js';

test.describe('Mastery System — world bootstrap', () => {
  test('loads mastery-system and exposes game API', async ({ foundryPage }) => {
    const info = await getSystemInfo(foundryPage);

    expect(info.systemId).toBe('mastery-system');
    expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(info.isGM).toBe(true);
    expect(info.sceneName).toBeTruthy();
  });

  test('active scene has at least two tokens for combat tests', async ({ foundryPage }) => {
    const info = await getSystemInfo(foundryPage);
    expect(info.tokenCount).toBeGreaterThanOrEqual(2);
  });
});
