/**
 * GM Pursuit panel. The buttons call the same resolver the chat card uses.
 * One fleeing creature and one pursuer. Extra creatures are a later Pursuit,
 * not an automatic multi-party resolution.
 */
import { renderPursuitHtml, resolvePursuitExchange, startPursuit, PURSUIT_ATTRIBUTES, readPursuit } from './pursuit.js';
function actorsFromCombat(combat) {
    const bag = combat?.combatants;
    const rows = bag ? (typeof bag.values === 'function' ? Array.from(bag.values()) : Array.isArray(bag) ? bag : []) : [];
    return rows.map((row) => row?.actor).filter(Boolean);
}
function options(actors, selected) {
    return actors
        .map((actor) => {
        const id = String(actor.id);
        const mark = id === selected ? ' selected' : '';
        return `<option value="${id}"${mark}>${actor.name || id}</option>`;
    })
        .join('');
}
function attributeOptions(allowed, selected) {
    return allowed
        .map((key) => `<option value="${key}"${key === selected ? ' selected' : ''}>${key}</option>`)
        .join('');
}
export function pursuitDialogContent(combat) {
    const actors = actorsFromCombat(combat);
    const pursuit = readPursuit(combat);
    const allowed = pursuit?.allowedAttributes ?? [...PURSUIT_ATTRIBUTES];
    return `<form class="mastery-pursuit-form">
    ${renderPursuitHtml(pursuit)}
    <label>Fleeing <select name="fleeing">${options(actors, pursuit?.fleeingActorId || String(actors[0]?.id || ''))}</select></label>
    <label>Pursuer <select name="pursuer">${options(actors, pursuit?.pursuerActorId || String(actors[1]?.id || ''))}</select></label>
    <p>Allowed attributes</p>
    ${PURSUIT_ATTRIBUTES.map((key) => {
        const on = allowed.includes(key);
        return `<label><input type="checkbox" name="allow-${key}" ${on ? 'checked' : ''}/> ${key}</label>`;
    }).join(' ')}
    <p>Next exchange</p>
    <label>Fleeing attribute <select name="fleeingAttribute">${attributeOptions(allowed, allowed[0] || 'agility')}</select></label>
    <label>Pursuer attribute <select name="pursuerAttribute">${attributeOptions(allowed, allowed[0] || 'agility')}</select></label>
  </form>`;
}
function selectedAttributes(html) {
    const found = [];
    for (const key of PURSUIT_ATTRIBUTES) {
        const box = html?.find?.(`[name="allow-${key}"]`);
        const checked = box?.is?.(':checked') ?? box?.prop?.('checked');
        if (checked)
            found.push(key);
    }
    return found.length ? found : [...PURSUIT_ATTRIBUTES];
}
export async function openPursuitDialog(combat) {
    const Dialog = globalThis.Dialog;
    if (!combat) {
        globalThis.ui?.notifications?.warn?.('No combat is open.');
        return;
    }
    if (typeof Dialog !== 'function')
        return;
    await new Promise((resolve) => {
        new Dialog({
            title: 'Pursuit',
            content: pursuitDialogContent(combat),
            buttons: {
                start: {
                    label: 'Start Pursuit',
                    callback: async (html) => {
                        const actors = actorsFromCombat(combat);
                        const fleeing = actors.find((actor) => String(actor.id) === String(html.find('[name="fleeing"]').val()));
                        const pursuer = actors.find((actor) => String(actor.id) === String(html.find('[name="pursuer"]').val()));
                        const started = await startPursuit({
                            combat,
                            fleeing,
                            pursuer,
                            allowedAttributes: selectedAttributes(html),
                        });
                        if (!started.ok)
                            globalThis.ui?.notifications?.warn?.(started.reason || 'Pursuit did not start.');
                        resolve();
                    },
                },
                exchange: {
                    label: 'Resolve Exchange',
                    callback: async (html) => {
                        const pursuit = readPursuit(combat);
                        const actors = actorsFromCombat(combat);
                        const fleeing = actors.find((actor) => String(actor.id) === pursuit?.fleeingActorId);
                        const pursuer = actors.find((actor) => String(actor.id) === pursuit?.pursuerActorId);
                        const fleeingAttribute = String(html.find('[name="fleeingAttribute"]').val() || '');
                        const pursuerAttribute = String(html.find('[name="pursuerAttribute"]').val() || '');
                        const result = await resolvePursuitExchange({
                            combat,
                            fleeingActor: fleeing,
                            pursuerActor: pursuer,
                            fleeingAttribute,
                            pursuerAttribute,
                            exchangeKey: `ui-${pursuit?.exchanges.length ?? 0}-${Date.now()}`,
                        });
                        if (!result.ok)
                            globalThis.ui?.notifications?.warn?.(result.reason || 'Exchange was not resolved.');
                        resolve();
                    },
                },
                close: { label: 'Close', callback: () => resolve() },
            },
            close: () => resolve(),
        }).render(true);
    });
}
//# sourceMappingURL=pursuit-dialog.js.map