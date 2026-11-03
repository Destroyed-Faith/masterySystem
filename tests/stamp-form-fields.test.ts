import { describe, expect, it } from 'vitest';
import { formFieldNameFromClass, stampUnnamedFormFields } from '../src/ui/stamp-form-fields.js';

function field(className: string, attrs: Record<string, string> = {}) {
  const store: Record<string, string> = { ...attrs };
  return {
    tagName: 'INPUT',
    id: attrs.id || '',
    className,
    getAttribute: (key: string) => (key in store ? store[key] : null),
    setAttribute: (key: string, value: string) => {
      store[key] = value;
    },
    store,
  };
}

describe('form field stamp', () => {
  it('builds a stable name from the class', () => {
    expect(formFieldNameFromClass('willing-spell-target')).toBe('ms-willing-spell-target');
    expect(formFieldNameFromClass('ms-quick-d8-count')).toBe('ms-quick-d8-count');
    expect(formFieldNameFromClass('')).toBe('ms-field');
  });

  it('names a stored attack-card control and keeps it off the chat form', () => {
    const checkbox = field('willing-spell-target');
    const select = field('raise-paid-count');
    const free = field('raise-free-count');
    stampUnnamedFormFields({ querySelectorAll: () => [checkbox, select, free] } as unknown as ParentNode);
    expect(checkbox.store.name).toBe('ms-willing-spell-target');
    expect(select.store.name).toBe('ms-raise-paid-count');
    expect(free.store.name).toBe('ms-raise-free-count');
    expect(checkbox.store.form).toBe('ms-ui-only');
    expect(free.store.form).toBe('ms-ui-only');
  });

  it('leaves a control that already has a name', () => {
    const input = field('raise-free-count', { name: 'ms-raise-free-count' });
    stampUnnamedFormFields({ querySelectorAll: () => [input] } as unknown as ParentNode);
    expect(input.store.form).toBeUndefined();
  });
});
