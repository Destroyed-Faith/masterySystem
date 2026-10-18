import { describe, expect, it, vi } from 'vitest';
import { clearTokenMovementHistory } from '../src/ui/token-movement-history.js';

describe('clearTokenMovementHistory', () => {
  it('calls clearMovementHistory when available', async () => {
    const clearMovementHistory = vi.fn(async () => undefined);
    await clearTokenMovementHistory({ clearMovementHistory });
    expect(clearMovementHistory).toHaveBeenCalledTimes(1);
  });

  it('no-ops on null', async () => {
    await expect(clearTokenMovementHistory(null)).resolves.toBeUndefined();
  });
});
