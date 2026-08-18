/**
 * Session undo / redo. Complex multi-document edits (wall + door + wall) are
 * one command. The stack dies with the editor session — a reload is not required
 * to keep it.
 */
export interface EditorCommand {
    label: string;
    do(): Promise<void>;
    undo(): Promise<void>;
}
export declare class CommandStack {
    private undoStack;
    private redoStack;
    private applying;
    get canUndo(): boolean;
    get canRedo(): boolean;
    get undoLabel(): string | null;
    get redoLabel(): string | null;
    clear(): void;
    run(command: EditorCommand): Promise<void>;
    undo(): Promise<boolean>;
    redo(): Promise<boolean>;
}
/** In-memory command used by tests — no Foundry documents involved. */
export declare function memoryCommand(label: string, apply: () => void, revert: () => void): EditorCommand;
//# sourceMappingURL=commands.d.ts.map