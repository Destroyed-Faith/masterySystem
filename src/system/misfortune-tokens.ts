/**
 * Shared Misfortune Token pool (world setting).
 * Filled by Unluck at session start and by Stress Breakdown “Push It Down”.
 */

export const MISFORTUNE_SETTING = 'misfortuneTokens';
export const FLAG_SCOPE = 'mastery-system';

let settingsRegistered = false;

export function registerMisfortuneTokenSettings(): void {
  if (settingsRegistered) return;
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, MISFORTUNE_SETTING, {
      name: 'Misfortune Tokens (GM)',
      hint: 'Tokens from Unluck (session start) and Stress Breakdown “Push It Down”. Spend from the Unluck GM menu.',
      scope: 'world',
      config: true,
      type: Number,
      default: 0,
    });
    settingsRegistered = true;
  } catch (err) {
    console.warn('Mastery System | misfortuneTokens setting register failed', err);
  }
}

export function readMisfortuneTokens(): number {
  const g = globalThis as any;
  try {
    return Math.max(0, Math.floor(Number(g.game?.settings?.get?.(FLAG_SCOPE, MISFORTUNE_SETTING)) || 0));
  } catch {
    return 0;
  }
}

export async function setMisfortuneTokens(amount: number): Promise<number> {
  const g = globalThis as any;
  const next = Math.max(0, Math.floor(Number(amount) || 0));
  try {
    await g.game?.settings?.set?.(FLAG_SCOPE, MISFORTUNE_SETTING, next);
  } catch (err) {
    console.warn('Mastery System | misfortuneTokens set failed', err);
  }
  return next;
}

export async function addMisfortuneTokens(amount: number): Promise<number> {
  const add = Math.floor(Number(amount) || 0);
  return setMisfortuneTokens(readMisfortuneTokens() + add);
}

export async function spendMisfortuneTokens(amount = 1): Promise<{ ok: true; remaining: number } | { ok: false; remaining: number }> {
  const spend = Math.max(1, Math.floor(Number(amount) || 1));
  const cur = readMisfortuneTokens();
  if (cur < spend) return { ok: false, remaining: cur };
  const remaining = await setMisfortuneTokens(cur - spend);
  return { ok: true, remaining };
}
