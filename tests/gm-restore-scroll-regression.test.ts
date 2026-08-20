import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sheetSrc = readFileSync(resolve('src/sheets/character-sheet.ts'), 'utf8');
const sheetCss = readFileSync(resolve('styles/character-sheet.css'), 'utf8');
const chatCss = readFileSync(resolve('styles/chat.css'), 'utf8');
const editorSrc = readFileSync(resolve('src/editor/prosemirror-font-color.ts'), 'utf8');

describe('GM restore scroll + chat composer', () => {
  it('keeps the character header fixed and scrolls only the sheet body', () => {
    expect(sheetCss).toMatch(
      /\.application\.mastery-system\.sheet\.actor\.character \.window-content \{[\s\S]*?overflow:\s*hidden;/,
    );
    expect(sheetCss).toMatch(
      /\.mastery-system\.sheet\.actor\.character \.sheet-body \{[\s\S]*?min-height:\s*0;[\s\S]*?overflow-y:\s*auto;/,
    );
    expect(sheetCss).not.toMatch(/min-height:\s*calc\(100vh - 200px\)/);
    expect(sheetSrc).toMatch(/system\.mastery\.rank': masteryRank/);
    expect(sheetSrc).toMatch(/calculateMaxPowerLevel\(masteryRank\)/);
    expect(sheetSrc).not.toMatch(/Power ranks cannot exceed Mastery Rank/);
  });

  it('preserves ApplicationV2 window-content scroll across sheet re-renders', () => {
    expect(sheetSrc).toContain("scrollPositions['window-content']");
    expect(sheetSrc).toMatch(/windowContent\.scrollTop\(scrollPositions\['window-content'\]\)/);
  });

  it('restores health/stress without Foundry auto-render scroll jumps', () => {
    expect(sheetSrc).toMatch(/#onGmRestoreHealthBar[\s\S]*?render:\s*false/);
    expect(sheetSrc).toMatch(/#onGmRestoreStressBar[\s\S]*?render:\s*false/);
    expect(sheetSrc).toContain("'flags.mastery-system.-=stressBreakdownPending'");
  });

  it('skips Mastery font-color toolbar injection for the chat composer', () => {
    expect(editorSrc).toContain('export function isChatProseMirrorContext');
    expect(editorSrc).toMatch(
      /Hooks\.on\('getProseMirrorMenuItems'[\s\S]*?if \(isChatProseMirrorContext\(menu\)\) return/,
    );
    expect(editorSrc).toMatch(
      /Hooks\.on\('getProseMirrorMenuDropDowns'[\s\S]*?if \(isChatProseMirrorContext\(menu\)\) return/,
    );
    expect(editorSrc).toMatch(
      /injectFontColorToolbarButton[\s\S]*?if \(isChatProseMirrorContext\(menu,\s*menuEl\)\) return/,
    );
  });

  it('hides the chat ProseMirror format menu so /roll typing stays usable', () => {
    expect(chatCss).toContain('#chat-message.chat-input > .menu-container');
    expect(chatCss).toMatch(/#chat-message\.chat-input\s*>\s*\.menu-container[\s\S]*?display:\s*none/);
  });
});
