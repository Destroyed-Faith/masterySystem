/**
 * ChatMessage updates are allowed for the author and the GM. Other players
 * still render the same card, and must not write its flags.
 */
export declare function userMayUpdateChatMessage(message: {
    canUserModify?: (user: unknown, action: string) => boolean;
    author?: {
        id?: string;
    } | null;
} | null | undefined, user: {
    id?: string;
    isGM?: boolean;
} | null | undefined): boolean;
//# sourceMappingURL=chat-message-permission.d.ts.map