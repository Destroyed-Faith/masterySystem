/**
 * Dialog: pick the character's known languages.
 *
 * Source: Players Guide 3100–3127 ("Choose a Language").
 *
 * Every character speaks the **Common Tongue**. At creation they pick
 * **one additional language** from the canon list — unless their Echo
 * locks that slot (Elorian, Dragonborn, Dwarf, Sentinel). After creation
 * the GM may grant extras; the locked Echo language still cannot be removed.
 */
/**
 * Open the language picker for the supplied actor. Persists the chosen
 * languages to `system.languages.known`.
 */
export declare function showLanguagesDialog(actor: any): Promise<void>;
//# sourceMappingURL=languages-dialog.d.ts.map