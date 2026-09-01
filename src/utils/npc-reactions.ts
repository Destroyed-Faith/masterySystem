/**
 * Optional NPC / Summon Reactions — opt-in only.
 *
 * Unconfigured NPCs have 0 reaction slots and never appear in the Reaction
 * Window or the combat-strip R counter. Bosses and elites add rows here.
 */

import type { NpcAttackSpecialEntry } from '../types/actor.js';
import { filterCatalog } from './power-catalog.js';
import { buildPowerItemFromCatalogEntry } from './power-item-builder.js';
import {
  coerceNpcAttackSpecials,
  coerceNpcPhasesArray,
  npcSpecialEffectString,
} from './npc-attack-model.js';
import { buildBasicReactionItems } from '../combat/basic-combat.js';
import { getEffect } from './special-effects.js';

export type NpcReactionSource = 'basic' | 'catalog' | 'custom';

export interface NpcReactionRow {
  id: string;
  name: string;
  source: NpcReactionSource;
  /** Standard maneuver: guard | evade | counterattack | dive-for-cover | interpose */
  basicId?: string;
  /** Catalog templateId */
  templateId?: string;
  /** Catalog power level 1–16 */
  rank?: number;
  specials?: NpcAttackSpecialEntry[];
}

export const NPC_STANDARD_REACTIONS: Array<{
  id: string;
  name: string;
  description: string;
}> = [
  { id: 'guard', name: 'Guard', description: '+MR × 2 Armor vs the triggering hit.' },
  { id: 'evade', name: 'Evade', description: '+MR × 2 Evade vs the triggering attack.' },
  { id: 'counterattack', name: 'Counterattack', description: 'Basic Attack against the creature that hit you.' },
  { id: 'dive-for-cover', name: 'Dive for Cover', description: 'Move 2 × MR m to leave an AoE.' },
  { id: 'interpose', name: 'Interpose', description: 'Take half of an adjacent ally’s damage.' },
];

