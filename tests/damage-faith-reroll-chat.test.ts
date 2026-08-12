import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const damageSrc = readFileSync(resolve('src/dice/damage-dialog.ts'), 'utf8');
const chatCss = readFileSync(resolve('styles/chat.css'), 'utf8');
const attackSrc = readFileSync(resolve('src/chat/attack-roll-handler.ts'), 'utf8');

describe('Faith Fracture damage reroll on the damage chat card', () => {
  it('gates Keep/Reroll on mastery-system-damage (no separate kept card)', () => {
    expect(damageSrc).toContain("type: 'damageFaithRerollPrompt'");
    expect(damageSrc).toContain('buildDamageFaithGateHtml');
    expect(damageSrc).toContain('mastery-damage-faith-gate');
    expect(damageSrc).toContain('prePostedChatMessageId');
    expect(damageSrc).not.toMatch(/<h3>[^<]*Damage rolled — kept/);
    expect(damageSrc).toMatch(/async function promptDamageFaithReroll[\s\S]*?ChatMessage\.create/);
    expect(damageSrc).not.toMatch(
      /async function promptDamageFaithReroll[\s\S]*?new Dialog\([\s\S]*?Damage rolled — keep or reroll/,
    );
  });

  it('reuses the Keep card instead of posting a second damage message', () => {
    expect(attackSrc).toContain('prePostedChatMessageId');
    expect(attackSrc).toContain('Could not update pre-posted damage chat');
  });

  it('styles the Keep / Reroll buttons on the damage card', () => {
    expect(chatCss).toContain('.mastery-damage-faith-gate');
    expect(chatCss).toContain('.ms-damage-faith-keep-btn');
    expect(chatCss).toContain('.ms-damage-faith-reroll-btn');
  });
});
