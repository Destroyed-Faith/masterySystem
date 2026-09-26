/**
 * Portrait and prototype-token artwork.
 *
 * The sheet used to copy the portrait onto the token only in memory, so the
 * token slot looked right and a placed token kept the old image. A portrait
 * change now also updates the token when the token is still following the
 * portrait. A token change is stored on the prototype and copied onto placed
 * tokens that still show that old image.
 */

export const DEFAULT_TOKEN_IMAGE = 'icons/svg/mystery-man.svg';

export function tokenUsesPortrait(tokenSrc: unknown, portraitSrc: unknown): boolean {
  const token = String(tokenSrc ?? '').trim();
  const portrait = String(portraitSrc ?? '').trim();
  if (!token || token === DEFAULT_TOKEN_IMAGE) return true;
  return !!portrait && token === portrait;
}

/** Actor update for a new portrait. Includes the token image when it still follows the portrait. */
export function artworkUpdateForPortrait(actor: any, nextPortrait: string): Record<string, string> {
  const update: Record<string, string> = { img: nextPortrait };
  if (tokenUsesPortrait(actor?.prototypeToken?.texture?.src, actor?.img)) {
    update['prototypeToken.texture.src'] = nextPortrait;
  }
  return update;
}

export function artworkUpdateForToken(nextToken: string): Record<string, string> {
  return { 'prototypeToken.texture.src': nextToken };
}

/** Placed tokens of this actor that should pick up a new token image. */
export function placedTokenIdsToRetarget(
  tokens: Array<{ id?: string; actorId?: string; texture?: { src?: string } }>,
  actorId: string,
  previousSources: string[],
): string[] {
  const previous = new Set(
    previousSources.map((src) => String(src ?? '').trim()).filter((src) => src.length > 0),
  );
  previous.add(DEFAULT_TOKEN_IMAGE);
  const id = String(actorId ?? '');
  const out: string[] = [];
  for (const token of tokens) {
    if (String(token?.actorId ?? '') !== id) continue;
    const src = String(token?.texture?.src ?? '').trim();
    if (!previous.has(src)) continue;
    if (token.id) out.push(String(token.id));
  }
  return out;
}
