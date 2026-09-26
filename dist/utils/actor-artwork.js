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
export function tokenUsesPortrait(tokenSrc, portraitSrc) {
    const token = String(tokenSrc ?? '').trim();
    const portrait = String(portraitSrc ?? '').trim();
    if (!token || token === DEFAULT_TOKEN_IMAGE)
        return true;
    return !!portrait && token === portrait;
}
/** Image currently drawn for this actor's token. Unlinked tokens keep their own texture. */
export function visibleTokenSrc(actor) {
    if (actor?.isToken)
        return String(actor?.token?.texture?.src ?? '');
    return String(actor?.prototypeToken?.texture?.src ?? '');
}
/** Actor update for a new portrait. Includes the token image when it still follows the portrait. */
export function artworkUpdateForPortrait(actor, nextPortrait) {
    const update = { img: nextPortrait };
    if (tokenUsesPortrait(visibleTokenSrc(actor), actor?.img)) {
        update['prototypeToken.texture.src'] = nextPortrait;
    }
    return update;
}
export function artworkUpdateForToken(nextToken) {
    return { 'prototypeToken.texture.src': nextToken };
}
/**
 * Placed tokens of this actor that should pick up a new token image.
 * `all` replaces every copy (explicit token edit on the base actor).
 * Otherwise only copies still showing the portrait, the old token, or no image.
 */
export function placedTokenIdsToRetarget(tokens, actorId, previousSources, all = false) {
    const previous = new Set(previousSources.map((src) => String(src ?? '').trim()).filter((src) => src.length > 0));
    previous.add(DEFAULT_TOKEN_IMAGE);
    const id = String(actorId ?? '');
    const out = [];
    for (const token of tokens) {
        if (String(token?.actorId ?? '') !== id)
            continue;
        const src = String(token?.texture?.src ?? '').trim();
        if (!all && src && !previous.has(src))
            continue;
        if (token.id)
            out.push(String(token.id));
    }
    return out;
}
//# sourceMappingURL=actor-artwork.js.map