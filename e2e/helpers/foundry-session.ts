import type { Page } from '@playwright/test';
import type { FoundryEnv } from './env.js';

const GAME_READY_TIMEOUT_MS = 180_000;

export async function waitForGameReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const g = (window as { game?: { ready?: boolean; system?: { id?: string } } }).game;
      return g?.ready === true && g?.system?.id === 'mastery-system';
    },
    { timeout: GAME_READY_TIMEOUT_MS },
  );
}

async function tryFillAdminGate(page: Page, adminPassword?: string): Promise<void> {
  if (!adminPassword) return;

  const adminInput = page.locator(
    'input[name="adminPassword"], input[name="password"], input[type="password"]',
  ).first();

  if (!(await adminInput.isVisible({ timeout: 4_000 }).catch(() => false))) return;

  await adminInput.fill(adminPassword);
  const submit = page.locator('button[type="submit"], button.confirm').first();
  if (await submit.isVisible().catch(() => false)) {
    await submit.click();
  }
}

async function tryLaunchWorld(page: Page, worldName?: string): Promise<void> {
  if (!worldName) return;

  const worldButton = page.getByRole('button', { name: new RegExp(worldName, 'i') });
  if (await worldButton.first().isVisible({ timeout: 8_000 }).catch(() => false)) {
    await worldButton.first().click();
  }
}

async function tryJoinAsUser(page: Page, username: string, password?: string): Promise<void> {
  const userInput = page.locator('input[name="userid"], input[name="name"]').first();
  if (!(await userInput.isVisible({ timeout: 8_000 }).catch(() => false))) return;

  await userInput.fill(username);
  if (password) {
    const pw = page.locator('input[name="password"]').first();
    if (await pw.isVisible().catch(() => false)) {
      await pw.fill(password);
    }
  }

  const submit = page.locator('form button[type="submit"], button.launch-world').first();
  await submit.click();
}

/**
 * Opens a Mastery System world and waits until `game.ready`.
 *
 * Supported flows:
 * - `FOUNDRY_GAME_URL` — direct `/game` link (fastest for repeat runs)
 * - `FOUNDRY_URL` + optional world/join credentials
 */
export async function openFoundrySession(page: Page, env: FoundryEnv): Promise<void> {
  if (env.gameUrl) {
    await page.goto(env.gameUrl);
    await waitForGameReady(page);
    return;
  }

  await page.goto(`${env.url}/join`);
  await tryFillAdminGate(page, env.adminPassword);
  await tryLaunchWorld(page, env.worldName);
  await tryJoinAsUser(page, env.username, env.password);
  await waitForGameReady(page);
}

export async function getSystemInfo(page: Page): Promise<{
  systemId: string;
  version: string;
  isGM: boolean;
  sceneName: string | null;
  tokenCount: number;
}> {
  return page.evaluate(() => {
    const g = (window as any).game;
    const c = (window as any).canvas;
    const tokens = c?.tokens?.placeables?.filter((t: any) => t?.actor) ?? [];
    return {
      systemId: g?.system?.id ?? '',
      version: g?.system?.version ?? '',
      isGM: !!g?.user?.isGM,
      sceneName: c?.scene?.name ?? null,
      tokenCount: tokens.length,
    };
  });
}
