import { describe, expect, it } from 'vitest';
import { userMayUpdateChatMessage } from '../src/chat/chat-message-permission.js';

describe('userMayUpdateChatMessage', () => {
  it('lets the author and the GM update a chat card', () => {
    const message = {
      canUserModify: (user: { id?: string; isGM?: boolean }) => user.id === 'oda' || user.isGM === true,
    };
    expect(userMayUpdateChatMessage(message, { id: 'oda' })).toBe(true);
    expect(userMayUpdateChatMessage(message, { id: 'gm', isGM: true })).toBe(true);
  });

  it('refuses another player, even when the card is only being rendered', () => {
    const message = {
      canUserModify: (user: { id?: string }) => user.id === 'oda',
    };
    expect(userMayUpdateChatMessage(message, { id: 'diego' })).toBe(false);
    expect(userMayUpdateChatMessage(message, null)).toBe(false);
    expect(userMayUpdateChatMessage(null, { id: 'diego' })).toBe(false);
  });

  it('falls back to author id when canUserModify is missing', () => {
    const message = { author: { id: 'oda' } };
    expect(userMayUpdateChatMessage(message, { id: 'oda' })).toBe(true);
    expect(userMayUpdateChatMessage(message, { id: 'diego' })).toBe(false);
    expect(userMayUpdateChatMessage(message, { id: 'gm', isGM: true })).toBe(true);
  });
});
