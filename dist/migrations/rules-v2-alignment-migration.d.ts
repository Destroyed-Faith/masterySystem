/**
 * Rules v2 alignment — one-shot world migration.
 *
 * Strips obsolete Saving Throw fields, migrates `spellResolution: saveSpell`
 * → `spellAttack`, deletes removed Special statuses (Dread / Frightened /
 * Disrupt / Shock) after the rename pass has remapped what it can, and clears
 * obsolete Active Buff Special Application template ids from power items.
 *
 * Guard: `game.settings.get('mastery-system', 'rulesV2AlignmentRun') === true`
 */
export declare function registerRulesV2AlignmentMigrationSetting(): void;
/** Execute the one-shot Rules v2 alignment. Idempotent per world. */
export declare function runRulesV2AlignmentMigration(actors: any[]): Promise<void>;
//# sourceMappingURL=rules-v2-alignment-migration.d.ts.map