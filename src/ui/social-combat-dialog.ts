/**
 * Social Combat — phase UI wired to `social-combat.ts` rules.
 */

import { masteryRoll } from '../dice/roll-handler.js';
import {
  defaultThreePhaseEncounter,
  resolveLeadRollOutcome,
  resolvePhase,
  computeFinalOutcome,
  phaseRaiseTn,
  type SocialCombatSkill,
  type PhaseLeadRollResult,
  type PhaseOutcome,
} from '../system/social-combat.js';
import { SKILLS } from '../utils/skills.js';

export async function showSocialCombatDialog(participantActors: Actor[]): Promise<void> {
  if (participantActors.length < 1) {
    ui.notifications?.warn('Select at least one PC for Social Combat.');
    return;
  }

  const phases = defaultThreePhaseEncounter();
  const allOutcomes: PhaseOutcome[] = [];

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i]!;
    const leadId = await pickLeadActor(participantActors, phase.title);
    if (!leadId) return;

    const leadActor = participantActors.find((a) => (a as any).id === leadId)!;
    const skill = await pickSkill(phase.allowedSkills);
    if (!skill) return;

    const rollSetup = await promptLeadRoll(leadActor, skill, phase.baseTn);
    if (!rollSetup) return;

    const skillKey = Object.entries(SKILLS).find(([, d]) => d.name === skill)?.[0] ?? 'persuasion';
    const attr = rollSetup.attributeKey;
    const system = (leadActor as any).system;
    const mr = system.mastery?.rank || 2;
    const numDice = system.attributes?.[attr]?.value || mr;

    const roll = await masteryRoll({
      numDice,
      keepDice: mr,
      skill: 0,
      tn: rollSetup.baseTn,
      normalTn: rollSetup.baseTn,
      raiseTn: rollSetup.raiseTn,
      declaredRaiseSlots: rollSetup.declaredRaises,
      label: `Social Combat — ${phase.title} (Lead)`,
      flavor: `${skill}, TN ${rollSetup.baseTn}${rollSetup.declaredRaises ? `, Raise TN ${rollSetup.raiseTn}` : ''}`,
      actorId: (leadActor as any).id,
      skillKey,
      isSkillRoll: false,
      raiseModel: 'skill',
      rollKind: 'skill',
    });

    const supportResults: import('../system/social-combat.js').SupportRollResult[] = [];
    for (const pid of participantActors.map((a) => (a as any).id).filter((id) => id !== leadId)) {
      const supporter = participantActors.find((a) => (a as any).id === pid);
      if (!supporter) continue;
      const doSupport = await confirmSupport(supporter, phase.title);
      if (!doSupport) continue;
      const supSkill = await pickSkill(phase.allowedSkills);
      if (!supSkill) continue;
      const supKey = Object.entries(SKILLS).find(([, d]) => d.name === supSkill)?.[0] ?? 'empathy';
      const supAttr = SKILLS[supKey]?.attributes?.[0] ?? 'influence';
      const supSys = (supporter as any).system;
      const supMr = supSys.mastery?.rank || 2;
      const supRoll = await masteryRoll({
        numDice: supSys.attributes?.[supAttr]?.value || supMr,
        keepDice: supMr,
        skill: 0,
        tn: phase.baseTn,
        normalTn: phase.baseTn,
        label: `Support — ${supSkill}`,
        actorId: (supporter as any).id,
        raiseModel: 'margin',
        rollKind: 'skill',
      });
      supportResults.push({
        actorId: pid,
        skill: supSkill,
        success: supRoll.success,
        bonus: supRoll.success ? supMr : 0,
      });
    }

    const supportBonus = supportResults.reduce((s, r) => s + r.bonus, 0);
    const adjustedTotal = roll.total + supportBonus;
    const finalLead = resolveLeadRollOutcome(adjustedTotal, rollSetup.baseTn, rollSetup.declaredRaises);

    const leadResult: PhaseLeadRollResult = {
      leadActorId: leadId,
      skill,
      declaredRaises: rollSetup.declaredRaises,
      normalTn: rollSetup.baseTn,
      raiseTn: rollSetup.raiseTn,
      tn: rollSetup.baseTn,
      total: adjustedTotal,
      success: finalLead.success,
      raiseOutcome: finalLead.raiseOutcome,
      raises: finalLead.raises,
    };

    const phaseOutcome = resolvePhase({
      phase,
      leadResult,
      supportResults,
      participantActorIds: participantActors.map((a) => (a as any).id),
    });

    allOutcomes.push(phaseOutcome);

    await ChatMessage.create({
      content: `
        <div class="social-combat-phase">
          <h4>${phase.title}</h4>
          <p>Lead: <strong>${(leadActor as any).name}</strong> (${skill}) — Total ${adjustedTotal} vs TN ${rollSetup.baseTn}</p>
          <p>Raises: ${finalLead.raises} · Setup gain: ${phaseOutcome.setupGain}</p>
          ${phaseOutcome.failed ? '<p><em>Phase failed — 4d8 Stress to participants.</em></p>' : ''}
        </div>
      `,
    } as any);
  }

  const finalPhase = allOutcomes[allOutcomes.length - 1];
  if (finalPhase) {
    const encounter = computeFinalOutcome(finalPhase, allOutcomes);
    await ChatMessage.create({
      content: `<div class="social-combat-final"><h3>Social Combat Result: ${encounter.label}</h3><p>${encounter.description}</p><p>Final Raises ${encounter.finalRaises} + Setup ${encounter.setupPool} = ${encounter.totalRaises}</p></div>`,
    } as any);
  }
}

