/**
 * GM dialog — import a homepage character JSON file.
 */
declare const BaseDialog: any;
export declare class CharacterImportDialog extends BaseDialog {
    private jsonText;
    private validationMessage;
    private validationOk;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            title: string;
            resizable: boolean;
        };
    };
    static PARTS: {
        body: {
            template: string;
        };
    };
    protected _prepareContext(_options: unknown): Promise<Record<string, unknown>>;
    protected _onRender(context: unknown, options: unknown): void;
}
export declare function showCharacterImportDialog(): void;
export {};
//# sourceMappingURL=character-import-dialog.d.ts.map