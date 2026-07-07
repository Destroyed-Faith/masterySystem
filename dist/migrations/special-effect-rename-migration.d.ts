/**
 * One-shot GM migration: reconcile legacy Special-Effect ids/names to the
 * canonical post-reconciliation set.
 *
 *   bleeding   -> lacerate
 *   ignite     -> ruin
 *   freeze     -> slow
 *   poisoned   -> blight
 *   shock      -> disrupt      (removed effect, folded into Disrupt)
 *   blinded    -> disoriented  (removed effect, folded into Disoriented)
 *   frightened -> dread        (removed effect, folded into Dread)
 *
 * Rewrites, on every character/NPC actor (and its embedded items) plus all
 * world items:
 *   - system.statusEffects[].name / .id
 *   - system.specials[] (strings like "Bleeding(3)" or bare ids)
 *   - power specials[].key, chosenSpecial.key
 *   - mechanics.vsCondition, mechanics.condition, mechanics.conditionExpr
 *   - weapon / artifact `special` strings
 *
 * At runtime `getEffectById()` still resolves legacy ids via the alias map, so
 * un-migrated data keeps working; this migration simply normalises stored data.
 */
/**
 * Run the Special-Effect rename migration over the given actors (+ their items)
 * and all world items.
 */
export declare function runSpecialEffectRenameMigration(actors: any[]): Promise<void>;
//# sourceMappingURL=special-effect-rename-migration.d.ts.map