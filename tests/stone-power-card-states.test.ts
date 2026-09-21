import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const hbs = readFileSync(join(process.cwd(), 'templates/dialogs/stone-powers.hbs'), 'utf8');
const css = readFileSync(join(process.cwd(), 'styles/stone-powers-dialog.css'), 'utf8');

describe('stone power card color states', () => {
  it('marks pending and activated cards without Not active text', () => {
    expect(hbs).toMatch(/is-pending/);
    expect(hbs).toMatch(/is-activated/);
    expect(hbs).not.toMatch(/Not active/);
    expect(hbs).not.toMatch(/stone-unactivated-banner/);
    expect(hbs).not.toMatch(/These stones are not activated/);
  });

  it('keeps empty cards gray, pending orange, activated green', () => {
    expect(css).toMatch(/\.power-card-general\.is-pending/);
    expect(css).toMatch(/#ff9800/);
    expect(css).toMatch(/\.power-card-general\.is-activated/);
    expect(css).toMatch(/rgba\(46, 160, 60, 0\.55\)/);
    expect(css).toMatch(/\.power-card-general\.is-activated \.power-name/);
  });

  it('paints filled stone boxes green like the Extra Attack example', () => {
    expect(css).toMatch(/\.ms-stone-drop-slot\.slot-filled/);
    expect(css).toMatch(/rgba\(76, 175, 80, 0\.28\)/);
    expect(css).toMatch(/rgba\(102, 187, 106, 0\.95\)/);
    expect(css).toMatch(/\.is-pending \.ms-stone-drop-slot\.slot-filled/);
  });
});
