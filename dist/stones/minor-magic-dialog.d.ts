/**
 * Minor Magic Item panel — pick a purchased Active and a form.
 * Lives on the character sheet tab. Create / replace only during a Safe Haven Rest.
 */
import { type MinorMagicForm } from '../utils/minor-magic-items.js';
export declare class MinorMagicPanel {
    #private;
    actor: Actor;
    selectedPowerId: string;
    itemForm: MinorMagicForm;
    itemName: string;
    private onRefresh;
    constructor(actor: Actor, opts: {
        onRefresh: () => void | Promise<void>;
    });
    prepareContext(): Record<string, unknown>;
    bind(root: HTMLElement): void;
}
/** @deprecated Panel is on the sheet now. */
export declare const MinorMagicDialog: {
    show(actor: Actor): Promise<void>;
};
//# sourceMappingURL=minor-magic-dialog.d.ts.map