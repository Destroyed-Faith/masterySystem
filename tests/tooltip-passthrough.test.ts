/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { installTooltipPassthrough, makeFoundryTooltipInert } from '../src/ui/tooltip-passthrough.js';
import { installFadedUiUnlock } from '../src/ui/foundry-chrome.js';

describe('tooltip passthrough', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete (globalThis as any).game;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete (globalThis as any).game;
  });

  it('keeps Foundry tooltips visible but unable to steal pointer events', () => {
    const node = document.createElement('aside');
    node.id = 'tooltip';
    document.body.appendChild(node);
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
    expect(node.hasAttribute('inert')).toBe(true);
  });

  it('re-applies inert when game.tooltip is replaced (canvasReady refresh)', () => {
    const first = document.createElement('aside');
    first.id = 'tooltip';
    document.body.appendChild(first);
    (globalThis as any).game = {
      tooltip: { tooltip: first, activate: vi.fn(), unlock: vi.fn() },
    };
    installTooltipPassthrough();

    const second = document.createElement('aside');
    second.id = 'tooltip';
    const activate2 = vi.fn();
    (globalThis as any).game.tooltip = {
      tooltip: second,
      activate: activate2,
      unlock: vi.fn(),
    };
    document.body.replaceChild(second, first);
    installTooltipPassthrough();
    (globalThis as any).game.tooltip.activate('x');

    expect(activate2).toHaveBeenCalled();
    expect(second.style.pointerEvents).toBe('none');
    expect(second.hasAttribute('inert')).toBe(true);
  });

  it('inerts #tooltip and .locked-tooltip DOM nodes', () => {
    const tip = document.createElement('aside');
    tip.id = 'tooltip';
    tip.style.pointerEvents = 'auto';
    document.body.appendChild(tip);

    const locked = document.createElement('div');
    locked.className = 'locked-tooltip';
    locked.style.pointerEvents = 'auto';
    document.body.appendChild(locked);

    makeFoundryTooltipInert();

    expect(tip.style.pointerEvents).toBe('none');
    expect(tip.hasAttribute('inert')).toBe(true);
    expect(locked.style.pointerEvents).toBe('none');
    expect(locked.hasAttribute('inert')).toBe(true);
  });
});

describe('faded-ui chrome unlock', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    (globalThis as any).Hooks = { on: vi.fn() };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete (globalThis as any).Hooks;
  });

  it('clears inert and pointer-events:none on sidebar menu buttons at pointerdown', () => {
    const sidebar = document.createElement('nav');
    sidebar.id = 'sidebar-tabs';
    const menu = document.createElement('menu');
    menu.className = 'flexcol';
    const btn = document.createElement('button');
    btn.setAttribute('inert', '');
    btn.setAttribute('aria-hidden', 'true');
    btn.style.pointerEvents = 'none';
    btn.textContent = 'Journal';
    menu.appendChild(btn);
    sidebar.appendChild(menu);
    document.body.appendChild(sidebar);

    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 40,
      bottom: 200,
      width: 40,
      height: 200,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    } as DOMRect);
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue([btn, menu, sidebar, document.body]),
    });

    installFadedUiUnlock();

    sidebar.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 20,
        button: 0,
      }),
    );

    expect(btn.hasAttribute('inert')).toBe(false);
    expect(btn.style.pointerEvents).toBe('');
  });
});
