import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const damageSrc = readFileSync(resolve('src/dice/damage-dialog.ts'), 'utf8');
const chatCss = readFileSync(resolve('styles/chat.css'), 'utf8');

describe('Faith Fracture damage reroll uses chat, not a Dialog popup', () => {
  it('posts a damageFaithRerollPrompt chat card instead of Dialog', () => {
    expect(damageSrc).toContain("type: 'damageFaithRerollPrompt'");
    expect(damageSrc).toContain('buildDamageFaithPromptHtml');
    expect(damageSrc).toContain('ChatMessage.create');
    expect(damageSrc).toMatch(/async function promptDamageFaithReroll[\s\S]*?ChatMessage\.create/);
    expect(damageSrc).not.toMatch(
      /async function promptDamageFaithReroll[\s\S]*?new Dialog\([\s\S]*?Damage rolled — keep or reroll/,
    );
  });

  it('styles the Keep / Reroll chat buttons', () => {
    expect(chatCss).toContain('.mastery-damage-faith-reroll');
    expect(chatCss).toContain('.ms-damage-faith-keep-btn');
    expect(chatCss).toContain('.ms-damage-faith-reroll-btn');
  });
});
