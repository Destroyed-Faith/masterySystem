import { describe, expect, it } from 'vitest';
import { CommandStack, memoryCommand } from '../src/scene-editor/commands';

describe('command stack', () => {
  it('undoes and redoes a logical edit', async () => {
    const walls: string[] = [];
    const stack = new CommandStack();
    await stack.run(
      memoryCommand(
        'add',
        () => {
          walls.push('a');
        },
        () => {
          walls.pop();
        },
      ),
    );
    expect(walls).toEqual(['a']);
    expect(stack.canUndo).toBe(true);
    await stack.undo();
    expect(walls).toEqual([]);
    await stack.redo();
    expect(walls).toEqual(['a']);
  });

  it('clears redo after a new command', async () => {
    let n = 0;
    const stack = new CommandStack();
    await stack.run(memoryCommand('1', () => { n += 1; }, () => { n -= 1; }));
    await stack.undo();
    await stack.run(memoryCommand('2', () => { n += 2; }, () => { n -= 2; }));
    expect(stack.canRedo).toBe(false);
    expect(n).toBe(2);
  });
});
