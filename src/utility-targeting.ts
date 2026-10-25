/**
 * Utility Targeting System for Mastery System
 * 
 * Provides targeting preview and selection for utility powers, especially AoE utilities
 * Supports single-target and radius AoE with manual target selection
 */

import type { RadialCombatOption, TargetGroup } from './token-radial-menu';
import {
  consumeAttackAction,
  getAvailableAttackActions,
  markPowerUsedThisRound,
  markNpcAttackUsedThisRound,
} from './combat/action-economy';
import { extractMeleeAoePowerBonusD8 } from './utils/power-mechanics.js';
import { getNpcAttackByIndex, npcDamageDiceFormula } from './utils/npc-attack-model.js';
import {
  isWithinMasteryPowerRange,
  masteryAoERadiusPixels,
  masteryPowerMaxSteps
} from './utils/grid-range.js';
import {
  clearHexHighlight,
  highlightGridOffsets,
  highlightHexesInRange,
  highlightHexesWithinStepsFromPoint,
} from './utils/hex-highlighting.js';
import { bestConeEdgePair, wideningConeCells, type GridOffset } from './utils/cone-template.js';
import {
  eventWorldPoint,
  resolveOverlayContainer,
  snapWorldCenter,
} from './utils/grid-snap.js';
import { pickTokenAtPoint } from './utils/token-pick.js';
import { tokenIsExcludedAsTarget } from './combat/defeated-token.js';
import { utilitySingleTargetAllowsSelf } from './utility-targeting-rules.js';
import { artifactLevelToTemplateRank } from './utils/artifact-spell-pick.js';
import { getTemplate } from './utils/powers/templates/index.js';

export { utilitySingleTargetAllowsSelf };
type PlacementColors = {
  hex: number;
  hexAlpha: number;
  previewAlpha: number;
  lineValid: number;
  lineInvalid: number;
  tokenTint: number;
  previewLine: number;
  previewFill: number;
};

function placementColorsFromOption(option: RadialCombatOption): PlacementColors {
  if (option.aoePlacementProfile === 'hostile-zone') {
    return {
      hex: 0xff8833,
      hexAlpha: 0.35,
      previewAlpha: 0.28,
      lineValid: 0xffaa44,
      lineInvalid: 0xff4444,
      tokenTint: 0xff8833,
      previewLine: 0xff8833,
      previewFill: 0xff8833
    };
  }
  if (option.aoePlacementProfile === 'heal' || option.aoePlacementProfile === 'cleanse') {
    return {
      hex: 0x44cc88,
      hexAlpha: 0.35,
      previewAlpha: 0.28,
      lineValid: 0x55dd99,
      lineInvalid: 0xff6666,
      tokenTint: 0x44cc88,
      previewLine: 0x44cc88,
      previewFill: 0x44cc88
    };
  }
  return {
    hex: 0x66aaff,
    hexAlpha: 0.35,
    previewAlpha: 0.28,
    lineValid: 0x66aaff,
    lineInvalid: 0xff6666,
    tokenTint: 0x66aaff,
    previewLine: 0x66aaff,
    previewFill: 0x66aaff
  };
}

/**
 * Utility target state for a candidate token
 */
interface UtilityTargetState {
  token: any;
  inRadius: boolean;
  selected: boolean;
  isAlly: boolean;
  isEnemy: boolean;
  originalAlpha: number;
}

/**
 * Main utility targeting state
 */
interface UtilityTargetingState {
  casterToken: any;
  option: RadialCombatOption;
  rangeMeters: number;
  radiusMeters: number;
  center: { x: number; y: number } | null; // null means not yet chosen (for ranged zones)
  candidates: Map<string, UtilityTargetState>;
  selectedTargets: Set<string>; // token IDs
  highlightId: string;
  /** AoE preview while moving cursor (radius mode only). */
  aoePreviewLayerId?: string;
  placement: PlacementColors;
  previewGraphics: PIXI.Graphics | null;
  rangeLineGraphics: PIXI.Graphics | null;
  panelApp: any | null;
  onPointerMove: (ev: PIXI.FederatedPointerEvent) => void;
  onPointerDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
  manualMode: boolean;
  /** Hard filter: allies/players can never be (pre-)selected while active. */
  excludeAllies: boolean;
  /** Heal/Cleanse: green rings + stage hit-pads (like ranged attack aim). */
  supportMode?: boolean;
  rings?: Map<string, PIXI.Graphics>;
  hitPads?: Map<string, PIXI.Graphics>;
  validTargetIds?: Set<string>;
  confirming?: boolean;
}

// Global utility targeting state
let activeUtilityTargeting: UtilityTargetingState | null = null;

function isSupportPlacement(option: RadialCombatOption | null | undefined): boolean {
  const p = option?.aoePlacementProfile;
  return p === 'heal' || p === 'cleanse';
}

function createSupportTargetRing(token: any, color: number): PIXI.Graphics {
  const ring = new PIXI.Graphics();
  const radius = (token.w ?? token.width ?? 50) / 2 + 10;
  ring.lineStyle(3, color, 0.95);
  ring.drawCircle(0, 0, radius);
  ring.position.set(token.center.x, token.center.y);
  ring.eventMode = 'none';
  (ring as any).interactive = false;
  (ring as any).interactiveChildren = false;
  canvas.stage.addChild(ring);
  return ring;
}

function createSupportHitPad(
  token: any,
  targetId: string,
  color: number,
  onClick: (id: string) => void,
): PIXI.Graphics {
  const pad = new PIXI.Graphics();
  const w = token.w ?? 50;
  const h = token.h ?? 50;
  const padW = w + 16;
  const padH = h + 16;
  pad.beginFill(color, 0.001);
  pad.drawRect(-padW / 2, -padH / 2, padW, padH);
  pad.endFill();
  pad.position.set(token.center.x, token.center.y);
  pad.eventMode = 'static';
  pad.cursor = 'pointer';
  (pad as any).msTargetTokenId = targetId;
  pad.on('pointerdown', (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();
    onClick(targetId);
  });
  canvas.stage.addChild(pad);
  return pad;
}

function clearSupportVisuals(state: UtilityTargetingState): void {
  for (const ring of state.rings?.values() ?? []) {
    if (ring.parent) ring.parent.removeChild(ring);
    ring.destroy(true);
  }
  state.rings?.clear();
  for (const pad of state.hitPads?.values() ?? []) {
    if (pad.parent) pad.parent.removeChild(pad);
    pad.destroy(true);
  }
  state.hitPads?.clear();
}

function collectSupportValidTargets(
  casterToken: any,
  rangeMeters: number,
  targetGroup: TargetGroup,
  opts?: {
    requireCleansable?: boolean;
    hasCleansable?: (actor: any, token: any) => boolean;
  },
): Set<string> {
  const out = new Set<string>();
  const allowSelf = utilitySingleTargetAllowsSelf(targetGroup);
  const casterCenter = casterToken.center;
  const requireCleansable = !!opts?.requireCleansable;
  const hasCleansable = opts?.hasCleansable;
  for (const targetToken of canvas.tokens?.placeables ?? []) {
    if (!targetToken?.id || !targetToken.actor) continue;
    if (!allowSelf && targetToken.id === casterToken.id) continue;
    if (tokenIsExcludedAsTarget(targetToken)) continue;
    if (!matchesTargetGroup(casterToken, targetToken, targetGroup)) continue;
    if (!isWithinMasteryPowerRange(casterCenter, targetToken.center, rangeMeters)) continue;
    if (requireCleansable && hasCleansable && !hasCleansable(targetToken.actor, targetToken)) {
      continue;
    }
    out.add(targetToken.id);
  }
  return out;
}

/**
 * Heal / Cleanse single-target: green range area + green target rings + hit-pads.
 * No aim line (unlike generic utility cursor-line mode).
 */
