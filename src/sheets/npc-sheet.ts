/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */

import { MasteryCharacterSheet } from './character-sheet';
import { writeActorStatusList } from '../system/assign-status.js';
import {
  ALL_SPECIAL_EFFECTS,
  getEffectBaseName,
  type EffectCategory,
} from '../utils/special-effects.js';
import {
  coerceNpcPhasesArray,
  coerceNpcAttackSpecials,
  defaultNpcHealth,
  displayNpcSpecialName,
  ensureNpcHealthState,
  npcHealthHasBars,
  sumNpcAttackSlotsFromPowers,
  resolveNpcAttackSlots,
  clampNpcAttackSlots,
  sanitizeNpcSystemAttackTargeting,
  mergeNpcAttackValueLists,
  mergeNpcAttackRowSpecials,
  isValidNpcAttackWritePath,
  buildNpcPhasesReplacePatch,
  buildNpcAttackValuesReplacePatch,
  NPC_EXTRA_POWERS_UPDATE,
  NPC_ATTACK_SPECIALS_UPDATE,
  NPC_REACTIONS_UPDATE,
} from '../utils/npc-attack-model.js';
import {
  coerceStatusEffectsArray,
  readActorStatusEffects,
  reduceStatusEffectAt,
  statusEntryId,
} from '../system/active-specials.js';
import { SKILLS } from '../utils/skills.js';
import {
  ensureNpcHasPerception,
  findSituationalSkillById,
  isNpcPerceptionSkill,
  newSituationalSkillId,
  poolPreviewLabel,
  readSituationalSkills,
  removeSituationalSkill,
  suggestNpcPool,
  upsertSituationalSkill,
  type NpcPoolPreset,
  type NpcSituationalSkill,
} from '../rules/npc-situational-skills.js';

const NPC_SHEET_ATTRIBUTES = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
] as const;

function coerceNpcSkillsRecord(
  submitted: unknown,
  existing: unknown,
): Record<string, number> {
  const out: Record<string, number> = {};
  const ex =
    existing && typeof existing === 'object' ? (existing as Record<string, unknown>) : {};
  const sub =
    submitted && typeof submitted === 'object' ? (submitted as Record<string, unknown>) : {};
  const keys = new Set([...Object.keys(ex), ...Object.keys(sub), ...Object.keys(SKILLS)]);
  for (const key of keys) {
    const raw = Object.prototype.hasOwnProperty.call(sub, key) ? sub[key] : ex[key];
    if (raw == null || raw === '') {
      if (Object.prototype.hasOwnProperty.call(ex, key)) {
        out[key] = Math.max(0, Math.floor(Number(ex[key]) || 0));
      }
      continue;
    }
    if (typeof raw === 'object') {
      out[key] = Math.max(
        0,
        Math.floor(Number((raw as any).value ?? (raw as any).rank ?? 0) || 0),
      );
      continue;
    }
    out[key] = Math.max(0, Math.floor(Number(raw) || 0));
  }
  return out;
}
import {
  clampNpcInitiativeModifier,
  splitNpcInitiativeModifier,
} from '../utils/npc-initiative.js';
import { openNpcPrintSheet } from './npc-print.js';
import { copyDocumentImageLink } from '../ui/image-url-share.js';
import { makeFoundryTooltipInert } from '../ui/tooltip-passthrough.js';
import { creatureTypeSelectOptions } from '../utils/creature-type.js';
import {
  NPC_STANDARD_REACTIONS,
  clampNpcReactionSlots,
  coerceNpcReactionsArray,
  isNpcCounterattackRow,
  omitNpcCounterattackRows,
  listNpcCatalogReactions,
  newCatalogNpcReaction,
  newCustomNpcReaction,
  newStandardNpcReaction,
} from '../utils/npc-reactions.js';
import { isKnownNpcReleased, toggleKnownNpc } from '../system/known-npcs.js';
import { KnownNpcsBar } from '../ui/known-npcs-bar.js';

/**
 * Merge reaction rows from a form submit with the actor snapshot.
 * - Missing submit key → keep actor (other fields edited).
 * - Shorter submit → honor form (trash stripped fields / last row removed).
 * - Longer/stale submit → actor length wins (blocks resurrection after delete).
 * Button-driven add/delete also sets `#npcReactionWriteLock` for in-flight races.
 */
function mergeNpcReactionSubmitRows(existing: unknown, submitted: unknown): any[] {
  const prevRows = coerceNpcReactionsArray(existing);
  if (submitted === undefined) return prevRows;
  const nextRows = coerceNpcReactionsArray(submitted);
  if (nextRows.length < prevRows.length) {
    return nextRows.map((row, ri) => mergeNpcAttackRowSpecials(prevRows[ri], row));
  }
  return prevRows.map((row, ri) => mergeNpcAttackRowSpecials(row, nextRows[ri]));
}

/** Attach Ini malus/bonus split fields for the sheet dropdowns. */
function withNpcIniUi(combat: Record<string, any> | null | undefined): Record<string, any> {
  const c = combat && typeof combat === 'object' ? { ...combat } : {};
  const split = splitNpcInitiativeModifier(c.initiative);
  c.initiative = split.net;
  c.initiativeMalus = split.malus;
  c.initiativeBonus = split.bonus;
  return c;
}

/** Sheet rows for root `system.statusEffects` (combat writes here, not per phase). */
function buildNpcStatusRows(raw: unknown): Array<{
  index: number;
  id: string;
  name: string;
  value: number | null;
  hasValue: boolean;
}> {
  return coerceStatusEffectsArray(raw).map((entry, index) => {
    const id = statusEntryId(entry) || String(entry?.id || '').trim();
    const rawName = String(entry?.name || '').trim();
    const name =
      displayNpcSpecialName(rawName || id) ||
      rawName ||
      id ||
      `Status ${index + 1}`;
    const valueNum = Math.floor(Number(entry?.value));
    const hasValue =
      entry?.value !== undefined &&
      entry?.value !== null &&
      entry?.value !== ('' as any) &&
      Number.isFinite(valueNum);
    return {
      index,
      id,
      name,
      value: hasValue ? valueNum : null,
      hasValue,
    };
  });
}

function dup<T>(obj: T): T {
  const fn = (foundry as any).utils?.duplicate as ((x: T) => T) | undefined;
  return fn ? fn(obj) : (JSON.parse(JSON.stringify(obj)) as T);
}

function ensureNpcBaseShape(b: Record<string, any> | null | undefined): Record<string, any> {
  const o = b && typeof b === 'object' ? dup(b) : {};
  o.specials = coerceNpcAttackSpecials(o.specials);
  if (o.name == null || o.name === '') o.name = 'Waffenangriff';
  const stress = Math.floor(Number(o.npcStressD8));
  o.npcStressD8 = Number.isFinite(stress) && stress >= 1 ? Math.min(4, stress) : 0;
  return o;
}

function newExtraNpcPower(): Record<string, unknown> {
  return {
    name: 'Neue Power',
    attackDiceCount: 6,
    damageDiceCount: 4,
    npcRangeKind: 'melee',
    npcRangeMeters: 2,
    npcRangeMinMeters: 0,
    npcAoeShape: 'none',
    npcAoeRadiusM: 0,
    npcAttacksPerRound: 1,
    npcStressD8: 0,
    specials: [] as { special?: string; specialValue?: number }[]
  };
}

/** Legacy object-shaped `attackValues` (numeric keys) → array of entries. */
function normalizeAttackValuesArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return dup(raw) as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    return Object.keys(o)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((k) => dup(o[k])) as Record<string, unknown>[];
  }
  return [];
}

/** Prefer data-npc-attack-path; fall back to card phase/attack indices. */
function resolveNpcAttackWritePath(el: HTMLElement | null | undefined): string {
  if (!el) return '';
  const fromData = String(el.dataset?.npcAttackPath || '').trim();
  if (isValidNpcAttackWritePath(fromData)) return fromData;
  const fromName = String((el as HTMLInputElement | HTMLSelectElement).name || '')
    .replace(/\.npcRangeKind$/, '')
    .replace(/\.npcAoeRadiusM$/, '')
    .replace(/\.npcRangeMeters$/, '')
    .replace(/\.npcAoeShape$/, '')
    .replace(/\.npcStressD8$/, '')
    .trim();
  if (isValidNpcAttackWritePath(fromName)) return fromName;
  const card = el.closest?.('.npc-attack-card') as HTMLElement | null;
  if (!card) return '';
  const phaseRaw = card.dataset.phaseIndex;
  const attackRaw = card.dataset.attackIndex;
  const hasPhase = phaseRaw !== undefined && phaseRaw !== null && String(phaseRaw) !== '';
  const pi = Number(phaseRaw);
  const ai = Number(attackRaw);
  if (card.classList.contains('npc-attack-card--base')) {
    if (hasPhase && Number.isFinite(pi)) return `system.phases.${pi}.npcBaseAttack`;
    return 'system.npcBaseAttack';
  }
  if (attackRaw !== undefined && attackRaw !== null && String(attackRaw) !== '' && Number.isFinite(ai)) {
    if (hasPhase && Number.isFinite(pi)) return `system.phases.${pi}.attackValues.${ai}`;
    return `system.attackValues.${ai}`;
  }
  return '';
}

/**
 * Pull live (possibly unsaved) form values for one attack row so Melee/Range
 * toggles don't wipe a name/pool the user just typed before blur/submit.
 */
function readLiveNpcAttackFormFields(
  root: HTMLElement | null | undefined,
  path: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!root || !path) return out;
  const pick = (suffix: string, asNumber = false) => {
    const el = root.querySelector(`[name="${path}.${suffix}"]`) as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    if (!el) return;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      out[suffix] = el.checked;
      return;
    }
    const raw = String(el.value ?? '');
    if (asNumber) {
      if (raw === '') return;
      const n = Math.floor(Number(raw));
      if (Number.isFinite(n)) out[suffix] = n;
      return;
    }
    out[suffix] = raw;
  };
  pick('name');
  pick('attackDiceCount', true);
  pick('keepDice', true);
  pick('damageDiceCount', true);
  pick('npcAttacksPerRound', true);
  pick('npcStressD8', true);
  pick('npcIsSpell');
  pick('npcSplitAttack');
  pick('npcCrit');
  return out;
}

