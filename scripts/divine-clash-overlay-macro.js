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
const POOL_COLOR = 0x00FF00; // Green
const ATTACK_COLOR = 0xFF0000; // Red
const DEFENSE_COLOR = 0x0000FF; // Blue
const HOVER_ALPHA = 0.3;
const STONE_SPRITE_SIZE = 60;
const BUTTON_SIZE = 30;
const BUTTON_MARGIN = 5;
const READY_BUTTON_WIDTH = 120;
const READY_BUTTON_HEIGHT = 40;

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
    basisDefense: divineCombat.basisDefense || 0
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
// DIVINE CLASH OVERLAY CLASS
// ============================================================================

class DivineClashOverlay extends PIXI.Container {
  constructor(hostToken) {
    super();
    this.hostToken = hostToken;
    this.zones = {}; // { pool: Graphics, attack: Graphics, defense: Graphics }
    this.zoneLabels = {}; // { pool: Text, attack: Text, defense: Text }
    this.stoneSprites = new Map(); // stoneTokenId -> Sprite
    this.draggingSprite = null;
    this.dragOffset = { x: 0, y: 0 };
    this.hoveredZone = null;
    this.readyButton = null; // Ready button above pool
    this.poolButtons = null; // GM-only pool management buttons
    this.endRoundButton = null; // GM-only end round button
    
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
   * Update overlay position in canvas world coordinates based on host token position
   */
  updateWorldPosition() {
    if (!this.hostToken) {
      console.warn('Divine Clash | updateWorldPosition: hostToken is null');
      return;
    }
    
    // Get token position from document or mesh
    const tokenDoc = this.hostToken.document;
    const tokenX = tokenDoc.x || this.hostToken.x || 0;
    const tokenY = tokenDoc.y || this.hostToken.y || 0;
    const tokenW = tokenDoc.width || this.hostToken.w || 1;
    const tokenH = tokenDoc.height || this.hostToken.h || 1;
    
    // Calculate token center and bottom in canvas coordinates
    const tokenCenterX = tokenX + (tokenW * canvas.grid.size) / 2;
    const tokenBottomY = tokenY + (tokenH * canvas.grid.size);
    
    // Calculate world position: token center X + offset X, token bottom Y + offset Y
    this.x = tokenCenterX + OVERLAY_OFFSET_X;
    this.y = tokenBottomY + OVERLAY_OFFSET_Y;
    
    console.log(`Divine Clash | Updated overlay position for ${this.hostToken.name}: x=${this.x}, y=${this.y} (token: ${tokenX}, ${tokenY})`);
  }
  
  /**
   * Draw the three zones
   */
  drawZones() {
    // Remove only zone graphics and labels, not stone sprites
    const toRemove = [];
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (child === this.zones.pool || child === this.zones.attack || child === this.zones.defense ||
          child === this.zoneLabels.pool || child === this.zoneLabels.attack || child === this.zoneLabels.defense) {
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
    
    const poolZone = new PIXI.Graphics();
    drawRoundedRect(poolZone, 0, 0, POOL_WIDTH, ZONE_HEIGHT, 8, POOL_COLOR, ZONE_FILL_ALPHA, POOL_COLOR, ZONE_STROKE_WIDTH);
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
    poolLabel.x = 10;
    poolLabel.y = 10;
    this.zoneLabels.pool = poolLabel;
    this.addChild(poolLabel);
    
    // GM-only pool management buttons (+ and -)
    if (game.user.isGM) {
      const poolPlusBtn = this.createPoolButton('+', POOL_COLOR, POOL_WIDTH - BUTTON_SIZE * 2 - BUTTON_MARGIN * 2, 10, 'add');
      const poolMinusBtn = this.createPoolButton('-', POOL_COLOR, POOL_WIDTH - BUTTON_SIZE - BUTTON_MARGIN, 10, 'remove');
      this.addChild(poolPlusBtn);
      this.addChild(poolMinusBtn);
      this.poolButtons = { plus: poolPlusBtn, minus: poolMinusBtn };
    }
    
    // Ready button - always visible, positioned above the pool zone
    this.readyButton = this.createReadyButton();
    this.addChild(this.readyButton);
    
    // GM-only End Round button (next to Ready button)
    if (game.user.isGM) {
      this.endRoundButton = this.createEndRoundButton();
      this.addChild(this.endRoundButton);
    }
    
    // Attack zone (left)
    const attackZone = new PIXI.Graphics();
    drawRoundedRect(attackZone, POOL_WIDTH + ZONE_SPACING, 0, ATTACK_DEFENSE_WIDTH, ZONE_HEIGHT, 8, ATTACK_COLOR, ZONE_FILL_ALPHA, ATTACK_COLOR, ZONE_STROKE_WIDTH);
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
    attackLabel.x = POOL_WIDTH + ZONE_SPACING + 10;
    attackLabel.y = 10;
    this.zoneLabels.attack = attackLabel;
    this.addChild(attackLabel);
    
    // Attack zone buttons (+ and -) - positioned next to the label
    const labelWidth = attackLabel.width || 80; // Approximate label width
    const attackPlusBtn = this.createZoneButton('+', ATTACK_COLOR, POOL_WIDTH + ZONE_SPACING + 10 + labelWidth + 5, 10, 'attack', 'add');
    const attackMinusBtn = this.createZoneButton('-', ATTACK_COLOR, POOL_WIDTH + ZONE_SPACING + 10 + labelWidth + 5 + BUTTON_SIZE + 2, 10, 'attack', 'remove');
    this.addChild(attackPlusBtn);
    this.addChild(attackMinusBtn);
    
    // Defense zone (right)
    const defenseZone = new PIXI.Graphics();
    const defenseX = POOL_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH + ZONE_SPACING;
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
    for (const [zoneId, zone] of Object.entries(this.zones)) {
      // Get zone bounds manually (zones are drawn at specific positions)
      let zoneX, zoneY, zoneWidth, zoneHeight;
      if (zoneId === 'pool') {
        zoneX = 0;
        zoneY = 0;
        zoneWidth = POOL_WIDTH;
        zoneHeight = ZONE_HEIGHT;
      } else if (zoneId === 'attack') {
        zoneX = POOL_WIDTH + ZONE_SPACING;
        zoneY = 0;
        zoneWidth = ATTACK_DEFENSE_WIDTH;
        zoneHeight = ZONE_HEIGHT;
      } else if (zoneId === 'defense') {
        zoneX = POOL_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH + ZONE_SPACING;
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
    
    // Get zone position and size (zones are drawn at specific positions)
    let zoneX, zoneY, zoneWidth, zoneHeight;
    if (zoneId === 'pool') {
      zoneX = 0;
      zoneY = 0;
      zoneWidth = POOL_WIDTH;
      zoneHeight = ZONE_HEIGHT;
    } else if (zoneId === 'attack') {
      zoneX = POOL_WIDTH + ZONE_SPACING;
      zoneY = 0;
      zoneWidth = ATTACK_DEFENSE_WIDTH;
      zoneHeight = ZONE_HEIGHT;
    } else if (zoneId === 'defense') {
      zoneX = POOL_WIDTH + ZONE_SPACING + ATTACK_DEFENSE_WIDTH + ZONE_SPACING;
      zoneY = 0;
      zoneWidth = ATTACK_DEFENSE_WIDTH;
      zoneHeight = ZONE_HEIGHT;
    } else {
      return;
    }
    
    const padding = 10;
    const labelHeight = 30; // Space reserved for labels at the top
    const cols = zoneId === 'pool' ? 6 : 3;
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
    
    // Get all stone IDs
    const allStoneIds = [
      ...(flags.pool || []),
      ...(flags.attack || []),
      ...(flags.defense || [])
    ];
    
    console.log(`Divine Clash | Rendering ${allStoneIds.length} stones for ${this.hostToken.name}: pool=${(flags.pool || []).length}, attack=${(flags.attack || []).length}, defense=${(flags.defense || []).length}`);
    
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
    
    // Layout each zone
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
    
    // Ready button is always visible and clickable
    // Update world position in case token moved
    this.updateWorldPosition();
    
    // Ensure overlay is visible
    this.visible = true;
    this.alpha = 1.0;
    
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
    
    // Position above pool zone, centered
    button.x = (POOL_WIDTH - READY_BUTTON_WIDTH) / 2;
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
    
    // Add click handler
    button.on('pointerdown', (e) => {
      e.stopPropagation();
      this.handleReadyClick();
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
    const flags = this.hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    if (!flags) return;
    
    const poolStones = flags.pool || [];
    const attackStones = flags.attack || [];
    const defenseStones = flags.defense || [];
    
    // Mark as ready (can be clicked anytime, even if stones remain in pool)
    console.log(`Divine Clash | ${this.hostToken.name} is ready!`, {
      pool: poolStones.length,
      attack: attackStones.length,
      defense: defenseStones.length
    });
    
    ui.notifications.info(`${this.hostToken.name} is ready! (Pool: ${poolStones.length}, Attack: ${attackStones.length}, Defense: ${defenseStones.length})`);
    
    // Set a ready flag on the token
    await this.hostToken.document.setFlag('mastery-system', 'divineClashReady', true);
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
    
    // Position next to Ready button (to the right)
    button.x = (POOL_WIDTH - READY_BUTTON_WIDTH) / 2 + READY_BUTTON_WIDTH + 10;
    button.y = -READY_BUTTON_HEIGHT - 10; // Same height as Ready button
    button.zIndex = 30; // Above sprites
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.visible = game.user.isGM; // Only visible to GM
    
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
    
    // Optional: Reset stones for next round (move all back to pool)
    // Uncomment if you want to reset after each round:
    // flags.pool = [...poolStones, ...attackStones, ...defenseStones];
    // flags.attack = [];
    // flags.defense = [];
    
    await this.hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
    
    // Re-render if stones were reset
    // if (flags.attack.length === 0 && flags.defense.length === 0) {
    //   this.renderFromFlags();
    // }
    
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
  });
  
  // Update overlay position when token refreshes or moves
  Hooks.on('refreshToken', (token) => {
    if (token._dcOverlay) {
      // Update world position (overlay is attached to canvas.tokens, not token.mesh)
      token._dcOverlay.updateWorldPosition();
      
      // Ensure overlay is still attached to canvas.tokens
      if (token._dcOverlay.parent !== canvas.tokens && canvas.tokens) {
        canvas.tokens.addChild(token._dcOverlay);
      }
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
  if (hostTokens.length === 0) {
    ui.notifications.warn('Please select at least one host token (non-stone token)');
    return;
  }
  
  // Check for NPCs - only allow one NPC at a time
  const npcTokens = hostTokens.filter(token => token.actor && isNpc(token.actor));
  if (npcTokens.length > 1) {
    ui.notifications.warn('Please select only one NPC token for Divine Combat');
    return;
  }
  
  // If there's an NPC, process only that one
  const tokensToProcess = npcTokens.length > 0 ? npcTokens : hostTokens;
  
  for (const hostToken of tokensToProcess) {
    // Check if overlay already exists
    if (hostToken._dcOverlay) {
      console.log(`Divine Clash | Overlay already exists for ${hostToken.name}`);
      continue;
    }
    
    // Initialize flags if missing or empty
    let flags = hostToken.document.getFlag('mastery-system', 'divineClashOverlay');
    const poolCount = (flags?.pool || []).length;
    const attackCount = (flags?.attack || []).length;
    const defenseCount = (flags?.defense || []).length;
    const totalStones = poolCount + attackCount + defenseCount;
    
    if (!flags || totalStones === 0) {
      // Get actor
      const actor = hostToken.actor;
      if (!actor) {
        console.warn(`Divine Clash | Host token ${hostToken.name} has no actor, skipping`);
        continue;
      }
      
      // Check if this is an NPC
      const isNpcActor = isNpc(actor);
      let stoneCount = 0;
      let divineCombatData = null;
      
      if (isNpcActor) {
        // For NPCs: get Divine Combat data
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
        // For characters: get power stone count
        stoneCount = getPowerStoneCount(actor);
        console.log(`Divine Clash | Character ${actor.name} has ${stoneCount} power stones (from system.stones)`);
      }
      
      if (stoneCount === 0) {
        console.warn(`Divine Clash | ${actor.name} has 0 stones, skipping overlay creation`);
        ui.notifications.warn(`${actor.name} has no stones to display`);
        continue;
      }
      
      // Generate stone IDs (we'll create sprites for these)
      const stoneIds = [];
      for (let i = 0; i < stoneCount; i++) {
        stoneIds.push(`generated-${actor.id}-${i}`);
      }
      
      flags = {
        pool: stoneIds,
        attack: [],
        defense: [],
        // Store Divine Combat data for NPCs
        ...(divineCombatData ? {
          divineCombat: {
            regeneration: divineCombatData.regeneration,
            basisAttack: divineCombatData.basisAttack,
            basisDefense: divineCombatData.basisDefense
          }
        } : {})
      };
      await hostToken.document.setFlag('mastery-system', 'divineClashOverlay', flags);
      
      console.log(`Divine Clash | Initialized ${stoneIds.length} stones for ${hostToken.name} from actor data`);
    } else {
      console.log(`Divine Clash | Using existing flags for ${hostToken.name}: pool=${poolCount}, attack=${attackCount}, defense=${defenseCount}`);
    }
    
    // Create overlay
    const overlay = new DivineClashOverlay(hostToken);
    await overlay.renderFromFlags();
    
    // Ensure overlay is visible and properly positioned
    overlay.visible = true;
    overlay.alpha = 1.0;
    overlay.zIndex = 1000;
    overlay.updateWorldPosition();
    
    // Force a canvas refresh
    if (canvas.tokens && overlay.parent !== canvas.tokens) {
      canvas.tokens.addChild(overlay);
    }
    
    console.log(`Divine Clash | Overlay created for ${hostToken.name}, visible=${overlay.visible}, position=(${overlay.x}, ${overlay.y}), parent=${overlay.parent ? overlay.parent.constructor.name : 'none'}`);
  }
  
  const message = npcTokens.length > 0 
    ? `Divine Clash overlay initialized for NPC: ${npcTokens[0].name}`
    : `Divine Clash overlays initialized for ${tokensToProcess.length} token(s)`;
  ui.notifications.info(message);
}

// ============================================================================
// RUN MACRO
// ============================================================================

initializeDivineClashOverlays();
