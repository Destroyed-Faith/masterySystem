/**
 * Chrome's "form field has neither an id nor a name" issue fires when an
 * input/select/textarea is inserted into the document. Chat cards are stored
 * HTML, so generator fixes never reach old messages. Foundry builds each
 * message element, runs `renderChatMessageHTML`, then appends it. Stamping
 * here, synchronously, happens before that append.
 */
const FIELD_SELECTOR = 'input, select, textarea';
export function formFieldNameFromClass(className) {
    const text = typeof className === 'string' ? className : '';
    const cls = text.split(/\s+/).find((part) => part && !part.startsWith('fa'));
    const raw = (cls || 'field').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'field';
    return raw.startsWith('ms-') ? raw : `ms-${raw}`;
}
export function rootFromHookHtml(html) {
    if (!html || typeof html !== 'object')
        return null;
    const jq = html;
    if (jq.jquery && typeof jq.length === 'number' && jq.length > 0) {
        const first = jq[0];
        if (first && typeof first.querySelectorAll === 'function') {
            return first;
        }
        return null;
    }
    if (typeof html.querySelectorAll === 'function')
        return html;
    return null;
}
export function stampUnnamedFormFields(root) {
    if (!root || typeof root.querySelectorAll !== 'function')
        return;
    let nodes;
    try {
        nodes = root.querySelectorAll(FIELD_SELECTOR);
    }
    catch {
        return;
    }
    const list = Array.from(nodes);
    if (typeof Element !== 'undefined' &&
        root instanceof Element &&
        /^(INPUT|SELECT|TEXTAREA)$/.test(root.tagName)) {
        list.unshift(root);
    }
    for (const node of list) {
        const el = node;
        if (el.id)
            continue;
        if (el.getAttribute('name'))
            continue;
        el.setAttribute('name', formFieldNameFromClass(el.className));
        if (!el.getAttribute('form'))
            el.setAttribute('form', 'ms-ui-only');
    }
}
let stampHooksRegistered = false;
export function registerFormFieldStampHooks() {
    if (stampHooksRegistered)
        return;
    stampHooksRegistered = true;
    const HooksAny = globalThis.Hooks;
    if (!HooksAny?.on)
        return;
    HooksAny.on('renderChatMessageHTML', (_message, html) => {
        stampUnnamedFormFields(rootFromHookHtml(html));
    });
}
//# sourceMappingURL=stamp-form-fields.js.map