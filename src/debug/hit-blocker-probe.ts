/**
 * Global hit-blocker probe — finds invisible layers that steal hover/clicks.
 *
 * Enable (GM):
 *   - Keyboard: Ctrl+Alt+H
 *   - Console: game.masteryHitProbe.enable() / .disable() / .toggle()
 *
 * While on:
 *   - HUD lists elementsFromPoint under the cursor (tag, id, pe, z-index, size)
 *   - Suspicious overlays get a red outline (large / transparent / pe:auto)
 *   - Every click logs who RECEIVED the event vs who is TOP under the pointer
 */

export interface HitSample {
  tag: string;
  id: string;
  className: string;
  pointerEvents: string;
  zIndex: string;
  opacity: string;
  width: number;
  height: number;
  area: number;
  suspicious: boolean;
  reason: string | null;
  el: Element;
}

const OUTLINE_ATTR = 'data-ms-hit-probe-outline';

function describe(el: Element): HitSample {
  const style = window.getComputedStyle(el);
  const box = el.getBoundingClientRect();
  const width = Math.round(box.width);
  const height = Math.round(box.height);
  const area = width * height;
  const pointerEvents = style.pointerEvents || 'auto';
  const opacity = style.opacity || '1';
  const bg = style.backgroundColor || '';
  const transparentBg =
    bg === 'transparent' ||
    bg === 'rgba(0, 0, 0, 0)' ||
    /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/i.test(bg);
  let reason: string | null = null;
  if (pointerEvents !== 'none') {
    if (el.id === 'tooltip' || el.classList.contains('toolclip')) reason = 'Foundry tooltip/toolclip';
    else if (el.classList.contains('window-content') && (transparentBg || area > 40_000))
      reason = 'Application .window-content (often empty chrome over UI)';
    else if (el.classList.contains('application') && transparentBg && area > 40_000)
      reason = 'large transparent .application host';
    else if ((Number(opacity) || 1) < 0.05 && area > 10_000) reason = 'nearly invisible but clickable';
    else if (transparentBg && area > 80_000 && !(el as HTMLElement).innerText?.trim())
      reason = 'large empty transparent hitbox';
    else if (el.id?.startsWith('mastery-') && transparentBg && area > 20_000)
      reason = 'Mastery floating host';
  }
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    className: typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className : '',
    pointerEvents,
    zIndex: style.zIndex || 'auto',
    opacity,
    width,
    height,
    area,
    suspicious: !!reason,
    reason,
    el,
  };
}

export function sampleHitStack(x: number, y: number, limit = 12): HitSample[] {
  const list = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(x, y) : [];
  return list.slice(0, limit).map(describe);
}

function labelOf(s: HitSample): string {
  const id = s.id ? `#${s.id}` : '';
  const cls = s.className
    ? '.' +
      s.className
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join('.')
    : '';
  const flag = s.reason ? ` ⚠ ${s.reason}` : '';
  return `${s.tag}${id}${cls} pe=${s.pointerEvents} z=${s.zIndex} ${s.width}×${s.height}${flag}`;
}

