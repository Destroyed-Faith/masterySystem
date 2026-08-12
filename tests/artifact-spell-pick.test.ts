import { describe, expect, it } from 'vitest';
import {
  artifactLevelToTemplateRank,
  artifactPickCanBeSpell,
  uiTemplateIdCanBeSpell,
} from '../src/utils/artifact-spell-pick.js';

describe('artifact-spell-pick', () => {
  it('maps artifact levels to template ranks 4 / 10 / 16', () => {
    expect(artifactLevelToTemplateRank(1)).toBe('4');
    expect(artifactLevelToTemplateRank(3)).toBe('4');
    expect(artifactLevelToTemplateRank(4)).toBe('10');
    expect(artifactLevelToTemplateRank(7)).toBe('16');
  });

  it('allows spells only for ranged actives', () => {
    expect(uiTemplateIdCanBeSpell('active-ranged-aoe-targeted-special')).toBe(true);
    expect(uiTemplateIdCanBeSpell('active-melee-targeted-special')).toBe(false);
    expect(uiTemplateIdCanBeSpell('martial:ranged-aoe')).toBe(true);
    expect(uiTemplateIdCanBeSpell('martial:melee-aoe')).toBe(false);
  });

  it('detects spell eligibility on stored picks', () => {
    expect(
      artifactPickCanBeSpell({ powerTemplateId: 'active-ranged-single-heal' }),
    ).toBe(true);
    expect(
      artifactPickCanBeSpell({ powerTemplateId: 'active-melee-weapon-single' }),
    ).toBe(false);
    expect(
      artifactPickCanBeSpell({ delivery: 'ranged-single' }),
    ).toBe(true);
  });
});
