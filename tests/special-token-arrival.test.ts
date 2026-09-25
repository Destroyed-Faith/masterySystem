import { describe, expect, it } from 'vitest';
import { hudStackGains } from '../src/ui/special-token-arrival';

describe('special token arrivals', () => {
  it('flies one coin per new stack and ignores decay', () => {
    expect(hudStackGains(
      [{ id: 'hex', value: 1 }],
      [{ id: 'hex', value: 3 }, { id: 'slow', value: 1 }],
    )).toEqual([
      { id: 'hex', added: 2 },
      { id: 'slow', added: 1 },
    ]);
    expect(hudStackGains([{ id: 'blight', value: 4 }], [{ id: 'blight', value: 2 }])).toEqual([]);
  });
});