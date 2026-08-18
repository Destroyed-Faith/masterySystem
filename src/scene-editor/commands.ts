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

export class CommandStack {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];
  private applying = false;

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoLabel(): string | null {
    return this.undoStack.at(-1)?.label ?? null;
  }

  get redoLabel(): string | null {
    return this.redoStack.at(-1)?.label ?? null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  async run(command: EditorCommand): Promise<void> {
    if (this.applying) return;
    this.applying = true;
    try {
      await command.do();
      this.undoStack.push(command);
      this.redoStack = [];
    } finally {
      this.applying = false;
    }
  }

  async undo(): Promise<boolean> {
    const command = this.undoStack.pop();
    if (!command) return false;
    this.applying = true;
    try {
      await command.undo();
      this.redoStack.push(command);
      return true;
    } finally {
      this.applying = false;
    }
  }

  async redo(): Promise<boolean> {
    const command = this.redoStack.pop();
    if (!command) return false;
    this.applying = true;
    try {
      await command.do();
      this.undoStack.push(command);
      return true;
    } finally {
      this.applying = false;
    }
  }
}

/** In-memory command used by tests — no Foundry documents involved. */
export function memoryCommand(
  label: string,
  apply: () => void,
  revert: () => void,
): EditorCommand {
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
