/**
 * Session undo / redo. Complex multi-document edits (wall + door + wall) are
 * one command. The stack dies with the editor session — a reload is not required
 * to keep it.
 */
export class CommandStack {
    undoStack = [];
    redoStack = [];
    applying = false;
    get canUndo() {
        return this.undoStack.length > 0;
    }
    get canRedo() {
        return this.redoStack.length > 0;
    }
    get undoLabel() {
        return this.undoStack.at(-1)?.label ?? null;
    }
    get redoLabel() {
        return this.redoStack.at(-1)?.label ?? null;
    }
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
    async run(command) {
        if (this.applying)
            return;
        this.applying = true;
        try {
            await command.do();
            this.undoStack.push(command);
            this.redoStack = [];
        }
        finally {
            this.applying = false;
        }
    }
    async undo() {
        const command = this.undoStack.pop();
        if (!command)
            return false;
        this.applying = true;
        try {
            await command.undo();
            this.redoStack.push(command);
            return true;
        }
        finally {
            this.applying = false;
        }
    }
    async redo() {
        const command = this.redoStack.pop();
        if (!command)
            return false;
        this.applying = true;
        try {
            await command.do();
            this.undoStack.push(command);
            return true;
        }
        finally {
            this.applying = false;
        }
    }
}
/** In-memory command used by tests — no Foundry documents involved. */
export function memoryCommand(label, apply, revert) {
    return {
        label,
        async do() {
            apply();
        },
        async undo() {
            revert();
        },
    };
}
//# sourceMappingURL=commands.js.map