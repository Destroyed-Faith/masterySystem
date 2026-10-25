/**
 * Attack Roll Click Handler
 * Handles clicks on .roll-attack-btn buttons in chat messages
 * Moved from module.ts to avoid circular dependencies
 */

import {
  isRaiseAllocationComplete,
  parseDeclaredRaises,
  resolveRaiseOutcome,
  successfulRaiseSlotCount,
  type DeclaredRaise,
  type RaiseOption,
  type RaiseOutcome,
} from '../combat/raise-resolution.js';
import { RAISE_INCREMENT } from '../utils/constants.js';
import { resolveNpcSheetToHit } from '../utils/npc-attack-model.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { faithRerollNote } from './faith-fracture-reroll.js';

/** jQuery `.data()` caches parsed `data-*` on first read; dynamic `.attr()` updates won't match. */
function readAttackButtonDataInt(button: JQuery, kebab: string, fallback: number): number {
  const raw = button.attr(`data-${kebab}`);
  if (raw === undefined || raw === '') return fallback;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : fallback;
}

const rollAttackMessageLocks = new Set<string>();

export function registerAttackRollClickHandler(): void {
  // Register handler on the chat log container using event delegation
  // This ensures it works for all messages, including dynamically added ones
  $(document).off('click', '.roll-attack-btn').on('click', '.roll-attack-btn', async (ev: JQuery.ClickEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    
    const button = $(ev.currentTarget);
    const messageElement = button.closest('.message');
    
    // Try multiple methods to get message ID (Foundry VTT uses data-message-id attribute)
    const messageId = messageElement.attr('data-message-id') || 
                      messageElement.data('message-id') || 
                      messageElement.data('messageId');
    if (!messageId) {
      console.warn('Mastery System | Could not find message ID for attack roll', {
        messageElementHtml: messageElement[0]?.outerHTML?.substring(0, 200),
        allDataAttrs: Array.from(messageElement[0]?.attributes || []).map((attr: any) => `${attr.name}="${attr.value}"`)
      });
      return;
    }

    await executeAttackRollFromCard(button, String(messageId));
  });
}

/**
 * Run the attack roll pipeline for an attack card (fresh roll → on success the
 * damage dialog and follow-ups). Invoked by the Roll button click, and by the
 * Faith Fracture reroll flow (`faithReroll` set): the reroll re-runs the whole
 * pipeline so a rerolled hit can proceed to damage — but must NOT re-spend the
 * attack action or re-trigger one-time side effects (Dread gate, Disrupt
 * consumption, Blood Raise HP loss) that the original roll already paid.
 */