export function newNpcReactionId(): string {
  return `npc-rx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function coerceNpcReactionsArray(raw: unknown): NpcReactionRow[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? Object.keys(raw as object)
          .filter((k) => /^\d+$/.test(k))
          .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
          .map((k) => (raw as Record<string, unknown>)[k])
      : [];
  return list
    .filter((row) => row && typeof row === 'object')
    .map((row) => normalizeNpcReactionRow(row as Record<string, unknown>));
}

export function normalizeNpcReactionRow(row: Record<string, unknown> | null | undefined): NpcReactionRow {
  const o = row && typeof row === 'object' ? row : {};
  const sourceRaw = String(o.source || 'custom').toLowerCase();
  const source: NpcReactionSource =
    sourceRaw === 'basic' || sourceRaw === 'catalog' ? sourceRaw : 'custom';
  const rankN = Math.floor(Number(o.rank));
  const specials = coerceNpcAttackSpecials(o.specials);
  return {
    id: String(o.id || newNpcReactionId()),
    name: String(o.name || 'Reaction').trim() || 'Reaction',
    source,
    basicId: o.basicId ? String(o.basicId) : undefined,
    templateId: o.templateId ? String(o.templateId) : undefined,
    rank: Number.isFinite(rankN) && rankN >= 1 ? Math.min(16, rankN) : undefined,
    specials,
  };
}

export function clampNpcReactionSlots(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(10, n);
}

export function defaultNpcReactionRank(masteryRank: number): number {
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 2));
  return Math.max(1, Math.min(16, mr * 2));
}

export function listNpcCatalogReactions(): Array<{
  templateId: string;
  name: string;
  description: string;
}> {
  const seen = new Set<string>();
  const out: Array<{ templateId: string; name: string; description: string }> = [];
  for (const e of filterCatalog({ category: 'reaction' })) {
    if (e.chosenSpecial) continue;
    if (Array.isArray(e.requiresEcho) && e.requiresEcho.length > 0) continue;
    if (String(e.name || '').toLowerCase().includes('artifact only')) continue;
    if (seen.has(e.templateId)) continue;
    seen.add(e.templateId);
    out.push({
      templateId: e.templateId,
      name: String(e.name || e.templateName || e.templateId),
      description: String(e.description || ''),
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
  return out;
}

export function resolveNpcReactionConfig(system: any): {
  slots: number;
  rows: NpcReactionRow[];
  phaseIndex: number | null;
} {
  if (!system) return { slots: 0, rows: [], phaseIndex: null };
  const phases = coerceNpcPhasesArray(system.phases);
  if (phases.length > 0) {
    const pi = Math.max(
      0,
      Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)),
    );
    const phase = phases[pi] || {};
    const rows = coerceNpcReactionsArray(phase.npcReactions ?? system.npcReactions);
    const slots = clampNpcReactionSlots(phase.npcReactionSlots ?? system.npcReactionSlots);
    return { slots, rows, phaseIndex: pi };
  }
  return {
    slots: clampNpcReactionSlots(system.npcReactionSlots),
    rows: coerceNpcReactionsArray(system.npcReactions),
    phaseIndex: null,
  };
}

export function isNpcLikeActor(actor: any): boolean {
  const t = String(actor?.type || '');
  return t === 'npc' || t === 'summon';
}

/** Characters always participate. NPCs / summons only when slots + rows are set. */
export function actorParticipatesInReactions(actor: any): boolean {
  if (!actor) return false;
  if (!isNpcLikeActor(actor)) return true;
  const { slots, rows } = resolveNpcReactionConfig(actor.system);
  return slots > 0 && rows.length > 0;
}

export function npcReactionSlotsForEconomy(actor: any): number {
  if (!isNpcLikeActor(actor)) return 1;
  const { slots, rows } = resolveNpcReactionConfig(actor.system);
  if (slots <= 0 || rows.length === 0) return 0;
  return slots;
}

function buildDiveForCoverItem(actor: any): any {
  const mr = Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 2));
  const moveM = mr * 2;
  return {
    id: 'basic-reaction-dive-for-cover',
    name: 'Dive for Cover',
    type: 'basic-reaction',
    system: {
      powerType: 'reaction',
      templateId: 'basic-dive-for-cover',
      description: `Move up to ${moveM} m (2 × MR). If you leave the AoE completely, you are not affected.`,
    },
    basicReaction: 'dive-for-cover',
    mechanics: {},
  };
}

function buildNpcInterposeItem(): any {
  return {
    id: 'basic-reaction-interpose',
    name: 'Interpose',
    type: 'basic-reaction',
    system: {
      powerType: 'reaction',
      templateId: 'basic-interpose',
      description:
        'When an ally within 2 m takes damage, step in and take half of it (rounded up to you).',
    },
    basicReaction: 'interpose',
    mechanics: {},
  };
}

function materializeBasic(actor: any, basicId: string): any | null {
  const id = String(basicId || '');
  if (id === 'interpose') return buildNpcInterposeItem();
  if (id === 'dive-for-cover') return buildDiveForCoverItem(actor);
  const basics = buildBasicReactionItems(actor);
  return basics.find((b) => b.basicReaction === id) ?? null;
}

function materializeCatalog(actor: any, row: NpcReactionRow): any | null {
  const tid = String(row.templateId || '');
  if (!tid) return null;
  const entry = filterCatalog({ category: 'reaction', templateId: tid })[0];
  if (!entry) return null;
  const mr = Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 2));
  const rank = row.rank ?? defaultNpcReactionRank(mr);
  const itemData = buildPowerItemFromCatalogEntry(entry, rank);
  if (!itemData) return null;
  return {
    id: `npc-rx-cat-${tid}`,
    name: String(itemData.name || row.name || entry.name),
    type: 'power',
    system: {
      ...((itemData.system as object) || {}),
      powerType: 'reaction',
    },
  };
}

function materializeCustom(row: NpcReactionRow): any {
  const specials = (row.specials || [])
    .map((s) => npcSpecialEffectString(String(s.special || ''), s.specialValue))
    .filter(Boolean);
  return {
    id: row.id || newNpcReactionId(),
    name: row.name || 'Reaction',
    type: 'power',
    system: {
      powerType: 'reaction',
      templateId: 'npc-custom-reaction',
      description: specials.length ? `Applies ${specials.join(', ')}.` : 'Custom Reaction.',
      specials,
    },
    npcReactionSpecials: specials,
    mechanics: {},
  };
}

/** Synthetic reaction powers for a configured NPC / summon. */
export function materializeNpcReactionPowers(actor: any): any[] {
  if (!isNpcLikeActor(actor)) return [];
  const { slots, rows } = resolveNpcReactionConfig(actor.system);
  if (slots <= 0 || !rows.length) return [];
  const out: any[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    let item: any = null;
    if (row.source === 'basic') item = materializeBasic(actor, String(row.basicId || ''));
    else if (row.source === 'catalog') item = materializeCatalog(actor, row);
    else item = materializeCustom(row);
    if (!item) continue;
    const id = String(item.id || '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    item.npcConfiguredReaction = true;
    out.push(item);
  }
  return out;
}

export async function applyNpcReactionSpecialsToTarget(
  target: any,
  specials: string[],
  sourceActor: any,
): Promise<string[]> {
  const limitNotes: string[] = [];
  if (!target || !specials?.length) return limitNotes;
  const list: any[] = Array.isArray(target.system?.statusEffects)
    ? [...target.system.statusEffects]
    : [];
  const sourceName = String(sourceActor?.name ?? 'NPC');
  const combat = (globalThis as any).game?.combat ?? null;
  const {
    actorMasteryRank,
    clampSpecialApplication,
    formatApplicationLimitNote,
    specialRoundAppsUpdate,
  } = await import('../combat/special-application.js');
  let workingApps: ReturnType<typeof clampSpecialApplication>['nextApps'] = null;
  let appsUpdate: Record<string, unknown> = {};
  for (const raw of specials) {
    const match = String(raw || '').match(/^([^(]+)(?:\((\d+)\))?$/);
    if (!match) continue;
    const effectName = match[1].trim();
    let effectValue = match[2] ? parseInt(match[2], 10) : null;
    const effectId = getEffect(effectName)?.id;
    if (effectValue != null && effectValue > 0 && effectId) {
      const clamp = clampSpecialApplication(target, effectId, effectValue, combat, workingApps);
      if (clamp.nextApps) {
        workingApps = clamp.nextApps;
        appsUpdate = specialRoundAppsUpdate(clamp.nextApps);
      }
      if (clamp.ignored > 0) {
        limitNotes.push(
          formatApplicationLimitNote(effectId, clamp.ignored, clamp.limit, actorMasteryRank(target)),
        );
      }
      effectValue = clamp.applied;
      if (effectValue <= 0) continue;
    }
    const existing = list.find((e: any) => (effectId && e.id === effectId) || e.name === effectName);
    if (existing) {
      if (effectValue != null) existing.value = (existing.value || 0) + effectValue;
      if (effectId && !existing.id) existing.id = effectId;
    } else {
      list.push({
        id: effectId,
        name: effectName,
        value: effectValue,
        source: sourceName,
        timestamp: Date.now(),
      });
    }
  }
  await target.update?.({ 'system.statusEffects': list, ...appsUpdate });
  return limitNotes;
}

export function newCustomNpcReaction(masteryRank: number): NpcReactionRow {
  return {
    id: newNpcReactionId(),
    name: 'Neue Reaction',
    source: 'custom',
    rank: defaultNpcReactionRank(masteryRank),
    specials: [],
  };
}

export function newStandardNpcReaction(basicId: string): NpcReactionRow | null {
  const std = NPC_STANDARD_REACTIONS.find((s) => s.id === basicId);
  if (!std) return null;
  return {
    id: newNpcReactionId(),
    name: std.name,
    source: 'basic',
    basicId: std.id,
    specials: [],
  };
}

export function newCatalogNpcReaction(templateId: string, masteryRank: number): NpcReactionRow | null {
  const hit = listNpcCatalogReactions().find((e) => e.templateId === templateId);
  if (!hit) return null;
  return {
    id: newNpcReactionId(),
    name: hit.name,
    source: 'catalog',
    templateId: hit.templateId,
    rank: defaultNpcReactionRank(masteryRank),
    specials: [],
  };
}
