import { test as base, type Page } from '@playwright/test';
import { loadFoundryEnv } from '../helpers/env.js';
import { openFoundrySession } from '../helpers/foundry-session.js';

type FoundryFixtures = {
  foundryPage: Page;
  skipWithoutFoundry: void;
};

export const test = base.extend<FoundryFixtures>({
  skipWithoutFoundry: [
    async ({}, use, testInfo) => {
      if (!loadFoundryEnv()) {
        testInfo.skip(true, 'Set FOUNDRY_URL in e2e/.env to run Playwright E2E tests.');
      }
      await use();
    },
    { auto: true },
  ],

  foundryPage: async ({ page, skipWithoutFoundry: _skip }, use) => {
    const env = loadFoundryEnv()!;
    await openFoundrySession(page, env);
    await use(page);
  },
});

export { expect } from '@playwright/test';
