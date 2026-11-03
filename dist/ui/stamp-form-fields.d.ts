/**
 * Chrome's "form field has neither an id nor a name" issue fires when an
 * input/select/textarea is inserted into the document. Chat cards are stored
 * HTML, so generator fixes never reach old messages. Foundry builds each
 * message element, runs `renderChatMessageHTML`, then appends it. Stamping
 * here, synchronously, happens before that append.
 */
export declare function formFieldNameFromClass(className: unknown): string;
export declare function rootFromHookHtml(html: unknown): ParentNode | null;
export declare function stampUnnamedFormFields(root: ParentNode | null | undefined): void;
export declare function registerFormFieldStampHooks(): void;
//# sourceMappingURL=stamp-form-fields.d.ts.map