function pickLeadActor(actors: Actor[], phaseName: string): Promise<string | null> {
  const options = actors
    .map((a) => `<option value="${(a as any).id}">${(a as any).name}</option>`)
    .join('');
  return new Promise((resolve) => {
    new Dialog({
      title: `Lead Actor — ${phaseName}`,
      content: `<select name="leadId" class="md-select">${options}</select>`,
      buttons: {
        ok: {
          label: 'Continue',
          callback: (html) => resolve(html.find('[name="leadId"]').val() as string),
        },
        cancel: { label: 'Cancel', callback: () => resolve(null) },
      },
      default: 'ok',
    }).render(true);
  });
}

function pickSkill(allowed: readonly SocialCombatSkill[]): Promise<SocialCombatSkill | null> {
  const opts = allowed.map((s) => `<option value="${s}">${s}</option>`).join('');
  return new Promise((resolve) => {
    new Dialog({
      title: 'Choose Skill',
      content: `<select name="skill" class="md-select">${opts}</select>`,
      buttons: {
        ok: {
          label: 'OK',
          callback: (html) => resolve(html.find('[name="skill"]').val() as SocialCombatSkill),
        },
        cancel: { label: 'Cancel', callback: () => resolve(null) },
      },
      default: 'ok',
    }).render(true);
  });
}

function promptLeadRoll(
  actor: Actor,
  skillName: SocialCombatSkill,
  baseTn: number,
): Promise<{
  baseTn: number;
  declaredRaises: number;
  raiseTn: number;
  attributeKey: string;
} | null> {
  void actor;
  const skillKey = Object.entries(SKILLS).find(([, d]) => d.name === skillName)?.[0];
  const skillDef = skillKey ? SKILLS[skillKey] : null;
  const attr = skillDef?.attributes?.[0] ?? 'influence';
  return new Promise((resolve) => {
    new Dialog({
      title: `Lead Roll — ${skillName}`,
      content: `
        <form>
          <p>Base TN: <strong>${baseTn}</strong></p>
          <label>Declared Raises (+4 Raise TN each):
            <input type="number" name="raises" value="0" min="0" max="8" />
          </label>
          <p>Raise TN: <span class="raise-tn-preview">${baseTn}</span></p>
        </form>
      `,
      render: (html) => {
        const $h = html instanceof HTMLElement ? $(html) : $(html as any);
        $h.find('[name="raises"]').on('input', function () {
          const r = parseInt($(this).val() as string, 10) || 0;
          $h.find('.raise-tn-preview').text(String(phaseRaiseTn(baseTn, r)));
        });
      },
      buttons: {
        roll: {
          label: 'Roll',
          callback: (html) => {
            const raises = parseInt(html.find('[name="raises"]').val() as string, 10) || 0;
            resolve({
              baseTn,
              declaredRaises: raises,
              raiseTn: phaseRaiseTn(baseTn, raises),
              attributeKey: attr,
            });
          },
        },
        cancel: { label: 'Cancel', callback: () => resolve(null) },
      },
      default: 'roll',
    }).render(true);
  });
}

function confirmSupport(actor: Actor, phaseName: string): Promise<boolean> {
  return new Promise((resolve) => {
    new Dialog({
      title: `Support — ${(actor as any).name}`,
      content: `<p>Support phase <strong>${phaseName}</strong>?</p>`,
      buttons: {
        yes: { label: 'Support', callback: () => resolve(true) },
        no: { label: 'Skip', callback: () => resolve(false) },
      },
      default: 'no',
    }).render(true);
  });
}
