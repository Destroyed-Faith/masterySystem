/**
 * GM review dialog for the Actives v0.9.9.6 migration. Shows the dry-run
 * report; Apply runs only after explicit confirmation and downloads a JSON
 * backup first. Never deletes documents.
 */
import { type V0996Report } from './actives-v0996-migration.js';
declare const ActivesV0996ReviewDialog_base: any;
export declare class ActivesV0996ReviewDialog extends ActivesV0996ReviewDialog_base {
    #private;
    static DEFAULT_OPTIONS: {
        id: string;
        tag: string;
        window: {
            title: string;
            resizable: boolean;
        };
        position: {
            width: number;
            height: number;
        };
    };
    constructor(report?: V0996Report);
    _prepareContext(): Promise<Record<string, unknown>>;
    _onRender(context: unknown, options: unknown): void;
    _replaceHTML(result: string, content: HTMLElement, _options: unknown): void;
    _renderHTML(_context: unknown, _options: unknown): Promise<string>;
}
export declare function openActivesV0996Review(report?: V0996Report): ActivesV0996ReviewDialog | null;
export {};
//# sourceMappingURL=actives-v0996-review-dialog.d.ts.map