export async function executeAttackRollFromCard(
  button: JQuery,
  messageId: string,
  opts: {
    faithReroll?: { spenderName: string; free?: boolean };
    /** Original roll used Crit (7–8 explode). Faith reroll must keep that without re-spending. */
    preserveAttackExplode78?: boolean;
  } = {},
): Promise<void> {
  {
    const isFaithReroll = !!opts.faithReroll;
    const preserveAttackExplode78 = opts.preserveAttackExplode78 === true;
    const message = (game as any).messages?.get(messageId);
    if (!message) {
      const allMessageIds = (game as any).messages ? Array.from((game as any).messages.keys()) : [];
      console.warn('Mastery System | Could not find message for attack roll', {
        messageId,
        allMessageIds: allMessageIds.slice(0, 10) // Only show first 10 for debugging
      });
      return;
    }
    
    // Debug: Check all flags on the message
    const allFlags = message.flags;
    // Try both methods to get flags (getFlag might not work in some Foundry versions)
    const flags = message.getFlag?.('mastery-system') || message.flags?.['mastery-system'];
    
    // Debug log after flags read
    if (!flags || (flags.attackType !== 'melee' && flags.attackType !== 'ranged')) {
      console.warn('Mastery System | DEBUG: Invalid flags or unknown attack type', {
        flags,
        attackType: flags?.attackType,
        allFlagsKeys: Object.keys(allFlags || {}),
        masterySystemFlags: allFlags?.['mastery-system']
      });
      return;
    }

    const lockId = String(messageId);
    // The lock stays set after a successful roll (re-click guard). A faith
    // reroll legitimately re-runs the card, so it may pass; concurrent reroll
    // requests are already serialized per roll message in faith-fracture-reroll.
    if (rollAttackMessageLocks.has(lockId) && !isFaithReroll) {
      return;
    }
    rollAttackMessageLocks.add(lockId);
    const awaitsResolution = !!flags.awaitAttackResolution;
    const suppressNestedCounterattack = !!flags.fromReactionCounterattack;

    // Entitlement: pressing Roll opens a reaction opportunity for this attack
    // even if the attack later misses (window posts after the roll / damage).
    try {
      await message.setFlag?.('mastery-system', 'reactionEntitled', {
        attackerId: flags.attackerId || button.attr('data-attacker-id') || null,
        targetId: flags.targetId || button.attr('data-target-id') || null,
        targetTokenId: flags.targetTokenId || button.attr('data-target-token-id') || null,
        at: Date.now(),
      });
    } catch (entitleErr) {
      console.warn('Mastery System | reaction entitlement flag failed', entitleErr);
    }

    const resetRollButton = () => {
      button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll');
      rollAttackMessageLocks.delete(lockId);
    };

    // Disable button during roll
    button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Rolling...');
    let spentActionOnRoll = false;
    let spentAmmoOnRoll = false;
    let actorToRefund: any = null;
    let actorForAmmo: any = null;
    let markedPowerIdForRoll: string | null = null;
    let markedNpcAttackIdForRoll: string | null = null;

    try {
      // Import the roll handler (must use .js extension for ES modules in Foundry VTT)
      const { masteryRoll } = await import('../dice/roll-handler.js');
      // Get actor data - always get fresh from game.actors
      const attacker = (game as any).actors?.get(flags.attackerId);
      if (!attacker) {
        throw new Error('Attacker not found');
      }
      
      // Ensure we have fresh actor reference (not stale).
      // Prefer the SPEAKER's actor so UNLINKED tokens resolve to their own
      // (synthetic) actor — its delta carries the real attribute build and the
      // equipped items. `game.actors.get(id)` would return the world/prototype
      // actor (default attributes, possibly missing the equipped weapon).
      const freshAttacker =
        (ChatMessage as any).getSpeakerActor?.(message.speaker) ??
        (game as any).actors?.get(attacker.id) ??
        attacker;

      // DF 2026: Spell Raises (Paid + Free) allocate their effects BEFORE the
      // casting roll. Refuse to roll until every declared Raise has an effect.
      {
        const isSpellCard = (flags as any).powerIsSpell === true || (flags as any).npcIsSpell === true;
        const spellOptions: RaiseOption[] = Array.isArray((flags as any).raiseOptions)
          ? ((flags as any).raiseOptions as RaiseOption[])
          : [];
        if (isSpellCard && spellOptions.length > 0) {
          const spellSlots =
            Math.max(
              Math.max(0, Math.floor(Number((flags as any).declaredRaiseSlots) || 0)),
              readAttackButtonDataInt(button, 'raise-slots', 0),
            ) +
            Math.max(
              Math.max(0, Math.floor(Number((flags as any).freeRaiseSlots) || 0)),
              readAttackButtonDataInt(button, 'free-raises', 0),
            );
          if (spellSlots > 0) {
            let plan = parseDeclaredRaises(button.attr('data-raise-plan') || '[]');
            if (!plan.length && Array.isArray((flags as any).preRollRaisePlan)) {
              plan = (flags as any).preRollRaisePlan as DeclaredRaise[];
            }
            if (!isRaiseAllocationComplete(plan, spellSlots, spellOptions)) {
              ui.notifications?.warn(
                `Allocate all ${spellSlots} Spell Raise${spellSlots === 1 ? '' : 's'} before casting.`,
              );
              resetRollButton();
              return;
            }
            if (!parseDeclaredRaises(button.attr('data-raise-plan') || '[]').length) {
              button.attr('data-raise-plan', JSON.stringify(plan));
            }
          }
        }
      }

      // Faith reroll: the original roll already spent the action.
      const costsAction = !isFaithReroll && flags.costsAction !== false;
      if (costsAction) {
        const combat = (game as any).combat;
        if (!combat) {
          ui.notifications?.warn('Not in combat.');
          resetRollButton();
          return;
        }
        const {
          getAvailableAttackActions,
          consumeAttackAction,
          getActionEconomyActor
        } = await import('../combat/action-economy.js');
        const economyAttacker = getActionEconomyActor(freshAttacker) ?? freshAttacker;
        if (getAvailableAttackActions(economyAttacker, combat) <= 0) {
          ui.notifications?.warn('No Actions left this round.');
          resetRollButton();
          return;
        }
        const consumed = await consumeAttackAction(economyAttacker, combat);
        if (!consumed) {
          ui.notifications?.warn('Failed to consume attack action.');
          resetRollButton();
          return;
        }
        spentActionOnRoll = true;
        actorToRefund = economyAttacker;
        if (flags.selectedPowerId) {
          const { markPowerUsedThisRound } = await import('../combat/action-economy.js');
          await markPowerUsedThisRound(economyAttacker, combat, flags.selectedPowerId);
          markedPowerIdForRoll = flags.selectedPowerId;
        }
        if (flags.npcAttackSource && flags.npcAttackOptionId) {
          const { markNpcAttackUsedThisRound } = await import('../combat/action-economy.js');
          await markNpcAttackUsedThisRound(
            economyAttacker,
            combat,
            String(flags.npcAttackOptionId),
          );
          markedNpcAttackIdForRoll = String(flags.npcAttackOptionId);
        }
      }

      // Load property (PG Weapon Properties): an Unloaded weapon cannot fire.
      // Firing marks it Unloaded; Reload (Attack Action or Quick Load) clears it.
      let loadWeaponToUnload: any = null;
      if (!isFaithReroll && flags.attackType === 'ranged' && flags.isSpell !== true && !flags.npcAttackSource) {
        try {
          const { hasLoadProperty, isWeaponUnloaded } = await import('../utils/weapon-properties.js');
          const items: any[] = freshAttacker.items ? Array.from(freshAttacker.items) : [];
          const weapon =
            (flags.weaponId ? freshAttacker.items?.get?.(flags.weaponId) : null) ??
            items.find(
              (it: any) =>
                it.type === 'weapon' &&
                it.system?.equipped === true &&
                String(it.system?.weaponType || '') === 'ranged',
            ) ??
            null;
          if (weapon && hasLoadProperty(weapon)) {
            if (isWeaponUnloaded(weapon)) {
              ui.notifications?.warn(
                `${weapon.name} is Unloaded — reload first (1 Attack Action or Quick Load).`,
              );
              resetRollButton();
              if (spentActionOnRoll && actorToRefund) {
                const { refundAttackAction } = await import('../combat/action-economy.js');
                await refundAttackAction(actorToRefund, (game as any).combat);
              }
              return;
            }
            loadWeaponToUnload = weapon;
          }
        } catch (err) {
          console.warn('Mastery System | Load property check failed', err);
        }
      }

      if (!isFaithReroll && flags.attackType === 'ranged' && flags.isSpell !== true) {
        const ammo = await import('../utils/ammunition.js');
        if (ammo.findEquippedAmmunitionWeapon(freshAttacker)) {
          const check = ammo.evaluateAmmunitionAttack(freshAttacker, 1);
          if (!check.ok) {
            ammo.warnAmmunitionAttack(check.reason);
            resetRollButton();
            if (spentActionOnRoll && actorToRefund) {
              const { refundAttackAction } = await import('../combat/action-economy.js');
              await refundAttackAction(actorToRefund, (game as any).combat);
            }
            return;
          }
          const consumedAmmo = await ammo.consumeAmmunitionForAttack(freshAttacker, 1);
          if (!consumedAmmo.ok) {
            resetRollButton();
            if (spentActionOnRoll && actorToRefund) {
              const { refundAttackAction } = await import('../combat/action-economy.js');
              await refundAttackAction(actorToRefund, (game as any).combat);
            }
            return;
          }
          spentAmmoOnRoll = true;
          actorForAmmo = freshAttacker;
        }
      }

      // "After you fire, the weapon is Unloaded."
      if (loadWeaponToUnload) {
        try {
          const { markWeaponUnloaded } = await import('../utils/weapon-properties.js');
          await markWeaponUnloaded(loadWeaponToUnload);
        } catch (err) {
          console.warn('Mastery System | could not mark weapon Unloaded', err);
        }
      }

      // Debug: Log actor items to verify we have latest data
      let attackerItems: any[] = [];
      if (freshAttacker.items) {
        if (Array.isArray(freshAttacker.items)) {
          attackerItems = freshAttacker.items;
        } else if (freshAttacker.items instanceof Map) {
          attackerItems = Array.from(freshAttacker.items.values());
        } else if (freshAttacker.items.size !== undefined && freshAttacker.items.values) {
          attackerItems = Array.from(freshAttacker.items.values());
        }
      }
      // Normal TN vs Raise TN (new Raise rules).
      // Prefer attack-card message flags over DOM attrs — chat re-renders reset
      // the button HTML to the original content (slots 0), which would wipe
      // Raises on Faith Fracture / GM reroll.
      const flagNormalTn = Math.max(0, Math.floor(Number(flags.normalTn ?? flags.baseEvade) || 0));
      const flagRaiseTn = Math.max(0, Math.floor(Number(flags.raiseTn) || 0));
      const flagPaid = Math.max(0, Math.floor(Number(flags.declaredRaiseSlots) || 0));
      const flagFree = Math.max(0, Math.floor(Number(flags.freeRaiseSlots) || 0));
      let normalTn = readAttackButtonDataInt(
        button,
        'normal-tn',
        readAttackButtonDataInt(button, 'target-evade', flagNormalTn),
      );
      if (flagNormalTn > 0) normalTn = flagNormalTn;
      let raiseTn = readAttackButtonDataInt(button, 'raise-tn', normalTn);
      if (flagRaiseTn > 0) raiseTn = flagRaiseTn;
      const willingSpell =
        (flags as any).tnKind === 'casting' &&
        button.closest('.mastery-attack-card').find('input.willing-spell-target').prop('checked') === true;
      if (willingSpell) {
        const spellBase = Math.floor(Number((flags as any).spellBaseTn) || 0);
        if (spellBase > 0 && normalTn > spellBase) {
          const sr = normalTn - spellBase;
          normalTn = spellBase;
          raiseTn = Math.max(spellBase, raiseTn - sr);
        }
        (flags as any).willingSpellTarget = true;
      }
      // Pre-roll: only Paid / Free counts. Effects are allocated after a hit.
      let declaredRaiseSlots = Math.max(
        flagPaid,
        readAttackButtonDataInt(button, 'raise-slots', 0),
      );
      let freeRaiseSlots = Math.max(flagFree, readAttackButtonDataInt(button, 'free-raises', 0));
      // On faith reroll, flags are authoritative (DOM often shows the stale card HTML).
      if (isFaithReroll && (flagPaid > 0 || flagRaiseTn > 0 || flagFree > 0)) {
        declaredRaiseSlots = flagPaid;
        freeRaiseSlots = flagFree;
        raiseTn = flagRaiseTn > 0 ? flagRaiseTn : normalTn + flagPaid * RAISE_INCREMENT;
      }
      // NPCs / Summons never declare Combat Raises — force Base TN only.
      if (flags.npcRaisesDisabled) {
        declaredRaiseSlots = 0;
        freeRaiseSlots = 0;
        raiseTn = normalTn;
      } else {
        const tnImpliedPaid = Math.max(0, Math.round((raiseTn - normalTn) / RAISE_INCREMENT));
        if (tnImpliedPaid > declaredRaiseSlots) {
          declaredRaiseSlots = tnImpliedPaid;
        }
      }
      // Keep the attack card flags in sync so every subsequent reroll sees Raises.
      try {
        await message.setFlag?.('mastery-system', 'declaredRaiseSlots', declaredRaiseSlots);
        await message.setFlag?.('mastery-system', 'freeRaiseSlots', freeRaiseSlots);
        await message.setFlag?.('mastery-system', 'raiseTn', raiseTn);
        await message.setFlag?.('mastery-system', 'normalTn', normalTn);
        button.attr('data-raise-slots', String(declaredRaiseSlots));
        button.attr('data-free-raises', String(freeRaiseSlots));
        button.attr('data-raise-tn', String(raiseTn));
        button.attr('data-free-raises-set', '1');
      } catch (persistErr) {
        console.warn('Mastery System | could not persist raise slots on attack card', persistErr);
      }
      // Split Strike 2 may already carry a shared post-hit allocation.
      let declaredRaises: DeclaredRaise[] = parseDeclaredRaises(button.attr('data-raise-plan') || '[]');
      // Free Raises were already spent on the original roll — do not consume again.
      if (!isFaithReroll && freeRaiseSlots > 0 && freshAttacker) {
        try {
          const { consumeFreeRaises } = await import('../combat/action-economy.js');
          const spent = await consumeFreeRaises(freshAttacker, freeRaiseSlots);
          freeRaiseSlots = spent;
        } catch (err) {
          console.warn('Mastery System | Free Raise spend failed', err);
          freeRaiseSlots = 0;
        }
      }
      
      // Compute numDice from ACTOR at click time (not from stale flags)
      // This ensures we always use the current attribute value.
      //
      // Resolve via ChatMessage.getSpeakerActor so UNLINKED tokens use their
      // own (synthetic) actor — its delta carries the real attribute build.
      // `game.actors.get(speaker.actor)` would return the world/prototype actor
      // (often default attributes), making e.g. Might 8 roll as the 2d8 default.
      const attackerForRoll =
        (ChatMessage as any).getSpeakerActor?.(message.speaker) ??
        (message.speaker?.actor
          ? (game as any).actors.get(message.speaker.actor)
          : (game as any).actors?.get(flags.attackerId));
      
      const attributeKey = flags.attribute?.toLowerCase();
      const liveAttr = attackerForRoll?.system?.attributes?.[attributeKey]?.value;
      const protoId = attackerForRoll?.isToken ? attackerForRoll.token?.actorId : null;
      const prototypeActor = protoId ? (game as any).actors?.get?.(protoId) : null;
      const sheetToHit = resolveNpcSheetToHit({
        actorType: attackerForRoll?.type,
        system: attackerForRoll?.system,
        masteryRank: attackerForRoll
          ? getRulesMasteryRank(attackerForRoll)
          : Number(flags.masteryRank ?? 2),
        attackIndex: flags.npcAttackIndex != null ? Number(flags.npcAttackIndex) : 0,
        phaseIndex: flags.npcPhaseIndex ?? null,
        prototypeSystem:
          prototypeActor && prototypeActor !== attackerForRoll ? prototypeActor.system : null,
      });
      const npcPool =
        !sheetToHit &&
        flags.useNpcAttackDicePool &&
        Number.isFinite(Number(flags.npcAttackDicePool)) &&
        Number(flags.npcAttackDicePool) > 0
          ? Math.floor(Number(flags.npcAttackDicePool))
          : 0;
      // Split-Attack: the executor pre-halved the pool and stored it in
      // flags.attributeValue. Do NOT fall back to the live attribute value for
      // split-attack strikes, because that would bypass the pool halving.
      // NPC/summon clicks re-read the sheet row so a stale card cannot keep Might 2.
      let numDice: number;
      if (flags.splitPoolAssigned === true && Number.isFinite(Number(flags.attributeValue))) {
        numDice = Math.max(0, Math.floor(Number(flags.attributeValue)));
      } else if (sheetToHit) {
        numDice = sheetToHit.dice;
        if (flags.splitAttack === true && flags.splitPoolAssigned !== true) {
          numDice = Math.max(0, Math.floor(numDice / 2));
        }
      } else if (npcPool > 0) {
        numDice = npcPool;
      } else if (flags.splitAttack === true && Number.isFinite(Number(flags.attributeValue)) && Number(flags.attributeValue) > 0) {
        numDice = Number(flags.attributeValue);
      } else if (Number.isFinite(liveAttr) && liveAttr > 0) {
        numDice = liveAttr;
      } else {
        numDice = flags.attributeValue ?? 2;
      }
      
      // Note: Specials (Weaken / Soulburn /
      // Challenge / Disoriented) and the Health / Encumbrance percentage
      // penalty are applied centrally inside `masteryRoll` in canonical
      // order (`applyPoolPenalties: true`).

      // Players Guide "Weapon Properties": Ranged (X m) / Thrown (X m) are
      // flat maximums — full pool inside the printed range, illegal beyond it.
      // (Range Bands and the 100/75/50 % pool reduction are obsolete.)
      if (flags.attackType === 'ranged' && flags.targetTokenId) {
        try {
          const { checkWeaponRange } = await import('../utils/range-bands.js');
          const { measureSceneDistanceBetweenPoints } = await import('../utils/grid-range.js');
          const attackerToken = (attackerForRoll as any)?.getActiveTokens?.()?.[0];
          const targetTokenDoc = (canvas as any)?.scene?.tokens?.get(flags.targetTokenId);
          const targetToken = targetTokenDoc?.object;
          const attackerCenter = attackerToken?.center;
          const targetCenter = targetToken?.center;
          if (attackerCenter && targetCenter) {
            const distanceM = measureSceneDistanceBetweenPoints(attackerCenter, targetCenter);
            const weaponRange =
              flags.weaponRange ||
              (() => {
                const w = (attackerForRoll?.items?.get?.(flags.weaponId)) || null;
                return w?.system?.range || null;
              })();
            const result = checkWeaponRange({ rangeText: weaponRange, distanceM });
            if (!result.inRange) {
              ui.notifications?.warn(
                `Target is out of range (${distanceM.toFixed(1)} m vs max ${result.maxRangeM} m).`,
              );
              resetRollButton();
              if (spentActionOnRoll && actorToRefund) {
                const { refundAttackAction } = await import('../combat/action-economy.js');
                await refundAttackAction(actorToRefund, (game as any).combat);
              }
              if (spentAmmoOnRoll && actorForAmmo) {
                const { refundAmmunitionForAttack } = await import('../utils/ammunition.js');
                await refundAmmunitionForAttack(actorForAmmo, 1);
              }
              if (loadWeaponToUnload) {
                const { markWeaponLoaded } = await import('../utils/weapon-properties.js');
                await markWeaponLoaded(loadWeaponToUnload);
              }
              return;
            }
          }
        } catch (err) {
          console.warn('Mastery System | weapon range check failed:', err);
        }
      }

      // Passive Parry: strip Attack Dice 1:1 before the roll. 0 dice = Fully Parried.
      let hasParryThisHit = false;
      let spellFullyCountered = false;
      let defenderForParry: any = null;
      let parryFlavorNote = '';
      try {
        const combatForParry = (game as any).combat ?? null;
        if (flags.targetTokenId) {
          const tokDoc =
            (canvas as any)?.scene?.tokens?.get?.(flags.targetTokenId) ??
            (canvas as any)?.tokens?.placeables?.find?.(
              (t: any) => t?.id === flags.targetTokenId,
            );
          defenderForParry =
            tokDoc?.actor ?? tokDoc?.document?.actor ?? tokDoc?.object?.actor ?? null;
        }
        if (!defenderForParry && flags.targetId) {
          defenderForParry = (game as any).actors?.get(flags.targetId) ?? null;
        }
        if (defenderForParry && combatForParry && numDice > 0) {
          const { applyParryDiceStrip } = await import('../combat/parry.js');
          const incomingSpell = (flags as any).tnKind === 'casting';
          const strip = await applyParryDiceStrip(defenderForParry, combatForParry, numDice, {
            spell: incomingSpell,
            attacker: freshAttacker,
          });
          if (strip.spent > 0) {
            numDice = strip.remainingDice;
            spellFullyCountered = strip.fullyParried && strip.countered;
            hasParryThisHit = strip.fullyParried && !strip.countered;
            if (strip.note) parryFlavorNote = ` (${strip.note})`;
          }
        }
      } catch (parryErr) {
        console.warn('Mastery System | Parry strip failed', parryErr);
      }

      // Fully Parried / Fully Countered: no roll, no hit effects, no damage.
      // Weapon follow-ups (Riposte, Parry + Weapon Damage) only follow a Martial Full Parry.
      if (hasParryThisHit || spellFullyCountered) {
        const stopLabel = spellFullyCountered ? 'Fully Countered' : 'Fully Parried';
        button.html(`<i class="fas fa-check"></i> ${stopLabel}`).addClass('rolled');
        const atkName = String((freshAttacker as any)?.name ?? 'Attacker');
        const defName = String((defenderForParry as any)?.name ?? 'Defender');
        const stopDetail = spellFullyCountered
          ? `Fully Countered <strong>${atkName}</strong>'s Spell (0 Casting Dice). The Spell does not resolve.`
          : `Fully Parried <strong>${atkName}</strong>'s attack (0 Attack Dice). No damage.`;
        try {
          await (globalThis as any).ChatMessage?.create?.({
            user: (game as any).user?.id,
            speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: defenderForParry }),
            content: `<p class="mastery-reaction-msg"><strong>${defName}</strong> ${stopDetail}</p>`,
          });
        } catch {
          /* ignore */
        }
        try {
          const combatForReactions = (game as any).combat ?? null;
          const { runInteractiveReactionWindow } = await import(
            '../combat/reaction-window-chat.js'
          );
          const aoeFromBtn = !!button.attr('data-aoe-melee-weapon');
          const isAoE =
            aoeFromBtn ||
            flags.aoeMeleeWeapon === true ||
            String(flags.aoeMeleeWeapon) === 'true';
          const secondaryIds = String(button.attr('data-aoe-secondary-ids') || flags.aoeMeleeSecondaryTokenIds || '');
          const multiTarget =
            isAoE ||
            flags.autofire === true ||
            String(flags.autofire) === 'true' ||
            secondaryIds.split(/[|,]/).filter((s) => s.trim()).length > 0;
          const spellDice = Math.max(
            0,
            Math.floor(Number((flags as any).basePowerSnapshot?.damageDice) || 0),
          );
          await runInteractiveReactionWindow({
            defender: defenderForParry as any,
            attacker: freshAttacker as any,
            combat: combatForReactions,
            rawDamage: 0,
            attackTotal: null,
            evadeTn: normalTn,
            hit: false,
            phase: 'defender',
            hasParryThisHit: hasParryThisHit,
            spellFullyCountered,
            parryDelivery: spellFullyCountered ? 'spell' : 'martial',
            multiTarget,
            spellPowerDamageDice: spellDice,
            attackType: flags.attackType === 'ranged' ? 'ranged' : 'melee',
            isAoE,
            suppressCounterattack: suppressNestedCounterattack,
          });
        } catch (fpErr) {
          console.warn('Mastery System | Fully Parried reaction window failed', fpErr);
        }
        return;
      }

      // Split-Attack: hard-cap the final pool inside `masteryRoll` so attack-rider
      // / manual bonus dice cannot inflate the strike back to the full attribute pool.
      const splitAttackDiceCap = flags.splitAttack === true ? numDice : undefined;
      
      // NPC attacks carry their printed Keep value ("6d8, Keep 1"); PCs keep MR.
      const npcKeep = sheetToHit
        ? sheetToHit.keep
        : Math.floor(Number(flags.npcAttackKeepDice) || 0);
      let keepDice =
        npcKeep > 0
          ? npcKeep
          : (attackerForRoll
            ? getRulesMasteryRank(attackerForRoll)
            : (flags.masteryRank ?? 2));
      const baseKeepDice = keepDice;
      // Disadvantage is no longer modeled as a Keep reduction (Players Guide
      // ~6471–6477 says only one chosen 8 may explode; pool & keep are
      // unchanged). The flag is forwarded to `masteryRoll` below so the
      // dice engine can apply the correct rule.

      const tnKind =
        (flags as any).tnKind === 'casting' ? 'casting' : 'evade';
      // Spell attacks (including Spell AoEs) keep Blood Raises / spell raise bonuses.
      const isSpellcasting = tnKind === 'casting';
      // Warn if values don't match (for debugging) — but split-attack is
      // expected to differ (flags holds half of live attribute), so skip then.
      if (!sheetToHit && flags.attributeValue !== numDice && flags.attributeValue > 0 && flags.splitAttack !== true) {
        console.warn('Mastery System | [ATTACK ROLL] Using live attribute value instead of flags', {
          flagsValue: flags.attributeValue,
          liveValue: numDice,
          attribute: flags.attribute,
          attackerId: flags.attackerId
        });
      }
      
      // Perform the attack roll with d8 dice (exploding 8s handled in roll-handler)
      // Label should reflect "Roll N d8 keep K"
      const advantageNote = flags.rollAdvantage
        ? ' (Advantage: reroll any 1 once)'
        : '';
      const disadvantageNote = flags.rollDisadvantage
        ? ' (Disadvantage: only one 8 explodes)'
        : '';
      void baseKeepDice;
      const attackKind = flags.attackType === 'ranged' ? 'Ranged' : 'Melee';
      const targetActorForFlavor = (game as any).actors?.get(flags.targetId);
      const aoeFlavorHint =
        flags.aoeMeleeWeapon === true || String(flags.aoeMeleeWeapon) === 'true'
          ? ' — AoE: same roll compared separately against each creature'
          : '';
      const rollFlavorBase =
        tnKind === 'casting'
          ? `Roll ${numDice}d8 keep ${keepDice} vs Final TN ${raiseTn}${
              declaredRaiseSlots > 0 ? ` (Base ${normalTn} + ${declaredRaiseSlots}×${RAISE_INCREMENT})` : ''
            }${aoeFlavorHint}${advantageNote}${disadvantageNote}${parryFlavorNote}`
          : `Roll ${numDice}d8 keep ${keepDice} vs Final TN ${raiseTn}${
              declaredRaiseSlots > 0
                ? ` (${targetActorForFlavor?.name || 'Target'} Evade ${normalTn} + ${declaredRaiseSlots}×${RAISE_INCREMENT})`
                : ` (${targetActorForFlavor?.name || 'Target'} Evade ${normalTn})`
            }${aoeFlavorHint}${advantageNote}${disadvantageNote}${parryFlavorNote}`;
      const rollFlavor = opts.faithReroll
        ? `${rollFlavorBase}${faithRerollNote(opts.faithReroll)}`
        : rollFlavorBase;
      const sheetAttackName = String(sheetToHit?.name || flags.npcAttackName || '').trim();
      const attrLabel = flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1);
      const splitIdx = Math.max(1, Math.floor(Number(flags.splitIndex) || 1));
      const splitPowerName = String(flags.selectedPowerName || '').trim();
      const splitBanner =
        flags.splitAttack === true
          ? `${splitPowerName || `${attackKind} Split Attack`} — Strike ${splitIdx} of 2`
          : '';
      const rollLabel =
        tnKind === 'casting'
          ? `Spell Attack (${attrLabel})`
          : splitBanner
            ? splitBanner
            : sheetAttackName
              ? sheetAttackName
              : `${attackKind} Attack (${attrLabel})`;

      const actionEco = await import('../combat/action-economy.js');
      const economyForStones = actionEco.getActionEconomyActor(freshAttacker) ?? freshAttacker;
      const combatRef = (game as any).combat;
      const rsCrit = actionEco.getRoundState(economyForStones, combatRef);
      const critBank = Math.max(0, Math.floor(Number(rsCrit?.stoneBonuses?.critRaises ?? 0) || 0));
      let buffCriticalX = 0;
      try {
        const { getActiveBuffCriticalTier } = await import('../utils/active-buffs.js');
        buffCriticalX = getActiveBuffCriticalTier(freshAttacker);
      } catch {
        buffCriticalX = 0;
      }
      // Critical(X) = X Critical attacks per Round; explode threshold always 7–8 on Attack Dice.
      const {
        resolveCriticalAttackModifier,
        syncCriticalRoundQuota,
        applyDeclaredCritSpend,
        combatRoundKey,
        critAppliesToAttackRoll,
      } = await import('../combat/critical-resolution.js');
      const roundKey = combatRoundKey(combatRef);
      const syncedQuota = syncCriticalRoundQuota(rsCrit.criticalQuota, roundKey, buffCriticalX);
      if (
        !rsCrit.criticalQuota ||
        rsCrit.criticalQuota.roundKey !== syncedQuota.roundKey ||
        rsCrit.criticalQuota.granted !== syncedQuota.granted ||
        rsCrit.criticalQuota.remaining !== syncedQuota.remaining
      ) {
        rsCrit.criticalQuota = syncedQuota;
        await actionEco.setRoundState(economyForStones, rsCrit);
      }
      const spellDamageDice =
        Math.max(0, Math.floor(Number((flags as any).basePowerSnapshot?.damageDice) || 0)) +
        Math.max(0, Math.floor(Number((flags as any).aoeMeleePowerBonusDice) || 0));
      const critLegal = critAppliesToAttackRoll({
        spell: tnKind === 'casting',
        damageDice: spellDamageDice,
      });
      // Faith reroll of a Crit roll: keep 7–8 explode even though the charge
      // was already spent and `.roll-attack-btn`.first() is the non-Crit button.
      const critDeclared =
        button.attr('data-use-crit') === '1' || (isFaithReroll && preserveAttackExplode78);
      const preferredRaw = String(button.attr('data-crit-source') || '');
      const preferredSource =
        preferredRaw === 'active-buff' ||
        preferredRaw === 'stone-crit' ||
        preferredRaw === 'passive-crit' ||
        preferredRaw === 'special-crit'
          ? preferredRaw
          : null;
      let passiveCritCharges = 0;
      try {
        const { getPassiveCriticalRemaining, grantPassiveCombatCharges } = await import(
          '../combat/passive-combat-charges.js'
        );
        if (combatRef?.id) await grantPassiveCombatCharges(economyForStones, combatRef);
        passiveCritCharges = getPassiveCriticalRemaining(economyForStones, combatRef);
      } catch {
        passiveCritCharges = 0;
      }
      const critMod = resolveCriticalAttackModifier({
        activeBuffCriticalX: critLegal ? buffCriticalX : 0,
        buffQuotaRemaining: critLegal ? syncedQuota.remaining : 0,
        stoneCritCharges: critLegal ? critBank : 0,
        passiveCritCharges: critLegal ? passiveCritCharges : 0,
        // On Faith Crit-preserve, skip charge resolution — explode is forced below.
        declared: critDeclared && !(isFaithReroll && preserveAttackExplode78),
        preferredSource,
      });
      const npcCrit =
        !!sheetToHit?.crit ||
        (flags as any).npcCrit === true ||
        (flags as any).npcCrit === 'true';
      const attackExplodeDiceOn78 =
        critMod.explodeOn78 || npcCrit || (isFaithReroll && preserveAttackExplode78);

      const bloodRaises = 0;
      let raiseTnRollBonus = 0;
      if (freshAttacker && combatRef) {
        raiseTnRollBonus = Math.max(
          0,
          Number(rsCrit?.stoneBonuses?.spellRaiseTnBonus ?? 0) || 0,
        );
      }

      // All targets of this attack (primary + AoE secondaries) — used by the
      // Challenge(X) pool reduction (no reduction when the challenger is hit).
      const challengeTargetRefs: string[] = [
        ...(flags.targetId ? [String(flags.targetId)] : []),
        ...(flags.targetTokenId ? [String(flags.targetTokenId)] : []),
        ...String(button.attr('data-aoe-secondary-ids') || '')
          .split('|')
          .map((s: string) => s.trim())
          .filter(Boolean),
      ];

      const result = await masteryRoll({
        numDice: numDice,
        keepDice: keepDice,
        skill: 0,
        tn: normalTn,
        label: rollLabel,
        flavor: rollFlavor,
        actorId: flags.attackerId,
        rollKind: 'attack',
        targetActorId: flags.targetId,
        autoFailIntent: 'attack',
        checkContext: { tags: ['sight'] },
        poolAttribute: attributeKey,
        targetRefs: challengeTargetRefs,
        applyPoolPenalties: true,
        actorRef: attackerForRoll,
        normalTn,
        raiseTn,
        declaredRaiseSlots,
        raiseModel: 'power',
        ...(bloodRaises > 0 && isSpellcasting ? { bloodRaises } : {}),
        ...(raiseTnRollBonus > 0 ? { raiseTnRollBonus } : {}),
        ...(typeof splitAttackDiceCap === 'number' && splitAttackDiceCap > 0
          ? { attackDiceCap: splitAttackDiceCap }
          : {}),
        ...(attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
        ...(flags.rollAdvantage ? { rollAdvantage: true } : {}),
        ...(flags.rollDisadvantage ? { rollDisadvantage: true } : {}),
        attackCardMessageId: messageId,
        // Max one reroll per roll: a faith-reroll result must not offer
        // another reroll button.
        ...(isFaithReroll ? { isRerollResult: true } : {}),
      });

      // Consume one Critical application (exactly one source — never double-spend).
      if (critMod.applyCritical && critMod.consumeFrom && !isFaithReroll) {
        if (critMod.consumeFrom === 'passive-crit') {
          const { spendPassiveCriticalCharge } = await import('../combat/passive-combat-charges.js');
          await spendPassiveCriticalCharge(economyForStones, combatRef);
        } else {
          const rs2 = actionEco.getRoundState(economyForStones, combatRef);
          if (!rs2.stoneBonuses) {
            rs2.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
          }
          rs2.criticalQuota = syncCriticalRoundQuota(rs2.criticalQuota, combatRoundKey(combatRef), buffCriticalX);
          applyDeclaredCritSpend(rs2, critMod);
          await actionEco.setRoundState(economyForStones, rs2);
        }
      }

      if (isSpellcasting) {
        const spellBase = Math.floor(Number((flags as any).spellBaseTn));
        const rolled = Math.floor(Number(result?.total) || 0);
        if ((flags as any).persistentSpellZone === true && Number.isFinite(spellBase) && spellBase > 0 && rolled >= spellBase) {
          try {
            const { appendSpellZone, createPersistentSpellZone, readSpellZones, writeSpellZones } =
              await import('../combat/spell-zones.js');
            const caster = freshAttacker || (game as any).actors?.get(flags.attackerId);
            if (caster) {
              const createdRound = Number((combatRef as any)?.round) || 0;
              const roundKey = `${String((combatRef as any)?.id ?? '')}:${createdRound}`;
              const already = String(flags.targetId || '').trim();
              const zone = createPersistentSpellZone({
                id: `${String((caster as any).id)}:${messageId}`,
                name: String((flags as any).selectedPowerName || 'Spell Zone'),
                casterId: String((caster as any).id ?? ''),
                spellBaseTn: spellBase,
                castingTotal: rolled,
                sourceMasteryRank: Number((flags as any).sourceMasteryRank) || getRulesMasteryRank(caster),
                powerId: (flags as any).spellZonePowerId ?? (flags as any).selectedPowerId ?? null,
                templateId: (flags as any).spellZoneTemplateId ?? null,
                durationNote: (flags as any).spellZoneDuration ?? null,
                createdRound,
                sceneId: (flags as any).spellZoneSceneId ?? null,
                appliedByRound: already ? { [roundKey]: [already] } : {},
                centerX: (flags as any).spellZoneCenterX ?? null,
                centerY: (flags as any).spellZoneCenterY ?? null,
                radiusMeters: Math.max(0, Number((flags as any).spellZoneRadius) || 0),
              });
              await writeSpellZones(caster, appendSpellZone(readSpellZones(caster), zone));
            }
          } catch (zoneErr) {
            console.warn('Mastery System | persistent spell zone was not stored', zoneErr);
          }
        }
      }
      
      const raiseOutcome: RaiseOutcome =
        (result as any).raiseOutcome ??
        resolveRaiseOutcome(result.total, normalTn, declaredRaiseSlots);
      // Update button to show it was rolled
      button.html('<i class="fas fa-check"></i> Rolled').addClass('rolled');

      // Autofire: one shared roll walks an ordered chain; first miss ends it.
      // Full payload per hit; Dive for Cover is not offered.
      const autofireChain = String(flags.autofireChainTokenIds || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (flags.autofire === true && autofireChain.length > 0) {
        const { resolveAutofireChain } = await import('../combat/autofire.js');
        const afAttacker = freshAttacker || (game as any).actors?.get(flags.attackerId);
        if (afAttacker) {
          await resolveAutofireChain({
            attacker: afAttacker,
            chainTokenIds: autofireChain,
            attackTotal: Math.floor(Number(result?.total) || 0),
            declaredRaiseSlots,
            flags: {
              ...flags,
              raiseOutcome,
              attackTotal: Math.floor(Number(result?.total) || 0),
              declaredRaises: [],
              declaredRaiseSlots,
              freeRaiseSlots,
              successfulRaiseSlots:
                raiseOutcome === 'full'
                  ? successfulRaiseSlotCount(declaredRaiseSlots, freeRaiseSlots)
                  : 0,
              stoneBonusRaises: 0,
            },
            weaponId: flags.weaponId || null,
          });
        }
        return;
      }

      // Instant AoE (Melee / Ranged AoE Attack, AoE Special Attacks): ONE shared
      // Attack/Casting roll, NO Primary Target. The card's anchor token is only the
      // roll carrier — it is resolved exactly like every other creature in the area
      // (own Evade / Final Spell TN, own Dive for Cover), then ONE shared Power
      // damage roll with the full printed Special is applied to every creature hit.
      // No Weapon Damage and no Spell Focus damage (damage dialog enforces both).
      const isInstantAoeCard =
        flags.aoeMeleeWeapon === true ||
        String(flags.aoeMeleeWeapon) === 'true' ||
        flags.instantAoe === true ||
        String(flags.instantAoe) === 'true' ||
        button.attr('data-aoe-melee') === '1';
      if (isInstantAoeCard) {
        const aoeAttacker = freshAttacker || (game as any).actors?.get(flags.attackerId);
        const idsFromBtn = String(button.attr('data-aoe-secondary-ids') || '')
          .split('|')
          .map((s: string) => s.trim())
          .filter(Boolean);
        const idsFromFlags = String(flags.aoeMeleeSecondaryTokenIds || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        const carrierId = String(flags.targetTokenId || '').trim();
        const aoeTokenIds = [
          ...new Set([
            ...(carrierId ? [carrierId] : []),
            ...(idsFromBtn.length > 0 ? idsFromBtn : idsFromFlags),
          ]),
        ];
        if (aoeAttacker && aoeTokenIds.length > 0) {
          let aoeFlags: Record<string, any> = { ...flags };
          try {
            const msg = (game as any).messages?.get(messageId);
            const msgFlags = msg?.getFlag?.('mastery-system') || msg?.flags?.['mastery-system'];
            if (msgFlags) aoeFlags = { ...flags, ...msgFlags };
          } catch {
            /* keep original flags */
          }
          const aoeAttackTotal = Math.floor(Number(result?.total) || 0);
          const { resolveAoeFromSharedRoll } = await import('../combat/aoe-melee-resolution.js');
          await resolveAoeFromSharedRoll({
            attacker: aoeAttacker as any,
            tokenIds: aoeTokenIds,
            attackTotal: aoeAttackTotal,
            declaredRaiseSlots,
            isSpell: isSpellcasting || (aoeFlags as any).powerIsSpell === true,
            spellBaseTn: (aoeFlags as any).spellBaseTn ?? null,
            flags: {
              ...aoeFlags,
              attackTotal: aoeAttackTotal,
              freeRaiseSlots,
              ignoreWeaponDamage: true,
              instantAoe: true,
              aoeMeleeWeapon: true,
            },
            weaponId: null,
          });
          return;
        }
      }
      
      // Final TN hit only → damage dialog. Miss Final TN → no payload.
      if (raiseOutcome === 'full') {
        // Always get fresh actors to ensure latest items. Reuse the
        // speaker-resolved `freshAttacker` (token actor for unlinked tokens) so
        // the damage dialog sees the right attributes AND equipped items; do
        // NOT re-fetch via game.actors.get() — that loses the token actor.
        const freshAttackerForDialog = freshAttacker;
        
        const { resolveLiveActor } = await import('../system/status-target.js');
        const target = resolveLiveActor(flags.targetId, flags.targetTokenId);
        
        if (target) {
          // Re-read flags from message to get updated power selection
          const currentMessage = (game as any).messages?.get(messageId);
          let updatedFlags = flags;
          if (currentMessage) {
            const messageFlags = currentMessage.getFlag('mastery-system') || currentMessage.flags?.['mastery-system'];
            if (messageFlags) {
              updatedFlags = { ...flags, ...messageFlags };
            } else {
              console.warn('Mastery System | [BEFORE DAMAGE DIALOG] WARNING: No message flags found', {
                messageId,
                hasMessage: !!currentMessage,
                messageFlags: currentMessage?.flags,
                messageFlagsKeys: Object.keys(currentMessage?.flags || {}),
                masterySystemFlags: currentMessage?.flags?.['mastery-system']
              });
            }
          } else {
            console.error('Mastery System | [BEFORE DAMAGE DIALOG] ERROR: Could not find message to re-read flags', {
              messageId,
              allMessageIds: Array.from((game as any).messages?.keys() || []).slice(0, 10),
              totalMessages: (game as any).messages?.size || 0
            });
          }
          
          // Get equipped weapon ID (just the ID, not the full object)
          // IMPORTANT: Use freshAttackerForDialog that was already loaded above
          let items: any[] = [];
          if (freshAttackerForDialog.items) {
            if (Array.isArray(freshAttackerForDialog.items)) {
              items = freshAttackerForDialog.items;
            } else if (freshAttackerForDialog.items instanceof Map) {
              items = Array.from(freshAttackerForDialog.items.values());
            } else if (freshAttackerForDialog.items.size !== undefined && freshAttackerForDialog.items.values) {
              items = Array.from(freshAttackerForDialog.items.values());
            }
          }
          
          // Debug: Log all items to see what we have
          // PRIORITY: Use weaponId from flags if set (this is the weapon used when creating the attack card)
          let weaponId = updatedFlags.weaponId || null;

          if (updatedFlags.npcAttackSource) {
            weaponId = null;
          }
          
          // Verify the weapon from flags exists and is valid
          if (weaponId) {
            let weaponFromFlags = items.find((item: any) => item.id === weaponId);
            
            // If not found in items array, try direct lookup from actor
            if (!weaponFromFlags && freshAttackerForDialog.items) {
              if (freshAttackerForDialog.items.get) {
                weaponFromFlags = freshAttackerForDialog.items.get(weaponId);
              } else if (Array.isArray(freshAttackerForDialog.items)) {
                weaponFromFlags = freshAttackerForDialog.items.find((item: any) => item.id === weaponId);
              }
            }
            
            // If still not found, try game.items
            if (!weaponFromFlags) {
              try {
                const gameItem = (game as any).items?.get(weaponId);
                if (gameItem && gameItem.actor?.id === freshAttackerForDialog.id) {
                  weaponFromFlags = gameItem;
                }
              } catch (e) {
                console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Error looking up weapon from game.items', e);
              }
            }
            
            if (!weaponFromFlags) {
              console.warn('Mastery System | [BEFORE DAMAGE DIALOG] weaponId from flags not found anywhere, falling back to equipped weapon', {
                weaponIdFromFlags: weaponId,
                allItemIds: items.map((i: any) => i.id),
                itemsCount: items.length,
                actorItemsType: typeof freshAttackerForDialog.items,
                actorItemsSize: freshAttackerForDialog.items?.size,
                actorItemsIsMap: freshAttackerForDialog.items instanceof Map
              });
              weaponId = null; // Will fall back to equipped weapon below
            } else {
            }
          }
          
          // Fallback: If no weaponId in flags or weapon not found, use equipped weapon
          if (!weaponId && !updatedFlags.npcAttackSource) {
            const equippedWeapon = items.find((item: any) => 
              item.type === 'weapon' && (item.system as any)?.equipped === true
            );
            weaponId = equippedWeapon ? equippedWeapon.id : null;
          }
          
          // Verify weapon exists via direct lookup (if not already verified above)
          if (weaponId) {
            let weaponItem: any = null;
            if (freshAttackerForDialog.items?.get) {
              weaponItem = freshAttackerForDialog.items.get(weaponId);
            } else if (Array.isArray(freshAttackerForDialog.items)) {
              weaponItem = freshAttackerForDialog.items.find((item: any) => item.id === weaponId);
            }
            
            // If not found in actor items, try game.items
            if (!weaponItem && weaponId) {
              try {
                const gameItem = (game as any).items?.get(weaponId);
                if (gameItem && gameItem.actor?.id === freshAttackerForDialog.id) {
                  weaponItem = gameItem;
                }
              } catch (e) {
                console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Error looking up weapon from game.items', e);
              }
            }
            
            if (weaponItem) {
            } else {
              console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Weapon ID in flags but not found in actor items', {
                weaponId: weaponId,
                itemsCount: items.length,
                allItemIds: items.map((i: any) => i.id),
                actorItemsType: typeof freshAttackerForDialog.items,
                actorItemsIsMap: freshAttackerForDialog.items instanceof Map,
                actorItemsSize: freshAttackerForDialog.items?.size
              });
            }
          }
          
          // Find equipped weapon for logging purposes
          const equippedWeaponForLog = items.find((item: any) => 
            item.type === 'weapon' && (item.system as any)?.equipped === true
          );
          const successfulRaiseSlots =
            raiseOutcome === 'full'
              ? successfulRaiseSlotCount(declaredRaiseSlots, freeRaiseSlots)
              : 0;
          // Effects are allocated on the damage card — do not invent Damage Raises here.
          const baseSnap = updatedFlags.basePowerSnapshot;
          if (baseSnap && declaredRaises.length > 0 && successfulRaiseSlots > 0) {
            // Shared Split/AoE plan already allocated — apply later in damage dialog.
          } else {
            declaredRaises = [];
          }

          updatedFlags = {
            ...updatedFlags,
            raiseOutcome,
            declaredRaises,
            declaredRaiseSlots,
            freeRaiseSlots,
            successfulRaiseSlots,
            stoneBonusRaises: 0,
            raiseOptions: updatedFlags.raiseOptions ?? null,
            normalTn,
            raiseTn,
            // Needed so Reaction: Evade can compare Evade+bonus vs this total.
            attackTotal: Math.floor(Number(result?.total) || 0),
          };
          // Instant AoE cards return earlier (shared-roll path) — this is single-target only.
          const isAreaAttack = false;

          // Phase 1 — direct target reacts immediately after the attack Roll,
          // before the damage dialog / damage roll. (Threatened Ranged
          // reactions were already offered at declaration.)
          const combatForReactions = (game as any).combat ?? null;
          const { runInteractiveReactionWindow } = await import(
            '../combat/reaction-window-chat.js'
          );
          const phase1 = await runInteractiveReactionWindow({
            defender: target as any,
            attacker: freshAttackerForDialog as any,
            combat: combatForReactions,
            rawDamage: 0,
            attackTotal: updatedFlags.attackTotal ?? null,
            evadeTn: normalTn,
            hit: true,
            phase: 'defender',
            suppressCounterattack: suppressNestedCounterattack,
            attackType: updatedFlags.attackType === 'ranged' ? 'ranged' : 'melee',
            isAoE: isAreaAttack,
          });

          // Allies protect before damage (Armor / Evade / Temp HP / Interpose).
          let preDamage = phase1;
          if (
            !phase1.mitigation?.negatedByEvade &&
            !phase1.mitigation?.phasedByReaction &&
            !phase1.mitigation?.escapedByDiveForCover
          ) {
            try {
              preDamage = await runInteractiveReactionWindow({
                defender: target as any,
                attacker: freshAttackerForDialog as any,
                combat: combatForReactions,
                rawDamage: 0,
                attackTotal: updatedFlags.attackTotal ?? null,
                evadeTn: normalTn,
                hit: true,
                phase: 'allies',
                eventId: phase1.eventId,
                spentActorIds: phase1.spentActorIds,
                used: phase1.used,
                priorMitigation: phase1.mitigation,
                silentIfEmpty: true,
                suppressCounterattack: suppressNestedCounterattack,
                attackType: updatedFlags.attackType === 'ranged' ? 'ranged' : 'melee',
                isAoE: isAreaAttack,
              });
            } catch (allyPreErr) {
              console.warn('Mastery System | pre-damage ally reaction window failed', allyPreErr);
            }
          }

          const primaryNegated =
            !!preDamage.mitigation?.negatedByEvade || !!preDamage.mitigation?.phasedByReaction;
          const primaryEscaped = !!preDamage.mitigation?.escapedByDiveForCover;
          let damageResult: any = null;

          if (primaryNegated) {
            try {
              const defName = String((target as any).name ?? 'Defender');
              const atkName = String((freshAttackerForDialog as any).name ?? 'Attacker');
              const mit = preDamage.mitigation;
              const ev = mit.reactionEvadeBonus ?? 0;
              const eff = mit.effectiveEvade;
              const how = mit.phasedByReaction ? 'Ghost Slip / Phasing' : 'Evade';
              await (globalThis as any).ChatMessage?.create?.({
                user: (game as any).user?.id,
                speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: target }),
                content: `<p class="mastery-reaction-msg"><strong>${atkName}</strong> → <strong>${defName}</strong>: hit <strong>negated</strong> by ${how}${
                  !mit.phasedByReaction && ev > 0 && eff != null ? ` (+${ev} → Evade ${eff})` : ''
                }. No damage.</p>`,
              });
              const iniGain = Math.max(0, Math.floor(Number(mit.initiativeGain) || 0));
              if (iniGain > 0 && combatForReactions) {
                const { applyMidCombatInitiativeGain } = await import(
                  '../combat/initiative-gain.js'
                );
                await applyMidCombatInitiativeGain(combatForReactions, target as any, iniGain);
              }
            } catch (negErr) {
              console.warn('Mastery System | evade-negated follow-up failed', negErr);
            }
          } else if (!primaryEscaped) {
            const { showDamageDialog } = await import('../dice/damage-dialog.js');
            damageResult = await showDamageDialog(
              freshAttackerForDialog,
              target,
              weaponId,
              updatedFlags.selectedPowerId || null,
              0,
              updatedFlags
            );

            if (damageResult) {
              // Post damage rolls first (HP not applied yet when pendingApply).
              const dmgMsg = await rollAndDisplayDamage(
                damageResult,
                attacker as any,
                target,
                updatedFlags,
              );

              if (damageResult.pendingApply) {
                const combat = combatForReactions;
                const attackCtx = damageResult.attackContext ?? {
                  attackTotal: updatedFlags.attackTotal ?? null,
                  evadeTn:
                    updatedFlags.normalTn ??
                    updatedFlags.baseEvade ??
                    updatedFlags.targetEvade ??
                    null,
                };

                // Phasing was already resolved BEFORE the damage roll inside
                // `calculateDamageResult` (rulebook sequence step 7) — a
                // phased strike never reaches this deferred-apply branch.
                {
                  const { applyDamageToTarget, resolveForcedMovementAfterDamage } = await import(
                    '../dice/damage-dialog.js'
                  );
                  const { damageTransferApplies } = await import('../combat/damage-transfer.js');
                  damageResult.mitigation = await applyDamageToTarget(
                    target as any,
                    damageResult.totalDamage,
                    freshAttackerForDialog as any,
                    damageResult.count8s ?? 0,
                    {
                      attackTotal: attackCtx.attackTotal ?? null,
                      evadeTn: attackCtx.evadeTn ?? null,
                      armorPenetration: Math.max(
                        0,
                        Math.floor(Number((attackCtx as any).armorPenetration) || 0),
                      ),
                      reactionMitigation: preDamage.mitigation,
                      skipPhasing: true,
                      skipReactionPrompt: true,
                      attackSucceeded: true,
                      damageTransfer: damageTransferApplies({
                        damageTransfer: updatedFlags.damageTransfer === true,
                        hit: true,
                      }),
                      damageInstanceId: `${messageId}:damage-transfer`,
                    },
                  );
                  if (!damageResult.mitigation?.phased) {
                    await resolveForcedMovementAfterDamage(
                      freshAttackerForDialog as any,
                      target as any,
                      damageResult.specialsUsed,
                    );
                  }
                }

                damageResult.pendingApply = false;
                if (dmgMsg?.id) {
                  await updateDamageChatWithMitigation(String(dmgMsg.id), damageResult, target);
                }
              }
            } else {
              console.warn('Mastery System | [AFTER DAMAGE DIALOG] No damage result returned from showDamageDialog');
            }
          }

          // Threatened Ranged reactions were already offered at DECLARATION
          // (PG 9725) — no post-resolution opportunity window.

          // Instant AoE never reaches this single-target path: it returns earlier via
          // resolveAoeFromSharedRoll (no Primary Target, no secondary special-casing).
        }
      } else {
        // Miss — target reacts first; Threatened Ranged OA + allies after.
        try {
          let missTarget: any = null;
          if (flags.targetTokenId) {
            const tokenDoc = canvas?.scene?.tokens?.get(flags.targetTokenId);
            if (tokenDoc?.actor) missTarget = tokenDoc.actor;
          }
          if (!missTarget && flags.targetId) {
            missTarget = (game as any).actors?.get(flags.targetId) || null;
          }
          const missAttacker = freshAttacker || (game as any).actors?.get(flags.attackerId);
          if (missTarget && missAttacker) {
            const { runInteractiveReactionWindow } = await import(
              '../combat/reaction-window-chat.js'
            );
            // Threatened Ranged reactions were already offered at DECLARATION
            // (PG 9725) — on a miss only the target's own window remains.
            await runInteractiveReactionWindow({
              defender: missTarget,
              attacker: missAttacker,
              combat: (game as any).combat ?? null,
              rawDamage: 0,
              attackTotal: Math.floor(Number(result?.total) || 0),
              evadeTn: normalTn,
              hit: false,
              phase: 'defender',
              suppressCounterattack: suppressNestedCounterattack,
            });
            if (!isSpellcasting) {
              const { maybeOfferSlip } = await import('../stones/agility-movement-ui.js');
              await maybeOfferSlip({
                defender: missTarget,
                attacker: missAttacker,
                hit: false,
                isAttack: true,
              });
            }
          }
        } catch (missReactErr) {
          console.warn('Mastery System | miss reaction window failed', missReactErr);
        }
      }

      if (flags.consumableItemId && spentActionOnRoll) {
        try {
          const { consumeEquippedConsumableAfterSuccess } = await import(
            '../utils/consumable-slots.js'
          );
          const owner = actorToRefund ?? freshAttacker;
          const item = owner?.items?.get?.(flags.consumableItemId);
          if (item) await consumeEquippedConsumableAfterSuccess(owner, item);
        } catch (consumeErr) {
          console.warn('Mastery System | consumable consume after attack roll failed', consumeErr);
        }
      }

      // Split Attack: Strike 2 only after Strike 1 fully finishes (hit or miss).
      if (flags.splitAttack === true && Math.floor(Number(flags.splitIndex) || 0) === 1) {
        try {
          const { rememberSplitSharedRaises, spawnSplitStrike2IfPending } = await import('../combat/attack-executor.js');
          const { peekSharedRaiseAllocation } = await import('../dice/damage-dialog.js');
          const sharedPlan =
            peekSharedRaiseAllocation(`split:${flags.splitPairId}`) ||
            parseDeclaredRaises(button.attr('data-raise-plan') || '[]');
          rememberSplitSharedRaises(String(flags.splitPairId || ''), {
            plan: JSON.stringify(sharedPlan),
            slots: String(declaredRaiseSlots),
            free: String(freeRaiseSlots),
            tn: button.attr('data-raise-tn'),
          });
          await spawnSplitStrike2IfPending(flags.splitPairId);
        } catch (split2Err) {
          console.warn('Mastery System | Split Strike 2 spawn failed', split2Err);
        }
      }
      
    } catch (error) {
      if (spentAmmoOnRoll && actorForAmmo) {
        try {
          const { refundAmmunitionForAttack } = await import('../utils/ammunition.js');
          await refundAmmunitionForAttack(actorForAmmo, 1);
        } catch {
          /* ignore */
        }
      }
      if (spentActionOnRoll && actorToRefund) {
        try {
          const {
            refundAttackAction,
            unmarkPowerUsedThisRound,
            unmarkNpcAttackUsedThisRound,
          } = await import('../combat/action-economy.js');
          await refundAttackAction(actorToRefund, (game as any).combat);
          if (markedPowerIdForRoll) {
            await unmarkPowerUsedThisRound(actorToRefund, (game as any).combat, markedPowerIdForRoll);
          }
          if (markedNpcAttackIdForRoll) {
            await unmarkNpcAttackUsedThisRound(
              actorToRefund,
              (game as any).combat,
              markedNpcAttackIdForRoll,
            );
          }
        } catch (refundErr) {
          console.warn('Mastery System | Could not refund attack action after failed roll', refundErr);
        }
      }
      console.error('Mastery System | DEBUG: Error during roll', error);
      console.error('Mastery System | Error rolling attack:', error);
      ui.notifications?.error('Failed to roll attack');
      resetRollButton();
    } finally {
      // Unblock a Reaction Counterattack / OA that paused another attack.
      if (awaitsResolution) {
        try {
          const { completeAttackResolution } = await import(
            '../combat/attack-resolution-wait.js'
          );
          completeAttackResolution(String(messageId), { status: 'resolved' });
        } catch (completeErr) {
          console.warn('Mastery System | completeAttackResolution failed', completeErr);
        }
      }
    }
  }
}

