/**
 * Chrome's "form field has neither an id nor a name" issue fires when an
 * input/select/textarea is inserted into the document. Chat cards are stored
 * HTML, so generator fixes never reach old messages. Foundry builds each
 * message element, runs `renderChatMessageHTML`, then appends it. Stamping
 * here, synchronously, happens before that append.
 */

const FIELD_SELECTOR = 'input, select, textarea';

export function formFieldNameFromClass(className: unknown): string {
  const text = typeof className === 'string' ? className : '';
  const cls = text.split(/\s+/).find((part) => part && !part.startsWith('fa'));
  const raw = (cls || 'field').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'field';
  return raw.startsWith('ms-') ? raw : `ms-${raw}`;
}

export function rootFromHookHtml(html: unknown): ParentNode | null {
  if (!html || typeof html !== 'object') return null;
  const jq = html as { jquery?: unknown; length?: number; 0?: unknown };
  if (jq.jquery && typeof jq.length === 'number' && jq.length > 0) {
    const first = jq[0];
    if (first && typeof (first as ParentNode).querySelectorAll === 'function') {
      return first as ParentNode;
    }
    return null;
  }
  if (typeof (html as ParentNode).querySelectorAll === 'function') return html as ParentNode;
  return null;
}

export function stampUnnamedFormFields(root: ParentNode | null | undefined): void {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  let nodes: ArrayLike<Element>;
  try {
    nodes = root.querySelectorAll(FIELD_SELECTOR);
  } catch {
    return;
  }
  const list: Element[] = Array.from(nodes);
  if (
    typeof Element !== 'undefined' &&
    root instanceof Element &&
    /^(INPUT|SELECT|TEXTAREA)$/.test(root.tagName)
  ) {
    list.unshift(root);
  }
  for (const node of list) {
    const el = node as HTMLElement;
    if (el.id) continue;
    if (el.getAttribute('name')) continue;
    el.setAttribute('name', formFieldNameFromClass(el.className));
    if (!el.getAttribute('form')) el.setAttribute('form', 'ms-ui-only');
  }
}

let stampHooksRegistered = false;

export function registerFormFieldStampHooks(): void {
  if (stampHooksRegistered) return;
  stampHooksRegistered = true;
  const HooksAny = (globalThis as { Hooks?: { on?: (name: string, fn: (...args: unknown[]) => void) => void } }).Hooks;
  if (!HooksAny?.on) return;
  HooksAny.on('renderChatMessageHTML', (_message: unknown, html: unknown) => {
    stampUnnamedFormFields(rootFromHookHtml(html));
  });
}
