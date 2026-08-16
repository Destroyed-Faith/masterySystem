/**
 * Read-only artifact sheet: current card plus a grayed next-level preview.
 */

import { visibleAbilityRows } from './artifact-visible-abilities.js';
import {
  getChildWorldItemsForNode,
  getWorldArtifactItemsInFolder,
} from './artifact-actor-tree.js';

export interface ArtifactSheetBaseValue {
  slot: string;
  label: string;
  value: string;
}

export interface ArtifactSheetAbility {
  name: string;
  type: string;
  effect: string;
  special: string;
}

export interface ArtifactSheetDisplay {
  level: number;
  baseValues: ArtifactSheetBaseValue[];
  abilities: ArtifactSheetAbility[];
  hasBaseValues: boolean;
  hasAbilities: boolean;
}

export interface ArtifactSheetNextPreview extends ArtifactSheetDisplay {
  label: string;
}

function clampLevel(raw: unknown): number {
  return Math.max(1, Math.min(10, Math.floor(Number(raw) || 1)));
}

function readFlag(item: any, key: string): unknown {
  if (typeof item?.getFlag === 'function') return item.getFlag('mastery-system', key);
  return item?.flags?.['mastery-system']?.[key];
}

export function displayFromArtifactSystem(system: any): ArtifactSheetDisplay {
  const sys = system || {};
  const level = clampLevel(sys.currentLevel ?? sys.level);
  const baseValues: ArtifactSheetBaseValue[] = (Array.isArray(sys.baseValues) ? sys.baseValues : []).map(
    (bv: any) => ({
      slot: String(bv?.slot || '').toUpperCase(),
      label: String(bv?.label || ''),
      value: bv?.value != null && bv.value !== '' ? String(bv.value) : String(bv?.note || ''),
    }),
  );
  const abilities = visibleAbilityRows(
    Array.isArray(sys.levelProgression) ? sys.levelProgression : [],
    level,
  ).map((row: any) => ({
    name: String(row?.name || ''),
    type: String(row?.type || ''),
    effect: String(row?.effect || ''),
    special: String(row?.special || ''),
  }));
  return {
    level,
    baseValues,
    abilities,
    hasBaseValues: baseValues.length > 0,
    hasAbilities: abilities.length > 0,
  };
}

function previewLabel(item: any, level: number): string {
  const name = String(item?.name || '')
    .replace(/\s*-\s*Level\s+\S+\s*$/i, '')
    .trim();
  return name || `Level ${level}`;
}

function sameDisplay(a: ArtifactSheetDisplay, b: ArtifactSheetDisplay): boolean {
  return JSON.stringify({ b: a.baseValues, a: a.abilities }) === JSON.stringify({ b: b.baseValues, a: b.abilities });
}

function resolveChildWorldItems(item: any): any[] {
  const nodeId = String(readFlag(item, 'evolutionNodeId') || readFlag(item, 'nodeId') || '');
  if (!nodeId) return [];

  const rootId = String(readFlag(item, 'evolutionRootItemId') || '');
  const root = rootId ? (globalThis as any).game?.items?.get?.(rootId) : null;
  const folderId = String(root?.folder?.id || item?.folder?.id || '');
  if (!folderId) return [];

  const folderItems = getWorldArtifactItemsInFolder(folderId);
  return getChildWorldItemsForNode(nodeId, folderItems);
}

/** Next evolution node(s), or a same-item +1 fallback when the table still has more rows. */
export function resolveNextArtifactPreviews(item: any): ArtifactSheetNextPreview[] {
  const children = resolveChildWorldItems(item);
  if (children.length) {
    return children
      .map((child) => {
        const display = displayFromArtifactSystem(child?.system);
        return { ...display, label: previewLabel(child, display.level) };
      })
      .filter((p) => p.hasAbilities || p.hasBaseValues);
  }

  const current = displayFromArtifactSystem(item?.system);
  if (current.level >= 10) return [];
  const next = displayFromArtifactSystem({
    ...(item?.system || {}),
    level: current.level + 1,
    currentLevel: current.level + 1,
  });
  if (sameDisplay(current, next)) return [];
  return [{ ...next, label: previewLabel(item, next.level) }];
}
