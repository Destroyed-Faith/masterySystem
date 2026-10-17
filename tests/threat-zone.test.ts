import { describe, expect, it } from 'vitest';
import {
  planThreatZoneWindows,
  resolveThreatZoneOnTokenChange,
  setThreatZoneOpener,
  type ThreatReactor,
  type ThreatWindow,
} from '../src/combat/threat-zone';

const grid = { size: 100, distance: 1 };

function reactor(over: Partial<ThreatReactor> = {}): ThreatReactor {
  return {
    id: 'guard',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    disposition: -1,
    reachMeters: 2,
    reactionsRemaining: 1,
    ...over,
  };
}

describe('Threat Zones on token movement', () => {
  it('opens entry after arrival and exit before departure', () => {
    const enemy = reactor();
    const entry = planThreatZoneWindows(
      {
        moverId: 'mover',
        fromX: 500,
        fromY: 0,
        toX: 200,
        toY: 0,
        width: 1,
        height: 1,
        disposition: 1,
        traversal: 'path',
        protectedFromReactions: false,
      },
      [enemy],
      grid,
    );
    expect(entry.windows.find((w) => w.kind === 'entry' && !w.suppressed)?.when).toBe('after-update');

    const exit = planThreatZoneWindows(
      {
        moverId: 'mover',
        fromX: 100,
        fromY: 0,
        toX: 600,
        toY: 0,
        width: 1,
        height: 1,
        disposition: 1,
        traversal: 'path',
        protectedFromReactions: false,
      },
      [enemy],
      grid,
    );
    expect(exit.windows.find((w) => w.kind === 'exit' && !w.suppressed)?.when).toBe('before-update');
  });

  it('suppresses Safe Movement and Disengage windows but still marks a Movement Event', () => {
    const move = {
      moverId: 'mover',
      fromX: 100,
      fromY: 0,
      toX: 600,
      toY: 0,
      width: 1,
      height: 1,
      disposition: 1 as const,
      traversal: 'path' as const,
      protectedFromReactions: true,
    };
    const plan = planThreatZoneWindows(move, [reactor()], grid);
    expect(plan.movementEvent).toBe(true);
    expect(plan.windows.every((w) => w.suppressed && w.reason === 'protected-movement')).toBe(true);
  });

  it('does not open a window when the Reaction is already spent', () => {
    const plan = planThreatZoneWindows(
      {
        moverId: 'mover',
        fromX: 500,
        fromY: 0,
        toX: 150,
        toY: 0,
        disposition: 1,
        traversal: 'path',
        protectedFromReactions: false,
      },
      [reactor({ reactionsRemaining: 0 })],
      grid,
    );
    expect(plan.windows[0]?.suppressed).toBe(true);
    expect(plan.windows[0]?.reason).toBe('no-reaction');
  });

  it('teleport ignores the path and still checks both endpoints', () => {
    const zone = reactor({ x: 300, y: 0, reachMeters: 1 });
    const skipped = planThreatZoneWindows(
      {
        moverId: 'mover',
        fromX: 0,
        fromY: 0,
        toX: 800,
        toY: 0,
        disposition: 1,
        traversal: 'teleport',
        protectedFromReactions: false,
      },
      [zone],
      grid,
    );
    expect(skipped.windows).toHaveLength(0);
    expect(skipped.movementEvent).toBe(true);

    const intoZone = planThreatZoneWindows(
      {
        moverId: 'mover',
        fromX: 0,
        fromY: 0,
        toX: 300,
        toY: 0,
        disposition: 1,
        traversal: 'teleport',
        protectedFromReactions: false,
      },
      [zone],
      grid,
    );
    expect(intoZone.windows.map((w) => w.kind)).toEqual(['entry']);

    const outOfZone = planThreatZoneWindows(
      {
        moverId: 'mover',
        fromX: 300,
        fromY: 0,
        toX: 800,
        toY: 0,
        disposition: 1,
        traversal: 'teleport',
        protectedFromReactions: false,
      },
      [zone],
      grid,
    );
    expect(outOfZone.windows.map((w) => `${w.kind}:${w.when}`)).toEqual(['exit:before-update']);
  });

  it('drives the opener from a Foundry-style token update', async () => {
    const opened: ThreatWindow[] = [];
    setThreatZoneOpener(async (window) => {
      opened.push(window);
    });
    const guard = {
      id: 'guard',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      disposition: -1,
      actor: { system: { combat: { meleeReachMeters: 2, reactionsRemaining: 1 } } },
    };
    const mover = {
      id: 'mover',
      x: 500,
      y: 0,
      width: 1,
      height: 1,
      disposition: 1,
      getFlag: () => 'path',
      actor: {},
    };
    await resolveThreatZoneOnTokenChange(mover, { x: 150, y: 0 }, 'after-update', [mover, guard]);
    expect(opened.some((w) => w.kind === 'entry' && w.reactorId === 'guard')).toBe(true);

    opened.length = 0;
    const leaving = { ...mover, x: 100, getFlag: () => 'safe' };
    await resolveThreatZoneOnTokenChange(leaving, { x: 700, y: 0 }, 'before-update', [leaving, guard]);
    expect(opened).toHaveLength(0);
    setThreatZoneOpener(null);
  });
});
