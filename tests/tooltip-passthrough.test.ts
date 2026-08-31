import { describe, expect, it, vi } from 'vitest';
import { installTooltipPassthrough } from '../src/ui/tooltip-passthrough.js';

describe('tooltip passthrough', () => {
  it('keeps Foundry tooltips visible but unable to steal pointer events', () => {
    const node = {
      style: { pointerEvents: '' as string },
      setAttribute: vi.fn(),
    };
    const activate = vi.fn();
    (globalThis as any).game = {
      tooltip: {
        tooltip: node,
        activate,
        unlock: vi.fn(),
      },
    };

    installTooltipPassthrough();
    (globalThis as any).game.tooltip.activate('button');

    expect(activate).toHaveBeenCalled();
    expect(node.style.pointerEvents).toBe('none');
    expect(node.setAttribute).toHaveBeenCalledWith('inert', '');
  });
});
