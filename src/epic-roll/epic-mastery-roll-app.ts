/**
 * Epic Mastery Roll — full-screen cinematic overlay.
 */

import { SKILLS } from '../utils/skills.js';
import { getSkillRollDicePool } from '../dice/roll-context-build.js';
import type { EpicMasteryRollSession } from './epic-mastery-roll-types.js';
import {
  buildEpicDiceFaces,
  countResolvedParticipants,
  rollLabelForConfig,
} from './epic-mastery-roll-types.js';
import {
  applyEpicSkillSpendAndFinalize,
  canSpendEpicRerollPoint,
  confirmEpicRollWithoutSpend,
  performEpicParticipantReroll,
  performEpicParticipantRoll,
} from './epic-mastery-roll-roll.js';
import {
  buildSkillSpendPackets,
  getSkillSpendOptions,
  sumSelectedPacketSpend,
  totalsAfterSkillSpend,
} from './epic-mastery-roll-skill-spend.js';
import {
  applyEpicEchoCardToResult,
  getEpicEchoCardOffers,
} from './epic-mastery-roll-echo.js';
import { portraitFallbackSrc, resolveActorPortraitSrc } from './epic-mastery-roll-portraits.js';

const TEMPLATE = 'systems/mastery-system/templates/epic-roll/session-cinematic.hbs';
const PACKET_COUNT = 4;

