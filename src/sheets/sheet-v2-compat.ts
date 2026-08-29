/**
 * Shared ApplicationV2 compatibility helpers for the migrated document sheets.
 *
 * The system's sheet templates still use the classic V1 markup
 * (`nav.sheet-tabs` + `.tab[data-tab]` sections, `[data-edit="img"]`
 * portraits). ApplicationV2 no longer wires those automatically, so these
 * helpers replicate the V1 behavior on top of the V2 lifecycle.
 */

import { getFilePickerClass } from '../utils/foundry-v14.js';

/**
 * Wire classic `nav.sheet-tabs` navigation inside a V2-rendered sheet.
 *
 * Keeps the active tab in `holder.activeTab` so it survives re-renders
 * (V2 replaces the part's DOM on every render). Falls back to the first
 * nav entry when the remembered tab no longer exists (e.g. NPC phase
 * deleted).
 */
export function bindManualSheetTabs(
  root: HTMLElement,
  holder: { activeTab?: string },
  initialTab: string,
): void {
  const navs = root.querySelectorAll<HTMLElement>('nav.sheet-tabs');
  if (!navs.length) return;

  const activate = (tabName: string) => {
    holder.activeTab = tabName;
    for (const nav of Array.from(navs)) {
      nav.querySelectorAll<HTMLElement>('[data-tab]').forEach((el) => {
        el.classList.toggle('active', el.dataset.tab === tabName);
      });
    }
    root.querySelectorAll<HTMLElement>('.tab[data-tab]').forEach((el) => {
      // Only top-level tab sections; nested [data-tab] usage elsewhere keeps working
      // because we scope to elements with the `.tab` class.
      el.classList.toggle('active', el.dataset.tab === tabName);
    });
  };

  for (const nav of Array.from(navs)) {
    nav.querySelectorAll<HTMLElement>('[data-tab]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.preventDefault();
        const tab = (ev.currentTarget as HTMLElement)?.dataset?.tab;
        if (tab) activate(tab);
      });
    });
  }

  // Restore the previously active tab (or the initial one). If it vanished,
  // fall back to the first available nav entry.
  let target = holder.activeTab || initialTab;
  const available = new Set(
    Array.from(navs[0].querySelectorAll<HTMLElement>('[data-tab]')).map((el) => el.dataset.tab),
  );
  if (!available.has(target)) {
    target = (navs[0].querySelector<HTMLElement>('[data-tab]')?.dataset?.tab as string) || initialTab;
  }
  activate(target);
}

/**
 * Replicate the V1 `[data-edit="img"]` portrait editing: click opens a
 * FilePicker and stores the chosen path on the document.
 */
export function bindEditImage(root: HTMLElement, document: any): void {
  root.querySelectorAll<HTMLElement>('[data-edit="img"], [data-edit="system.imgAlt"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!document?.canUserModify?.((game as any).user, 'update')) return;
      const attr = el.dataset.edit || 'img';
      const current = (foundry.utils as any).getProperty(document, attr);
      const FilePickerImpl = getFilePickerClass();
      if (!FilePickerImpl) {
        console.warn('Mastery System | FilePicker unavailable (namespaced API missing)');
        return;
      }
      const fp = new FilePickerImpl({
        type: 'image',
        current: current || '',
        callback: (path: string) => {
          void document.update({ [attr]: path });
        },
      });
      fp.browse();
    });
  });
}
