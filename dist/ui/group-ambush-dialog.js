/**
 * GM/party Group Ambush dialog — pick specialist + participants, roll Stealth.
 */
import { executeGroupAmbushStealthRoll, planGroupAmbushStealthPool, } from '../combat/group-ambush.js';
import { getSkillCritUsesRemaining, skillCritDailyAllowance } from '../rules/index.js';
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function listCharacters() {
    return game.actors?.filter((a) => a.type === 'character') || [];
}
export async function openGroupAmbushDialog() {
    const characters = listCharacters();
    if (characters.length === 0) {
        ui.notifications?.warn('No characters available for Group Ambush.');
        return;
    }
    const options = characters
        .map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)}</option>`)
        .join('');
    const checks = characters
        .map((a) => `<label style="display:block;margin:2px 0"><input type="checkbox" name="part" value="${escapeHtml(a.id)}" checked /> ${escapeHtml(a.name)}</label>`)
        .join('');
    const content = `
    <form class="mastery-dialog-form">
      <p>One Stealth specialist rolls for the group. Combined Physical Skill penalties
      from every participant reduce the pool. Compare the result against each observer's Perception.</p>
      <div class="md-group">
        <label class="md-label">Stealth specialist</label>
        <select name="specialist" class="md-select">${options}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Participating characters (armor/shield penalties stack)</label>
        <div class="ms-group-ambush-parts">${checks}</div>
      </div>
      <div class="md-group">
        <label class="md-label"><input type="checkbox" name="skillCrit" /> Declare Skill Crit</label>
      </div>
      <div class="md-group">
        <label class="md-label">Observer Perception totals (optional, one per line: ActorName=Total)</label>
        <textarea name="observers" class="md-input" rows="3" placeholder="Guard=18&#10;Scout=12"></textarea>
      </div>
      <p class="md-sublabel ms-group-ambush-preview"></p>
    </form>`;
    const DialogCls = globalThis.Dialog;
    await new Promise((resolve) => {
        new DialogCls({
            title: 'Group Ambush',
            content,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-user-secret"></i>',
                    label: 'Roll Group Stealth',
                    callback: async (html) => {
                        const root = html?.[0] ?? html;
                        const specialistId = String(root.querySelector('[name="specialist"]')?.value || '');
                        const specialist = characters.find((a) => a.id === specialistId);
                        const partIds = Array.from(root.querySelectorAll('[name="part"]:checked')).map((el) => el.value);
                        const participants = characters.filter((a) => partIds.includes(a.id));
                        const declareSkillCrit = !!root.querySelector('[name="skillCrit"]')?.checked;
                        const obsRaw = String(root.querySelector('[name="observers"]')?.value || '');
                        const observerPerceptionTotals = [];
                        for (const line of obsRaw.split(/\n+/)) {
                            const m = line.trim().match(/^(.+?)\s*=\s*(\d+)\s*$/);
                            if (!m)
                                continue;
                            const name = m[1].trim();
                            const total = Math.floor(Number(m[2]) || 0);
                            const found = characters.find((a) => String(a.name).toLowerCase() === name.toLowerCase());
                            observerPerceptionTotals.push({
                                observer: found || { id: name, name },
                                perceptionTotal: total,
                            });
                        }
                        const res = await executeGroupAmbushStealthRoll({
                            specialist,
                            participants,
                            declareSkillCrit,
                            observerPerceptionTotals,
                        });
                        if (!res.ok) {
                            ui.notifications?.warn(res.error || 'Group Ambush failed.');
                            return;
                        }
                        const wins = (res.observerResults || []).filter((r) => r.stealthWins).length;
                        const totalObs = (res.observerResults || []).length;
                        ui.notifications?.info(`Group Ambush Stealth total ${res.stealthTotal}` +
                            (totalObs
                                ? ` · beats ${wins}/${totalObs} observer Perception check(s)`
                                : ' · enter observer Perception totals to compare'));
                    },
                },
                cancel: { label: 'Cancel' },
            },
            default: 'roll',
            render: (html) => {
                const root = html?.[0] ?? html;
                const refresh = () => {
                    const specialistId = String(root.querySelector('[name="specialist"]')?.value || '');
                    const specialist = characters.find((a) => a.id === specialistId);
                    const partIds = Array.from(root.querySelectorAll('[name="part"]:checked')).map((el) => el.value);
                    const participants = characters.filter((a) => partIds.includes(a.id));
                    const plan = planGroupAmbushStealthPool({ specialist, participants });
                    const preview = root.querySelector('.ms-group-ambush-preview');
                    if (preview && plan.ok) {
                        const critAllow = skillCritDailyAllowance(plan.skillRank);
                        const critLeft = plan.skillCritTrackId
                            ? getSkillCritUsesRemaining(specialist, plan.skillCritTrackId, plan.skillRank)
                            : 0;
                        preview.textContent =
                            `Pool ${plan.basePool} − ${plan.combinedPenalty} = ${plan.finalPool}k${plan.keepDice}` +
                                ` · Rank ${plan.skillRank}` +
                                (plan.skillAdvantageRerollMax
                                    ? ` · Adv 1–${plan.skillAdvantageRerollMax}`
                                    : '') +
                                (critAllow ? ` · Crit ${critLeft}/${critAllow}` : '');
                    }
                };
                root.querySelectorAll('input, select').forEach((el) => {
                    el.addEventListener('change', refresh);
                    el.addEventListener('input', refresh);
                });
                refresh();
            },
            close: () => resolve(),
        }, { width: 480 }).render(true);
    });
}
//# sourceMappingURL=group-ambush-dialog.js.map