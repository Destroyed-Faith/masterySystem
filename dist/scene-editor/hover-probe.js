/**
 * Temporary GM-only hit-test HUD. Opt-in via the Scene Editor toolbar.
 * Shows what document.elementsFromPoint returns under the cursor so chrome
 * overlays (e.g. Application .window-content) can be diagnosed quickly.
 */
const FLAG_IDS = new Set(['mastery-scene-editor-toolbar', 'board', 'ms-scene-editor-toggle']);
function flagFor(el) {
    const id = el.id || '';
    if (FLAG_IDS.has(id))
        return `#${id}`;
    if (el.classList?.contains('window-content'))
        return '.window-content';
    if (el.classList?.contains('application'))
        return '.application';
    if (el.tagName === 'CANVAS')
        return 'canvas';
    return null;
}
export function sampleElementsFromPoint(x, y, limit = 8) {
    const list = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(x, y) : [];
    return list.slice(0, limit).map((el) => {
        const style = window.getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            className: typeof el.className === 'string' ? el.className : '',
            zIndex: style.zIndex || 'auto',
            pointerEvents: style.pointerEvents || 'auto',
            width: Math.round(box.width),
            height: Math.round(box.height),
            flagged: flagFor(el),
        };
    });
}
export class HoverProbe {
    enabled = false;
    hud = null;
    lastTopKey = '';
    lastAt = 0;
    minIntervalMs = 100;
    get isEnabled() {
        return this.enabled;
    }
    setEnabled(on) {
        this.enabled = on;
        if (!on) {
            this.hide();
            return;
        }
        this.ensureHud();
    }
    destroy() {
        this.enabled = false;
        this.hide();
    }
    onPointerMove(event) {
        if (!this.enabled)
            return;
        const now = performance.now();
        if (now - this.lastAt < this.minIntervalMs)
            return;
        this.lastAt = now;
        const samples = sampleElementsFromPoint(event.clientX, event.clientY);
        const top = samples[0];
        const topKey = top ? `${top.tag}#${top.id}.${top.className}|${top.pointerEvents}` : '';
        if (topKey && topKey !== this.lastTopKey) {
            this.lastTopKey = topKey;
            console.debug('Mastery Scene Editor | Hover Probe top', top, samples.slice(0, 4));
        }
        this.renderHud(event.clientX, event.clientY, samples);
    }
    ensureHud() {
        if (this.hud)
            return this.hud;
        const el = document.createElement('div');
        el.id = 'ms-se-hover-probe';
        el.className = 'ms-se-hover-probe';
        el.setAttribute('aria-live', 'polite');
        document.body.appendChild(el);
        this.hud = el;
        return el;
    }
    hide() {
        this.hud?.remove();
        this.hud = null;
        this.lastTopKey = '';
    }
    renderHud(x, y, samples) {
        const hud = this.ensureHud();
        const top = samples[0];
        const receives = top && top.pointerEvents !== 'none'
            ? `${top.tag}${top.id ? `#${top.id}` : ''}${top.flagged ? ` (${top.flagged})` : ''}`
            : '(none / passthrough)';
        const rows = samples
            .map((s, i) => {
            const label = [
                s.tag,
                s.id ? `#${s.id}` : '',
                s.flagged ? ` ${s.flagged}` : '',
                ` pe=${s.pointerEvents}`,
                ` z=${s.zIndex}`,
                ` ${s.width}×${s.height}`,
            ].join('');
            return `<div class="ms-se-hover-probe-row${i === 0 ? ' is-top' : ''}">${escapeHtml(label)}</div>`;
        })
            .join('');
        hud.innerHTML = `<div class="ms-se-hover-probe-title">Hover Probe → ${escapeHtml(receives)}</div>${rows}`;
        const pad = 16;
        const left = Math.min(x + 14, window.innerWidth - 320 - pad);
        const topY = Math.min(y + 14, window.innerHeight - 160 - pad);
        hud.style.left = `${Math.max(pad, left)}px`;
        hud.style.top = `${Math.max(pad, topY)}px`;
    }
}
function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
//# sourceMappingURL=hover-probe.js.map