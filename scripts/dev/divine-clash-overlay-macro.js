/**
 * DIVINE CLASH OVERLAY MACRO
 * 
 * Fix: overlay attached to canvas.tokens to allow pointer events outside token bounds
 * 
 * USAGE:
 * 1. Select one or more host tokens (non-stone tokens) on the canvas
 * 2. Run this macro
 * 3. The macro will:
 *    - Scan for stone tokens in front of each host token
 *    - Create overlay zones (POOL, ATTACK, DEFENSE)
 *    - Allow drag & drop of stone sprites between zones
 * 
 * The overlay persists state in host token flags and re-renders automatically.
 */

// ============================================================================
// CONFIG CONSTANTS
// ============================================================================

const SCAN_X = 260; // Horizontal range: host.center.x ± SCAN_X
const SCAN_Y_MIN = 10; // Start scanning this many pixels below host token
const SCAN_Y_MAX = 220; // Stop scanning at this distance below host token
const HIDE_REAL_STONES_AFTER_INIT = false; // Set to true to hide real stone tokens after initialization

// Zone dimensions (in canvas pixels)
const VITALITY_WIDTH = 180; // Width for Vitality zone (left of Pool)
const POOL_WIDTH = 400;
const ZONE_HEIGHT = 120;
const ZONE_SPACING = 20;
const ATTACK_DEFENSE_WIDTH = 180;

// Overlay positioning (relative to host token)
const OVERLAY_OFFSET_X = -POOL_WIDTH / 2; // Center horizontally
const OVERLAY_OFFSET_Y = 300; // Vertical offset: negative = closer to token (further forward), positive = further away (further back)

// Visual styling
const ZONE_STROKE_WIDTH = 3;
const ZONE_STROKE_COLOR = 0xFFFFFF;
const ZONE_FILL_ALPHA = 0.1;
const VITALITY_COLOR = 0xFFAA00; // Orange/Yellow for Vitality
const POOL_COLOR = 0x00FF00; // Green
const ATTACK_COLOR = 0xFF0000; // Red
const DEFENSE_COLOR = 0x0000FF; // Blue
const HOVER_ALPHA = 0.3;
const STONE_SPRITE_SIZE = 60;
const BUTTON_SIZE = 30;
const BUTTON_MARGIN = 5;
const READY_BUTTON_WIDTH = 120;
const READY_BUTTON_HEIGHT = 40;

// PC Overlay Row positioning
const PC_ROW_SPACING = 200;
const PC_ROW_FROM_BOTTOM = 200;
const PC_ROW_NUDGE_X = 0; // Fine-tune horizontal position in px
const PC_ROW_NUDGE_Y = 0; // Fine-tune vertical position in px

// Team Vitality Display styling (HUD - centered on screen)
const TEAM_VITALITY_HEIGHT = 40;
const TEAM_VITALITY_WIDTH = 300;
const TEAM_VITALITY_NUDGE_X = 0; // Fine-tune horizontal position in px
const TEAM_VITALITY_NUDGE_Y = 0; // Fine-tune vertical position in px
const TEAM_VITALITY_BOTTOM_OFFSET = 140; // px vom unteren Bildschirmrand (ggf. 110–180 anpassen)

// DEBUG Helper for Team Vitality
const DEBUG_TEAM_VITALITY = true;
function tvLog(...args) { if (DEBUG_TEAM_VITALITY) console.log("Divine Clash | [TEAM VIT]", ...args); }
function tvWarn(...args) { if (DEBUG_TEAM_VITALITY) console.warn("Divine Clash | [TEAM VIT]", ...args); }

// Resolve Phase Configuration
const ENABLE_GM_DEBUG_LOG = true; // GM-only debug whisper
const ENABLE_RESOLVE_ANIMATIONS = true; // Visual animations on resolve

// Animation settings
const ANIMATION_PULSE_DURATION = 500; // ms
const ANIMATION_FLOAT_DURATION = 1500; // ms
const ANIMATION_PULSE_SCALE = 1.3; // Scale multiplier for pulse
const ANIMATION_FLOAT_DISTANCE = 60; // Pixels to float upward

// Track played animations to prevent duplicates
const playedAnimations = new Set();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a token is a stone token
 */
function isStoneToken(token) {
  if (!token?.actor) return false;
  const actor = token.actor;
  if (actor.type !== 'npc') return false;
  const name = (actor.name || '').toUpperCase();
  return name.includes('POWER STONE') || name.includes('POWER STONES') || 
         name === 'VITALITY STONE' || name === 'VITALITY STONES' ||
         name.includes('VITALITY STONE');
}

/**
 * Get host tokens from controlled tokens (exclude stone tokens)
 */
function getHostTokens() {
  const controlled = canvas.tokens?.controlled || [];
  return controlled.filter(token => !isStoneToken(token));
}

/**
 * Check if an actor is an NPC
 */
function isNpc(actor) {
  if (!actor) return false;
  return actor.type === 'npc';
}

/**
 * Get Divine Combat data from NPC actor
 */
function getDivineCombatData(actor) {
  if (!actor || !isNpc(actor)) return null;
  
  const system = actor.system || {};
  const divineCombat = system.divineCombat || {};
  
  // Check if divineCombat exists and has startingPool
  if (divineCombat.startingPool === undefined) {
    return null;
  }
  
  return {
    startingPool: divineCombat.startingPool || 0,
    regeneration: divineCombat.regeneration || 0,
    basisAttack: divineCombat.basisAttack || 0,
    basisDefense: divineCombat.basisDefense || 0,
    vitality: divineCombat.vitality || 0
  };
}

/**
 * Get power stone count from actor system (for characters)
 */
function getPowerStoneCount(actor) {
  if (!actor) return 0;
  
  const system = actor.system || {};
  const stones = system.stones || {};
  
  // Try maximum first (as requested)
  if (stones.maximum !== undefined) {
    const vitality = stones.vitality || 0;
    return Math.max(0, stones.maximum - vitality);
  }
  
  // Fallback to total/current calculation
  const totalStones = stones.current !== undefined ? stones.current : stones.total || 0;
  const vitality = stones.vitality || 0;
  return Math.max(0, totalStones - vitality);
}

/**
 * Get vitality stone count from actor system
 * For characters: minimum 1, then add +1 to vitality count (if vitality=0, returns 1; if vitality=1, returns 2; if vitality=2, returns 3)
 * For NPCs: minimum 1
 */
function getVitalityStoneCount(actor) {
  if (!actor) return 1; // Default to 1
  
  const system = actor.system || {};
  
  // For characters: get from stones.vitality
  if (actor.type === 'character') {
    const stones = system.stones || {};
    const vitality = stones.vitality || 0;
    // Minimum 1, then add +1 (so if vitality=0, return 1; if vitality=1, return 2; etc.)
    return Math.max(1, vitality + 1);
  }
  
  // For NPCs: get from divineCombat.vitality, minimum 1
  if (actor.type === 'npc') {
    const divineCombat = system.divineCombat || {};
    const vitality = divineCombat.vitality || 0;
    return Math.max(1, vitality);
  }
  
  return 1; // Default to 1
}

/**
 * Get mastery rank from actor
 */
function getMasteryRank(actor) {
  if (!actor || !actor.system) return 2; // Default
  
  const system = actor.system || {};
  if (system.mastery?.rank) {
    return system.mastery.rank;
  }
  
  // Fallback to settings
  const playerMasteryRanks = game.settings?.get('mastery-system', 'playerMasteryRanks') || {};
  const defaultMasteryRank = game.settings?.get('mastery-system', 'defaultMasteryRank') || 2;
  const playerId = actor.getFlag?.('mastery-system', 'playerId') || actor.ownership?.default || '';
  return playerMasteryRanks[playerId] || defaultMasteryRank;
}

/**
 * Get stone texture source (from settings or fallback)
 */
function getStoneTextureSrc() {
  // Try to get from settings
  const powerStoneImg = game.settings.get('mastery-system', 'divineClashPowerStoneImg');
  if (powerStoneImg && powerStoneImg.trim() !== '') {
    return powerStoneImg;
  }
  
  // Fallback: try to find a Power Stone actor
  const allActors = game.actors || [];
  const powerStoneActor = allActors.find(a => {
    if (a.type !== 'npc') return false;
    const name = (a.name || '').toUpperCase();
    return name.includes('POWER STONE');
  });
  
  if (powerStoneActor) {
    return powerStoneActor.prototypeToken?.texture?.src || powerStoneActor.img || '';
  }
  
  // Last resort: return empty (will show placeholder)
  return '';
}

/**
 * Scan for stone tokens in front of host token (deprecated - now generates sprites from actor data)
 */
function scanStonesInFront(hostToken) {
  // This function is kept for backwards compatibility but is no longer used
  // Instead, we generate stone sprites based on actor.system.stones.maximum
  return [];
}

// ============================================================================
// GROUP DROPDOWN HELPER FUNCTIONS
// ============================================================================

/**
 * Convert canvas world coordinates to screen/client coordinates
 */
function worldToScreen(worldX, worldY) {
  if (!canvas || !canvas.stage) {
    return { x: worldX, y: worldY };
  }
  
  // Method 1: Use canvas stage toGlobal (PIXI v7)
  if (typeof canvas.stage.toGlobal === 'function') {
    const worldPoint = new PIXI.Point(worldX, worldY);
    const globalPoint = canvas.stage.toGlobal(worldPoint);
    return { x: globalPoint.x, y: globalPoint.y };
  }
  
  // Method 2: Manual calculation using stage transform
  const stage = canvas.stage;
  const transform = stage.worldTransform;
  return {
    x: transform.a * worldX + transform.c * worldY + transform.tx,
    y: transform.b * worldX + transform.d * worldY + transform.ty
  };
}

/**
 * Position team vitality display at UI bottom center (fixed, not in scene)
 */
function positionTeamVitalityDisplay() {
  const display = document.getElementById("dc-team-vitality");
  if (!display) return;

  // UI-fixed, mittig unten (außerhalb der Scene/World)
  display.style.left = `calc(50% + ${TEAM_VITALITY_NUDGE_X}px)`;
  display.style.bottom = `${TEAM_VITALITY_BOTTOM_OFFSET + TEAM_VITALITY_NUDGE_Y}px`;
  display.style.top = ""; // sicherstellen, dass top nicht mehr greift
  display.style.transform = "translateX(-50%)";

  const r = display.getBoundingClientRect();
  tvLog("positionTeamVitalityDisplay(UI-bottom):", {
    bottomOffset: TEAM_VITALITY_BOTTOM_OFFSET,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
  });
}

/**
 * Create team vitality display (shows sum of all PC vitality)
 * HUD-style: centered on screen, not attached to any overlay
 * @returns {Object} - { element, updatePosition(), destroy() }
 */
function createTeamVitalityDisplay() {
  let display = document.getElementById("dc-team-vitality");
  if (display) {
    return {
      element: display,
      updatePosition: positionTeamVitalityDisplay,
      destroy: () => display?.remove?.()
    };
  }

  display = document.createElement("div");
  display.id = "dc-team-vitality";

  // Wichtig: an #interface oder body hängen (nicht #board, nicht ui-top)
  const parent = document.getElementById("interface") || document.body;

  tvLog("createTeamVitalityDisplay(): parent=", parent?.id || parent?.tagName);
  parent.appendChild(display);

  // Sichtbares HUD (immer über UI)
  display.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: ${TEAM_VITALITY_BOTTOM_OFFSET}px;
    transform: translateX(-50%);
    z-index: 100000;
    width: ${TEAM_VITALITY_WIDTH}px;
    height: ${TEAM_VITALITY_HEIGHT}px;
    background-color: #1a1a1a;
    color: #ffffff;
    border: 2px solid #FFAA00;
    border-radius: 6px;
    padding: 8px 16px;
    font-family: 'Signika', sans-serif;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  display.textContent = "TEAM VITALITY: 0 / 0";

  // Initial position + logs
  positionTeamVitalityDisplay();
  const r = display.getBoundingClientRect();
  tvLog("createTeamVitalityDisplay(): after-style rect=", { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });

  return {
    element: display,
    updatePosition: positionTeamVitalityDisplay,
    destroy: () => display?.remove?.()
  };
}

/**
 * Update team vitality display with sum of all PC vitality
 * Only updates text content (position is fixed as HUD)
 */
function updateTeamVitalityDisplay() {
  if (!canvas || !canvas.tokens) {
    return;
  }
  
  const display = document.getElementById('dc-team-vitality');
  if (!display) {
    return;
  }
  
  // Get all PC tokens that are in divine clash (have any relevant flags)
  const allTokens = canvas.tokens?.placeables || [];
  const pcCandidates = allTokens.filter(t => t?.actor?.type === "character");
  
  const pcTokensInClash = pcCandidates.filter(token => {
    const vitFlag = token.document.getFlag("mastery-system", "divineClashVitality");
    const overlayFlag = token.document.getFlag("mastery-system", "divineClashOverlay");
    const participation = token.document.getFlag("mastery-system", "divineClashParticipation");
    return !!vitFlag || !!overlayFlag || !!participation;
  });
  
  tvLog("updateTeamVitalityDisplay(): totalTokens=", allTokens.length, "pcCandidates=", pcCandidates.length, "pcInClash=", pcTokensInClash.length);
  console.table(pcCandidates.map(t => ({
    name: t.name,
    isOwner: !!t.isOwner,
    hasLocalOverlay: !!t._dcOverlay,
    hasVitFlag: !!t.document.getFlag("mastery-system", "divineClashVitality"),
    hasOverlayFlag: !!t.document.getFlag("mastery-system", "divineClashOverlay"),
    hasParticipation: !!t.document.getFlag("mastery-system", "divineClashParticipation")
  })));
  
  if (pcTokensInClash.length === 0) {
    display.style.display = "none";
    tvWarn("Hiding TEAM VITALITY (no PCs in clash)");
    return;
  }
  
  display.style.display = "block";
  
  // Sum vitality from all PCs
  let sumCurrent = 0;
  let sumMax = 0;
  
  for (const token of pcTokensInClash) {
    let vit = token.document.getFlag('mastery-system', 'divineClashVitality');
    
    // If flag doesn't exist, initialize with getVitalityStoneCount
    if (!vit) {
      const actor = token.actor;
      if (actor) {
        const vitalityCount = getVitalityStoneCount(actor);
        vit = { current: vitalityCount, max: vitalityCount };
        // Optionally set the flag, but don't await to avoid blocking
        token.document.setFlag('mastery-system', 'divineClashVitality', vit).catch(err => {
          console.warn(`Divine Clash | Could not set vitality flag for ${token.name}:`, err);
        });
      } else {
        vit = { current: 0, max: 0 };
      }
    }
    
    sumCurrent += (vit.current !== undefined ? vit.current : 0);
    sumMax += (vit.max !== undefined ? vit.max : 0);
  }
  
  // Update display text and reposition
  display.textContent = `TEAM VITALITY: ${sumCurrent} / ${sumMax}`;
  positionTeamVitalityDisplay();
  const rr = display.getBoundingClientRect();
  tvLog("updateTeamVitalityDisplay(): text=", display.textContent, "rect=", { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) });
}

// ============================================================================
// DIVINE CLASH OVERLAY CLASS
// ============================================================================

class DivineClashOverlay extends PIXI.Container {
  constructor(hostToken) {
    super();
    this.hostToken = hostToken;
    this.actor = hostToken.actor;
    this.isNpc = this.actor && isNpc(this.actor);
    this.zones = {}; // { vitality: Graphics, pool: Graphics, attack: Graphics, defense: Graphics }
    this.zoneLabels = {}; // { vitality: Text, pool: Text, attack: Text, defense: Text }
    this.stoneSprites = new Map(); // stoneTokenId -> Sprite
    this.draggingSprite = null;
    this.dragOffset = { x: 0, y: 0 };
    this.hoveredZone = null;
    this.readyButton = null; // Ready button above pool
    this.poolButtons = null; // GM-only pool management buttons
    this.endRoundButton = null; // GM-only end round button
    this.unlockReadyButton = null; // GM-only unlock ready button
    this.resolveButton = null; // GM-only resolve button (appears when all PCs are ready)
    this.resetButton = null; // GM-only reset button (for NPCs, positioned left of overlay)
    this.nameLabel = null; // Name label (NPC: left of overlay, Character: above overlay)
    
    this.eventMode = 'passive';
    this.interactiveChildren = true;
    this.visible = true;
    this.alpha = 1.0;
    
    // Store reference
    hostToken._dcOverlay = this;
    
    // Draw zones first
    this.drawZones();
    
    // Update position
    this.updateWorldPosition();
    
    // Update visibility based on user permissions
    this.updateVisibility();
    
    // Attach to canvas.tokens layer (not token.mesh) to allow pointer events outside token bounds
    // Do this AFTER setting position so it's positioned correctly
    if (canvas.tokens) {
      canvas.tokens.addChild(this);
      this.visible = true;
      this.alpha = 1.0;
      this.zIndex = 1000; // Ensure it's on top
      console.log(`Divine Clash | Overlay added to canvas.tokens for ${hostToken.name} at position (${this.x}, ${this.y}), visible=${this.visible}, alpha=${this.alpha}`);
    } else {
      console.error('Divine Clash | canvas.tokens is not available!');
    }
    
    // renderFromFlags will be called after flags are initialized
  }
  
