/**
 * Read-only identity preflight (Batch B / plan §9.2, K4).
 * Never writes documents. Used by audit:identity, GM whispers, and report export.
 */
import type { UnresolvedPowerIdentity } from './power-identity.js';
export type IdentityPreflightScope = {
    kind: 'world';
} | {
    kind: 'actor';
    actor: any;
} | {
    kind: 'packs';
} | {
    kind: 'catalog';
};
export type IdentityPreflightAffected = 'activation' | 'armor-evade-dr' | 'reaction' | 'passive-rider' | 'buff-mechanics' | 'specials' | 'unknown';
export type IdentityPreflightDisposition = 'auto-stable-key' | 'auto-provenance' | 'manual' | 'not-activatable';
export interface IdentityPreflightEntry extends UnresolvedPowerIdentity {
    affected: IdentityPreflightAffected;
    disposition: IdentityPreflightDisposition;
}
export interface IdentityPreflightReport {
    generatedAt: string;
    systemVersion: string;
    scope: IdentityPreflightScope['kind'];
    totals: {
        sources: number;
        resolved: number;
        unresolved: number;
        blocksActivation: number;
        omitsContribution: number;
        informational: number;
    };
    entries: IdentityPreflightEntry[];
    /** Non-fatal scan errors (item iteration threw, etc.). Never rethrown. */
    errors?: Array<{
        where: string;
        message: string;
    }>;
}
/**
 * Migration suggestion for unresolved sources. Never guesses under ambiguity.
 */
export declare function suggestIdentityForUnresolved(opts: {
    kind: 'power-item' | 'artifact-row' | 'active-effect';
    item?: any;
    row?: any;
    effect?: any;
    actorItems?: any[];
}): UnresolvedPowerIdentity['suggestedIdentity'] | undefined;
/** Scan catalog templates (sanity: every template resolves by id). */
export declare function preflightCatalogTemplates(): IdentityPreflightReport;
/**
 * Scan echo + general artifact source definitions (not pack JSON).
 * Activable rows must resolve; stone/passive without identity → informational.
 */
export declare function preflightArtifactCatalog(): IdentityPreflightReport;
/** Scan a Foundry actor (power items, artifact rows, active buff effects). Read-only. */
export declare function preflightActor(actor: any): IdentityPreflightReport;
export declare function runIdentityPreflight(scope: IdentityPreflightScope): IdentityPreflightReport;
/** Markdown summary for GM chat / clipboard. */
export declare function formatIdentityPreflightMarkdown(report: IdentityPreflightReport): string;
export declare function formatIdentityPreflightJson(report: IdentityPreflightReport): string;
export declare function summarizeIdentityPreflight(report: IdentityPreflightReport): string;
//# sourceMappingURL=identity-preflight.d.ts.map