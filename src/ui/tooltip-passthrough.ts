/**
 * Foundry parks `#tooltip` under the cursor. If that node can receive
 * pointer events, the hovered button loses :hover (active/inactive flicker)
 * and the click lands on the tooltip instead of the control.
 *
 * Hover text may still appear. It must never steal the pointer.
 */

export function makeFoundryTooltipInert(): void {
  const mgr = (globalThis as any).game?.tooltip;
  const node = (mgr?.element ?? mgr?.tooltip ?? document.getElementById('tooltip')) as
    | HTMLElement
    | null;
  if (!node) return;
  node.style.pointerEvents = 'none';
  node.setAttribute('inert', '');
  node.setAttribute('aria-hidden', 'true');
  mgr?.unlock?.();
}

export function installTooltipPassthrough(): void {
  makeFoundryTooltipInert();

  const mgr = (globalThis as any).game?.tooltip;
  if (!mgr || mgr.__msPassthrough) return;
  mgr.__msPassthrough = true;

  if (typeof mgr.activate === 'function') {
    const orig = mgr.activate.bind(mgr);
    mgr.activate = function (...args: unknown[]) {
      const result = orig(...args);
      makeFoundryTooltipInert();
      return result;
    };
  }

  if (typeof mgr.lockTooltip === 'function') {
    mgr.lockTooltip = function () {
      makeFoundryTooltipInert();
      return this;
    };
  }
}

/**
 * Fire the action on pointerdown so a Foundry tooltip appearing between
 * mousedown and mouseup cannot swallow the click. A leftover click is ignored.
 */
export function bindReliableControlClick(
  root: JQuery,
  selector: string,
  handler: (event: any) => void,
): void {
  root
    .off('pointerdown.msReliable', selector)
    .off('click.msReliable', selector)
    .on('pointerdown.msReliable', selector, (event: JQuery.TriggeredEvent) => {
      const pe = event.originalEvent as PointerEvent | undefined;
      if (pe && typeof pe.button === 'number' && pe.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      makeFoundryTooltipInert();
      const el = event.currentTarget as HTMLElement | null;
      if (el) el.dataset.msReliableArmed = '1';
      handler(event);
    })
    .on('click.msReliable', selector, (event: JQuery.TriggeredEvent) => {
      const el = event.currentTarget as HTMLElement | null;
      if (el?.dataset.msReliableArmed === '1') {
        delete el.dataset.msReliableArmed;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      makeFoundryTooltipInert();
      handler(event);
    });
}
