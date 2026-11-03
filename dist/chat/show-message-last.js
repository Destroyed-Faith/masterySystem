/**
 * Foundry reinserts an updated chat message at the top of #chat-log.
 * Split Attack strike 2 is created, then the raise-flag write moves it there.
 * Newest mastery cards are put back at the end, and any card can be sent there.
 */
import { userMayUpdateChatMessage } from './chat-message-permission.js';
const CARD_SELECTOR = '.mastery-attack-card, .mastery-damage-card, .mastery-roll, .mastery-system-damage, .mastery-heal-card';
export function chatMessageIsNewest(messageId, rows) {
    const mine = rows.find((row) => String(row.id || '') === messageId);
    const ts = Number(mine?.timestamp) || 0;
    if (ts <= 0)
        return false;
    return rows.every((row) => String(row.id || '') === messageId || (Number(row.timestamp) || 0) <= ts);
}
function attrEscape(id) {
    const css = globalThis.CSS;
    if (typeof css?.escape === 'function')
        return css.escape(id);
    return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
function chatLogs() {
    if (typeof document === 'undefined')
        return [];
    return Array.from(document.querySelectorAll('#chat-log, .chat-log'));
}
/** Move the message node to the newest end of every chat log that contains it. */
export function placeChatMessageAtNewestEnd(messageId) {
    if (!messageId)
        return false;
    let moved = false;
    const selector = `[data-message-id="${attrEscape(messageId)}"]`;
    for (const log of chatLogs()) {
        const li = log.querySelector(selector);
        if (!li)
            continue;
        const reverse = typeof getComputedStyle === 'function' &&
            getComputedStyle(log).flexDirection.endsWith('reverse');
        if (reverse) {
            if (log.firstElementChild !== li) {
                log.prepend(li);
                moved = true;
            }
        }
        else if (log.lastElementChild !== li) {
            log.appendChild(li);
            moved = true;
        }
    }
    return moved;
}
function scrollChatToEnd() {
    try {
        globalThis.ui?.chat?.scrollBottom?.();
    }
    catch {
        /* popout or sidebar not ready */
    }
}
function messageRows() {
    const messages = globalThis.game?.messages;
    if (!messages)
        return [];
    if (Array.isArray(messages.contents))
        return messages.contents;
    if (typeof messages.values === 'function')
        return Array.from(messages.values());
    return [];
}
/** If this message is the newest one, keep its node at the end after a Foundry reinsert. */
export function keepNewestChatMessageAtEnd(messageId) {
    if (!chatMessageIsNewest(messageId, messageRows()))
        return;
    if (placeChatMessageAtNewestEnd(messageId))
        scrollChatToEnd();
}
/** Author or GM bumps the timestamp so every client sorts the card last. Everyone else moves it locally. */
export async function sendChatMessageToEnd(message) {
    const id = String(message?.id || '');
    if (!id)
        return;
    try {
        const user = globalThis.game?.user;
        if (userMayUpdateChatMessage(message, user) && typeof message.update === 'function') {
            await message.update({ timestamp: Date.now() });
        }
    }
    catch (err) {
        console.warn('Mastery System | show chat message last failed', err);
    }
    placeChatMessageAtNewestEnd(id);
    scrollChatToEnd();
    setTimeout(() => {
        placeChatMessageAtNewestEnd(id);
        scrollChatToEnd();
    }, 60);
}
function masteryHost(node) {
    if (typeof node.matches === 'function' && node.matches(CARD_SELECTOR))
        return node;
    return node.querySelector?.(CARD_SELECTOR) ?? null;
}
function hookNode(html) {
    if (html instanceof HTMLElement)
        return html;
    const jq = html;
    return jq?.get?.(0) || jq?.[0] || null;
}
export function registerShowChatMessageLast() {
    const HooksAny = globalThis.Hooks;
    if (!HooksAny?.on)
        return;
    HooksAny.on('renderChatMessageHTML', (message, html) => {
        try {
            const node = hookNode(html);
            if (!node)
                return;
            const host = masteryHost(node);
            const id = String(message?.id || '');
            if (host && !host.querySelector('.ms-chat-show-last')) {
                const row = document.createElement('div');
                row.className = 'ms-chat-show-last-row';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ms-chat-show-last';
                btn.setAttribute('name', 'ms-chat-show-last');
                btn.setAttribute('form', 'ms-ui-only');
                btn.title = 'Diese Karte als letzte Nachricht im Chat anzeigen';
                btn.textContent = 'Ans Ende';
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    void sendChatMessageToEnd(message);
                });
                row.appendChild(btn);
                host.insertBefore(row, host.firstChild);
            }
            if (id) {
                keepNewestChatMessageAtEnd(id);
                setTimeout(() => keepNewestChatMessageAtEnd(id), 0);
            }
        }
        catch (err) {
            console.warn('Mastery System | show chat message last render failed', err);
        }
    });
}
//# sourceMappingURL=show-message-last.js.map