/**
 * Summon actor sheet — NPC sheet foundation, no phases, always Friendly.
 */
import { MasteryNpcSheet } from './npc-sheet.js';
export class MasterySummonSheet extends MasteryNpcSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        ...MasteryNpcSheet.DEFAULT_OPTIONS,
        classes: ['npc', 'summon'],
        position: { width: 720, height: 820 },
    };
    /** @override */
    static PARTS = {
        body: {
            template: 'systems/mastery-system/templates/actor/npc-sheet.hbs',
        },
    };
    get title() {
        const name = String(this.document?.name ?? '').trim();
        return name ? `Summon: ${name}` : 'Summon';
    }
    /**
     * ApplicationV2 unions `classes` across the inheritance chain; strip the
     * parent's `character` class so character-sheet CSS never applies here.
     * Keep `npc` so the Summon sheet shares the NPC CSS foundation.
     * @override
     */
    _initializeApplicationOptions(options) {
        const opts = super._initializeApplicationOptions(options);
        opts.classes = (opts.classes || []).filter((c) => c !== 'character');
        if (!opts.classes.includes('npc'))
            opts.classes.push('npc');
        if (!opts.classes.includes('summon'))
            opts.classes.push('summon');
        return opts;
    }
}
//# sourceMappingURL=summon-sheet.js.map