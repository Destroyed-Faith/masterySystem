import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  STONE_HELP_START_INITIATIVE,
  STONE_HELP_START_STONES,
  STONE_POWERS_HELP_COUNT,
  STONE_POWERS_HELP_SCREENS,
  clampStoneHelpPage,
} from '../src/stones/stone-powers-help.ts';

const hbs = readFileSync(join(process.cwd(), 'templates/dialogs/stone-powers.hbs'), 'utf8');
const css = readFileSync(join(process.cwd(), 'styles/stone-powers-dialog.css'), 'utf8');
const helpSrc = readFileSync(join(process.cwd(), 'src/stones/stone-powers-help.ts'), 'utf8');
const dialogSrc = readFileSync(join(process.cwd(), 'src/stones/stone-powers-dialog.ts'), 'utf8');

describe('Stone Powers Quick Help', () => {
  it('has exactly seven screens and opens on Initiative or Available Stones', () => {
    expect(STONE_POWERS_HELP_SCREENS).toHaveLength(7);
    expect(STONE_POWERS_HELP_COUNT).toBe(7);
    expect(STONE_HELP_START_INITIATIVE).toBe(1);
    expect(STONE_HELP_START_STONES).toBe(4);
    expect(clampStoneHelpPage(0)).toBe(1);
    expect(clampStoneHelpPage(99)).toBe(7);
  });

  it('puts ? buttons on Initiative and Available Stones only', () => {
    expect(hbs).toMatch(/<strong>Initiative<\/strong>[\s\S]*?data-help-start="1"/);
    expect(hbs).toMatch(/Available Stones[\s\S]*?data-help-start="4"/);
    expect(hbs.match(/js-stone-help"/g)?.length).toBe(2);
    expect(hbs).toMatch(/STONE POWERS — QUICK HELP/);
    expect(hbs).toMatch(/js-stone-help-prev/);
    expect(hbs).toMatch(/js-stone-help-next/);
  });

  it('shows Extra Attack empty, incomplete, and active on screen 6', () => {
    const screen6 = STONE_POWERS_HELP_SCREENS[5];
    expect(screen6.title).toBe('6. Pay the full Tier');
    expect(screen6.images.map((row) => row.caption)).toEqual(['EMPTY', 'INCOMPLETE', 'ACTIVE']);
    expect(screen6.images.map((row) => row.src)).toEqual([
      'systems/mastery-system/assets/helper/06a-power-empty.png',
      'systems/mastery-system/assets/helper/06b-power-incomplete.png',
      'systems/mastery-system/assets/helper/06c-power-active.png',
    ]);
  });

  it('uses the existing helper screenshots and never mentions reset', () => {
    const overlay = hbs.slice(hbs.indexOf('stone-help-overlay'));
    const blob = `${helpSrc}\n${overlay}`;
    expect(blob).not.toMatch(/Reset stone assignment/i);
    expect(blob).not.toMatch(/reset Stone/i);
    expect(hbs).toMatch(/js-gm-reset-stones/);
    for (const screen of STONE_POWERS_HELP_SCREENS) {
      for (const image of screen.images) {
        expect(image.src).toMatch(/^systems\/mastery-system\/assets\/helper\//);
      }
    }
  });

  it('does not hook Help into stone payment or GM reset', () => {
    expect(dialogSrc).toMatch(/#bindStoneHelp/);
    expect(dialogSrc).toMatch(/#openStoneHelp/);
    expect(dialogSrc).not.toMatch(/#openStoneHelp[\s\S]{0,200}#gmResetStoneAssignment/);
    expect(css).toMatch(/\.stone-help-overlay/);
    expect(css).toMatch(/object-fit:\s*contain/);
    expect(css).toMatch(/\.stone-help-images\.is-triple/);
  });
});