  /**
   * Update overlay position in canvas world coordinates
   * NPCs: Center top of scene
   * Characters: Bottom center, evenly distributed
   */
  updateWorldPosition() {
    if (!this.hostToken || !canvas) {
      console.warn('Divine Clash | updateWorldPosition: hostToken or canvas is null');
      return;
    }
    
    // Use canvas.dimensions.sceneRect for correct scene bounds (includes padding/offset)
    const sr = canvas.dimensions.sceneRect;
    if (!sr) {
      console.warn('Divine Clash | updateWorldPosition: canvas.dimensions.sceneRect not available');
      return;
    }
    
    // Calculate top-middle and bottom-middle of the map
    const topMiddle = {
      x: sr.x + (sr.width / 2),
      y: sr.y
    };
    
    const bottomMiddle = {
      x: sr.x + (sr.width / 2),
      y: sr.y + sr.height
    };
    
    console.log(`Divine Clash | [DEBUG] Scene rect: x=${sr.x}, y=${sr.y}, width=${sr.width}, height=${sr.height}`);
    console.log(`Divine Clash | [DEBUG] Top-middle: (${topMiddle.x}, ${topMiddle.y})`);
    console.log(`Divine Clash | [DEBUG] Bottom-middle: (${bottomMiddle.x}, ${bottomMiddle.y})`);
    
    if (this.isNpc) {
      // NPCs: Top-middle of the map
      // Calculate total width including vitality zone (always present)
      const totalNpcWidth = VITALITY_WIDTH + ZONE_SPACING + POOL_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH;
      this.x = topMiddle.x - (totalNpcWidth / 2);
      this.y = topMiddle.y + 50; // 50 pixels from top edge
      
      // Create/update NPC name label (left of overlay)
      if (!this.nameLabel) {
        this.nameLabel = new PIXI.Text(this.hostToken.name || 'NPC', {
          fontFamily: 'Signika',
          fontSize: 24,
          fill: 0xFFFFFF,
          fontWeight: 'bold',
          stroke: 0x000000,
          strokeThickness: 4
        });
        this.nameLabel.anchor.set(1, 0); // Right-aligned, top-aligned
        this.addChild(this.nameLabel);
      }
      
      // Position name label to the left of the overlay
      this.nameLabel.x = -20; // 20 pixels to the left
      this.nameLabel.y = 10; // Slightly below top
      
      console.log(`Divine Clash | NPC overlay positioned at top-middle: x=${this.x}, y=${this.y}`);
    } else {
      // Characters: Bottom-middle of the map, evenly distributed
      // Collect only overlays that the current user can see
      const visibleCharacterOverlays = [];
      canvas.tokens?.placeables.forEach(token => {
        if (token._dcOverlay && !token._dcOverlay.isNpc) {
          // GM sees all PC overlays, players see only their own
          if (game.user.isGM) {
            visibleCharacterOverlays.push(token._dcOverlay);
          } else {
            // Player: only include if they own this token
            const actor = token.actor;
            if (actor && actor.testUserPermission(game.user, 'OWNER')) {
              visibleCharacterOverlays.push(token._dcOverlay);
            }
          }
        }
      });
      
      const totalCharacters = visibleCharacterOverlays.length;
      if (totalCharacters === 0) {
        console.warn(`Divine Clash | No visible character overlays found for positioning`);
        return;
      }
      
      // Calculate overlay content width (without vitality zone)
      const overlayContentWidth = POOL_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH;
      
      // Calculate row width
      const rowWidth = totalCharacters * overlayContentWidth + Math.max(0, totalCharacters - 1) * PC_ROW_SPACING;
      const startX = bottomMiddle.x - (rowWidth / 2);
      
      // Find index of this overlay in the visible list
      const myIndex = visibleCharacterOverlays.findIndex(ov => ov === this);
      if (myIndex === -1) {
        // This overlay is not in the visible list for this user
        return;
      }
      
      // Position overlay (no vitality offset, no complex calculations)
      this.x = startX + myIndex * (overlayContentWidth + PC_ROW_SPACING) + PC_ROW_NUDGE_X;
      this.y = (bottomMiddle.y - PC_ROW_FROM_BOTTOM) + PC_ROW_NUDGE_Y;
      
      // Create/update character name label (at left edge of pool zone)
      if (!this.nameLabel) {
        this.nameLabel = new PIXI.Text(this.hostToken.name || 'Character', {
          fontFamily: 'Signika',
          fontSize: 24,
          fill: 0xFFFFFF,
          fontWeight: 'bold',
          stroke: 0x000000,
          strokeThickness: 4
        });
        this.nameLabel.anchor.set(0, 0.5); // Left-aligned, center-vertical
        this.addChild(this.nameLabel);
      }
      
      // Position name label at left edge of pool zone
      this.nameLabel.x = 10; // 10px from left edge of pool zone
      this.nameLabel.y = -READY_BUTTON_HEIGHT / 2; // Vertically centered with Ready button
      
      console.log(`Divine Clash | Character overlay positioned at bottom-middle: x=${this.x}, y=${this.y} (index ${myIndex} of ${totalCharacters} visible)`);
    }
  }
  
  /**
   * Update visibility based on user permissions
   * Players see only their own overlay, GM sees all
   */
  updateVisibility() {
    if (!this.actor) {
      this.visible = false;
      return;
    }
    
    // GM sees all overlays
    if (game.user.isGM) {
      this.visible = true;
      this.alpha = 1.0;
      return;
    }
    
    // Players see only their own character overlay
    if (!this.isNpc) {
      // Check if this actor belongs to the current user
      const isOwner = this.actor.testUserPermission(game.user, 'OWNER');
      this.visible = isOwner;
      this.alpha = isOwner ? 1.0 : 0.0;
    } else {
      // Players don't see NPC overlays (only GM does)
      this.visible = false;
      this.alpha = 0.0;
    }
    
    console.log(`Divine Clash | Visibility updated for ${this.hostToken.name}: visible=${this.visible}, isGM=${game.user.isGM}, isOwner=${this.actor?.testUserPermission(game.user, 'OWNER')}`);
  }
  
