import { describe, expect, it } from 'vitest';
import {
  artworkUpdateForPortrait,
  artworkUpdateForToken,
  placedTokenIdsToRetarget,
  tokenUsesPortrait,
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
});
