/**
 * GM menu for Unluck / Misfortune Tokens.
 * Rolls are automatic; the GM starts the session, spends tokens, and adjusts the pool.
 */
import { addMisfortuneTokens, readMisfortuneTokens, spendMisfortuneTokens, } from '../system/misfortune-tokens.js';
import { clearUnluckSession, collectUnluckCharacters, readUnluckSession, rollUnluckForSession, spendReasonLabel, UNLUCK_SPEND_REASONS, unluckDiceSpec, } from '../system/unluck.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class UnluckGmDialog extends BaseDialog {
    static DEFAULT_OPTIONS = {
        id: 'mastery-unluck-gm',
        classes: ['mastery-system', 'unluck-gm-dialog'],
        position: { width: 560, height: 'auto' },
        window: { title: 'Unluck / Misfortune', icon: 'fa-solid fa-cloud-moon', resizable: true },
        actions: {
            'start-session': function (event) {
                event.preventDefault();
                void this.#startSession();
            },
            'reroll-session': function (event) {
                event.preventDefault();
                void this.#startSession(true);
            },
            'clear-session': function (event) {
                event.preventDefault();
                void this.#clearSession();
            },
            'token-add': function (event) {
                event.preventDefault();
                void this.#adjustTokens(1);
            },
            'token-remove': function (event) {
                event.preventDefault();
                void this.#adjustTokens(-1);
            },
            spend: function (event) {
                event.preventDefault();
                const btn = event.target?.closest?.('[data-reason]');
                void this.#spend(btn?.dataset.reason || '');
            },
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/unluck-gm-dialog.hbs' },
    };
    static async open() {
        if (!game.user?.isGM) {
            ui.notifications?.warn('Only the GM can open the Unluck menu.');
            return;
        }
        try {
            const existing = foundry.applications.instances.get('mastery-unluck-gm');
            if (existing) {
                if (existing.rendered) {
                    existing.bringToFront();
                    await existing.render({ force: true });
                    return;
                }
                await existing.close();
            }
            await new UnluckGmDialog().render({ force: true });
        }
        catch (err) {
            console.error('Mastery System | Unluck GM dialog failed to open', err);
            ui.notifications?.error('Unluck menu could not be opened.');
        }
    }
    async _prepareContext(_options) {
        const session = readUnluckSession();
        const lastByActor = new Map(session.rolls.map((r) => [r.actorId, r]));
        const characters = collectUnluckCharacters(game.actors ?? []).map((ch) => {
            const spec = unluckDiceSpec(ch.rank);
            const last = lastByActor.get(ch.actorId);
            return {
                ...ch,
                formula: spec.label,
                lastTokens: last?.tokens,
                lastDice: last?.diceTotal,
                hasLast: !!last,
            };
        });
        return {
            tokens: readMisfortuneTokens(),
            sessionRolled: session.rolled,
            sessionAdded: session.added,
            characters,
            hasUnluck: characters.length > 0,
            spendReasons: UNLUCK_SPEND_REASONS,
        };
    }
    async #startSession(force = false) {
        if (!game.user?.isGM)
            return;
        const session = readUnluckSession();
        if (session.rolled && !force) {
            const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
            const again = typeof DialogV2?.confirm === 'function'
                ? await DialogV2.confirm({
                    window: { title: 'Unluck already rolled' },
                    content: '<p>Unluck was already rolled this session. Roll again and add more tokens?</p>',
                })
                : window.confirm('Unluck was already rolled this session. Roll again and add more tokens?');
            if (!again)
                return;
            force = true;
        }
        const result = await rollUnluckForSession({ force });
        if (result.alreadyRolled) {
            ui.notifications?.info('Unluck was already rolled this session.');
        }
        else if (result.rolls.length === 0) {
            ui.notifications?.info('No character has Unluck.');
        }
        else {
            ui.notifications?.info(`Unluck: +${result.added} Misfortune Token(s) (pool ${result.totalTokens}).`);
        }
        await this.render({ force: true });
    }
    async #clearSession() {
        if (!game.user?.isGM)
            return;
        await clearUnluckSession();
        ui.notifications?.info('Unluck session cleared. Start Session will roll again.');
        await this.render({ force: true });
    }
    async #adjustTokens(delta) {
        if (!game.user?.isGM)
            return;
        const next = await addMisfortuneTokens(delta);
        ui.notifications?.info(`Misfortune Tokens: ${next}`);
        await this.render({ force: true });
    }
    async #spend(reasonId) {
        if (!game.user?.isGM)
            return;
        const result = await spendMisfortuneTokens(1);
        if (!result.ok) {
            ui.notifications?.warn('No Misfortune Tokens left.');
            return;
        }
        const label = spendReasonLabel(reasonId);
        await globalThis.ChatMessage?.create?.({
            user: game.user?.id,
            content: `<div class="mastery-unluck-chat">
        <strong>Misfortune Token spent</strong>
        <p>${label}. Pool now <strong>${result.remaining}</strong>.</p>
      </div>`,
        });
        ui.notifications?.info(`Spent 1 Misfortune Token — ${label} (${result.remaining} left).`);
        await this.render({ force: true });
    }
}
/** First GM ready of a session: roll Unluck automatically and open the menu. */
export async function maybeAutoRollUnluckOnReady() {
    if (!game.user?.isGM)
        return;
    const characters = collectUnluckCharacters(game.actors ?? []);
    if (!characters.length)
        return;
    const session = readUnluckSession();
    if (session.rolled)
        return;
    const result = await rollUnluckForSession();
    ui.notifications?.info(result.rolls.length
        ? `Unluck rolled for the session: +${result.added} Misfortune Token(s).`
        : 'Unluck: no tokens this session.');
    await UnluckGmDialog.open();
}
//# sourceMappingURL=unluck-gm-dialog.js.map