function buildMitigationHtml(damageResult: any): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const mit = damageResult.mitigation as {
    rawDamage: number;
    armorApplied: number;
    reactionArmorApplied?: number;
    drPercent: number;
    mitigatedDamage: number;
    tempHPAbsorbed: number;
    barDamage: number;
    min8sUsed: boolean;
    breakdownLine: string;
    phased: boolean;
    negatedByEvade?: boolean;
  } | undefined;

  if (damageResult.pendingApply && !mit) {
    return `
        <div class="mastery-damage-mitigation mastery-damage-pending">
          <div class="mastery-damage-mitigation-title"><i class="fas fa-hourglass-half"></i> Awaiting Reactions…</div>
          <div class="mastery-damage-mitigation-breakdown">Roh ${Math.max(0, Math.floor(Number(damageResult.totalDamage) || 0))} — HP not applied yet</div>
        </div>`;
  }
  if (!mit) return '';

  if (mit.phased) {
    return `
        <div class="mastery-damage-mitigation mastery-damage-phased">
          <div class="mastery-damage-mitigation-title"><i class="fas fa-ghost"></i> Phased — Angriff ignoriert</div>
          <div class="mastery-damage-mitigation-breakdown">${esc(mit.breakdownLine)}</div>
        </div>`;
  }
  if (mit.negatedByEvade) {
    return `
        <div class="mastery-damage-mitigation mastery-damage-phased">
          <div class="mastery-damage-mitigation-title"><i class="fas fa-person-running"></i> Reaction Evade — Treffer negiert</div>
          <div class="mastery-damage-mitigation-breakdown">${esc(mit.breakdownLine)}</div>
        </div>`;
  }

  const guardArmor = Math.max(0, Math.floor(Number(mit.reactionArmorApplied) || 0));
  const sheetArmor = Math.max(0, Math.floor(Number(mit.armorApplied) || 0) - guardArmor);
  const armorLine =
    sheetArmor > 0
      ? `<span class="mitigation-chip mitigation-chip-armor"><i class="fas fa-shield-alt"></i> Rüstung: ${sheetArmor} aufgefangen</span>`
      : '';
  const guardLine =
    guardArmor > 0
      ? `<span class="mitigation-chip mitigation-chip-guard"><i class="fas fa-shield"></i> Guard: ${guardArmor} aufgefangen</span>`
      : '';
  const drLine =
    mit.drPercent > 0
      ? `<span class="mitigation-chip mitigation-chip-dr"><i class="fas fa-user-shield"></i> DR: ${mit.drPercent}% reduziert</span>`
      : '';
  const tempLine =
    mit.tempHPAbsorbed > 0
      ? `<span class="mitigation-chip mitigation-chip-temp"><i class="fas fa-heart"></i> Temp-HP: ${mit.tempHPAbsorbed} absorbiert</span>`
      : '';
  const min8sLine = mit.min8sUsed
    ? `<span class="mitigation-chip mitigation-chip-8s"><i class="fas fa-dice"></i> 8er-Minimum</span>`
    : '';
  return `
        <div class="mastery-damage-mitigation">
          <div class="mastery-damage-mitigation-title">
            <i class="fas fa-shield-halved"></i> Schadensreduktion
          </div>
          <div class="mastery-damage-mitigation-chips">
            <span class="mitigation-chip mitigation-chip-raw"><i class="fas fa-burst"></i> Roh: ${mit.rawDamage}</span>
            ${armorLine}
            ${guardLine}
            ${drLine}
            ${tempLine}
            ${min8sLine}
            <span class="mitigation-chip mitigation-chip-final"><i class="fas fa-heart-crack"></i> HP verloren: <strong>${mit.barDamage}</strong></span>
          </div>
          <div class="mastery-damage-mitigation-breakdown">${esc(mit.breakdownLine)}</div>
        </div>`;
}

