/**
 * Canonical Ritual skill-check flow (Players Guide 9625+).
 * Margin raises after roll; stones sealed on success.
 */

import { masteryRoll } from '../dice/roll-handler.js';
import {
  RITUALS,
  RITUAL_SKILLS_BY_CATEGORY,
  calculateRitualTN,
  countRitualRaises,
  eligibleSkillsForRitual,
  type RitualDefinition,
} from '../utils/rituals.js';
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';

function skillKeyFromDisplayName(name: string): string | null {
  const entry = Object.entries(SKILLS).find(
    ([, def]) => def.name.toLowerCase() === name.toLowerCase(),
  );
  return entry ? entry[0] : null;
}

export async function showRitualRollDialog(actor: Actor): Promise<void> {
  const system = (actor as any).system;
  const masteryRank = system.mastery?.rank || 2;
  const spendable =
    Math.max(0, Number(system.stones?.ready) || 0) +
    Math.max(0, Number(system.stones?.exhausted) || 0);

  const ritualOptions = RITUALS.map(
    (r) => `<option value="${r.name}">${r.name} (${r.stoneCost} stone${r.stoneCost === 1 ? '' : 's'})</option>`,
  ).join('');

  const content = `
    <form class="mastery-dialog-form ritual-roll-form">
      <div class="md-group">
        <label class="md-label">Ritual</label>
        <select name="ritualName" class="md-select">${ritualOptions}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Ritual MR <span class="md-sublabel">(target / scene — TN = 8 × MR)</span></label>
        <input type="number" name="ritualMR" value="${masteryRank}" min="1" max="16" step="1" class="md-input" />
      </div>
      <div class="md-group">
        <label class="md-label">GM Modifier <span class="md-sublabel">(±4 steps)</span></label>
        <input type="number" name="gmModifier" value="0" step="4" class="md-input" />
      </div>
      <div class="md-group">
        <label class="md-label">Skill</label>
        <select name="skillKey" class="md-select ritual-skill-select"></select>
      </div>
      <div class="md-group">
        <label class="md-label">Attribute</label>
        <select name="attributeKey" class="md-select ritual-attr-select"></select>
      </div>
      <div class="md-final-tn">
        Ritual TN: <strong><span class="ritual-tn-display">${calculateRitualTN(masteryRank)}</span></strong>
        · Pool stones: ${spendable}
      </div>
      <p class="md-sublabel">Raises are counted after the roll. No Raises may be declared beforehand.</p>
    </form>
  `;

  return new Promise((resolve) => {
    const dialog = new Dialog(
      {
        title: 'Perform Ritual',
        content,
        buttons: {
          roll: {
            label: '<i class="fas fa-dice-d20"></i> Roll',
            callback: async (html: JQuery) => {
              const ritualName = html.find('[name="ritualName"]').val() as string;
              const ritual = RITUALS.find((r) => r.name === ritualName);
              if (!ritual) return;
              const ritualMR = Math.max(1, parseInt(html.find('[name="ritualMR"]').val() as string) || 1);
              const gmMod = parseInt(html.find('[name="gmModifier"]').val() as string) || 0;
              const skillKey = html.find('[name="skillKey"]').val() as string;
              const attributeKey = html.find('[name="attributeKey"]').val() as string;
              const tn = calculateRitualTN(ritualMR, gmMod);
              await performRitualRoll(actor, ritual, {
                skillKey,
                attributeKey,
                tn,
                ritualMR,
                gmMod,
              });
              resolve();
            },
          },
          cancel: { label: 'Cancel', callback: () => resolve() },
        },
        default: 'roll',
        render: (html: JQuery) => {
          const $html = html instanceof HTMLElement ? $(html) : $(html as any);
          setTimeout(() => {
            $html.closest('.window-app.dialog').addClass('mastery-system mastery-roll-dialog');
          }, 0);

          const refreshSkills = () => {
            const ritualName = $html.find('[name="ritualName"]').val() as string;
            const ritual = RITUALS.find((r) => r.name === ritualName);
            const $skill = $html.find('[name="skillKey"]');
            $skill.empty();
            if (!ritual) return;
            for (const display of eligibleSkillsForRitual(ritual)) {
              const key = skillKeyFromDisplayName(display);
              if (key) $skill.append(`<option value="${key}">${display}</option>`);
            }
            refreshAttrs();
          };

          const refreshAttrs = () => {
            const skillKey = $html.find('[name="skillKey"]').val() as string;
            const def = SKILLS[skillKey];
            const $attr = $html.find('[name="attributeKey"]');
            $attr.empty();
            if (!def?.attributes) return;
            for (const attr of def.attributes) {
              $attr.append(
                `<option value="${attr}">${attr.charAt(0).toUpperCase() + attr.slice(1)}</option>`,
              );
            }
          };

          const refreshTn = () => {
            const mr = Math.max(1, parseInt($html.find('[name="ritualMR"]').val() as string) || 1);
            const mod = parseInt($html.find('[name="gmModifier"]').val() as string) || 0;
            $html.find('.ritual-tn-display').text(String(calculateRitualTN(mr, mod)));
          };

          $html.find('[name="ritualName"]').on('change', refreshSkills);
          $html.find('[name="skillKey"]').on('change', refreshAttrs);
          $html.find('[name="ritualMR"], [name="gmModifier"]').on('input change', refreshTn);
          refreshSkills();
          refreshTn();
        },
      },
      { width: 520, resizable: true } as any,
    );
    dialog.render(true);
  });
}

