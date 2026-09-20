import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const hbs = readFileSync(join(process.cwd(), 'templates/dialogs/stone-powers.hbs'), 'utf8');
const css = readFileSync(join(process.cwd(), 'styles/stone-powers-dialog.css'), 'utf8');

describe('stone dialog Roll Initiative glow', () => {
  it('marks the pending roll button with a rainbow ring class', () => {
    expect(hbs).toMatch(/js-roll-initiative is-glow/);
  });

  it('spins a conic rainbow around that button', () => {
    expect(css).toMatch(/\.js-roll-initiative\.is-glow::before/);
    expect(css).toMatch(/conic-gradient\(/);
    expect(css).toMatch(/@keyframes initiative-roll-glow/);
  });
});