  /**
   * Draw the zones (Vitality, Pool, Attack, Defense)
   */
  drawZones() {
    // Remove only zone graphics and labels, not stone sprites
    const toRemove = [];
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child === this.zones.vitality || child === this.zones.pool || child === this.zones.attack || child === this.zones.defense ||
          child === this.zoneLabels.vitality || child === this.zoneLabels.pool || child === this.zoneLabels.attack || child === this.zoneLabels.defense) {
        toRemove.push(child);
      }
    }
    toRemove.forEach(child => this.removeChild(child));
    
    // Helper function to draw rounded rectangle (manual implementation for Foundry VTT v13 compatibility)
    const drawRoundedRect = (graphics, x, y, width, height, radius, fillColor, fillAlpha, strokeColor, strokeWidth) => {
      graphics.clear();
      
      // Draw rounded rectangle manually using arcs
      const r = Math.min(radius, width / 2, height / 2);
      
      graphics.lineStyle(strokeWidth, strokeColor, 1.0);
      graphics.beginFill(fillColor, fillAlpha);
      
      // Start from top-left corner (after radius)
      graphics.moveTo(x + r, y);
      
      // Top edge
      graphics.lineTo(x + width - r, y);
      
      // Top-right corner arc
      graphics.arc(x + width - r, y + r, r, -Math.PI / 2, 0);
      
      // Right edge
      graphics.lineTo(x + width, y + height - r);
      
      // Bottom-right corner arc
      graphics.arc(x + width - r, y + height - r, r, 0, Math.PI / 2);
      
      // Bottom edge
      graphics.lineTo(x + r, y + height);
      
      // Bottom-left corner arc
      graphics.arc(x + r, y + height - r, r, Math.PI / 2, Math.PI);
      
      // Left edge
      graphics.lineTo(x, y + r);
      
      // Top-left corner arc
      graphics.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
      
      graphics.closePath();
      graphics.endFill();
    };
    
    // Vitality zone (leftmost, ONLY for NPCs)
    const hasVitalityZone = this.isNpc;
    const poolX = hasVitalityZone ? (VITALITY_WIDTH + ZONE_SPACING) : 0;
    
    if (hasVitalityZone) {
      const vitalityZone = new PIXI.Graphics();
      drawRoundedRect(vitalityZone, 0, 0, VITALITY_WIDTH, ZONE_HEIGHT, 8, VITALITY_COLOR, ZONE_FILL_ALPHA, VITALITY_COLOR, ZONE_STROKE_WIDTH);
      vitalityZone.zIndex = 0;
      vitalityZone.eventMode = 'none';
      vitalityZone.cursor = 'default';
      this.zones.vitality = vitalityZone;
      this.addChild(vitalityZone);
      
      const vitalityLabel = new PIXI.Text('VITALITY', {
        fontFamily: 'Signika',
        fontSize: 18,
        fill: VITALITY_COLOR,
        fontWeight: 'bold'
      });
      vitalityLabel.x = 10;
      vitalityLabel.y = 10;
      this.zoneLabels.vitality = vitalityLabel;
      this.addChild(vitalityLabel);
    } else {
      // PC overlays don't have vitality zone
      this.zones.vitality = null;
      this.zoneLabels.vitality = null;
    }
    
    // Pool zone (shifted right if vitality zone is present)
    const poolZone = new PIXI.Graphics();
    drawRoundedRect(poolZone, poolX, 0, POOL_WIDTH, ZONE_HEIGHT, 8, POOL_COLOR, ZONE_FILL_ALPHA, POOL_COLOR, ZONE_STROKE_WIDTH);
    poolZone.zIndex = 0;
    poolZone.eventMode = 'none'; // None - completely ignore events, let sprites handle them
    poolZone.cursor = 'default';
    this.zones.pool = poolZone;
    this.addChild(poolZone);
    
    const poolLabel = new PIXI.Text('POOL', {
      fontFamily: 'Signika',
      fontSize: 20,
      fill: POOL_COLOR,
      fontWeight: 'bold'
    });
    poolLabel.x = poolX + 10;
    poolLabel.y = 10;
    this.zoneLabels.pool = poolLabel;
    this.addChild(poolLabel);
    
    // GM-only pool management buttons (+ and -)
    if (game.user.isGM) {
      const poolPlusBtn = this.createPoolButton('+', POOL_COLOR, poolX + POOL_WIDTH - BUTTON_SIZE * 2 - BUTTON_MARGIN * 2, 10, 'add');
      const poolMinusBtn = this.createPoolButton('-', POOL_COLOR, poolX + POOL_WIDTH - BUTTON_SIZE - BUTTON_MARGIN, 10, 'remove');
      this.addChild(poolPlusBtn);
      this.addChild(poolMinusBtn);
      this.poolButtons = { plus: poolPlusBtn, minus: poolMinusBtn };
    }
    
    // Ready button - always visible, positioned above the pool zone
    // Note: createReadyButton uses poolX internally, which is now calculated correctly above
    this.readyButton = this.createReadyButton();
    this.addChild(this.readyButton);
    
    // GM-only End Round button (only for NPCs, positioned at top)
    if (game.user.isGM && this.isNpc) {
      this.endRoundButton = this.createEndRoundButton();
      this.addChild(this.endRoundButton);
      
      // GM-only Unlock Ready button (positioned next to End Round button)
      this.unlockReadyButton = this.createUnlockReadyButton();
      this.addChild(this.unlockReadyButton);
      
      // GM-only Resolve button (positioned next to Unlock button, only visible when all PCs are ready)
      this.resolveButton = this.createResolveButton();
      this.addChild(this.resolveButton);
      
      // GM-only Reset button (positioned left of overlay)
      this.resetButton = this.createResetButton();
      this.addChild(this.resetButton);
      
      // Check ready status and update resolve button visibility
      this.updateResolveButtonVisibility();
    }
    
    // Attack zone (right of pool)
    const attackX = poolX + POOL_WIDTH + ZONE_SPACING;
    const attackZone = new PIXI.Graphics();
    drawRoundedRect(attackZone, attackX, 0, ATTACK_DEFENSE_WIDTH, ZONE_HEIGHT, 8, ATTACK_COLOR, ZONE_FILL_ALPHA, ATTACK_COLOR, ZONE_STROKE_WIDTH);
    attackZone.zIndex = 0;
    attackZone.eventMode = 'none';
    attackZone.cursor = 'default';
    this.zones.attack = attackZone;
    this.addChild(attackZone);
    
    const attackLabel = new PIXI.Text('ATTACK', {
      fontFamily: 'Signika',
      fontSize: 18,
      fill: ATTACK_COLOR,
      fontWeight: 'bold'
    });
    attackLabel.x = attackX + 10;
    attackLabel.y = 10;
    this.zoneLabels.attack = attackLabel;
    this.addChild(attackLabel);
    
    // Attack zone buttons (+ and -) - positioned next to the label
    const labelWidth = attackLabel.width || 80; // Approximate label width
    const attackPlusBtn = this.createZoneButton('+', ATTACK_COLOR, attackX + 10 + labelWidth + 5, 10, 'attack', 'add');
    const attackMinusBtn = this.createZoneButton('-', ATTACK_COLOR, attackX + 10 + labelWidth + 5 + BUTTON_SIZE + 2, 10, 'attack', 'remove');
    this.addChild(attackPlusBtn);
    this.addChild(attackMinusBtn);
    
    // Defense zone (right of attack)
    const defenseZone = new PIXI.Graphics();
    const defenseX = attackX + ATTACK_DEFENSE_WIDTH + ZONE_SPACING;
    drawRoundedRect(defenseZone, defenseX, 0, ATTACK_DEFENSE_WIDTH, ZONE_HEIGHT, 8, DEFENSE_COLOR, ZONE_FILL_ALPHA, DEFENSE_COLOR, ZONE_STROKE_WIDTH);
    defenseZone.zIndex = 0;
    defenseZone.eventMode = 'none';
    defenseZone.cursor = 'default';
    this.zones.defense = defenseZone;
    this.addChild(defenseZone);
    
    const defenseLabel = new PIXI.Text('DEFENSE', {
      fontFamily: 'Signika',
      fontSize: 18,
      fill: DEFENSE_COLOR,
      fontWeight: 'bold'
    });
    defenseLabel.x = defenseX + 10;
    defenseLabel.y = 10;
    this.zoneLabels.defense = defenseLabel;
    this.addChild(defenseLabel);
    
    // Defense zone buttons (+ and -) - positioned next to the label
    const defenseLabelWidth = defenseLabel.width || 90; // Approximate label width
    const defensePlusBtn = this.createZoneButton('+', DEFENSE_COLOR, defenseX + 10 + defenseLabelWidth + 5, 10, 'defense', 'add');
    const defenseMinusBtn = this.createZoneButton('-', DEFENSE_COLOR, defenseX + 10 + defenseLabelWidth + 5 + BUTTON_SIZE + 2, 10, 'defense', 'remove');
    this.addChild(defensePlusBtn);
    this.addChild(defenseMinusBtn);
    
    // Setup zone hover detection (zones use getZoneAt during dragging, not pointer events)
    // Zone highlighting is handled via getZoneAt() in onStoneDragMove
  }
  
  /**
   * Create a button for zone actions (+ or -)
   */
  createZoneButton(text, color, x, y, zoneId, action) {
    const button = new PIXI.Graphics();
    button.beginFill(color, 0.8);
    button.lineStyle(2, 0xFFFFFF, 1.0);
    button.drawRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, 4);
    button.endFill();
    
    button.x = x;
    button.y = y;
    button.zIndex = 30; // Above sprites
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    const label = new PIXI.Text(text, {
      fontFamily: 'Signika',
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = BUTTON_SIZE / 2;
    label.y = BUTTON_SIZE / 2;
    button.addChild(label);
    
    // Store metadata
    button._zoneId = zoneId;
    button._action = action; // 'add' or 'remove'
    
    // Add click handler
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      this.handleZoneButtonClick(zoneId, action);
    });
    
    button.on('pointerover', () => {
      button.alpha = 1.0;
      button.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.alpha = 0.8;
      button.cursor = 'default';
    });
    
    return button;
  }
  
  /**
   * Create a button for pool management (GM only)
   */
  createPoolButton(text, color, x, y, action) {
    const button = new PIXI.Graphics();
    button.beginFill(color, 0.8);
    button.lineStyle(2, 0xFFFFFF, 1.0);
    button.drawRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, 4);
    button.endFill();
    
    button.x = x;
    button.y = y;
    button.zIndex = 30;
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.visible = game.user.isGM; // Only visible to GM
    
    const label = new PIXI.Text(text, {
      fontFamily: 'Signika',
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = BUTTON_SIZE / 2;
    label.y = BUTTON_SIZE / 2;
    button.addChild(label);
    
    button._action = action; // 'add' or 'remove'
    
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      this.handlePoolButtonClick(action);
    });
    
    button.on('pointerover', () => {
      button.alpha = 1.0;
      button.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.alpha = 0.8;
      button.cursor = 'default';
    });
    
    return button;
  }
  
  /**
   * Handle pool button click (GM only)
   */
  async handlePoolButtonClick(action) {
    if (!game.user.isGM) return;
    
    // Block if ready
    const isReady = this.hostToken.document.getFlag('mastery-system', 'divineClashReady') || false;
    if (isReady) {
      ui.notifications.warn(`${this.hostToken.name} is ready, cannot modify stones`);
      return;
    }
    
    const flags = this.hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    if (!flags) return;
    
    const actor = this.hostToken.actor;
    if (!actor) return;
    
    if (action === 'add') {
      // Add a new stone to pool (GM can override maximum)
      const currentTotal = (flags.pool || []).length + (flags.attack || []).length + (flags.defense || []).length;
      
      // Generate new stone ID (GM can add unlimited stones)
      const newStoneId = `generated-${actor.id}-${currentTotal}-${Date.now()}`;
      flags.pool = [...(flags.pool || []), newStoneId];
      
      await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
      this.renderFromFlags();
      
      console.log(`Divine Clash | GM added stone ${newStoneId} to pool for ${actor.name} (total: ${currentTotal + 1})`);
      ui.notifications.info(`Added stone to ${actor.name}'s pool (total: ${currentTotal + 1})`);
    } else if (action === 'remove') {
      // Remove last stone from pool
      const poolStones = flags.pool || [];
      if (poolStones.length === 0) {
        ui.notifications.warn(`No stones in pool to remove`);
        return;
      }
      
      const removedStoneId = poolStones[poolStones.length - 1];
      flags.pool = poolStones.slice(0, -1);
      
      await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
      this.renderFromFlags();
      
      console.log(`Divine Clash | GM removed stone ${removedStoneId} from pool for ${actor.name}`);
      ui.notifications.info(`Removed stone from ${actor.name}'s pool`);
    }
  }
  
  /**
   * Handle zone button click (+ or -)
   */
  async handleZoneButtonClick(zoneId, action) {
    // Block if ready
    const isReady = this.hostToken.document.getFlag('mastery-system', 'divineClashReady') || false;
    if (isReady) {
      ui.notifications.warn(`${this.hostToken.name} is ready, cannot modify stones`);
      return;
    }
    
    const flags = this.hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    if (!flags) return;
    
    if (action === 'add') {
      // Move first stone from pool to target zone
      const poolStones = flags.pool || [];
      if (poolStones.length === 0) {
        ui.notifications.warn('No stones available in pool');
        return;
      }
      
      const stoneId = poolStones[0]; // Take first stone from pool
      flags.pool = poolStones.filter(id => id !== stoneId);
      if (!flags[zoneId]) flags[zoneId] = [];
      flags[zoneId].push(stoneId);
      
      await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
      this.renderFromFlags();
      
      console.log(`Divine Clash | Moved ${stoneId} from pool to ${zoneId}`);
    } else if (action === 'remove') {
      // Move all stones from target zone back to pool
      const zoneStones = flags[zoneId] || [];
      if (zoneStones.length === 0) {
        ui.notifications.warn(`No stones in ${zoneId} zone`);
        return;
      }
      
      flags.pool = [...(flags.pool || []), ...zoneStones];
      flags[zoneId] = [];
      
      await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
      this.renderFromFlags();
      
      console.log(`Divine Clash | Moved ${zoneStones.length} stone(s) from ${zoneId} back to pool`);
    }
  }
  
  /**
   * Get which zone a point is in
   */
  getZoneAt(localPoint) {
    // Calculate pool offset (0 for PCs, VITALITY_WIDTH + ZONE_SPACING for NPCs)
    const poolX = this.isNpc ? (VITALITY_WIDTH + ZONE_SPACING) : 0;
    
    for (const [zoneId, zone] of Object.entries(this.zones)) {
      // Skip vitality zone for PCs (it doesn't exist)
      if (zoneId === 'vitality' && !this.isNpc) {
        continue;
      }
      
      // Get zone bounds manually (zones are drawn at specific positions)
      let zoneX, zoneY, zoneWidth, zoneHeight;
      if (zoneId === 'vitality') {
        zoneX = 0;
        zoneY = 0;
        zoneWidth = VITALITY_WIDTH;
        zoneHeight = ZONE_HEIGHT;
      } else if (zoneId === 'pool') {
        zoneX = poolX;
        zoneY = 0;
        zoneWidth = POOL_WIDTH;
        zoneHeight = ZONE_HEIGHT;
      } else if (zoneId === 'attack') {
        zoneX = poolX + POOL_WIDTH + ZONE_SPACING;
        zoneY = 0;
        zoneWidth = ATTACK_DEFENSE_WIDTH;
        zoneHeight = ZONE_HEIGHT;
      } else if (zoneId === 'defense') {
        zoneX = poolX + POOL_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH + ZONE_SPACING;
        zoneY = 0;
        zoneWidth = ATTACK_DEFENSE_WIDTH;
        zoneHeight = ZONE_HEIGHT;
      } else {
        continue;
      }
      
      // Check if point is within zone bounds
      if (localPoint.x >= zoneX && localPoint.x <= zoneX + zoneWidth &&
          localPoint.y >= zoneY && localPoint.y <= zoneY + zoneHeight) {
        return zoneId;
      }
    }
    return null;
  }
  
  /**
   * Create a stone sprite from a stone token ID or generate a new one
   */
  async createStoneSprite(stoneTokenId, textureSrcOverride = null) {
    let textureSrc = textureSrcOverride;
    
    // If stoneTokenId is provided and not a generated ID, try to find the real token
    if (stoneTokenId && !textureSrc && !stoneTokenId.startsWith('generated-')) {
      const stoneToken = canvas.tokens?.placeables.find(t => t.document.id === stoneTokenId);
      if (stoneToken) {
        textureSrc = stoneToken.document.texture?.src;
        if (!textureSrc) {
          textureSrc = stoneToken.actor?.prototypeToken?.texture?.src;
        }
        if (!textureSrc) {
          textureSrc = stoneToken.actor?.img;
        }
      }
    }
    
    // If still no texture, use default stone texture
    if (!textureSrc) {
      textureSrc = getStoneTextureSrc();
    }
    
    if (!textureSrc) {
      console.warn(`Divine Clash | No texture found for stone ${stoneTokenId}, using placeholder`);
      // Create a simple colored circle as placeholder
      return this.createPlaceholderStoneSprite(stoneTokenId);
    }
    
    // Load texture - Foundry VTT v13 compatible
    let texture;
    try {
      // Try PIXI.Assets (PIXI v7) if available
      if (PIXI.Assets && typeof PIXI.Assets.load === 'function') {
        texture = await PIXI.Assets.load(textureSrc);
      } else {
        // Fallback to Texture.from (older PIXI versions)
        texture = PIXI.Texture.from(textureSrc);
      }
    } catch (error) {
      console.warn(`Divine Clash | Failed to load texture ${textureSrc}, using fallback:`, error);
      texture = PIXI.Texture.from(textureSrc);
    }
    
    const sprite = new PIXI.Sprite(texture);
    sprite.width = STONE_SPRITE_SIZE;
    sprite.height = STONE_SPRITE_SIZE;
    sprite.anchor.set(0.5);
    sprite.pivot.set(0.5, 0.5);
    
    // Make sprite interactive (PIXI v7)
    sprite.eventMode = 'static';
    sprite.cursor = 'grab';
    
    // Set hit area for better interaction
    const hitAreaSize = STONE_SPRITE_SIZE;
    sprite.hitArea = new PIXI.Rectangle(-hitAreaSize / 2, -hitAreaSize / 2, hitAreaSize, hitAreaSize);
    
    sprite.zIndex = 20; // Higher than zones (zIndex 0)
    sprite.visible = true;
    sprite.alpha = 1.0;
    
    // Store original position for snap-back
    sprite._originalZone = null;
    sprite._originalPosition = { x: 0, y: 0 };
    sprite._stoneTokenId = stoneTokenId;
    
    // Setup drag handlers (PIXI v7 pointer events)
    sprite.on('pointerdown', (e) => {
      this.onStoneDragStart(sprite, e);
    });
    sprite.on('pointerover', () => {
      sprite.cursor = 'grab';
    });
    sprite.on('pointerout', () => {
      sprite.cursor = 'default';
    });
    
    this.stoneSprites.set(stoneTokenId, sprite);
    
    // Ensure sprite is visible and on top
    sprite.visible = true;
    sprite.alpha = 1.0;
    sprite.zIndex = 20;
    
    // Remove from parent if already added
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }
    // Add sprite AFTER zones so it renders on top (PIXI renders in children order)
    this.addChild(sprite);
    // Move sprite to top of render order
    this.setChildIndex(sprite, this.children.length - 1);
    
    return sprite;
  }
  
  /**
   * Create a placeholder stone sprite (colored circle)
   */
  createPlaceholderStoneSprite(stoneTokenId) {
    const graphics = new PIXI.Graphics();
    const radius = STONE_SPRITE_SIZE / 2;
    
    graphics.beginFill(0x888888, 1.0);
    graphics.drawCircle(0, 0, radius);
    graphics.endFill();
    graphics.lineStyle(2, 0xFFFFFF, 1.0);
    graphics.drawCircle(0, 0, radius);
    
    // Set pivot point for rotation/positioning
    graphics.pivot.set(0, 0);
    
    // Make graphics interactive (PIXI v7)
    graphics.eventMode = 'static';
    graphics.cursor = 'grab';
    
    // Set hit area for better interaction (will be resized in layoutZone if needed)
    const hitAreaSize = STONE_SPRITE_SIZE;
    graphics.hitArea = new PIXI.Rectangle(-hitAreaSize / 2, -hitAreaSize / 2, hitAreaSize, hitAreaSize);
    
    // Store original size for reference
    graphics._originalSize = STONE_SPRITE_SIZE;
    
    graphics.zIndex = 20; // Higher than zones (zIndex 0)
    graphics.visible = true;
    graphics.alpha = 1.0;
    
    // Store metadata
    graphics._originalZone = null;
    graphics._originalPosition = { x: 0, y: 0 };
    graphics._stoneTokenId = stoneTokenId || `placeholder-${Date.now()}-${Math.random()}`;
    
    // Setup drag handlers (PIXI v7 pointer events)
    graphics.on('pointerdown', (e) => {
      this.onStoneDragStart(graphics, e);
    });
    graphics.on('pointerover', () => {
      graphics.cursor = 'grab';
    });
    graphics.on('pointerout', () => {
      graphics.cursor = 'default';
    });
    
    this.stoneSprites.set(graphics._stoneTokenId, graphics);
    this.addChild(graphics);
    
    // Ensure placeholder is visible
    graphics.visible = true;
    graphics.alpha = 1.0;
    graphics.zIndex = 20;
    
    return graphics;
  }
  
  /**
   * Handle stone drag start
   */
  onStoneDragStart(sprite, event) {
    // Block if ready
    const isReady = this.hostToken.document.getFlag('mastery-system', 'divineClashReady') || false;
    if (isReady) {
      console.log(`Divine Clash | ${this.hostToken.name} is ready, stone dragging blocked`);
      return;
    }
    
    // Check permissions
    if (!this.hostToken.isOwner && !game.user.isGM) {
      return;
    }
    
    if (!event || !event.global) {
      console.error(`Divine Clash | [DRAG START] Invalid event object`, event);
      return;
    }
    
    event.stopPropagation(); // Prevent other handlers
    
    this.draggingSprite = sprite;
    const localPos = this.toLocal(event.global);
    this.dragOffset.x = localPos.x - sprite.x;
    this.dragOffset.y = localPos.y - sprite.y;
    
    sprite._originalZone = this.getStoneZone(sprite._stoneTokenId);
    sprite._originalPosition.x = sprite.x;
    sprite._originalPosition.y = sprite.y;
    
    sprite.cursor = 'grabbing';
    sprite.zIndex = 100; // Bring to front
    
    // Start global drag tracking
    canvas.app.stage.on('pointermove', this.onStoneDragMove);
    canvas.app.stage.on('pointerup', this.onStoneDragEnd);
    canvas.app.stage.on('pointerupoutside', this.onStoneDragEnd);
  }
  
  /**
   * Handle stone drag move
   */
  onStoneDragMove = (event) => {
    if (!this.draggingSprite) return;
    
    const localPos = this.toLocal(event.global);
    this.draggingSprite.x = localPos.x - this.dragOffset.x;
    this.draggingSprite.y = localPos.y - this.dragOffset.y;
    
    // Update hovered zone (use sprite position, not mouse position, for zone detection)
    const zoneId = this.getZoneAt({ x: this.draggingSprite.x, y: this.draggingSprite.y });
    if (zoneId !== this.hoveredZone) {
      // Reset previous hover
      if (this.hoveredZone) {
        this.zones[this.hoveredZone].alpha = 1.0;
      }
      this.hoveredZone = zoneId;
      if (zoneId) {
        this.zones[zoneId].alpha = HOVER_ALPHA;
      }
    }
  };
  
  /**
   * Handle stone drag end
   */
  onStoneDragEnd = (event) => {
    if (!this.draggingSprite) return;
    
    const sprite = this.draggingSprite;
    const localPos = this.toLocal(event.global);
    const zoneId = this.getZoneAt(localPos);
    
    // Cleanup
    canvas.app.stage.off('pointermove', this.onStoneDragMove);
    canvas.app.stage.off('pointerup', this.onStoneDragEnd);
    canvas.app.stage.off('pointerupoutside', this.onStoneDragEnd);
    
    // Reset hover
    if (this.hoveredZone) {
      this.zones[this.hoveredZone].alpha = 1.0;
    }
    this.hoveredZone = null;
    
    if (zoneId && zoneId !== sprite._originalZone) {
      // Drop into zone
      this.setStoneZone(sprite._stoneTokenId, zoneId);
    } else {
      // Snap back to original position
      sprite.x = sprite._originalPosition.x;
      sprite.y = sprite._originalPosition.y;
    }
    
    sprite.cursor = 'grab';
    sprite.zIndex = 20; // Back to normal zIndex
    this.draggingSprite = null;
  };
  
  /**
   * Layout stones in a zone (grid packing with dynamic sizing)
   */
  layoutZone(zoneId, stoneIds) {
    const zone = this.zones[zoneId];
    if (!zone) {
      console.warn(`Divine Clash | Zone ${zoneId} not found`);
      return;
    }
    
    // Skip vitality zone layout for PCs (it doesn't exist)
    if (zoneId === 'vitality' && !this.isNpc) {
      return;
    }
    
    // Pool offset (shifted right only if vitality zone is present)
    const poolX = this.isNpc ? (VITALITY_WIDTH + ZONE_SPACING) : 0;
    
    // Get zone position and size (zones are drawn at specific positions)
    let zoneX, zoneY, zoneWidth, zoneHeight;
    if (zoneId === 'vitality') {
      zoneX = 0;
      zoneY = 0;
      zoneWidth = VITALITY_WIDTH;
      zoneHeight = ZONE_HEIGHT;
    } else if (zoneId === 'pool') {
      zoneX = poolX;
      zoneY = 0;
      zoneWidth = POOL_WIDTH;
      zoneHeight = ZONE_HEIGHT;
    } else if (zoneId === 'attack') {
      zoneX = poolX + POOL_WIDTH + ZONE_SPACING;
      zoneY = 0;
      zoneWidth = ATTACK_DEFENSE_WIDTH;
      zoneHeight = ZONE_HEIGHT;
    } else if (zoneId === 'defense') {
      zoneX = poolX + POOL_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH + ZONE_SPACING;
      zoneY = 0;
      zoneWidth = ATTACK_DEFENSE_WIDTH;
      zoneHeight = ZONE_HEIGHT;
    } else {
      return;
    }
    
    const padding = 10;
    const labelHeight = 30; // Space reserved for labels at the top
    const cols = (zoneId === 'pool') ? 6 : (zoneId === 'vitality') ? 3 : 3;
    const rows = Math.ceil(Math.max(1, stoneIds.length) / cols);
    const cellWidth = (zoneWidth - padding * 2) / cols;
    // Reserve space at top for labels, so stones don't cover them
    const cellHeight = (zoneHeight - padding * 2 - labelHeight) / rows;
    
    // Calculate dynamic stone size based on available space
    // Use 80% of the smaller dimension (width or height) to ensure stones fit
    const maxStoneSize = Math.min(cellWidth, cellHeight) * 0.8;
    const dynamicStoneSize = Math.min(STONE_SPRITE_SIZE, maxStoneSize);
    
    stoneIds.forEach((stoneId, index) => {
      const sprite = this.stoneSprites.get(stoneId);
      if (!sprite) {
        console.warn(`Divine Clash | Sprite for ${stoneId} not found in layoutZone(${zoneId})`);
        return;
      }
      
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const spriteX = zoneX + padding + col * cellWidth + cellWidth / 2;
      // Offset Y position to account for label space at top
      const spriteY = zoneY + padding + labelHeight + row * cellHeight + cellHeight / 2;
      
      sprite.x = spriteX;
      sprite.y = spriteY;
      
      // Resize sprite to fit in the available space
      sprite.width = dynamicStoneSize;
      sprite.height = dynamicStoneSize;
      
      // Update hit area to match new size
      if (sprite.hitArea) {
        const hitAreaSize = dynamicStoneSize;
        sprite.hitArea = new PIXI.Rectangle(-hitAreaSize / 2, -hitAreaSize / 2, hitAreaSize, hitAreaSize);
      }
      
      // For Graphics objects (placeholders), also scale the visual representation
      if (sprite instanceof PIXI.Graphics) {
        // Graphics objects need to be redrawn or scaled
        // Since we can't easily redraw, we use scale instead
        const scale = dynamicStoneSize / STONE_SPRITE_SIZE;
        sprite.scale.set(scale, scale);
      }
      
      // Ensure sprite is visible and properly added
      sprite.visible = true;
      sprite.alpha = 1.0;
      if (!this.children.includes(sprite)) {
        console.warn(`Divine Clash | Sprite ${stoneId} not in container, re-adding`);
        this.addChild(sprite);
      }
      
      // Store original position for snap-back
      sprite._originalPosition = { x: spriteX, y: spriteY };
      sprite._originalZone = zoneId;
    });
  }
  
  /**
   * Get which zone a stone is in
   */
  getStoneZone(stoneTokenId) {
    const flags = this.hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    if (!flags) return 'pool';
    
    if (flags.pool?.includes(stoneTokenId)) return 'pool';
    if (flags.attack?.includes(stoneTokenId)) return 'attack';
    if (flags.defense?.includes(stoneTokenId)) return 'defense';
    return 'pool';
  }
  
  /**
   * Set stone zone and persist to flags
   */
  async setStoneZone(stoneTokenId, zoneId) {
    const flags = this.hostToken.document.getFlag('mastery-system', 'divineClashOverlay') || {
      pool: [],
      attack: [],
      defense: []
    };
    
    // Remove from all zones
    flags.pool = (flags.pool || []).filter(id => id !== stoneTokenId);
    flags.attack = (flags.attack || []).filter(id => id !== stoneTokenId);
    flags.defense = (flags.defense || []).filter(id => id !== stoneTokenId);
    
    // Add to target zone
    if (!flags[zoneId]) flags[zoneId] = [];
    flags[zoneId].push(stoneTokenId);
    
    // Persist
    await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
    
    // Re-render (will be triggered by hook, but we can also do it directly)
    this.renderFromFlags();
  }
  
  /**
   * Render overlay from flag data
   */
  async renderFromFlags() {
    const flags = this.hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    if (!flags) {
      console.warn(`Divine Clash | No flags found for ${this.hostToken.name}`);
      return;
    }
    
    // Update vitality stones based on current vitality value (ONLY for NPCs)
    if (this.isNpc) {
      const currentVitality = this.hostToken.document.getFlag('mastery-system', 'divineClashVitality');
      if (currentVitality && currentVitality.current !== undefined) {
        const currentVitalityCount = currentVitality.current;
        const actor = this.hostToken.actor;
        
        // Generate vitality stone IDs based on current vitality
        const vitalityStoneIds = [];
        for (let i = 0; i < currentVitalityCount; i++) {
          vitalityStoneIds.push(`generated-vitality-${actor.id}-${i}`);
        }
        
        // Update flags with current vitality stones
        flags.vitality = vitalityStoneIds;
        await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
        
        console.log(`Divine Clash | Updated vitality stones for ${this.hostToken.name}: ${currentVitalityCount} stones (was ${(flags.vitality || []).length})`);
      }
    }
    
    // Get all stone IDs (exclude vitality for PCs)
    const allStoneIds = [
      ...(this.isNpc ? (flags.vitality || []) : []),
      ...(flags.pool || []),
      ...(flags.attack || []),
      ...(flags.defense || [])
    ];
    
    console.log(`Divine Clash | Rendering ${allStoneIds.length} stones for ${this.hostToken.name}: vitality=${this.isNpc ? (flags.vitality || []).length : 0}, pool=${(flags.pool || []).length}, attack=${(flags.attack || []).length}, defense=${(flags.defense || []).length}`);
    
    // Get stone texture source once
    const textureSrc = getStoneTextureSrc();
    
    // Create sprites for missing ones
    for (const stoneId of allStoneIds) {
      if (!this.stoneSprites.has(stoneId)) {
        // Check if it's a generated stone ID
        if (stoneId.startsWith('generated-')) {
          await this.createStoneSprite(stoneId, textureSrc);
        } else {
          // Try to find real token
          await this.createStoneSprite(stoneId);
        }
      }
    }
    
    // Remove sprites that are no longer in flags
    for (const [stoneId, sprite] of this.stoneSprites.entries()) {
      if (!allStoneIds.includes(stoneId)) {
        this.removeChild(sprite);
        sprite.destroy();
        this.stoneSprites.delete(stoneId);
      }
    }
    
    // Layout each zone (vitality zone only for NPCs)
    if (this.isNpc) {
      this.layoutZone('vitality', flags.vitality || []);
    }
    this.layoutZone('pool', flags.pool || []);
    this.layoutZone('attack', flags.attack || []);
    this.layoutZone('defense', flags.defense || []);
    
    // Move all sprites to top of render order (after zones and labels)
    // This ensures sprites are clickable and not blocked by zones
    for (const [stoneId, sprite] of this.stoneSprites.entries()) {
      if (this.children.includes(sprite)) {
        this.setChildIndex(sprite, this.children.length - 1);
      }
    }
    
    // Check vitality state (if 0, character is out for the round)
    // For PCs, use divineClashVitality flag only (no vitality stones)
    const vitality = this.hostToken.document.getFlag('mastery-system', 'divineClashVitality');
    const isOutOfRound = (vitality && vitality.current !== undefined && vitality.current <= 0);
    
    // Check ready state and update interaction
    const isReady = this.hostToken.document.getFlag('mastery-system', 'divineClashReady') || false;
    this.updateInteractionState(!isReady);
    
    // Update ready button appearance
    if (this.readyButton) {
      if (isOutOfRound) {
        // Character is out for the round (0 vitality)
        this.readyButton.eventMode = 'none';
        this.readyButton.cursor = 'default';
        this.readyButton.alpha = 0.3; // Very dim when out
        const label = this.readyButton.children[0];
        if (label && label instanceof PIXI.Text) {
          label.text = 'OUT';
          label.fill = 0xFF0000; // Red when out
        }
      } else if (isReady) {
        this.readyButton.eventMode = 'none';
        this.readyButton.cursor = 'default';
        this.readyButton.alpha = 0.5; // Visual indicator that it's disabled
        const label = this.readyButton.children[0];
        if (label && label instanceof PIXI.Text) {
          label.text = 'READY ✓';
          label.fill = 0x00FF00; // Green when ready
        }
      } else {
        this.readyButton.eventMode = 'static';
        this.readyButton.cursor = 'pointer';
        this.readyButton.alpha = 0.9;
        const label = this.readyButton.children[0];
        if (label && label instanceof PIXI.Text) {
          label.text = 'READY';
          label.fill = 0xFFFFFF; // White when not ready
        }
      }
    }
    
    // Ready button is always visible and clickable
    // Update world position in case token moved
    this.updateWorldPosition();
    
    // Update visibility based on permissions
    this.updateVisibility();
    
    console.log(`Divine Clash | Render complete for ${this.hostToken.name}, overlay visible=${this.visible}, position=(${this.x}, ${this.y}), parent=${this.parent ? this.parent.constructor.name : 'none'}`);
  }
  
  /**
   * Create the Ready button
   */
  createReadyButton() {
    const button = new PIXI.Graphics();
    button.beginFill(0x00AA00, 0.9); // Green background
    button.lineStyle(3, 0xFFFFFF, 1.0);
    button.drawRoundedRect(0, 0, READY_BUTTON_WIDTH, READY_BUTTON_HEIGHT, 8);
    button.endFill();
    
    // Pool offset (shifted right only if vitality zone is present)
    const poolX = this.isNpc ? (VITALITY_WIDTH + ZONE_SPACING) : 0;
    
    // Position at right edge of pool zone
    button.x = poolX + POOL_WIDTH - READY_BUTTON_WIDTH;
    button.y = -READY_BUTTON_HEIGHT - 10; // Above the pool zone
    button.zIndex = 30; // Above sprites
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    const label = new PIXI.Text('READY', {
      fontFamily: 'Signika',
      fontSize: 24,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = READY_BUTTON_WIDTH / 2;
    label.y = READY_BUTTON_HEIGHT / 2;
    button.addChild(label);
    
    // Add click handler - bind to ensure correct 'this' context
    const overlay = this;
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      overlay.handleReadyClick();
    });
    
    button.on('pointerover', () => {
      button.alpha = 1.0;
      button.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.alpha = 0.9;
      button.cursor = 'default';
    });
    
    return button;
  }
  
  /**
   * Handle Ready button click
   */
  async handleReadyClick() {
    // Ensure we have the correct host token reference
    const hostToken = this.hostToken;
    if (!hostToken || !hostToken.document) {
      console.error('Divine Clash | handleReadyClick: Invalid hostToken', this.hostToken);
      return;
    }
    
    // Check if already ready (prevent multiple clicks)
    const currentReady = await hostToken.document.getFlag('mastery-system', 'divineClashReady') || false;
    if (currentReady) {
      ui.notifications.warn(`${hostToken.name} is already ready!`);
      return;
    }
    
    const flags = hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    if (!flags) return;
    
    const poolStones = flags.pool || [];
    const attackStones = flags.attack || [];
    const defenseStones = flags.defense || [];
    
    // Set ready flag ONLY on this specific token (one-way, cannot be unset)
    console.log(`Divine Clash | Setting ready flag for token: ${hostToken.name} (id: ${hostToken.id}, document.id: ${hostToken.document.id})`);
    await hostToken.document.setFlag('mastery-system', 'divineClashReady', true);
    
    // Disable ready button
    if (this.readyButton) {
      this.readyButton.eventMode = 'none';
      this.readyButton.cursor = 'default';
      this.readyButton.alpha = 0.5; // Visual indicator that it's disabled
      
      // Update label to show ready state
      const label = this.readyButton.children[0];
      if (label && label instanceof PIXI.Text) {
        label.text = 'READY ✓';
        label.fill = 0x00FF00; // Green when ready
      }
    }
    
    // Block all stone interactions
    this.updateInteractionState(false);
    
    console.log(`Divine Clash | ${hostToken.name} is ready!`, {
      pool: poolStones.length,
      attack: attackStones.length,
      defense: defenseStones.length,
      tokenId: hostToken.id
    });
    
    ui.notifications.info(`${hostToken.name} is ready! (Pool: ${poolStones.length}, Attack: ${attackStones.length}, Defense: ${defenseStones.length})`);
    
    // Check if all PCs are ready and notify GM
    if (game.user.isGM) {
      const npcTokens = canvas.tokens?.placeables.filter(t => t.actor && isNpc(t.actor)) || [];
      if (npcTokens.length > 0) {
        const allReady = await areAllPCsReady(npcTokens[0]);
        if (allReady) {
          ui.notifications.info('All PCs are ready! Use window.divineClashDrawQueue() to draw damage queue.');
        }
      }
    }
  }
  
  /**
   * Update interaction state (enable/disable stone dragging and buttons)
   */
  updateInteractionState(enabled) {
    const isReady = this.hostToken.document.getFlag('mastery-system', 'divineClashReady') || false;
    
    // Check if vitality is 0 (character is out for the round)
    // For PCs, use divineClashVitality flag only (no vitality stones)
    const vitality = this.hostToken.document.getFlag('mastery-system', 'divineClashVitality');
    const isOutOfRound = (vitality && vitality.current !== undefined && vitality.current <= 0);
    
    const shouldBlock = isReady || !enabled || isOutOfRound;
    
    // Block stone sprites
    for (const [stoneId, sprite] of this.stoneSprites.entries()) {
      if (shouldBlock) {
        sprite.eventMode = 'none';
        sprite.cursor = 'default';
        sprite.interactive = false;
      } else {
        sprite.eventMode = 'static';
        sprite.cursor = 'grab';
        sprite.interactive = true;
      }
    }
    
    // Block zone buttons (if GM)
    if (game.user.isGM) {
      // Pool buttons
      if (this.poolButtons) {
        if (shouldBlock) {
          this.poolButtons.plus.eventMode = 'none';
          this.poolButtons.minus.eventMode = 'none';
        } else {
          this.poolButtons.plus.eventMode = 'static';
          this.poolButtons.minus.eventMode = 'static';
        }
      }
      
      // Zone buttons are created dynamically, we'll block them in the handler
    }
    
    // Disable ready button if out of round
    if (this.readyButton) {
      if (isOutOfRound) {
        this.readyButton.eventMode = 'none';
        this.readyButton.cursor = 'default';
        this.readyButton.alpha = 0.3; // Very dim when out
        const label = this.readyButton.children[0];
        if (label && label instanceof PIXI.Text) {
          label.text = 'OUT';
          label.fill = 0xFF0000; // Red when out
        }
      }
    }
  }
  
  /**
   * Create the End Round button (GM only)
   */
  createEndRoundButton() {
    const button = new PIXI.Graphics();
    button.beginFill(0xFF6600, 0.9); // Orange background
    button.lineStyle(3, 0xFFFFFF, 1.0);
    button.drawRoundedRect(0, 0, READY_BUTTON_WIDTH, READY_BUTTON_HEIGHT, 8);
    button.endFill();
    
    // Position at top of NPC overlay (only for NPCs)
    // Adjust position to make room for Unlock button on the right
    if (this.isNpc) {
      button.x = (POOL_WIDTH - READY_BUTTON_WIDTH * 2 - 10) / 2; // Left of center to make room for Unlock button
      button.y = -READY_BUTTON_HEIGHT - 10; // Above the pool zone
      button.visible = game.user.isGM; // Only visible to GM
    } else {
      // For characters, don't show End Round button
      button.x = 0;
      button.y = 0;
      button.visible = false;
    }
    button.zIndex = 30; // Above sprites
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    const label = new PIXI.Text('END ROUND', {
      fontFamily: 'Signika',
      fontSize: 18,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = READY_BUTTON_WIDTH / 2;
    label.y = READY_BUTTON_HEIGHT / 2;
    button.addChild(label);
    
    // Add click handler
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      this.handleEndRoundClick();
    });
    
    button.on('pointerover', () => {
      button.alpha = 1.0;
      button.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.alpha = 0.9;
      button.cursor = 'default';
    });
    
    return button;
  }
  
  /**
   * Create the Unlock Ready button (GM only, for NPCs)
   */
  createUnlockReadyButton() {
    const button = new PIXI.Graphics();
    button.beginFill(0xFFAA00, 0.9); // Orange/yellow background
    button.lineStyle(3, 0xFFFFFF, 1.0);
    button.drawRoundedRect(0, 0, READY_BUTTON_WIDTH, READY_BUTTON_HEIGHT, 8);
    button.endFill();
    
    // Position next to End Round button (for NPCs)
    if (this.isNpc) {
      button.x = (POOL_WIDTH - READY_BUTTON_WIDTH) / 2 + READY_BUTTON_WIDTH + 10; // Right of End Round button
      button.y = -READY_BUTTON_HEIGHT - 10; // Above the overlay
    }
    
    button.zIndex = 30; // Above sprites
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.visible = game.user.isGM; // Only visible to GM
    
    const label = new PIXI.Text('UNLOCK', {
      fontFamily: 'Signika',
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = READY_BUTTON_WIDTH / 2;
    label.y = READY_BUTTON_HEIGHT / 2;
    button.addChild(label);
    
    // Add click handler
    const overlay = this;
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      overlay.handleUnlockReadyClick();
    });
    
    button.on('pointerover', () => {
      button.alpha = 1.0;
      button.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.alpha = 0.9;
      button.cursor = 'default';
    });
    
    return button;
  }
  
  /**
   * Create the Resolve/Check button (GM only, for NPCs)
   * Starts as "CHECK" button, transforms to "RESOLVE" when all PCs are ready
   */
  createResolveButton() {
    const button = new PIXI.Graphics();
    button.beginFill(0x0066AA, 0.9); // Blue background for CHECK
    button.lineStyle(3, 0xFFFFFF, 1.0);
    button.drawRoundedRect(0, 0, READY_BUTTON_WIDTH, READY_BUTTON_HEIGHT, 8);
    button.endFill();
    
    // Position next to Unlock button (for NPCs)
    if (this.isNpc) {
      button.x = (POOL_WIDTH - READY_BUTTON_WIDTH) / 2 + READY_BUTTON_WIDTH * 2 + 20; // Right of Unlock button
      button.y = -READY_BUTTON_HEIGHT - 10; // Above the overlay
    }
    
    button.zIndex = 30; // Above sprites
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.visible = game.user.isGM; // Always visible to GM
    
    const label = new PIXI.Text('CHECK', {
      fontFamily: 'Signika',
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = READY_BUTTON_WIDTH / 2;
    label.y = READY_BUTTON_HEIGHT / 2;
    button.addChild(label);
    
    // Store label reference for easy updates
    button._label = label;
    button._isResolveMode = false;
    
    // Add click handler
    const overlay = this;
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      overlay.handleResolveClick();
    });
    
    button.on('pointerover', () => {
      button.alpha = 1.0;
      button.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.alpha = 0.9;
      button.cursor = 'default';
    });
    
    return button;
  }
  
  /**
   * Update Resolve button appearance based on ready status
   * Transforms CHECK button to RESOLVE button when all PCs are ready
   */
  async updateResolveButtonVisibility() {
    if (!this.resolveButton || !this.isNpc) {
      console.log(`Divine Clash | updateResolveButtonVisibility: resolveButton=${!!this.resolveButton}, isNpc=${this.isNpc}`);
      return;
    }
    
    const allReady = await areAllPCsReady(this.hostToken);
    console.log(`Divine Clash | updateResolveButtonVisibility: allReady=${allReady}, isGM=${game.user.isGM}`);
    
    // Always visible to GM, but changes appearance based on ready status
    this.resolveButton.visible = game.user.isGM;
    
    // Update button appearance based on ready status
    if (allReady && !this.resolveButton._isResolveMode) {
      // Transform to RESOLVE button
      this.resolveButton.clear();
      this.resolveButton.beginFill(0x00AA00, 0.9); // Green background for RESOLVE
      this.resolveButton.lineStyle(3, 0xFFFFFF, 1.0);
      this.resolveButton.drawRoundedRect(0, 0, READY_BUTTON_WIDTH, READY_BUTTON_HEIGHT, 8);
      this.resolveButton.endFill();
      
      if (this.resolveButton._label) {
        this.resolveButton._label.text = 'RESOLVE';
        this.resolveButton._label.fill = 0xFFFFFF;
      }
      
      this.resolveButton._isResolveMode = true;
      console.log(`Divine Clash | Resolve button transformed to RESOLVE mode`);
    } else if (!allReady && this.resolveButton._isResolveMode) {
      // Transform back to CHECK button
      this.resolveButton.clear();
      this.resolveButton.beginFill(0x0066AA, 0.9); // Blue background for CHECK
      this.resolveButton.lineStyle(3, 0xFFFFFF, 1.0);
      this.resolveButton.drawRoundedRect(0, 0, READY_BUTTON_WIDTH, READY_BUTTON_HEIGHT, 8);
      this.resolveButton.endFill();
      
      if (this.resolveButton._label) {
        this.resolveButton._label.text = 'CHECK';
        this.resolveButton._label.fill = 0xFFFFFF;
      }
      
      this.resolveButton._isResolveMode = false;
      console.log(`Divine Clash | Resolve button transformed back to CHECK mode`);
    }
    
    this.resolveButton.alpha = 0.9;
  }
  
  /**
   * Handle Resolve/Check button click (GM only)
   */
  async handleResolveClick() {
    if (!game.user.isGM) return;
    
    // Always check ready status first
    const allReady = await areAllPCsReady(this.hostToken);
    
    if (!allReady) {
      // Show status of all PCs
      const allPCTokens = canvas.tokens?.placeables.filter(token => {
        if (!token.actor) return false;
        const actor = token.actor;
        return actor.type === 'character' && token._dcOverlay;
      }) || [];
      
      const readyStatus = [];
      for (const token of allPCTokens) {
        const ready = await token.document.getFlag('mastery-system', 'divineClashReady') || false;
        readyStatus.push(`${token.name}: ${ready ? '✓ Ready' : '✗ Not Ready'}`);
      }
      
      ui.notifications.warn(`Not all PCs are ready yet!\n${readyStatus.join('\n')}`);
      
      // Update button appearance
      await this.updateResolveButtonVisibility();
      return;
    }
    
    // All ready - resolve the round
    ui.notifications.info('All PCs are ready! Resolving round...');
    await resolveRoundIfReady(this.hostToken);
    
    // Update button appearance after resolve
    await this.updateResolveButtonVisibility();
  }
  
  /**
   * Create the Reset button (GM only, for NPCs)
   */
  createResetButton() {
    const button = new PIXI.Graphics();
    button.beginFill(0xAA0000, 0.9); // Red background
    button.lineStyle(4, 0xFFFFFF, 1.0);
    button.drawRoundedRect(0, 0, READY_BUTTON_WIDTH * 1.5, READY_BUTTON_HEIGHT * 1.2, 8);
    button.endFill();
    
    // Position left of overlay (for NPCs)
    if (this.isNpc) {
      button.x = -READY_BUTTON_WIDTH * 1.5 - 20; // Left of overlay with spacing
      button.y = (ZONE_HEIGHT - READY_BUTTON_HEIGHT * 1.2) / 2; // Vertically centered
    }
    
    button.zIndex = 30; // Above sprites
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.visible = game.user.isGM; // Only visible to GM
    
    const label = new PIXI.Text('RESET', {
      fontFamily: 'Signika',
      fontSize: 24,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = (READY_BUTTON_WIDTH * 1.5) / 2;
    label.y = (READY_BUTTON_HEIGHT * 1.2) / 2;
    button.addChild(label);
    
    // Add click handler
    const overlay = this;
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      overlay.handleResetClick();
    });
    
    button.on('pointerover', () => {
      button.alpha = 1.0;
      button.cursor = 'pointer';
    });
    
    button.on('pointerout', () => {
      button.alpha = 0.9;
      button.cursor = 'default';
    });
    
    return button;
  }
  
  /**
   * Handle Reset button click (GM only)
   */
  async handleResetClick() {
    if (!game.user.isGM) return;
    
    await resetDivineClash();
  }
  
  /**
   * Handle Unlock Ready button click (GM only)
   */
  async handleUnlockReadyClick() {
    if (!game.user.isGM) return;
    
    // Get all PC tokens that have an overlay (more reliable than checking flags)
    const allPCTokens = canvas.tokens?.placeables.filter(token => {
      if (!token.actor) return false;
      const actor = token.actor;
      return actor.type === 'character' && token._dcOverlay;
    }) || [];
    
    console.log(`Divine Clash | Unlock: Found ${allPCTokens.length} PC token(s) with overlays`);
    
    let unlockedCount = 0;
    for (const token of allPCTokens) {
      const currentReady = await token.document.getFlag('mastery-system', 'divineClashReady') || false;
      console.log(`Divine Clash | Unlock: Checking ${token.name} - ready=${currentReady}`);
      
      if (currentReady) {
        await token.document.setFlag('mastery-system', 'divineClashReady', false);
        
        // Re-enable interactions for this token's overlay
        if (token._dcOverlay) {
          token._dcOverlay.updateInteractionState(true);
          
          // Update ready button appearance
          if (token._dcOverlay.readyButton) {
            token._dcOverlay.readyButton.eventMode = 'static';
            token._dcOverlay.readyButton.cursor = 'pointer';
            token._dcOverlay.readyButton.alpha = 0.9;
            const label = token._dcOverlay.readyButton.children[0];
            if (label && label instanceof PIXI.Text) {
              label.text = 'READY';
              label.fill = 0xFFFFFF; // White when not ready
            }
          }
          
          // Re-render to update state
          token._dcOverlay.renderFromFlags();
        }
        
        unlockedCount++;
        console.log(`Divine Clash | Unlock: Unlocked ${token.name}`);
      }
    }
    
    if (unlockedCount > 0) {
      ui.notifications.info(`Unlocked ${unlockedCount} PC(s). They can now modify their stones and ready status again.`);
      console.log(`Divine Clash | GM unlocked ${unlockedCount} PC(s)`);
      
      // Update resolve button visibility after unlock
      if (this.resolveButton) {
        await this.updateResolveButtonVisibility();
      }
    } else {
      ui.notifications.info('No PCs are currently ready.');
      console.log(`Divine Clash | Unlock: No ready PCs found (checked ${allPCTokens.length} tokens)`);
    }
  }
  
  /**
   * Handle End Round button click (GM only)
   */
  async handleEndRoundClick() {
    if (!game.user.isGM) return;
    
    const flags = this.hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    if (!flags) return;
    
    const actor = this.hostToken.actor;
    if (!actor) return;
    
    // Get current round number
    const currentRound = flags.currentRound || 1;
    
    // Calculate stone usage
    const poolStones = flags.pool || [];
    const attackStones = flags.attack || [];
    const defenseStones = flags.defense || [];
    const stonesUsed = attackStones.length + defenseStones.length;
    const stonesRemaining = poolStones.length;
    
    // Initialize rounds array if needed
    if (!flags.rounds) flags.rounds = [];
    
    // Save round data
    const roundData = {
      round: currentRound,
      timestamp: Date.now(),
      stonesUsed: stonesUsed,
      stonesRemaining: stonesRemaining,
      attackStones: attackStones.length,
      defenseStones: defenseStones.length,
      poolStones: poolStones.length,
      attackStoneIds: [...attackStones], // Save IDs for reference
      defenseStoneIds: [...defenseStones],
      poolStoneIds: [...poolStones]
    };
    
    flags.rounds.push(roundData);
    flags.currentRound = currentRound + 1;
    
    // Remove attack and defense stones (they are spent)
    flags.attack = [];
    flags.defense = [];
    
    // Regenerate pools based on actor type
    if (actor.type === 'character') {
      // Characters: regenerate up to mastery rank, but max is starting pool
      const masteryRank = getMasteryRank(actor);
      const startingPool = getPowerStoneCount(actor); // Starting pool is max power stones
      const currentPoolCount = poolStones.length;
      
      // Regenerate up to mastery rank, but don't exceed starting pool
      const newPoolCount = Math.min(currentPoolCount + masteryRank, startingPool);
      
      // Generate new pool stone IDs
      const poolStoneIds = [];
      for (let i = 0; i < newPoolCount; i++) {
        poolStoneIds.push(`generated-pool-${actor.id}-${i}`);
      }
      
      flags.pool = poolStoneIds;
      console.log(`Divine Clash | Character ${actor.name}: Regenerated ${newPoolCount - currentPoolCount} stones (${currentPoolCount} -> ${newPoolCount}, max: ${startingPool}, mastery rank: ${masteryRank})`);
    } else if (isNpc(actor)) {
      // NPCs: regenerate up to regeneration value, but max is starting pool
      const divineCombat = actor.system?.divineCombat || {};
      const regeneration = divineCombat.regeneration || 0;
      const startingPool = divineCombat.startingPool || 0;
      const currentPoolCount = poolStones.length;
      
      // Regenerate up to regeneration value, but don't exceed starting pool
      const newPoolCount = Math.min(currentPoolCount + regeneration, startingPool);
      
      // Generate new pool stone IDs
      const poolStoneIds = [];
      for (let i = 0; i < newPoolCount; i++) {
        poolStoneIds.push(`generated-pool-${actor.id}-${i}`);
      }
      
      flags.pool = poolStoneIds;
      console.log(`Divine Clash | NPC ${actor.name}: Regenerated ${newPoolCount - currentPoolCount} stones (${currentPoolCount} -> ${newPoolCount}, max: ${startingPool}, regeneration: ${regeneration})`);
    }
    
    await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
    
    // Re-render to show updated pools
    await this.renderFromFlags();
    
    console.log(`Divine Clash | Round ${currentRound} ended for ${actor.name}`, roundData);
    ui.notifications.info(`Round ${currentRound} ended for ${actor.name}: ${stonesUsed} stones used, ${stonesRemaining} remaining`);
    
    // Show round history summary
    const totalRounds = flags.rounds.length;
    const totalStonesUsed = flags.rounds.reduce((sum, r) => sum + r.stonesUsed, 0);
    console.log(`Divine Clash | Round history for ${actor.name}:`, {
      totalRounds: totalRounds,
      totalStonesUsed: totalStonesUsed,
      rounds: flags.rounds
    });
  }
  
  /**
   * Destroy overlay
   */
  destroyOverlay() {
    // Cleanup drag handlers
    if (this.draggingSprite) {
      canvas.app.stage.off('pointermove', this.onStoneDragMove);
      canvas.app.stage.off('pointerup', this.onStoneDragEnd);
      canvas.app.stage.off('pointerupoutside', this.onStoneDragEnd);
    }
    
    // Destroy sprites
    for (const sprite of this.stoneSprites.values()) {
      sprite.destroy();
    }
    this.stoneSprites.clear();
    
    // Destroy unlock ready button
    if (this.unlockReadyButton) {
      this.unlockReadyButton.destroy();
      this.unlockReadyButton = null;
    }
    
    // Destroy reset button
    if (this.resetButton) {
      this.resetButton.destroy();
      this.resetButton = null;
    }
    
    // Remove from host token
    if (this.hostToken._dcOverlay === this) {
      delete this.hostToken._dcOverlay;
    }
    
    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }
    
    this.destroy();
  }
}

