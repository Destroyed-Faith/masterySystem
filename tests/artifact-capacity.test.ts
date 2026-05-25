import { describe, expect, it } from 'vitest';
import {
    ARTIFACT_CAPACITY_DEFAULT,
    canBindMoreArtifacts,
    countBoundArtifacts,
    getArtifactBindingKind,
} from '../src/utils/artifact-actor-rules.js';

interface MockItem {
    type: string;
    system?: { binding?: string };
    _flags?: Record<string, Record<string, unknown>>;
    getFlag?: (ns: string, k: string) => unknown;
}

function mkItem(opts: {
    binding?: string;
    echoBound?: boolean;
    type?: string;
}): MockItem {
    const flags: Record<string, Record<string, unknown>> = {};
    if (opts.echoBound) {
        flags['mastery-system'] = { echoBound: true };
    }
    const item: MockItem = {
        type: opts.type ?? 'artifact',
        system: { binding: opts.binding },
        _flags: flags,
    };
    item.getFlag = function (ns: string, k: string): unknown {
        return this._flags?.[ns]?.[k];
    };
    return item;
}

function mkActor(items: MockItem[]): { items: { filter: (fn: (it: MockItem) => boolean) => MockItem[] } } {
    return {
        items: {
            filter(fn) {
                return items.filter(fn);
            },
        },
    } as any;
}

describe('ARTIFACT_CAPACITY_DEFAULT', () => {
    it('is exactly 4 per spec', () => {
        expect(ARTIFACT_CAPACITY_DEFAULT).toBe(4);
    });
});

describe('getArtifactBindingKind', () => {
    it('returns "echo" when the item has the echoBound flag', () => {
        const it = mkItem({ echoBound: true });
        expect(getArtifactBindingKind(it)).toBe('echo');
    });

    it('returns "echo" when system.binding === "echo"', () => {
        const it = mkItem({ binding: 'echo' });
        expect(getArtifactBindingKind(it)).toBe('echo');
    });

    it('returns "bound" when system.binding === "bound"', () => {
        const it = mkItem({ binding: 'bound' });
        expect(getArtifactBindingKind(it)).toBe('bound');
    });

    it('returns "unbound" by default', () => {
        const it = mkItem({});
        expect(getArtifactBindingKind(it)).toBe('unbound');
    });
});

describe('countBoundArtifacts / canBindMoreArtifacts', () => {
    it('counts bound and echo artifacts, ignoring unbound and non-artifact items', () => {
        const actor = mkActor([
            mkItem({ binding: 'bound' }),
            mkItem({ echoBound: true }),
            mkItem({ binding: 'unbound' }),
            mkItem({ type: 'weapon', binding: 'bound' }),
        ]);
        expect(countBoundArtifacts(actor)).toBe(2);
    });

    it('canBindMoreArtifacts is true while under capacity', () => {
        const actor = mkActor([
            mkItem({ binding: 'bound' }),
            mkItem({ binding: 'bound' }),
            mkItem({ binding: 'bound' }),
        ]);
        expect(countBoundArtifacts(actor)).toBe(3);
        expect(canBindMoreArtifacts(actor)).toBe(true);
    });

    it('canBindMoreArtifacts is false at exactly ARTIFACT_CAPACITY_DEFAULT', () => {
        const items: MockItem[] = [];
        for (let i = 0; i < ARTIFACT_CAPACITY_DEFAULT; i++) {
            items.push(mkItem({ binding: 'bound' }));
        }
        const actor = mkActor(items);
        expect(canBindMoreArtifacts(actor)).toBe(false);
    });

    it('echo-bound artifacts always count toward capacity', () => {
        const items: MockItem[] = [];
        for (let i = 0; i < ARTIFACT_CAPACITY_DEFAULT; i++) {
            items.push(mkItem({ echoBound: true }));
        }
        const actor = mkActor(items);
        expect(countBoundArtifacts(actor)).toBe(ARTIFACT_CAPACITY_DEFAULT);
        expect(canBindMoreArtifacts(actor)).toBe(false);
    });

    it('handles actors without items gracefully', () => {
        expect(countBoundArtifacts(null)).toBe(0);
        expect(countBoundArtifacts({} as any)).toBe(0);
        expect(canBindMoreArtifacts(null)).toBe(true);
    });
});
