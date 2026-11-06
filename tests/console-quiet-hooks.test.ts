import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('console quiet / Foundry v13 hooks', () => {
  it('registers only renderChatMessageHTML for skill raise allocation', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/chat/skill-raise-allocation.ts'),
      'utf8',
    );
    expect(src).toMatch(/Hooks\.on\(\s*['"]renderChatMessageHTML['"]/);
    expect(src).not.toMatch(/Hooks\.on\(\s*['"]renderChatMessage['"]\s*,/);
  });

  it('keeps carousel rename debug off by default', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/ui/combat-carousel-rename.ts'),
      'utf8',
    );
    expect(src).toMatch(/CAROUSEL_RENAME_DEBUG\s*=\s*false/);
  });

  it('keeps NPC targeting debug off by default', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/utils/npc-targeting-debug.ts'),
      'utf8',
    );
    expect(src).toMatch(/NPC_TARGETING_DEBUG\s*=\s*false/);
  });
});