async function performRitualRoll(
  actor: Actor,
  ritual: RitualDefinition,
  opts: {
    skillKey: string;
    attributeKey: string;
    tn: number;
    ritualMR: number;
    gmMod: number;
  },
): Promise<void> {
  const system = (actor as any).system;
  const masteryRank = system.mastery?.rank || 2;
  const skillDef = SKILLS[opts.skillKey];
  if (!skillDef) {
    ui.notifications?.error('Invalid ritual skill.');
    return;
  }

  const ready = Math.max(0, Number(system.stones?.ready) || 0);
  if (ready < ritual.stoneCost) {
    ui.notifications?.warn(
      `Need ${ritual.stoneCost} ready stone(s) for ${ritual.name} (have ${ready}).`,
    );
    return;
  }

  let numDice = Number(system.attributes?.[opts.attributeKey]?.value) || 0;
  if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
    const pen = getEquippedPhysicalSkillPenaltyDice(actor);
    if (pen > 0) numDice = Math.max(1, numDice - pen);
  }

  const result = await masteryRoll({
    numDice,
    keepDice: masteryRank,
    skill: 0,
    tn: opts.tn,
    normalTn: opts.tn,
    label: `Ritual: ${ritual.name}`,
    flavor: `Ritual MR ${opts.ritualMR}, TN ${opts.tn}${opts.gmMod ? ` (GM ${opts.gmMod >= 0 ? '+' : ''}${opts.gmMod})` : ''}. Skill: ${skillDef.name}.`,
    actorId: (actor as any).id,
    skillKey: opts.skillKey,
    isSkillRoll: true,
    rollKind: 'skill',
    raiseModel: 'margin',
    autoFailIntent: 'skill',
    checkContext: { skillKey: opts.skillKey },
  });

  const raises = countRitualRaises(result.total, opts.tn);
  const outcomeIdx = Math.min(raises, ritual.raises.length - 1);
  const outcomeText = ritual.raises[Math.max(0, outcomeIdx)] ?? ritual.raises[0];

  if (result.success) {
    const sealed = Math.max(0, Number(system.stones?.sealed) || 0) + ritual.stoneCost;
    const newReady = ready - ritual.stoneCost;
    await (actor as any).update({
      'system.stones.ready': newReady,
      'system.stones.sealed': sealed,
    });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="ritual-roll-outcome">
        <h4>${ritual.name} — ${result.success ? 'Success' : 'Failure'}</h4>
        <p><strong>Raises:</strong> ${raises}</p>
        ${
          result.success
            ? `<p><strong>Effect:</strong> ${outcomeText}</p>
               <p><em>${ritual.stoneCost} stone(s) sealed until Safe Haven Rest.</em></p>`
            : `<p><em>Ritual failed — no stones sealed.</em></p>`
        }
      </div>
    `,
  } as any);
}

void RITUAL_SKILLS_BY_CATEGORY;
