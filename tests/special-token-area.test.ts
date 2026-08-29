import { describe, expect, it, afterEach } from 'vitest';
import { listHudDiminishingSpecials } from '../src/combat/special-application.js';
import {
  actorInCombat,
  resolveCombatantActor,
  resolveSpecialTokenHudActor,
} from '../src/ui/special-token-area.js';
import { specialTokenAsset, SPECIAL_TOKEN_FALLBACK } from '../src/ui/special-token-assets.js';
import {
  SPECIAL_TOKEN_STACK_MAX,
  autoArrangeTokens,
  moveTokenInLayout,
  syncSpecialTokenViews,
  tokenInstanceId,
} from '../src/ui/special-token-layout.js';

describe('special token views', () => {
  it('creates one token element spec per stack point', () => {
    const { tokens } = syncSpecialTokenViews(
      [{ id: 'challenge', value: 6, label: 'Challenge' }],
      {},
    );
    expect(tokens).toHaveLength(6);
    expect(tokens.map((t) => t.id)).toEqual([
      'challenge:0',
      'challenge:1',
      'challenge:2',
      'challenge:3',
      'challenge:4',
      'challenge:5',
    ]);
    expect(tokens.every((t) => t.specialId === 'challenge')).toBe(true);
    expect(tokens.every((t) => t.asset === SPECIAL_TOKEN_FALLBACK)).toBe(true);
  });

  it('drops the highest indices when the actor value shrinks', () => {
    const first = syncSpecialTokenViews([{ id: 'challenge', value: 6, label: 'Challenge' }], {});
    first.layout['challenge:1'] = { x: 0.4, y: 0.5, z: 4 };
    const next = syncSpecialTokenViews(
      [{ id: 'challenge', value: 4, label: 'Challenge' }],
      first.layout,
    );
    expect(next.tokens).toHaveLength(4);
    expect(next.tokens.map((t) => t.id).sort()).toEqual([
      'challenge:0',
      'challenge:1',
      'challenge:2',
      'challenge:3',
    ]);
    expect(next.layout['challenge:1']).toEqual({ x: 0.4, y: 0.5, z: 4 });
    expect(next.layout['challenge:5']).toBeUndefined();
  });

  it('keeps stored positions and parks new tokens beside the same Special', () => {
    const stored = {
      [tokenInstanceId('challenge', 0)]: { x: 0.2, y: 0.4, z: 1 },
      [tokenInstanceId('challenge', 1)]: { x: 0.22, y: 0.35, z: 2 },
    };
    const next = syncSpecialTokenViews(
      [{ id: 'challenge', value: 3, label: 'Challenge' }],
      stored,
    );
    expect(next.layout['challenge:0']).toEqual(stored['challenge:0']);
    expect(next.layout['challenge:1']).toEqual(stored['challenge:1']);
    expect(next.layout['challenge:2']?.x).toBeGreaterThan(stored['challenge:1']!.x);
  });

  it('auto-arranges towers without exceeding the stack max', () => {
    expect(SPECIAL_TOKEN_STACK_MAX).toBe(8);
    const layout = autoArrangeTokens(
      [
        { id: 'challenge', value: 9, label: 'Challenge' },
        { id: 'blight', value: 2, label: 'Blight' },
      ],
      8,
    );
    expect(Object.keys(layout)).toHaveLength(11);
    expect(layout['challenge:0']).toBeTruthy();
    expect(layout['challenge:8']).toBeTruthy();
    expect(layout['blight:0']?.x).not.toBe(layout['challenge:0']?.x);
  });

  it('raises z-order when a token is moved', () => {
    const moved = moveTokenInLayout(
      {
        'challenge:0': { x: 0.1, y: 0.2, z: 1 },
        'challenge:1': { x: 0.2, y: 0.2, z: 2 },
      },
      'challenge:0',
      0.5,
      0.6,
    );
    expect(moved['challenge:0']?.z).toBeGreaterThan(moved['challenge:1']?.z ?? 0);
    expect(moved['challenge:0']?.x).toBeCloseTo(0.5);
  });

  it('hides Root, Grounded stand-ins, and Regeneration from the HUD list', () => {
    const actor = {
      system: {
        statusEffects: [
          { id: 'root', value: 2 },
          { id: 'stunned', value: 1 },
          { id: 'prone', value: 1 },
          { id: 'regeneration', value: 3 },
          { id: 'challenge', value: 1 },
        ],
      },
    };
    expect(listHudDiminishingSpecials(actor).map((s) => s.id)).toEqual(['challenge']);
  });

  it('uses the Challenge 1er art as the fallback for every Special', () => {
    expect(specialTokenAsset('blight')).toBe(SPECIAL_TOKEN_FALLBACK);
    expect(specialTokenAsset('challenge')).toBe(SPECIAL_TOKEN_FALLBACK);
  });

  it('builds three Sundered tokens from the actor stack', () => {
    const specials = listHudDiminishingSpecials({
      system: { statusEffects: [{ id: 'sundered', value: 3 }] },
    });
    const { tokens } = syncSpecialTokenViews(specials, {});
    expect(specials).toEqual([{ id: 'sundered', value: 3, label: 'Sundered' }]);
    expect(tokens).toHaveLength(3);
    expect(tokens.every((t) => t.specialId === 'sundered')).toBe(true);
  });
});

describe('special token HUD actor restore', () => {
  afterEach(() => {
    delete (globalThis as any).game;
    delete (globalThis as any).canvas;
  });

  it('finds an actor by combatant actorId after a character switch', () => {
    const oda = {
      id: 'oda',
      uuid: 'Actor.oda',
      isOwner: true,
      system: { statusEffects: [{ id: 'sundered', value: 3 }] },
    };
    const combat = {
      started: true,
      round: 2,
      combatants: [{ actorId: 'oda' }],
      combatant: { actorId: 'oda' },
    };
    const actors = { get: (id: string) => (id === 'oda' ? oda : null) };
    expect(resolveCombatantActor(combat.combatants[0], actors)).toBe(oda);
    expect(actorInCombat(oda, combat, actors)).toBe(true);

    (globalThis as any).game = {
      combat,
      actors,
      user: { isGM: false, character: oda },
    };
    (globalThis as any).canvas = { tokens: { controlled: [] } };
    expect(resolveSpecialTokenHudActor()).toBe(oda);
    expect(listHudDiminishingSpecials(resolveSpecialTokenHudActor())).toHaveLength(1);
  });

  it('prefers the controlled combatant when the assigned character is someone else', () => {
    const other = {
      id: 'other',
      uuid: 'Actor.other',
      isOwner: true,
      system: { statusEffects: [] },
    };
    const oda = {
      id: 'oda',
      uuid: 'Actor.oda',
      isOwner: true,
      system: { statusEffects: [{ id: 'sundered', value: 3 }] },
    };
    const combat = {
      started: true,
      combatants: [{ actorId: 'other', actor: other }, { actorId: 'oda', actor: oda }],
      combatant: { actorId: 'other', actor: other },
    };
    (globalThis as any).game = {
      combat,
      actors: { get: (id: string) => (id === 'oda' ? oda : id === 'other' ? other : null) },
      user: { isGM: false, character: other },
    };
    (globalThis as any).canvas = { tokens: { controlled: [{ actor: oda }] } };
    expect(resolveSpecialTokenHudActor()).toBe(oda);
  });
});