// ============================================================================
// HOOKS REGISTRATION
// ============================================================================

let hooksRegistered = false;

function registerHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;
  
  // Re-render overlay when token flags change
  Hooks.on('updateToken', (tokenDocument, updateData, options, userId) => {
    const token = canvas.tokens?.placeables.find(t => t.document.id === tokenDocument.id);
    if (!token || !token._dcOverlay) return;
    
    // Check if overlay flags changed
    if (updateData.flags?.['mastery-system']?.divineClashOverlay !== undefined) {
      token._dcOverlay.renderFromFlags();
    }
    
    // Update ready button state when ready flag changes (only for this specific token)
    if (updateData.flags?.['mastery-system']?.divineClashReady !== undefined) {
      console.log(`Divine Clash | Ready flag changed for token: ${token.name} (id: ${token.id})`);
      token._dcOverlay.renderFromFlags();
      
      // Update resolve button visibility on NPC overlays
      if (game.user.isGM) {
        const npcTokens = canvas.tokens?.placeables.filter(t => t.actor && isNpc(t.actor)) || [];
        for (const npcToken of npcTokens) {
          if (npcToken._dcOverlay && npcToken._dcOverlay.resolveButton) {
            npcToken._dcOverlay.updateResolveButtonVisibility();
          }
        }
      }
    }
    
    // Update team vitality display when vitality changes
    if (updateData.flags?.['mastery-system']?.divineClashVitality !== undefined) {
      updateTeamVitalityDisplay();
    }
  });
  
  // Update overlay position when token refreshes or moves
  Hooks.on('refreshToken', (token) => {
    if (token._dcOverlay) {
      // Update world position (overlay is attached to canvas.tokens, not token.mesh)
      token._dcOverlay.updateWorldPosition();
      
      // Update visibility
      token._dcOverlay.updateVisibility();
      
      // Ensure overlay is still attached to canvas.tokens
      if (token._dcOverlay.parent !== canvas.tokens && canvas.tokens) {
        canvas.tokens.addChild(token._dcOverlay);
      }
      
      // Update resolve button visibility on NPC overlays when any token refreshes
      if (game.user.isGM) {
        const npcTokens = canvas.tokens?.placeables.filter(t => t.actor && isNpc(t.actor)) || [];
        for (const npcToken of npcTokens) {
          if (npcToken._dcOverlay && npcToken._dcOverlay.resolveButton) {
            npcToken._dcOverlay.updateResolveButtonVisibility();
          }
        }
      }
    }
    
    // Update team vitality display text (HUD position is fixed, only text updates)
    updateTeamVitalityDisplay();
  });
  
  // Reposition team vitality display when canvas pans/zooms (world center changes)
  Hooks.on("canvasPan", () => {
    positionTeamVitalityDisplay();
  });
  
  // Re-position all character overlays when a new one is created (for even distribution)
  Hooks.on('updateToken', (tokenDocument, updateData, options, userId) => {
    // If a new overlay was just created, re-position all character overlays
    if (updateData.flags?.['mastery-system']?.divineClashOverlay !== undefined) {
      // Small delay to ensure all overlays are created
      setTimeout(() => {
        canvas.tokens?.placeables.forEach(token => {
          if (token._dcOverlay && !token._dcOverlay.isNpc) {
            token._dcOverlay.updateWorldPosition();
          }
        });
      }, 100);
    }
  });
  
  console.log('Divine Clash | Hooks registered');
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function initializeDivineClashOverlays() {
  registerHooks();
  
  const hostTokens = getHostTokens();
  console.log(`Divine Clash | [DEBUG] Total host tokens selected: ${hostTokens.length}`);
  hostTokens.forEach((token, idx) => {
    console.log(`Divine Clash | [DEBUG] Token ${idx + 1}: name="${token.name}", actorType=${token.actor?.type || 'NO ACTOR'}, actorName=${token.actor?.name || 'NO NAME'}`);
  });
  
  if (hostTokens.length === 0) {
    ui.notifications.warn('Please select at least one host token (non-stone token)');
    return;
  }
  
  // Check for NPCs - only allow one NPC at a time
  const npcTokens = hostTokens.filter(token => token.actor && isNpc(token.actor));
  const characterTokens = hostTokens.filter(token => token.actor && token.actor.type === 'character');
  
  console.log(`Divine Clash | [DEBUG] NPC tokens found: ${npcTokens.length}`);
  console.log(`Divine Clash | [DEBUG] Character tokens found: ${characterTokens.length}`);
  
  if (npcTokens.length > 1) {
    ui.notifications.warn('Please select only one NPC token for Divine Combat');
    return;
  }
  
  // Process ALL selected tokens (both NPCs and characters)
  const tokensToProcess = hostTokens;
  console.log(`Divine Clash | [DEBUG] Processing ${tokensToProcess.length} token(s): ${tokensToProcess.map(t => `${t.name} (${t.actor?.type || 'NO TYPE'})`).join(', ')}`);
  
  for (const hostToken of tokensToProcess) {
    console.log(`Divine Clash | [DEBUG] Processing token: ${hostToken.name} (actor: ${hostToken.actor?.name || 'NO ACTOR'}, type: ${hostToken.actor?.type || 'NO TYPE'})`);
    
    // Check if overlay already exists
    if (hostToken._dcOverlay) {
      console.log(`Divine Clash | [DEBUG] Overlay already exists for ${hostToken.name}, skipping creation`);
      continue;
    }
    
    // Initialize flags if missing or empty
    let flags = hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    const poolCount = (flags?.pool || []).length;
    const attackCount = (flags?.attack || []).length;
    const defenseCount = (flags?.defense || []).length;
    const vitalityCount = (flags?.vitality || []).length;
    const totalStones = poolCount + attackCount + defenseCount;
    
    // Get actor for vitality stone calculation
    const actor = hostToken.actor;
    if (!actor) {
      console.warn(`Divine Clash | Host token ${hostToken.name} has no actor, skipping`);
      continue;
    }
    
    // Always ensure vitality stones exist (at least 1)
    const expectedVitalityCount = getVitalityStoneCount(actor);
    const needsVitalityUpdate = !flags || !flags.vitality || flags.vitality.length === 0 || flags.vitality.length !== expectedVitalityCount;
    
    if (!flags || totalStones === 0 || needsVitalityUpdate) {
      // Check if this is an NPC
      const isNpcActor = isNpc(actor);
      let stoneCount = 0;
      let divineCombatData = null;
      
      if (isNpcActor) {
        // For NPCs: get Divine Combat data
        console.log(`Divine Clash | [DEBUG] Processing NPC: ${actor.name}`);
        divineCombatData = getDivineCombatData(actor);
        if (!divineCombatData) {
          console.warn(`Divine Clash | NPC ${actor.name} has no Divine Combat data configured. Please set Starting Pool, Regeneration, Basis Attack, and Basis Defense in the NPC sheet.`);
          ui.notifications.warn(`${actor.name} has no Divine Combat data configured. Please set values in the NPC sheet.`);
          continue;
        }
        
        stoneCount = divineCombatData.startingPool;
        console.log(`Divine Clash | NPC ${actor.name} has ${stoneCount} starting pool stones (from system.divineCombat.startingPool)`);
        console.log(`Divine Clash | NPC Divine Combat stats: Regeneration=${divineCombatData.regeneration}, Basis Attack=${divineCombatData.basisAttack}, Basis Defense=${divineCombatData.basisDefense}`);
      } else {
        // For characters: get power stone count and vitality stone count
        console.log(`Divine Clash | [DEBUG] Processing Character: ${actor.name}`);
        const system = actor.system || {};
        const stones = system.stones || {};
        console.log(`Divine Clash | [DEBUG] Character ${actor.name} system.stones:`, JSON.stringify(stones));
        stoneCount = getPowerStoneCount(actor);
        const vitalityCount = getVitalityStoneCount(actor);
        console.log(`Divine Clash | Character ${actor.name} has ${stoneCount} power stones and ${vitalityCount} vitality stones (from system.stones)`);
      }
      
      if (stoneCount === 0 && (!isNpcActor || getVitalityStoneCount(hostToken.actor) === 0)) {
        console.warn(`Divine Clash | [DEBUG] ${actor.name} has 0 stones, skipping overlay creation`);
        console.warn(`Divine Clash | [DEBUG] Actor system data:`, JSON.stringify(actor.system || {}, null, 2));
        ui.notifications.warn(`${actor.name} has no stones to display`);
        continue;
      }
      
      // Generate stone IDs (we'll create sprites for these)
      const vitalityStoneIds = [];
      const poolStoneIds = [];
      const attackStoneIds = [];
      const defenseStoneIds = [];
      
      // Generate vitality stone IDs for both Characters and NPCs (always at least 1)
      const vitalityCount = getVitalityStoneCount(actor);
      for (let i = 0; i < vitalityCount; i++) {
        vitalityStoneIds.push(`generated-vitality-${actor.id}-${i}`);
      }
      
      if (isNpcActor && divineCombatData) {
        // For NPCs: distribute stones based on basisAttack and basisDefense
        // Remaining stones go to pool
        const totalStones = divineCombatData.startingPool;
        const attackStones = divineCombatData.basisAttack || 0;
        const defenseStones = divineCombatData.basisDefense || 0;
        const poolStones = Math.max(0, totalStones - attackStones - defenseStones);
        
        console.log(`Divine Clash | [DEBUG] NPC ${actor.name} stone distribution: Pool=${poolStones}, Attack=${attackStones}, Defense=${defenseStones}, Vitality=${vitalityCount} (total=${totalStones})`);
        
        // Generate stone IDs for each zone
        let stoneIndex = 0;
        for (let i = 0; i < poolStones; i++) {
          poolStoneIds.push(`generated-${actor.id}-${stoneIndex++}`);
        }
        for (let i = 0; i < attackStones; i++) {
          attackStoneIds.push(`generated-${actor.id}-${stoneIndex++}`);
        }
        for (let i = 0; i < defenseStones; i++) {
          defenseStoneIds.push(`generated-${actor.id}-${stoneIndex++}`);
        }
      } else {
        // For characters: all stones start in pool
        for (let i = 0; i < stoneCount; i++) {
          poolStoneIds.push(`generated-${actor.id}-${i}`);
        }
      }
      
      flags = {
        vitality: vitalityStoneIds,
        pool: poolStoneIds,
        attack: attackStoneIds,
        defense: defenseStoneIds,
        // Store Divine Combat data for NPCs
        ...(divineCombatData ? {
          divineCombat: {
            regeneration: divineCombatData.regeneration,
            basisAttack: divineCombatData.basisAttack,
            basisDefense: divineCombatData.basisDefense
          }
        } : {})
      };
      
      console.log(`Divine Clash | [DEBUG] Initialized flags for ${actor.name}: vitality=${vitalityStoneIds.length}, pool=${poolStoneIds.length}, attack=${attackStoneIds.length}, defense=${defenseStoneIds.length}`);
      await hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
      
      // Initialize divineClashVitality flag for both NPCs and PCs (vitalityCount already declared above)
      const existingVitality = hostToken.document.getFlag('mastery-system', 'divineClashVitality');
      if (!existingVitality) {
        await hostToken.document.setFlag('mastery-system', 'divineClashVitality', {
          current: vitalityCount,
          max: vitalityCount
        });
        console.log(`Divine Clash | Initialized divineClashVitality for ${hostToken.name}: ${vitalityCount}`);
      }
      
      const totalStones = vitalityStoneIds.length + poolStoneIds.length + attackStoneIds.length + defenseStoneIds.length;
      console.log(`Divine Clash | Initialized ${totalStones} stones for ${hostToken.name} from actor data`);
    } else {
      // Flags exist, but check if vitality stones need to be added/updated
      if (needsVitalityUpdate) {
        console.log(`Divine Clash | Updating vitality stones for ${hostToken.name}: current=${vitalityCount}, expected=${expectedVitalityCount}`);
        
        // Generate vitality stone IDs
        const vitalityStoneIds = [];
        for (let i = 0; i < expectedVitalityCount; i++) {
          vitalityStoneIds.push(`generated-vitality-${actor.id}-${i}`);
        }
        
        // Update flags with vitality stones
        flags.vitality = vitalityStoneIds;
        await hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
        
        console.log(`Divine Clash | Updated vitality stones for ${hostToken.name}: ${vitalityStoneIds.length} stones`);
      } else {
        console.log(`Divine Clash | Using existing flags for ${hostToken.name}: vitality=${vitalityCount}, pool=${poolCount}, attack=${attackCount}, defense=${defenseCount}`);
      }
    }
    
    // Create overlay
    const overlay = new DivineClashOverlay(hostToken);
    await overlay.renderFromFlags();
    
    // Ensure overlay is properly positioned and visible
    overlay.zIndex = 1000;
    overlay.updateWorldPosition();
    overlay.updateVisibility();
    
    // Force a canvas refresh
    if (canvas.tokens && overlay.parent !== canvas.tokens) {
      canvas.tokens.addChild(overlay);
    }
    
    console.log(`Divine Clash | Overlay created for ${hostToken.name}, visible=${overlay.visible}, position=(${overlay.x}, ${overlay.y}), parent=${overlay.parent ? overlay.parent.constructor.name : 'none'}`);
  }
  
  // Re-position all character overlays to ensure even distribution
  setTimeout(() => {
    canvas.tokens?.placeables.forEach(token => {
      if (token._dcOverlay && !token._dcOverlay.isNpc) {
        token._dcOverlay.updateWorldPosition();
      }
    });
    
    // Create and update team vitality display
    createTeamVitalityDisplay();
    updateTeamVitalityDisplay();
  }, 100);
  
  console.log(`Divine Clash | [DEBUG] Processing complete. Processed ${tokensToProcess.length} token(s)`);
  const message = `Divine Clash overlays initialized for ${tokensToProcess.length} token(s)`;
  ui.notifications.info(message);
}

