import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const hbs = readFileSync(join(process.cwd(), 'templates/ui/combat-carousel.hbs'), 'utf8');
const css = readFileSync(join(process.cwd(), 'styles/combat-carousel.css'), 'utf8');

describe('combat carousel Next Turn', () => {
  it('wraps each combatant so the end-turn button is not on the portrait card', () => {
    expect(hbs).toMatch(/class="carousel-combatant/);
    expect(hbs).toMatch(
      /<\/div>\s*<!-- Sibling of the portrait[\s\S]*?portrait-end-turn js-end-turn/,
    );
    const buttonIdx = hbs.indexOf('class="portrait-end-turn js-end-turn"');
    const portraitIdx = hbs.indexOf('class="carousel-portrait');
    expect(buttonIdx).toBeGreaterThan(portraitIdx);
    const between = hbs.slice(portraitIdx, buttonIdx);
    expect(between).toContain('</div>');
    expect(between).toContain('<!-- Sibling of the portrait');
  });

  it('keeps the player Next chevron on the same end-turn action', () => {
    expect(hbs).toMatch(
      /carousel-control-btn js-next-turn js-end-turn" data-action="msEndTurn"/,
    );
  });

  it('gives the combatant column its own click target', () => {
    expect(css).toMatch(/\.carousel-combatant\s*\{/);
    expect(css).toMatch(/#mastery-combat-carousel \.carousel-combatant/);
  });

  it('exposes a resize handle and stays under actor sheets', () => {
    expect(hbs).toMatch(/carousel-resize-handle js-carousel-resize/);
    expect(css).not.toMatch(/#mastery-combat-carousel[\s\S]{0,400}z-index:\s*300\s*!important/);
    expect(css).toMatch(/carousel-resize-handle/);
  });
});
