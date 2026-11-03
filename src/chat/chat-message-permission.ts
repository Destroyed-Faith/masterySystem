/**
 * ChatMessage updates are allowed for the author and the GM. Other players
 * still render the same card, and must not write its flags.
 */
export function userMayUpdateChatMessage(
  message: { canUserModify?: (user: unknown, action: string) => boolean; author?: { id?: string } | null } | null | undefined,
  user: { id?: string; isGM?: boolean } | null | undefined,
): boolean {
  if (!message || !user) return false;
  if (typeof message.canUserModify === 'function') {
    try {
      return message.canUserModify(user, 'update') === true;
    } catch {
      return false;
    }
  }
  if (user.isGM === true) return true;
  const authorId = message.author?.id ?? null;
  return authorId != null && authorId === user.id;
}