// ============================================================================
// DAMAGE QUEUE & RESOLVE SYSTEM
// ============================================================================

/**
 * Build combatants from join flags (Solo + Groups)
 * Returns array of { id, type:"solo"|"group", members:[Token], repToken:Token }
 */
function buildCombatantsFromJoinFlags(npcToken) {
  // Always return exactly 1 team combatant containing all PCs with overlays
  const allPCTokensWithOverlay = canvas.tokens?.placeables.filter(token => {
    if (!token.actor) return false;
    const actor = token.actor;
    return actor.type === 'character' && token._dcOverlay;
  }) || [];
  
  if (allPCTokensWithOverlay.length === 0) {
    console.log(`Divine Clash | buildCombatantsFromJoinFlags: No PC tokens with overlays found`);
    return [];
  }
  
  const combatant = {
    id: 'team',
    type: 'group',
    members: allPCTokensWithOverlay,
    repToken: allPCTokensWithOverlay[0]
  };
  
  console.log(`Divine Clash | buildCombatantsFromJoinFlags: Returning 1 team combatant with ${allPCTokensWithOverlay.length} member(s)`);
  return [combatant];
}

/**
 * Build damage queue from combatants (sorted by position)
 * Returns { round, order: [combatantId...] }
 */
function buildDamageQueue(combatants, round = 1) {
  // Sort: x ASC, tie y ASC, tie id
  const sorted = [...combatants].sort((a, b) => {
    const aCenter = a.repToken?.center || { x: 0, y: 0 };
    const bCenter = b.repToken?.center || { x: 0, y: 0 };
    
    if (aCenter.x !== bCenter.x) {
      return aCenter.x - bCenter.x;
    }
    if (aCenter.y !== bCenter.y) {
      return aCenter.y - bCenter.y;
    }
    return a.id.localeCompare(b.id);
  });
  
  return {
    round: round,
    order: sorted.map(c => c.id)
  };
}

