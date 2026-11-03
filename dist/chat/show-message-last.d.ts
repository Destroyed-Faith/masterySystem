/**
 * Foundry reinserts an updated chat message at the top of #chat-log.
 * Split Attack strike 2 is created, then the raise-flag write moves it there.
 * Newest mastery cards are put back at the end, and any card can be sent there.
 */
export declare function chatMessageIsNewest(messageId: string, rows: Array<{
    id?: string;
    timestamp?: number;
}>): boolean;
/** Move the message node to the newest end of every chat log that contains it. */
export declare function placeChatMessageAtNewestEnd(messageId: string): boolean;
/** If this message is the newest one, keep its node at the end after a Foundry reinsert. */
export declare function keepNewestChatMessageAtEnd(messageId: string): void;
/** Author or GM bumps the timestamp so every client sorts the card last. Everyone else moves it locally. */
export declare function sendChatMessageToEnd(message: any): Promise<void>;
export declare function registerShowChatMessageLast(): void;
//# sourceMappingURL=show-message-last.d.ts.map