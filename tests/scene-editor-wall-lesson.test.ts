import { describe, expect, it } from 'vitest';
import {
  WALL_LESSON_KIND,
  WALL_LESSON_SCHEMA_VERSION,
  buildWallLesson,
} from '../src/scene-editor/wall-lesson';

describe('wall lesson JSON', () => {
  const origin = { x: 0, y: 0 };
  const size = { x: 200, y: 100 };

  it('builds a portable lesson from a prepared wall set', () => {
    const doc = buildWallLesson({
      sceneName: 'Crypt',
      fingerprint: 'map.png|200x100',
      origin,
      size,
      gridSize: 50,
      walls: [
        { id: 'w1', kind: 'wall', a: { x: 0, y: 0 }, b: { x: 200, y: 0 } },
        { id: 'w2', kind: 'wall', a: { x: 200, y: 0 }, b: { x: 200, y: 100 } },
        { id: 'd1', kind: 'door', a: { x: 80, y: 0 }, b: { x: 120, y: 0 } },
        { id: 'win1', kind: 'window', a: { x: 200, y: 20 }, b: { x: 200, y: 40 } },
      ],
    });

    expect(doc.kind).toBe(WALL_LESSON_KIND);
    expect(doc.schemaVersion).toBe(WALL_LESSON_SCHEMA_VERSION);
    expect(doc.scene.name).toBe('Crypt');
    expect(doc.segments).toHaveLength(2);
    expect(doc.segments[0]!.a).toEqual({ x: 0, y: 0 });
    expect(doc.segments[0]!.b).toEqual({ x: 1, y: 0 });
    expect(doc.segments[0]!.axisAligned).toBe(true);
    expect(doc.openings).toHaveLength(2);

    const door = doc.openings.find((o) => o.kind === 'door');
    expect(door?.hostWallId).toBe('w1');
    expect(door?.width).toBeCloseTo(40);
    expect(door?.widthFractionOfHost).toBeCloseTo(0.2);

    expect(doc.clustering.sharedJunctions).toBeGreaterThanOrEqual(1);
    expect(doc.recommendations.preferChainOverDrag).toBe(true);
    expect(doc.recommendations.doorWidthRange?.median).toBeCloseTo(40);
    expect(doc.recommendations.notes.length).toBeGreaterThan(0);
  });

  it('reports free openings when no host wall matches', () => {
    const doc = buildWallLesson({
      sceneName: 'Open',
      fingerprint: 'x',
      origin,
      size,
      walls: [{ id: 'd1', kind: 'door', a: { x: 10, y: 40 }, b: { x: 50, y: 40 } }],
    });
    expect(doc.segments).toHaveLength(0);
    expect(doc.openings[0]!.hostWallId).toBeNull();
    expect(doc.recommendations.doorWidthRange?.min).toBeCloseTo(40);
  });
});
