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
/** True when this Echo item should never appear in the carry inventory grid. */
export declare function isEchoArtifactInventoryHidden(item: any): boolean;
//# sourceMappingURL=echo-artifact-equip.d.ts.map