/** Coerce sheet / FormData strings so attack & damage pool &lt;select&gt; `eq` matches. */
function normalizeNpcAttackRowForContext(row: Record<string, any> | null | undefined): Record<string, any> {
  const o = row && typeof row === 'object' ? { ...row } : {};
  const intKeys = [
    'attackDiceCount',
    'damageDiceCount',
    'npcRangeMeters',
    'npcAoeRadiusM',
    'npcStressD8',
  ] as const;
  for (const k of intKeys) {
    const raw = o[k];
    if (raw === '' || raw === null || raw === undefined) {
      delete (o as any)[k];
      continue;
    }
    const n = Math.floor(Number(raw));
    if (Number.isFinite(n) && n > 0) {
      (o as any)[k] =
        k === 'attackDiceCount' || k === 'damageDiceCount' ? Math.min(80, n) : n;
    } else if (k === 'npcStressD8') (o as any)[k] = 0;
    else delete (o as any)[k];
  }
  {
    const n = Math.floor(Number(o.npcStressD8));
    o.npcStressD8 = Number.isFinite(n) && n >= 1 ? Math.min(4, n) : 0;
  }
  // Legacy Short/min band — ignored (Players Guide: flat maximum only).
  o.npcRangeMinMeters = 0;
  if (o.npcSplitAttack === true || o.npcSplitAttack === 'true' || o.npcSplitAttack === 'on') {
    o.npcSplitAttack = true;
  } else {
    delete o.npcSplitAttack;
  }
  if (o.npcIsSpell === true || o.npcIsSpell === 'true' || o.npcIsSpell === 'on') {
    o.npcIsSpell = true;
  } else {
    delete o.npcIsSpell;
  }
  if (o.npcCrit === true || o.npcCrit === 'true' || o.npcCrit === 'on') {
    o.npcCrit = true;
  } else {
    delete o.npcCrit;
  }
  {
    const apr = Math.floor(Number(o.npcAttacksPerRound));
    o.npcAttacksPerRound =
      Number.isFinite(apr) && apr >= 1 ? Math.min(5, apr) : 1;
  }
  const rk = String(o.npcRangeKind || '').toLowerCase();
  if (rk === 'ranged') {
    o.npcRangeKind = 'ranged';
    // Flat maximum 8–48 m.
    const maxRaw = Math.floor(Number(o.npcRangeMeters));
    o.npcRangeMeters =
      Number.isFinite(maxRaw) && maxRaw >= 8 ? Math.min(48, maxRaw) : 24;
  } else {
    // Persist explicit melee so empty FormData can't leave a stale "ranged" flag.
    o.npcRangeKind = 'melee';
  }
  // AoE is driven only by radius (≥ 2 m). Stale npcAoeShape alone must not keep AoE on.
  // "—" / 0 / 1 ⇒ normal single-target; shape is always derived (radius | none).
  const radRaw = Math.floor(Number(o.npcAoeRadiusM));
  const hasAoe = Number.isFinite(radRaw) && radRaw >= 2;
  if (hasAoe) {
    o.npcAoeRadiusM = radRaw;
    o.npcAoeShape = 'radius';
  } else {
    o.npcAoeRadiusM = 0;
    o.npcAoeShape = 'none';
  }
  if (o.npcRangeKind === 'melee') {
    if (hasAoe) {
      // Melee burst is around self — no extra reach band.
      o.npcRangeMeters = 0;
    } else {
      const reachRaw = Math.floor(Number(o.npcRangeMeters));
      o.npcRangeMeters =
        Number.isFinite(reachRaw) && reachRaw >= 1 && reachRaw <= 8 ? reachRaw : 2;
    }
  }
  return o;
}

const NPC_SPECIAL_CATEGORY_ORDER: EffectCategory[] = [
  'instant',
  'diminishing',
  'timed',
  'untilUsed',
  'support',
];

const NPC_SPECIAL_CATEGORY_LABELS: Record<EffectCategory, string> = {
  instant: 'Sofort',
  diminishing: 'Abklingend',
  timed: 'Zeitlich',
  untilUsed: 'Bis verbraucht',
  support: 'Support',
  multiAttack: 'Multi-Angriff',
};

type NpcSpecialSelectGroup = {
  category: EffectCategory;
  label: string;
  options: { value: string; label: string }[];
};

/** Catalog specials for NPC attacks — no Legacy keys, no Extra Attack / multiAttack. */
function buildNpcSpecialSelectGroups(): NpcSpecialSelectGroup[] {
  const byCat = new Map<EffectCategory, { value: string; label: string }[]>();
  for (const e of ALL_SPECIAL_EFFECTS) {
    if (e.category === 'multiAttack') continue; // Extra Attack is not an NPC raise special
    const label = getEffectBaseName(e.name).replace(/\(X\)/gi, '').trim() || e.id;
    const list = byCat.get(e.category) ?? [];
    list.push({ value: e.id, label });
    byCat.set(e.category, list);
  }
  const groups: NpcSpecialSelectGroup[] = [];
  for (const category of NPC_SPECIAL_CATEGORY_ORDER) {
    const options = byCat.get(category);
    if (!options?.length) continue;
    options.sort((a, b) => a.label.localeCompare(b.label, 'de', { sensitivity: 'base' }));
    groups.push({
      category,
      label: NPC_SPECIAL_CATEGORY_LABELS[category] ?? category,
      options,
    });
  }
  return groups;
}

