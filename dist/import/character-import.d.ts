/**
 * Import homepage character JSON into Foundry actors.
 */
import { type CharacterImportDocument, type CharacterImportResult } from './character-import-types.js';
import { parseCharacterImportJson, validateCharacterImportDocument, validateCharacterImportJson } from './character-import-validation.js';
export { parseCharacterImportJson, validateCharacterImportDocument, validateCharacterImportJson };
/**
 * Import a parsed document and create a new character actor.
 * Requires a GM-connected client with permission to create actors.
 */
export declare function importMasteryCharacter(doc: CharacterImportDocument): Promise<CharacterImportResult>;
/** Parse JSON text and import. */
export declare function importMasteryCharacterFromJson(text: string): Promise<CharacterImportResult>;
export declare function importMasteryCharacterFromFile(file: File): Promise<CharacterImportResult>;
//# sourceMappingURL=character-import.d.ts.map