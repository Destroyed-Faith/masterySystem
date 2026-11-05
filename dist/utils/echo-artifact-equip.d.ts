/**
 * Echo-bound artifact equip + duplicate cleanup.
 *
 * Echo artifacts (Dragon Claws, Wyrm Scales, Dragon Head, …) are intrinsic to
 * the character: one embedded copy per catalog key, auto-equipped to the
 * paperdoll, never deleted by players. Duplicate embedded copies can appear
 * after a failed tree grant + fallback, or legacy migration edge cases — this
 * module dedupes them and keeps the best wired/slotted copy.
 */
export declare function getEchoArtifactKey(item: any): string | null;
/** True for Echo-bound artifacts (locked to the character). */
export declare function isEchoBoundArtifact(item: any): boolean;
/** Equip a freshly-granted Echo artifact into its paperdoll slot and lock it. */
export declare function equipEchoArtifact(actor: Actor, item: any): Promise<void>;
/** Re-apply equip flags when an Echo copy lost its slot (sync/migration drift). */
export declare function ensureEchoArtifactEquipped(actor: Actor, item: any): Promise<boolean>;
/**
 * Remove duplicate Echo artifact copies on an actor. Keeps the best copy per
 * catalog key (wired tree + slotted wins). Returns the number of items removed.
 */
export declare function dedupeEchoArtifactsOnActor(actor: Actor): Promise<number>;
/**
 * True when this Echo item should stay off the carry inventory grid.
 * Equipped / slotted Echo artifacts stay paperdoll-only. Explicitly stowed
 * copies (no equipment slot, not equipped) appear in the backpack so GMs can
 * park orphan / migration leftovers without deleting them.
 */
export declare function isEchoArtifactInventoryHidden(item: any): boolean;
/**
 * Move an actor-owned artifact off the paperdoll into the backpack inventory
 * band (`not`). Clears equipment slot / echo lock so the item is visible in
 * the inventory grid. Does not delete the item.
 */
export declare function stowArtifactToBackpack(actor: Actor, item: any): Promise<boolean>;
//# sourceMappingURL=echo-artifact-equip.d.ts.map