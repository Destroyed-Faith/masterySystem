/**
 * Summon / Familiar actor sheet — read-focused statblock for bound familiars.
 */
import { MasteryCharacterSheet } from './character-sheet.js';
export declare class MasterySummonSheet extends MasteryCharacterSheet {
    static get defaultOptions(): any;
    get template(): string;
    getData(options?: any): Promise<any>;
    activateListeners(html: JQuery): void;
}
//# sourceMappingURL=summon-sheet.d.ts.map