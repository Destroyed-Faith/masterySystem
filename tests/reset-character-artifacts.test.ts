import { describe, expect, it } from 'vitest';
import {
  isGeneralEmbeddedArtifact,
  listEquippedGeneralArtifacts,
} from '../src/utils/reset-character.js';

function mkItem(opts: {
  id?: string;
  name?: string;
  type?: string;
  binding?: string;
  echoBound?: boolean;
  slot?: string;
  equipped?: boolean;
}): any {
  const flags: Record<string, Record<string, unknown>> = {
    'mastery-system': {},
  };
  if (opts.echoBound) flags['mastery-system'].echoBound = true;
  if (opts.slot) {
    flags['mastery-system'].equipment = { slot: opts.slot, container: 'equip' };
  }
  return {
    id: opts.id ?? 'item1',
    name: opts.name ?? 'Moonlight Greatsword',
    type: opts.type ?? 'artifact',
    system: { binding: opts.binding ?? 'bound', equipped: opts.equipped === true },
    getFlag(ns: string, key: string) {
      return flags[ns]?.[key];
    },
  };
}

function mkActor(items: any[]): any {
  return {
    items: {
      [Symbol.iterator]() {
        return items[Symbol.iterator]();
      },
      get(id: string) {
        return items.find((i) => i.id === id);
      },
    },
  };
}

describe('isGeneralEmbeddedArtifact', () => {
  it('returns true for bound general artifacts', () => {
    expect(isGeneralEmbeddedArtifact(mkItem({ binding: 'bound' }))).toBe(true);
  });

  it('returns false for echo artifacts', () => {
    expect(isGeneralEmbeddedArtifact(mkItem({ echoBound: true }))).toBe(false);
    expect(isGeneralEmbeddedArtifact(mkItem({ binding: 'echo' }))).toBe(false);
  });

  it('returns false for non-artifact items', () => {
    expect(isGeneralEmbeddedArtifact(mkItem({ type: 'weapon' }))).toBe(false);
  });
});

describe('listEquippedGeneralArtifacts', () => {
  it('lists only equipped general artifacts', () => {
    const actor = mkActor([
      mkItem({ id: 'g1', name: 'Moonlight Greatsword', slot: 'mainhand' }),
      mkItem({ id: 'g2', name: 'Soul Sigil', slot: 'amulet' }),
      mkItem({ id: 'e1', name: 'Dragon Head', echoBound: true, slot: 'head' }),
      mkItem({ id: 'g3', name: 'Staff in bag' }),
    ]);
    const list = listEquippedGeneralArtifacts(actor);
    expect(list).toHaveLength(2);
    expect(list.map((x) => x.id).sort()).toEqual(['g1', 'g2']);
  });
});
