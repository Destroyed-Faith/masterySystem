/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */

import { powerCostPaysAction, textSuggestsActiveBuff } from '../radial-menu/options.js';
import { resolvePowerMechanics } from './power-mechanics.js';
import { ALL_POWER_TEMPLATES } from './powers/index.js';
import { getRoundState, setRoundState } from '../combat/action-economy.js';
import { getRulesMasteryRank } from './mastery-rank-sync.js';

/**
 * Consume leftover parked Empowerment rounds (legacy roundState).
 * Resolve Active Buff Empowerment now extends a maintained Buff immediately and
 * no longer grants Power Level — discard any leftover PL marker.
 */
async function consumePendingBuffExtension(actor: Actor): Promise<{ rounds: number; powerLevels: number }> {
  try {
    const combat = (game as any).combat ?? null;
    const roundState = getRoundState(actor, combat);
    const sb: any = roundState?.stoneBonuses;
    const pending = Math.max(0, Math.floor(Number(sb?.extendActiveBuffRounds ?? 0) || 0));
    const hadPl = Math.max(0, Math.floor(Number(sb?.activeBuffPlBonus ?? 0) || 0)) > 0;
    if (pending <= 0 && !hadPl) return { rounds: 0, powerLevels: 0 };
    sb.extendActiveBuffRounds = 0;
    sb.activeBuffPlBonus = 0;
    await setRoundState(actor, roundState);
    return { rounds: pending, powerLevels: 0 };
  } catch (err) {
    console.warn('Mastery System | Active Buff Empowerment lookup failed', err);
    return { rounds: 0, powerLevels: 0 };
  }
}

/**
 * Extend the currently maintained true Active Buff by complete Rounds.
 * Used by Resolve Stone Ability: Active Buff Empowerment (immediate apply).
 */
export async function extendMaintainedActiveBuffRounds(
  actor: Actor,
  extraRounds: number,
): Promise<{ ok: boolean; name?: string; lastActiveRound?: number; addedRounds?: number }> {
  const n = Math.max(0, Math.floor(Number(extraRounds) || 0));
  if (n <= 0) return { ok: false };
  const maintained = getTrueActiveBuffs(actor);
  const effect = maintained[0];
  if (!effect) return { ok: false };

  const { readBuffLifecycleFlags } = await import('../combat/active-buff-lifecycle.js');
  const life = readBuffLifecycleFlags(effect);
  if (!life) return { ok: false };

  const flags = effect.flags?.['mastery-system'] ?? {};
  const priorExtended = Math.max(0, Math.floor(Number(flags.extendedRounds) || 0));
  const newDuration = life.effectiveDuration + n;
  const newLast = life.lastActiveRound + n;

  const patch: Record<string, unknown> = {
    'flags.mastery-system.effectiveDuration': newDuration,
    'flags.mastery-system.durationRounds': newDuration,
    'flags.mastery-system.lastActiveRound': newLast,
    'flags.mastery-system.extendedRounds': priorExtended + n,
  };
  // Keep Foundry's native countdown from cutting the Buff early.
  const currentNative = Math.max(0, Math.floor(Number(effect.duration?.rounds) || 0));
  if (currentNative > 0) {
    patch['duration.rounds'] = currentNative + n;
  }

  if (typeof effect.update === 'function') {
    await effect.update(patch);
  } else if (effect.flags?.['mastery-system']) {
    effect.flags['mastery-system'].effectiveDuration = newDuration;
    effect.flags['mastery-system'].durationRounds = newDuration;
    effect.flags['mastery-system'].lastActiveRound = newLast;
    effect.flags['mastery-system'].extendedRounds = priorExtended + n;
  }

  return {
    ok: true,
    name: String(effect.name || 'Active Buff'),
    lastActiveRound: newLast,
    addedRounds: n,
  };
}

function paysActionCost(power: any): boolean {
  return powerCostPaysAction(power?.system?.cost);
}

function resolvedActiveBuffMechanics(power: any): boolean {
  try {
    const mech = resolvePowerMechanics(power);
    return mech?.applyWhen === 'activeBuff-active';
  } catch {
    return false;
  }
}

/**
 * Effect Power Level for an Active Buff snapshot.
 * Uses the power's purchased `rank` / `level` — never Mastery Rank (that only
 * sets duration). Missing rank previously fell back to MR and could snapshot
 * Active Buff: Armor at +17 (PL4) while the sheet still showed PL1/+5.
 */
