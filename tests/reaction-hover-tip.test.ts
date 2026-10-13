import { describe, expect, it } from 'vitest';
import { reactionPowerHoverTip } from '../src/combat/reaction-window-chat';

describe('reactionPowerHoverTip', () => {
  it('shows the effect text, not the name', () => {
    const tip = reactionPowerHoverTip(
      {
        name: 'Guard',
        system: { description: 'Gain **+4 Armor** against the triggering attack.' },
      },
      null,
    );
    expect(tip).toBe('Gain +4 Armor against the triggering attack.');
    expect(tip).not.toContain('Guard');
  });

  it('prefers system.effect over description', () => {
    const tip = reactionPowerHoverTip(
      {
        name: 'Riposte',
        system: {
          description: 'Fluff only.',
          effect: 'After a Full Parry, make a Basic Attack.',
        },
      },
      null,
    );
    expect(tip).toBe('After a Full Parry, make a Basic Attack.');
  });

  it('appends evade-prevent note without repeating the name', () => {
    const tip = reactionPowerHoverTip(
      { name: 'Evade', system: { description: 'Gain +4 Evade.' } },
      true,
    );
    expect(tip).toBe('Gain +4 Evade. — Would prevent the hit.');
  });
});
