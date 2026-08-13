/**
 * Ritual skill-check flow: declared Raises, Base TN = 8 × Ritual MR,
 * stones Sealed on the attempt (success or failure).
 */

import { masteryRoll } from '../dice/roll-handler.js';
import {
  RITUALS,
  appliedRitualEffects,
  calculateRitualRaiseTN,
  calculateRitualTN,
  eligibleSkillsForRitual,
  resolveRitualDeclaredOutcome,
  ritualMaxRaise,
  ritualStoneCost,
  type RitualDefinition,
} from '../utils/rituals.js';
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';

function skillKeyFromDisplayName(name: string): string | null {
  const entry = Object.entries(SKILLS).find(([, def]) => def.name.toLowerCase() === name.toLowerCase());
  return entry ? entry[0] : null;
}

function availableStones(system: any): { ready: number; exhausted: number; available: number } {
  const ready = Math.max(0, Number(system.stones?.ready) || 0);
  const exhausted = Math.max(0, Number(system.stones?.exhausted) || 0);
  return { ready, exhausted, available: ready + exhausted };
}

async function sealRitualStones(actor: Actor, cost: number): Promise<boolean> {
  const system = (actor as any).system;
  const { ready, exhausted, available } = availableStones(system);
  if (available < cost) return false;
  const fromReady = Math.min(ready, cost);
  const fromExhausted = cost - fromReady;
  const sealed = Math.max(0, Number(system.stones?.sealed) || 0) + cost;
  await (actor as any).update({
    'system.stones.ready': ready - fromReady,
    'system.stones.exhausted': exhausted - fromExhausted,
    'system.stones.sealed': sealed,
  });
  return true;
}

