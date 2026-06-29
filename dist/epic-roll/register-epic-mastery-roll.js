/**
 * Epic Mastery Roll — chat button, hooks, and initialization.
 */
import { registerEpicMasteryRollSettings, loadEpicRollRecentPresets } from './epic-mastery-roll-settings.js';
import { registerEpicMasteryRollSocket } from './epic-mastery-roll-socket.js';
import { getActiveEpicMasteryRollSession } from './epic-mastery-roll-session.js';
import { requestEpicMasteryRoll, showEpicMasteryRollConfigDialog, } from './epic-mastery-roll-config-dialog.js';
export function initializeEpicMasteryRoll() {
    registerEpicMasteryRollSettings();
    registerEpicMasteryRollSocket();
    Hooks.on('renderChatLog', (_app, html) => {
        if (!game.user?.isGM)
            return;
        const controls = html.find('#chat-controls');
        if (!controls.length || controls.find('.emr-chat-launch').length)
            return;
        const button = $(`
      <button type="button" class="emr-chat-launch" title="Epic Mastery Roll — group skill / attribute / save check">
        <i class="fas fa-dice-d20"></i>
        <span>Epic Roll</span>
      </button>
    `);
        button.on('click', (ev) => {
            ev.preventDefault();
            showEpicMasteryRollConfigDialog();
        });
        button.on('contextmenu', (ev) => {
            ev.preventDefault();
            showEpicRollRecentMenu();
        });
        controls.prepend(button);
    });
}
function showEpicRollRecentMenu() {
    const presets = loadEpicRollRecentPresets();
    if (presets.length === 0) {
        ui.notifications?.info('No recent Epic Roll presets yet.');
        return;
    }
    const buttons = {};
    for (let i = 0; i < presets.length; i++) {
        const preset = presets[i];
        const key = `preset${i}`;
        buttons[key] = {
            label: preset.title || `Preset ${i + 1}`,
            callback: () => showEpicMasteryRollConfigDialog(preset),
        };
    }
    buttons.cancel = { label: 'Cancel', callback: () => undefined };
    new Dialog({
        title: 'Recent Epic Rolls',
        content: '<p class="emr-recent-hint">Choose a recent configuration to pre-fill the dialog.</p>',
        buttons,
    }, { classes: ['mastery-system', 'epic-mastery-roll-config'] }).render(true);
}
export { getActiveEpicMasteryRollSession, requestEpicMasteryRoll, showEpicMasteryRollConfigDialog, };
//# sourceMappingURL=register-epic-mastery-roll.js.map