export function resolveActiveBuffEffectLevel(
  powerSys: any,
  empowerPowerLevels = 0,
): number {
  const pick = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 0;
  };
  const base = pick(powerSys?.rank) || pick(powerSys?.level) || 1;
  const bonus = Math.max(0, Math.floor(Number(empowerPowerLevels) || 0));
  return Math.max(1, Math.min(16, base + bonus));
}

/**
 * Check if a power is a utility (not a true active buff)
 */
export function isUtility(power: any): boolean {
  if (!power || power.type !== 'power') return false;
  const powerType = power.system?.powerType;
  return powerType === 'utility';
}

/**
 * Check if a power is a true active buff (not a utility)
 */
export function isTrueActiveBuff(power: any): boolean {
  if (!power || power.type !== 'power') return false;
  
  const powerType = power.system?.powerType;
  const pays = paysActionCost(power);
  
  // Utilities are NOT true active buffs (they can stack)
  if (powerType === 'utility') {
    return false;
  }
  
  // Check if it's explicitly an active-buff or buff power that requires an action
  if ((powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') && pays) {
    return true;
  }
  if (resolvedActiveBuffMechanics(power) && pays) {
    return true;
  }
  
  // Check tags for active-buff indicators
  const tags = power.system?.tags || [];
  if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
    if (pays) {
      return true;
    }
  }
  
  // Check if power type is 'active' but has buff-like characteristics
  if (powerType === 'active' && pays) {
    if (textSuggestsActiveBuff(power.name || '', power.system?.description)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a power is an active buff (includes utilities)
 */
export function isActiveBuff(power: any): boolean {
  if (!power || power.type !== 'power') return false;
  
  const powerType = power.system?.powerType;
  const range = power.system?.range;
  const tags = power.system?.tags || [];
  const pays = paysActionCost(power);
  
  // Check if it's explicitly an active-buff or buff power that requires an action
  if ((powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') && pays) {
    return true;
  }
  if (resolvedActiveBuffMechanics(power) && pays) {
    return true;
  }
  
  // Check tags for active-buff indicators
  if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
    if (pays) {
      return true;
    }
  }
  
  // Check if power type is 'active' but has buff-like characteristics
  if (powerType === 'active' && pays) {
    if (textSuggestsActiveBuff(power.name || '', power.system?.description)) {
      return true;
    }
  }
  
  // Check if it's a utility that is Self-targeting (these are also active buffs)
  if (powerType === 'utility' && pays) {
    const rangeStr = range?.toString().toLowerCase() || '';
    // If range is "Self" or 0, it's a self-buff utility
    if (rangeStr === 'self' || rangeStr === '0' || range === 0) {
      return true;
    }
    // Also check if it has buff-like tags or characteristics
    if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
      return true;
    }
    if (textSuggestsActiveBuff(power.name || '', power.system?.description)) {
      return true;
    }
  }
  
  return false;
}

/** Active Buff duration in rounds before Extend Active Buff. */
export function activeBuffDurationRounds(actor: any): number {
  return getRulesMasteryRank(actor);
}

/**
 * Get current combat round
 */
function getCurrentRound(): number {
  return game.combat?.round || 1;
}

/**
 * Get all true active buffs (excluding utilities) on an actor
 */
export function getTrueActiveBuffs(actor: Actor): any[] {
  const effects = (actor as any).effects;
  if (!effects) return [];
  
  return effects.filter((effect: any) => {
    const flags = effect.flags?.['mastery-system'];
    if (flags?.activeBuff !== true) return false;
    
    // Check if the original power was a utility
    const powerId = flags.powerId;
    if (powerId) {
      const power = (actor as any).items?.get(powerId);
      if (power && isUtility(power)) {
        return false; // Exclude utilities
      }
    }
    
    return true;
  });
}

export interface ActivateActiveBuffOptions {
  /**
   * When true, skip the Preparation-window gate (internal/tests only).
   * Normal callers must activate during Preparation.
   */
  allowOutsidePreparation?: boolean;
  /**
   * @deprecated Z01 — no Attack Action / once-per-Prep slot. Kept for callers.
   */
  skipActionCommit?: boolean;
}

/**
 * Activate an active buff power during the Preparation Phase.
 * Duration is complete Combat Rounds ending at Round End:
 * lastActiveRound = activationRound + effectiveDuration - 1.
 * Only one true active buff can be active at a time (utilities can stack).
 * Activation does not spend an Attack Action or Stones. There is no general
 * per-Combat or per-Preparation activation limit — replace ends the prior Buff
 * fully before the new one begins (Z01).
 */
export async function activateActiveBuff(
  actor: Actor,
  power: any,
  opts?: ActivateActiveBuffOptions,
): Promise<boolean> {
  if (!isActiveBuff(power)) {
    console.warn('Mastery System | activateActiveBuff called with non-buff power', power.name);
    return false;
  }

  // R-05: ordinary HP healing buffs are retired and flagged by the migration; they cannot activate.
  try {
    const { isR05RetiredHealingPower } = await import('../migrations/r05-healing-migration.js');
    if (isR05RetiredHealingPower(power)) {
      ui.notifications?.warn(`${power.name} was retired in R-05 (use Restoration / Passive: Restoration instead).`);
      return false;
    }
  } catch {
    /* guard is best-effort */
  }

  const combat = (game as any).combat ?? null;
  if (!opts?.allowOutsidePreparation) {
    if (!combat) {
      ui.notifications?.warn(
        `${power.name} can only be activated during the Preparation Phase of combat.`,
      );
      return false;
    }
    try {
      const { isActiveBuffPreparationWindow } = await import('../combat/active-buff-lifecycle.js');
      if (!isActiveBuffPreparationWindow(actor, combat)) {
        ui.notifications?.warn(
          `${power.name}: Active Buffs activate only during Preparation (not during your Turn).`,
        );
        return false;
      }
    } catch (err) {
      console.warn('Mastery System | Active Buff Preparation gate failed', err);
      return false;
    }
  }

  const tplId = String(power?.system?.templateId || '').toLowerCase();
  // Active Buff: Damage Negation Pool requires slotted Passive: Damage Negation
  // (even when that Passive's combat Reserve is already 0).
  if (tplId === 'ab-reinforced-damage-negation') {
    try {
      const { slottedPassiveLevel } = await import('../combat/passive-combat-charges.js');
      if (slottedPassiveLevel(actor, 'passive-damage-negation') <= 0) {
        ui.notifications?.warn(
          `${power.name} requires Passive: Damage Negation to be slotted (Reserve may be 0).`,
        );
        return false;
      }
    } catch (err) {
      console.warn('Mastery System | DN Buff requirement check failed', err);
    }
  }

  // Guard Unavailable Special Aura / other zero-effect PLs before ending the prior Buff.
  try {
    const peekLevel = resolveActiveBuffEffectLevel(power?.system || {}, 0);
    const tplPeek = ALL_POWER_TEMPLATES.find(
      (t: any) => t?.templateId === String(power?.system?.templateId || '').trim(),
    );
    const peekMech =
      tplPeek?.levels?.[String(peekLevel) as keyof typeof tplPeek.levels]?.mechanics ??
      power?.system?.levels?.[String(peekLevel)]?.mechanics;
    if (peekMech && (peekMech as any).specialAuraUnavailable === true) {
      ui.notifications?.warn(
        `${power.name} has no effect at Power Level ${peekLevel} (Unavailable).`,
      );
      return false;
    }
  } catch {
    /* best-effort */
  }

  // Check if this is a true active buff (not a utility)
  const isTrueBuff = isTrueActiveBuff(power);

  // Only one maintained Active Buff: end every prior true Buff (effects +
  // modifiers) before the new effect is created — never overlap.
  if (isTrueBuff) {
    const existingTrueBuffs = getTrueActiveBuffs(actor);
    for (const existingBuff of existingTrueBuffs) {
      const existingName = existingBuff.name || 'Unknown';
      try {
        if (combat) {
          const { snapshotActiveBuffPrepResourcesBeforeEnd } = await import(
            '../combat/active-buff-lifecycle.js'
          );
          await snapshotActiveBuffPrepResourcesBeforeEnd(actor, combat, existingBuff);
        }
        try {
          const { cleanupSpecialAuraVisual } = await import('../combat/special-aura-runtime.js');
          await cleanupSpecialAuraVisual(actor, existingBuff);
        } catch {
          /* visual only */
        }
        await existingBuff.delete();
        ui.notifications?.info(
          `${existingName} ends — ${power.name} replaces it (only one Active Buff at a time).`,
        );
      } catch (err) {
        console.warn('Mastery System | failed to end previous Active Buff', err);
      }
    }
  }
  
  const masteryRank = activeBuffDurationRounds(actor);
  const {
    preparationTargetRound,
    computeLastActiveRound,
  } = await import('../combat/active-buff-lifecycle.js');
  const activationRound = combat ? preparationTargetRound(combat) : Math.max(1, getCurrentRound());

  // Resolve Stone Ability: Active Buff Empowerment — may improve PL and duration
  // for a Buff activated in the same Preparation Phase.
  const empower = await consumePendingBuffExtension(actor);
  const durationRounds = masteryRank + empower.rounds;
  const lastActiveRound = computeLastActiveRound(activationRound, durationRounds);

  // Foundry duration is set long enough that native countdown does not cut the
  // Buff mid-Round; authoritative expiry is Round End via lifecycle.
  const duration = {
    startRound: activationRound,
    startTurn: 0,
    rounds: durationRounds + 1,
    turns: 0,
    seconds: null,
    combat: combat?.id || null,
  };
  
  // Snapshot level-specific mechanics (powers use levels["1"]..["16"]; `rank` is 1–16).
  const powerSys: any = power.system || {};
  const powerLevelKey = resolveActiveBuffEffectLevel(powerSys, empower.powerLevels);

  let rankMechanicsRaw: Record<string, unknown> | null = null;
  // Prefer live catalog by templateId so PL strength matches the rulebook row
  // (avoids stale baked levels / name collisions with Passive: Armor).
  const tplIdSnap = String(powerSys.templateId || '').trim();
  if (tplIdSnap) {
    const tpl = ALL_POWER_TEMPLATES.find((t: any) => t?.templateId === tplIdSnap);
    const catMech = tpl?.levels?.[String(powerLevelKey) as keyof typeof tpl.levels]?.mechanics;
    if (catMech && typeof catMech === 'object') {
      rankMechanicsRaw = { ...(catMech as unknown as Record<string, unknown>) };
    }
  }
  if (!rankMechanicsRaw) {
    const fromLevel = powerSys.levels?.[String(powerLevelKey)]?.mechanics;
    if (fromLevel && typeof fromLevel === 'object') {
      rankMechanicsRaw = { ...(fromLevel as Record<string, unknown>) };
    } else if (powerSys.mechanics && typeof powerSys.mechanics === 'object') {
      rankMechanicsRaw = { ...(powerSys.mechanics as Record<string, unknown>) };
    } else {
      const resolved = resolvePowerMechanics({
        ...power,
        system: { ...powerSys, rank: powerLevelKey, level: powerLevelKey },
      });
      if (resolved && typeof resolved === 'object') {
        rankMechanicsRaw = { ...(resolved as unknown as Record<string, unknown>) };
      }
    }
  }

  // Aggregator requires `applyWhen: 'activeBuff-active'` on the snapshot (item
  // JSON may omit it when only partial mechanics are stored on the level).
  let rankMechanics: Record<string, unknown> & { applyWhen: 'activeBuff-active' } =
    rankMechanicsRaw && typeof rankMechanicsRaw === 'object'
      ? { ...rankMechanicsRaw, applyWhen: 'activeBuff-active' as const }
      : { applyWhen: 'activeBuff-active' as const };

  // Item JSON sometimes omits `damageReductionPct` on DR rows; merge from catalog so DR always snapshots.
  if (String(powerSys?.templateId || '') === 'ab-damage-reduction') {
    const drNow = (rankMechanics as { damageReductionPct?: unknown }).damageReductionPct;
    if (typeof drNow !== 'number' || !Number.isFinite(drNow) || drNow <= 0) {
      const tpl = ALL_POWER_TEMPLATES.find((t: any) => t?.templateId === 'ab-damage-reduction');
      const lvlKey = String(powerLevelKey);
      const row = tpl?.levels?.[lvlKey as keyof typeof tpl.levels] ?? tpl?.levels?.['1'];
      const m = row?.mechanics;
      if (m && typeof m === 'object') {
        rankMechanics = {
          ...(m as unknown as Record<string, unknown>),
          ...rankMechanics,
          applyWhen: 'activeBuff-active',
        };
      } else {
      }
    }
  }

  const drSnap = (rankMechanics as { damageReductionPct?: unknown }).damageReductionPct;
  if (
    String(powerSys?.templateId || '') === 'ab-damage-reduction' &&
    (typeof drSnap !== 'number' || !Number.isFinite(drSnap) || drSnap <= 0)
  ) {
    ui.notifications?.warn(
      'Active Buff: Damage Reduction — snapshot has no valid DR%; check power item `levels` / `rank`.',
    );
  }

  const levelRow = powerSys.levels?.[String(powerLevelKey)];
  const effectText = String(
    levelRow?.effect || levelRow?.effectText || power.system?.description || power.system?.effect || '',
  ).trim();

  // Create ActiveEffect data - simplified structure for Foundry VTT
  const effectData: any = {
    name: power.name,
    // Generic icon — avoids a misleading power-art token on the map for buffs.
    icon: 'icons/svg/book.svg',
    // Store original power data in flags
    flags: {
      'mastery-system': {
        activeBuff: true,
        powerId: power.id,
        powerName: power.name,
        /** Closed-subsystem DR whitelist (see `power-mechanics.ts` / `isSanctionedDR`). */
        powerTemplateId: powerSys?.templateId ? String(powerSys.templateId) : null,
        /** Numeric catalog PL for identity resolution (Batch B). */
        rank: Number(powerLevelKey) || Number(powerSys?.rank) || Number(powerSys?.level) || 1,
        masteryRank: masteryRank,
        durationRounds: durationRounds,
        effectiveDuration: durationRounds,
        activationRound,
        activatedRound: activationRound,
        lastActiveRound,
        durationMode: 'round-end',
        combatId: combat?.id ? String(combat.id) : null,
        extendedRounds: empower.rounds,
        empoweredPowerLevels: empower.powerLevels,
        effectiveLevel: powerLevelKey,
        level: powerLevelKey,
        effectText,
        isUtility: isUtility(power),
        mechanics: rankMechanics,
        preparationTempHP: tplId === 'ab-temp-hp' || tplId === 'ab-temp-hp-healing',
      }
    },
    // Add description directly (not in system.description.value)
    description: effectText || power.system?.description || power.system?.effect || ''
  };
  
  // Add duration if in combat
  if (game.combat) {
    effectData.duration = duration;
  } else {
    // If not in combat, set a long duration so it doesn't expire immediately
    effectData.duration = {
      startRound: null,
      startTurn: null,
      rounds: durationRounds,
      turns: null,
      seconds: null,
      combat: null
    };
  }
  
  try {
    // Create the effect on the actor
    const created = await (actor as any).createEmbeddedDocuments('ActiveEffect', [effectData]);
    if (!created?.length) {
      if (combat && !opts?.skipActionCommit) {
        try {
          const { refundPrepActiveBuffActivation } = await import('../combat/active-buff-lifecycle.js');
          await refundPrepActiveBuffActivation(actor, combat);
        } catch {
          /* best-effort */
        }
      }
      ui.notifications?.error(`Failed to activate ${power.name}`);
      return false;
    }
    ui.notifications?.info(
      `Activated ${power.name} (Rounds ${activationRound}–${lastActiveRound}${empower.rounds > 0 ? `, incl. +${empower.rounds} from Active Buff Empowerment` : ''})`,
    );

    // Grant Prep resources immediately (Temp HP / DN Pool) for the activation Round.
    try {
      const { processActiveBuffPreparation } = await import('../combat/active-buff-lifecycle.js');
      await processActiveBuffPreparation(actor, combat);
    } catch (prepErr) {
      console.warn('Mastery System | Active Buff Preparation resource grant failed', prepErr);
    }

    // Batch 8 / Z05: Special Aura activation — visual + immediate Special application.
    try {
      const { isSpecialAuraTemplateId, onSpecialAuraActivated } = await import(
        '../combat/special-aura-runtime.js'
      );
      if (isSpecialAuraTemplateId(tplId)) {
        await onSpecialAuraActivated(actor, combat);
      }
    } catch (auraErr) {
      console.warn('Mastery System | Special Aura activation failed', auraErr);
    }

    try {
      const ChatCls = (globalThis as any).ChatMessage;
      const esc =
        (globalThis as any).foundry?.utils?.escapeHTML?.bind((globalThis as any).foundry.utils) ??
        ((s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      const lines: string[] = [
        `<p><strong>${esc(String(power.name))}</strong> — active through <strong>Round ${lastActiveRound}</strong> (expires at Round End; Prep activation).</p>`,
      ];
      if (empower.rounds > 0) {
        lines.push(
          `<p>Active Buff Empowerment: <strong>+${empower.rounds}</strong> round${empower.rounds === 1 ? '' : 's'}.</p>`,
        );
      }
      const rm: any = rankMechanics ?? {};
      if (typeof rm.damageReductionPct === 'number' && rm.damageReductionPct > 0) {
        lines.push(
          `<p>Buff: <strong>+${rm.damageReductionPct}%</strong> Damage Reduction (stacks with passive DR in combat totals).</p>`,
        );
      }
      if (typeof rm.armor === 'number' && rm.armor !== 0) {
        lines.push(`<p>Buff: <strong>+${rm.armor}</strong> Armor.</p>`);
      }
      if (typeof rm.evade === 'number' && rm.evade !== 0) {
        lines.push(`<p>Buff: <strong>+${rm.evade}</strong> Evade.</p>`);
      }
      await ChatCls.create({
        user: (game as any).user?.id,
        speaker: ChatCls.getSpeaker({ actor: actor as any }),
        content: lines.join(''),
      });
    } catch (chatErr) {
      console.warn('Mastery System | Active buff chat message failed', chatErr);
    }
    
    return true;
  } catch (error) {
    console.error('Mastery System | Failed to activate active buff', error);
    if (combat && !opts?.skipActionCommit) {
      try {
        const { refundPrepActiveBuffActivation } = await import('../combat/active-buff-lifecycle.js');
        await refundPrepActiveBuffActivation(actor, combat);
      } catch {
        /* best-effort undo */
      }
    }
    ui.notifications?.error(`Failed to activate ${power.name}`);
    return false;
  }
}

export interface RetractActiveBuffOptions {
  /** Override user for permission checks (tests). */
  user?: { isGM?: boolean } | null;
}

export type RetractActiveBuffResult = {
  ok: boolean;
  refunded: boolean;
  reason?: 'none' | 'denied' | 'error';
};

/**
 * Sync permission helper: voluntary end is free anytime for the owner / GM (Z01).
 * `windowOpen` is ignored for ending — kept for call-site compatibility.
 */
export function canRetractActiveBuffFromFlags(opts: {
  maintaining: boolean;
  isGM: boolean;
  isOwner: boolean;
  windowOpen?: boolean;
}): boolean {
  if (!opts.maintaining) return false;
  return opts.isGM || opts.isOwner;
}

/**
 * Whether the current user may voluntarily end a maintained true Active Buff.
 * Owners and GMs may end anytime at no cost (Z01). Activation still requires Preparation.
 */
export async function canRetractActiveBuffActivation(
  actor: Actor,
  _combat?: any,
  user?: { isGM?: boolean } | null,
): Promise<boolean> {
  if (!actor) return false;
  const maintained = getTrueActiveBuffs(actor);
  if (!maintained.length) return false;
  const u = user ?? (globalThis as any).game?.user ?? null;
  if (u?.isGM) return true;
  return !!(actor as any).isOwner;
}

/**
 * Voluntarily end a maintained Active Buff (free, anytime).
 * Clears legacy prepBaseAttackCommitted / activeBuffUsedThisRound if present.
 * Does not restore Critical / Maximization / other limited Buff resources.
 */
export async function retractActiveBuffActivation(
  actor: Actor,
  opts?: RetractActiveBuffOptions,
): Promise<RetractActiveBuffResult> {
  const combat = (globalThis as any).game?.combat ?? null;
  const user = opts?.user ?? (globalThis as any).game?.user ?? null;
  const maintained = getTrueActiveBuffs(actor);
  if (!maintained.length) {
    ui.notifications?.warn('No Active Buff to end.');
    return { ok: false, refunded: false, reason: 'none' };
  }

  const allowed = !!user?.isGM || !!(actor as any).isOwner;
  if (!allowed) {
    ui.notifications?.warn('You cannot end this Active Buff.');
    return { ok: false, refunded: false, reason: 'denied' };
  }

  const names = maintained
    .map((e: any) => String(e?.name || 'Active Buff'))
    .filter(Boolean)
    .join(', ');

  try {
    for (const effect of [...maintained]) {
      if (combat) {
        try {
          const { snapshotActiveBuffPrepResourcesBeforeEnd } = await import(
            '../combat/active-buff-lifecycle.js'
          );
          await snapshotActiveBuffPrepResourcesBeforeEnd(actor, combat, effect);
        } catch (snapErr) {
          console.warn('Mastery System | Active Buff end resource snapshot failed', snapErr);
        }
      }
      try {
        const { cleanupSpecialAuraVisual } = await import('../combat/special-aura-runtime.js');
        await cleanupSpecialAuraVisual(actor, effect);
      } catch {
        /* best-effort visual cleanup — applied Specials remain */
      }
      await effect.delete();
    }
  } catch (err) {
    console.error('Mastery System | Failed to retract Active Buff', err);
    ui.notifications?.error('Failed to retract Active Buff.');
    return { ok: false, refunded: false, reason: 'error' };
  }

  let refunded = false;
  if (combat) {
    try {
      const { getRoundState } = await import('../combat/action-economy.js');
      const { refundPrepActiveBuffActivation } = await import('../combat/active-buff-lifecycle.js');
      const rs = getRoundState(actor, combat);
      if (rs.prepBaseAttackCommitted) {
        refunded = await refundPrepActiveBuffActivation(actor, combat);
      } else if (rs.activeBuffUsedThisRound) {
        // Stale flag without commit — clear so Preparation can activate again.
        rs.activeBuffUsedThisRound = false;
        const { setRoundState } = await import('../combat/action-economy.js');
        await setRoundState(actor, rs);
      }
    } catch (err) {
      console.warn('Mastery System | Active Buff retract refund failed', err);
    }
  }

  ui.notifications?.info(`${names} ended.`);

  try {
    const ChatCls = (globalThis as any).ChatMessage;
    if (ChatCls?.create) {
      const esc =
        (globalThis as any).foundry?.utils?.escapeHTML?.bind((globalThis as any).foundry.utils) ??
        ((s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      await ChatCls.create({
        user: (globalThis as any).game?.user?.id,
        speaker: ChatCls.getSpeaker({ actor: actor as any }),
        content: `<p><strong>${esc(names)}</strong> ended (voluntary; no limited Buff resources restored).</p>`,
      });
    }
  } catch {
    /* optional chat */
  }

  return { ok: true, refunded };
}

/** Alias — voluntary end of the maintained Active Buff (Z01). */
export const endActiveBuff = retractActiveBuffActivation;

/**
 * Get all active buffs on an actor
 */
export function getActiveBuffs(actor: Actor): any[] {
  const effects = (actor as any).effects;
  if (!effects) return [];
  
  return effects.filter((effect: any) => {
    const flags = effect.flags?.['mastery-system'];
    return flags?.activeBuff === true;
  });
}

/**
 * Highest Active Buff Critical(X) currently maintained (0 if none).
 * X = Critical-capable attacks per Round (not explode strength).
 * Resolution lives in `src/combat/critical-resolution.ts`.
 */
export function getActiveBuffCriticalTier(actor: Actor): number {
  let best = 0;
  for (const effect of getActiveBuffs(actor)) {
    const flags = effect.flags?.['mastery-system'] ?? {};
    const mech = flags.mechanics ?? {};
    const crit = Math.max(0, Math.floor(Number(mech.critical) || 0));
    if (crit > best) best = crit;
  }
  return best;
}

/**
 * Check if a specific power is currently active as a buff
 */
export function isPowerActiveAsBuff(actor: Actor, powerId: string): boolean {
  const activeBuffs = getActiveBuffs(actor);
  return activeBuffs.some((effect: any) => {
    const flags = effect.flags?.['mastery-system'];
    return flags?.powerId === powerId;
  });
}

/**
 * Remove all Mastery-flagged active-buff ActiveEffects from an actor (e.g. combat end).
 */
export async function deleteAllMasteryActiveBuffEffects(actor: Actor): Promise<void> {
  const effects = getActiveBuffs(actor);
  if (!effects.length) return;
  const ids = effects.map((e: any) => e.id).filter(Boolean);
  if (!ids.length) return;
  try {
    await (actor as any).deleteEmbeddedDocuments('ActiveEffect', ids);
  } catch (err) {
    console.warn('Mastery System | deleteAllMasteryActiveBuffEffects failed', err);
  }
}