export async function showRitualRollDialog(actor: Actor): Promise<void> {
  const system = (actor as any).system;
  const masteryRank = system.mastery?.rank || 2;
  const { available } = availableStones(system);

  const ritualOptions = RITUALS.map(
    (r) =>
      `<option value="${r.id}">${r.name} (${r.stoneCost} stone${r.stoneCost === 1 ? '' : 's'})</option>`,
  ).join('');

  const first = RITUALS[0];
  const firstMax = first ? ritualMaxRaise(first) : 4;
  const raiseOptions = Array.from({ length: firstMax + 1 }, (_, i) => {
    const cost = first ? ritualStoneCost(first, i) : 1;
    const extra = first && cost !== first.stoneCost ? ` · ${cost} stones` : '';
    return `<option value="${i}">Raise ${i}${extra}</option>`;
  }).join('');

  const content = `
    <form class="mastery-dialog-form ritual-roll-form">
      <div class="md-group">
        <label class="md-label">Ritual</label>
        <select name="ritualId" class="md-select">${ritualOptions}</select>
      </div>
      <p class="md-sublabel ritual-requirement"></p>
      <div class="md-group">
        <label class="md-label">Ritual MR <span class="md-sublabel">(target / creator / artifact / scene — not your MR)</span></label>
        <input type="number" name="ritualMR" value="${masteryRank}" min="1" max="16" step="1" class="md-input" />
      </div>
      <div class="md-group">
        <label class="md-label">Declared Raise</label>
        <select name="declaredRaise" class="md-select">${raiseOptions}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Situational TN <span class="md-sublabel">(rushed +4, extra Augury +4, …)</span></label>
        <input type="number" name="gmModifier" value="0" step="4" class="md-input" />
      </div>
      <div class="md-group">
        <label class="md-label">Skill <span class="md-sublabel">(must fit how you perform the Ritual)</span></label>
        <select name="skillKey" class="md-select ritual-skill-select"></select>
      </div>
      <div class="md-group">
        <label class="md-label">Attribute</label>
        <select name="attributeKey" class="md-select ritual-attr-select"></select>
      </div>
      <div class="md-final-tn">
        Base TN: <strong><span class="ritual-base-tn">${calculateRitualTN(masteryRank)}</span></strong>
        · Raise TN: <strong><span class="ritual-raise-tn">${calculateRitualTN(masteryRank)}</span></strong>
        · Stones: <span class="ritual-stone-cost">${first?.stoneCost ?? 1}</span> / ${available} available
      </div>
      <p class="md-sublabel">Stones are Sealed when you roll — even if the Ritual fails. They return after a Safe Haven Rest.</p>
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
              const ritualId = html.find('[name="ritualId"]').val() as string;
              const ritual = RITUALS.find((r) => r.id === ritualId);
              if (!ritual) return;
              const ritualMR = Math.max(1, parseInt(html.find('[name="ritualMR"]').val() as string) || 1);
              const gmMod = parseInt(html.find('[name="gmModifier"]').val() as string) || 0;
              const declaredRaises = Math.max(
                0,
                Math.min(ritualMaxRaise(ritual), parseInt(html.find('[name="declaredRaise"]').val() as string) || 0),
              );
              const skillKey = html.find('[name="skillKey"]').val() as string;
              const attributeKey = html.find('[name="attributeKey"]').val() as string;
              const baseTn = calculateRitualTN(ritualMR, gmMod);
              await performRitualRoll(actor, ritual, {
                skillKey,
                attributeKey,
                baseTn,
                ritualMR,
                gmMod,
                declaredRaises,
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

          const currentRitual = (): RitualDefinition | undefined => {
            const id = $html.find('[name="ritualId"]').val() as string;
            return RITUALS.find((r) => r.id === id);
          };

          const refreshSkills = () => {
            const ritual = currentRitual();
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
              $attr.append(`<option value="${attr}">${attr.charAt(0).toUpperCase() + attr.slice(1)}</option>`);
            }
          };

          const refreshRaisesAndTn = () => {
            const ritual = currentRitual();
            const mr = Math.max(1, parseInt($html.find('[name="ritualMR"]').val() as string) || 1);
            const mod = parseInt($html.find('[name="gmModifier"]').val() as string) || 0;
            const baseTn = calculateRitualTN(mr, mod);
            const $raise = $html.find('[name="declaredRaise"]');
            const prev = parseInt($raise.val() as string) || 0;
            if (ritual) {
              const max = ritualMaxRaise(ritual);
              $raise.empty();
              for (let i = 0; i <= max; i++) {
                const cost = ritualStoneCost(ritual, i);
                const extra = cost !== ritual.stoneCost ? ` · ${cost} stones` : '';
                $raise.append(`<option value="${i}"${i === Math.min(prev, max) ? ' selected' : ''}>Raise ${i}${extra}</option>`);
              }
              const declared = Math.min(max, parseInt($raise.val() as string) || 0);
              $html.find('.ritual-requirement').text(ritual.requirement || ritual.description);
              $html.find('.ritual-stone-cost').text(String(ritualStoneCost(ritual, declared)));
              $html.find('.ritual-raise-tn').text(String(calculateRitualRaiseTN(baseTn, declared)));
            }
            $html.find('.ritual-base-tn').text(String(baseTn));
          };

          $html.find('[name="ritualId"]').on('change', () => {
            refreshSkills();
            refreshRaisesAndTn();
          });
          $html.find('[name="skillKey"]').on('change', refreshAttrs);
          $html.find('[name="ritualMR"], [name="gmModifier"], [name="declaredRaise"]').on('input change', refreshRaisesAndTn);
          refreshSkills();
          refreshRaisesAndTn();
        },
      },
      { width: 560, resizable: true } as any,
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
    baseTn: number;
    ritualMR: number;
    gmMod: number;
    declaredRaises: number;
  },
): Promise<void> {
  const system = (actor as any).system;
  const masteryRank = system.mastery?.rank || 2;
  const skillDef = SKILLS[opts.skillKey];
  if (!skillDef) {
    ui.notifications?.error('Invalid ritual skill.');
    return;
  }

  const cost = ritualStoneCost(ritual, opts.declaredRaises);
  const { available } = availableStones(system);
  if (available < cost) {
    ui.notifications?.warn(`Need ${cost} available stone(s) for ${ritual.name} (have ${available}).`);
    return;
  }

  const sealed = await sealRitualStones(actor, cost);
  if (!sealed) {
    ui.notifications?.warn(`Need ${cost} available stone(s) for ${ritual.name}.`);
    return;
  }

  let numDice = Number(system.attributes?.[opts.attributeKey]?.value) || 0;
  if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
    const pen = getEquippedPhysicalSkillPenaltyDice(actor);
    if (pen > 0) numDice = Math.max(1, numDice - pen);
  }

  const raiseTn = calculateRitualRaiseTN(opts.baseTn, opts.declaredRaises);
  const result = await masteryRoll({
    numDice,
    keepDice: masteryRank,
    skill: 0,
    tn: raiseTn,
    normalTn: opts.baseTn,
    declaredRaiseSlots: opts.declaredRaises,
    label: `Ritual: ${ritual.name}`,
    flavor: `Ritual MR ${opts.ritualMR}, Base TN ${opts.baseTn}, Raise ${opts.declaredRaises} (TN ${raiseTn})${opts.gmMod ? ` · situational ${opts.gmMod >= 0 ? '+' : ''}${opts.gmMod}` : ''}. Skill: ${skillDef.name}.`,
    actorId: (actor as any).id,
    skillKey: opts.skillKey,
    isSkillRoll: true,
    rollKind: 'skill',
    raiseModel: 'power',
    autoFailIntent: 'skill',
    checkContext: { skillKey: opts.skillKey },
  });

  const resolved = resolveRitualDeclaredOutcome({
    rollTotal: result.total,
    baseTn: opts.baseTn,
    declaredRaises: opts.declaredRaises,
  });
  const effects = resolved.success ? appliedRitualEffects(ritual, resolved.appliedRaise) : [];
  const heading = resolved.success
    ? resolved.kind === 'raise0' && opts.declaredRaises > 0
      ? `${ritual.name} — Success (Raise 0 only)`
      : `${ritual.name} — Success (Raise ${resolved.appliedRaise})`
    : `${ritual.name} — Failure`;

  const effectHtml = effects.length
    ? `<ol class="ritual-raise-effects">${effects.map((t, i) => `<li><strong>Raise ${i}:</strong> ${t}</li>`).join('')}</ol>`
    : '';

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="ritual-roll-outcome">
        <h4>${heading}</h4>
        <p>Base TN ${opts.baseTn} · declared Raise ${opts.declaredRaises} (TN ${raiseTn}) · roll ${result.total}</p>
        ${effectHtml}
        <p><em>${cost} stone(s) Sealed until Safe Haven Rest${ritual.id === 'ritual-word-of-recall' ? ' (or until the mark is used or dismissed, then a Safe Haven Rest)' : ''}.</em></p>
        ${!resolved.success ? '<p><em>The Ritual does not produce its intended effect. The GM may apply a fitting consequence.</em></p>' : ''}
      </div>
    `,
  } as any);
}
