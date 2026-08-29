import { describe, expect, it } from 'vitest';
import {
  artifactFlavorText,
  artifactUpgradeBlockReason,
} from '../src/artifacts/artifact-evolution-actions';

describe('artifact progression UX helpers', () => {
  it('prefers lore, then description, then the next item', () => {
    expect(artifactFlavorText({ system: { lore: 'Deep-road memory.' } })).toBe('Deep-road memory.');
    expect(artifactFlavorText({ system: { description: 'Claws and scales.' } })).toBe('Claws and scales.');
    expect(
      artifactFlavorText({ system: { lore: '' } }, { system: { lore: 'From the world root.' } }),
    ).toBe('From the world root.');
    expect(artifactFlavorText({ system: {} }, null)).toBe('');
  });

  it('does not block when any path is affordable', () => {
    expect(
      artifactUpgradeBlockReason([
        { disabledReason: 'Not enough XP (8 needed for level 2+).' },
        { disabledReason: '' },
      ]),
    ).toBe('');
  });

  it('surfaces the XP lock for level 2+ when every path is blocked', () => {
    expect(
      artifactUpgradeBlockReason([
        { disabledReason: 'Not enough XP (8 needed for level 2+).' },
        { disabledReason: 'Not enough XP (8 needed for level 2+).' },
      ]),
    ).toBe('Not enough XP (8 needed for level 2+).');
  });

  it('explains a maxed tree when there are no paths', () => {
    expect(artifactUpgradeBlockReason([], { atMax: true })).toBe('Max level for current Mastery Rank.');
    expect(artifactUpgradeBlockReason([])).toBe('No further branches from this node.');
  });
});
