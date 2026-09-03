/**
 * Regression guards for Combat Senses UI on the character sheet.
 *
 * Combat Senses must never participate in the ActorSheet `<form>` on initial
 * paint — the config block is mounted after activateListeners via a partial template.
 */

import { readFileSync } from 'node:fs';
import Handlebars from 'handlebars';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildCombatSensesPanelContext } from '../src/combat/combat-sense-collection.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function expectTemplateCompiles(relativePath: string, context: Record<string, unknown>): void {
  const source = readRepoFile(relativePath);
  expect(() => Handlebars.compile(source)(context)).not.toThrow();
}

describe('character sheet combat senses regression', () => {
  const template = readRepoFile('templates/actor/character-sheet.hbs');
  const partial = readRepoFile('templates/actor/partials/combat-senses-config.hbs');
  const printTemplate = readRepoFile('templates/actor/character-print.hbs');
  const sheetSource = readRepoFile('src/sheets/character-sheet.ts');
  const combatSensesPanel = buildCombatSensesPanelContext({
    system: { combatSenses: {} },
    items: [],
    getFlag: () => undefined,
  });

  it('compiles combat-senses config partial without mismatched Handlebars block tags', () => {
    expectTemplateCompiles('templates/actor/partials/combat-senses-config.hbs', {
      editable: true,
      combatSensesPanel,
    });
    expect(partial).not.toMatch(/\{\{#unless[^}]+\}\}[^{]*\{\{\/if\}\}/);
  });

  it('print table battle sheet omits combat senses (config stays on interactive sheet)', () => {
    // Table Character Sheet page 3 is Powers & Combat only — no Sense Slot print block.
    expect(printTemplate).not.toMatch(/combatSensesDisplay/);
    expect(printTemplate).not.toMatch(/pick exactly one/i);
    expect(printTemplate).not.toMatch(/cp-battle-senses-grid/);
    expect(printTemplate).toMatch(/cp-battle-bottom/);
    expect(printTemplate).toMatch(/Powers &amp; Combat/);
  });

  it('defers combat senses config to a post-mount partial (not in the main form template)', () => {
    expect(template).toMatch(/data-battle-senses-mount/);
    expect(template).not.toMatch(/class="battle-senses-area"/);
    expect(template).not.toMatch(/name="system\.combatSenses\./);
  });

  it('does not bind any combatSenses fields in the partial template', () => {
    expect(partial).not.toMatch(/name="system\.combatSenses\./);
    expect(partial).not.toMatch(/js-battle-sense-slot/);
    expect(partial).not.toMatch(/Pick one Sense Slot/i);
  });

  it('mounts combat senses config after activateListeners with explicit handlers', () => {
    expect(sheetSource).toMatch(/#mountBattleSensesArea/);
    expect(sheetSource).toMatch(/#bindBattleSensesHandlers/);
    expect(sheetSource).toMatch(/#onCombatSenseGrantToggle/);
    expect(sheetSource).toMatch(/#onCombatSenseDarkvisionToggle/);
    expect(sheetSource).toMatch(/combat-senses-config\.hbs/);
    expect(sheetSource).not.toMatch(/#onBattleSenseSlotSelect/);
  });

  it('blocks document re-renders during initial sheet mount', () => {
    expect(sheetSource).toMatch(/if \(!this\.rendered \|\| this\.#isRendering\) return;/);
    expect(sheetSource).toMatch(/#isRendering/);
  });
});
