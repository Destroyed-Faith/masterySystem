/**
 * Regression guards for Combat Senses UI on the character sheet.
 *
 * Combat Senses must never participate in the ActorSheet `<form>` on initial
 * paint — the block is mounted after activateListeners via a partial template.
 */

import { readFileSync } from 'node:fs';
import Handlebars from 'handlebars';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildCombatSensesBattleAreaContext } from '../src/combat/combat-sense-collection.js';

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
  const partial = readRepoFile('templates/actor/partials/battle-senses-area.hbs');
  const printTemplate = readRepoFile('templates/actor/character-print.hbs');
  const sheetSource = readRepoFile('src/sheets/character-sheet.ts');
  const slotGridMarkup = partial.slice(
    partial.indexOf('class="battle-senses-slot-grid"'),
    partial.indexOf('</div>', partial.indexOf('class="battle-senses-slot-grid"')),
  );
  const combatSensesBattle = buildCombatSensesBattleAreaContext({
    system: { combatSenses: {} },
    items: [],
    getFlag: () => undefined,
  });

  it('compiles battle-senses partial without mismatched Handlebars block tags', () => {
    expectTemplateCompiles('templates/actor/partials/battle-senses-area.hbs', {
      editable: true,
      combatSensesBattle,
    });
    expect(partial).not.toMatch(/\{\{#unless[^}]+\}\}[^{]*\{\{\/if\}\}/);
    expect(printTemplate).not.toMatch(/cp-battle-sense-row[\s\S]*?\{\{#unless[^}]+\}\}[^{]*\{\{\/if\}\}/);
  });

  it('defers battle senses to a post-mount partial (not in the main form template)', () => {
    expect(template).toMatch(/data-battle-senses-mount/);
    expect(template).not.toMatch(/class="battle-senses-area"/);
    expect(template).not.toMatch(/name="system\.combatSenses\./);
  });

  it('does not bind any combatSenses fields in the partial template', () => {
    expect(partial).not.toMatch(/name="system\.combatSenses\./);
  });

  it('does not bind activeSenseId via radio inputs in the partial', () => {
    expect(partial).not.toMatch(/name="system\.combatSenses\.activeSenseId"/);
    expect(slotGridMarkup).not.toMatch(/type="radio"/i);
    expect(slotGridMarkup).not.toMatch(/<input[^>]*battle-sense-slot/i);
  });

  it('uses explicit Sense Slot buttons with data-sense-id in the partial', () => {
    expect(slotGridMarkup).toMatch(/class="[^"]*js-battle-sense-slot/);
    expect(slotGridMarkup).toMatch(/data-sense-id="\{\{this\.id\}\}"/);
    expect(slotGridMarkup).toMatch(/type="button"/);
  });

  it('mounts battle senses after activateListeners with explicit handlers', () => {
    expect(sheetSource).toMatch(/#mountBattleSensesArea/);
    expect(sheetSource).toMatch(/#bindBattleSensesHandlers/);
    expect(sheetSource).toMatch(/#onBattleSenseSlotSelect/);
    expect(sheetSource).toMatch(/#onCombatSenseGrantToggle/);
    expect(sheetSource).toMatch(/#onCombatSenseDarkvisionToggle/);
    expect(sheetSource).toMatch(/battle-senses-area\.hbs/);
  });

  it('blocks document re-renders during initial sheet mount', () => {
    expect(sheetSource).toMatch(/if \(!this\.rendered \|\| this\.#isRendering\) return;/);
    expect(sheetSource).toMatch(/#isRendering/);
  });
});