function resolveSupportRangeMeters(option: RadialCombatOption): number {
  const rangeMeters = Number(option.rangeMeters ?? option.range ?? 0) || 0;
  if (rangeMeters > 0) return rangeMeters;
  // Artifact rows sometimes omit Range; fall back to catalog template at stage rank.
  const tid = String(option.artifactPowerTemplateId || '');
  if (!tid) return 0;
  try {
    const tpl = getTemplate(tid);
    const rankKey = artifactLevelToTemplateRank(option.artifactRowLevel || 1);
    const row = (tpl?.levels as any)?.[String(rankKey)];
    const m = Number(row?.range?.m ?? row?.rangeMeters);
    if (Number.isFinite(m) && m > 0) return m;
    const raw = String(row?.range || '');
    const parsed = /(\d+(?:\.\d+)?)\s*m/i.exec(raw);
    if (parsed) return parseFloat(parsed[1]);
  } catch {
    /* ignore */
  }
  return 0;
}

async function startSupportAllyTargetMode(token: any, option: RadialCombatOption): Promise<void> {
  const rangeMeters = resolveSupportRangeMeters(option);
  option.rangeMeters = rangeMeters;
  option.range = rangeMeters;
  const targetGroup = (option.defaultTargetGroup || 'ally') as TargetGroup;
  const placement = placementColorsFromOption(option);
  const highlightId = `mastery-support-${option.aoePlacementProfile || 'heal'}`;
  const rings = new Map<string, PIXI.Graphics>();
  const hitPads = new Map<string, PIXI.Graphics>();
  const candidates = new Map<string, UtilityTargetState>();

  const previewGraphics = new PIXI.Graphics();
  const effectsContainer = resolveOverlayContainer();
  if (effectsContainer) effectsContainer.addChild(previewGraphics);

  const isCleanse = option.aoePlacementProfile === 'cleanse';
  let hasCleansable: ((actor: any, tok: any) => boolean) | undefined;
  if (isCleanse) {
    const { listCleansableForActor } = await import('./combat/cleanse-resolution.js');
    hasCleansable = (actor, tok) => listCleansableForActor(actor, tok).length > 0;
  }
  const validTargetIds = collectSupportValidTargets(token, rangeMeters, targetGroup, {
    requireCleansable: isCleanse,
    hasCleansable,
  });

  // Soft green range disc / hex field (same footprint as attack aim, green).
  const casterId = token?.document?.id ?? token?.id;
  const steps = masteryPowerMaxSteps(rangeMeters);
  const grid: any = canvas.grid;
  if (casterId && grid && grid.type !== CONST.GRID_TYPES.GRIDLESS && steps > 0) {
    highlightHexesInRange(casterId, steps, highlightId, placement.hex, placement.hexAlpha);
  } else if (steps > 0 && token?.center) {
    const r = masteryAoERadiusPixels(rangeMeters);
    previewGraphics.clear();
    previewGraphics.lineStyle(2, placement.hex, 0.55);
    previewGraphics.beginFill(placement.hex, 0.12);
    previewGraphics.drawCircle(0, 0, r);
    previewGraphics.endFill();
    previewGraphics.position.set(token.center.x, token.center.y);
    previewGraphics.eventMode = 'none';
  }

  const confirmSupportTarget = (targetId: string) => {
    const state = activeUtilityTargeting;
    if (!state?.supportMode || state.confirming) return;
    if (!state.validTargetIds?.has(targetId)) return;
    const clicked = canvas.tokens?.get(targetId);
    if (!clicked) return;
    state.confirming = true;
    state.selectedTargets = new Set([targetId]);
    state.candidates.set(targetId, {
      token: clicked,
      inRadius: true,
      selected: true,
      isAlly: isAlly(token, clicked),
      isEnemy: isEnemy(token, clicked),
      originalAlpha: (clicked as any)._originalAlpha ?? clicked.alpha,
    });
    void confirmUtilityTargets(state).finally(() => {
      if (activeUtilityTargeting === state) state.confirming = false;
    });
  };

  for (const targetId of validTargetIds) {
    const targetToken = canvas.tokens?.get(targetId);
    if (!targetToken) continue;
    (targetToken as any)._originalAlpha = targetToken.alpha;
    candidates.set(targetId, {
      token: targetToken,
      inRadius: true,
      selected: false,
      isAlly: isAlly(token, targetToken),
      isEnemy: isEnemy(token, targetToken),
      originalAlpha: targetToken.alpha,
    });
    rings.set(targetId, createSupportTargetRing(targetToken, placement.tokenTint));
    hitPads.set(targetId, createSupportHitPad(targetToken, targetId, placement.tokenTint, confirmSupportTarget));
  }

  const onPointerDown = (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button === 2 || ev.button === 1) {
      endUtilityTargeting(false);
      return;
    }
    if (ev.button !== 0) return;
    // Hit-pads handle valid targets (stopPropagation). Empty canvas → cancel.
    const worldPos = eventWorldPoint(ev);
    const clicked = pickTokenAtPoint(worldPos.x, worldPos.y, { noCenterFallback: true });
    if (clicked?.id && validTargetIds.has(clicked.id)) {
      confirmSupportTarget(clicked.id);
      return;
    }
    endUtilityTargeting(false);
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') endUtilityTargeting(false);
  };

  const state: UtilityTargetingState = {
    casterToken: token,
    option,
    rangeMeters,
    radiusMeters: 0,
    center: null,
    candidates,
    selectedTargets: new Set(),
    highlightId,
    placement,
    previewGraphics,
    rangeLineGraphics: null,
    panelApp: null,
    onPointerMove: () => {},
    onPointerDown,
    onKeyDown,
    manualMode: false,
    excludeAllies: false,
    supportMode: true,
    rings,
    hitPads,
    validTargetIds,
    confirming: false,
  };

  activeUtilityTargeting = state;
  canvas.stage.on('pointerdown', state.onPointerDown);
  window.addEventListener('keydown', state.onKeyDown);

  const label = option.aoePlacementProfile === 'cleanse' ? 'Cleanse' : 'Heal';
  if (validTargetIds.size) {
    ui.notifications?.info?.(
      `${label}: grüne Ziele in ${rangeMeters} m anklicken.`,
    );
  } else {
    ui.notifications?.warn?.(
      `${label}: kein gültiges Ziel in ${rangeMeters} m.`,
    );
  }
}

/**
 * Check if a token is an ally of the caster
 */
