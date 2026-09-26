/**
 * Portrait and prototype-token artwork.
 *
 * The sheet used to copy the portrait onto the token only in memory, so the
 * token slot looked right and a placed token kept the old image. A portrait
 * change now also updates the token when the token is still following the
 * portrait. A token change is stored on the prototype and copied onto placed
 * tokens that still show that old image.
 */
export declare const DEFAULT_TOKEN_IMAGE = "icons/svg/mystery-man.svg";
export declare function tokenUsesPortrait(tokenSrc: unknown, portraitSrc: unknown): boolean;
/** Actor update for a new portrait. Includes the token image when it still follows the portrait. */
export declare function artworkUpdateForPortrait(actor: any, nextPortrait: string): Record<string, string>;
export declare function artworkUpdateForToken(nextToken: string): Record<string, string>;
/** Placed tokens of this actor that should pick up a new token image. */
export declare function placedTokenIdsToRetarget(tokens: Array<{
    id?: string;
    actorId?: string;
    texture?: {
        src?: string;
    };
}>, actorId: string, previousSources: string[]): string[];
//# sourceMappingURL=actor-artwork.d.ts.map