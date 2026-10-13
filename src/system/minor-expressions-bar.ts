/**
 * Minor Expressions bar — pure state + row builder for the floating player
 * panel (mirrors the Important NPCs bar). Lists the character's chosen Minor
 * Expressions with the resolved tier text and tracks uses per Safe Haven Rest
 * (Mastery Rank × 2, as on the print sheet).
 */

import {
  getMinorExpressionDefinition,
  tierBodyForExpression,
  tierThresholdForAttributeValue,
  type MinorExpressionAttribute,
} from '../utils/minor-expressions.js';

export const FLAG_SCOPE = 'mastery-system';
export const MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING = 'minorExpressionsBarCollapsed';
export const MINOR_EXPRESSIONS_BAR_POSITION_SETTING = 'minorExpressionsBarPosition';
export const MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING = 'minorExpressionsBarHidden';
/** Actor flag: uses since the last Safe Haven Rest. */
export const MINOR_EXPRESSION_USES_FLAG = 'minorExpressionUses';

export interface MinorExpressionsBarPosition {
  x: number;
  y: number;
}

export const DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION: MinorExpressionsBarPosition = { x: 90, y: 160 };
const BAR_EDGE_PAD = 8;

const ATTRIBUTE_LABELS: Record<MinorExpressionAttribute, string> = {
  might: 'Might',
  agility: 'Agility',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence',
  wits: 'Wits',
};

export interface MinorExpressionBarRow {
  id: string;
  name: string;
  attribute: MinorExpressionAttribute;
  attributeLabel: string;
  attributeValue: number;
  /** Resolved tier threshold (4/8/12/16/20) or null below the minimum. */
  tier: number | null;
  tagline: string;
  constraints: string;
  /** Effect text at the current tier (tagline when locked). */
  body: string;
}

export interface MinorExpressionsBarModel {
  rows: MinorExpressionBarRow[];
  masteryRank: number;
  usesMax: number;
  usesSpent: number;
  usesLeft: number;
}

