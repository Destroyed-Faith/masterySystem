/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */

import { MasteryCharacterSheet } from './character-sheet';
import {
  ALL_SPECIAL_EFFECTS,
  getEffectBaseName,
  type EffectCategory,
} from '../utils/special-effects.js';
import {
  coerceNpcPhasesArray,
  defaultNpcHealth,
  displayNpcSpecialName,
  ensureNpcHealthState,
  npcHealthHasBars,
  sumNpcAttackSlotsFromPowers,
  sanitizeNpcSystemAttackTargeting,
  mergeNpcAttackValueLists,
  NPC_EXTRA_POWERS_UPDATE,
} from '../utils/npc-attack-model.js';
import {
  coerceStatusEffectsArray,
  reduceStatusEffectAt,
  statusEntryId,
} from '../system/active-specials.js';
import {
  clampNpcInitiativeModifier,
  splitNpcInitiativeModifier,
} from '../utils/npc-initiative.js';
import { openNpcPrintSheet } from './npc-print.js';
import { copyDocumentImageLink } from '../ui/image-url-share.js';
import { creatureTypeSelectOptions } from '../utils/creature-type.js';
import {
  NPC_STANDARD_REACTIONS,
  clampNpcReactionSlots,
  coerceNpcReactionsArray,
  listNpcCatalogReactions,
  newCatalogNpcReaction,
  newCustomNpcReaction,
  newStandardNpcReaction,
} from '../utils/npc-reactions.js';

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
  if (!Array.isArray(o.specials)) o.specials = [];
  if (o.name == null || o.name === '') o.name = 'Waffenangriff';
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
    if (Number.isFinite(n) && n > 0) (o as any)[k] = n;
    else delete (o as any)[k];
  }
  // Short band may be 0 (= derive from Long) — keep it for the select.
  {
    const raw = o.npcRangeMinMeters;
    if (raw === '' || raw === null || raw === undefined) {
      delete (o as any).npcRangeMinMeters;
    } else {
      const n = Math.floor(Number(raw));
      if (Number.isFinite(n) && n >= 0) o.npcRangeMinMeters = n;
      else delete (o as any).npcRangeMinMeters;
    }
  }
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
  {
    const apr = Math.floor(Number(o.npcAttacksPerRound));
    o.npcAttacksPerRound =
      Number.isFinite(apr) && apr >= 1 ? Math.min(5, apr) : 1;
  }
  const rk = String(o.npcRangeKind || '').toLowerCase();
  if (rk === 'ranged') {
    o.npcRangeKind = 'ranged';
    // Range: Long 8–48 (absolute max); Short 0 (derive) or 2–48 (gifted full pool).
    const maxRaw = Math.floor(Number(o.npcRangeMeters));
    const minRaw = Math.floor(Number(o.npcRangeMinMeters));
    const maxM =
      Number.isFinite(maxRaw) && maxRaw >= 8 ? Math.min(48, maxRaw) : 24;
    let minM = 12;
    if (Number.isFinite(minRaw)) {
      if (minRaw <= 0) minM = 0;
      else minM = Math.min(48, Math.max(2, minRaw));
    }
    if (minM > maxM) minM = maxM;
    o.npcRangeMeters = maxM;
    o.npcRangeMinMeters = minM;
  } else {
    // Persist explicit melee so empty FormData can't leave a stale "ranged" flag.
    o.npcRangeKind = 'melee';
    // Reach: 1–8 m (default 2 when empty / when coming from Fern 12–24).
    const reachRaw = Math.floor(Number(o.npcRangeMeters));
    if (Number.isFinite(reachRaw) && reachRaw >= 1 && reachRaw <= 8) {
      o.npcRangeMeters = reachRaw;
    } else {
      o.npcRangeMeters = 2;
    }
    delete o.npcRangeMinMeters;
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
      msCopyPictureLink: function (this: any) {
        void copyDocumentImageLink(this.actor);
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
    context.npcDamageDiceMin = isSummon ? 1 : 4;
    context.creatureTypeOptions = creatureTypeSelectOptions(context.system?.creatureType);

    if (isNpcLike && context.system) {
      if (context.system.creatureType == null || context.system.creatureType === undefined) {
        // Legacy: bio.type may already hold a free-text creature label.
        context.system.creatureType = String(context.system.bio?.type ?? '');
      }
      context.system.npcBaseAttack = ensureNpcBaseShape(context.system.npcBaseAttack);
      context.system.npcReactions = coerceNpcReactionsArray(context.system.npcReactions);
      context.system.npcReactionSlots = clampNpcReactionSlots(context.system.npcReactionSlots);

      if (isSummon) {
        context.system.phases = null;
      } else {
        const phases = coerceNpcPhasesArray(context.system.phases);
        if (phases.length > 0) {
          if (
            context.system.npcActivePhaseIndex == null ||
            !Number.isFinite(Number(context.system.npcActivePhaseIndex))
          ) {
            context.system.npcActivePhaseIndex = 0;
          }
          context.system.phases = phases.map((phase: any) => ({
            ...phase,
            combat: withNpcIniUi(phase?.combat),
            npcBaseAttack: ensureNpcBaseShape(phase?.npcBaseAttack),
            health: ensureNpcHealthState(phase?.health ?? context.system.health),
            npcReactions: coerceNpcReactionsArray(phase?.npcReactions),
            npcReactionSlots: clampNpcReactionSlots(phase?.npcReactionSlots),
          }));
        }
      }
      context.system.combat = withNpcIniUi(context.system.combat);
      (context as any).npcMasteryRank = Math.max(
        1,
        Math.floor(Number(context.system.mastery?.rank) || 2),
      );
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
      }
      // NPC ATK = Summe der Angriffe/Runde-Kopien. Summons keep Bond attackSlots.
      if (!isSummon) {
        context.system.attackSlots = sumNpcAttackSlotsFromPowers(context.system);
      }

      // Combat applies Specials to root system.statusEffects. Phase tabs used to
      // read empty phase.statusEffects ([] is truthy in Handlebars → blank panel).
      // Prefer live actor data (same source as combat carousel).
      const statusList = coerceStatusEffectsArray(
        (this.actor as any)?.system?.statusEffects ?? context.system.statusEffects
      );
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

    let usageKey = 'npc-attack-root-0';
    let update: Record<string, unknown> = {};
    if (phaseBase) {
      const pi = Number(phaseBase[1]);
      const phases = dup(coerceNpcPhasesArray(actor.system?.phases));
      while (phases.length <= pi) phases.push({});
      const phase = { ...(phases[pi] || {}) };
      phase.npcBaseAttack = sanitizeNpcAttackTargetingFields({
        ...(phase.npcBaseAttack || {}),
        ...patch,
      });
      phases[pi] = phase;
      update['system.phases'] = phases;
      usageKey = npcAttackUsageKey(pi, 0);
      const activePi = Math.floor(Number(actor.system?.npcActivePhaseIndex) || 0);
      if (pi === activePi) {
        update['system.npcBaseAttack'] = sanitizeNpcAttackTargetingFields({
          ...(actor.system?.npcBaseAttack || {}),
          ...patch,
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
        ...patch,
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
        ...patch,
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
        ...patch,
      });
      usageKey = npcAttackUsageKey(null, 0);
    } else {
      for (const [key, value] of Object.entries(patch)) update[`${path}.${key}`] = value;
      usageKey = `npc-attack-path-${path}`;
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
      const submitPhases = coerceNpcPhasesArray(data.system.phases);
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
          attackValues: mergeNpcAttackValueLists(prev.attackValues, phase.attackValues),
          npcReactions: coerceNpcReactionsArray(phase.npcReactions ?? prev.npcReactions),
          npcReactionSlots: clampNpcReactionSlots(phase.npcReactionSlots ?? prev.npcReactionSlots),
        };
      });
    }
    if (data.system.attackValues != null || existingSystem.attackValues != null) {
      data.system.attackValues = mergeNpcAttackValueLists(
        existingSystem.attackValues,
        data.system.attackValues,
      );
    }
    data.system.npcReactions = coerceNpcReactionsArray(
      data.system.npcReactions ?? existingSystem.npcReactions,
    );
    data.system.npcReactionSlots = clampNpcReactionSlots(
      data.system.npcReactionSlots ?? existingSystem.npcReactionSlots,
    );
    if (data.system.combat && typeof data.system.combat === 'object') {
      data.system.combat = {
        ...data.system.combat,
        initiative: clampNpcInitiativeModifier(data.system.combat.initiative),
      };
    }
    // Status UI is button-driven (not form fields) — never let an empty submit wipe it.
    if (Object.prototype.hasOwnProperty.call(data.system, 'statusEffects')) {
      const submitted = coerceStatusEffectsArray(data.system.statusEffects);
      data.system.statusEffects =
        submitted.length > 0
          ? submitted
          : coerceStatusEffectsArray(existingSystem.statusEffects);
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
      const path =
        select.dataset.npcAttackPath ||
        String(select.name || '').replace(/\.npcRangeKind$/, '');
      if (!path) return;
      const kind = String(select.value || '').toLowerCase() === 'ranged' ? 'ranged' : 'melee';
      const patch: Record<string, unknown> =
        kind === 'ranged'
          ? {
              npcRangeKind: 'ranged',
              npcRangeMeters: 24,
              // Default Fern band; set Min to 0 on the sheet if targets stand closer.
              npcRangeMinMeters: 12,
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
      const path =
        (radEl as HTMLElement).dataset?.npcAttackPath ||
        String(radEl.name || '').replace(/\.npcAoeRadiusM$/, '');
      if (!path) return;
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

    html.find('.phase-add-btn').on('click', this.#onPhaseAdd.bind(this));
    html.find('.phase-delete-btn').on('click', this.#onPhaseDelete.bind(this));

    html.find('.npc-power-special-add').on('click', this.#onNpcPowerSpecialAdd.bind(this));
    html.find('.npc-power-special-del').on('click', this.#onNpcPowerSpecialDel.bind(this));

    html.find('.npc-reaction-add-custom').on('click', this.#onNpcReactionAddCustom.bind(this));
    html.find('.npc-reaction-add-standard').on('click', this.#onNpcReactionAddStandard.bind(this));
    html.find('.npc-reaction-add-catalog').on('click', this.#onNpcReactionAddCatalog.bind(this));
    html.find('.npc-reaction-delete').on('click', this.#onNpcReactionDelete.bind(this));
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
    const list = coerceStatusEffectsArray((this.actor as any).system?.statusEffects);
    if (!Number.isFinite(index) || index < 0 || index >= list.length) return;
    const next = list.filter((_, i) => i !== index);
    await (this.actor as any).update({ 'system.statusEffects': next });
  }

  async #onReduceStatusEffect(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const btn = $(event.currentTarget);
    const index = parseInt(String(btn.data('effect-index') ?? ''), 10);
    const steps = Math.max(1, parseInt(String(btn.data('steps') ?? '1'), 10) || 1);
    const list = coerceStatusEffectsArray((this.actor as any).system?.statusEffects);
    if (!Number.isFinite(index) || index < 0 || index >= list.length) return;
    const next = reduceStatusEffectAt(list, index, steps);
    await (this.actor as any).update({ 'system.statusEffects': next });
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
      const phases = dup(coerceNpcPhasesArray(system.phases));
      if (!Number.isFinite(pi) || !phases[pi]) {
        return;
      }
      const pav = normalizeAttackValuesArray(phases[pi].attackValues);
      if (index >= 0 && index < pav.length) {
        pav.splice(index, 1);
        phases[pi].attackValues = pav;
        await (this.actor as any).update({ 'system.phases': phases }, extraOpt);
      }
    } else {
      const av = normalizeAttackValuesArray(system.attackValues);
      if (index >= 0 && index < av.length) {
        av.splice(index, 1);
        await (this.actor as any).update({ 'system.attackValues': av }, extraOpt);
      }
    }
  }

  async #onNpcPowerSpecialAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    const $t = $(event.currentTarget);
    const scope = String($t.data('scope') || '');
    const phaseRaw = $t.data('phase-index');
    const attackRaw = $t.data('attack-index');
    const system = (this.actor as any).system;
    const entry: { special?: string; specialValue?: number } = { special: '' };

    if (scope === 'base') {
      const base = ensureNpcBaseShape(system.npcBaseAttack);
      base.specials = [...(base.specials || []), entry];
      await (this.actor as any).update({ 'system.npcBaseAttack': base });
      return;
    }

    if (scope === 'phase-base') {
      const pi = Number(phaseRaw);
      if (!Number.isFinite(pi) || !system.phases?.[pi]) return;
      const phases = dup(system.phases);
      const base = ensureNpcBaseShape(phases[pi].npcBaseAttack);
      base.specials = [...(base.specials || []), entry];
      phases[pi].npcBaseAttack = base;
      await (this.actor as any).update({ 'system.phases': phases });
      return;
    }

    if (scope === 'reaction') {
      const ri = Number($t.data('reaction-index'));
      if (!Number.isFinite(ri)) return;
      await this.#mutateNpcReactions(phaseRaw, (rows) => {
        if (!rows[ri]) return rows;
        const next = dup(rows);
        const row = dup(next[ri]);
        row.specials = [...(row.specials || []), entry];
        next[ri] = row;
        return next;
      });
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
        att.specials = [...(att.specials || []), entry];
        phases[pi].attackValues[ai] = att;
        await (this.actor as any).update({ 'system.phases': phases });
      } else {
        if (!system.attackValues?.[ai]) return;
        const av = dup(system.attackValues);
        const att = dup(av[ai]);
        att.specials = [...(att.specials || []), entry];
        av[ai] = att;
        await (this.actor as any).update({ 'system.attackValues': av });
      }
    }
  }

  async #onNpcPowerSpecialDel(event: JQuery.ClickEvent) {
    event.preventDefault();
    const $t = $(event.currentTarget);
    const scope = String($t.data('scope') || '');
    const si = parseInt(String($t.data('special-index') ?? '-1'), 10);
    if (si < 0) return;

    const phaseRaw = $t.data('phase-index');
    const attackRaw = $t.data('attack-index');
    const system = (this.actor as any).system;

    if (scope === 'base') {
      const base = ensureNpcBaseShape(system.npcBaseAttack);
      if (si >= base.specials.length) return;
      base.specials.splice(si, 1);
      await (this.actor as any).update({ 'system.npcBaseAttack': base });
      return;
    }

    if (scope === 'phase-base') {
      const pi = Number(phaseRaw);
      if (!Number.isFinite(pi) || !system.phases?.[pi]) return;
      const phases = dup(system.phases);
      const base = ensureNpcBaseShape(phases[pi].npcBaseAttack);
      if (si >= base.specials.length) return;
      base.specials.splice(si, 1);
      phases[pi].npcBaseAttack = base;
      await (this.actor as any).update({ 'system.phases': phases });
      return;
    }

    if (scope === 'reaction') {
      const ri = Number($t.data('reaction-index'));
      if (!Number.isFinite(ri)) return;
      await this.#mutateNpcReactions(phaseRaw, (rows) => {
        if (!rows[ri] || !Array.isArray(rows[ri].specials) || si >= rows[ri].specials.length) return rows;
        const next = dup(rows);
        const row = dup(next[ri]);
        row.specials = [...(row.specials || [])];
        row.specials.splice(si, 1);
        next[ri] = row;
        return next;
      });
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
        if (!Array.isArray(att.specials) || si >= att.specials.length) return;
        att.specials.splice(si, 1);
        phases[pi].attackValues[ai] = att;
        await (this.actor as any).update({ 'system.phases': phases });
      } else {
        if (!system.attackValues?.[ai]) return;
        const av = dup(system.attackValues);
        const att = dup(av[ai]);
        if (!Array.isArray(att.specials) || si >= att.specials.length) return;
        att.specials.splice(si, 1);
        av[ai] = att;
        await (this.actor as any).update({ 'system.attackValues': av });
      }
    }
  }

  #npcMasteryRank(): number {
    return Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 2));
  }

  async #mutateNpcReactions(
    phaseRaw: unknown,
    mutator: (rows: any[]) => any[],
    extra?: Record<string, unknown>,
  ): Promise<void> {
    const system = (this.actor as any).system;
    const phaseIndex =
      phaseRaw !== undefined && phaseRaw !== null && String(phaseRaw) !== ''
        ? Number(phaseRaw)
        : null;
    if (phaseIndex != null && Number.isFinite(phaseIndex)) {
      const phases = dup(coerceNpcPhasesArray(system.phases));
      if (!phases[phaseIndex]) return;
      const rows = mutator(coerceNpcReactionsArray(phases[phaseIndex].npcReactions));
      phases[phaseIndex].npcReactions = rows;
      if (extra?.slots != null) phases[phaseIndex].npcReactionSlots = extra.slots;
      else if (clampNpcReactionSlots(phases[phaseIndex].npcReactionSlots) <= 0 && rows.length > 0) {
        phases[phaseIndex].npcReactionSlots = 1;
      }
      await (this.actor as any).update({ 'system.phases': phases });
      return;
    }
    const rows = mutator(coerceNpcReactionsArray(system.npcReactions));
    const patch: Record<string, unknown> = { 'system.npcReactions': rows };
    if (extra?.slots != null) patch['system.npcReactionSlots'] = extra.slots;
    else if (clampNpcReactionSlots(system.npcReactionSlots) <= 0 && rows.length > 0) {
      patch['system.npcReactionSlots'] = 1;
    }
    await (this.actor as any).update(patch);
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

  async #onNpcReactionDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    event.stopPropagation();
    const $t = $(event.currentTarget);
    const index = parseInt(String($t.data('reaction-index') ?? '-1'), 10);
    if (index < 0) return;
    await this.#mutateNpcReactions($t.data('phase-index'), (rows) => {
      if (index >= rows.length) return rows;
      const next = [...rows];
      next.splice(index, 1);
      return next;
    });
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
    const defaultCombat = { initiative: 0, evade: 10, armor: 0, speed: 8 };
    const defaultHealth = defaultNpcHealth();

    // First phase: migrate the current (root) stats so adding phases does not
    // wipe Evade / Armor / Speed / HP that were already tuned on the sheet.
    if (phases.length === 0) {
      phases.push({
        name: 'Phase 1',
        health: ensureNpcHealthState(dup(system.health) || defaultHealth),
        combat: { ...defaultCombat, ...(dup(system.combat) || {}) },
        npcBaseAttack: dup(system.npcBaseAttack) || defaultAttack,
        attackValues: Array.isArray(system.attackValues) ? dup(system.attackValues) : [],
        npcReactions: coerceNpcReactionsArray(system.npcReactions),
        npcReactionSlots: clampNpcReactionSlots(system.npcReactionSlots),
        statusEffects: [],
      });
      await (this.actor as any).update({
        'system.phases': phases,
        'system.npcActivePhaseIndex': 0,
      });
      return;
    }

    // Further phases: copy the previous phase as a starting point.
    const prev = phases[phases.length - 1] || {};
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
      npcReactions: coerceNpcReactionsArray(prev.npcReactions ?? system.npcReactions),
      npcReactionSlots: clampNpcReactionSlots(prev.npcReactionSlots ?? system.npcReactionSlots),
      statusEffects: [],
    });
    await (this.actor as any).update({ 'system.phases': phases });
  }

  async #onPhaseDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const phaseIndex = parseInt($(event.currentTarget).data('phase-index') || '0', 10);

    const system = (this.actor as any).system;
    if (!system.phases || !Array.isArray(system.phases)) {
      return;
    }

    if (phaseIndex >= 0 && phaseIndex < system.phases.length) {
      const phases = dup(system.phases);
      phases.splice(phaseIndex, 1);
      await (this.actor as any).update({ 'system.phases': phases });
    }
  }

}
