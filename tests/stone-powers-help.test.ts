import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  STONE_HELP_START_INITIATIVE,
  STONE_HELP_START_STONES,
  STONE_POWERS_HELP_COUNT,
  STONE_POWERS_HELP_SCREENS,
  assignHelperFilesToSlots,
  clampStoneHelpPage,
  listStoneHelpAssetFiles,
  matchHelperAsset,
  resetStoneHelpAssetFileCache,
  stoneHelpScreensForFiles,
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
    expect(screen6.images.every((row) => row.src === '')).toBe(true);
  });

  it('does not bake guessed helper filenames into the overlay', () => {
    const overlay = hbs.slice(hbs.indexOf('stone-help-overlay'));
    const blob = `${helpSrc}\n${overlay}`;
    expect(blob).not.toMatch(/Reset stone assignment/i);
    expect(blob).not.toMatch(/reset Stone/i);
    expect(hbs).toMatch(/js-gm-reset-stones/);
    expect(hbs).not.toMatch(/01-roll-initiative\.png/);
    expect(helpSrc).not.toMatch(/01-roll-initiative\.png/);
    for (const screen of STONE_POWERS_HELP_SCREENS) {
      for (const image of screen.images) {
        expect(image.src).toBe('');
        expect(image.file).toBe('');
      }
    }
  });

  it('does not hook Help into stone payment or GM reset', () => {
    expect(dialogSrc).toMatch(/#bindStoneHelp/);
    expect(dialogSrc).toMatch(/#openStoneHelp/);
    expect(dialogSrc).toMatch(/#resolveHelpImages/);
    expect(dialogSrc).toMatch(/assignHelperFilesToSlots/);
    expect(dialogSrc).toMatch(/helpScreens: STONE_POWERS_HELP_SCREENS/);
    expect(dialogSrc).not.toMatch(/#openStoneHelp[\s\S]{0,200}#gmResetStoneAssignment/);
    expect(dialogSrc).toMatch(
      /#openStoneHelp[\s\S]*?overlay\.hidden = false[\s\S]*?#resolveHelpImages/,
    );
    expect(dialogSrc).not.toMatch(
      /#openStoneHelp[\s\S]*?await this\.#resolveHelpImages[\s\S]*?overlay\.hidden = false/,
    );
    expect(css).toMatch(/\.stone-help-overlay/);
    expect(css).toMatch(/object-fit:\s*contain/);
    expect(css).toMatch(/\.stone-help-images\.is-triple/);
  });

  it('returns quickly when FilePicker.browse never resolves', async () => {
    resetStoneHelpAssetFileCache();
    const previous = (globalThis as any).foundry;
    (globalThis as any).foundry = {
      applications: {
        apps: {
          FilePicker: {
            browse: () => new Promise(() => {}),
          },
        },
      },
    };
    try {
      const started = Date.now();
      const files = await listStoneHelpAssetFiles();
      expect(Date.now() - started).toBeLessThan(2500);
      expect(files).toEqual([]);
    } finally {
      resetStoneHelpAssetFileCache();
      (globalThis as any).foundry = previous;
    }
  });

  it('matches numbered helper files when the folder uses those names', () => {
    const local = [
      'D:/Dev/VTT/Mastery System/assets/helper/01 Roll Initiative.PNG',
      'assets/helper/02_before_conversion.jpg',
      'systems/mastery-system/assets/helper/screenshot_03.png',
      '04 Available Colorless Stones.webp',
      'help-05-power-sections.png',
      '06a extra attack empty.png',
      '6b-incomplete.jpg',
      '06c-power-active.png',
      '07 Apply & Close.png',
    ];
    expect(matchHelperAsset(local, '01')).toContain('01 Roll Initiative.PNG');
    expect(matchHelperAsset(local, '02')).toContain('02_before_conversion.jpg');
    expect(matchHelperAsset(local, '03')).toContain('screenshot_03.png');
    expect(matchHelperAsset(local, '04')).toContain('04 Available Colorless Stones.webp');
    expect(matchHelperAsset(local, '05')).toContain('help-05-power-sections.png');
    expect(matchHelperAsset(local, '06a')).toContain('06a extra attack empty.png');
    expect(matchHelperAsset(local, '06b')).toContain('6b-incomplete.jpg');
    expect(matchHelperAsset(local, '06c')).toContain('06c-power-active.png');
    expect(matchHelperAsset(local, '07')).toContain('07 Apply & Close.png');
  });

  it('takes the real folder filenames in order when names do not match the spec', () => {
    const files = [
      'assets/helper/shot-i.png',
      'assets/helper/shot-c.png',
      'assets/helper/shot-a.png',
      'assets/helper/shot-f.png',
      'assets/helper/shot-b.png',
      'assets/helper/shot-e.png',
      'assets/helper/shot-d.png',
      'assets/helper/shot-h.png',
      'assets/helper/shot-g.png',
    ];
    const assigned = assignHelperFilesToSlots(files);
    expect([...assigned.values()].map((path) => path.split('/').pop())).toEqual([
      'shot-a.png',
      'shot-b.png',
      'shot-c.png',
      'shot-d.png',
      'shot-e.png',
      'shot-f.png',
      'shot-g.png',
      'shot-h.png',
      'shot-i.png',
    ]);
    const screens = stoneHelpScreensForFiles(files);
    expect(screens.flatMap((screen) => screen.images.map((row) => row.file))).toEqual([
      'shot-a.png',
      'shot-b.png',
      'shot-c.png',
      'shot-d.png',
      'shot-e.png',
      'shot-f.png',
      'shot-g.png',
      'shot-h.png',
      'shot-i.png',
    ]);
    expect(screens.flatMap((screen) => screen.images.map((row) => row.src)).join(' ')).not.toMatch(
      /01-roll-initiative|02-before-conversion|06a-power-empty/,
    );
  });

  it('maps seven folder files one-to-one onto the seven screens', () => {
    const files = [
      'assets/helper/g-apply.png',
      'assets/helper/a-init.png',
      'assets/helper/b-choose.png',
      'assets/helper/c-convert.png',
      'assets/helper/d-available.png',
      'assets/helper/e-sections.png',
      'assets/helper/f-power.png',
    ];
    const screens = stoneHelpScreensForFiles(files);
    expect(screens.map((screen) => screen.images.map((row) => row.file))).toEqual([
      ['a-init.png'],
      ['b-choose.png'],
      ['c-convert.png'],
      ['d-available.png'],
      ['e-sections.png'],
      ['f-power.png'],
      ['g-apply.png'],
    ]);
  });
});