function buildDamageChatContent(damageResult: any, target: Actor, flags?: any): string {
  const damageBreakdown: string[] = [];
  if (damageResult.baseDamage > 0) damageBreakdown.push(`Waffe: ${damageResult.baseDamage}`);
  if (damageResult.spellFocusDamage > 0) {
    damageBreakdown.push(`Spell Focus: ${damageResult.spellFocusDamage}`);
  }
  if (damageResult.powerDamage > 0) damageBreakdown.push(`Power: ${damageResult.powerDamage}`);
  if (damageResult.passiveDamage > 0) damageBreakdown.push(`Passive: ${damageResult.passiveDamage}`);
  if (damageResult.activeBuffDamage > 0) {
    damageBreakdown.push(`Active Buff: ${damageResult.activeBuffDamage}`);
  }
  if (damageResult.raiseDamage > 0) damageBreakdown.push(`Raises: ${damageResult.raiseDamage}`);
  const damageText =
    damageBreakdown.length > 0 ? damageBreakdown.join(', ') : `${damageResult.totalDamage} damage`;

  const specialsLabel = String(
    damageResult.specialsLabel ||
      (Array.isArray(damageResult.specialsUsed)
        ? damageResult.specialsUsed.filter((s: string) => /\(\d+\)/.test(String(s))).join(', ')
        : '') ||
      '',
  ).trim();

  const details = Array.isArray(damageResult.rollDetails)
    ? (damageResult.rollDetails as string[])
    : [];
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rollsHtml =
    details.length > 0
      ? `<div class="mastery-damage-rolls"><strong>Rolled</strong><ul class="mastery-damage-roll-list">${details
          .map((line) => `<li>${esc(line)}</li>`)
          .join('')}</ul></div>`
      : '';

  const specialsHtml = specialsLabel
    ? `<p class="mastery-damage-specials"><strong>Special:</strong> ${esc(specialsLabel)}</p>`
    : '';

  const limitNotes = Array.isArray(damageResult.applicationLimitNotes)
    ? (damageResult.applicationLimitNotes as string[])
    : [];
  const limitHtml = limitNotes.length
    ? `<p class="mastery-damage-special-limit">${limitNotes.map((n) => esc(n)).join('<br>')}</p>`
    : '';

  const splitIdx = Math.max(1, Math.floor(Number(flags?.splitIndex) || 1));
  const splitPower = String(flags?.selectedPowerName || '').trim();
  const attackKind = flags?.attackType === 'ranged' ? 'Ranged' : 'Melee';
  const splitBanner =
    flags?.splitAttack === true
      ? `${splitPower || `${attackKind} Split Attack`} — Strike ${splitIdx} of 2`
      : '';
  const splitHtml = splitBanner
    ? `<div class="damage-split-banner"><strong>${esc(splitBanner)}</strong></div>`
    : '';

  return `<div class="mastery-system-damage">
      ${splitHtml}
      <h3><i class="fas fa-sword"></i> Damage: ${damageResult.totalDamage}${
        splitBanner ? ` <span class="damage-split-sub">(${esc(splitBanner)})</span>` : ''
      }</h3>
      ${rollsHtml}
      <p class="mastery-damage-summary">${damageText}</p>
      ${specialsHtml}
      <p><strong>Target:</strong> ${(target as any).name}</p>
      ${limitHtml}
      ${buildMitigationHtml(damageResult)}
    </div>`;
}

