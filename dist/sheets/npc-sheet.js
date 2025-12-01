/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */
import { MasteryCharacterSheet } from './character-sheet.js';
export class MasteryNpcSheet extends MasteryCharacterSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['mastery-system', 'sheet', 'actor', 'npc'],
            template: 'systems/mastery-system/templates/actor/npc-sheet.hbs',
            width: 600,
            height: 700
        });
    }
    /** @override */
    get template() {
        return 'systems/mastery-system/templates/actor/npc-sheet.hbs';
    }
}
//# sourceMappingURL=npc-sheet.js.map