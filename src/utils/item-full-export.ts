/**
 * Read-only Full Item export for Foundry parent Items (especially Echo Artifacts).
 *
 * Produces:
 *  - exact JSON of the stored Item document (`toObject`)
 *  - human-readable Markdown that separates STORED data from REGISTRY/resolved data
 *
 * Never writes to the Item. Never migrates / resyncs / regenerates.
 */

import { getEchoArtifact } from './echo-artifacts.js';
import { getGeneralArtifact } from './general-artifacts.js';
import {
  resolveFullLevelProgression,
  visibleAbilityRows,
} from './artifact-visible-abilities.js';
import type { ArtifactLevelProgressionRow } from '../types/item.js';

export const ITEM_FULL_EXPORT_KIND = 'mastery-item-full-export' as const;
export const ITEM_FULL_EXPORT_SCHEMA_VERSION = 1 as const;

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

function readMsFlag(item: any, key: string): unknown {
  if (typeof item?.getFlag === 'function') return item.getFlag('mastery-system', key);
  return item?.flags?.['mastery-system']?.[key];
}

function safeFilename(name: string): string {
  return String(name || 'item')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'item';
}

function saveTextFile(contents: string, mime: string, filename: string): void {
  const save = (globalThis as any).foundry?.utils?.saveDataToFile;
  if (typeof save === 'function') {
    save(contents, mime, filename);
    return;
  }
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exact stored document snapshot (Foundry `toObject` when available). */
export function readStoredItemDocument(item: any): Record<string, unknown> {
  if (typeof item?.toObject === 'function') {
    return plain(item.toObject()) as Record<string, unknown>;
  }
  return plain({
    _id: item?.id ?? item?._id ?? null,
    name: item?.name,
    type: item?.type,
    img: item?.img,
    system: item?.system,
    flags: item?.flags,
    folder: item?.folder?.id ?? item?.folder ?? null,
    sort: item?.sort,
  }) as Record<string, unknown>;
}

function resolveRegistryKeys(item: any, stored: Record<string, unknown>): {
  echoArtifactKey: string | null;
  generalArtifactKey: string | null;
} {
  const sys = (stored.system || {}) as Record<string, unknown>;
  const flags = ((stored.flags as any)?.['mastery-system'] || {}) as Record<string, unknown>;
  const echoArtifactKey =
    String(
      readMsFlag(item, 'echoArtifactKey') ||
        flags.echoArtifactKey ||
        sys.echoKey ||
        sys.echoArtifactKey ||
        '',
    ).trim() || null;
  const generalArtifactKey =
    String(
      readMsFlag(item, 'generalArtifactKey') ||
        flags.generalArtifactKey ||
        sys.generalArtifactKey ||
        sys.definitionKey ||
        '',
    ).trim() || null;
  return { echoArtifactKey, generalArtifactKey };
}

function formatProgressionRowMd(row: ArtifactLevelProgressionRow | any, indent = ''): string[] {
  const lines: string[] = [];
  const name = String(row?.name || '(unnamed)');
  const type = String(row?.type || '');
  lines.push(`${indent}- **${name}**${type ? ` _(${type})_` : ''}`);
  const fields: Array<[string, unknown]> = [
    ['Level', row?.level],
    ['Range', row?.range],
    ['AoE', row?.aoe],
    ['Duration', row?.duration],
    ['Effect', row?.effect],
    ['Special', row?.special],
    ['Template', row?.powerTemplateId],
    ['Chosen Special', row?.chosenSpecialKey],
  ];
  for (const [label, val] of fields) {
    if (val == null || val === '' || val === '—') continue;
    lines.push(`${indent}  - ${label}: ${String(val)}`);
  }
  return lines;
}

function formatBaseValuesMd(baseValues: any[]): string[] {
  if (!Array.isArray(baseValues) || !baseValues.length) return ['_(none)_'];
  return baseValues.map((bv) => {
    const slot = String(bv?.slot || '?').toUpperCase();
    const label = String(bv?.label || bv?.type || '');
    const value = bv?.value != null && bv.value !== '' ? String(bv.value) : String(bv?.note || '');
    return `- **${slot}** ${label}${value ? `: ${value}` : ''}`;
  });
}

function formatStoneFunctionMd(sf: any, title: string): string[] {
  if (!sf || typeof sf !== 'object') return [];
  const lines = [`### ${title}`];
  for (const [k, v] of Object.entries(sf)) {
    if (v == null || v === '') continue;
    lines.push(`- **${k}:** ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  }
  return lines;
}

/** Group stored levelProgression rows by level 1–10 for Markdown. */
export function groupProgressionByLevel(
  rows: ArtifactLevelProgressionRow[] | null | undefined,
): Map<number, ArtifactLevelProgressionRow[]> {
  const map = new Map<number, ArtifactLevelProgressionRow[]>();
  for (let lvl = 1; lvl <= 10; lvl++) map.set(lvl, []);
  for (const row of rows || []) {
    const lvl = Math.max(1, Math.min(10, Math.floor(Number(row?.level) || 1)));
    map.get(lvl)!.push(row);
  }
  return map;
}

export interface ItemFullExportBundle {
  exportKind: typeof ITEM_FULL_EXPORT_KIND;
  schemaVersion: typeof ITEM_FULL_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  systemVersion: string | null;
  /** Exact stored Item document. */
  storedItem: Record<string, unknown>;
  /** Identity / location hints (not always inside toObject). */
  identity: {
    id: string | null;
    uuid: string | null;
    parentActorId: string | null;
    parentActorName: string | null;
    isEmbedded: boolean;
    echoArtifactKey: string | null;
    generalArtifactKey: string | null;
  };
  /**
   * Registry snapshot for comparison — clearly NOT stored on the Item.
   * Present only when an Echo / General definition key resolves.
   */
  registryReference: {
    source: 'echo' | 'general' | null;
    key: string | null;
    definition: Record<string, unknown> | null;
  };
  /** Human-readable Markdown. */
  markdown: string;
}

/** Build the full export bundle (pure aside from reading the Item). */
export function buildItemFullExportBundle(
  item: any,
  opts: { exportedAt?: string; systemVersion?: string | null } = {},
): ItemFullExportBundle {
  const storedItem = readStoredItemDocument(item);
  const sys = (storedItem.system || {}) as Record<string, any>;
  const { echoArtifactKey, generalArtifactKey } = resolveRegistryKeys(item, storedItem);

  const parent =
    item?.parent?.documentName === 'Actor'
      ? item.parent
      : item?.actor?.documentName === 'Actor'
        ? item.actor
        : null;

  const identity = {
    id: String(item?.id || storedItem._id || '') || null,
    uuid: typeof item?.uuid === 'string' ? item.uuid : null,
    parentActorId: parent ? String(parent.id || '') || null : null,
    parentActorName: parent ? String(parent.name || '') || null : null,
    isEmbedded: !!parent,
    echoArtifactKey,
    generalArtifactKey,
  };

  let registryReference: ItemFullExportBundle['registryReference'] = {
    source: null,
    key: null,
    definition: null,
  };
  if (echoArtifactKey) {
    const def = getEchoArtifact(echoArtifactKey);
    if (def) {
      registryReference = {
        source: 'echo',
        key: echoArtifactKey,
        definition: plain(def as unknown) as Record<string, unknown>,
      };
    }
  }
  if (!registryReference.definition && generalArtifactKey) {
    const def = getGeneralArtifact(generalArtifactKey);
    if (def) {
      registryReference = {
        source: 'general',
        key: generalArtifactKey,
        definition: plain(def as unknown) as Record<string, unknown>,
      };
    }
  }

  const exportedAt = opts.exportedAt ?? new Date().toISOString();
  const systemVersion =
    opts.systemVersion ??
    (String((globalThis as any).game?.system?.version || '') || null);

  const markdown = renderItemFullExportMarkdown({
    itemName: String(item?.name || storedItem.name || 'Item'),
    itemType: String(item?.type || storedItem.type || ''),
    exportedAt,
    systemVersion,
    identity,
    storedItem,
    sys,
    registryReference,
  });

  return {
    exportKind: ITEM_FULL_EXPORT_KIND,
    schemaVersion: ITEM_FULL_EXPORT_SCHEMA_VERSION,
    exportedAt,
    systemVersion,
    storedItem,
    identity,
    registryReference,
    markdown,
  };
}

function renderItemFullExportMarkdown(args: {
  itemName: string;
  itemType: string;
  exportedAt: string;
  systemVersion: string | null;
  identity: ItemFullExportBundle['identity'];
  storedItem: Record<string, unknown>;
  sys: Record<string, any>;
  registryReference: ItemFullExportBundle['registryReference'];
}): string {
  const {
    itemName,
    itemType,
    exportedAt,
    systemVersion,
    identity,
    storedItem,
    sys,
    registryReference,
  } = args;
  const lines: string[] = [];
  const push = (...xs: string[]) => {
    lines.push(...xs);
  };

  push(`# Export Full Item — ${itemName}`);
  push('');
  push('> **Read-only dump.** This export does not modify the Item.');
  push('> Sections marked **STORED** come from the Item document.');
  push('> Sections marked **REGISTRY** are resolved from the system catalog and are **not** stored on the Item.');
  push('');
  push('## Meta');
  push(`- Exported at: ${exportedAt}`);
  if (systemVersion) push(`- System version: ${systemVersion}`);
  push(`- Item type: ${itemType}`);
  push(`- Item id: ${identity.id ?? '—'}`);
  push(`- UUID: ${identity.uuid ?? '—'}`);
  push(
    `- Location: ${
      identity.isEmbedded
        ? `Embedded on Actor ${identity.parentActorName || '?'} (${identity.parentActorId})`
        : 'World / sidebar Item'
    }`,
  );
  if (identity.echoArtifactKey) push(`- Echo Artifact key (STORED flag/field): \`${identity.echoArtifactKey}\``);
  if (identity.generalArtifactKey) {
    push(`- General Artifact key (STORED flag/field): \`${identity.generalArtifactKey}\``);
  }
  push('');

  push('## A. STORED — Identifiers & Flags');
  push('```json');
  push(
    JSON.stringify(
      {
        _id: storedItem._id ?? null,
        name: storedItem.name,
        type: storedItem.type,
        img: storedItem.img,
        folder: storedItem.folder ?? null,
        flags: storedItem.flags ?? {},
      },
      null,
      2,
    ),
  );
  push('```');
  push('');

  push('## B. STORED — System overview');
  push(`- Level / currentLevel: ${sys.level ?? '—'} / ${sys.currentLevel ?? '—'}`);
  push(`- Slot: ${sys.slot ?? '—'}`);
  push(`- Base profile: ${sys.baseProfile ?? '—'}`);
  push(`- Binding: ${sys.binding ?? '—'}`);
  push(`- Equipped: ${sys.equipped ?? '—'}`);
  push(`- Lore / description length: ${String(sys.lore || sys.description || '').length} chars`);
  push('');

  push('## C. STORED — Base Values');
  push(...formatBaseValuesMd(sys.baseValues));
  push('');

  const picks = Array.isArray(sys.progressionPicks) ? sys.progressionPicks : [];
  if (picks.length) {
    push('## D. STORED — Progression picks');
    push('```json');
    push(JSON.stringify(picks, null, 2));
    push('```');
    push('');
  }

  push(...formatStoneFunctionMd(sys.stoneFunction, 'E. STORED — Stone Function'));
  if (Array.isArray(sys.extraStoneFunctions) && sys.extraStoneFunctions.length) {
    sys.extraStoneFunctions.forEach((sf: any, i: number) => {
      push(...formatStoneFunctionMd(sf, `E.${i + 2}. STORED — Extra Stone Function`));
    });
  }
  push('');

  // Full authored table as stored
  const storedRows = Array.isArray(sys.levelProgression)
    ? (sys.levelProgression as ArtifactLevelProgressionRow[])
    : [];
  const byLevel = groupProgressionByLevel(storedRows);
  push('## F. STORED — Level Progression (full table on Item)');
  if (!storedRows.length) {
    push('_(no `system.levelProgression` rows stored)_');
  } else {
    for (let lvl = 1; lvl <= 10; lvl++) {
      const rows = byLevel.get(lvl) || [];
      push(`### Level ${lvl}`);
      if (!rows.length) {
        push('- _(no rows at this level)_');
      } else {
        for (const row of rows) push(...formatProgressionRowMd(row));
      }
      push('');
    }
  }

  // Compiled view from picks + authored (still derived from STORED fields only)
  try {
    const compiled = resolveFullLevelProgression(storedRows, picks);
    if (compiled.length) {
      push('## G. DERIVED FROM STORED — Compiled progression (picks + authored)');
      push(
        '> Built only from fields on this Item (`levelProgression` + `progressionPicks`). Not a registry merge.',
      );
      push('');
      const compiledByLevel = groupProgressionByLevel(compiled);
      for (let lvl = 1; lvl <= 10; lvl++) {
        const rows = compiledByLevel.get(lvl) || [];
        if (!rows.length) continue;
        push(`### Level ${lvl}`);
        for (const row of rows) push(...formatProgressionRowMd(row));
        push('');
      }
      const currentLevel = Math.max(
        1,
        Math.min(10, Math.floor(Number(sys.currentLevel ?? sys.level) || 1)),
      );
      const visible = visibleAbilityRows(compiled, currentLevel);
      push(`### Visible abilities at current level ${currentLevel}`);
      if (!visible.length) push('- _(none)_');
      else for (const row of visible) push(...formatProgressionRowMd(row));
      push('');
    }
  } catch {
    /* ignore compile errors — export must stay read-only / non-fatal */
  }

  if (Array.isArray(sys.powers) && sys.powers.length) {
    push('## H. STORED — Legacy embedded `system.powers`');
    push('```json');
    push(JSON.stringify(sys.powers, null, 2));
    push('```');
    push('');
  }

  // Requirements / resource-ish fields commonly used on artifacts
  push('## I. STORED — Requirements & misc system keys');
  const miscKeys = [
    'requirements',
    'bonuses',
    'specials',
    'baseDamage',
    'inventorySize',
    'restUses',
    'uses',
    'resource',
    'imgAlt',
  ];
  const misc: Record<string, unknown> = {};
  for (const k of miscKeys) {
    if (sys[k] !== undefined) misc[k] = sys[k];
  }
  push('```json');
  push(JSON.stringify(misc, null, 2));
  push('```');
  push('');

  push('## J. STORED — Full `system` JSON');
  push('```json');
  push(JSON.stringify(sys, null, 2));
  push('```');
  push('');

  push('## K. REGISTRY — Catalog reference (not stored on Item)');
  if (!registryReference.definition) {
    push('_No Echo / General Artifact registry key resolved for this Item._');
  } else {
    push(
      `> Source: **${registryReference.source}** · key: \`${registryReference.key}\` · this block is catalog data for comparison only.`,
    );
    push('');
    const def = registryReference.definition as any;
    push(`- Catalog name: ${def.name ?? '—'}`);
    push(`- Slot / profile: ${def.slot ?? '—'} / ${def.baseProfile ?? '—'}`);
    if (def.description) {
      push('');
      push('### Catalog description');
      push(String(def.description));
    }
    if (Array.isArray(def.baseValues) && def.baseValues.length) {
      push('');
      push('### Catalog base values');
      push(...formatBaseValuesMd(def.baseValues));
    }
    if (Array.isArray(def.levelProgression) && def.levelProgression.length) {
      push('');
      push('### Catalog level progression');
      const regByLevel = groupProgressionByLevel(def.levelProgression);
      for (let lvl = 1; lvl <= 10; lvl++) {
        const rows = regByLevel.get(lvl) || [];
        if (!rows.length) continue;
        push(`#### Level ${lvl}`);
        for (const row of rows) push(...formatProgressionRowMd(row));
        push('');
      }
    }
    push('');
    push('### Full registry definition JSON');
    push('```json');
    push(JSON.stringify(registryReference.definition, null, 2));
    push('```');
  }
  push('');

  push('## L. Exact stored Item JSON');
  push('> Same payload as the companion `.json` download.');
  push('```json');
  push(
    JSON.stringify(
      {
        exportKind: ITEM_FULL_EXPORT_KIND,
        schemaVersion: ITEM_FULL_EXPORT_SCHEMA_VERSION,
        exportedAt,
        systemVersion,
        identity,
        storedItem,
        registryReferenceNote:
          'Registry definition omitted here; see companion Markdown section K or registryReference in the .json file.',
      },
      null,
      2,
    ),
  );
  push('```');
  push('');

  return lines.join('\n');
}

/** JSON document written to disk (includes registry for debugging). */
export function buildItemFullExportJsonDocument(bundle: ItemFullExportBundle): Record<string, unknown> {
  return {
    exportKind: bundle.exportKind,
    schemaVersion: bundle.schemaVersion,
    exportedAt: bundle.exportedAt,
    systemVersion: bundle.systemVersion,
    identity: bundle.identity,
    storedItem: bundle.storedItem,
    registryReference: bundle.registryReference,
  };
}

export function exportItemFullJson(item: any, opts: { pretty?: boolean } = {}): string {
  const bundle = buildItemFullExportBundle(item);
  const doc = buildItemFullExportJsonDocument(bundle);
  return JSON.stringify(doc, null, opts.pretty === false ? 0 : 2);
}

export function exportItemFullMarkdown(item: any): string {
  return buildItemFullExportBundle(item).markdown;
}

/**
 * Download JSON + Markdown via Foundry `saveDataToFile` when available.
 * Read-only — never updates the Item.
 */
export function downloadItemFullExport(item: any): { jsonName: string; mdName: string } {
  const bundle = buildItemFullExportBundle(item);
  const base = safeFilename(String(item?.name || 'item'));
  const jsonName = `${base}.mastery-item-full.json`;
  const mdName = `${base}.mastery-item-full.md`;
  const json = JSON.stringify(buildItemFullExportJsonDocument(bundle), null, 2);
  saveTextFile(json, 'application/json', jsonName);
  saveTextFile(bundle.markdown, 'text/markdown', mdName);
  return { jsonName, mdName };
}
