/**
 * Summon actor sheet — NPC sheet foundation, no phases, always Friendly.
 */
import { MasteryNpcSheet } from './npc-sheet.js';
export declare class MasterySummonSheet extends MasteryNpcSheet {
    /** @override */
    static DEFAULT_OPTIONS: {
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            controls: {
                icon: string;
                label: string;
                action: string;
            }[];
        };
        actions: {
            msNpcPrintSheet: (this: any) => void;
            msCopyPictureLink: (this: any) => void;
        };
    };
    /** @override */
    static PARTS: {
        body: {
            template: string;
        };
    };
    get title(): string;
    /**
     * ApplicationV2 unions `classes` across the inheritance chain; strip the
     * parent's `character` class so character-sheet CSS never applies here.
     * Keep `npc` so the Summon sheet shares the NPC CSS foundation.
     * @override
     */
    _initializeApplicationOptions(options: any): any;
}
//# sourceMappingURL=summon-sheet.d.ts.map