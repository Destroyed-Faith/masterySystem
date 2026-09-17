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

  it('unlocks CSS-faded #scene-controls from document pointerdown over its rect', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'board';
    document.body.appendChild(canvas);

    const chrome = document.createElement('nav');
    chrome.id = 'scene-controls';
    // Stylesheet-like fade: computed pe is none without an inline value.
    const style = document.createElement('style');
    style.textContent = '#scene-controls { pointer-events: none; opacity: 0.4; }';
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.className = 'control ui-control tool';
    btn.setAttribute('aria-label', 'Draw Wall');
    btn.setAttribute('data-tool', 'wall');
    chrome.appendChild(btn);
    document.body.appendChild(chrome);

    vi.spyOn(chrome, 'getBoundingClientRect').mockReturnValue({
      left: 16,
      top: 16,
      right: 88,
      bottom: 800,
      width: 72,
      height: 784,
      x: 16,
      y: 16,
      toJSON() {
        return {};
      },
    } as DOMRect);
    vi.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
      left: 20,
      top: 60,
      right: 52,
      bottom: 92,
      width: 32,
      height: 32,
      x: 20,
      y: 60,
      toJSON() {
        return {};
      },
    } as DOMRect);

    // While faded, hit-testing only sees the canvas.
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue([canvas, document.body]),
    });

    const click = vi.fn();
    btn.addEventListener('click', click);

    installFadedUiUnlock();

    document.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 36,
        clientY: 76,
        button: 0,
      }),
    );

    expect(chrome.style.getPropertyValue('pointer-events')).toBe('auto');
    expect(click).toHaveBeenCalled();
  });

  it('unlocks inert folder-header create buttons in the sidebar directory', () => {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    const header = document.createElement('header');
    header.className = 'folder-header';
    const createFolder = document.createElement('button');
    createFolder.className = 'create-button create-folder';
    createFolder.dataset.action = 'createFolder';
    createFolder.setAttribute('inert', '');
    createFolder.setAttribute('aria-hidden', 'true');
    createFolder.style.pointerEvents = 'none';
    createFolder.setAttribute('aria-label', 'Create Folder');
    header.appendChild(createFolder);
    sidebar.appendChild(header);
    document.body.appendChild(sidebar);

    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      left: 900,
      top: 100,
      right: 1200,
      bottom: 140,
      width: 300,
      height: 40,
      x: 900,
      y: 100,
      toJSON() {
        return {};
      },
    } as DOMRect);
    vi.spyOn(createFolder, 'getBoundingClientRect').mockReturnValue({
      left: 1100,
      top: 105,
      right: 1132,
      bottom: 137,
      width: 32,
      height: 32,
      x: 1100,
      y: 105,
      toJSON() {
        return {};
      },
    } as DOMRect);

    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue([header, sidebar, document.body]),
    });

    const click = vi.fn();
    createFolder.addEventListener('click', click);

    installFadedUiUnlock();

    document.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        clientX: 1110,
        clientY: 120,
        button: 0,
      }),
    );

    expect(createFolder.hasAttribute('inert')).toBe(false);
    expect(createFolder.getAttribute('aria-hidden')).not.toBe('true');
    expect(createFolder.style.getPropertyValue('pointer-events')).toBe('auto');
    expect(click).toHaveBeenCalled();
  });
});