/**
 * Split damage evenly across targets
 */
function splitEven(totalDamage, targetCount) {
  if (targetCount === 0) return [];
  
  const base = Math.floor(totalDamage / targetCount);
  const remainder = totalDamage % targetCount;
  
  const allocations = [];
  for (let i = 0; i < targetCount; i++) {
    allocations.push(base + (i < remainder ? 1 : 0));
  }
  
  return allocations;
}

/**
 * Draw queue markers on canvas (numbers above repTokens)
 */
let queueMarkerContainer = null;

function drawQueueMarkers(combatants, queue) {
  // Remove old markers
  if (queueMarkerContainer) {
    queueMarkerContainer.destroy();
    queueMarkerContainer = null;
  }
  
  if (!canvas.interface) {
    console.warn('Divine Clash | canvas.interface not available');
    return;
  }
  
  // Create container
  queueMarkerContainer = new PIXI.Container();
  queueMarkerContainer.name = 'divineClashQueueMarkers';
  queueMarkerContainer.zIndex = 10000;
  canvas.interface.addChild(queueMarkerContainer);
  
  // Create markers for each combatant in queue order
  queue.order.forEach((combatantId, index) => {
    const combatant = combatants.find(c => c.id === combatantId);
    if (!combatant || !combatant.repToken) return;
    
    const position = combatant.repToken.center;
    const screenPos = worldToScreen(position.x, position.y - 50); // 50px above token
    
    const marker = new PIXI.Text(`${index + 1}`, {
      fontFamily: 'Signika',
      fontSize: 32,
      fill: 0xFFFF00, // Yellow
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4
    });
    marker.anchor.set(0.5);
    marker.x = screenPos.x;
    marker.y = screenPos.y;
    
    queueMarkerContainer.addChild(marker);
  });
  
  console.log(`Divine Clash | Drew ${queue.order.length} queue markers`);
}

/**
 * Check if all participating PCs are ready
 */
