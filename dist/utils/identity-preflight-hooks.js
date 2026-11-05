/**
 * Read-only Foundry hooks for identity preflight (K4 / plan §9.2).
 * Never mutates actors, items, or effects.
 */
import { formatIdentityPreflightMarkdown, preflightActor, runIdentityPreflight, summarizeIdentityPreflight, } from './identity-preflight.js';
const FLAG_LAST_READY_SUMMARY = 'identityPreflightLastReadyAt';
async function whisperGms(content) {
    try {
        const gms = (game.users?.filter((u) => u.isGM) || []).map((u) => u.id);
        if (!gms.length)
            return;
        await ChatMessage.create({
            content,
            whisper: gms,
            speaker: { alias: 'Identity Preflight' },
        });
    }
    catch (err) {
        console.warn('Mastery System | Identity preflight whisper failed', err);
    }
}
function actionableEntries(report) {
    return report.entries.filter((e) => e.severity === 'blocks-activation' || e.severity === 'omits-contribution');
}
/**
 * World ready: GM summary whisper when unresolved entries exist.
 * Diagnostic only — no dialog block in C1.
 */
export async function runIdentityPreflightOnReady() {
    if (!game?.user?.isGM)
        return null;
    let report;
    try {
        report = runIdentityPreflight({ kind: 'world' });
    }
    catch (err) {
        console.warn('Mastery System | Identity preflight on ready failed', err);
        return null;
    }
    try {
        await game.user?.setFlag?.('mastery-system', FLAG_LAST_READY_SUMMARY, Date.now());
    }
    catch {
        /* ignore */
    }
    if (report.totals.unresolved === 0 && !(report.errors?.length)) {
        console.info('Mastery System | Identity preflight: clean');
        return report;
    }
    const summary = summarizeIdentityPreflight(report);
    const md = formatIdentityPreflightMarkdown(report);
    await whisperGms(`<p><strong>${summary}</strong></p>` +
        `<details><summary>Bericht öffnen (Markdown)</summary><pre style="white-space:pre-wrap;max-height:24em;overflow:auto">${md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')}</pre></details>` +
        `<p><em>Nur Diagnose — keine Items wurden verändert. Migration/Review folgt in Batch E.</em></p>`);
    return report;
}
/**
 * Combat start: GM whisper for combatants with blocking/omitting identity gaps.
 */
export async function runIdentityPreflightOnCombatStart(combat) {
    if (!game?.user?.isGM)
        return;
    try {
        const combatants = Array.from(combat?.combatants?.values?.() ?? combat?.combatants ?? []);
        const chunks = [];
        for (const c of combatants) {
            const actor = c?.actor;
            if (!actor)
                continue;
            const report = preflightActor(actor);
            const bad = actionableEntries(report);
            if (!bad.length)
                continue;
            const lines = bad
                .slice(0, 8)
                .map((e) => `· ${e.ref.itemName || e.ref.echoArtifactKey || e.ref.effectId || '?'} — ${e.reason}` +
                (e.suggestedIdentity
                    ? ` (Vorschlag: ${e.suggestedIdentity.templateId || e.suggestedIdentity.artifactFunctionId})`
                    : ''))
                .join('<br/>');
            chunks.push(`<p><strong>${actor.name}</strong> — ${bad.length} Identity-Lücke(n)<br/>${lines}</p>`);
        }
        if (!chunks.length)
            return;
        await whisperGms(`<p><strong>Identity-Preflight (Combat-Start)</strong></p>${chunks.join('')}` +
            `<p><em>Nur Diagnose. Keine Mechanik geändert.</em></p>`);
    }
    catch (err) {
        console.warn('Mastery System | Identity preflight on combatStart failed', err);
    }
}
export function registerIdentityPreflightHooks() {
    Hooks.once('ready', () => {
        void runIdentityPreflightOnReady();
    });
    Hooks.on('combatStart', (combat) => {
        void runIdentityPreflightOnCombatStart(combat);
    });
}
//# sourceMappingURL=identity-preflight-hooks.js.map