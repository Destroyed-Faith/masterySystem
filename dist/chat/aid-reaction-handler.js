/**
 * DF 2026 — Aid retired.
 *
 * The Players Guide does not define Aid as a Basic Reaction or a +4 Final
 * Result bonus. Active Aid is removed from gameplay.
 *
 * This module only strips leftover `aid-skill-check` buttons from historical
 * chat cards so old messages cannot grant a bonus. It does not apply Aid.
 */
/** Strip Aid buttons from rendered chat HTML (legacy cards). No bonus apply. */
export function registerAidReactionClickHandler() {
    Hooks.on('renderChatMessageHTML', (_message, htmlRaw) => {
        try {
            const htmlEl = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
            htmlEl.find('[data-action="aid-skill-check"]').remove();
            htmlEl.find('.skill-aid-panel').remove();
        }
        catch (e) {
            console.error('Mastery System | aid strip on chat render failed', e);
        }
    });
}
//# sourceMappingURL=aid-reaction-handler.js.map