/**
 * When a negative diminishing Special gains stacks, the struck token shakes
 * and that many coins fly into the special tray.
 */
import { type RawStatusEntry } from '../system/active-specials.js';
export declare function hudStackTotals(list: RawStatusEntry[] | null | undefined): Record<string, number>;
/** New stacks only. Decay and removal produce nothing. */
export declare function hudStackGains(before: RawStatusEntry[] | null | undefined, after: RawStatusEntry[] | null | undefined): Array<{
    id: string;
    added: number;
}>;
export declare function announceStatusGains(actor: any, before: RawStatusEntry[] | null | undefined, after: RawStatusEntry[] | null | undefined): Promise<void>;
//# sourceMappingURL=special-token-arrival.d.ts.map