export class HitBlockerProbe {
  private enabled = false;
  private hud: HTMLDivElement | null = null;
  private lastKey = '';
  private lastAt = 0;
  private readonly minIntervalMs = 80;
  private onMove = (ev: PointerEvent) => this.handleMove(ev);
  private onClick = (ev: MouseEvent) => this.handleClick(ev);
  private onKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey && ev.altKey && (ev.key === 'h' || ev.key === 'H')) {
      ev.preventDefault();
      this.toggle();
    }
  };

  get isEnabled(): boolean {
    return this.enabled;
  }

  bindHotkey(): void {
    window.addEventListener('keydown', this.onKey);
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    window.addEventListener('pointermove', this.onMove, true);
    window.addEventListener('click', this.onClick, true);
    this.ensureHud();
    ui.notifications?.info(
      'Hit Probe ON — HUD under cursor; Ctrl+Alt+H to stop. Clicks log the blocker stack to the console.',
    );
    console.info(
      '%cMastery Hit Probe ON',
      'color:#e94560;font-weight:bold',
      'Move mouse over a dead button. Red outline = suspicious overlay. Click logs the full stack.',
    );
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    window.removeEventListener('pointermove', this.onMove, true);
    window.removeEventListener('click', this.onClick, true);
    this.clearOutlines();
    this.hud?.remove();
    this.hud = null;
    this.lastKey = '';
    ui.notifications?.info('Hit Probe OFF');
    console.info('Mastery Hit Probe OFF');
  }

  toggle(): void {
    if (this.enabled) this.disable();
    else this.enable();
  }

  /** Dump stack at a point without leaving the probe on. */
  dumpAt(x: number, y: number): HitSample[] {
    const stack = sampleHitStack(x, y);
    console.group(`Mastery Hit Probe @ (${x}, ${y})`);
    stack.forEach((s, i) => console.log(i, labelOf(s), s.el));
    const blockers = stack.filter((s) => s.suspicious);
    if (blockers.length) console.warn('Suspicious overlays:', blockers.map(labelOf));
    console.groupEnd();
    return stack;
  }

  private ensureHud(): HTMLDivElement {
    if (this.hud) return this.hud;
    const el = document.createElement('div');
    el.id = 'ms-hit-blocker-probe';
    el.className = 'ms-hit-blocker-probe';
    document.body.appendChild(el);
    this.hud = el;
    return el;
  }

  private clearOutlines(): void {
    document.querySelectorAll(`[${OUTLINE_ATTR}]`).forEach((el) => {
      el.removeAttribute(OUTLINE_ATTR);
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.outlineOffset = '';
    });
  }

  private handleMove(ev: PointerEvent): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastAt < this.minIntervalMs) return;
    this.lastAt = now;
    const stack = sampleHitStack(ev.clientX, ev.clientY);
    const topClickable = stack.find((s) => s.pointerEvents !== 'none');
    const key = topClickable ? labelOf(topClickable) : '';
    if (key && key !== this.lastKey) {
      this.lastKey = key;
      console.debug('Mastery Hit Probe top clickable →', topClickable?.el, key);
    }
    this.clearOutlines();
    for (const s of stack) {
      if (!s.suspicious) continue;
      const html = s.el as HTMLElement;
      html.setAttribute(OUTLINE_ATTR, '1');
      html.style.outline = '2px dashed #e94560';
      html.style.outlineOffset = '-2px';
    }
    const hud = this.ensureHud();
    const rows = stack
      .map((s, i) => {
        const cls = i === 0 ? ' is-top' : s.suspicious ? ' is-bad' : '';
        return `<div class="ms-hit-blocker-probe-row${cls}">${escapeHtml(labelOf(s))}</div>`;
      })
      .join('');
    const verdict = topClickable?.suspicious
      ? `BLOCKER: ${topClickable.reason}`
      : `click goes to: ${topClickable ? `${topClickable.tag}${topClickable.id ? '#' + topClickable.id : ''}` : '(none)'}`;
    hud.innerHTML = `<div class="ms-hit-blocker-probe-title">${escapeHtml(verdict)}</div>${rows}`;
    const pad = 12;
    hud.style.left = `${Math.max(pad, Math.min(ev.clientX + 16, window.innerWidth - 360 - pad))}px`;
    hud.style.top = `${Math.max(pad, Math.min(ev.clientY + 16, window.innerHeight - 200 - pad))}px`;
  }

  private handleClick(ev: MouseEvent): void {
    if (!this.enabled) return;
    const stack = sampleHitStack(ev.clientX, ev.clientY);
    const receiver = (ev.target as Element | null) ?? null;
    const topClickable = stack.find((s) => s.pointerEvents !== 'none');
    console.groupCollapsed(
      `%cMastery Hit Probe CLICK @ (${ev.clientX}, ${ev.clientY})`,
      'color:#ffd54f;font-weight:bold',
    );
    console.log('event.target (who got the click):', receiver);
    console.log('top clickable under pointer:', topClickable?.el, topClickable ? labelOf(topClickable) : null);
    if (topClickable?.suspicious) {
      console.warn('Likely blocker:', topClickable.reason, topClickable.el);
    }
    if (receiver && topClickable && receiver !== topClickable.el && !topClickable.el.contains(receiver)) {
      console.warn('Mismatch: click target is not the top hit-tested element (something may be wrong).');
    }
    stack.forEach((s, i) => console.log(i, labelOf(s), s.el));
    console.groupEnd();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let singleton: HitBlockerProbe | null = null;

export function getHitBlockerProbe(): HitBlockerProbe {
  if (!singleton) singleton = new HitBlockerProbe();
  return singleton;
}

export function initializeHitBlockerProbe(): void {
  const probe = getHitBlockerProbe();
  probe.bindHotkey();
  Hooks.once('ready', () => {
    (globalThis as any).game.masteryHitProbe = probe;
    console.info(
      'Mastery Hit Probe ready — Ctrl+Alt+H or game.masteryHitProbe.enable() when a button will not click.',
    );
  });
}
