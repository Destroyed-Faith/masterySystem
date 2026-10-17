/**
 * GM-started Pursuit. One fleeing creature and one pursuer.
 * Each exchange is one Opposed Attribute Contest. The track starts at 0.
 */
export declare const PURSUIT_ATTRIBUTES: readonly ["agility", "might", "vitality"];
export type PursuitAttribute = (typeof PURSUIT_ATTRIBUTES)[number];
export type PursuitStatus = 'active' | 'escape' | 'caught';
export type PursuitWinner = 'fleeing' | 'pursuer' | 'tie';
export interface PursuitExchange {
    id: string;
    fleeingAttribute: PursuitAttribute;
    pursuerAttribute: PursuitAttribute;
    fleeingTotal: number;
    pursuerTotal: number;
    fleeingDice: number[];
    pursuerDice: number[];
    winner: PursuitWinner;
    trackBefore: number;
    trackAfter: number;
    ended?: 'escape' | 'caught';
}
export interface PursuitRecord {
    id: string;
    fleeingActorId: string;
    pursuerActorId: string;
    fleeingName: string;
    pursuerName: string;
    track: number;
    status: PursuitStatus;
    allowedAttributes: PursuitAttribute[];
    exchanges: PursuitExchange[];
}
export declare function readPursuit(combat: any): PursuitRecord | null;
export declare function startPursuit(input: {
    combat: any;
    fleeing: any;
    pursuer: any;
    allowedAttributes?: PursuitAttribute[];
}): Promise<{
    ok: boolean;
    pursuit?: PursuitRecord;
    reason?: string;
}>;
export declare function pursuitChatHtml(pursuit: PursuitRecord, exchange: PursuitExchange): string;
export declare function renderPursuitHtml(pursuit: PursuitRecord | null): string;
export declare function resolvePursuitExchange(input: {
    combat: any;
    fleeingActor: any;
    pursuerActor: any;
    fleeingAttribute: PursuitAttribute;
    pursuerAttribute: PursuitAttribute;
    exchangeKey?: string;
}): Promise<{
    ok: boolean;
    pursuit?: PursuitRecord;
    exchange?: PursuitExchange;
    duplicate?: boolean;
    reason?: string;
}>;
//# sourceMappingURL=pursuit.d.ts.map