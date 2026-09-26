import { describe, expect, it } from 'vitest';
import {
  artworkUpdateForPortrait,
  artworkUpdateForToken,
  placedTokenIdsToRetarget,
  tokenUsesPortrait,
  visibleTokenSrc,
} from '../src/utils/actor-artwork.js';

describe('actor artwork', () => {
  it('overwrites a token that still shows the portrait', () => {
    const actor = {
      img: 'portrait-old.webp',
      prototypeToken: { texture: { src: 'portrait-old.webp' } },
    };
    expect(tokenUsesPortrait(actor.prototypeToken.texture.src, actor.img)).toBe(true);
    expect(artworkUpdateForPortrait(actor, 'portrait-new.webp')).toEqual({
      img: 'portrait-new.webp',
      'prototypeToken.texture.src': 'portrait-new.webp',
    });
  });

  it('keeps a distinct token image when only the portrait changes', () => {
    const actor = {
      img: 'portrait-old.webp',
      prototypeToken: { texture: { src: 'token-custom.webp' } },
    };
    expect(artworkUpdateForPortrait(actor, 'portrait-new.webp')).toEqual({
      img: 'portrait-new.webp',
    });
  });

  it('stores a chosen token image and retargets placed tokens that still show the portrait', () => {
    expect(artworkUpdateForToken('token-new.webp')).toEqual({
      'prototypeToken.texture.src': 'token-new.webp',
    });
    const ids = placedTokenIdsToRetarget(
      [
        { id: 'a', actorId: 'hero', texture: { src: 'portrait.webp' } },
        { id: 'b', actorId: 'hero', texture: { src: 'token-custom.webp' } },
        { id: 'c', actorId: 'other', texture: { src: 'portrait.webp' } },
      ],
      'hero',
      ['portrait.webp', ''],
    );
    expect(ids).toEqual(['a']);
  });

  it('reads an unlinked token texture and replaces every copy of that actor', () => {
    const npc = {
      isToken: true,
      img: 'portrait.webp',
      token: { texture: { src: 'portrait.webp' } },
      prototypeToken: { texture: { src: 'other.webp' } },
    };
    expect(visibleTokenSrc(npc)).toBe('portrait.webp');
    expect(artworkUpdateForPortrait(npc, 'portrait-new.webp')['prototypeToken.texture.src']).toBe('portrait-new.webp');
    const ids = placedTokenIdsToRetarget(
      [
        { id: 'goblin-a', actorId: 'goblin', texture: { src: 'portrait.webp' } },
        { id: 'goblin-b', actorId: 'goblin', texture: { src: '' } },
        { id: 'wolf', actorId: 'wolf', texture: { src: 'portrait.webp' } },
      ],
      'goblin',
      ['portrait.webp'],
      true,
    );
    expect(ids).toEqual(['goblin-a', 'goblin-b']);
  });
});
