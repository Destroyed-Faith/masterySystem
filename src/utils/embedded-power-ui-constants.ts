/**
 * Shared UI option lists and normalization for EmbeddedPowerData (artifact powers).
 */

import type { EmbeddedPowerData, PowerLevelKey, PowerLevelRow } from '../types/item.js';
import { isOldPowerStructure, migrateArtifactPower } from './power-migration.js';

export const EMBEDDED_POWER_RANGE_KINDS = ['self', 'touch', 'melee', 'distance'] as const;

export const EMBEDDED_POWER_AOE_SHAPES = [
  'none',
  'single',
  'weapon',
  'aura',
  'radius',
  'cone',
  'line',
  'burst'
] as const;

export const EMBEDDED_POWER_DURATION_KINDS = [
  'instant',
  'rounds',
  'masteryRounds',
  'masteryRankRounds',
  'untilNextTurn',
  'scene'
] as const;

export const EMBEDDED_POWER_CATEGORIES = [
  'active',
  'activeBuff',
  'utility',
  'movement',
  'reaction',
  'passive'
] as const;

export const EMBEDDED_POWER_ACTION_COSTS = ['attack', 'movement', 'full', 'reaction', 'none', 'utility'] as const;

export const EMBEDDED_POWER_LIMIT_PERS = ['round', 'combat', 'day', 'week'] as const;

export function createEmptyPowerLevelRow(): PowerLevelRow {
  return {
    type: '',
    range: null,
    aoe: null,
    duration: { kind: 'instant' },
    effect: { text: '' },
    specials: []
  };
}

function mergeLevelRow(row: unknown): PowerLevelRow {
  const base = createEmptyPowerLevelRow();
  if (!row || typeof row !== 'object') return base;
  const r = row as Record<string, unknown>;
  return {
    type: typeof r.type === 'string' ? r.type : base.type,
    range: r.range === undefined ? base.range : (r.range as PowerLevelRow['range']),
    aoe: r.aoe === undefined ? base.aoe : (r.aoe as PowerLevelRow['aoe']),
    duration: { ...base.duration, ...((r.duration as object) || {}) } as PowerLevelRow['duration'],
    effect: {
      text: typeof (r.effect as any)?.text === 'string' ? (r.effect as any).text : base.effect.text,
      dice:
        (r.effect as any)?.dice != null && String((r.effect as any).dice).trim() !== ''
          ? String((r.effect as any).dice)
          : undefined
    },
    specials: Array.isArray(r.specials) ? (r.specials as PowerLevelRow['specials']) : [],
    trigger: typeof r.trigger === 'string' ? r.trigger : undefined,
    lvl: typeof r.lvl === 'number' ? r.lvl : undefined
  };
}

/** Ensure all four level keys exist with sane defaults. */
export function ensurePowerLevels(power: { levels?: Record<string, unknown> }): Record<PowerLevelKey, PowerLevelRow> {
  const keys: PowerLevelKey[] = ['1', '2', '3', '4'];
  const src = power.levels || {};
  const out = {} as Record<PowerLevelKey, PowerLevelRow>;
  for (const k of keys) {
    out[k] = mergeLevelRow(src[k]);
  }
  return out;
}

function cloneJson<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

/**
 * Migrate legacy powers and normalize shape for the embedded-power editor.
 */
export function normalizePowersForEditor(powers: unknown[] | null | undefined): EmbeddedPowerData[] {
  const arr = Array.isArray(powers) ? powers : [];
  return arr.map((p) => {
    const base = isOldPowerStructure(p) ? migrateArtifactPower(p) : cloneJson(p as object);
    const raw = base as Record<string, any>;
    const x: EmbeddedPowerData = {
      ...(raw as EmbeddedPowerData),
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Unnamed',
      category: raw.category || 'active',
      tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
      cost: raw.cost && typeof raw.cost === 'object' ? { ...raw.cost } : {},
      levels: ensurePowerLevels(raw as { levels?: Record<string, unknown> })
    };
    return x;
  });
}

export function createDefaultEmbeddedPower(randomId?: string): EmbeddedPowerData {
  const id = randomId ?? (globalThis as any).foundry?.utils?.randomID?.() ?? undefined;
  return {
    ...(id ? { id } : {}),
    name: 'New Power',
    category: 'active',
    tags: [],
    cost: { action: 'attack' },
    levels: {
      '1': createEmptyPowerLevelRow(),
      '2': createEmptyPowerLevelRow(),
      '3': createEmptyPowerLevelRow(),
      '4': createEmptyPowerLevelRow()
    }
  };
}
