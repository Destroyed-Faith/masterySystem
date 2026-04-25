/**
 * Templates Cutover — Hard Reset Power Items.
 *
 * One-time migration that runs exactly once per world at Foundry's `ready`
 * hook (GM only). Removes every `item.type === 'power'` document from every
 * Actor and clears legacy tree-related flags from Artifact items so players
 * re-select their powers from the new Template catalog.
 *
 * Rerun guard:
 *   `game.settings.get('mastery-system', 'templatesCutoverRun') === true`
 *
 * See plan §7.
 */
/** Register the cutover world-setting once at init time. */
export declare function registerTemplatesCutoverSetting(): void;
/** Execute the one-shot Trees → Templates cutover. Idempotent per world. */
export declare function runTemplatesCutover(): Promise<void>;
//# sourceMappingURL=templates-cutover.d.ts.map