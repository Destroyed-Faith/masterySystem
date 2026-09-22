/**
 * One-time v0.9.9 Attribute respec and Stone reassignment.
 * Postponing closes the dialog and leaves `needsV099Respec` set.
 */
import { ATTRIBUTE_ABBREV, ATTRIBUTE_KEYS } from './v099-rules.js';
import { planV099Respec, v099RespecUpdate } from './v099-respec.js';
function readField(html, name) {
    const jq = html?.find?.(`[name="${name}"]`);
    if (jq && typeof jq.val === 'function')
        return String(jq.val() ?? '');
    const root = html?.[0] ?? html;
    const el = root?.querySelector?.(`[name="${name}"]`);
    return String(el?.value ?? '');
}
function suggestedStarting(actor) {
    const ranked = ATTRIBUTE_KEYS.map((key) => ({
        key,
        value: Math.floor(Number(actor?.system?.attributes?.[key]?.value) || 0),
    })).sort((a, b) => b.value - a.value || ATTRIBUTE_KEYS.indexOf(a.key) - ATTRIBUTE_KEYS.indexOf(b.key));
    const packageValues = [4, 4, 3, 3, 2, 2, 2];
    const out = {};
    ranked.forEach((row, index) => {
        out[row.key] = packageValues[index] ?? 2;
    });
    return out;
}
export async function openV099RespecDialog(actor) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor || !actor)
        return;
    const system = actor.system ?? {};
    const preserved = Math.max(0, Math.floor(Number(system?.progression?.earnedAttributeXp) || 0));
    const storedLife = system?.progression?.lifetimeXp;
    const needsLife = typeof storedLife !== 'number';
    const starting = suggestedStarting(actor);
    const rows = ATTRIBUTE_KEYS.map((key) => {
        const start = starting[key];
        return `<tr>
      <td>${ATTRIBUTE_ABBREV[key]}</td>
      <td>
        <select name="start-${key}">
          <option value="2" ${start === 2 ? 'selected' : ''}>2</option>
          <option value="3" ${start === 3 ? 'selected' : ''}>3</option>
          <option value="4" ${start === 4 ? 'selected' : ''}>4</option>
        </select>
      </td>
      <td><input type="number" name="attr-${key}" min="2" max="40" step="1" value="${start}" /></td>
      <td><input type="number" name="stone-${key}" min="0" max="16" step="1" value="0" /></td>
    </tr>`;
    }).join('');
    const lifeField = needsLife
        ? `<label>Lifetime XP <input type="number" name="lifetime" min="0" step="1" value="0" /></label>
       <p>Lifetime XP could not be reconstructed from this character. Enter the total XP ever earned. It is never spent.</p>`
        : `<p>Lifetime XP: <strong>${Math.floor(storedLife)}</strong>. Permanent Stones = 2 + floor(Lifetime XP / 20).</p>`;
    await new Promise((resolve) => {
        const dialog = new DialogCtor({
            title: 'v0.9.9 Attribute and Stone migration',
            content: `<form class="v099-respec-form">
          <p>This is a one-time migration. The free starting package is <strong>4, 4, 3, 3, 2, 2, 2</strong>. Preserved Attribute XP: <strong>${preserved}</strong>. Spend it again on the compressed Attribute costs. Then assign every permanent Stone. Postponing leaves this migration on the sheet.</p>
          ${lifeField}
          <table>
            <thead><tr><th>Attribute</th><th>Starting</th><th>Final</th><th>Stones</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </form>`,
            buttons: {
                later: {
                    label: 'Postpone',
                    callback: () => resolve(),
                },
                confirm: {
                    label: 'Confirm migration',
                    callback: async (html) => {
                        const start = {};
                        const attributes = {};
                        const stones = {};
                        for (const key of ATTRIBUTE_KEYS) {
                            start[key] = Math.floor(Number(readField(html, `start-${key}`)) || 0);
                            attributes[key] = Math.floor(Number(readField(html, `attr-${key}`)) || 0);
                            stones[key] = Math.floor(Number(readField(html, `stone-${key}`)) || 0);
                        }
                        const lifeRaw = readField(html, 'lifetime');
                        const plan = planV099Respec(actor, {
                            lifetimeXp: needsLife ? Math.floor(Number(lifeRaw)) : null,
                            starting: start,
                            attributes,
                            stones,
                        });
                        if (!plan.ok) {
                            globalThis.ui?.notifications?.warn?.(plan.reason || 'Migration is not valid.');
                            resolve();
                            return;
                        }
                        await actor.update(v099RespecUpdate(actor, plan));
                        globalThis.ui?.notifications?.info?.('v0.9.9 migration saved.');
                        resolve();
                    },
                },
            },
            default: 'later',
            close: () => resolve(),
        }, { width: 720 });
        dialog.render(true);
    });
}
/** One-time Lifetime XP entry when earned XP cannot be reconstructed. Does not respec Attributes. */
export async function openV099LifetimeDialog(actor) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor || !actor)
        return;
    await new Promise((resolve) => {
        const dialog = new DialogCtor({
            title: 'Enter Lifetime XP',
            content: `<form class="v099-respec-form">
          <p>Lifetime XP could not be reconstructed from this character. Enter the total XP ever earned. It is never spent. Permanent Stones = 2 + floor(Lifetime XP / 20). Postponing leaves this request on the sheet.</p>
          <label>Lifetime XP <input type="number" name="lifetime" min="0" step="1" value="0" /></label>
        </form>`,
            buttons: {
                later: { label: 'Postpone', callback: () => resolve() },
                confirm: {
                    label: 'Save Lifetime XP',
                    callback: async (html) => {
                        const n = Math.floor(Number(readField(html, 'lifetime')));
                        if (!Number.isFinite(n) || n < 0) {
                            globalThis.ui?.notifications?.warn?.('Enter a Lifetime XP of 0 or more.');
                            resolve();
                            return;
                        }
                        await actor.update({
                            'system.progression.lifetimeXp': n,
                            'system.progression.lifetimeXpSource': 'manual',
                            'flags.mastery-system.needsV099LifetimeXp': false,
                        });
                        globalThis.ui?.notifications?.info?.('Lifetime XP saved. Assign the unlocked Stones.');
                        resolve();
                    },
                },
            },
            default: 'later',
            close: () => resolve(),
        }, { width: 480 });
        dialog.render(true);
    });
}
//# sourceMappingURL=v099-respec-dialog.js.map