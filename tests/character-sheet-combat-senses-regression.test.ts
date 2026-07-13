/**
 * Regression guards for Combat Senses UI on the character sheet.
 *
 * v0.9.204 used <input type="radio" name="system.combatSenses.activeSenseId">
 * inside the Sense Slot cards. Foundry's ActorSheet form sync re-rendered the
 * sheet in a loop on open, so the window never finished mounting.
 *
 * Sense Slot selection must stay on explicit button clicks + actor.update(),
 * not on form-integrated radios for activeSenseId.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function extractBattleSensesSlotGridMarkup(template: string): string {
  const start = template.indexOf('class="battle-senses-slot-grid"');
  expect(start, 'battle-senses-slot-grid section missing from character sheet template').toBeGreaterThanOrEqual(0);
  const end = template.indexOf('</div>', start);
  expect(end, 'battle-senses-slot-grid section not closed').toBeGreaterThan(start);
  return template.slice(start, end);
}

describe('character sheet combat senses regression', () => {
  const template = readRepoFile('templates/actor/character-sheet.hbs');
  const sheetSource = readRepoFile('src/sheets/character-sheet.ts');
  const slotGridMarkup = extractBattleSensesSlotGridMarkup(template);

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

  it('wires a dedicated click handler instead of form autosubmit for Sense Slot', () => {
    expect(sheetSource).toMatch(/#onBattleSenseSlotSelect/);
    expect(sheetSource).toMatch(/\.js-battle-sense-slot/);
    expect(sheetSource).toMatch(/system\.combatSenses\.activeSenseId/);
  });

  it('coalesces overlapping render() calls to survive actor updates during sheet open', () => {
    expect(sheetSource).toMatch(/#renderInFlight/);
    expect(sheetSource).toMatch(/async #renderSheet\(/);
  });
});