export class MasteryNpcSheet extends MasteryCharacterSheet {
  /**
   * While a button-driven reaction list write is in flight, form submits must
   * use this snapshot — otherwise a racing submit restores the deleted row.
   */
  #npcReactionWriteLock: { phaseIndex: number | null; rows: any[] } | null = null;
  #npcReactionDeleteAbort: AbortController | null = null;

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['npc'],
    position: { width: 720, height: 820 },
    window: {
      controls: [
        {
          icon: 'fas fa-print',
          label: 'Bogen drucken',
          action: 'msNpcPrintSheet',
        },
        {
          icon: 'fas fa-compress',
          label: 'Kampfstreifen',
          action: 'msNpcPrintCompactSheet',
        },
        {
          icon: 'fas fa-link',
          label: 'MASTERY.image.copyLink',
          action: 'msCopyPictureLink',
        },
      ],
    },
    actions: {
      msNpcPrintSheet: function (this: any) {
        void openNpcPrintSheet(this.actor);
      },
      msNpcPrintCompactSheet: function (this: any) {
        void openNpcPrintSheet(this.actor, { layout: 'compact' });
      },
      msCopyPictureLink: function (this: any) {
        void copyDocumentImageLink(this.actor);
      },
      'toggle-known-npc': function (this: any, event: Event) {
        event.preventDefault();
        void this.#onToggleKnownNpc();
      },
      deleteNpcReaction: function (this: any, event: Event, target: HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        const btn = target?.closest?.('.npc-reaction-delete') as HTMLElement | null;
        if (!btn || btn.dataset.msReactionDeleting === '1') return;
        void this.#onNpcReactionDeleteFrom(btn);
      },
    },
  };

  /**
   * Parent strips the PC print control for non-characters; keep the NPC print
   * control and drop the inherited PC one if it ever leaks through.
   * @override
   */
  _getHeaderControls(): any[] {
    const controls = super._getHeaderControls?.() ?? [];
    return controls.filter((c: any) => c?.action !== 'msPrintSheet');
  }

  /** Prefer short type label "NPC: Name" via i18n; fall back to actor name. */
  get title(): string {
    const name = String((this as any).document?.name ?? '').trim();
    const typeLabel = (game as any)?.i18n?.localize?.('TYPES.Actor.npc');
    if (typeLabel && typeLabel !== 'TYPES.Actor.npc') {
      return name ? `${typeLabel}: ${name}` : typeLabel;
    }
    return name || 'NPC';
  }

  /** @override */
  static PARTS = {
    body: {
      template: 'systems/mastery-system/templates/actor/npc-sheet.hbs',
    },
  };

  /** @override */
  protected get _initialTab(): string {
    const pi = Math.floor(Number((this.actor as any)?.system?.npcActivePhaseIndex) || 0);
    const phases = coerceNpcPhasesArray((this.actor as any)?.system?.phases);
    if (phases.length > 0) {
      const clamped = Math.max(0, Math.min(phases.length - 1, pi));
      return `phase-${clamped}`;
    }
    return 'phase-0';
  }

  /**
   * ApplicationV2 unions `classes` across the inheritance chain; strip the
   * parent's `character` class so character-sheet CSS never applies here.
   * @override
   */
  _initializeApplicationOptions(options: any) {
    const opts = super._initializeApplicationOptions(options);
    opts.classes = (opts.classes || []).filter((c: string) => c !== 'character');
    return opts;
  }

  /** @override */
  async _prepareContext(options?: any) {
    const context: any = await super._prepareContext(options);

    if (context.system) {
      context.system.health = ensureNpcHealthState(context.system.health);
    }

    const isSummon = context.actor?.type === 'summon';
    const isNpcLike = context.actor?.type === 'npc' || isSummon;
    context.isSummon = isSummon;
    context.editable = this.isEditable;
    context.npcDamageDiceMin = isSummon ? 1 : 4;
    context.creatureTypeOptions = creatureTypeSelectOptions(context.system?.creatureType);

    if (isNpcLike && context.system) {
      if (context.system.creatureType == null || context.system.creatureType === undefined) {
        // Legacy: bio.type may already hold a free-text creature label.
        context.system.creatureType = String(context.system.bio?.type ?? '');
      }
      context.system.npcBaseAttack = ensureNpcBaseShape(context.system.npcBaseAttack);
      context.system.npcReactions = omitNpcCounterattackRows(
        coerceNpcReactionsArray(context.system.npcReactions),
      );
      context.system.npcReactionSlots = clampNpcReactionSlots(context.system.npcReactionSlots);

      if (isSummon) {
        context.system.phases = null;
      } else {
        const rawPhases = context.system.phases;
        const phases = coerceNpcPhasesArray(rawPhases);
        // Always replace object-shaped / corrupt phases (`{"": …}` from
        // system.phases..* writes) so the sheet never iterates empty keys.
        if (phases.length > 0) {
          if (
            context.system.npcActivePhaseIndex == null ||
            !Number.isFinite(Number(context.system.npcActivePhaseIndex))
          ) {
            context.system.npcActivePhaseIndex = 0;
          }
          context.system.phases = phases.map((phase: any, i: number) => ({
            ...phase,
            combat: withNpcIniUi(phase?.combat),
            npcBaseAttack: ensureNpcBaseShape(phase?.npcBaseAttack),
            health: ensureNpcHealthState(phase?.health ?? context.system.health),
            npcReactions: omitNpcCounterattackRows(coerceNpcReactionsArray(phase?.npcReactions)),
            npcReactionSlots: clampNpcReactionSlots(phase?.npcReactionSlots),
            attackSlots: clampNpcAttackSlots(
              phase?.attackSlots ??
                sumNpcAttackSlotsFromPowers({
                  ...context.system,
                  npcActivePhaseIndex: i,
                  phases,
                }),
            ),
            attackValues: Array.isArray(phase?.attackValues)
              ? phase.attackValues.map((r: any) => normalizeNpcAttackRowForContext(r))
              : normalizeAttackValuesArray(phase?.attackValues).map((r) =>
                  normalizeNpcAttackRowForContext(r),
                ),
          }));
        } else if (rawPhases != null && typeof rawPhases === 'object') {
          context.system.phases = null;
        }
      }
      context.system.combat = withNpcIniUi(context.system.combat);
      (context as any).npcMasteryRank = Math.max(
        1,
        Math.floor(Number(context.system.mastery?.rank) || 2),
      );
      if (!context.system.skills || typeof context.system.skills !== 'object') {
        context.system.skills = {};
      }
      if (!context.system.attributes || typeof context.system.attributes !== 'object') {
        context.system.attributes = {};
      }
      const mr = (context as any).npcMasteryRank as number;
      (context as any).npcAttributes = NPC_SHEET_ATTRIBUTES.map((key) => {
        const raw = context.system.attributes?.[key];
        const value =
          typeof raw === 'object'
            ? Math.max(0, Math.floor(Number(raw?.value) || 0))
            : Math.max(0, Math.floor(Number(raw) || 0));
        return {
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: value || 2,
        };
      });
      // Ensure nested .value shape for form names system.attributes.X.value
      for (const row of (context as any).npcAttributes as Array<{ key: string; value: number }>) {
        const cur = context.system.attributes[row.key];
        if (!cur || typeof cur !== 'object') {
          context.system.attributes[row.key] = { value: row.value, stones: 0 };
        } else if (cur.value == null) {
          cur.value = row.value;
        }
      }
      const ensured = ensureNpcHasPerception(context.system, mr);
      if (ensured.added) {
        context.system.situationalSkills = ensured.skills;
        // Persist so existing worlds keep Perception without a one-off migration.
        void this.actor
          .update({ 'system.situationalSkills': ensured.skills })
          .catch((err: unknown) =>
            console.warn('Mastery System | NPC Perception seed failed', err),
          );
      }
      (context as any).npcSituationalSkills = ensured.skills.map((s) => ({
        ...s,
        poolPreview: poolPreviewLabel(s.poolDice, mr),
        isPerception: isNpcPerceptionSkill(s),
      }));
      (context as any).npcSituationalHint = `Nd8 keep MR (${mr}). Perception is required on every NPC. Capable ≈ ${suggestNpcPool(
        mr,
        'capable',
      )}d8 · Specialist ≈ ${suggestNpcPool(
        mr,
        'specialist',
      )}d8 (Guide MR1–3). Rank 0 = no Raises. Legacy system.skills remains data-only fallback.`;
    }

    if (isNpcLike && context.system) {
      (context as any).npcSpecialSelectGroups = buildNpcSpecialSelectGroups();
      (context as any).npcCatalogReactions = listNpcCatalogReactions();
      (context as any).npcStandardReactions = NPC_STANDARD_REACTIONS;
      // Token disposition for Threatened Ranged / targeting (Foundry: -1 / 0 / 1).
      // Prefer the placed token when editing an unlinked token actor.
      const actorDoc = context.actor as any;
      const tokenDisp = Number(
        actorDoc?.token?.disposition ??
          actorDoc?.prototypeToken?.disposition ??
          (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.HOSTILE ??
          -1
      );
      const disposition = isSummon
        ? 1
        : tokenDisp === 1 || tokenDisp === 0 || tokenDisp === -1
          ? tokenDisp
          : -1;
      (context as any).npcDispositionOptions = [
        { value: -1, label: 'Hostile', selected: disposition === -1 },
        { value: 0, label: 'Neutral', selected: disposition === 0 },
        { value: 1, label: 'Friendly', selected: disposition === 1 },
      ];
      (context as any).canReleaseKnownNpc = !isSummon && !!(game as any).user?.isGM;
      (context as any).knownNpcReleased = isKnownNpcReleased(String(actorDoc?.id || ''));
      context.system.npcBaseAttack = normalizeNpcAttackRowForContext(context.system.npcBaseAttack);
      if (Array.isArray(context.system.attackValues)) {
        context.system.attackValues = context.system.attackValues.map((r: any) => normalizeNpcAttackRowForContext(r));
      }
      if (!isSummon && Array.isArray(context.system.phases)) {
        context.system.phases = context.system.phases.map((ph: any) => ({
          ...ph,
          npcBaseAttack: normalizeNpcAttackRowForContext(ph.npcBaseAttack),
          attackValues: Array.isArray(ph.attackValues)
            ? ph.attackValues.map((r: any) => normalizeNpcAttackRowForContext(r))
            : ph.attackValues,
          npcReactions: coerceNpcReactionsArray(ph.npcReactions),
          npcReactionSlots: clampNpcReactionSlots(ph.npcReactionSlots),
        }));
        (context as any).npcPhaseCopyTargets =
          context.system.phases.length > 1
            ? context.system.phases.map((ph: any, i: number) => ({
                index: i,
                name: String(ph?.name || '').trim() || `Phase ${i + 1}`,
              }))
            : [];
      } else {
        (context as any).npcPhaseCopyTargets = [];
      }
      // NPC ATK = explicit slots (active phase / root). Summons keep Bond attackSlots.
      if (!isSummon) {
        context.system.attackSlots = resolveNpcAttackSlots(context.system);
      }

      // Combat applies Specials to root system.statusEffects. Phase tabs used to
      // read empty phase.statusEffects ([] is truthy in Handlebars → blank panel).
      // Prefer live actor data (same source as combat carousel).
      const statusList = readActorStatusEffects(this.actor);
      context.system.statusEffects = statusList;
      (context as any).npcStatusEffects = buildNpcStatusRows(statusList);
      (context as any).hasNpcStatusEffects = statusList.length > 0;
    }

    return context;
  }

  /**
   * Hard-write NPC attack targeting by replacing the whole attack row / phases
   * array (coercing object-shaped phases). Mirrors active phase base → root.
   */
  async #persistNpcAttackTargeting(
    path: string,
    patch: Record<string, unknown>,
    reason: string
  ): Promise<void> {
    if (!path || !this.actor) return;
    if (!isValidNpcAttackWritePath(path)) {
      console.warn('[MS NPC Targeting] SHEET WRITE aborted — invalid attack path (refusing empty phase index)', {
        path,
        reason,
        patch,
      });
      return;
    }
    const actor = this.actor as any;
    const dup = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
    const {
      coerceNpcPhasesArray,
      npcAttackUsageKey,
      sanitizeNpcAttackTargetingFields,
    } = await import('../utils/npc-attack-model.js');
    const {
      logNpcTargeting,
      logNpcTargetingRow,
      logNpcAttackListDump,
      logNpcActorTargetingCompare,
      npcTargetingSnap,
    } = await import('../utils/npc-targeting-debug.js');

    const beforeRow = path.split('.').reduce((acc: any, key: string) => (acc == null ? acc : acc[key]), actor);
    logNpcTargeting(`SHEET WRITE begin — ${reason}`, {
      path,
      patch,
      actorId: actor.id,
      actorName: actor.name,
      isToken: !!actor.isToken,
      phasesIsArray: Array.isArray(actor.system?.phases),
      phasesType:
        actor.system?.phases == null
          ? 'null'
          : Array.isArray(actor.system.phases)
            ? 'array'
            : typeof actor.system.phases,
      activePhaseIndex: actor.system?.npcActivePhaseIndex,
      beforeRow: npcTargetingSnap(beforeRow),
      beforeRaw: beforeRow
        ? {
            npcRangeKind: beforeRow.npcRangeKind,
            npcRangeMeters: beforeRow.npcRangeMeters,
            npcRangeMinMeters: beforeRow.npcRangeMinMeters,
            npcAoeRadiusM: beforeRow.npcAoeRadiusM,
            npcAoeShape: beforeRow.npcAoeShape,
          }
        : null,
    });
    logNpcAttackListDump('SHEET WRITE before — combat-visible list', actor.system, {
      actorId: actor.id,
      isToken: !!actor.isToken,
    });

    const phaseBase = /^system\.phases\.(\d+)\.npcBaseAttack$/.exec(path);
    const phaseExtra = /^system\.phases\.(\d+)\.attackValues\.(\d+)$/.exec(path);
    const rootExtra = /^system\.attackValues\.(\d+)$/.exec(path);
    const liveFields = readLiveNpcAttackFormFields(this.element as HTMLElement | null, path);
    const rowPatch = { ...liveFields, ...patch };

    let usageKey = 'npc-attack-root-0';
    let update: Record<string, unknown> = {};
    if (phaseBase) {
      const pi = Number(phaseBase[1]);
      const phases = dup(coerceNpcPhasesArray(actor.system?.phases));
      while (phases.length <= pi) phases.push({});
      const phase = { ...(phases[pi] || {}) };
      phase.npcBaseAttack = sanitizeNpcAttackTargetingFields({
        ...(phase.npcBaseAttack || {}),
        ...rowPatch,
      });
      phases[pi] = phase;
      update['system.phases'] = phases;
      usageKey = npcAttackUsageKey(pi, 0);
      const activePi = Math.floor(Number(actor.system?.npcActivePhaseIndex) || 0);
      if (pi === activePi) {
        update['system.npcBaseAttack'] = sanitizeNpcAttackTargetingFields({
          ...(actor.system?.npcBaseAttack || {}),
          ...rowPatch,
        });
        logNpcTargeting('SHEET WRITE also mirroring to system.npcBaseAttack (active phase)', {
          pi,
          activePi,
        });
      } else {
        logNpcTargeting('SHEET WRITE NOT mirroring to root (edited phase ≠ active)', {
          pi,
          activePi,
        });
      }
    } else if (phaseExtra) {
      const pi = Number(phaseExtra[1]);
      const ai = Number(phaseExtra[2]);
      const phases = dup(coerceNpcPhasesArray(actor.system?.phases));
      while (phases.length <= pi) phases.push({});
      const phase = { ...(phases[pi] || {}) };
      const attackValues = Array.isArray(phase.attackValues)
        ? [...phase.attackValues]
        : coerceNpcPhasesArray(phase.attackValues);
      while (attackValues.length <= ai) attackValues.push({});
      attackValues[ai] = sanitizeNpcAttackTargetingFields({
        ...(attackValues[ai] || {}),
        ...rowPatch,
      });
      phase.attackValues = attackValues;
      phases[pi] = phase;
      update['system.phases'] = phases;
      {
        const base = phase.npcBaseAttack || {};
        const hasBase =
          Math.floor(Number(base.attackDiceCount) || 0) > 0 ||
          Math.floor(Number(base.damageDiceCount) || 0) > 0 ||
          String(base.name || '').trim().length > 0;
        usageKey = npcAttackUsageKey(pi, hasBase ? ai + 1 : ai);
      }
    } else if (rootExtra) {
      const ai = Number(rootExtra[1]);
      const attackValues = dup(
        Array.isArray(actor.system?.attackValues)
          ? actor.system.attackValues
          : coerceNpcPhasesArray(actor.system?.attackValues),
      );
      while (attackValues.length <= ai) attackValues.push({});
      attackValues[ai] = sanitizeNpcAttackTargetingFields({
        ...(attackValues[ai] || {}),
        ...rowPatch,
      });
      update['system.attackValues'] = attackValues;
      {
        const base = actor.system?.npcBaseAttack || {};
        const hasBase =
          Math.floor(Number(base.attackDiceCount) || 0) > 0 ||
          Math.floor(Number(base.damageDiceCount) || 0) > 0 ||
          String(base.name || '').trim().length > 0;
        usageKey = npcAttackUsageKey(null, hasBase ? ai + 1 : ai);
      }
    } else if (path === 'system.npcBaseAttack') {
      update['system.npcBaseAttack'] = sanitizeNpcAttackTargetingFields({
        ...(actor.system?.npcBaseAttack || {}),
        ...rowPatch,
      });
      usageKey = npcAttackUsageKey(null, 0);
    } else {
      // Never fall through to dotted `system.phases..*` writes — they turn
      // phases into an object and wipe power names / collapse the sheet.
      console.warn('[MS NPC Targeting] SHEET WRITE aborted — unmatched path (no dotted fallback)', {
        path,
        reason,
        patch,
      });
      return;
    }

    logNpcTargeting(`SHEET WRITE payload — ${reason}`, {
      usageKey,
      updateKeys: Object.keys(update),
      updatePreview: {
        npcBaseAttack: (update as any)['system.npcBaseAttack']
          ? npcTargetingSnap((update as any)['system.npcBaseAttack'])
          : undefined,
        phases0Base: Array.isArray((update as any)['system.phases'])
          ? npcTargetingSnap((update as any)['system.phases'][0]?.npcBaseAttack)
          : undefined,
      },
    });

    const targets: any[] = [actor];
    if (!actor.isToken && typeof actor.getActiveTokens === 'function') {
      for (const tok of actor.getActiveTokens(true) || []) {
        if (tok?.actor && tok.actor !== actor && tok.document?.actorLink === false) {
          targets.push(tok.actor);
          logNpcTargeting('SHEET WRITE will also update unlinked token actor', {
            tokenId: tok.id,
            tokenActorId: tok.actor.id,
          });
        }
      }
    }
    if (actor.isToken) {
      const world = (globalThis as any).game?.actors?.get(actor.id);
      if (world && world !== actor) {
        targets.push(world);
        logNpcTargeting('SHEET WRITE will also update world actor', { worldId: world.id });
      }
    }

    for (const target of targets) {
      try {
        const result = await target.update(dup(update));
        logNpcTargeting('SHEET WRITE update result', {
          targetId: target.id,
          isToken: !!target.isToken,
          resultNull: result == null,
        });
      } catch (err) {
        console.warn('[MS NPC Targeting] SHEET WRITE update failed for', target?.id, err);
      }
    }

    const row = path.split('.').reduce((acc: any, key: string) => (acc == null ? acc : acc[key]), actor);
    logNpcTargetingRow('SHEET WRITE after — path row on sheet actor', row, { path, usageKey });
    logNpcAttackListDump('SHEET WRITE after — combat-visible list on sheet actor', actor.system, {
      actorId: actor.id,
      isToken: !!actor.isToken,
    });

    const world = (globalThis as any).game?.actors?.get(actor.id);
    const tokenActor =
      actor.isToken
        ? actor
        : actor.getActiveTokens?.(true)?.[0]?.actor;
    if (tokenActor || world) {
      logNpcActorTargetingCompare('SHEET WRITE after — token vs world', tokenActor || actor, world);
    }
  }

  /**
   * Sanitize targeting on every form submit so FormData cannot re-introduce
   * stale AoE shape / wrong meters after a Melee↔Range switch.
   * @override
   */
  _prepareSubmitData(event: any, form: any, formData: any, updateData?: any): any {
    const data = super._prepareSubmitData(event, form, formData, updateData);
    if (!data?.system) {
      console.log('[MS NPC Targeting] FORM SUBMIT — no system in submit data', {
        keys: data ? Object.keys(data) : null,
      });
      return data;
    }
    const beforeRoot = data.system.npcBaseAttack
      ? {
          kind: data.system.npcBaseAttack.npcRangeKind,
          aoe: data.system.npcBaseAttack.npcAoeRadiusM,
          shape: data.system.npcBaseAttack.npcAoeShape,
        }
      : null;

    // Form expand replaces `system.phases` as a whole. If HP inputs were missing
    // (empty bars / bad name paths), merge existing health back so we don't wipe it.
    const existingSystem = (this.actor as any)?.system ?? {};
    if (data.system.health != null) {
      data.system.health = npcHealthHasBars(data.system.health)
        ? ensureNpcHealthState(data.system.health)
        : ensureNpcHealthState(existingSystem.health);
    }
    if (data.system.phases != null) {
      const existingPhases = coerceNpcPhasesArray(existingSystem.phases);
      let submitPhases = coerceNpcPhasesArray(data.system.phases);
      // Bad field names (`system.phases..*`) expand to a non-numeric object key;
      // coerce then yields []. Keep existing phases instead of wiping the boss.
      if (submitPhases.length === 0 && existingPhases.length > 0) {
        console.warn('[MS NPC Targeting] FORM SUBMIT — empty coerced phases; keeping existing', {
          actorId: this.actor?.id,
          existingLen: existingPhases.length,
          rawType:
            data.system.phases == null
              ? 'null'
              : Array.isArray(data.system.phases)
                ? 'array'
                : typeof data.system.phases,
        });
        submitPhases = existingPhases.map((p: any) => dup(p));
      }
      data.system.phases = submitPhases.map((phase: any, i: number) => {
        if (!phase || typeof phase !== 'object') return phase;
        const prev = existingPhases[i] || {};
        const health = npcHealthHasBars(phase.health)
          ? phase.health
          : prev.health ?? existingSystem.health;
        const combat =
          phase.combat && typeof phase.combat === 'object'
            ? {
                ...phase.combat,
                initiative: clampNpcInitiativeModifier(phase.combat.initiative),
              }
            : phase.combat;
        return {
          ...prev,
          ...phase,
          combat,
          health: ensureNpcHealthState(health),
          npcBaseAttack:
            phase.npcBaseAttack && typeof phase.npcBaseAttack === 'object'
              ? mergeNpcAttackRowSpecials(prev.npcBaseAttack, phase.npcBaseAttack)
              : phase.npcBaseAttack ?? prev.npcBaseAttack,
          attackValues: mergeNpcAttackValueLists(prev.attackValues, phase.attackValues),
          npcReactions: (() => {
            const lock = this.#npcReactionWriteLock;
            if (lock && lock.phaseIndex === i) return lock.rows;
            return mergeNpcReactionSubmitRows(prev.npcReactions, phase.npcReactions);
          })(),
          npcReactionSlots: clampNpcReactionSlots(phase.npcReactionSlots ?? prev.npcReactionSlots),
          attackSlots: clampNpcAttackSlots(
            phase.attackSlots ?? prev.attackSlots ?? existingSystem.attackSlots,
          ),
        };
      });
    }
    if (data.system.attackSlots != null || existingSystem.attackSlots != null) {
      data.system.attackSlots = clampNpcAttackSlots(
        data.system.attackSlots ?? existingSystem.attackSlots,
      );
    }
    if (data.system.attackValues != null || existingSystem.attackValues != null) {
      data.system.attackValues = mergeNpcAttackValueLists(
        existingSystem.attackValues,
        data.system.attackValues,
      );
    }
    if (data.system.npcBaseAttack && typeof data.system.npcBaseAttack === 'object') {
      data.system.npcBaseAttack = mergeNpcAttackRowSpecials(
        existingSystem.npcBaseAttack,
        data.system.npcBaseAttack,
      );
    }
    {
      const lock = this.#npcReactionWriteLock;
      if (lock && lock.phaseIndex == null) {
        data.system.npcReactions = lock.rows;
      } else {
        data.system.npcReactions = mergeNpcReactionSubmitRows(
          existingSystem.npcReactions,
          Object.prototype.hasOwnProperty.call(data.system, 'npcReactions')
            ? data.system.npcReactions
            : undefined,
        );
      }
    }
    data.system.npcReactionSlots = clampNpcReactionSlots(
      data.system.npcReactionSlots ?? existingSystem.npcReactionSlots,
    );
    if (data.system.combat && typeof data.system.combat === 'object') {
      data.system.combat = {
        ...data.system.combat,
        initiative: clampNpcInitiativeModifier(data.system.combat.initiative),
      };
    }
    // Status lives in flags. A form rewrite of `{ id: 'slow' }` arrays is what
    // ActorDelta drops on unlinked tokens — leave the live list alone.
    if (data.system && Object.prototype.hasOwnProperty.call(data.system, 'statusEffects')) {
      delete data.system.statusEffects;
    }

    // Skills / attributes must stay numeric on token ActorDelta (string "4" from
    // form fields without dtype used to look fine on the sheet but still fail
    // some comparisons; coerce every submit so Perception pool unlocks stick).
    data.system.skills = coerceNpcSkillsRecord(data.system.skills, existingSystem.skills);
    if (data.system.attributes && typeof data.system.attributes === 'object') {
      const attrs = { ...(existingSystem.attributes || {}), ...data.system.attributes };
      for (const key of NPC_SHEET_ATTRIBUTES) {
        const raw = attrs[key];
        const value =
          typeof raw === 'object'
            ? Math.max(0, Math.floor(Number(raw?.value) || 0))
            : Math.max(0, Math.floor(Number(raw) || 0));
        attrs[key] = {
          ...(typeof raw === 'object' && raw ? raw : {}),
          value: value > 0 ? value : 2,
          stones: Math.max(0, Math.floor(Number((raw as any)?.stones) || 0)),
        };
      }
      data.system.attributes = attrs;
    }

    data.system = sanitizeNpcSystemAttackTargeting(data.system);
    console.log('[MS NPC Targeting] FORM SUBMIT sanitized', {
      actorId: this.actor?.id,
      hasPhases: !!data.system.phases,
      phasesIsArray: Array.isArray(data.system.phases),
      beforeRoot,
      afterRoot: data.system.npcBaseAttack
        ? {
            kind: data.system.npcBaseAttack.npcRangeKind,
            aoe: data.system.npcBaseAttack.npcAoeRadiusM,
            shape: data.system.npcBaseAttack.npcAoeShape,
          }
        : null,
      afterPhase0: Array.isArray(data.system.phases)
        ? {
            kind: data.system.phases[0]?.npcBaseAttack?.npcRangeKind,
            aoe: data.system.phases[0]?.npcBaseAttack?.npcAoeRadiusM,
            shape: data.system.phases[0]?.npcBaseAttack?.npcAoeShape,
          }
        : null,
    });
    return data;
  }

  /** Sync Ini malus/bonus selects → hidden net field + summary (MR d8 ± N). */
  #syncNpcIniChip(chip: HTMLElement): void {
    const malusEl = chip.querySelector('select.npc-ini-malus') as HTMLSelectElement | null;
    const bonusEl = chip.querySelector('select.npc-ini-bonus') as HTMLSelectElement | null;
    const hidden = chip.querySelector('input.npc-ini-net-input') as HTMLInputElement | null;
    const summary = chip.querySelector('.npc-ini-summary') as HTMLElement | null;
    if (!malusEl || !bonusEl || !hidden) return;
    const malus = Math.floor(Number(malusEl.value) || 0);
    const bonus = Math.floor(Number(bonusEl.value) || 0);
    const net = clampNpcInitiativeModifier(malus + bonus);
    hidden.value = String(net);
    if (summary) {
      const mr = Math.max(1, Math.floor(Number(summary.dataset.mr) || 2));
      const signed = net === 0 ? '' : net > 0 ? ` +${net}` : ` ${net}`;
      summary.textContent = `${mr}d8${signed}`;
    }
  }

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html);
    // Persist attribute numbers immediately so other live previews stay in sync.
    html.find('.npc-attr-chip input[name^="system.attributes."]').on('change', async (ev) => {
      const input = ev.currentTarget as HTMLInputElement;
      const name = String(input?.name || '');
      const m = /^system\.attributes\.([^.]+)\.value$/.exec(name);
      if (!m) return;
      const key = m[1]!;
      const value = Math.max(1, Math.floor(Number(input.value) || 0));
      input.value = String(value);
      try {
        await this.actor.update({ [`system.attributes.${key}.value`]: value });
      } catch (err) {
        console.warn('Mastery System | NPC attribute update failed', key, err);
      }
    });

    html.find('.npc-sit-add').on('click', (ev) => {
      ev.preventDefault();
      void this.#onNpcSituationalAdd();
    });
    html.find('.npc-sit-preset').on('click', (ev) => {
      ev.preventDefault();
      const preset = String((ev.currentTarget as HTMLElement)?.dataset?.preset || '') as NpcPoolPreset;
      void this.#onNpcSituationalPreset(preset);
    });
    html.find('.npc-sit-edit').on('click', (ev) => {
      ev.preventDefault();
      const id = String((ev.currentTarget as HTMLElement)?.dataset?.skillId || '');
      void this.#onNpcSituationalEdit(id);
    });
    html.find('.npc-sit-delete').on('click', (ev) => {
      ev.preventDefault();
      const id = String((ev.currentTarget as HTMLElement)?.dataset?.skillId || '');
      void this.#onNpcSituationalDelete(id);
    });
    html.find('.npc-sit-roll').on('click', (ev) => {
      ev.preventDefault();
      const id = String((ev.currentTarget as HTMLElement)?.dataset?.skillId || '');
      void this.#onNpcSituationalRoll(id);
    });

    makeFoundryTooltipInert();

    html.find('[data-npc-ini-chip]').each((_, el) => {
      const chip = el as HTMLElement;
      const onChange = () => this.#syncNpcIniChip(chip);
      chip.querySelectorAll('select.npc-ini-malus, select.npc-ini-bonus').forEach((sel) => {
        sel.addEventListener('change', onChange);
      });
      this.#syncNpcIniChip(chip);
    });

    // Friendly / Neutral / Hostile — write prototypeToken + sync placed tokens.
    html.find('select.npc-disposition-select').on('change', (ev: JQuery.ChangeEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      void this.#onNpcDispositionChange(ev);
    });

    // Melee ↔ Range: full retarget — reset meters + hard-clear AoE on the actor.
    html.find('select.npc-range-kind, select[name$=".npcRangeKind"]').on('change', (ev: JQuery.ChangeEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const select = ev.currentTarget as HTMLSelectElement;
      const path = resolveNpcAttackWritePath(select);
      if (!path) {
        console.warn('[MS NPC Targeting] range-kind change ignored — could not resolve attack path', {
          name: select.name,
          dataPath: select.dataset?.npcAttackPath,
        });
        return;
      }
      const kind = String(select.value || '').toLowerCase() === 'ranged' ? 'ranged' : 'melee';
      const patch: Record<string, unknown> =
        kind === 'ranged'
          ? {
              npcRangeKind: 'ranged',
              npcRangeMeters: 24,
              npcRangeMinMeters: 0,
              npcAoeRadiusM: 0,
              npcAoeShape: 'none',
            }
          : {
              npcRangeKind: 'melee',
              npcRangeMeters: 2,
              npcRangeMinMeters: 0,
              npcAoeRadiusM: 0,
              npcAoeShape: 'none',
            };
      void this.#persistNpcAttackTargeting(
        path,
        patch,
        `range-kind → ${kind} (AoE cleared, meters reset)`
      );
    });

    // AoE radius is the only switch. "—" / 0 ⇒ normal single-target (not Melee AoE).
    html.find('select.npc-aoe-radius, [name$=".npcAoeRadiusM"]').on('change', (ev: JQuery.ChangeEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const radEl = ev.currentTarget as HTMLInputElement | HTMLSelectElement;
      const path = resolveNpcAttackWritePath(radEl);
      if (!path) {
        console.warn('[MS NPC Targeting] AoE change ignored — could not resolve attack path', {
          name: radEl.name,
          dataPath: (radEl as HTMLElement).dataset?.npcAttackPath,
        });
        return;
      }
      const rad = Math.floor(Number(radEl.value));
      const hasAoe = Number.isFinite(rad) && rad >= 2;
      const patch: Record<string, unknown> = hasAoe
        ? { npcAoeRadiusM: rad, npcAoeShape: 'radius' }
        : { npcAoeRadiusM: 0, npcAoeShape: 'none' };
      // Keep hidden shape field in sync for any subsequent form submit.
      const shapeEl = html.find(`[name="${path}.npcAoeShape"]`).get(0) as HTMLInputElement | undefined;
      if (shapeEl) shapeEl.value = hasAoe ? 'radius' : 'none';
      if (!hasAoe) radEl.value = '0';
      void this.#persistNpcAttackTargeting(
        path,
        patch,
        hasAoe ? `AoE ON → radius ${rad} m` : 'AoE OFF → normal single-target (not Melee AoE)'
      );
    });

    const syncColorPickerToText = (e: any) => {
      const colorPicker = $(e.currentTarget);
      const textInput = colorPicker.siblings('.blood-color-text');
      const colorValue = colorPicker.val() as string;
      if (textInput.length > 0 && colorValue) {
        textInput.val(colorValue);
        textInput.data('last-valid-value', colorValue);
        textInput.removeClass('invalid');
      }
    };

    html
      .find('.blood-color-picker, input[type="color"][name="system.bloodColor"]')
      .on('input' as any, syncColorPickerToText)
      .on('change', syncColorPickerToText);

    const syncTextToColorPicker = (e: any) => {
      const textInput = $(e.currentTarget);
      const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
      const colorValue = ((textInput.val() as string) || '').trim();

      if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
        if (colorPicker.length > 0) {
          colorPicker.val(colorValue);
          colorPicker.trigger('change');
        }
        textInput.data('last-valid-value', colorValue);
        textInput.removeClass('invalid');
      } else if (colorValue.length > 0) {
        textInput.addClass('invalid');
      }
    };

    html.find('.blood-color-text').on('input' as any, syncTextToColorPicker).on('change', syncTextToColorPicker);

    html.find('.blood-color-text').on('blur', (e: JQuery.BlurEvent) => {
      const textInput = $(e.currentTarget);
      const colorValue = ((textInput.val() as string) || '').trim();

      if (!/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
        const lastValid = textInput.data('last-valid-value') || '#8b0000';
        textInput.val(lastValid);
        textInput.removeClass('invalid');

        const colorPicker = textInput.siblings('.blood-color-picker, input[type="color"][name="system.bloodColor"]');
        if (colorPicker.length > 0) {
          colorPicker.val(lastValid);
          colorPicker.trigger('change');
        }
      }
    });

    html.find('.effect-remove').on('click', this.#onRemoveStatusEffect.bind(this));
    html.find('.effect-reduce').on('click', this.#onReduceStatusEffect.bind(this));

    html.find('.attack-value-add').on('click', this.#onAttackValueAdd.bind(this));
    html.find('.attack-value-delete').on('click', this.#onAttackValueDelete.bind(this));
    html.find('select.npc-power-copy-select').on('change', (ev: JQuery.ChangeEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      void this.#onNpcPowerCopyToPhase(ev);
    });

    html.find('.phase-add-btn').on('click', this.#onPhaseAdd.bind(this));
    html.find('.phase-delete-btn').on('click', (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      void this.#onPhaseDelete(ev);
    });

    // Tab click = view that phase AND set it as the radial/combat active phase.
    // If live HP is already 0 and the clicked phase still has a pool, load it
    // (safety net when auto-advance was skipped).
    html.find('nav.npc-phase-tabs a.npc-phase-tab[data-tab^="phase-"]').on('click', (ev: JQuery.ClickEvent) => {
      const tab = String((ev.currentTarget as HTMLElement).dataset.tab || '');
      const m = /^phase-(\d+)$/.exec(tab);
      if (!m) return;
      const pi = Number(m[1]);
      if (!Number.isFinite(pi)) return;
      (this as any).activeTab = tab;
      const current = Math.floor(Number((this.actor as any).system?.npcActivePhaseIndex) || 0);
      if (pi !== current) {
        void (async () => {
          const { activateNpcBossPhaseFromSheet } = await import('../combat/npc-phase-advance.js');
          await activateNpcBossPhaseFromSheet(this.actor, pi);
        })();
      }
    });

    html.find('.npc-power-special-add').on('click', this.#onNpcPowerSpecialAdd.bind(this));
    html.find('.npc-power-special-del').on('click', this.#onNpcPowerSpecialDel.bind(this));
    // Native <select> change must not race a full form submit that expands
    // specials.0 as an object and wipes the choice on re-render.
    html
      .find('select.special-select, .npc-attack-special-row select[name$=".specialValue"]')
      .on('change', (ev: JQuery.ChangeEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        void this.#onNpcAttackSpecialFieldChange(ev);
      });

    // Stress (d8): same race as specials — persist immediately; tooltip must not block <select>.
    html.find('select.npc-stress-d8-select, select[name$=".npcStressD8"]').on('change', (ev: JQuery.ChangeEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      void this.#onNpcStressD8Change(ev);
    });
    html.find('select.npc-stress-d8-select, select[name$=".npcStressD8"]').on('pointerdown mousedown', () => {
      makeFoundryTooltipInert();
    });

    html.find('.npc-reaction-add-custom').on('click', this.#onNpcReactionAddCustom.bind(this));
    html.find('.npc-reaction-add-standard').on('click', this.#onNpcReactionAddStandard.bind(this));
    html.find('.npc-reaction-add-catalog').on('click', this.#onNpcReactionAddCatalog.bind(this));
    // Capture on the sheet root: a delegated click/pointerdown never reached this
    // button (hover still painted it), so the trash looked dead.
    this.#npcReactionDeleteAbort?.abort();
    this.#npcReactionDeleteAbort = new AbortController();
    const reactionRoot = (html[0] ?? html) as HTMLElement | undefined;
    reactionRoot?.addEventListener(
      'pointerdown',
      (ev: Event) => {
        const target = ev.target;
        const btn =
          target instanceof Element
            ? (target.closest('.npc-reaction-delete') as HTMLElement | null)
            : null;
        if (!btn || !reactionRoot.contains(btn)) return;
        const pe = ev as PointerEvent;
        if (typeof pe.button === 'number' && pe.button !== 0) return;
        ev.preventDefault();
        ev.stopPropagation();
        void this.#onNpcReactionDeleteFrom(btn);
      },
      { capture: true, signal: this.#npcReactionDeleteAbort.signal },
    );
    void this.#purgeNpcCounterattackRows();
    html.find('.npc-reaction-catalog-filter').on('input', (ev: JQuery.TriggeredEvent) => {
      const input = ev.currentTarget as HTMLInputElement;
      const term = String(input.value || '').trim().toLowerCase();
      const select = input
        .closest('.npc-reactions-catalog')
        ?.querySelector('select.npc-reaction-catalog-select') as HTMLSelectElement | null;
      if (!select) return;
      for (const opt of Array.from(select.options)) {
        if (!opt.value) continue;
        const label = String(opt.dataset.label || opt.textContent || '').toLowerCase();
        opt.hidden = term.length > 0 && !label.includes(term);
      }
    });
  }

  /**
   * Persist Foundry token disposition (-1 Hostile / 0 Neutral / 1 Friendly)
   * on the actor prototype and every placed token for this actor.
   */
  async #onNpcDispositionChange(event: JQuery.ChangeEvent): Promise<void> {
    const select = event.currentTarget as HTMLSelectElement;
    const value = Math.trunc(Number(select.value));
    if (value !== -1 && value !== 0 && value !== 1) return;

    const actor = this.actor as any;
    try {
      // Unlinked token actor: the TokenDocument is the source of truth.
      if (actor.isToken && actor.token) {
        await actor.token.update({ disposition: value });
        return;
      }

      await actor.update({ 'prototypeToken.disposition': value });

      const tokens: any[] =
        typeof actor.getActiveTokens === 'function' ? actor.getActiveTokens(false) || [] : [];
      for (const token of tokens) {
        const doc = token?.document ?? token;
        if (!doc?.update) continue;
        if (Number(doc.disposition) === value) continue;
        try {
          await doc.update({ disposition: value });
        } catch (err) {
          console.warn('[MS NPC] disposition token sync failed', doc?.id, err);
        }
      }
    } catch (err) {
      console.warn('[MS NPC] disposition update failed', actor?.id, err);
    }
  }

  async #onRemoveStatusEffect(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const index = parseInt(String($(event.currentTarget).data('effect-index') ?? ''), 10);
    const list = readActorStatusEffects(this.actor);
    if (!Number.isFinite(index) || index < 0 || index >= list.length) return;
    const next = list.filter((_, i) => i !== index);
    await writeActorStatusList(this.actor, next);
  }

  async #onReduceStatusEffect(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const btn = $(event.currentTarget);
    const index = parseInt(String(btn.data('effect-index') ?? ''), 10);
    const steps = Math.max(1, parseInt(String(btn.data('steps') ?? '1'), 10) || 1);
    const list = readActorStatusEffects(this.actor);
    if (!Number.isFinite(index) || index < 0 || index >= list.length) return;
    const next = reduceStatusEffectAt(list, index, steps);
    await writeActorStatusList(this.actor, next);
  }

  async #onAttackValueAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const phaseIndex = $(event.currentTarget).data('phase-index');

    const system = (this.actor as any).system;
    const row = newExtraNpcPower();
    const extraOpt = { [NPC_EXTRA_POWERS_UPDATE]: true };

    if (phaseIndex !== undefined && phaseIndex !== null && String(phaseIndex) !== '') {
      const pi = Number(phaseIndex);
      const phases = dup(coerceNpcPhasesArray(system.phases));
      if (!Number.isFinite(pi) || !phases[pi]) {
        return;
      }
      const pav = normalizeAttackValuesArray(phases[pi].attackValues);
      pav.push(row);
      phases[pi].attackValues = pav;
      await (this.actor as any).update({ 'system.phases': phases }, extraOpt);
    } else {
      const av = normalizeAttackValuesArray(system.attackValues);
      av.push(row);
      await (this.actor as any).update({ 'system.attackValues': av }, extraOpt);
    }
  }

  async #onAttackValueDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const index = parseInt($(event.currentTarget).data('attack-index') || '0', 10);
    const phaseIndex = $(event.currentTarget).data('phase-index');

    const system = (this.actor as any).system;
    const extraOpt = { [NPC_EXTRA_POWERS_UPDATE]: true };

    if (phaseIndex !== undefined && phaseIndex !== null && String(phaseIndex) !== '') {
      const pi = Number(phaseIndex);
      const previousRaw = system.phases;
      const phases = dup(coerceNpcPhasesArray(previousRaw));
      if (!Number.isFinite(pi) || !phases[pi]) {
        return;
      }
      const previousAv = phases[pi].attackValues;
      const pav = normalizeAttackValuesArray(previousAv);
      if (index >= 0 && index < pav.length) {
        pav.splice(index, 1);
        phases[pi].attackValues = pav;
        await (this.actor as any).update(
          {
            ...buildNpcPhasesReplacePatch(previousRaw, phases),
            ...buildNpcAttackValuesReplacePatch(
              `system.phases.${pi}.attackValues`,
              previousAv,
              pav,
            ),
          },
          extraOpt,
        );
      }
    } else {
      const previousAv = system.attackValues;
      const av = normalizeAttackValuesArray(previousAv);
      if (index >= 0 && index < av.length) {
        av.splice(index, 1);
        await (this.actor as any).update(
          buildNpcAttackValuesReplacePatch('system.attackValues', previousAv, av),
          extraOpt,
        );
      }
    }
  }

  /** Copy one extra power from its phase into another phase's extras list. */
  async #onNpcPowerCopyToPhase(event: JQuery.ChangeEvent): Promise<void> {
    const select = event.currentTarget as HTMLSelectElement;
    const toRaw = String(select.value || '').trim();
    if (toRaw === '') return;
    const toPi = Number(toRaw);
    const fromPi = Number(select.dataset.phaseIndex);
    const ai = Number(select.dataset.attackIndex);
    select.value = '';
    if (!Number.isFinite(toPi) || !Number.isFinite(fromPi) || !Number.isFinite(ai) || toPi === fromPi) {
      return;
    }

    const system = (this.actor as any).system;
    const phases = dup(coerceNpcPhasesArray(system.phases));
    if (!phases[fromPi] || !phases[toPi]) return;
    const fromRows = normalizeAttackValuesArray(phases[fromPi].attackValues);
    if (!fromRows[ai]) return;
    const copy = dup(fromRows[ai]);
    const toRows = normalizeAttackValuesArray(phases[toPi].attackValues);
    toRows.push(copy);
    phases[toPi].attackValues = toRows;
    const extraOpt = { [NPC_EXTRA_POWERS_UPDATE]: true };
    const patch: Record<string, unknown> = {
      'system.phases': phases,
      'system.npcActivePhaseIndex': toPi,
    };
    (this as any).activeTab = `phase-${toPi}`;
    await (this.actor as any).update(patch, extraOpt);
  }

  async #onNpcPowerSpecialAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const $t = $(event.currentTarget);
    const scope = String($t.data('scope') || '');
    const phaseRaw = $t.data('phase-index');
    const attackRaw = $t.data('attack-index');
    const system = (this.actor as any).system;
    const entry: { special?: string; specialValue?: number } = { special: '' };
    const specialsOpt = { [NPC_ATTACK_SPECIALS_UPDATE]: true };

    if (scope === 'base') {
      const base = ensureNpcBaseShape(system.npcBaseAttack);
      base.specials = [...coerceNpcAttackSpecials(base.specials), entry];
      await (this.actor as any).update({ 'system.npcBaseAttack': base }, specialsOpt);
      return;
    }

    if (scope === 'phase-base') {
      const pi = Number(phaseRaw);
      const phases = dup(coerceNpcPhasesArray(system.phases));
      if (!Number.isFinite(pi) || !phases[pi]) return;
      const base = ensureNpcBaseShape(phases[pi].npcBaseAttack);
      base.specials = [...coerceNpcAttackSpecials(base.specials), entry];
      phases[pi].npcBaseAttack = base;
      await (this.actor as any).update({ 'system.phases': phases }, specialsOpt);
      return;
    }

    if (scope === 'reaction') {
      const ri = Number($t.data('reaction-index'));
      if (!Number.isFinite(ri)) return;
      await this.#mutateNpcReactions(
        phaseRaw,
        (rows) => {
          if (!rows[ri]) return rows;
          const next = dup(rows);
          const row = dup(next[ri]);
          row.specials = [...coerceNpcAttackSpecials(row.specials), entry];
          next[ri] = row;
          return next;
        },
        undefined,
        specialsOpt,
      );
      return;
    }

    if (scope === 'extra') {
      const ai = Number(attackRaw);
      if (!Number.isFinite(ai)) return;

      if (phaseRaw !== undefined && phaseRaw !== null && String(phaseRaw) !== '') {
        const pi = Number(phaseRaw);
        const phases = dup(coerceNpcPhasesArray(system.phases));
        if (!Number.isFinite(pi) || !phases[pi]) return;
        const pav = normalizeAttackValuesArray(phases[pi].attackValues);
        if (!pav[ai]) return;
        const att = dup(pav[ai]);
        att.specials = [...coerceNpcAttackSpecials(att.specials), entry];
        pav[ai] = att;
        phases[pi].attackValues = pav;
        await (this.actor as any).update({ 'system.phases': phases }, specialsOpt);
      } else {
        const av = normalizeAttackValuesArray(system.attackValues);
        if (!av[ai]) return;
        const att = dup(av[ai]);
        att.specials = [...coerceNpcAttackSpecials(att.specials), entry];
        av[ai] = att;
        await (this.actor as any).update({ 'system.attackValues': av }, specialsOpt);
      }
    }
  }

  /**
   * Persist one special / specialValue select without a full form submit.
   * Paths look like `system.npcBaseAttack.specials.0.special`.
   */
  async #onNpcStressD8Change(event: JQuery.ChangeEvent): Promise<void> {
    const select = event.currentTarget as HTMLSelectElement;
    const path = resolveNpcAttackWritePath(select);
    if (!path) {
      console.warn('[MS NPC Targeting] stress-d8 change ignored — could not resolve attack path', {
        name: select.name,
        dataPath: select.dataset?.npcAttackPath,
      });
      return;
    }
    const raw = Math.floor(Number(select.value));
    const npcStressD8 = Number.isFinite(raw) && raw >= 1 ? Math.min(4, raw) : 0;
    await this.#persistNpcAttackTargeting(path, { npcStressD8 }, `stress-d8 → ${npcStressD8}`);
  }

  async #onNpcAttackSpecialFieldChange(event: JQuery.ChangeEvent): Promise<void> {
    const el = event.currentTarget as HTMLSelectElement;
    const name = String(el.name || '');
    const match = /^(.*?)\.specials\.(\d+)\.(special|specialValue)$/.exec(name);
    if (!match) return;
    const basePath = match[1];
    if (basePath.includes('..') || (!isValidNpcAttackWritePath(basePath) && !/^system(\.phases\.\d+)?\.npcReactions\.\d+$/.test(basePath))) {
      console.warn('[MS NPC Targeting] special field change ignored — invalid path', { name, basePath });
      return;
    }
    const si = Number(match[2]);
    const field = match[3] as 'special' | 'specialValue';
    if (!Number.isFinite(si) || si < 0) return;

    const actor = this.actor as any;
    const specialsOpt = { [NPC_ATTACK_SPECIALS_UPDATE]: true };
    const readPath = (path: string): any =>
      path.split('.').reduce((acc: any, key: string) => (acc == null ? acc : acc[key]), actor);

    const row = readPath(basePath);
    if (!row || typeof row !== 'object') return;
    const specials = coerceNpcAttackSpecials(row.specials);
    while (specials.length <= si) specials.push({ special: '' });
    if (field === 'special') {
      specials[si] = { ...specials[si], special: String(el.value || '').trim() };
    } else {
      const raw = String(el.value || '').trim();
      const num = Math.floor(Number(raw));
      const next = { ...specials[si] };
      if (raw === '' || !Number.isFinite(num)) delete next.specialValue;
      else next.specialValue = num;
      specials[si] = next;
    }

    const phaseBase = /^system\.phases\.(\d+)\.npcBaseAttack$/.exec(basePath);
    const phaseExtra = /^system\.phases\.(\d+)\.attackValues\.(\d+)$/.exec(basePath);
    const rootExtra = /^system\.attackValues\.(\d+)$/.exec(basePath);
    const phaseReaction = /^system\.phases\.(\d+)\.npcReactions\.(\d+)$/.exec(basePath);
    const rootReaction = /^system\.npcReactions\.(\d+)$/.exec(basePath);

    if (basePath === 'system.npcBaseAttack') {
      const base = ensureNpcBaseShape(actor.system?.npcBaseAttack);
      base.specials = specials;
      await actor.update({ 'system.npcBaseAttack': base }, specialsOpt);
      return;
    }
    if (phaseBase) {
      const pi = Number(phaseBase[1]);
      const phases = dup(coerceNpcPhasesArray(actor.system?.phases));
      if (!phases[pi]) return;
      const base = ensureNpcBaseShape(phases[pi].npcBaseAttack);
      base.specials = specials;
      phases[pi].npcBaseAttack = base;
      await actor.update({ 'system.phases': phases }, specialsOpt);
      return;
    }
    if (phaseExtra) {
      const pi = Number(phaseExtra[1]);
      const ai = Number(phaseExtra[2]);
      const phases = dup(coerceNpcPhasesArray(actor.system?.phases));
      if (!phases[pi]?.attackValues?.[ai]) return;
      const att = dup(phases[pi].attackValues[ai]);
      att.specials = specials;
      phases[pi].attackValues[ai] = att;
      await actor.update({ 'system.phases': phases }, specialsOpt);
      return;
    }
    if (rootExtra) {
      const ai = Number(rootExtra[1]);
      const av = dup(Array.isArray(actor.system?.attackValues) ? actor.system.attackValues : []);
      if (!av[ai]) return;
      av[ai] = { ...dup(av[ai]), specials };
      await actor.update({ 'system.attackValues': av }, specialsOpt);
      return;
    }
    if (phaseReaction) {
      await this.#mutateNpcReactions(
        phaseReaction[1],
        (rows) => {
          const ri = Number(phaseReaction[2]);
          if (!rows[ri]) return rows;
          const next = dup(rows);
          next[ri] = { ...dup(next[ri]), specials };
          return next;
        },
        undefined,
        specialsOpt,
      );
      return;
    }
    if (rootReaction) {
      await this.#mutateNpcReactions(
        null,
        (rows) => {
          const ri = Number(rootReaction[1]);
          if (!rows[ri]) return rows;
          const next = dup(rows);
          next[ri] = { ...dup(next[ri]), specials };
          return next;
        },
        undefined,
        specialsOpt,
      );
    }
  }

  async #onNpcPowerSpecialDel(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const $t = $(event.currentTarget);
    const scope = String($t.data('scope') || '');
    const si = parseInt(String($t.data('special-index') ?? '-1'), 10);
    if (si < 0) return;

    const phaseRaw = $t.data('phase-index');
    const attackRaw = $t.data('attack-index');
    const system = (this.actor as any).system;
    const specialsOpt = { [NPC_ATTACK_SPECIALS_UPDATE]: true };

    if (scope === 'base') {
      const base = ensureNpcBaseShape(system.npcBaseAttack);
      if (si >= base.specials.length) return;
      base.specials = coerceNpcAttackSpecials(base.specials);
      base.specials.splice(si, 1);
      await (this.actor as any).update({ 'system.npcBaseAttack': base }, specialsOpt);
      return;
    }

    if (scope === 'phase-base') {
      const pi = Number(phaseRaw);
      if (!Number.isFinite(pi) || !system.phases?.[pi]) return;
      const phases = dup(system.phases);
      const base = ensureNpcBaseShape(phases[pi].npcBaseAttack);
      if (si >= base.specials.length) return;
      base.specials = coerceNpcAttackSpecials(base.specials);
      base.specials.splice(si, 1);
      phases[pi].npcBaseAttack = base;
      await (this.actor as any).update({ 'system.phases': phases }, specialsOpt);
      return;
    }

    if (scope === 'reaction') {
      const ri = Number($t.data('reaction-index'));
      if (!Number.isFinite(ri)) return;
      await this.#mutateNpcReactions(
        phaseRaw,
        (rows) => {
          if (!rows[ri]) return rows;
          const list = coerceNpcAttackSpecials(rows[ri].specials);
          if (si >= list.length) return rows;
          const next = dup(rows);
          const row = dup(next[ri]);
          row.specials = [...list];
          row.specials.splice(si, 1);
          next[ri] = row;
          return next;
        },
        undefined,
        specialsOpt,
      );
      return;
    }

    if (scope === 'extra') {
      const ai = Number(attackRaw);
      if (!Number.isFinite(ai)) return;

      if (phaseRaw !== undefined && phaseRaw !== null && phaseRaw !== '') {
        const pi = Number(phaseRaw);
        if (!Number.isFinite(pi) || !system.phases?.[pi]?.attackValues?.[ai]) return;
        const phases = dup(system.phases);
        const att = dup(phases[pi].attackValues[ai]);
        if (!Array.isArray(att.specials) || si >= att.specials.length) {
          att.specials = coerceNpcAttackSpecials(att.specials);
        }
        if (si >= att.specials.length) return;
        att.specials = coerceNpcAttackSpecials(att.specials);
        att.specials.splice(si, 1);
        phases[pi].attackValues[ai] = att;
        await (this.actor as any).update({ 'system.phases': phases }, specialsOpt);
      } else {
        if (!system.attackValues?.[ai]) return;
        const av = dup(system.attackValues);
        const att = dup(av[ai]);
        att.specials = coerceNpcAttackSpecials(att.specials);
        if (si >= att.specials.length) return;
        att.specials.splice(si, 1);
        av[ai] = att;
        await (this.actor as any).update({ 'system.attackValues': av }, specialsOpt);
      }
    }
  }

  #npcMasteryRank(): number {
    return Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 2));
  }

  #clearNpcReactionWriteLock(rows: any[]): void {
    // Form submitOnChange can land after the actor update returns. Hold the
    // shortened snapshot long enough for that submit to see it.
    window.setTimeout(() => {
      if (this.#npcReactionWriteLock?.rows === rows) {
        this.#npcReactionWriteLock = null;
      }
    }, 500);
  }

  async #purgeNpcCounterattackRows(): Promise<void> {
    if (this.#npcReactionWriteLock) return;
    const system = (this.actor as any).system;
    const phases = coerceNpcPhasesArray(system?.phases);
    if (phases.length > 0) {
      for (let i = 0; i < phases.length; i++) {
        const rows = coerceNpcReactionsArray(phases[i]?.npcReactions);
        if (!rows.some((row) => isNpcCounterattackRow(row))) continue;
        await this.#mutateNpcReactions(i, (list) =>
          list.filter((row) => !isNpcCounterattackRow(row)),
        );
      }
      return;
    }
    const rows = coerceNpcReactionsArray(system?.npcReactions);
    if (!rows.some((row) => isNpcCounterattackRow(row))) return;
    await this.#mutateNpcReactions('', (list) => list.filter((row) => !isNpcCounterattackRow(row)));
  }

  /** Drop object-shaped leftovers after the array itself has been replaced. */
  async #deleteNpcListTail(pathPrefix: string, previousRaw: unknown, nextLength: number): Promise<void> {
    let prevMax = -1;
    if (Array.isArray(previousRaw)) prevMax = previousRaw.length - 1;
    else if (previousRaw && typeof previousRaw === 'object') {
      for (const key of Object.keys(previousRaw as object)) {
        if (/^\d+$/.test(key)) prevMax = Math.max(prevMax, Number(key));
      }
    }
    if (prevMax < nextLength) return;
    const patch: Record<string, unknown> = {};
    for (let i = nextLength; i <= prevMax; i++) patch[`${pathPrefix}.-=${i}`] = null;
    await (this.actor as any).update(patch, { [NPC_REACTIONS_UPDATE]: true, diff: false });
  }

  async #mutateNpcReactions(
    phaseRaw: unknown,
    mutator: (rows: any[]) => any[],
    extra?: Record<string, unknown>,
    updateOptions?: Record<string, unknown>,
  ): Promise<void> {
    const system = (this.actor as any).system;
    // diff:false writes the shortened array as-is. A normal diff keeps the
    // deleted index, so the row came straight back.
    const reactionsOpt = { [NPC_REACTIONS_UPDATE]: true, diff: false, ...(updateOptions || {}) };
    const phaseIndex =
      phaseRaw !== undefined && phaseRaw !== null && String(phaseRaw) !== ''
        ? Number(phaseRaw)
        : null;
    if (phaseIndex != null && Number.isFinite(phaseIndex)) {
      const phases = coerceNpcPhasesArray(system.phases);
      if (!phases[phaseIndex]) return;
      const previousRows = phases[phaseIndex].npcReactions;
      const rows = mutator(coerceNpcReactionsArray(previousRows));
      const patch: Record<string, unknown> = {
        [`system.phases.${phaseIndex}.npcReactions`]: rows,
      };
      if (extra?.slots != null) {
        patch[`system.phases.${phaseIndex}.npcReactionSlots`] = extra.slots;
      } else if (clampNpcReactionSlots(phases[phaseIndex].npcReactionSlots) <= 0 && rows.length > 0) {
        patch[`system.phases.${phaseIndex}.npcReactionSlots`] = 1;
      }
      this.#npcReactionWriteLock = { phaseIndex, rows };
      try {
        await (this.actor as any).update(patch, reactionsOpt);
        await this.#deleteNpcListTail(
          `system.phases.${phaseIndex}.npcReactions`,
          previousRows,
          rows.length,
        );
      } catch (err) {
        this.#npcReactionWriteLock = null;
        throw err;
      }
      this.#clearNpcReactionWriteLock(rows);
      return;
    }
    const previousRows = system.npcReactions;
    const rows = mutator(coerceNpcReactionsArray(previousRows));
    const patch: Record<string, unknown> = {
      'system.npcReactions': rows,
    };
    if (extra?.slots != null) patch['system.npcReactionSlots'] = extra.slots;
    else if (clampNpcReactionSlots(system.npcReactionSlots) <= 0 && rows.length > 0) {
      patch['system.npcReactionSlots'] = 1;
    }
    this.#npcReactionWriteLock = { phaseIndex: null, rows };
    try {
      await (this.actor as any).update(patch, reactionsOpt);
      await this.#deleteNpcListTail('system.npcReactions', previousRows, rows.length);
    } catch (err) {
      this.#npcReactionWriteLock = null;
      throw err;
    }
    this.#clearNpcReactionWriteLock(rows);
  }

  async #onNpcReactionAddCustom(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const phaseRaw = $(event.currentTarget).data('phase-index');
    const row = newCustomNpcReaction(this.#npcMasteryRank());
    await this.#mutateNpcReactions(phaseRaw, (rows) => [...rows, row]);
  }

  async #onNpcReactionAddStandard(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget as HTMLElement;
    const wrap = btn.closest('.npc-reactions-standard');
    const select = wrap?.querySelector('select.npc-reaction-standard-select') as HTMLSelectElement | null;
    const basicId = String(select?.value || '').trim();
    const row = newStandardNpcReaction(basicId);
    if (!row) return;
    const phaseRaw = $(btn).data('phase-index');
    await this.#mutateNpcReactions(phaseRaw, (rows) => {
      if (rows.some((r) => r.source === 'basic' && r.basicId === row.basicId)) return rows;
      return [...rows, row];
    });
  }

  async #onNpcReactionAddCatalog(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget as HTMLElement;
    const wrap = btn.closest('.npc-reactions-catalog');
    const select = wrap?.querySelector('select.npc-reaction-catalog-select') as HTMLSelectElement | null;
    const rankEl = wrap?.querySelector('select.npc-reaction-catalog-rank') as HTMLSelectElement | null;
    const templateId = String(select?.value || '').trim();
    const row = newCatalogNpcReaction(templateId, this.#npcMasteryRank());
    if (!row) return;
    const rankN = Math.floor(Number(rankEl?.value));
    if (Number.isFinite(rankN) && rankN >= 1) row.rank = Math.min(16, rankN);
    const phaseRaw = $(btn).data('phase-index');
    await this.#mutateNpcReactions(phaseRaw, (rows) => {
      if (rows.some((r) => r.source === 'catalog' && r.templateId === row.templateId)) return rows;
      return [...rows, row];
    });
  }

  async #onNpcReactionDeleteFrom(btn: HTMLElement) {
    if (btn.dataset.msReactionDeleting === '1') return;
    const card =
      (btn.closest('.npc-reaction-card') as HTMLElement | null) ||
      (btn.closest('[data-reaction-index]') as HTMLElement | null);
    // Prefer dataset on the card — jQuery .data() can cache stale values.
    const index = parseInt(
      String(card?.dataset.reactionIndex ?? btn.dataset.reactionIndex ?? '-1'),
      10,
    );
    if (!Number.isFinite(index) || index < 0) return;
    btn.dataset.msReactionDeleting = '1';
    const phaseRaw = card?.dataset.phaseIndex ?? btn.dataset.phaseIndex;

    // Lock the shortened list *before* DOM surgery — remove() can flush a form
    // submit that would otherwise merge with the still-long actor list.
    const phaseIndex =
      phaseRaw !== undefined && phaseRaw !== null && String(phaseRaw) !== ''
        ? Number(phaseRaw)
        : null;
    const system = (this.actor as any).system;
    let currentRows: any[];
    if (phaseIndex != null && Number.isFinite(phaseIndex)) {
      const phases = coerceNpcPhasesArray(system.phases);
      if (!phases[phaseIndex]) return;
      currentRows = coerceNpcReactionsArray(phases[phaseIndex].npcReactions);
    } else {
      currentRows = coerceNpcReactionsArray(system.npcReactions);
    }
    if (index >= currentRows.length) return;
    const rows = currentRows.slice(0, index).concat(currentRows.slice(index + 1));
    this.#npcReactionWriteLock = {
      phaseIndex: phaseIndex != null && Number.isFinite(phaseIndex) ? phaseIndex : null,
      rows,
    };

    // Drop named inputs so a racing form submit cannot resurrect the row.
    if (card) {
      card.querySelectorAll('[name]').forEach((el) => el.removeAttribute('name'));
      card.remove();
    }

    await this.#mutateNpcReactions(phaseRaw, () => rows);
  }

  async #onPhaseAdd(event: JQuery.ClickEvent) {
    event.preventDefault();

    const system = (this.actor as any).system;
    const phases = Array.isArray(system.phases) ? dup(system.phases) : [];

    const defaultAttack = {
      name: 'Waffenangriff',
      attackDiceCount: 6,
      damageDiceCount: 4,
      specials: [] as { special?: string; specialValue?: number }[],
    };
    const defaultCombat = {
      initiative: 0,
      evade: 10,
      armor: 0,
      speed: 8,
      spellResistance: 0,
      damageReduction: 0,
      damageNegation: 0,
    };
    const defaultHealth = defaultNpcHealth();

    // First phase: migrate the current (root) stats so adding phases does not
    // wipe Evade / Armor / Speed / HP that were already tuned on the sheet.
    if (phases.length === 0) {
      const rootSlots = clampNpcAttackSlots(
        system.attackSlots ?? sumNpcAttackSlotsFromPowers(system),
      );
      phases.push({
        name: 'Phase 1',
        health: ensureNpcHealthState(dup(system.health) || defaultHealth),
        combat: { ...defaultCombat, ...(dup(system.combat) || {}) },
        npcBaseAttack: dup(system.npcBaseAttack) || defaultAttack,
        attackValues: Array.isArray(system.attackValues) ? dup(system.attackValues) : [],
        attackSlots: rootSlots,
        npcReactions: coerceNpcReactionsArray(system.npcReactions),
        npcReactionSlots: clampNpcReactionSlots(system.npcReactionSlots),
        statusEffects: [],
      });
      await (this.actor as any).update({
        'system.phases': phases,
        'system.npcActivePhaseIndex': 0,
        'system.attackSlots': rootSlots,
      });
      return;
    }

    // Further phases: copy the previous phase as a starting point.
    const prev = phases[phases.length - 1] || {};
    const prevSlots = clampNpcAttackSlots(
      prev.attackSlots ?? system.attackSlots ?? sumNpcAttackSlotsFromPowers(system),
    );
    phases.push({
      name: `Phase ${phases.length + 1}`,
      health: ensureNpcHealthState(dup(prev.health) || dup(system.health) || defaultHealth),
      combat: { ...defaultCombat, ...(dup(prev.combat) || dup(system.combat) || {}) },
      npcBaseAttack: dup(prev.npcBaseAttack) || dup(system.npcBaseAttack) || defaultAttack,
      attackValues: Array.isArray(prev.attackValues)
        ? dup(prev.attackValues)
        : Array.isArray(system.attackValues)
          ? dup(system.attackValues)
          : [],
      attackSlots: prevSlots,
      npcReactions: coerceNpcReactionsArray(prev.npcReactions ?? system.npcReactions),
      npcReactionSlots: clampNpcReactionSlots(prev.npcReactionSlots ?? system.npcReactionSlots),
      statusEffects: [],
    });
    await (this.actor as any).update({ 'system.phases': phases });
  }

  async #onPhaseDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const phaseIndex = parseInt($(event.currentTarget).data('phase-index') || '0', 10);

    const system = (this.actor as any).system;
    const previousRaw = system.phases;
    const phases = dup(coerceNpcPhasesArray(previousRaw));
    if (!phases.length) return;

    if (phaseIndex >= 0 && phaseIndex < phases.length) {
      phases.splice(phaseIndex, 1);
      const patch = buildNpcPhasesReplacePatch(previousRaw, phases);
      if (!phases.length) {
        patch['system.npcActivePhaseIndex'] = 0;
        (this as any).activeTab = undefined;
      } else {
        const prevActive = Math.floor(Number(system.npcActivePhaseIndex) || 0);
        let nextActive = prevActive;
        if (prevActive === phaseIndex) nextActive = Math.min(phaseIndex, phases.length - 1);
        else if (prevActive > phaseIndex) nextActive = prevActive - 1;
        nextActive = Math.max(0, Math.min(phases.length - 1, nextActive));
        patch['system.npcActivePhaseIndex'] = nextActive;
        (this as any).activeTab = `phase-${nextActive}`;
      }
      await (this.actor as any).update(patch);
    }
  }

  async #onToggleKnownNpc(): Promise<void> {
    if (!(game as any).user?.isGM) return;
    if (String((this.actor as any)?.type || '') !== 'npc') return;
    await toggleKnownNpc(String((this.actor as any).id || ''));
    await KnownNpcsBar.refresh();
    await (this as any).render(false);
  }

  async #persistSituationalSkills(skills: NpcSituationalSkill[]): Promise<void> {
    await this.actor.update({ 'system.situationalSkills': skills });
    await (this as any).render(false);
  }

  async #promptSituationalSkillForm(
    initial?: Partial<NpcSituationalSkill> & { presetPool?: number },
  ): Promise<NpcSituationalSkill | null> {
    const DialogCls = (globalThis as any).Dialog;
    if (typeof DialogCls?.prompt !== 'function') return null;
    const mr = Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 2));
    const defaultPool =
      initial?.poolDice != null
        ? Math.max(0, Math.floor(Number(initial.poolDice) || 0))
        : initial?.presetPool != null
          ? Math.max(0, Math.floor(Number(initial.presetPool) || 0))
          : suggestNpcPool(mr, 'capable');
    const name = String(initial?.name || '');
    const rank = Math.max(0, Math.min(8, Math.floor(Number(initial?.skillRank) || 0)));
    const notes = String(initial?.notes || '');
    const id = String(initial?.id || newSituationalSkillId());
    try {
      return await DialogCls.prompt({
        title: initial?.id ? 'Edit Situational Skill' : 'Add Situational Skill',
        content: `<div class="npc-sit-form">
          <p class="notes">Pool Nd8 keep MR (${mr}). Rank 0 = no Raises.</p>
          <p><label>Name <input type="text" name="name" value="${name.replace(/"/g, '&quot;')}" style="width:100%"/></label></p>
          <p><label>Pool dice (N) <input type="number" name="poolDice" value="${defaultPool}" min="0" max="24" style="width:4em"/></label>
             <span class="notes">→ Nk${mr}</span></p>
          <p><label>Skill Rank <input type="number" name="skillRank" value="${rank}" min="0" max="8" style="width:4em"/></label></p>
          <p><label>Notes <input type="text" name="notes" value="${notes.replace(/"/g, '&quot;')}" style="width:100%"/></label></p>
        </div>`,
        label: 'Save',
        callback: (html: any) => {
          const root = html?.jquery ? html[0] : html?.[0] ?? html;
          const q = (n: string) =>
            root?.querySelector?.(`input[name="${n}"]`) as HTMLInputElement | null;
          const n = String(q('name')?.value || '').trim();
          if (!n) return null;
          return {
            id,
            name: n,
            poolDice: Math.max(0, Math.floor(Number(q('poolDice')?.value) || 0)),
            skillRank: Math.max(0, Math.min(8, Math.floor(Number(q('skillRank')?.value) || 0))),
            ...(String(q('notes')?.value || '').trim()
              ? { notes: String(q('notes')?.value).trim() }
              : {}),
          } satisfies NpcSituationalSkill;
        },
      });
    } catch {
      return null;
    }
  }

  async #onNpcSituationalAdd(): Promise<void> {
    const record = await this.#promptSituationalSkillForm();
    if (!record) return;
    const next = upsertSituationalSkill(
      readSituationalSkills((this.actor as any).system),
      record,
    );
    await this.#persistSituationalSkills(next);
  }

  async #onNpcSituationalPreset(preset: NpcPoolPreset): Promise<void> {
    if (preset !== 'capable' && preset !== 'specialist') return;
    const mr = Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 2));
    const pool = suggestNpcPool(mr, preset);
    const record = await this.#promptSituationalSkillForm({
      name: preset === 'capable' ? 'Capable' : 'Specialist',
      poolDice: pool,
      skillRank: 0,
      presetPool: pool,
    });
    if (!record) return;
    const next = upsertSituationalSkill(
      readSituationalSkills((this.actor as any).system),
      record,
    );
    await this.#persistSituationalSkills(next);
  }

  async #onNpcSituationalEdit(id: string): Promise<void> {
    if (!id) return;
    const current = findSituationalSkillById(
      readSituationalSkills((this.actor as any).system),
      id,
    );
    if (!current) {
      (ui as any).notifications?.warn('Situational skill not found.');
      return;
    }
    const record = await this.#promptSituationalSkillForm(current);
    if (!record) return;
    const next = upsertSituationalSkill(
      readSituationalSkills((this.actor as any).system),
      { ...record, id: current.id },
      current.id,
    );
    await this.#persistSituationalSkills(next);
  }

  async #onNpcSituationalDelete(id: string): Promise<void> {
    if (!id) return;
    const DialogCls = (globalThis as any).Dialog;
    const current = findSituationalSkillById(
      readSituationalSkills((this.actor as any).system),
      id,
    );
    if (!current) return;
    if (isNpcPerceptionSkill(current)) {
      (ui as any).notifications?.warn('Perception cannot be removed from NPCs.');
      return;
    }
    let ok = true;
    if (typeof DialogCls?.confirm === 'function') {
      ok = !!(await DialogCls.confirm({
        title: 'Delete Situational Skill',
        content: `<p>Remove <strong>${current.name}</strong>?</p>`,
      }));
    }
    if (!ok) return;
    const next = removeSituationalSkill(
      readSituationalSkills((this.actor as any).system),
      id,
    );
    await this.#persistSituationalSkills(next);
  }

  async #onNpcSituationalRoll(id: string): Promise<void> {
    if (!id) return;
    const skill = findSituationalSkillById(
      readSituationalSkills((this.actor as any).system),
      id,
    );
    if (!skill) {
      (ui as any).notifications?.warn('Situational skill not found.');
      return;
    }
    const { promptSkillCheckRollDialog } = await import('./skill-check-roll-dialog.js');
    const { executeSkillCheck } = await import('./skill-check-execute.js');
    const skillRef = { kind: 'npc-situational' as const, id: skill.id };
    const choice = await promptSkillCheckRollDialog({
      actor: this.actor,
      source: {
        kind: 'sheet-verbal',
        gmVerified: false,
        taskDescription: '',
        attributeKey: '',
        baseTn: Number.NaN,
        skill: skillRef,
      },
      lockGmFields: false,
      title: `${skill.name} · NPC Skill Check`,
      npcSituational: {
        skillId: skill.id,
        skillName: skill.name,
        poolDice: skill.poolDice,
        skillRank: skill.skillRank,
      },
    });
    if (!choice) return;
    const result = await executeSkillCheck({
      actor: this.actor,
      draft: choice.draft,
    });
    if (!result.ok) {
      (ui as any).notifications?.warn(result.error || 'Invalid Skill Check.');
    }
  }

}