/**
 * Roll and display damage in chat. Returns the created message (for later mitigation updates).
 */
async function rollAndDisplayDamage(
  damageResult: any,
  attacker: Actor,
  target: Actor,
  _flags?: any,
): Promise<ChatMessage | null> {
  const attackerToken = (attacker as any).getActiveTokens?.()?.[0]?.document || null;
  const chatRolls = Array.isArray(damageResult.damageChatRolls) ? damageResult.damageChatRolls : [];
  const serializedRolls =
    chatRolls.length > 0
      ? chatRolls
          .map((r: any) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
          .filter(Boolean)
      : [];

  const content = buildDamageChatContent(damageResult, target, _flags);

  // Faith Keep already posted this card — refresh rolls/details, do not duplicate.
  const prePostedId = String(damageResult?.prePostedChatMessageId || '');
  if (prePostedId) {
    try {
      const existing = (game as any).messages?.get?.(prePostedId);
      if (existing) {
        const patch: Record<string, unknown> = { content };
        if (serializedRolls.length > 0) {
          patch.rolls = serializedRolls;
          patch.sound = CONFIG.sounds.dice;
        }
        await existing.update(patch);
        return existing as ChatMessage;
      }
    } catch (err) {
      console.warn('Mastery System | Could not update pre-posted damage chat — creating new', err);
    }
  }

  const chatData: any = {
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor: attacker, token: attackerToken }),
    content,
    flags: {
      'mastery-system': {
        splitAttack: !!_flags?.splitAttack,
        splitIndex: _flags?.splitIndex ?? null,
        splitPairId: _flags?.splitPairId ?? null,
        selectedPowerName: _flags?.selectedPowerName ?? '',
        attackType: _flags?.attackType ?? null,
      },
    },
  };

  if (serializedRolls.length > 0) {
    chatData.rolls = serializedRolls;
    chatData.sound = CONFIG.sounds.dice;
  } else {
    chatData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
  }

  try {
    return (await ChatMessage.create(chatData)) as ChatMessage;
  } catch (error) {
    console.warn('Mastery System | Could not create damage chat message:', error);
    return null;
  }
}

/** Patch an existing damage chat message after reactions + HP apply. */
async function updateDamageChatWithMitigation(
  messageId: string,
  damageResult: any,
  target: Actor,
): Promise<void> {
  try {
    const message = (game as any).messages?.get?.(messageId);
    if (!message) return;
    const msFlags = message.getFlag?.('mastery-system') || message.flags?.['mastery-system'] || {};
    await message.update({ content: buildDamageChatContent(damageResult, target, msFlags) });
  } catch (err) {
    console.warn('Mastery System | Could not update damage chat with mitigation', err);
  }
}

