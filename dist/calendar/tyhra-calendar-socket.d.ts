/**
 * Players often cannot create JournalEntry documents. A connected GM
 * creates the day journal; the requesting client opens it when it arrives.
 */
export declare function registerTyhraCalendarSocket(): void;
export declare function requestGmCreateDayJournal(dayIndex: number): Promise<JournalEntry | null>;
//# sourceMappingURL=tyhra-calendar-socket.d.ts.map