export function sanitizeMinorExpressionsBarPosition(raw: unknown): MinorExpressionsBarPosition {
  const obj = raw && typeof raw === 'object' ? (raw as { x?: unknown; y?: unknown }) : {};
  const x = Number(obj.x);
  const y = Number(obj.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { ...DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION };
  return { x: Math.round(x), y: Math.round(y) };
}

export function clampMinorExpressionsBarPosition(
  pos: MinorExpressionsBarPosition,
  viewport: { width: number; height: number },
  size: { width: number; height: number },
): MinorExpressionsBarPosition {
  const width = Math.max(0, Number(size.width) || 0);
  const height = Math.max(0, Number(size.height) || 0);
  const maxX = Math.max(BAR_EDGE_PAD, (Number(viewport.width) || 0) - width - BAR_EDGE_PAD);
  const maxY = Math.max(BAR_EDGE_PAD, (Number(viewport.height) || 0) - height - BAR_EDGE_PAD);
  return {
    x: Math.min(maxX, Math.max(BAR_EDGE_PAD, pos.x)),
    y: Math.min(maxY, Math.max(BAR_EDGE_PAD, pos.y)),
  };
}

/** Uses per Safe Haven Rest: Mastery Rank × 2 (print sheet rule). */
export function minorExpressionUsesMax(masteryRank: number): number {
  return Math.max(0, Math.floor(Number(masteryRank) || 0)) * 2;
}

export function readMinorExpressionUses(actor: any): number {
  let raw: unknown;
  try {
    raw = actor?.getFlag?.(FLAG_SCOPE, MINOR_EXPRESSION_USES_FLAG);
  } catch {
    raw = undefined;
  }
  if (raw === undefined) raw = actor?.flags?.[FLAG_SCOPE]?.[MINOR_EXPRESSION_USES_FLAG];
  return Math.max(0, Math.floor(Number(raw) || 0));
}

/** Rows + use budget for one character actor (system data only, no Foundry globals). */
export function buildMinorExpressionsBarModel(actor: any): MinorExpressionsBarModel {
  const system = actor?.system ?? {};
  const masteryRank = Math.max(0, Math.floor(Number(system?.mastery?.rank) || 0));
  const ids: string[] = Array.isArray(system?.minorExpressions) ? system.minorExpressions : [];
  const rows: MinorExpressionBarRow[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    const def = getMinorExpressionDefinition(id);
    if (!def) continue;
    seen.add(id);
    const attributeValue = Math.floor(Number(system?.attributes?.[def.attribute]?.value) || 0);
    rows.push({
      id,
      name: def.name,
      attribute: def.attribute,
      attributeLabel: ATTRIBUTE_LABELS[def.attribute] ?? def.attribute,
      attributeValue,
      tier: tierThresholdForAttributeValue(attributeValue),
      tagline: def.tagline,
      constraints: def.constraints ?? '',
      body: tierBodyForExpression(def, attributeValue),
    });
  }
  const usesMax = minorExpressionUsesMax(masteryRank);
  const usesSpent = Math.min(usesMax, readMinorExpressionUses(actor));
  return {
    rows,
    masteryRank,
    usesMax,
    usesSpent,
    usesLeft: Math.max(0, usesMax - usesSpent),
  };
}

/**
 * Character shown on this client's bar: the user's assigned character, else
 * the first owned world character. GM gets nothing (the bar is a player aid).
 */
export function resolveMinorExpressionsBarActor(user: any, actors: Iterable<any> | null | undefined): any | null {
  if (!user || user.isGM) return null;
  const assigned = user.character;
  if (assigned && String(assigned.type || '') === 'character') return assigned;
  for (const actor of actors ?? []) {
    if (String(actor?.type || '') !== 'character') continue;
    if (actor?.isOwner || actor?.testUserPermission?.(user, 'OWNER')) return actor;
  }
  return null;
}

export function registerMinorExpressionsBarSettings(): void {
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING, {
      name: 'Minor Expressions bar collapsed',
      scope: 'client',
      config: false,
      type: Boolean,
      default: false,
    });
    g.game.settings.register(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_POSITION_SETTING, {
      name: 'Minor Expressions bar position',
      scope: 'client',
      config: false,
      type: Object,
      default: { ...DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION },
    });
    g.game.settings.register(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING, {
      name: 'Minor Expressions bar',
      hint: 'Hide the floating Minor Expressions panel on this client.',
      scope: 'client',
      config: true,
      type: Boolean,
      default: false,
      onChange: () => {
        try {
          g.Hooks?.callAll?.('masteryMinorExpressionsBarRefresh');
        } catch {
          /* ignore */
        }
      },
    });
  } catch (err) {
    console.warn('Mastery System | registerMinorExpressionsBarSettings failed', err);
  }
}

export function readMinorExpressionsBarCollapsed(): boolean {
  try {
    return !!(globalThis as any).game?.settings?.get?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING);
  } catch {
    return false;
  }
}

export async function setMinorExpressionsBarCollapsed(collapsed: boolean): Promise<void> {
  try {
    await (globalThis as any).game?.settings?.set?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_COLLAPSED_SETTING, !!collapsed);
  } catch (err) {
    console.warn('Mastery System | setMinorExpressionsBarCollapsed failed', err);
  }
}

export function readMinorExpressionsBarHidden(): boolean {
  try {
    return !!(globalThis as any).game?.settings?.get?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_HIDDEN_SETTING);
  } catch {
    return false;
  }
}

export function readMinorExpressionsBarPosition(): MinorExpressionsBarPosition {
  try {
    return sanitizeMinorExpressionsBarPosition(
      (globalThis as any).game?.settings?.get?.(FLAG_SCOPE, MINOR_EXPRESSIONS_BAR_POSITION_SETTING),
    );
  } catch {
    return { ...DEFAULT_MINOR_EXPRESSIONS_BAR_POSITION };
  }
}

export async function setMinorExpressionsBarPosition(pos: MinorExpressionsBarPosition): Promise<void> {
  try {
    await (globalThis as any).game?.settings?.set?.(
      FLAG_SCOPE,
      MINOR_EXPRESSIONS_BAR_POSITION_SETTING,
      sanitizeMinorExpressionsBarPosition(pos),
    );
  } catch (err) {
    console.warn('Mastery System | setMinorExpressionsBarPosition failed', err);
  }
}
