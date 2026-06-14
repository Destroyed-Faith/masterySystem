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
import { visibleAbilityRows } from '../utils/artifact-visible-abilities.js';

export class ArtifactSheetV2 extends foundry.appv1.sheets.ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions as any, {
      classes: ['mastery-system', 'sheet', 'item', 'artifact-sheet-v2'],
      width: 460,
      height: 'auto',
      resizable: true,
      submitOnChange: false,
      closeOnSubmit: false,
    });
  }

  /** @override */
  get template() {
    return 'systems/mastery-system/templates/item/artifact-sheet-v2.hbs';
  }

  /** @override */
  getData(options?: any) {
    const context: any = super.getData(options);
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

    const baseValueRows = mechanicallyActive
      ? (Array.isArray((system as any).baseValues) ? (system as any).baseValues : []).map(
          (bv: any) => ({
            slot: String(bv.slot || '').toUpperCase(),
            label: bv.label || '',
            value: bv.value != null && bv.value !== '' ? String(bv.value) : bv.note || '',
          }),
        )
      : [];

    const visibleRows = mechanicallyActive
      ? visibleAbilityRows(
          Array.isArray((system as any).levelProgression) ? (system as any).levelProgression : [],
          currentLevel,
        )
      : [];
    const abilities = visibleRows.map((row: any) => ({
      level: Number(row.level) || 1,
      name: row.name || '',
      type: row.type || '',
      effect: row.effect || '',
      special: row.special || '',
      unlocked: true,
    }));

    context.item = item;
    context.system = system;
    context.isEditable = this.isEditable;
    context.isGM = !!game.user?.isGM;
    context.mechanicallyActive = mechanicallyActive;
    context.summary = {
      slotLabel: (ARTIFACT_SLOT_LABELS as any)[slotKey] || '',
      baseProfileLabel: (BASE_PROFILE_LABELS as any)[profileKey] || '',
      currentLevel,
      baseValues: baseValueRows,
      abilities,
      hasAbilities: abilities.length > 0,
      hasBaseValues: baseValueRows.length > 0,
    };
    return context;
  }

  /** @override */
  activateListeners(html: any): void {
    super.activateListeners(html);
    const root = html?.[0] ?? html;
    if (!root || !game.user?.isGM) return;
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
