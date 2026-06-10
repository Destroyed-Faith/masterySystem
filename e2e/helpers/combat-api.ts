import type { Page } from '@playwright/test';

export interface TokenPair {
  attackerTokenId: string;
  targetTokenId: string;
  attackerActorId: string;
  targetActorId: string;
  attackerName: string;
  targetName: string;
}

export interface CombatSetupResult {
  combatId: string;
  started: boolean;
  combatantCount: number;
  tokens: TokenPair;
}

/** Returns the first two actor tokens on the active scene. */
export async function getTokenPair(page: Page): Promise<TokenPair> {
  return page.evaluate(() => {
    const tokens = ((window as any).canvas?.tokens?.placeables ?? []).filter((t: any) => t?.actor);
    if (tokens.length < 2) {
      throw new Error(`Need at least 2 tokens on the scene, found ${tokens.length}.`);
    }

    const attacker = tokens[0];
    const target = tokens[1];
    return {
      attackerTokenId: attacker.id,
      targetTokenId: target.id,
      attackerActorId: attacker.actor.id,
      targetActorId: target.actor.id,
      attackerName: attacker.name ?? attacker.actor.name ?? 'Attacker',
      targetName: target.name ?? target.actor.name ?? 'Target',
    };
  });
}

/**
 * Creates a simple Foundry combat with two token combatants.
 * Skips Mastery "Begin Encounter" dialogs (passives / initiative shop).
 */
export async function ensureBasicCombat(page: Page): Promise<CombatSetupResult> {
  return page.evaluate(async () => {
    const g = (window as any).game;
    const c = (window as any).canvas;
    const CombatDoc = (window as any).Combat;

    const tokens = (c?.tokens?.placeables ?? []).filter((t: any) => t?.actor);
    if (tokens.length < 2) {
      throw new Error(`Need at least 2 tokens on the scene, found ${tokens.length}.`);
    }

    const attacker = tokens[0];
    const target = tokens[1];

    let combat = g.combat;
    if (!combat) {
      combat = await CombatDoc.create({ active: true }, { render: false });
    }

    const existing = new Set(combat.combatants.map((x: any) => x.tokenId));
    for (const token of [attacker, target]) {
      if (!existing.has(token.id)) {
        await combat.createCombatant(token.document);
      }
    }

    if (!combat.started) {
      await combat.rollInitiative([attacker.id, target.id]);
      await combat.startCombat();
    }

    return {
      combatId: combat.id,
      started: combat.started,
      combatantCount: combat.combatants.size,
      tokens: {
        attackerTokenId: attacker.id,
        targetTokenId: target.id,
        attackerActorId: attacker.actor.id,
        targetActorId: target.actor.id,
        attackerName: attacker.name ?? attacker.actor.name ?? 'Attacker',
        targetName: target.name ?? target.actor.name ?? 'Target',
      },
    };
  });
}

export async function readActorHealthyHp(page: Page, actorId: string): Promise<number> {
  return page.evaluate((id) => {
    const actor = (window as any).game?.actors?.get(id);
    const bars = actor?.system?.health?.bars;
    if (!bars) return -1;
    const healthy = bars.healthy ?? bars[0];
    return Number(healthy?.value ?? healthy?.current ?? -1);
  }, actorId);
}

/** Applies raw damage to the healthy bar (overflow is handled by the actor sheet model). */
export async function applyRawDamageToHealthyBar(
  page: Page,
  actorId: string,
  amount: number,
): Promise<number> {
  return page.evaluate(
    async ({ id, dmg }) => {
      const actor = (window as any).game?.actors?.get(id);
      if (!actor) throw new Error(`Actor not found: ${id}`);

      const bars = actor.system?.health?.bars;
      const healthyKey =
        bars?.healthy != null ? 'healthy' : Array.isArray(bars) ? '0' : Object.keys(bars ?? {})[0];
      if (!healthyKey) throw new Error('No health bars on actor');

      const path =
        healthyKey === 'healthy'
          ? 'system.health.bars.healthy.value'
          : `system.health.bars.${healthyKey}.value`;

      const before = (window as any).foundry.utils.getProperty(
        actor.system,
        path.replace('system.', ''),
      );
      const next = Math.max(0, Number(before) - dmg);
      await actor.update({ [path]: next });
      return next;
    },
    { id: actorId, dmg: amount },
  );
}

export interface AttackCardSeed {
  messageId: string;
}

/**
 * Posts a minimal melee attack card that the Mastery roll handler understands.
 * Uses low target evade so a mocked hit is likely when rolling manually in UI tests.
 */
export async function seedMeleeAttackCard(
  page: Page,
  tokens: TokenPair,
): Promise<AttackCardSeed> {
  return page.evaluate(async (pair) => {
    const g = (window as any).game;
    const ChatMessage = (window as any).ChatMessage;
    const CONST = (window as any).CONST;

    const attacker = g.actors.get(pair.attackerActorId);
    const target = g.actors.get(pair.targetActorId);
    if (!attacker || !target) throw new Error('Attacker or target actor missing');

    const attributeValue = Number(attacker.system?.attributes?.might?.value ?? 4);
    const masteryRank = Number(attacker.system?.masteryRank?.value ?? attacker.system?.masteryRank ?? 2);
    const targetEvade = 4;
    const weapon = attacker.items?.find?.((i: any) => i.type === 'weapon' && i.system?.equipped);

    const flags = {
      attackType: 'melee',
      costsAction: true,
      attackerId: attacker.id,
      targetId: target.id,
      targetTokenId: pair.targetTokenId,
      attribute: 'might',
      attributeValue,
      masteryRank,
      targetEvade,
      baseEvade: targetEvade,
      weaponId: weapon?.id ?? null,
      selectedPowerId: null,
      selectedPowerLevel: 1,
      selectedPowerSpecials: [],
      selectedPowerDamage: weapon?.system?.damage ?? '1d8',
      threatenedRanged: false,
      rollDisadvantage: false,
    };

    const content = `
      <div class="mastery-attack-card">
        <p><strong>E2E Test Attack</strong> — ${attacker.name} → ${target.name}</p>
        <button type="button" class="roll-attack-btn"
          data-attacker-id="${attacker.id}"
          data-target-id="${target.id}"
          data-attribute="might"
          data-attribute-value="${attributeValue}"
          data-mastery-rank="${masteryRank}"
          data-target-evade="${targetEvade}"
          data-base-evade="${targetEvade}"
          data-raises="0"
          data-auto-raises="0">
          <i class="fas fa-dice"></i> Roll Attack
        </button>
      </div>
    `;

    const message = await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      content,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      flags: { 'mastery-system': flags },
    });

    return { messageId: message.id as string };
  }, tokens);
}