function capAttr(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function emptyPacketSelection(): boolean[] {
  return Array.from({ length: PACKET_COUNT }, () => false);
}

class EpicMasteryRollOverlay {
  private session: EpicMasteryRollSession;
  private root: HTMLElement | null = null;
  private rolling = false;
  private renderSeq = 0;
  /** Per-actor attribute choice before rolling (multi-attribute skills). */
  private selectedAttributes: Record<string, string> = {};
  /** Per-actor MR packet toggles while choosing skill spend after a failed roll. */
  private selectedSpendPackets: Record<string, boolean[]> = {};

  constructor(session: EpicMasteryRollSession) {
    this.session = session;
  }

  private spendSelectionFor(actorId: string): boolean[] {
    if (!this.selectedSpendPackets[actorId]) {
      this.selectedSpendPackets[actorId] = emptyPacketSelection();
    }
    return this.selectedSpendPackets[actorId]!;
  }

  private async buildContext(): Promise<Record<string, unknown>> {
    const rollLabel = rollLabelForConfig(this.session.roll);
    const resolved = countResolvedParticipants(this.session);
    const total = this.session.participants.length;
    const isGM = !!game.user?.isGM;
    const bandHue = this.session.bandHue ?? 350;
    const isSkillRoll = this.session.roll.kind === 'skill';
    const skillKey = this.session.roll.kind === 'skill' ? this.session.roll.skillKey : undefined;
    const skillDef = skillKey ? SKILLS[skillKey] : undefined;

    const participants = this.session.participants.map((p) => {
      const actor = game.actors?.get(p.actorId);
      const isOwner = isGM || !!actor?.isOwner;
      const result = this.session.results[p.actorId];
      const awaitingSpend = p.status === 'awaiting_spend' && !!result?.awaitingConfirm;
      const rolled = p.status === 'rolled' && !!result && !result.skipped;
      const skipped = p.status === 'skipped' || result?.skipped;

      let skillPackets: Array<{
        index: number;
        amount: number;
        clickable: boolean;
        selected: boolean;
        locked: boolean;
      }> = [];
      let selectedSpendAmount = 0;
      let canAddSkillPoints = false;
      let showSkillSpend = false;
      let showReroll = false;
      let showFailureActions = false;
      let displayTotal = result?.total ?? 0;
      let displaySuccess = !!result?.success;

      if (awaitingSpend && result?.rollPayload && result.skillKey && actor && isOwner && !result.success) {
        const spend = getSkillSpendOptions(
          actor,
          result.skillKey,
          result.rollPayload.rollResult,
          result.rollPayload.baseModifier,
        );

        if (spend.options.length > 0) {
          const masteryRank = Number((actor as any).system?.mastery?.rank ?? 2);
          const packets = buildSkillSpendPackets(spend.remainingPool, masteryRank);
          const selected = this.spendSelectionFor(p.actorId);
          selectedSpendAmount = sumSelectedPacketSpend(packets, selected);
          const preview = totalsAfterSkillSpend(
            result.rollPayload.rollResult,
            selectedSpendAmount,
            result.rollPayload.baseModifier,
          );

          skillPackets = packets.map((pkt, index) => ({
            index: pkt.index,
            amount: pkt.amount,
            clickable: pkt.clickable,
            selected: !!selected[index],
            locked: !pkt.clickable,
          }));
          showSkillSpend = true;
          displayTotal = preview.total;
          displaySuccess = preview.success;
          canAddSkillPoints = selectedSpendAmount > 0;
        }
      }

      if (awaitingSpend && isOwner && result && !result.success) {
        showFailureActions = true;
        showReroll = !result.rerolled && canSpendEpicRerollPoint(actor);
      }

      const skillAttrs = skillDef?.attributes ?? [];
      const multiAttribute = isSkillRoll && skillAttrs.length > 1;
      let selectedAttribute: string | undefined = this.selectedAttributes[p.actorId];

      if (p.status === 'pending' && isOwner && isSkillRoll) {
        if (skillAttrs.length === 1) {
          selectedAttribute = skillAttrs[0];
          this.selectedAttributes[p.actorId] = selectedAttribute;
        } else if (multiAttribute && selectedAttribute && !skillAttrs.includes(selectedAttribute)) {
          delete this.selectedAttributes[p.actorId];
          selectedAttribute = undefined;
        }
      }

      const attributeOptions =
        multiAttribute && p.status === 'pending' && isOwner && skillKey
          ? skillAttrs.map((attr) => {
              const pool = getSkillRollDicePool(actor, skillKey, attr);
              return {
                key: attr,
                label: capAttr(attr),
                numDice: pool.numDice,
                keepDice: pool.keepDice,
                halfPool: pool.halfPool,
                selected: selectedAttribute === attr,
              };
            })
          : [];

      const showAttributePick = attributeOptions.length > 0;
      const rollReady = !multiAttribute || !!selectedAttribute;
      const canRoll =
        p.status === 'pending' && isOwner && this.session.status === 'active';

      const showRollResult = (awaitingSpend || rolled) && !!result && !skipped;
      const diceFaces = showRollResult && result?.diceFaces?.length
        ? result.diceFaces
        : showRollResult && result?.rollPayload?.rollResult
          ? buildEpicDiceFaces(result.rollPayload.rollResult)
          : [];

      let echoOffers: ReturnType<typeof getEpicEchoCardOffers> = [];
      let showEchoCards = false;
      const displayRaises = result?.raises ?? 0;

      if (
        isSkillRoll &&
        skillKey &&
        actor &&
        isOwner &&
        result?.success &&
        showRollResult &&
        !result.echoCardUsed &&
        !showSkillSpend
      ) {
        echoOffers = getEpicEchoCardOffers(actor, skillKey);
        showEchoCards = echoOffers.length > 0;
      }

      return {
        ...p,
        portrait: resolveActorPortraitSrc(actor, p.img),
        isOwner,
        result,
        success: displaySuccess,
        displayTotal,
        displayRaises,
        skipped,
        canRoll,
        rollReady,
        showAttributePick,
        attributeOptions,
        selectedAttribute: selectedAttribute ?? '',
        awaitingSpend,
        showRollResult,
        showResultFrame: showRollResult,
        diceFaces,
        showDiceFaces: diceFaces.length > 0,
        showFinalMeta: rolled && (!!result?.skillSpent || !!result?.echoCardUsed || !!result?.rerolled),
        echoCardUsed: result?.echoCardUsed,
        waiting: p.status === 'pending' && !isOwner,
        showFailureActions,
        showSkillSpend,
        showReroll,
        skillPackets,
        selectedSpendAmount,
        canAddSkillPoints,
        showEchoCards,
        echoOffers,
      };
    });

    return {
      session: this.session,
      rollLabel,
      resolved,
      total,
      isGM,
      isActive: this.session.status === 'active',
      showTn: this.session.showTn,
      tn: this.session.tn,
      participants,
      rolling: this.rolling,
      bandHue,
    };
  }

  async render(): Promise<void> {
    if (this.session.status !== 'active') {
      this.close();
      return;
    }

    const seq = ++this.renderSeq;
    const context = await this.buildContext();
    const html = await foundry.applications.handlebars.renderTemplate(TEMPLATE, context);
    if (seq !== this.renderSeq) return;

    if (!this.root) {
      this.root = document.createElement('div');
      this.root.id = 'mastery-epic-roll-cinematic-root';
      document.body.appendChild(this.root);
    }

    this.root.innerHTML = html;
    this.bind();
  }

  private bind(): void {
    const root = this.root;
    if (!root) return;
    const fallback = portraitFallbackSrc();

    root.querySelectorAll<HTMLImageElement>('.emr-portrait-img, .emr-actor-thumb').forEach((img) => {
      img.onerror = () => {
        if (img.src !== fallback) img.src = fallback;
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-pick-attr"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        const actorId = btn.getAttribute('data-actor-id') ?? btn.dataset.actorId;
        const attribute = btn.getAttribute('data-emr-attr') ?? btn.dataset.emrAttr;
        if (!actorId || !attribute) return;
        this.selectedAttributes[actorId] = attribute;
        void this.render();
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-roll"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        if (this.rolling || this.session.status !== 'active' || btn.hasAttribute('disabled')) return;
        const actorId = btn.dataset.actorId;
        if (!actorId) return;
        const attributeKey = this.selectedAttributes[actorId];
        this.rolling = true;
        btn.setAttribute('disabled', 'true');
        try {
          await performEpicParticipantRoll(this.session, actorId, attributeKey);
          delete this.selectedAttributes[actorId];
          delete this.selectedSpendPackets[actorId];
        } finally {
          this.rolling = false;
        }
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-toggle-packet"]').forEach((btn) => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        if (btn.hasAttribute('disabled')) return;
        const actorId = btn.getAttribute('data-actor-id') ?? btn.dataset.actorId;
        const packetIndex = parseInt(btn.getAttribute('data-packet-index') ?? '-1', 10);
        if (!actorId || packetIndex < 0) return;
        const selected = this.spendSelectionFor(actorId);
        selected[packetIndex] = !selected[packetIndex];
        void this.render();
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-use-echo"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        if (btn.hasAttribute('disabled')) return;
        const actorId = btn.getAttribute('data-actor-id') ?? btn.dataset.actorId;
        const cardId = btn.getAttribute('data-card-id') ?? btn.dataset.cardId;
        const optionId = btn.getAttribute('data-option-id') ?? btn.dataset.optionId;
        if (!actorId || !cardId || !optionId) return;
        btn.setAttribute('disabled', 'true');
        await applyEpicEchoCardToResult(this.session, actorId, cardId, optionId);
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-add-skill"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        if (btn.hasAttribute('disabled')) return;
        const actorId = btn.getAttribute('data-actor-id') ?? btn.dataset.actorId;
        if (!actorId) return;
        const amount = sumSelectedPacketSpend(
          buildSkillSpendPackets(
            this.#remainingPoolForActor(actorId),
            this.#masteryRankForActor(actorId),
          ),
          this.spendSelectionFor(actorId),
        );
        if (amount <= 0) return;
        btn.setAttribute('disabled', 'true');
        await applyEpicSkillSpendAndFinalize(this.session, actorId, amount);
        delete this.selectedSpendPackets[actorId];
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-reroll"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        if (this.rolling || this.session.status !== 'active' || btn.hasAttribute('disabled')) return;
        const actorId = btn.dataset.actorId;
        if (!actorId) return;
        this.rolling = true;
        btn.setAttribute('disabled', 'true');
        try {
          await performEpicParticipantReroll(this.session, actorId);
          delete this.selectedSpendPackets[actorId];
        } finally {
          this.rolling = false;
        }
      };
    });

    root.querySelectorAll<HTMLElement>('[data-action="emr-confirm"]').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const actorId = btn.dataset.actorId;
        if (!actorId) return;
        btn.setAttribute('disabled', 'true');
        await confirmEpicRollWithoutSpend(this.session, actorId);
        delete this.selectedSpendPackets[actorId];
      };
    });

    const cancelBtn = root.querySelector<HTMLElement>('[data-action="emr-cancel"]');
    if (cancelBtn) {
      cancelBtn.onclick = async (ev) => {
        ev.preventDefault();
        const { cancelEpicMasteryRollSession } = await import('./epic-mastery-roll-session.js');
        await cancelEpicMasteryRollSession();
      };
    }
  }

  #remainingPoolForActor(actorId: string): number {
    const result = this.session.results[actorId];
    const actor = game.actors?.get(actorId);
    if (!result?.skillKey || !actor) return 0;
    const system = (actor as any).system;
    const skillRating = Number(system.skills?.[result.skillKey] ?? 0);
    const skillsSpent = Number(system.skillsSpent?.[result.skillKey] ?? 0);
    return Math.max(0, skillRating - skillsSpent);
  }

  #masteryRankForActor(actorId: string): number {
    const actor = game.actors?.get(actorId);
    return Number((actor as any)?.system?.mastery?.rank ?? 2);
  }

  updateSession(session: EpicMasteryRollSession): void {
    this.session = session;
    for (const p of session.participants) {
      if (p.status !== 'pending') {
        delete this.selectedAttributes[p.actorId];
      }
      if (p.status !== 'awaiting_spend') {
        delete this.selectedSpendPackets[p.actorId];
      }
    }
    void this.render();
  }

  close(): void {
    this.root?.remove();
    this.root = null;
    this.selectedAttributes = {};
    this.selectedSpendPackets = {};
  }
}

let activeOverlay: EpicMasteryRollOverlay | null = null;

export async function openEpicMasteryRollApp(session: EpicMasteryRollSession): Promise<void> {
  if (session.status !== 'active') {
    return;
  }

  if (activeOverlay) {
    activeOverlay.updateSession(session);
    return;
  }

  activeOverlay = new EpicMasteryRollOverlay(session);
  await activeOverlay.render();
}

export function closeEpicMasteryRollApp(): void {
  activeOverlay?.close();
  activeOverlay = null;
}

export function getEpicMasteryRollApp(): EpicMasteryRollOverlay | null {
  return activeOverlay;
}
