/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Single, read-only summary card: meta (slot / profile / level), the current
 * Base Values, and the up-to-3 active Level Progression abilities. No tabs, no
 * editable fields. GMs get an "Edit in Node Editor" link; all authoring still
 * happens in the Artifact Builder / Node Editor, never on this sheet.
 */

import type { ArtifactData } from '../types/item.js';
import {
  ARTIFACT_SLOT_LABELS,
  BASE_PROFILE_LABELS,
} from '../utils/artifact-rules.js';
import { isArtifactLinkedOnActor } from '../utils/artifact-actor-rules.js';
import {
  displayFromArtifactSystem,
  resolveNextArtifactPreviews,
} from '../utils/artifact-sheet-preview.js';
import { openFoundryImagePopout } from '../ui/image-url-share.js';
import { getFilePickerClass } from '../utils/foundry-v14.js';

const BaseArtifactSheet: any = foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2,
);

export class ArtifactSheetV2 extends BaseArtifactSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['mastery-system', 'sheet', 'item', 'artifact-sheet-v2'],
    position: { width: 520, height: 'auto' },
    window: { resizable: true },
    form: { submitOnChange: false, closeOnSubmit: false },
  };

  /** @override */
  static PARTS = {
    body: { template: 'systems/mastery-system/templates/item/artifact-sheet-v2.hbs' },
  };

  /** @override */
  async _prepareContext(_options?: any) {
    const context: any = {};
    const item: any = this.item;
    const system = item.system as ArtifactData;

    // ---- Read-friendly summary (what the artifact is + what it does) ----
    const slotKey = String((system as any).slot || '');
    const profileKey = String((system as any).baseProfile || '');
    const currentLevel = Math.max(
      1,
      Math.min(10, Number((system as any).currentLevel) || Number(system.level) || 1),
    );

    const parentActor = item.parent?.documentName === 'Actor' ? item.parent : null;
    const mechanicallyActive = parentActor
      ? isArtifactLinkedOnActor(parentActor, item)
      : true;

    const current = displayFromArtifactSystem(system);
    const activation = mechanicallyActive ? current : displayFromArtifactSystem(system, { level: 1 });
    const nextPreviews = mechanicallyActive ? resolveNextArtifactPreviews(item) : [];
    const i18n = (globalThis as any).game?.i18n;
    const loc = (key: string, fallback: string, data?: Record<string, string>) => {
      const raw = data ? i18n?.format?.(key, data) : i18n?.localize?.(key);
      if (typeof raw === 'string' && raw && raw !== key) return raw;
      if (!data) return fallback;
      return fallback.replace(/\{(\w+)\}/g, (_, k) => data[k] ?? '');
    };

    context.item = item;
    context.system = system;
    context.cssClass = item.isOwner ? 'editable' : 'locked';
    context.isEditable = this.isEditable;
    context.isGM = !!game.user?.isGM;
    context.mechanicallyActive = mechanicallyActive;
    context.labels = {
      inactive: loc('MASTERY.artifact.sheet.inactive', 'Inactive — activate via Artifacts'),
      whenActivated: loc('MASTERY.artifact.sheet.whenActivated', 'When activated'),
      whenActivatedHint: loc(
        'MASTERY.artifact.sheet.whenActivatedHint',
        'These values and abilities unlock when you activate this artifact.',
      ),
      nextLevelHint: loc(
        'MASTERY.artifact.sheet.nextLevelHint',
        'Unlocked when you raise this artifact.',
      ),
      imgAlt: loc('MASTERY.artifact.sheet.imgAlt', 'Alternative image'),
    };
    context.imgAlt = String((system as any).imgAlt || '').trim();
    context.summary = {
      slotLabel: (ARTIFACT_SLOT_LABELS as any)[slotKey] || '',
      baseProfileLabel: (BASE_PROFILE_LABELS as any)[profileKey] || '',
      currentLevel,
      baseValues: activation.baseValues,
      abilities: activation.abilities,
      hasAbilities: activation.hasAbilities,
      hasBaseValues: activation.hasBaseValues,
    };
    context.nextPreviews = nextPreviews.map((preview) => ({
      ...preview,
      title: loc('MASTERY.artifact.sheet.nextLevel', 'Next: Level {level}', {
        level: String(preview.level),
      }),
    }));
    context.hasNextPreview = nextPreviews.length > 0;
    context.hasActivationPreview = !mechanicallyActive && (activation.hasBaseValues || activation.hasAbilities);
    return context;
  }

  /** @override */
  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender?.(context, options);
    const root = this.element as HTMLElement | null;
    if (!root) return;
    const item: any = this.item;
    const title = String(item.name || 'Artifact');
    const imgAlt = String((item.system as ArtifactData)?.imgAlt || '').trim();

    root.querySelector('[data-action="popout-img"]')?.addEventListener('click', (ev: Event) => {
      ev.preventDefault();
      void openFoundryImagePopout(String(item.img || ''), title);
    });
    root.querySelector('[data-action="popout-img-alt"]')?.addEventListener('click', (ev: Event) => {
      ev.preventDefault();
      if (imgAlt) void openFoundryImagePopout(imgAlt, `${title} — Alternative`);
    });
    root.querySelector('[data-action="edit-img-alt"]')?.addEventListener('click', (ev: Event) => {
      ev.preventDefault();
      if (!item.canUserModify?.((game as any).user, 'update')) return;
      const FilePickerImpl = getFilePickerClass();
      if (!FilePickerImpl) return;
      const fp = new FilePickerImpl({
        type: 'image',
        current: imgAlt,
        callback: (path: string) => {
          void item.update({ 'system.imgAlt': path });
        },
      });
      fp.browse();
    });

    if (!game.user?.isGM) return;
    const btn = root.querySelector?.('[data-action="open-node-editor"]');
    if (!btn) return;
    btn.addEventListener('click', async (ev: Event) => {
      ev.preventDefault();
      const { NodeEditor } = await import('../artifacts/node-editor.js');
      const self = this;
      const editor = new NodeEditor(this.item, {
        onSaved: async () => {
          await (self as any).render(false);
        },
      });
      (editor as any).render(true);
    });
  }
}
