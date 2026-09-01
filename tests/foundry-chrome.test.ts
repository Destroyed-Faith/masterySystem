/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { clearStuckMasteryOverlays } from '../src/ui/foundry-chrome.js';

describe('stuck overlay cleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('removes an empty leftover epic-roll cinematic root', async () => {
    const root = document.createElement('div');
    root.id = 'mastery-epic-roll-cinematic-root';
    root.style.pointerEvents = 'auto';
    document.body.appendChild(root);

    await clearStuckMasteryOverlays();

    expect(document.getElementById('mastery-epic-roll-cinematic-root')).toBeNull();
  });
});
