import { describe, expect, it, vi } from 'vitest';
import {
  buildActorSheetIdentityContext,
  isUnlinkedTokenActor,
  resolveOriginalActorFromTokenActor,
  userCanViewActor,
} from '../src/sheets/actor-sheet-identity';

describe('actor sheet identity', () => {
  it('treats isToken synthetic actors as unlinked', () => {
    expect(isUnlinkedTokenActor({ isToken: true, token: { actorId: 'a1', actorLink: false } })).toBe(
      true,
    );
    expect(isUnlinkedTokenActor({ isToken: false, id: 'a1' })).toBe(false);
    expect(isUnlinkedTokenActor(null)).toBe(false);
  });

  it('never flags a world / linked Actor as unlinked', () => {
    // Opening a linked token opens the world Actor — isToken is false.
    const world = { isToken: false, id: 'hero', name: 'Hero' };
    const ctx = buildActorSheetIdentityContext(world);
    expect(ctx.isUnlinkedToken).toBe(false);
    expect(ctx.showOriginalBadge).toBe(true);
    expect(ctx.canOpenOriginal).toBe(false);
  });

  it('resolves the original Actor from token.actorId when permitted', () => {
    const original = {
      id: 'hero',
      name: 'Hero',
      testUserPermission: vi.fn(() => true),
    };
    (globalThis as any).game = {
      user: { id: 'u1', isGM: false },
      actors: { get: (id: string) => (id === 'hero' ? original : null) },
    };
    const synthetic = {
      isToken: true,
      id: 'synth',
      name: 'Hero',
      token: { actorId: 'hero', actorLink: false },
    };
    expect(resolveOriginalActorFromTokenActor(synthetic)).toBe(original);
    const ctx = buildActorSheetIdentityContext(synthetic);
    expect(ctx.isUnlinkedToken).toBe(true);
    expect(ctx.canOpenOriginal).toBe(true);
    expect(ctx.originalActorId).toBe('hero');
  });

  it('hides Open Original when the user lacks permission', () => {
    const original = {
      id: 'hero',
      name: 'Hero',
      testUserPermission: vi.fn(() => false),
    };
    (globalThis as any).game = {
      user: { id: 'u1', isGM: false },
      actors: { get: () => original },
    };
    const synthetic = {
      isToken: true,
      token: { actorId: 'hero', actorLink: false },
    };
    expect(userCanViewActor(original)).toBe(false);
    expect(buildActorSheetIdentityContext(synthetic).canOpenOriginal).toBe(false);
  });
});
