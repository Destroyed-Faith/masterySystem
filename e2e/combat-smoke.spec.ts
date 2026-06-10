import { test, expect } from './fixtures/foundry.js';
import {
  applyRawDamageToHealthyBar,
  ensureBasicCombat,
  getTokenPair,
  readActorHealthyHp,
  seedMeleeAttackCard,
} from './helpers/combat-api.js';

test.describe('Mastery System — combat smoke', () => {
  test('can start combat with two scene tokens', async ({ foundryPage }) => {
    const result = await ensureBasicCombat(foundryPage);

    expect(result.started).toBe(true);
    expect(result.combatantCount).toBeGreaterThanOrEqual(2);
    expect(result.tokens.attackerName).toBeTruthy();
    expect(result.tokens.targetName).toBeTruthy();
  });

  test('combat tracker exposes Mastery end-turn control', async ({ foundryPage }) => {
    await ensureBasicCombat(foundryPage);

    const endTurn = foundryPage.locator('.ms-end-turn-btn').first();
    await expect(endTurn).toBeVisible({ timeout: 15_000 });
  });

  test('health bars accept damage updates on target actor', async ({ foundryPage }) => {
    const tokens = await getTokenPair(foundryPage);
    const before = await readActorHealthyHp(foundryPage, tokens.targetActorId);
    expect(before).toBeGreaterThan(0);

    const after = await applyRawDamageToHealthyBar(foundryPage, tokens.targetActorId, 3);
    expect(after).toBe(before - 3);
  });

  test('attack card appears in chat with roll button', async ({ foundryPage }) => {
    const tokens = await getTokenPair(foundryPage);
    const { messageId } = await seedMeleeAttackCard(foundryPage, tokens);

    const card = foundryPage.locator(`#chat-log .message[data-message-id="${messageId}"]`);
    await expect(card).toBeVisible({ timeout: 10_000 });

    const rollBtn = card.locator('.roll-attack-btn');
    await expect(rollBtn).toBeVisible();
    await expect(rollBtn).toContainText(/roll attack/i);
  });

  test('mocked attack roll opens damage dialog on hit', async ({ foundryPage }) => {
    const tokens = await getTokenPair(foundryPage);
    const { messageId } = await seedMeleeAttackCard(foundryPage, tokens);

    await foundryPage.evaluate(() => {
      const RollImpl = (window as any).Roll;
      if (!RollImpl) return;

      class MockRoll extends RollImpl {
        constructor(formula: string, data?: object, options?: object) {
          super(formula, data, options);
        }

        async evaluate(options?: object) {
          const result = await super.evaluate({ ...options, maximize: true } as object);
          Object.defineProperty(this, 'total', { value: 99, configurable: true });
          return result;
        }
      }

      (window as any).Roll = MockRoll;
    });

    const rollBtn = foundryPage.locator(
      `#chat-log .message[data-message-id="${messageId}"] .roll-attack-btn`,
    );
    await rollBtn.click();

    const damageDialog = foundryPage.locator(
      '.application.mastery-system .damage-dialog, .window-app.mastery-system .damage-dialog',
    );
    await expect(damageDialog.first()).toBeVisible({ timeout: 20_000 });
  });
});