async function areAllPCsReady(npcToken) {
  const combatants = buildCombatantsFromJoinFlags(npcToken);
  
  console.log(`Divine Clash | areAllPCsReady: Found ${combatants.length} combatant(s) from flags`);
  
  if (combatants.length === 0) {
    // Fallback: check all PC tokens with overlays directly
    const allPCTokens = canvas.tokens?.placeables.filter(token => {
      if (!token.actor) return false;
      const actor = token.actor;
      return actor.type === 'character' && token._dcOverlay;
    }) || [];
    
    console.log(`Divine Clash | areAllPCsReady: Fallback - checking ${allPCTokens.length} PC token(s) with overlays`);
    
    if (allPCTokens.length === 0) {
      return false; // No PCs at all
    }
    
    for (const token of allPCTokens) {
      const ready = await token.document.getFlag('mastery-system', 'divineClashReady');
      console.log(`Divine Clash | areAllPCsReady: ${token.name} ready=${ready}`);
      if (!ready) {
        return false;
      }
    }
    
    return true;
  }
  
  for (const combatant of combatants) {
    for (const member of combatant.members) {
      const ready = await member.document.getFlag('mastery-system', 'divineClashReady');
      console.log(`Divine Clash | areAllPCsReady: ${member.name} ready=${ready}`);
      if (!ready) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Draw damage queue if all PCs are ready (GM only)
 */
async function drawDamageQueueIfReady(npcToken) {
  if (!game.user.isGM) {
    ui.notifications.warn('Only GM can draw damage queue');
    return;
  }
  
  const allReady = await areAllPCsReady(npcToken);
  if (!allReady) {
    ui.notifications.warn('Not all PCs are ready!');
    return;
  }
  
  const combatants = buildCombatantsFromJoinFlags(npcToken);
  if (combatants.length === 0) {
    ui.notifications.warn('No participating combatants found');
    return;
  }
  
  // Get current round from NPC flags or default to 1
  const npcFlags = npcToken.document.getFlag('mastery-system', 'divineClashOverlay');
  const currentRound = npcFlags?.currentRound || 1;
  
  const queue = buildDamageQueue(combatants, currentRound);
  
  // Save queue to NPC token
  await npcToken.document.setFlag('mastery-system', 'divineClashQueue', queue);
  
  // Draw markers
  drawQueueMarkers(combatants, queue);
  
  ui.notifications.info(`Damage queue drawn for round ${currentRound}: ${queue.order.length} combatants`);
  console.log('Divine Clash | Damage queue:', queue);
}

/**
 * Resolve round damage (GM only)
 */
async function resolveRoundIfReady(npcToken) {
  if (!game.user.isGM) {
    ui.notifications.warn('Only GM can resolve rounds');
    return;
  }
  
  const allReady = await areAllPCsReady(npcToken);
  if (!allReady) {
    ui.notifications.warn('Not all PCs are ready!');
    return;
  }
  
  // Check if queue exists, if not draw it
  let queue = npcToken.document.getFlag('mastery-system', 'divineClashQueue');
  if (!queue) {
    await drawDamageQueueIfReady(npcToken);
    queue = npcToken.document.getFlag('mastery-system', 'divineClashQueue');
    if (!queue) {
      ui.notifications.error('Failed to create damage queue');
      return;
    }
  }
  
  const combatants = buildCombatantsFromJoinFlags(npcToken);
  const combatantMap = new Map(combatants.map(c => [c.id, c]));
  
  // Get NPC values
  const npcFlagsResolve = npcToken.document.getFlag('mastery-system', 'divineClashOverlay');
  const npcAttackStones = (npcFlagsResolve?.attack || []).length;
  const npcDefenseStones = (npcFlagsResolve?.defense || []).length;
  
  // Get NPC divine combat data
  const npcActor = npcToken.actor;
  const npcDivineCombat = npcActor?.system?.divineCombat || {};
  const npcBasisAttack = npcDivineCombat.basisAttack || 0;
  const npcBasisDefense = npcDivineCombat.basisDefense || 0;
  
  const npcAttack = npcAttackStones + npcBasisAttack;
  const npcDefense = npcDefenseStones + npcBasisDefense;
  
  // Get NPC vitality
  let npcVitality = npcToken.document.getFlag('mastery-system', 'divineClashVitality');
  if (!npcVitality) {
    const npcVitalityCount = getVitalityStoneCount(npcActor);
    npcVitality = { current: npcVitalityCount, max: npcVitalityCount };
    await npcToken.document.setFlag('mastery-system', 'divineClashVitality', npcVitality);
  }
  
  // Build combatant order from queue
  const orderedCombatants = queue.order.map(id => combatantMap.get(id)).filter(c => c);
  
  // Calculate PC combatant stats
  const combatantStats = new Map();
  for (const combatant of orderedCombatants) {
    let attackTotal = 0;
    let defenseTotal = 0;
    
    for (const member of combatant.members) {
      const memberFlags = member.document.getFlag('mastery-system', 'divineClashOverlay');
      if (memberFlags) {
        attackTotal += (memberFlags.attack || []).length;
        defenseTotal += (memberFlags.defense || []).length;
      }
    }
    
    combatantStats.set(combatant.id, { attackTotal, defenseTotal });
  }
  
  // Build vitality before snapshot (BEFORE damage is applied)
  const vitalityBefore = {};
  for (const combatant of orderedCombatants) {
    if (combatant.type === 'solo') {
      const vitality = combatant.members[0].document.getFlag('mastery-system', 'divineClashVitality');
      vitalityBefore[combatant.id] = vitality?.current || 0;
    } else {
      // Group: sum of members
      let total = 0;
      for (const member of combatant.members) {
        const vitality = member.document.getFlag('mastery-system', 'divineClashVitality');
        total += vitality?.current || 0;
      }
      vitalityBefore[combatant.id] = total;
    }
  }
  const npcVitalityBefore = npcVitality.current;
  
  // NPC -> PCs damage
  const npcSplit = {};
  const npcToPcDamage = {};
  const livingTargets = orderedCombatants.filter(c => {
    // Check if combatant is defeated
    if (c.type === 'solo') {
      const vitality = c.members[0].document.getFlag('mastery-system', 'divineClashVitality');
      return !vitality || vitality.current > 0;
    } else {
      // Group: check if any member is alive
      return c.members.some(m => {
        const vitality = m.document.getFlag('mastery-system', 'divineClashVitality');
        return !vitality || vitality.current > 0;
      });
    }
  });
  
  if (livingTargets.length > 0) {
    const allocations = splitEven(npcAttack, livingTargets.length);
    
    for (let index = 0; index < livingTargets.length; index++) {
      const target = livingTargets[index];
      const allocated = allocations[index];
      npcSplit[target.id] = allocated;
      
      const stats = combatantStats.get(target.id);
      const defenseRemain = stats.defenseTotal;
      const blockedByDefense = Math.min(allocated, defenseRemain);
      const dmg = allocated - blockedByDefense;
      
      npcToPcDamage[target.id] = dmg;
      
      // Log NPC -> PC damage per target
      const targetName = target.type === 'solo' ? target.members[0].name : target.members.map(m => m.name).join(', ');
      console.log(`Divine Clash | NPC -> ${targetName}: allocated=${allocated}, blockedByDefense=${blockedByDefense}, dmg=${dmg}`);
      
      // Apply damage to combatant
      if (target.type === 'solo') {
        let vitality = target.members[0].document.getFlag('mastery-system', 'divineClashVitality');
        if (!vitality) {
          const vitalityCount = getVitalityStoneCount(target.members[0].actor);
          vitality = { current: vitalityCount, max: vitalityCount };
        }
        vitality.current = Math.max(0, vitality.current - dmg);
        await target.members[0].document.setFlag('mastery-system', 'divineClashVitality', vitality);
        
        if (vitality.current <= 0) {
          console.log(`Divine Clash | ${target.members[0].name} defeated!`);
        }
      } else {
        // Group: shared vitality pool
        let groupVitality = 0;
        let groupMax = 0;
        
        for (const member of target.members) {
          let memberVitality = member.document.getFlag('mastery-system', 'divineClashVitality');
          if (!memberVitality) {
            const vitalityCount = getVitalityStoneCount(member.actor);
            memberVitality = { current: vitalityCount, max: vitalityCount };
            await member.document.setFlag('mastery-system', 'divineClashVitality', memberVitality);
          }
          groupVitality += memberVitality.current;
          groupMax += memberVitality.max;
        }
        
        groupVitality = Math.max(0, groupVitality - dmg);
        
        // Distribute remaining vitality proportionally
        if (groupMax > 0) {
          for (const member of target.members) {
            let memberVitality = member.document.getFlag('mastery-system', 'divineClashVitality');
            const proportion = memberVitality.max / groupMax;
            memberVitality.current = Math.max(0, Math.floor(groupVitality * proportion));
            await member.document.setFlag('mastery-system', 'divineClashVitality', memberVitality);
          }
        }
        
        if (groupVitality <= 0) {
          console.log(`Divine Clash | Group ${target.id} defeated!`);
        }
      }
    }
  }
  
  // Get NPC Armor (per hit, not consumed)
  const npcCombatFlags = npcToken.document.getFlag('mastery-system', 'divineClashCombat');
  const npcOverlayFlags = npcToken.document.getFlag('mastery-system', 'divineClashOverlay');
  const npcArmor = npcCombatFlags?.armor ?? npcOverlayFlags?.divineCombat?.armor ?? 0;
  
  // PCs -> NPC damage
  let npcDefenseRemain = npcDefense; // NPC Defense is NOT scaled, it's a pool per round
  let pcToNpcDamageTotal = 0;
  const pcToNpcDamageLog = []; // Log per combatant: {allocAttack, armorBlocked, defBlocked, dmg}
  
  // Sort by attack total ASC (option 2: "wenig Attack zuerst")
  const sortedByAttack = [...orderedCombatants].sort((a, b) => {
    const aStats = combatantStats.get(a.id);
    const bStats = combatantStats.get(b.id);
    if (aStats.attackTotal !== bStats.attackTotal) {
      return aStats.attackTotal - bStats.attackTotal;
    }
    // Tie: use queue order
    const aIndex = queue.order.indexOf(a.id);
    const bIndex = queue.order.indexOf(b.id);
    return aIndex - bIndex;
  });
  
  // Apply damage to NPC with armor per hit
  for (const combatant of sortedByAttack) {
    const stats = combatantStats.get(combatant.id);
    const allocAttack = stats.attackTotal;
    
    let remaining = allocAttack;
    
    // Step 1: Armor blocks (per hit, not consumed)
    const armorBlocked = Math.min(npcArmor, remaining);
    remaining -= armorBlocked;
    
    // Step 2: Defense blocks (consumed from pool)
    const defBlocked = Math.min(npcDefenseRemain, remaining);
    npcDefenseRemain -= defBlocked;
    remaining -= defBlocked;
    
    // Step 3: Remaining is damage
    const dmg = Math.max(0, remaining);
    
    // Log this combatant's damage breakdown
    pcToNpcDamageLog.push({
      combatantId: combatant.id,
      combatantName: combatant.type === 'solo' ? combatant.members[0].name : combatant.members.map(m => m.name).join(', '),
      allocAttack,
      armorBlocked,
      defBlocked,
      dmg
    });
    
    if (dmg > 0) {
      pcToNpcDamageTotal += dmg;
      npcVitality.current = Math.max(0, npcVitality.current - dmg);
    }
  }
  
  // Log damage breakdown
  console.log('Divine Clash | PC -> NPC Damage Breakdown:', {
    npcDefenseTotal: npcDefense,
    npcArmor,
    npcDefenseRemain,
    totalDamage: pcToNpcDamageTotal,
    perCombatant: pcToNpcDamageLog
  });
  
  // Save NPC vitality
  await npcToken.document.setFlag('mastery-system', 'divineClashVitality', npcVitality);
  
  // Build vitality after snapshot
  const vitalityAfter = {};
  for (const combatant of orderedCombatants) {
    if (combatant.type === 'solo') {
      const vitality = combatant.members[0].document.getFlag('mastery-system', 'divineClashVitality');
      vitalityAfter[combatant.id] = vitality?.current || 0;
    } else {
      // Group: sum of members
      let total = 0;
      for (const member of combatant.members) {
        const vitality = member.document.getFlag('mastery-system', 'divineClashVitality');
        total += vitality?.current || 0;
      }
      vitalityAfter[combatant.id] = total;
    }
  }
  vitalityAfter['npc'] = npcVitality.current;
  
  // Build initiative order with attack stones and totals
  const initiativeOrder = sortedByAttack.map(combatant => {
    const stats = combatantStats.get(combatant.id);
    let name = '';
    let tokenId = '';
    if (combatant.type === 'solo') {
      name = combatant.members[0].name;
      tokenId = combatant.members[0].id;
    } else {
      name = combatant.members.map(m => m.name).join(', ');
      tokenId = combatant.members[0].id; // Use first member's token ID
    }
    
    // Get attack stones count
    let attackStones = 0;
    for (const member of combatant.members) {
      const memberFlags = member.document.getFlag('mastery-system', 'divineClashOverlay');
      if (memberFlags) {
        attackStones += (memberFlags.attack || []).length;
      }
    }
    
    return {
      tokenId,
      name,
      attackStones,
      attackTotal: stats.attackTotal
    };
  });
  
  // Build PC to NPC damage per actor (use logged damage breakdown)
  const pcToNpcPerActor = pcToNpcDamageLog
    .filter(log => log.dmg > 0)
    .map(log => {
      const combatant = orderedCombatants.find(c => c.id === log.combatantId);
      let tokenId = '';
      if (combatant) {
        if (combatant.type === 'solo') {
          tokenId = combatant.members[0].id;
        } else {
          tokenId = combatant.members[0].id;
        }
      }
      
      return {
        tokenId,
        name: log.combatantName,
        attackTotal: log.allocAttack,
        damageContributed: log.dmg,
        armorBlocked: log.armorBlocked,
        defBlocked: log.defBlocked
      };
    });
  
  // Build NPC to PC distribution
  const npcToPcDistribution = Object.entries(npcToPcDamage).map(([targetId, damage]) => {
    const target = combatantMap.get(targetId);
    if (!target) return null;
    
    let targetName = '';
    let targetTokenId = '';
    if (target.type === 'solo') {
      targetName = target.members[0].name;
      targetTokenId = target.members[0].id;
    } else {
      targetName = target.members.map(m => m.name).join(', ');
      targetTokenId = target.members[0].id;
    }
    
    return {
      targetTokenId,
      targetName,
      damage
    };
  }).filter(d => d !== null);
  
  // Build groups array
  const groups = orderedCombatants.filter(c => c.type === 'group').map(combatant => {
    const members = combatant.members.map(member => ({
      tokenId: member.id,
      name: member.name
    }));
    
    return {
      groupId: combatant.id,
      members,
      vitalityBefore: vitalityBefore[combatant.id] || 0,
      vitalityAfter: vitalityAfter[combatant.id] || 0
    };
  });
  
  // Log round with extended structure
  const roundLog = {
    roundNumber: queue.round,
    timestamp: Date.now(),
    npc: {
      tokenId: npcToken.id,
      name: npcToken.name,
      attackTotal: npcAttack,
      defenseTotal: npcDefense,
      vitalityBefore: npcVitalityBefore,
      vitalityAfter: npcVitality.current
    },
    groups,
    initiativeOrder,
    pcToNpc: {
      totalAttack: sortedByAttack.reduce((sum, c) => sum + combatantStats.get(c.id).attackTotal, 0),
      npcDefenseTotal: npcDefense,
      npcDefenseApplied: npcDefense - npcDefenseRemain,
      npcArmor: npcArmor,
      damageToNpcVitality: pcToNpcDamageTotal,
      perActor: pcToNpcPerActor
    },
    npcToPc: {
      totalNpcAttack: npcAttack,
      distribution: npcToPcDistribution
    },
    // Legacy fields for backwards compatibility
    round: queue.round,
    queueOrder: queue.order,
    npcSplit: npcSplit,
    pcToNpcDamageTotal: pcToNpcDamageTotal,
    npcToPcDamage: npcToPcDamage,
    vitalityAfter: vitalityAfter
  };
  
  let roundLogs = npcToken.document.getFlag('mastery-system', 'divineClashRoundLog') || [];
  roundLogs.push(roundLog);
  await npcToken.document.setFlag('mastery-system', 'divineClashRoundLog', roundLogs);
  
  // Remove attack and defense stones (they are spent) and apply regeneration
  for (const combatant of combatants) {
    for (const member of combatant.members) {
      const memberFlags = member.document.getFlag('mastery-system', 'divineClashOverlay');
      if (memberFlags) {
        // Remove attack and defense stones (they are spent, not returned to pool)
        memberFlags.attack = [];
        memberFlags.defense = [];
        
        // Apply regeneration to pool
        const actor = member.actor;
        if (actor && actor.type === 'character') {
          // Characters: regenerate up to mastery rank, but max is starting pool
          const masteryRank = getMasteryRank(actor);
          const startingPool = getPowerStoneCount(actor); // Starting pool is max power stones
          const poolStones = memberFlags.pool || [];
          const currentPoolCount = poolStones.length;
          
          // Regenerate up to mastery rank, but don't exceed starting pool
          const newPoolCount = Math.min(currentPoolCount + masteryRank, startingPool);
          
          // Generate new pool stone IDs
          const poolStoneIds = [];
          for (let i = 0; i < newPoolCount; i++) {
            poolStoneIds.push(`generated-pool-${actor.id}-${i}`);
          }
          
          memberFlags.pool = poolStoneIds;
          console.log(`Divine Clash | Character ${member.name}: Regenerated ${newPoolCount - currentPoolCount} stones (${currentPoolCount} -> ${newPoolCount}, max: ${startingPool}, mastery rank: ${masteryRank})`);
        } else if (actor && isNpc(actor)) {
          // NPCs: regenerate up to regeneration value, but max is starting pool
          const divineCombat = actor.system?.divineCombat || {};
          const regeneration = divineCombat.regeneration || 0;
          const startingPool = divineCombat.startingPool || 0;
          
          const poolStones = memberFlags.pool || [];
          const currentPoolCount = poolStones.length;
          
          // Regenerate up to regeneration value, but don't exceed starting pool
          const newPoolCount = Math.min(currentPoolCount + regeneration, startingPool);
          
          // Generate new pool stone IDs
          const poolStoneIds = [];
          for (let i = 0; i < newPoolCount; i++) {
            poolStoneIds.push(`generated-pool-${actor.id}-${i}`);
          }
          
          memberFlags.pool = poolStoneIds;
          console.log(`Divine Clash | NPC ${member.name}: Regenerated ${newPoolCount - currentPoolCount} stones (${currentPoolCount} -> ${newPoolCount}, max: ${startingPool}, regeneration: ${regeneration})`);
        }
        
        await member.document.setFlag('mastery-system', 'divineClashOverlay', memberFlags);
      }
      
      // Clear ready flag
      await member.document.setFlag('mastery-system', 'divineClashReady', false);
      
      // Update overlay to reflect new vitality and stone positions
      if (member._dcOverlay) {
        await member._dcOverlay.renderFromFlags();
      }
    }
  }
  
  // Remove NPC stones from attack and defense (they are spent) and apply regeneration
  const npcFlagsAfter = npcToken.document.getFlag('mastery-system', 'divineClashOverlay');
  if (npcFlagsAfter) {
    // Remove attack and defense stones (they are spent)
    npcFlagsAfter.attack = [];
    npcFlagsAfter.defense = [];
    
    // Apply regeneration to NPC pool
    const npcActor = npcToken.actor;
    if (npcActor && isNpc(npcActor)) {
      const divineCombat = npcActor.system?.divineCombat || {};
      const regeneration = divineCombat.regeneration || 0;
      
      const poolStones = npcFlagsAfter.pool || [];
      const currentPoolCount = poolStones.length;
      
      // Get maximum stone count for NPC (startingPool is the max for NPCs)
      const maxPoolStones = divineCombat.startingPool || 0;
      
      // Add regeneration, but don't exceed maximum
      const newPoolCount = Math.min(currentPoolCount + regeneration, maxPoolStones);
      
      // Generate new pool stone IDs (always regenerate, even if regeneration is 0, to ensure pool is correct)
      const poolStoneIds = [];
      for (let i = 0; i < newPoolCount; i++) {
        poolStoneIds.push(`generated-pool-${npcActor.id}-${i}`);
      }
      
      npcFlagsAfter.pool = poolStoneIds;
      if (regeneration > 0) {
        console.log(`Divine Clash | NPC ${npcToken.name}: Regenerated ${newPoolCount - currentPoolCount} stones (${currentPoolCount} -> ${newPoolCount}, max: ${maxPoolStones})`);
      } else {
        console.log(`Divine Clash | NPC ${npcToken.name}: Pool remains at ${newPoolCount} stones (no regeneration, max: ${maxPoolStones})`);
      }
    }
    
    await npcToken.document.setFlag('mastery-system', 'divineClashOverlay', npcFlagsAfter);
  }
  
  // Update NPC overlay to reflect new vitality and stone positions
  if (npcToken._dcOverlay) {
    await npcToken._dcOverlay.renderFromFlags();
  }
  
  // Remove queue markers
  if (queueMarkerContainer) {
    queueMarkerContainer.destroy();
    queueMarkerContainer = null;
  }
  
  // Build damage summary
  const damageSummary = [];
  for (const [combatantId, dmg] of Object.entries(npcToPcDamage)) {
    const combatant = combatantMap.get(combatantId);
    if (combatant && combatant.type === 'solo') {
      damageSummary.push(`${combatant.members[0].name}: ${dmg} damage`);
    }
  }
  
  ui.notifications.info(`Round ${queue.round} resolved!\nNPC took ${pcToNpcDamageTotal} damage.\nPCs: ${damageSummary.join(', ')}`);
  console.log('Divine Clash | Round resolved:', roundLog);
  
  // Post resolve chat and animations (only GM posts chat, but all clients can animate)
  if (game.user.isGM) {
    await postResolveChat(roundLog, { npcToken });
    if (ENABLE_GM_DEBUG_LOG) {
      await postGMDebugChat(roundLog, { npcToken });
    }
  }
  
  // Trigger animation on all clients via flag update
  // The animation will be triggered by the Hook when the flag is updated
  // We need to update the flag again to trigger the hook (it's already set above, so we update with a small delay)
  if (ENABLE_RESOLVE_ANIMATIONS) {
    // Small delay to ensure flag is saved first
    setTimeout(() => {
      playResolveAnimation(roundLog);
    }, 100);
  }
  
  return roundLog;
}

// ============================================================================
// RESET FUNCTION
// ============================================================================

/**
 * Reset all Divine Clash data to initial state
 * Resets vitality, stones, flags, and reinitializes overlays
 */
async function resetDivineClash() {
  if (!game.user.isGM) {
    ui.notifications.warn('Only GM can reset Divine Clash');
    return;
  }
  
  const confirmed = await Dialog.confirm({
    title: 'Reset Divine Clash',
    content: '<p>Are you sure you want to reset all Divine Clash data?</p><p>This will:</p><ul><li>Reset all vitality to original values</li><li>Reset all stones to pool</li><li>Clear all flags (ready, queue, round logs)</li><li>Reinitialize all overlays</li></ul>',
    yes: () => true,
    no: () => false,
    defaultYes: false
  });
  
  if (!confirmed) {
    return;
  }
  
  ui.notifications.info('Resetting Divine Clash...');
  
  // Get all tokens with overlays
  const allTokens = canvas.tokens?.placeables.filter(token => token._dcOverlay) || [];
  
  // Reset each token
  for (const token of allTokens) {
    const actor = token.actor;
    if (!actor) continue;
    
    // Clear all Divine Clash flags
    await token.document.unsetFlag('mastery-system', 'divineClashOverlay');
    await token.document.unsetFlag('mastery-system', 'divineClashReady');
    await token.document.unsetFlag('mastery-system', 'divineClashVitality');
    await token.document.unsetFlag('mastery-system', 'divineClashParticipation');
    
    // Destroy existing overlay
    if (token._dcOverlay) {
      token._dcOverlay.destroyOverlay();
      delete token._dcOverlay;
    }
  }
  
  // Clear NPC-specific flags
  const npcTokens = canvas.tokens?.placeables.filter(t => t.actor && isNpc(t.actor)) || [];
  for (const npcToken of npcTokens) {
    await npcToken.document.unsetFlag('mastery-system', 'divineClashQueue');
    await npcToken.document.unsetFlag('mastery-system', 'divineClashRoundLog');
  }
  
  // Remove queue markers if they exist
  if (queueMarkerContainer) {
    queueMarkerContainer.destroy();
    queueMarkerContainer = null;
  }
  
  // Destroy team vitality display
  const teamVitalityDisplay = document.getElementById('dc-team-vitality');
  if (teamVitalityDisplay && teamVitalityDisplay.parentNode) {
    teamVitalityDisplay.parentNode.removeChild(teamVitalityDisplay);
  }
  
  // Reinitialize all overlays
  await initializeDivineClashOverlays();
  
  ui.notifications.info('Divine Clash reset complete! All tokens restored to initial state.');
  console.log('Divine Clash | Reset complete');
}

// ============================================================================
// EXPOSE GM FUNCTIONS
// ============================================================================

// Make functions available globally for GM buttons
if (game.user.isGM) {
  window.divineClashDrawQueue = async function() {
    const npcTokens = canvas.tokens?.placeables.filter(t => t.actor && isNpc(t.actor)) || [];
    if (npcTokens.length === 0) {
      ui.notifications.warn('No NPC tokens found');
      return;
    }
    if (npcTokens.length > 1) {
      ui.notifications.warn('Multiple NPCs found, using first one');
    }
    await drawDamageQueueIfReady(npcTokens[0]);
  };
  
  window.divineClashResolve = async function() {
    const npcTokens = canvas.tokens?.placeables.filter(t => t.actor && isNpc(t.actor)) || [];
    if (npcTokens.length === 0) {
      ui.notifications.warn('No NPC tokens found');
      return;
    }
    if (npcTokens.length > 1) {
      ui.notifications.warn('Multiple NPCs found, using first one');
    }
    await resolveRoundIfReady(npcTokens[0]);
  };
  
  window.divineClashReset = async function() {
    await resetDivineClash();
  };
  
  console.log('Divine Clash | GM functions available: window.divineClashDrawQueue(), window.divineClashResolve(), and window.divineClashReset()');
}

// ============================================================================
// RESOLVE PHASE: CHAT AND ANIMATIONS
// ============================================================================

/**
 * Post resolve chat message to all players
 */
async function postResolveChat(roundLog, { npcToken }) {
  if (!game.user.isGM) return;
  
  const roundNumber = roundLog.roundNumber || roundLog.round;
  
  // Build HTML content
  let html = `<div class="divine-clash-resolve" style="border: 2px solid #8B4513; border-radius: 8px; padding: 12px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #e0e0e0; font-family: 'Signika', sans-serif;">
    <h3 style="margin: 0 0 12px 0; color: #FFD700; text-align: center; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      ⚔️ Divine Clash — Resolve Runde ${roundNumber} ⚔️
    </h3>`;
  
  // Initiative Order
  if (roundLog.initiativeOrder && roundLog.initiativeOrder.length > 0) {
    html += `<div style="margin-bottom: 12px;">
      <strong style="color: #FFA500; font-size: 14px;">Initiative Order:</strong>
      <ul style="margin: 6px 0; padding-left: 20px; list-style-type: none;">`;
    roundLog.initiativeOrder.forEach((entry, index) => {
      html += `<li style="margin: 4px 0; padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
        ${index + 1}. <strong>${entry.name}</strong>: ${entry.attackStones} Steine → ${entry.attackTotal} Attack
      </li>`;
    });
    html += `</ul></div>`;
  }
  
  // PC → NPC Damage
  if (roundLog.pcToNpc) {
    html += `<div style="margin-bottom: 12px; padding: 8px; background: rgba(0,255,0,0.1); border-left: 3px solid #00FF00; border-radius: 4px;">
      <strong style="color: #00FF00; font-size: 14px;">PC → NPC:</strong><br>
      Total Attack: <strong>${roundLog.pcToNpc.totalAttack}</strong> 
      minus NPC Defense: <strong>${roundLog.pcToNpc.npcDefenseApplied}</strong> 
      = <strong style="color: #FF6B6B; font-size: 16px;">${roundLog.pcToNpc.damageToNpcVitality} Damage</strong>`;
    if (roundLog.pcToNpc.perActor && roundLog.pcToNpc.perActor.length > 0) {
      html += `<div style="margin-top: 6px; font-size: 12px; color: #B0B0B0;">`;
      roundLog.pcToNpc.perActor.forEach(actor => {
        html += `• ${actor.name}: ${actor.attackTotal} Attack → ${actor.damageContributed} Damage<br>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  }
  
  // NPC → PC Damage
  if (roundLog.npcToPc && roundLog.npcToPc.distribution && roundLog.npcToPc.distribution.length > 0) {
    html += `<div style="margin-bottom: 12px; padding: 8px; background: rgba(255,0,0,0.1); border-left: 3px solid #FF0000; border-radius: 4px;">
      <strong style="color: #FF0000; font-size: 14px;">NPC → PC:</strong> (Total Attack: ${roundLog.npcToPc.totalNpcAttack})
      <ul style="margin: 6px 0; padding-left: 20px; list-style-type: none;">`;
    roundLog.npcToPc.distribution.forEach(dist => {
      html += `<li style="margin: 4px 0; padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
        <strong>${dist.targetName}</strong>: <span style="color: #FF6B6B;">${dist.damage} Damage</span>
      </li>`;
    });
    html += `</ul></div>`;
  }
  
  // Vitality After
  html += `<div style="margin-top: 12px; padding: 8px; background: rgba(255,215,0,0.1); border-left: 3px solid #FFD700; border-radius: 4px;">
    <strong style="color: #FFD700; font-size: 14px;">Vitality nach Resolve:</strong><br>`;
  
  // NPC Vitality
  if (roundLog.npc) {
    html += `<div style="margin-top: 6px;">
      <strong>${roundLog.npc.name}</strong>: ${roundLog.npc.vitalityAfter} / ${roundLog.npc.vitalityBefore} Vitality
    </div>`;
  }
  
  // PC Vitality
  if (roundLog.groups && roundLog.groups.length > 0) {
    roundLog.groups.forEach(group => {
      html += `<div style="margin-top: 6px;">
        <strong>${group.members.map(m => m.name).join(', ')}</strong>: ${group.vitalityAfter} / ${group.vitalityBefore} Vitality
      </div>`;
    });
  }
  
  // Solo combatants (not in groups) - get from initiative order or vitalityAfter
  if (roundLog.vitalityAfter) {
    for (const [combatantId, vitality] of Object.entries(roundLog.vitalityAfter)) {
      if (combatantId !== 'npc' && !roundLog.groups?.some(g => g.groupId === combatantId)) {
        // Try to find name from initiative order
        const initiativeEntry = roundLog.initiativeOrder?.find(e => {
          // We need to match by token ID, but we only have combatantId
          // For now, just show the vitality value
          return true;
        });
        const name = initiativeEntry?.name || `Combatant ${combatantId}`;
        html += `<div style="margin-top: 6px;">
          <strong>${name}</strong>: ${vitality} Vitality
        </div>`;
      }
    }
  }
  
  html += `</div></div>`;
  
  // Create chat message
  const speaker = ChatMessage.getSpeaker({ token: npcToken });
  await ChatMessage.create({
    content: html,
    speaker: speaker,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  console.log('Divine Clash | Posted resolve chat message');
}

/**
 * Post GM-only debug chat whisper
 */
async function postGMDebugChat(roundLog, { npcToken }) {
  if (!game.user.isGM) return;
  
  const recipients = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
  if (recipients.length === 0) return;
  
  let debugHtml = `<div class="divine-clash-debug" style="border: 1px solid #666; border-radius: 4px; padding: 8px; background: #1a1a1a; color: #aaa; font-family: monospace; font-size: 11px;">
    <strong style="color: #888;">[DEBUG] Round Log:</strong><br>
    <pre style="margin: 4px 0; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(roundLog, null, 2)}</pre>
  </div>`;
  
  const speaker = ChatMessage.getSpeaker({ token: npcToken });
  await ChatMessage.create({
    content: debugHtml,
    speaker: speaker,
    whisper: recipients,
    type: CONST.CHAT_MESSAGE_TYPES.WHISPER
  });
  
  console.log('Divine Clash | Posted GM debug whisper');
}

/**
 * Play resolve animations on canvas
 */
async function playResolveAnimation(roundLog) {
  if (!ENABLE_RESOLVE_ANIMATIONS) return;
  
  // Check if this animation was already played (prevent duplicates)
  const animationKey = `resolve-${roundLog.roundNumber || roundLog.round}-${roundLog.timestamp}`;
  if (playedAnimations.has(animationKey)) {
    return;
  }
  playedAnimations.add(animationKey);
  
  // Clean up old animations (keep only last 10)
  if (playedAnimations.size > 10) {
    const entries = Array.from(playedAnimations);
    entries.slice(0, entries.length - 10).forEach(key => playedAnimations.delete(key));
  }
  
  // Create animation container
  const animationContainer = new PIXI.Container();
  animationContainer.zIndex = 10000; // Very high z-index
  canvas.interface.addChild(animationContainer);
  
  // Animation sequence
  const animations = [];
  
  // 1. Pulse animations for initiative order (PCs attacking NPC)
  if (roundLog.initiativeOrder && roundLog.pcToNpc && roundLog.pcToNpc.perActor) {
    const npcToken = canvas.tokens?.placeables.find(t => t.id === roundLog.npc?.tokenId);
    if (npcToken) {
      roundLog.pcToNpc.perActor.forEach((actor, index) => {
        const delay = index * 200; // Stagger animations
        animations.push(
          new Promise(resolve => {
            setTimeout(() => {
              // Pulse on NPC token
              pulseToken(npcToken, animationContainer, ANIMATION_PULSE_DURATION, 0xFF6B6B);
              
              // Float damage text over NPC
              if (actor.damageContributed > 0) {
                floatDamageText(npcToken, actor.damageContributed, animationContainer, ANIMATION_FLOAT_DURATION, 0xFF6B6B);
              }
              
              resolve();
            }, delay);
          })
        );
      });
    }
  }
  
  // 2. Pulse and float animations for NPC → PC damage
  if (roundLog.npcToPc && roundLog.npcToPc.distribution) {
    roundLog.npcToPc.distribution.forEach((dist, index) => {
      const delay = (roundLog.pcToNpc?.perActor?.length || 0) * 200 + index * 200;
      animations.push(
        new Promise(resolve => {
          setTimeout(() => {
            const targetToken = canvas.tokens?.placeables.find(t => t.id === dist.targetTokenId);
            if (targetToken) {
              // Pulse on target token
              pulseToken(targetToken, animationContainer, ANIMATION_PULSE_DURATION, 0xFF0000);
              
              // Float damage text
              if (dist.damage > 0) {
                floatDamageText(targetToken, dist.damage, animationContainer, ANIMATION_FLOAT_DURATION, 0xFF0000);
              }
            }
            resolve();
          }, delay);
        })
      );
    });
  }
  
  // Wait for all animations to complete, then cleanup
  await Promise.all(animations);
  
  // Remove container after all animations
  setTimeout(() => {
    if (animationContainer && animationContainer.parent) {
      animationContainer.destroy({ children: true });
    }
  }, Math.max(ANIMATION_PULSE_DURATION, ANIMATION_FLOAT_DURATION) + 500);
}

/**
 * Pulse animation on a token
 */
function pulseToken(token, container, duration, color) {
  if (!token || !container) return;
  
  const center = token.center;
  const pulse = new PIXI.Graphics();
  pulse.lineStyle(3, color, 1.0);
  pulse.drawCircle(0, 0, token.w / 2);
  pulse.x = center.x;
  pulse.y = center.y;
  pulse.alpha = 0.8;
  container.addChild(pulse);
  
  // Animate
  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Scale and fade
    const scale = 1 + (ANIMATION_PULSE_SCALE - 1) * (1 - Math.abs(progress * 2 - 1));
    pulse.scale.set(scale);
    pulse.alpha = 0.8 * (1 - progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if (pulse.parent) {
        pulse.destroy();
      }
    }
  };
  
  animate();
}

/**
 * Float damage text animation
 */
function floatDamageText(token, damage, container, duration, color) {
  if (!token || !container) return;
  
  const center = token.center;
  const text = new PIXI.Text(`-${damage}`, {
    fontFamily: 'Signika',
    fontSize: 32,
    fill: color,
    fontWeight: 'bold',
    stroke: 0x000000,
    strokeThickness: 4,
    align: 'center'
  });
  text.anchor.set(0.5);
  text.x = center.x;
  text.y = center.y - token.h / 2 - 20;
  text.alpha = 1.0;
  container.addChild(text);
  
  // Animate
  const startTime = Date.now();
  const startY = text.y;
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Move up and fade
    text.y = startY - (ANIMATION_FLOAT_DISTANCE * progress);
    text.alpha = 1 - progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if (text.parent) {
        text.destroy();
      }
    }
  };
  
  animate();
}

// Register Hook for animation trigger on flag update
Hooks.on('updateToken', async (tokenDocument, updateData, options, userId) => {
  if (!ENABLE_RESOLVE_ANIMATIONS) return;
  
  // Check if divineClashRoundLog was updated
  if (updateData.flags?.['mastery-system']?.divineClashRoundLog) {
    const roundLogs = tokenDocument.getFlag('mastery-system', 'divineClashRoundLog') || [];
    if (roundLogs.length > 0) {
      const latestRoundLog = roundLogs[roundLogs.length - 1];
      // Only play if this is a new round log (has timestamp)
      if (latestRoundLog.timestamp && !playedAnimations.has(`resolve-${latestRoundLog.roundNumber || latestRoundLog.round}-${latestRoundLog.timestamp}`)) {
        playResolveAnimation(latestRoundLog);
      }
    }
  }
});

// ============================================================================
// RUN MACRO
// ============================================================================

initializeDivineClashOverlays();

