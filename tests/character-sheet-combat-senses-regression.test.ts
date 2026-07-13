/**
 * Regression guards for Combat Senses UI on the character sheet.
 *
 * v0.9.204 used form-bound inputs for Combat Senses inside the ActorSheet
 * `<form>`. Foundry's form sync re-rendered the sheet in a loop on open, so
 * the window never finished mounting (activateListeners never ran).
 *
 * All Combat Senses controls must use explicit handlers + actor.update(), not
 * `name="system.combatSenses.*"` form fields.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function extractBattleSensesAreaMarkup(template: string): string {
  const start = template.indexOf('class="battle-senses-area"');
  expect(start, 'battle-senses-area section missing from character sheet template').toBeGreaterThanOrEqual(0);
  const end = template.indexOf('</section>', start);
  expect(end, 'battle-senses-area section not closed').toBeGreaterThan(start);
  return template.slice(start, end);
}

describe('character sheet combat senses regression', () => {
  const template = readRepoFile('templates/actor/character-sheet.hbs');
  const sheetSource = readRepoFile('src/sheets/character-sheet.ts');
  const battleSensesMarkup = extractBattleSensesAreaMarkup(template);
  const slotGridMarkup = battleSensesMarkup.slice(
    battleSensesMarkup.indexOf('class="battle-senses-slot-grid"'),
    battleSensesMarkup.indexOf('</div>', battleSensesMarkup.indexOf('class="battle-senses-slot-grid"')),
  );

  it('does not bind any combatSenses fields to the ActorSheet form', () => {
    expect(battleSensesMarkup).not.toMatch(/name="system\.combatSenses\./);
  });

  it('does not bind activeSenseId to the ActorSheet form via radio inputs', () => {
    expect(template).not.toMatch(/name="system\.combatSenses\.activeSenseId"/);
    expect(slotGridMarkup).not.toMatch(/type="radio"/i);
    expect(slotGridMarkup).not.toMatch(/<input[^>]*battle-sense-slot/i);
  });

  it('uses explicit Sense Slot buttons with data-sense-id', () => {
    expect(slotGridMarkup).toMatch(/class="[^"]*js-battle-sense-slot/);
    expect(slotGridMarkup).toMatch(/data-sense-id="\{\{this\.id\}\}"/);
    expect(slotGridMarkup).toMatch(/type="button"/);
  });

  it('uses explicit grant + darkvision handlers instead of form autosubmit', () => {
    expect(battleSensesMarkup).toMatch(/class="[^"]*js-combat-sense-grant/);
    expect(battleSensesMarkup).toMatch(/class="[^"]*js-combat-sense-darkvision/);
    expect(sheetSource).toMatch(/#onBattleSenseSlotSelect/);
    expect(sheetSource).toMatch(/#onCombatSenseGrantToggle/);
    expect(sheetSource).toMatch(/#onCombatSenseDarkvisionToggle/);
    expect(sheetSource).toMatch(/\.js-battle-sense-slot/);
    expect(sheetSource).toMatch(/system\.combatSenses\.activeSenseId/);
    expect(sheetSource).toMatch(/system\.combatSenses\.grantedSenseIds/);
    expect(sheetSource).toMatch(/system\.combatSenses\.hasDarkvision/);
  });

  it('coalesces overlapping render() calls to survive actor updates during sheet open', () => {
    expect(sheetSource).toMatch(/#renderInFlight/);
    expect(sheetSource).toMatch(/async #renderSheet\(/);
  });
});
