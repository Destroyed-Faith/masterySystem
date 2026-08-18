import { describe, expect, it } from 'vitest';
import {
  applyBackgroundWatch,
  fromPortable,
  migrateStored,
  parsePortable,
  toPortable,
} from '../src/scene-editor/persistence';
import { emptyStored } from '../src/scene-editor/types';

describe('schema migration', () => {
  it('fills a missing document', () => {
    const stored = migrateStored(null, 'Scene.1');
    expect(stored.schemaVersion).toBe(1);
    expect(stored.sceneId).toBe('Scene.1');
    expect(stored.hints).toEqual([]);
  });

  it('keeps known fields from an older payload', () => {
    const stored = migrateStored({ schemaVersion: 0, hints: [{ id: 'h1', kind: 'wall', a: { x: 1, y: 2 }, b: { x: 3, y: 4 } }] }, 'S');
    expect(stored.schemaVersion).toBe(1);
    expect(stored.hints[0]!.id).toBe('h1');
  });
});

describe('background watch', () => {
  it('marks analysis stale when the image changes', () => {
    const stored = emptyStored('S');
    stored.backgroundFingerprint = 'old.png|100x100';
    const next = applyBackgroundWatch(stored, { background: { src: 'new.png' }, width: 200, height: 200 });
    expect(next.analysis.backgroundChanged).toBe(true);
    expect(next.analysis.stale).toBe(true);
  });
});

describe('portable json', () => {
  it('normalises and restores geometry', () => {
    const stored = emptyStored('S');
    stored.hints = [{ id: 'h', kind: 'door', a: { x: 100, y: 50 }, b: { x: 200, y: 50 } }];
    const origin = { x: 0, y: 0 };
    const size = { x: 400, y: 200 };
    const portable = toPortable(stored, 'Map', [{ kind: 'wall', a: { x: 0, y: 0 }, b: { x: 400, y: 0 } }], origin, size);
    expect(portable.geometry[0]!.a).toEqual({ x: 0, y: 0 });
    expect(portable.geometry[0]!.b).toEqual({ x: 1, y: 0 });
    const back = fromPortable(portable, origin, size);
    expect(back.geometry[0]!.b).toEqual({ x: 400, y: 0 });
    expect(back.hints[0]!.a).toEqual({ x: 100, y: 50 });
  });

  it('rejects unrelated json', () => {
    expect(parsePortable({ foo: 1 })).toBeNull();
  });
});
