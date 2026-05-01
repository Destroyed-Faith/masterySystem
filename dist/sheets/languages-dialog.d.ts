/**
 * Dialog: pick the character's known languages.
 *
 * Source: Players Guide 3100–3127 ("Choose a Language").
 *
 * Every character speaks the **Common Tongue**. At creation they pick
 * **one additional language** from the canon list. After creation the
 * GM may grant extras (story hooks, downtime, mentor NPCs); the dialog
 * therefore allows multi-select but flags the "1 extra at creation"
 * threshold for the validation banner.
 */
/**
 * Open the language picker for the supplied actor. Persists the chosen
 * languages to `system.languages.known`.
 */
export declare function showLanguagesDialog(actor: any): Promise<void>;
//# sourceMappingURL=languages-dialog.d.ts.map