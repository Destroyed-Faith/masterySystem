import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const damageSrc = readFileSync(resolve('src/dice/damage-dialog.ts'), 'utf8');
const chatCss = readFileSync(resolve('styles/chat.css'), 'utf8');
const attackSrc = readFileSync(resolve('src/chat/attack-roll-handler.ts'), 'utf8');

describe('Mark spend on the damage chat card', () => {
  it('gates spend on mastery-system-damage (no extra Dialog)', () => {
    expect(damageSrc).toContain("type: 'damageMarkSpendPrompt'");
    expect(damageSrc).toContain('buildDamageMarkGateHtml');
    expect(damageSrc).toContain('mastery-damage-mark-gate');
    expect(damageSrc).toContain('ms-damage-mark-spend-btn');
    expect(damageSrc).toContain('ms-damage-mark-skip-btn');
    expect(damageSrc).toContain('listUsefulMarkSpends');
    expect(damageSrc).toContain('prePostedChatMessageId');
    expect(damageSrc).toMatch(/async function promptMarkSpend[\s\S]*?ChatMessage\.create/);
    expect(damageSrc).not.toMatch(
      /async function promptMarkSpend[\s\S]*?new Dialog\([\s\S]*?Mark\(/,
    );
    expect(damageSrc).not.toContain('ms-mark-spend-post');
  });

  it('reuses the Faith Keep / Mark card instead of posting a second damage message', () => {
    expect(attackSrc).toContain('prePostedChatMessageId');
    expect(damageSrc).toContain('could not reuse damage card');
  });

  it('styles the Mark spend buttons on the damage card', () => {
    expect(chatCss).toContain('.mastery-damage-mark-gate');
    expect(chatCss).toContain('.ms-damage-mark-spend-btn');
    expect(chatCss).toContain('.ms-damage-mark-skip-btn');
  });
});