function isAlly(casterToken: any, targetToken: any): boolean {
  const casterActor = casterToken.actor;
  const targetActor = targetToken.actor;
  
  if (!casterActor || !targetActor) return false;
  
  // Same actor
  if (casterActor.id === targetActor.id) return true;

  // Player characters are one party — regardless of token disposition
  // (scenes often carry misconfigured/default dispositions).
  if (casterActor.type === 'character' && targetActor.type === 'character') return true;

  // Check disposition
  const casterDisposition = casterToken.document.disposition;
  const targetDisposition = targetToken.document.disposition;
  
  // Friendly or neutral to friendly
  if (casterDisposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY && 
      targetDisposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) {
    return true;
  }
  
  // Check if same player owns both
  if (casterActor.hasPlayerOwner && targetActor.hasPlayerOwner) {
    const casterOwners = casterActor.ownership;
    const targetOwners = targetActor.ownership;
    
    // If any player owns both, they're allies
    for (const userId in casterOwners) {
      if (casterOwners[userId] > 0 && targetOwners[userId] > 0) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if a token is an enemy of the caster
 */
function isEnemy(_casterToken: any, targetToken: any): boolean {
  const targetDisposition = targetToken.document.disposition;
  return targetDisposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;
}

/**
 * Check if token matches target group
 */
function matchesTargetGroup(casterToken: any, targetToken: any, group: TargetGroup): boolean {
  if (group === 'self') {
    return casterToken.id === targetToken.id;
  }
  if (group === 'ally') {
    return isAlly(casterToken, targetToken);
  }
  if (group === 'enemy') {
    return isEnemy(casterToken, targetToken);
  }
  if (group === 'creature' || group === 'any') {
    return true; // All tokens match
  }
  return false;
}

/**
 * Find candidate tokens within radius
 */
function findCandidatesInRadius(
  casterToken: any,
  center: { x: number; y: number },
  radiusMeters: number,
  targetGroup: TargetGroup
): Map<string, UtilityTargetState> {
  const candidates = new Map<string, UtilityTargetState>();
  const allTokens = canvas.tokens?.placeables || [];

  for (const token of allTokens) {
    if (tokenIsExcludedAsTarget(token)) continue;
    const tokenCenter = token.center;

    if (isWithinMasteryPowerRange(center, tokenCenter, radiusMeters)) {
      const isAllyToken = isAlly(casterToken, token);
      const isEnemyToken = isEnemy(casterToken, token);
      const matches = matchesTargetGroup(casterToken, token, targetGroup);
      
      const state: UtilityTargetState = {
        token,
        inRadius: true,
        selected: matches, // Default: selected if matches target group
        isAlly: isAllyToken,
        isEnemy: isEnemyToken,
        originalAlpha: token.alpha
      };
      
      candidates.set(token.id, state);
    }
  }
  
  return candidates;
}

/**
 * Highlight radius area on grid
 */
function highlightRadiusArea(state: UtilityTargetingState): void {
  if (!state.previewGraphics || !state.center) return;

  const center = state.center;
  const grid: any = canvas.grid;
  const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;

  state.previewGraphics.clear();

  const c = state.placement;
  if (gridless) {
    const radiusPx = masteryAoERadiusPixels(state.radiusMeters);
    if (state.radiusMeters > 0 && radiusPx > 0) {
      state.previewGraphics.lineStyle(2, c.previewLine, 0.85);
      state.previewGraphics.beginFill(c.previewFill, 0.14);
      state.previewGraphics.drawCircle(0, 0, radiusPx);
      state.previewGraphics.endFill();
    }
    state.previewGraphics.position.set(center.x, center.y);
    return;
  }

  state.previewGraphics.position.set(0, 0);

  const steps = masteryPowerMaxSteps(state.radiusMeters);
  clearHexHighlight(state.highlightId);
  if (steps > 0) {
    highlightHexesWithinStepsFromPoint(center, steps, state.highlightId, c.hex, c.hexAlpha);
  }
}

/**
 * Update visual markers for candidate tokens
 */
function updateCandidateVisuals(state: UtilityTargetingState): void {
  for (const [, candidate] of state.candidates.entries()) {
    const token = candidate.token;
    
    // Restore original alpha
    token.alpha = candidate.originalAlpha;
    
    // Remove existing filters
    if (token.filters) {
      token.filters = token.filters.filter((f: any) => {
        return !(f instanceof PIXI.filters.ColorMatrixFilter);
      });
      if (token.filters.length === 0) {
        token.filters = null;
      }
    }
    
    // Apply visual based on selection state
    if (candidate.selected) {
      token.alpha = Math.min(1.0, candidate.originalAlpha);
      const tintFilter = new PIXI.filters.ColorMatrixFilter();
      tintFilter.tint(state.placement.tokenTint, false);
      token.filters = [...(token.filters || []), tintFilter];
    } else {
      // Not selected: faded
      token.alpha = candidate.originalAlpha * 0.4;
    }
  }
}

/**
 * Create UI panel for target selection
 */
function createTargetSelectionPanel(state: UtilityTargetingState): any {
  const isAttackAoe =
    state.option.slot === 'attack' &&
    (state.option.aoePlacementProfile === 'hostile-zone' || state.option.aoeShape === 'cone');
  const confirmLabel = isAttackAoe
    ? 'Confirm AoE'
    : state.option.aoePlacementProfile === 'hostile-zone'
      ? 'Zone bestätigen'
      : 'Confirm Utility';
  const affectedNames = Array.from(state.selectedTargets)
    .map((id) => {
      const c = state.candidates.get(id);
      return String(c?.token?.name || c?.token?.actor?.name || id);
    })
    .filter(Boolean);
  const affectedListHtml = isAttackAoe
    ? `<div class="panel-affected" style="margin:0.4em 0; max-height:9em; overflow:auto;">
        <div style="font-weight:600; margin-bottom:0.25em;">Affected creatures</div>
        <ul style="margin:0; padding-left:1.2em;">${affectedNames.map((n) => `<li>${n}</li>`).join('') || '<li><em>None</em></li>'}</ul>
        <div style="opacity:0.8; font-size:0.9em; margin-top:0.35em;">Hits are decided after the Attack Roll (vs each Evade).</div>
      </div>`
    : '';
  const panelContent = `
    <div class="mastery-utility-panel">
      <div class="panel-header">
        <h4>${state.option.name}</h4>
        <div class="panel-subtitle">${isAttackAoe ? 'Affected creatures in AoE' : 'Select Targets'}</div>
      </div>
      ${affectedListHtml}
      <div class="panel-controls">
        <button class="panel-btn" data-action="allies">Allies</button>
        <button class="panel-btn" data-action="enemies">Enemies</button>
        <button class="panel-btn" data-action="all">All</button>
        <button class="panel-btn" data-action="none">None</button>
      </div>
      <div class="panel-toggle">
        <label title="Verbündete und Spieler-Charaktere können nicht als Ziel gewählt werden, solange aktiv.">
          <input type="checkbox" id="exclude-allies" ${state.excludeAllies ? 'checked' : ''}>
          Verbündete/Spieler ausnehmen
        </label>
      </div>
      <div class="panel-toggle">
        <label>
          <input type="checkbox" id="manual-mode" ${state.manualMode ? 'checked' : ''}>
          Manual Selection Mode
        </label>
      </div>
      <div class="panel-actions">
        <button class="panel-btn confirm" data-action="confirm">${confirmLabel}</button>
        <button class="panel-btn cancel" data-action="cancel">Cancel</button>
      </div>
      <div class="panel-info">
        <div>Affected: <span id="selected-count">0</span></div>
      </div>
    </div>
  `;
  
  // Real Foundry window (framed, draggable, centred) instead of a bare fixed
  // DOM box in the top-left corner — the acting player sees it like any dialog.
  const { ApplicationV2 } = (foundry as any).applications.api;
  const isZone = state.option.aoePlacementProfile === 'hostile-zone';
  const windowTitle = isAttackAoe
    ? `${state.option.name} — Affected creatures`
    : isZone
      ? `${state.option.name} — Ziele bestätigen`
      : `${state.option.name} — Select Targets`;
  let bindPanel: ((root: HTMLElement) => void) | null = null;

  class UtilityTargetPanelApp extends ApplicationV2 {
    static DEFAULT_OPTIONS = {
      id: 'mastery-utility-target-panel',
      classes: ['mastery-system', 'mastery-utility-panel-window'],
      position: { width: 320, height: 'auto' },
      window: { title: windowTitle, frame: true, positioned: true, resizable: false, minimizable: false },
    };
    /** Closed via the window ✕ → cancel the whole targeting. */
    _closedByTargeting = false;

    async _renderHTML(): Promise<string> {
      return panelContent;
    }

    _replaceHTML(result: string, content: HTMLElement): void {
      content.innerHTML = result;
    }

    async _onRender(context: any, options: any): Promise<void> {
      await super._onRender?.(context, options);
      const root = (this as any).element as HTMLElement | null;
      if (root) bindPanel?.(root);
    }

    async _onClose(options: any): Promise<void> {
      await super._onClose?.(options);
      if (!this._closedByTargeting && activeUtilityTargeting === state) {
        endUtilityTargeting(false);
      }
    }
  }

  const panel: any = {
    app: null as any,
    element: null,
    render: function () {
      const app = new UtilityTargetPanelApp();
      panel.app = app;
      void app.render({ force: true }).then(() => {
        panel.element = (app as any).element ?? null;
      });
      return app;
    },
    close: function () {
      const app = panel.app;
      panel.app = null;
      panel.element = null;
      if (app) {
        app._closedByTargeting = true;
        void app.close();
      }
    },
  };

  bindPanel = (root: HTMLElement) => {
    const html = $(root);
    panel.element = root;

    // Update selected / affected count (+ name list for attack AoE)
    const updateCount = () => {
      const count = state.selectedTargets.size;
      html.find('#selected-count').text(count);
      const list = html.find('.panel-affected ul');
      if (list.length) {
        const names = Array.from(state.selectedTargets).map((id) => {
          const c = state.candidates.get(id);
          return String(c?.token?.name || c?.token?.actor?.name || id);
        });
        list.html(
          names.length
            ? names.map((n) => `<li>${n}</li>`).join('')
            : '<li><em>None</em></li>',
        );
      }
    };
    
    // Button handlers
    html.find('[data-action="allies"]').on('click', () => {
      // Explicitly targeting allies overrides the exclusion filter.
      if (state.excludeAllies) {
        state.excludeAllies = false;
        html.find('#exclude-allies').prop('checked', false);
      }
      for (const [tokenId, candidate] of state.candidates.entries()) {
        candidate.selected = candidate.isAlly;
        if (candidate.selected) {
          state.selectedTargets.add(tokenId);
        } else {
          state.selectedTargets.delete(tokenId);
        }
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('[data-action="enemies"]').on('click', () => {
      for (const [tokenId, candidate] of state.candidates.entries()) {
        candidate.selected = candidate.isEnemy;
        if (candidate.selected) {
          state.selectedTargets.add(tokenId);
        } else {
          state.selectedTargets.delete(tokenId);
        }
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('[data-action="all"]').on('click', () => {
      for (const [tokenId, candidate] of state.candidates.entries()) {
        if (state.excludeAllies && candidate.isAlly) {
          candidate.selected = false;
          state.selectedTargets.delete(tokenId);
          continue;
        }
        candidate.selected = true;
        state.selectedTargets.add(tokenId);
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('[data-action="none"]').on('click', () => {
      for (const [tokenId, candidate] of state.candidates.entries()) {
        candidate.selected = false;
        state.selectedTargets.delete(tokenId);
      }
      updateCandidateVisuals(state);
      updateCount();
    });
    
    html.find('#exclude-allies').on('change', (ev: JQuery.ChangeEvent) => {
      state.excludeAllies = (ev.target as HTMLInputElement).checked;
      if (state.excludeAllies) {
        // Drop any allies that are currently selected.
        for (const [tokenId, candidate] of state.candidates.entries()) {
          if (candidate.isAlly && candidate.selected) {
            candidate.selected = false;
            state.selectedTargets.delete(tokenId);
          }
        }
        updateCandidateVisuals(state);
        updateCount();
      }
    });
    
    html.find('#manual-mode').on('change', (ev: JQuery.ChangeEvent) => {
      state.manualMode = (ev.target as HTMLInputElement).checked;
    });
    
    html.find('[data-action="confirm"]').on('click', () => {
      if (state.selectedTargets.size === 0) {
        ui.notifications?.warn('No targets selected.');
        return;
      }
      confirmUtilityTargets(state);
    });
    
    html.find('[data-action="cancel"]').on('click', () => {
      endUtilityTargeting(false);
    });

    updateCount();
  };

  return panel;
}

/**
 * Start single-target utility mode
 */
export function startUtilitySingleTargetMode(token: any, option: RadialCombatOption): void {
  // Cancel any existing utility targeting
  endUtilityTargeting(false);
  
  // Ensure token is controlled
  token.control({ releaseOthers: false });

  // Heal / Cleanse: green area + rings + hit-pads (no aim line).
  if (isSupportPlacement(option)) {
    void startSupportAllyTargetMode(token, option);
    return;
  }
  
  const rangeMeters = option.rangeMeters || option.range || 0;
  const targetGroup = option.defaultTargetGroup || 'ally';
  
  // Create preview graphics
  const previewGraphics = new PIXI.Graphics();
  const rangeLineGraphics = new PIXI.Graphics();
  
  const effectsContainer = resolveOverlayContainer();
  if (effectsContainer) {
    effectsContainer.addChild(previewGraphics);
    effectsContainer.addChild(rangeLineGraphics);
  } else {
    console.warn('Mastery System | Utility targeting: no overlay container for preview graphics');
  }
  
  const highlightId = 'mastery-utility-single';
  const placement = placementColorsFromOption(option);

  // Event handlers
  const onPointerMove = (ev: PIXI.FederatedPointerEvent) => {
    try {
      const worldPos = eventWorldPoint(ev);
      const snapped = snapWorldCenter(worldPos.x, worldPos.y);

      // Draw range line
      rangeLineGraphics.clear();
      const casterCenter = token.center;
      const isValid = isWithinMasteryPowerRange(casterCenter, snapped, rangeMeters);

      rangeLineGraphics.lineStyle(2, isValid ? placement.lineValid : placement.lineInvalid, 0.8);
      rangeLineGraphics.moveTo(casterCenter.x, casterCenter.y);
      rangeLineGraphics.lineTo(snapped.x, snapped.y);

      // Highlight valid targets
      const allTokens = canvas.tokens?.placeables || [];
      const allowSelf = utilitySingleTargetAllowsSelf(targetGroup);
      for (const targetToken of allTokens) {
        if (!allowSelf && targetToken.id === token.id) continue;
        if (tokenIsExcludedAsTarget(targetToken)) continue;

        const targetCenter = targetToken.center;
        const isInRange = isWithinMasteryPowerRange(casterCenter, targetCenter, rangeMeters);
        const matches = matchesTargetGroup(token, targetToken, targetGroup);

        if (isInRange && matches) {
          // Highlight valid target
          targetToken.alpha = Math.min(1.0, targetToken.alpha);
          if (!targetToken.filters) {
            const tintFilter = new PIXI.filters.ColorMatrixFilter();
            tintFilter.tint(placement.tokenTint, false);
            targetToken.filters = [tintFilter];
          }
        } else {
          // Restore normal appearance
          targetToken.alpha = (targetToken as any)._originalAlpha || 1.0;
          if (targetToken.filters) {
            targetToken.filters = targetToken.filters.filter((f: any) => {
              return !(f instanceof PIXI.filters.ColorMatrixFilter);
            });
            if (targetToken.filters.length === 0) {
              targetToken.filters = null;
            }
          }
        }
      }
    } catch (err) {
      console.error('Mastery System | Utility single-target pointermove failed', err);
    }
  };
  
  const onPointerDown = (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button === 2 || ev.button === 1) {
      endUtilityTargeting(false);
      return;
    }
    
    if (ev.button === 0) {
      const worldPos = eventWorldPoint(ev);
      const allowSelf = utilitySingleTargetAllowsSelf(targetGroup);
      const clickedToken = pickTokenAtPoint(worldPos.x, worldPos.y, {
        excludeIds: allowSelf || !token?.id ? [] : [token.id],
        noCenterFallback: true,
      });
      
      if (clickedToken && (allowSelf || clickedToken.id !== token.id) && !tokenIsExcludedAsTarget(clickedToken)) {
        const casterCenter = token.center;
        const matches = matchesTargetGroup(token, clickedToken, targetGroup);
        
        if (isWithinMasteryPowerRange(casterCenter, clickedToken.center, rangeMeters) && matches) {
          confirmUtilityTargets({
            casterToken: token,
            option,
            rangeMeters: 0,
            radiusMeters: 0,
            center: null,
            candidates: new Map([[clickedToken.id, {
              token: clickedToken,
              inRadius: true,
              selected: true,
              isAlly: isAlly(token, clickedToken),
              isEnemy: isEnemy(token, clickedToken),
              originalAlpha: clickedToken.alpha
            }]]),
            selectedTargets: new Set([clickedToken.id]),
            highlightId,
            placement,
            previewGraphics,
            rangeLineGraphics,
            panelApp: null,
            onPointerMove,
            onPointerDown,
            onKeyDown: () => {},
            manualMode: false,
            excludeAllies: false
          });
          return;
        }
      }
      
      // Clicked outside - cancel
      endUtilityTargeting(false);
    }
  };
  
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      endUtilityTargeting(false);
    }
  };
  
  const state: UtilityTargetingState = {
    casterToken: token,
    option,
    rangeMeters,
    radiusMeters: 0,
    center: null,
    candidates: new Map(),
    selectedTargets: new Set(),
    highlightId,
    placement,
    previewGraphics,
    rangeLineGraphics,
    panelApp: null,
    onPointerMove,
    onPointerDown,
    onKeyDown,
    manualMode: false,
    excludeAllies: false
  };
  
  activeUtilityTargeting = state;

  // Store original alphas
  const allTokens = canvas.tokens?.placeables || [];
  for (const t of allTokens) {
    (t as any)._originalAlpha = t.alpha;
  }

  // Attach event listeners
  canvas.stage.on('pointermove', state.onPointerMove);
  canvas.stage.on('pointerdown', state.onPointerDown);
  window.addEventListener('keydown', state.onKeyDown);
}

/** Heal/Cleanse radius: allies only, no Allies/Enemies picker — resolve after center is known. */
function isSupportRadiusAutoResolve(option: RadialCombatOption): boolean {
  return (
    (option.aoePlacementProfile === 'heal' || option.aoePlacementProfile === 'cleanse') &&
    option.aoeShape === 'radius'
  );
}

/** Keep only tokens that match the option's target group (allies for heal/cleanse). */
function pruneCandidatesToTargetGroup(
  state: UtilityTargetingState,
  casterToken: any,
  targetGroup: TargetGroup,
): void {
  for (const [tokenId, candidate] of [...state.candidates.entries()]) {
    if (!matchesTargetGroup(casterToken, candidate.token, targetGroup)) {
      state.candidates.delete(tokenId);
      state.selectedTargets.delete(tokenId);
    }
  }
}

function selectAllCandidates(state: UtilityTargetingState): void {
  state.selectedTargets.clear();
  for (const [tokenId, candidate] of state.candidates.entries()) {
    candidate.selected = true;
    state.selectedTargets.add(tokenId);
  }
}

function finalizeSupportRadiusTargets(state: UtilityTargetingState): void {
  const targetGroup = (state.option.defaultTargetGroup || 'ally') as TargetGroup;
  pruneCandidatesToTargetGroup(state, state.casterToken, targetGroup);
  selectAllCandidates(state);
  updateCandidateVisuals(state);
  void confirmUtilityTargets(state);
}

/**
 * Start radius utility mode
 */
export function startUtilityRadiusMode(token: any, option: RadialCombatOption): void {
  // Cancel any existing utility targeting
  endUtilityTargeting(false);
  
  // Ensure token is controlled
  token.control({ releaseOthers: false });
  
  const rangeMeters = option.rangeMeters || option.range || 0;
  const radiusMeters = option.aoeRadiusMeters || 0;
  const targetGroup = option.defaultTargetGroup || 'ally';
  const supportAuto = isSupportRadiusAutoResolve(option);
  // Create preview graphics
  const previewGraphics = new PIXI.Graphics();
  const rangeLineGraphics = new PIXI.Graphics();
  
  const effectsContainer = resolveOverlayContainer();
  if (effectsContainer) {
    effectsContainer.addChild(previewGraphics);
    effectsContainer.addChild(rangeLineGraphics);
  } else {
    console.warn('Mastery System | AoE targeting: no overlay container for preview graphics');
  }
  
  const highlightId = `mastery-aoe-${option.id}`;
  const placement = placementColorsFromOption(option);
  const aoePreviewLayerId = `mastery-aoe-preview-${option.id}`;

  // Create state first (with placeholders for event handlers)
  const state: UtilityTargetingState = {
    casterToken: token,
    option,
    rangeMeters,
    radiusMeters,
    center: null,
    candidates: new Map(),
    selectedTargets: new Set(),
    highlightId,
    aoePreviewLayerId,
    placement,
    previewGraphics,
    rangeLineGraphics,
    panelApp: null,
    onPointerMove: () => {},
    onPointerDown: () => {},
    onKeyDown: () => {},
    manualMode: option.allowManualTargetSelection !== false,
    // Hostile attack zones spare allies; heal/utility keep allies selectable.
    excludeAllies: option.aoePlacementProfile === 'hostile-zone',
  };
  
  activeUtilityTargeting = state;
  
  // Event handlers (can now reference state)
  state.onPointerMove = (ev: PIXI.FederatedPointerEvent) => {
    try {
      if (rangeMeters === 0) {
        // Self-aura: no movement needed
        return;
      }

      if (!state.center) {
        // Still choosing center point — snap to hex/square center and paint AoE preview
        const worldPos = eventWorldPoint(ev);
        const snapped = snapWorldCenter(worldPos.x, worldPos.y);

        // Draw range line
        state.rangeLineGraphics!.clear();
        const casterCenter = token.center;
        const isValid = isWithinMasteryPowerRange(casterCenter, snapped, rangeMeters);

        state.rangeLineGraphics!.lineStyle(
          2,
          isValid ? state.placement.lineValid : state.placement.lineInvalid,
          0.8
        );
        state.rangeLineGraphics!.moveTo(casterCenter.x, casterCenter.y);
        state.rangeLineGraphics!.lineTo(snapped.x, snapped.y);

        if (isValid) {
          state.previewGraphics!.clear();
          const grid: any = canvas.grid;
          const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;
          if (gridless) {
            const radiusPx = masteryAoERadiusPixels(radiusMeters);
            if (radiusMeters > 0 && radiusPx > 0) {
              state.previewGraphics!.lineStyle(2, state.placement.previewLine, 0.75);
              state.previewGraphics!.beginFill(state.placement.previewFill, 0.12);
              state.previewGraphics!.drawCircle(0, 0, radiusPx);
              state.previewGraphics!.endFill();
            }
            state.previewGraphics!.position.set(snapped.x, snapped.y);
          } else {
            state.previewGraphics!.position.set(0, 0);
            if (radiusMeters > 0) {
              highlightHexesWithinStepsFromPoint(
                snapped,
                masteryPowerMaxSteps(radiusMeters),
                state.aoePreviewLayerId!,
                state.placement.hex,
                state.placement.previewAlpha
              );
            } else {
              clearHexHighlight(state.aoePreviewLayerId!);
            }
          }
        } else {
          state.previewGraphics!.clear();
          clearHexHighlight(state.aoePreviewLayerId!);
        }
      }
    } catch (err) {
      console.error('Mastery System | AoE radius pointermove failed', err);
    }
  };
  
  state.onPointerDown = (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button === 2 || ev.button === 1) {
      endUtilityTargeting(false);
      return;
    }
    
    if (ev.button === 0) {
      try {
      if (rangeMeters === 0) {
        // Self-aura: clicking toggles targets in manual mode
        if (state.manualMode) {
          const worldPos = eventWorldPoint(ev);
          const clickedToken = pickTokenAtPoint(worldPos.x, worldPos.y, {
            onlyIds: state.candidates.keys(),
            noCenterFallback: true,
          });
          
          if (clickedToken && state.candidates.has(clickedToken.id)) {
            const candidate = state.candidates.get(clickedToken.id)!;
            if (state.excludeAllies && candidate.isAlly && !candidate.selected) {
              ui.notifications?.info('Verbündete/Spieler sind ausgenommen (Häkchen im Panel entfernen, um sie zu treffen).');
              return;
            }
            candidate.selected = !candidate.selected;
            if (candidate.selected) {
              state.selectedTargets.add(clickedToken.id);
            } else {
              state.selectedTargets.delete(clickedToken.id);
            }
            updateCandidateVisuals(state);
            if (state.panelApp) {
              const html = $(state.panelApp.element);
              html.find('#selected-count').text(state.selectedTargets.size);
            }
          }
        }
        return;
      }
      
      if (!state.center) {
        // Choosing center point
        const worldPos = eventWorldPoint(ev);
        const snapped = snapWorldCenter(worldPos.x, worldPos.y);
        
        const casterCenter = token.center;
        
        if (isWithinMasteryPowerRange(casterCenter, snapped, rangeMeters)) {
          state.center = snapped;
          clearHexHighlight(state.aoePreviewLayerId!);
          if (state.center) {
            state.candidates = findCandidatesInRadius(token, state.center, radiusMeters, targetGroup);
          }

          if (supportAuto) {
            highlightRadiusArea(state);
            finalizeSupportRadiusTargets(state);
            return;
          }
          
          // Default selection (allies never pre-selected while excluded)
          for (const [tokenId, candidate] of state.candidates.entries()) {
            if (state.excludeAllies && candidate.isAlly) {
              candidate.selected = false;
              continue;
            }
            if (candidate.selected) {
              state.selectedTargets.add(tokenId);
            }
          }
          
          // Draw radius and update visuals
          highlightRadiusArea(state);
          updateCandidateVisuals(state);
          
          // Create UI panel (framed window, centred by Foundry)
          const panel = createTargetSelectionPanel(state);
          state.panelApp = panel;
          panel.render(true);
        }
      } else {
        // Center chosen, clicking toggles targets in manual mode
        if (state.manualMode) {
          const worldPos = eventWorldPoint(ev);
          const clickedToken = pickTokenAtPoint(worldPos.x, worldPos.y, {
            onlyIds: state.candidates.keys(),
            noCenterFallback: true,
          });
          
          if (clickedToken && state.candidates.has(clickedToken.id)) {
            const candidate = state.candidates.get(clickedToken.id)!;
            if (state.excludeAllies && candidate.isAlly && !candidate.selected) {
              ui.notifications?.info('Verbündete/Spieler sind ausgenommen (Häkchen im Panel entfernen, um sie zu treffen).');
              return;
            }
            candidate.selected = !candidate.selected;
            if (candidate.selected) {
              state.selectedTargets.add(clickedToken.id);
            } else {
              state.selectedTargets.delete(clickedToken.id);
            }
            updateCandidateVisuals(state);
            if (state.panelApp) {
              const html = $(state.panelApp.element);
              html.find('#selected-count').text(state.selectedTargets.size);
            }
          }
        }
      }
      } catch (err) {
        console.error('Mastery System | AoE radius pointerdown failed', err);
      }
    }
  };
  
  state.onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      endUtilityTargeting(false);
    }
  };
  
  // If range is 0, center is always caster's position
  if (rangeMeters === 0) {
    state.center = { x: token.center.x, y: token.center.y };
    state.candidates = findCandidatesInRadius(token, state.center, radiusMeters, targetGroup);

    if (supportAuto) {
      // Melee / Self support AoE: allies in radius → chat allocation (no place / pick UI).
      highlightRadiusArea(state);
      finalizeSupportRadiusTargets(state);
      return;
    }
    
    // Default selection based on target group (allies never pre-selected while excluded)
    for (const [tokenId, candidate] of state.candidates.entries()) {
      if (state.excludeAllies && candidate.isAlly) {
        candidate.selected = false;
        continue;
      }
      if (candidate.selected) {
        state.selectedTargets.add(tokenId);
      }
    }
    
    // Draw radius and update visuals
    highlightRadiusArea(state);
    updateCandidateVisuals(state);
    
    // Create panel immediately (framed window, centred by Foundry)
    const panel = createTargetSelectionPanel(state);
    state.panelApp = panel;
    panel.render(true);
  }
  
  // Store original alphas
  const allTokens = canvas.tokens?.placeables || [];
  for (const t of allTokens) {
    (t as any)._originalAlpha = t.alpha;
  }
  
  // Attach event listeners
  canvas.stage.on('pointermove', state.onPointerMove);
  canvas.stage.on('pointerdown', state.onPointerDown);
  window.addEventListener('keydown', state.onKeyDown);
}

/**
 * Confirm utility targets and resolve power
 */
async function confirmUtilityTargets(state: UtilityTargetingState): Promise<void> {
  const targets = Array.from(state.selectedTargets).map(id => {
    const candidate = state.candidates.get(id);
    return candidate?.token;
  }).filter(t => t !== undefined && !tokenIsExcludedAsTarget(t));
  
  const combat = game.combat;
  const actor = state.casterToken?.actor;
  const isHealPlacement = state.option.aoePlacementProfile === 'heal';
  const isCleansePlacement = state.option.aoePlacementProfile === 'cleanse';
  const isSupport = isHealPlacement || isCleansePlacement;
  // Cone Instant AoE (e.g. Dragon Breath): Attack Action + Breath use are spent
  // on Roll via the attack card — never on targeting confirm / cancel.
  const deferActionSpendToAttackCard =
    state.option.slot === 'attack' && state.option.aoeShape === 'cone';

  if (state.option.costsAction && !deferActionSpendToAttackCard) {
    if (combat && actor) {
      const available = getAvailableAttackActions(actor, combat);
      if (available <= 0) {
        ui.notifications?.warn('No Actions left this round.');
        console.warn('Mastery System | [RADIAL FLOW] utility confirm blocked: no attack actions', {
          option: state.option.name
        });
        endUtilityTargeting(false);
        return;
      }
      const consumed = await consumeAttackAction(actor, combat);
      if (!consumed) {
        ui.notifications?.warn('Failed to consume attack action.');
        endUtilityTargeting(false);
        return;
      }
    } else if (!isSupport) {
      ui.notifications?.warn('Cannot resolve utility: not in combat or missing actor.');
      console.warn('Mastery System | [RADIAL FLOW] utility confirm blocked: no combat/actor', {
        option: state.option.name
      });
      endUtilityTargeting(false);
      return;
    }
    // Heal/Cleanse outside combat: apply without spending an Action.
  } else if (deferActionSpendToAttackCard && state.option.costsAction && combat && actor) {
    const available = getAvailableAttackActions(actor, combat);
    if (available <= 0) {
      ui.notifications?.warn('No Actions left this round.');
      endUtilityTargeting(false);
      return;
    }
  }

  if (state.option.source === 'power' && state.option.item?.id && actor && combat) {
    // Prefer the radial option id for artifact rows (item is the artifact).
    const usageId = String(state.option.id || state.option.item.id);
    await markPowerUsedThisRound(actor, combat, usageId);
  }
  if (state.option.source === 'npc-attack' && state.option.costsAction && actor && combat) {
    await markNpcAttackUsedThisRound(
      actor,
      combat,
      String(state.option.npcAttackUsageKey || state.option.id || ''),
    );
  }

  const isHostileZone = state.option.aoePlacementProfile === 'hostile-zone';
  const isAttackZone = isHostileZone && state.option.slot === 'attack';

  if (isHealPlacement) {
    if (!targets.length) {
      ui.notifications?.warn('Kein Heilungsziel ausgewählt.');
      endUtilityTargeting(false);
      return;
    }
    try {
      const { healPowerItemFromRadialOption, resolveHealOnTokens } = await import(
        './combat/heal-resolution.js'
      );
      const powerItem = healPowerItemFromRadialOption(state.option) ?? state.option.item;
      if (!powerItem) {
        ui.notifications?.error('Heal-Power konnte nicht aufgelöst werden.');
        endUtilityTargeting(false);
        return;
      }
      await resolveHealOnTokens({
        casterToken: state.casterToken,
        powerItem,
        powerName: String(state.option.name || state.option.item?.name || 'Heal'),
        targetTokens: targets,
      });
    } catch (err) {
      console.error('Mastery System | Heal resolve failed', err);
      ui.notifications?.error('Heilung konnte nicht angewendet werden.');
      endUtilityTargeting(false);
      return;
    }
    endUtilityTargeting(true);
    return;
  }

  if (isCleansePlacement) {
    if (!targets.length) {
      ui.notifications?.warn('Kein Cleanse-Ziel ausgewählt.');
      endUtilityTargeting(false);
      return;
    }
    try {
      const { cleansePowerItemFromRadialOption, resolveCleanseOnTokens } = await import(
        './combat/cleanse-resolution.js'
      );
      const powerItem = cleansePowerItemFromRadialOption(state.option) ?? state.option.item;
      const usageId = String(state.option.id || state.option.item?.id || '');
      const spentAction = !!(state.option.costsAction && combat && actor);
      await resolveCleanseOnTokens({
        casterToken: state.casterToken,
        powerItem,
        powerName: String(state.option.name || state.option.item?.name || 'Cleanse'),
        targetTokens: targets,
        powerUsageId: usageId,
        spentAction,
      });
    } catch (err) {
      console.error('Mastery System | Cleanse resolve failed', err);
      ui.notifications?.error('Cleanse konnte nicht angewendet werden.');
      endUtilityTargeting(false);
      return;
    }
    endUtilityTargeting(true);
    return;
  }

  const isConeAttack =
    state.option.slot === 'attack' && state.option.aoeShape === 'cone';

  if (isAttackZone || isConeAttack) {
    if (!targets.length) {
      ui.notifications?.warn(
        isConeAttack
          ? 'No affected creatures in the Cone.'
          : 'Keine Ziele in der Zone ausgewählt.',
      );
      endUtilityTargeting(false);
      return;
    }
    // Instant AoE: NO Primary Target. Flat affected set → one shared Attack/
    // Casting roll vs each Evade / Final Spell TN; equal payload. Card carrier
    // is UI-only; resolveAoeFromSharedRoll treats every token equally.
    const affectedIds = targets.map((t: any) => String(t.id));
    let powerBonus = 0;
    if (state.option.source === 'npc-attack' && actor) {
      const row = getNpcAttackByIndex(
        actor.system,
        (state.option as any).npcAttackIndex ?? 0,
        (state.option as any).npcPhaseIndex,
      );
      const formula = npcDamageDiceFormula(row);
      const m = /^(\d+)d8$/i.exec(String(formula));
      powerBonus = m ? Math.max(0, parseInt(m[1], 10)) : 0;
    } else if (state.option.item) {
      powerBonus = extractMeleeAoePowerBonusD8(state.option.item);
    }
    try {
      const {
        aoeContextFromAffectedTokenIds,
        createMeleeAttackCard,
        createRangedAttackCard,
      } = await import('./combat/attack-executor.js');
      const built = aoeContextFromAffectedTokenIds(affectedIds, powerBonus);
      if (!built) {
        endUtilityTargeting(false);
        return;
      }
      const rollCarrier = targets.find((t: any) => String(t.id) === built.carrierTokenId) || targets[0];
      if (state.center) {
        (state.option as any).spellZoneCenterX = state.center.x;
        (state.option as any).spellZoneCenterY = state.center.y;
      }
      // Cone Breath / Melee Cone: melee attack card. Hostile-zone placement: ranged.
      if (isConeAttack) {
        await createMeleeAttackCard(state.casterToken, rollCarrier, state.option, null, built.aoe);
      } else {
        await createRangedAttackCard(state.casterToken, rollCarrier, state.option, built.aoe);
      }
    } catch (err) {
      console.error('Mastery System | AoE attack resolve failed', err);
      ui.notifications?.error('AoE-Angriff konnte nicht erstellt werden.');
      endUtilityTargeting(false);
      return;
    }
    endUtilityTargeting(true);
    return;
  }

  // Utility / persistent zone placement (no attack card)
  const dur = state.option.zoneDurationNote;
  const durPart = dur ? ` — Dauer ${dur} (Zone am Tisch weiterverfolgen)` : '';
  const kind = isHostileZone ? 'Zone' : 'Utility';
  ui.notifications?.info(`${kind} ${state.option.name}: ${targets.length} Ziel(e)${durPart}`);

  endUtilityTargeting(true);
}

/**
 * End utility targeting mode
 */
/**
 * Cone attack from the figure. The mouse only turns the 60° slice; the
 * apex stays on the caster. Each ring is one cell wider.
 */
export function startConeAttackMode(token: any, option: RadialCombatOption): void {
  endUtilityTargeting(false);

  token.control?.({ releaseOthers: false });

  const lengthSteps = Math.max(1, masteryPowerMaxSteps(option.aoeRadiusMeters || 0));
  const targetGroup = option.defaultTargetGroup || 'enemy';
  const previewGraphics = new PIXI.Graphics();
  const effectsContainer = resolveOverlayContainer();
  if (effectsContainer) effectsContainer.addChild(previewGraphics);

  const highlightId = `mastery-cone-${option.id}`;
  const placement = placementColorsFromOption(option);

  const state: UtilityTargetingState = {
    casterToken: token,
    option,
    rangeMeters: 0,
    radiusMeters: lengthSteps,
    center: null,
    candidates: new Map(),
    selectedTargets: new Set(),
    highlightId,
    placement,
    previewGraphics,
    rangeLineGraphics: null,
    panelApp: null,
    onPointerMove: () => {},
    onPointerDown: () => {},
    onKeyDown: () => {},
    manualMode: option.allowManualTargetSelection !== false,
    excludeAllies: true,
  };

  const paint = (world: { x: number; y: number }): GridOffset[] => {
    const cells = coneCellsToward(token, world, lengthSteps);
    const grid: any = canvas.grid;
    const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;
    if (gridless) {
      clearHexHighlight(highlightId);
      drawGridlessCone(previewGraphics, token.center, world, lengthSteps, placement);
      return cells;
    }
    previewGraphics.clear();
    highlightGridOffsets(cells, highlightId, placement.hex, placement.hexAlpha);
    return cells;
  };

  state.onPointerMove = (ev: PIXI.FederatedPointerEvent) => {
    if (state.center) return;
    try {
      paint(eventWorldPoint(ev));
    } catch (err) {
      console.error('Mastery System | cone aim failed', err);
    }
  };

  state.onPointerDown = (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button === 2 || ev.button === 1) {
      endUtilityTargeting(false);
      return;
    }
    if (ev.button !== 0) return;
    try {
      if (!state.center) {
        const world = eventWorldPoint(ev);
        const cells = paint(world);
        state.candidates = candidatesInCone(token, cells, world, lengthSteps, targetGroup);
        if (state.candidates.size === 0) {
          ui.notifications?.info('Niemand im Kegel.');
          return;
        }
        for (const [tokenId, candidate] of state.candidates.entries()) {
          if (state.excludeAllies && candidate.isAlly) {
            candidate.selected = false;
            continue;
          }
          if (candidate.selected) state.selectedTargets.add(tokenId);
        }
        state.center = { x: token.center.x, y: token.center.y };
        updateCandidateVisuals(state);
        const panel = createTargetSelectionPanel(state);
        state.panelApp = panel;
        panel.render(true);
        return;
      }
      if (!state.manualMode) return;
      const worldPos = eventWorldPoint(ev);
      const clickedToken = pickTokenAtPoint(worldPos.x, worldPos.y, {
        onlyIds: state.candidates.keys(),
        noCenterFallback: true,
      });
      if (!clickedToken || !state.candidates.has(clickedToken.id)) return;
      const candidate = state.candidates.get(clickedToken.id)!;
      if (state.excludeAllies && candidate.isAlly && !candidate.selected) {
        ui.notifications?.info('Verbündete/Spieler sind ausgenommen (Häkchen im Panel entfernen, um sie zu treffen).');
        return;
      }
      candidate.selected = !candidate.selected;
      if (candidate.selected) state.selectedTargets.add(clickedToken.id);
      else state.selectedTargets.delete(clickedToken.id);
      updateCandidateVisuals(state);
      if (state.panelApp) {
        const html = $(state.panelApp.element);
        html.find('#selected-count').text(state.selectedTargets.size);
      }
    } catch (err) {
      console.error('Mastery System | cone click failed', err);
    }
  };

  state.onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') endUtilityTargeting(false);
  };

  activeUtilityTargeting = state;
  const allTokens = canvas.tokens?.placeables || [];
  for (const t of allTokens) {
    (t as any)._originalAlpha = t.alpha;
  }
  canvas.stage.on('pointermove', state.onPointerMove);
  canvas.stage.on('pointerdown', state.onPointerDown);
  window.addEventListener('keydown', state.onKeyDown);
  ui.notifications?.info(`Kegel ${lengthSteps} m — Spitze an der Figur, Maus dreht ihn, Klick setzt ihn.`);
}

function readGridOffset(raw: any): GridOffset | null {
  if (!raw) return null;
  if (raw.offset && raw.offset !== raw) return readGridOffset(raw.offset);
  if (raw.i !== undefined && raw.j !== undefined) return { i: Number(raw.i), j: Number(raw.j) };
  if (raw.col !== undefined && raw.row !== undefined) return { i: Number(raw.col), j: Number(raw.row) };
  if (raw.x !== undefined && raw.y !== undefined) return { i: Number(raw.x), j: Number(raw.y) };
  return null;
}

function gridNeighborOffsets(cell: GridOffset): GridOffset[] {
  const grid: any = canvas.grid;
  const fn = grid?.getAdjacentOffsets ?? grid?.getNeighbors;
  if (typeof fn !== 'function') return [];
  return (fn.call(grid, cell) ?? [])
    .map(readGridOffset)
    .filter((n: GridOffset | null): n is GridOffset => !!n);
}

function offsetCenter(cell: GridOffset): { x: number; y: number } | null {
  const grid: any = canvas.grid;
  const center = grid?.getCenterPoint?.(cell);
  if (center && Number.isFinite(center.x) && Number.isFinite(center.y)) return center;
  const tl = grid?.getTopLeftPoint?.(cell);
  const size = Number(grid?.size) || 100;
  if (!tl || tl.x === undefined) return null;
  return { x: tl.x + size / 2, y: tl.y + size / 2 };
}

function coneCellsToward(token: any, world: { x: number; y: number }, lengthSteps: number): GridOffset[] {
  const grid: any = canvas.grid;
  if (!grid || grid.type === CONST.GRID_TYPES.GRIDLESS) return [];
  const origin = readGridOffset(grid.getOffset?.(token.center));
  if (!origin) return [];
  const neighbors = gridNeighborOffsets(origin);
  const centers = neighbors
    .map((cell, index) => {
      const center = offsetCenter(cell);
      if (!center) return null;
      return { index, x: center.x - token.center.x, y: center.y - token.center.y };
    })
    .filter((row): row is { index: number; x: number; y: number } => !!row);
  if (!centers.length) return [];
  const pair = bestConeEdgePair(world.x - token.center.x, world.y - token.center.y, centers);
  return wideningConeCells(origin, pair.first, lengthSteps, gridNeighborOffsets, pair.second);
}

function candidatesInCone(
  casterToken: any,
  cells: GridOffset[],
  world: { x: number; y: number },
  lengthSteps: number,
  targetGroup: TargetGroup,
): Map<string, UtilityTargetState> {
  const candidates = new Map<string, UtilityTargetState>();
  const keys = new Set(cells.map((cell) => `${cell.i},${cell.j}`));
  const grid: any = canvas.grid;
  const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;
  const allTokens = canvas.tokens?.placeables || [];
  for (const token of allTokens) {
    if (token.id === casterToken.id) continue;
    if (tokenIsExcludedAsTarget(token)) continue;
    let inside = false;
    if (gridless) {
      inside = pointInGridlessCone(casterToken.center, world, token.center, lengthSteps);
    } else {
      const off = readGridOffset(grid.getOffset?.(token.center));
      inside = !!off && keys.has(`${off.i},${off.j}`);
    }
    if (!inside) continue;
    const matches = matchesTargetGroup(casterToken, token, targetGroup);
    candidates.set(token.id, {
      token,
      inRadius: true,
      selected: matches,
      isAlly: isAlly(casterToken, token),
      isEnemy: isEnemy(casterToken, token),
      originalAlpha: token.alpha,
    });
  }
  return candidates;
}

function drawGridlessCone(
  graphics: PIXI.Graphics,
  origin: { x: number; y: number },
  aim: { x: number; y: number },
  lengthSteps: number,
  colors: PlacementColors,
): void {
  const size = Number((canvas as any).grid?.size) || 100;
  const dx = aim.x - origin.x;
  const dy = aim.y - origin.y;
  const mag = Math.hypot(dx, dy) || 1;
  const ux = dx / mag;
  const uy = dy / mag;
  const px = -uy;
  const py = ux;
  const len = Math.max(1, lengthSteps) * size;
  const half = len / 2;
  const tipX = origin.x + ux * size * 0.55;
  const tipY = origin.y + uy * size * 0.55;
  const farX = origin.x + ux * (len + size * 0.45);
  const farY = origin.y + uy * (len + size * 0.45);
  graphics.clear();
  graphics.lineStyle(2, colors.previewLine, 0.85);
  graphics.beginFill(colors.previewFill, 0.14);
  graphics.moveTo(tipX, tipY);
  graphics.lineTo(farX + px * half, farY + py * half);
  graphics.lineTo(farX - px * half, farY - py * half);
  graphics.closePath();
  graphics.endFill();
}

function pointInGridlessCone(
  origin: { x: number; y: number },
  aim: { x: number; y: number },
  point: { x: number; y: number },
  lengthSteps: number,
): boolean {
  const size = Number((canvas as any).grid?.size) || 100;
  const dx = aim.x - origin.x;
  const dy = aim.y - origin.y;
  const mag = Math.hypot(dx, dy) || 1;
  const ux = dx / mag;
  const uy = dy / mag;
  const vx = point.x - origin.x;
  const vy = point.y - origin.y;
  const along = vx * ux + vy * uy;
  const lateral = Math.abs(vx * -uy + vy * ux);
  const len = Math.max(1, lengthSteps) * size;
  if (along < size * 0.4 || along > len + size * 0.45) return false;
  const half = (along / len) * (len / 2);
  return lateral <= half + size * 0.2;
}

export function endUtilityTargeting(success: boolean): void {
  const state = activeUtilityTargeting;
  if (!state) return;
  // Remove event listeners
  canvas.stage.off('pointermove', state.onPointerMove);
  canvas.stage.off('pointerdown', state.onPointerDown);
  window.removeEventListener('keydown', state.onKeyDown);

  clearSupportVisuals(state);
  
  clearHexHighlight(state.highlightId);
  if (state.aoePreviewLayerId) {
    clearHexHighlight(state.aoePreviewLayerId);
  }

  // Clear preview graphics
  if (state.previewGraphics && state.previewGraphics.parent) {
    state.previewGraphics.parent.removeChild(state.previewGraphics);
    state.previewGraphics.clear();
  }
  
  if (state.rangeLineGraphics && state.rangeLineGraphics.parent) {
    state.rangeLineGraphics.parent.removeChild(state.rangeLineGraphics);
    state.rangeLineGraphics.clear();
  }
  
  // Close panel
  if (state.panelApp) {
    state.panelApp.close();
  }
  
  // Restore token visuals
  for (const [, candidate] of state.candidates.entries()) {
    const token = candidate.token;
    token.alpha = candidate.originalAlpha;
    
    if (token.filters) {
      token.filters = token.filters.filter((f: any) => {
        return !(f instanceof PIXI.filters.ColorMatrixFilter);
      });
      if (token.filters.length === 0) {
        token.filters = null;
      }
    }
  }
  
  // Restore all tokens (in case some were highlighted but not in candidates)
  const allTokens = canvas.tokens?.placeables || [];
  for (const token of allTokens) {
    const originalAlpha = (token as any)._originalAlpha;
    if (originalAlpha !== undefined) {
      token.alpha = originalAlpha;
      delete (token as any)._originalAlpha;
    }
  }
  
  if (!success) {
    const msg =
      state.option.aoeShape === 'cone'
        ? 'Kegel abgebrochen'
        : state.option.aoePlacementProfile === 'hostile-zone'
          ? 'Zonenwahl abgebrochen'
          : isSupportPlacement(state.option)
            ? `${state.option.aoePlacementProfile === 'cleanse' ? 'Cleanse' : 'Heal'} abgebrochen`
            : 'Utility targeting cancelled';
    ui.notifications?.info(msg);
  }

  activeUtilityTargeting = null;
}

/**
 * Check if utility targeting is currently active
 */
export function isUtilityTargetingActive(): boolean {
  return activeUtilityTargeting !== null;
}

