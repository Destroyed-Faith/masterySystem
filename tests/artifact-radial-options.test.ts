import { describe, expect, it } from 'vitest';

import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';

function flag(data: Record<string, unknown>) {
  return (_ns: string, key: string) => data[key];
}

function artifact(spec: {
  id: string;
  name: string;
  kind: string;
  damage?: string;
  progression?: Array<{ level: number; name: string; type: string; effect?: string }>;
}) {
  return {
    id: spec.id,
    type: 'artifact',
    name: spec.name,
    system: {
      equipped: true,
      binding: 'bound',
      artifactKind: spec.kind,
      currentLevel: 1,
      level: 1,
      artifactWeapon: spec.damage ? { damage: spec.damage } : undefined,
      levelProgression: spec.progression ?? [],
    },
    getFlag: flag({ artifactActivated: true }),
  };
}

function actor(items: any[]) {
  return { items };
}

describe('buildArtifactRadialOptions weapon buttons', () => {
  it('keeps Moonlight Mending and drops the basic sword swing when Single Attack exists', () => {
    const sword = artifact({
      id: 'mg',
      name: 'Moonlight Greatsword - Level 1-1',
      kind: 'weapon',
      damage: '5d8',
      progression: [
        { level: 1, name: 'Moonlight Mending I', type: 'Active', effect: 'Heal 10d8' },
      ],
    });
    const single = {
      id: 'p1',
      type: 'power',
      name: 'Single Attack',
      system: { powerType: 'active', showInRadialMenu: true },
    };
    const opts = buildArtifactRadialOptions(actor([sword, single]));
    expect(opts.map((o) => o.name)).toEqual(['Moonlight Mending I']);
    expect(opts.some((o) => o.id.startsWith('artifact-weapon:'))).toBe(false);
  });

  it('keeps the named weapon swing when the actor has no Active power of their own', () => {
    const sword = artifact({
      id: 'mg',
      name: 'Moonlight Greatsword - Level 1-1',
      kind: 'weapon',
      damage: '5d8',
    });
    const opts = buildArtifactRadialOptions(actor([sword]));
    expect(opts).toHaveLength(1);
    expect(opts[0].id).toBe('artifact-weapon:mg');
    expect(opts[0].name).toBe('Moonlight Greatsword');
  });

  it('never turns Soul Sigil into a 1d8 attack', () => {
    const sigil = artifact({
      id: 'ss',
      name: 'Soul Sigil - Level 1-1',
      kind: 'armor',
      damage: '1d8',
      progression: [
        { level: 1, name: 'Soul Shell I', type: 'Stone Power Support', effect: 'Vitality Temporary HP' },
      ],
    });
    const opts = buildArtifactRadialOptions(actor([sigil]));
    expect(opts.some((o) => o.slot === 'attack')).toBe(false);
    expect(opts.some((o) => o.id.startsWith('artifact-weapon:'))).toBe(false);
    expect(opts.map((o) => o.name)).toEqual(['Soul Shell I']);
    expect(opts[0].slot).toBe('utility');
  });

  it('still adds an extra natural-weapon attack on gear (Dragon Head Bite)', () => {
    const head = artifact({
      id: 'dh',
      name: 'Dragon Head - Level 1-1',
      kind: 'gear',
      damage: '3d8',
    });
    const opts = buildArtifactRadialOptions(actor([head]));
    expect(opts).toHaveLength(1);
    expect(opts[0].id).toBe('artifact-weapon:dh');
    expect(opts[0].tags).toContain('natural-weapon');
  });
});
