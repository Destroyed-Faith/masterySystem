/**
 * Divine Clash Manager
 * Handles automation for the Divine Clash board system
 */

import type { DivineClashPhase, StoneKind, StoneState, DivineClashSeat, DivineClashSceneFlags, DivineClashTokenFlags, RegionInfo } from './divine-clash-types.js';

/**
 * Get Divine Clash scene (by ID or name)
 */
function getDivineClashScene(): Scene | null {
  const sceneId = (game as any).settings.get('mastery-system', 'divineClashSceneId') as string;
  
  if (sceneId && sceneId.trim() !== '') {
    const scene = (game as any).scenes?.get(sceneId);
    if (scene) return scene;
  }
  
  // Fallback: find by name
  const scenes = (game as any).scenes || [];
  const scene = scenes.find((s: Scene) => s.name === 'Divine Clash');
  return scene || null;
}

/**
 * Get scene flags for Divine Clash
 */
function getSceneFlags(scene: Scene): DivineClashSceneFlags {
  const flags = scene.getFlag('mastery-system', 'divineClash') as DivineClashSceneFlags | undefined;
  return flags || {
    phase: 'planning',
    seats: {},
    started: false
  };
}

/**
 * Update scene flags
 */
async function updateSceneFlags(scene: Scene, updates: Partial<DivineClashSceneFlags>): Promise<void> {
  const current = getSceneFlags(scene);
  const merged = {
    ...current,
    ...updates,
    seats: { ...current.seats, ...(updates.seats || {}) }
  };
  await scene.setFlag('mastery-system', 'divineClash', merged);
}

/**
 * Find region by name pattern
 */
function findRegion(scene: Scene, namePattern: string): RegionInfo | null {
  console.log(`Mastery System | [FIND REGION] Looking for region: "${namePattern}"`);
  // In Foundry V13, regions are placeables on the canvas
  let regions: any[] = [];
  
  // Try canvas.regions.placeables first (V13 API)
  if (canvas?.regions?.placeables) {
    regions = Array.from(canvas.regions.placeables.values());
    console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via canvas.regions.placeables`);
  } else {
    // Fallback: try scene.regions collection
    if ((scene as any).regions) {
      if ((scene as any).regions instanceof Map || (scene as any).regions.size !== undefined) {
        regions = Array.from((scene as any).regions.values());
        console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via scene.regions (Collection)`);
      } else if (Array.isArray((scene as any).regions)) {
        regions = (scene as any).regions;
        console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via scene.regions (Array)`);
      }
    }
  }
  
  if (regions.length === 0) {
    console.warn(`Mastery System | [FIND REGION] No regions found in any expected location`);
    return null;
  }
  
  console.log(`Mastery System | [FIND REGION] Available region names:`, regions.map((r: any) => {
    const name = r.document?.name || r.name || r.document?.label || r.label || r.document?.id || r.id || 'unnamed';
    return name;
  }));
  
  for (const region of regions) {
    // In V13, region name is in region.document.name
    const regionName = region.document?.name || region.name || region.document?.label || region.label || region.document?.id || region.id || '';
    console.log(`Mastery System | [FIND REGION] Checking region "${regionName}" against pattern "${namePattern}"`);
    
    if (regionName === namePattern || regionName.includes(namePattern)) {
      // Extract bounds from region
      // In V13, bounds are in region.bounds or region.document.shape
      let x = 0, y = 0, width = 100, height = 100;
      
      // Try region.bounds first (PIXI Rectangle)
      if (region.bounds) {
        x = region.bounds.x;
        y = region.bounds.y;
        width = region.bounds.width;
        height = region.bounds.height;
        console.log(`Mastery System | [FIND REGION] Using region.bounds:`, { x, y, width, height });
      } 
      // Try region.document.shape
      else if (region.document?.shape) {
        const shape = region.document.shape;
        if (shape.x !== undefined && shape.y !== undefined) {
          x = shape.x;
          y = shape.y;
          width = shape.width || 100;
          height = shape.height || 100;
          console.log(`Mastery System | [FIND REGION] Using region.document.shape (x/y):`, { x, y, width, height });
        } else if (shape.x1 !== undefined && shape.y1 !== undefined) {
          x = shape.x1;
          y = shape.y1;
          width = (shape.x2 || shape.x1 + 100) - shape.x1;
          height = (shape.y2 || shape.y1 + 100) - shape.y1;
          console.log(`Mastery System | [FIND REGION] Using region.document.shape (x1/y1):`, { x, y, width, height });
        } else if (shape.center) {
          x = shape.center.x - (shape.radius || 50);
          y = shape.center.y - (shape.radius || 50);
          width = (shape.radius || 50) * 2;
          height = (shape.radius || 50) * 2;
          console.log(`Mastery System | [FIND REGION] Using region.document.shape (center):`, { x, y, width, height });
        }
      }
      // Try region.shape (legacy)
      else if (region.shape) {
        const shape = region.shape;
        if (shape.x !== undefined && shape.y !== undefined) {
          x = shape.x;
          y = shape.y;
          width = shape.width || 100;
          height = shape.height || 100;
        } else if (shape.x1 !== undefined && shape.y1 !== undefined) {
          x = shape.x1;
          y = shape.y1;
          width = (shape.x2 || shape.x1 + 100) - shape.x1;
          height = (shape.y2 || shape.y1 + 100) - shape.y1;
        }
      }
      // Try region.document.x/y (direct properties)
      else if (region.document?.x !== undefined && region.document?.y !== undefined) {
        x = region.document.x;
        y = region.document.y;
        width = region.document.width || 100;
        height = region.document.height || 100;
        console.log(`Mastery System | [FIND REGION] Using region.document.x/y:`, { x, y, width, height });
      }
      
      const result = {
        id: region.document?.id || region.id || region._id || '',
        name: regionName,
        x,
        y,
        width,
        height
      };
      console.log(`Mastery System | [FIND REGION] Match found!`, result);
      return result;
    }
  }
  
  console.warn(`Mastery System | [FIND REGION] No match found for pattern "${namePattern}"`);
  return null;
}

/**
 * Get random point inside a region (snapped to grid)
 */
function getRandomPointInRegion(region: RegionInfo): { x: number; y: number } {
  const grid = canvas.grid;
  const gridSize = grid?.size || 100;
  
  // Random point within region bounds
  const x = region.x + Math.random() * region.width;
  const y = region.y + Math.random() * region.height;
  
  // Snap to grid
  const snappedX = Math.floor(x / gridSize) * gridSize + gridSize / 2;
  const snappedY = Math.floor(y / gridSize) * gridSize + gridSize / 2;
  
  return { x: snappedX, y: snappedY };
}

/**
 * Check if a point is inside a region
 */
function isPointInRegion(point: { x: number; y: number }, region: RegionInfo): boolean {
  return point.x >= region.x &&
         point.x <= region.x + region.width &&
         point.y >= region.y &&
         point.y <= region.y + region.height;
}

/**
 * Get region name for a seat and zone
 */
function getRegionName(seatIndex: number, zone: string): string {
  return `DC_SEAT_${seatIndex}_${zone}`;
}

/**
 * Find which zone a token is in (by checking regions)
 */
function getTokenZone(scene: Scene, token: Token, seatIndex: number): StoneState | null {
  const tokenCenter = token.center;
  
  const zones: StoneState[] = ['ready', 'attack', 'defense', 'exhausted', 'vitality', 'burned'];
  for (const zone of zones) {
    const regionName = getRegionName(seatIndex, zone.toUpperCase());
    const region = findRegion(scene, regionName);
    if (region && isPointInRegion(tokenCenter, region)) {
      return zone;
    }
  }
  
  return null;
}

/**
 * Ensure player stone actor exists (one per user, per kind)
 * First tries to find existing stone actors, then creates new ones if needed
 */
async function ensurePlayerStoneActor(user: User, kind: StoneKind): Promise<Actor | null> {
  const actorName = `DC Stone (${kind === 'power' ? 'Power' : 'Vitality'}) - ${user.name}`;
  const kindName = kind === 'power' ? 'Power' : 'Vitality';
  
  console.log(`Mastery System | [ENSURE STONE ACTOR] Looking for ${kindName} stone actor for user ${user.name}`);
  
  // Strategy 0: Check for configured base stone actor (global basisstein)
  const baseActorId = kind === 'power'
    ? (game as any).settings.get('mastery-system', 'divineClashBasePowerStoneActorId')
    : (game as any).settings.get('mastery-system', 'divineClashBaseVitalityStoneActorId');
  
  if (baseActorId && baseActorId.trim() !== '') {
    const baseActor = (game as any).actors?.get(baseActorId);
    if (baseActor) {
      console.log(`Mastery System | [ENSURE STONE ACTOR] Using configured base stone actor: ${(baseActor as any).name} (${baseActorId})`);
      // Ensure user has OWNER permission (so they can move their stone tokens)
      const currentOwnership = (baseActor as any).ownership || {};
      const userPermission = currentOwnership[user.id] || CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
      if (userPermission < CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
        const newOwnership = { ...currentOwnership, [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await baseActor.update({ ownership: newOwnership });
        console.log(`Mastery System | [ENSURE STONE ACTOR] Granted OWNER permission to user ${user.name}`);
      }
      return baseActor;
    } else {
      console.warn(`Mastery System | [ENSURE STONE ACTOR] Configured base stone actor ID ${baseActorId} not found, falling back to per-user actors`);
    }
  }
  
  // Strategy 1: Check for exact name match
  let existing = (game as any).actors?.find((a: Actor) => {
    const name = (a as any).name;
    const type = (a as any).type;
    return name === actorName && type === 'npc';
  });
  
  if (existing) {
    console.log(`Mastery System | [ENSURE STONE ACTOR] Found exact match: ${(existing as any).name}`);
    // Ensure ownership
    const ownership: Record<string, number> = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    await existing.update({ ownership });
    return existing;
  }
  
  // Strategy 2: Find any stone actor owned by this user that matches the kind
  const allActors = (game as any).actors || [];
  const userOwnedActors = allActors.filter((a: Actor) => {
    const hasOwnership = (a as any).testUserPermission?.(user, 'OWNER') || 
                         (a as any).ownership?.[user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    return hasOwnership && (a as any).type === 'npc';
  });
  
  console.log(`Mastery System | [ENSURE STONE ACTOR] Found ${userOwnedActors.length} NPC actors owned by ${user.name}`);
  
  // Look for actors with stone-related names
  const stoneKeywords = kind === 'power' 
    ? ['power', 'stone', 'dc stone']
    : ['vitality', 'stone', 'dc stone'];
  
  existing = userOwnedActors.find((a: Actor) => {
    const name = ((a as any).name || '').toLowerCase();
    return stoneKeywords.some(keyword => name.includes(keyword)) &&
           (kind === 'power' ? !name.includes('vitality') : name.includes('vitality'));
  });
  
  if (existing) {
    console.log(`Mastery System | [ENSURE STONE ACTOR] Found existing stone actor by name pattern: ${(existing as any).name}`);
    // Ensure ownership
    const ownership: Record<string, number> = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    await existing.update({ ownership });
    return existing;
  }
  
  // Strategy 3: If user has exactly one stone actor of the right kind, use it
  // (This handles cases where the user has manually created stone actors)
  const stoneActors = userOwnedActors.filter((a: Actor) => {
    const name = ((a as any).name || '').toLowerCase();
    return name.includes('stone');
  });
  
  if (stoneActors.length === 1 && kind === 'power') {
    // If only one stone actor exists and we need power, use it
    console.log(`Mastery System | [ENSURE STONE ACTOR] Using single existing stone actor: ${(stoneActors[0] as any).name}`);
    const ownership: Record<string, number> = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    await stoneActors[0].update({ ownership });
    return stoneActors[0];
  }
  
  // Strategy 4: Create new actor if none found
  console.log(`Mastery System | [ENSURE STONE ACTOR] No existing stone actor found, creating new one: ${actorName}`);
  const actorData: any = {
    name: actorName,
    type: 'npc',
    ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    img: kind === 'power' 
      ? ((game as any).settings.get('mastery-system', 'divineClashPowerStoneImg') || 'systems/mastery-system/icons/svg/power-stone.svg')
      : ((game as any).settings.get('mastery-system', 'divineClashVitalityStoneImg') || 'systems/mastery-system/icons/svg/vitality-stone.svg')
  };
  
  try {
    const actor = await Actor.create(actorData);
    console.log(`Mastery System | [ENSURE STONE ACTOR] Created new stone actor: ${actorName}`);
    return actor;
  } catch (error) {
    console.error(`Mastery System | [ENSURE STONE ACTOR] Failed to create stone actor: ${actorName}`, error);
    return null;
  }
}

/**
 * Check if an image path is a valid non-placeholder image
 */
function isValidImage(img: string | undefined | null): boolean {
  if (!img || img.trim() === '') return false;
  // Check for common placeholder patterns (but allow default SVG files as they are valid images)
  const placeholderPatterns = [
    'placeholder',
    'default-',
    'mystery-man', // Foundry default placeholder
    'icons/svg/mystery-man.svg'
  ];
  const imgLower = img.toLowerCase();
  // Only reject if it's clearly a placeholder, not a valid default image
  return !placeholderPatterns.some(pattern => imgLower.includes(pattern));
}

/**
 * Clean up existing stones for a seat before spawning new ones
 */
async function cleanupExistingStonesForSeat(scene: Scene, seatIndex: number): Promise<void> {
  const tokens = scene.tokens || [];
  const tokensToDelete: string[] = [];
  
  for (const token of tokens) {
    const tokenFlags = (token as any).document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
    if (tokenFlags?.isStone && tokenFlags.seatIndex === seatIndex) {
      tokensToDelete.push((token as any).id);
    }
  }
  
  if (tokensToDelete.length > 0) {
    console.log(`Mastery System | [CLEANUP STONES] Removing ${tokensToDelete.length} existing stone(s) for seat ${seatIndex}`);
    await scene.deleteEmbeddedDocuments('Token', tokensToDelete);
  }
}

/**
 * Spawn stone tokens for a seat
 */
async function spawnStonesForSeat(
  scene: Scene,
  seatIndex: number,
  actor: Actor,
  user: User | null,
  powerStoneCount: number,
  vitalityStoneCount: number
): Promise<void> {
  console.log(`Mastery System | [SPAWN STONES] Starting for seat ${seatIndex}:`, {
    powerCount: powerStoneCount,
    vitalityCount: vitalityStoneCount,
    hasUser: !!user,
    userId: user?.id
  });
  
  // Clean up existing stones for this seat first
  await cleanupExistingStonesForSeat(scene, seatIndex);
  
  const seatRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
  if (!seatRegion) {
    console.error(`Mastery System | [SPAWN STONES] Seat ${seatIndex} READY region not found - cannot spawn stones`);
    return;
  }
  console.log(`Mastery System | [SPAWN STONES] Found READY region for seat ${seatIndex}:`, seatRegion);
  
  // Spawn power stones
  if (powerStoneCount > 0 && user) {
    console.log(`Mastery System | [SPAWN STONES] Spawning ${powerStoneCount} power stones for user ${user.name}`);
    const stoneActor = await ensurePlayerStoneActor(user, 'power');
    if (stoneActor) {
      console.log(`Mastery System | [SPAWN STONES] Stone actor found/created:`, {
        id: (stoneActor as any).id,
        name: (stoneActor as any).name,
        img: (stoneActor as any).img,
        hasImg: !!(stoneActor as any).img
      });
      // Get image from settings first (if set and not empty), then actor, then default
      // Settings image always takes precedence if explicitly configured
      const settingsImg = (game as any).settings.get('mastery-system', 'divineClashPowerStoneImg');
      const actorImg = (stoneActor as any).img;
      const defaultImg = 'systems/mastery-system/icons/svg/power-stone.svg';
      
      // Debug: Check all image sources
      console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Power stone image sources:`, {
        settingsImg: settingsImg || '(not set)',
        settingsImgTrimmed: settingsImg ? settingsImg.trim() : '(not set)',
        settingsImgIsValid: settingsImg && settingsImg.trim() !== '',
        actorImg: actorImg || '(not set)',
        actorImgIsValid: actorImg ? isValidImage(actorImg) : false,
        defaultImg: defaultImg
      });
      
      // Prefer settings image if it's set (even if it's the default path), otherwise use actor image if valid, otherwise default
      let powerStoneImg: string;
      if (settingsImg && settingsImg.trim() !== '') {
        powerStoneImg = settingsImg;
        console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Using SETTINGS image: ${powerStoneImg}`);
      } else if (actorImg && isValidImage(actorImg)) {
        powerStoneImg = actorImg;
        console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Using ACTOR image: ${powerStoneImg}`);
      } else {
        powerStoneImg = defaultImg;
        console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Using DEFAULT image: ${powerStoneImg}`);
      }
      
      console.log(`Mastery System | [SPAWN STONES] Power stone image resolution:`, {
        actorImg: actorImg || '(none)',
        settingsImg: settingsImg || '(none)',
        defaultImg: defaultImg,
        finalImg: powerStoneImg,
        decision: settingsImg && settingsImg.trim() !== '' ? 'settings' : (actorImg && isValidImage(actorImg) ? 'actor' : 'default')
      });
      
      for (let i = 0; i < powerStoneCount; i++) {
        const pos = getRandomPointInRegion(seatRegion);
        const tokenData: any = {
          name: `Power Stone ${i + 1}`,
          actorId: (stoneActor as any).id,
          img: powerStoneImg, // Explicitly set image for unlinked tokens
          x: pos.x,
          y: pos.y,
          flags: {
            'mastery-system': {
              divineClash: {
                isStone: true,
                stoneKind: 'power',
                seatIndex,
                seatUserId: user.id,
                state: 'ready'
              } as DivineClashTokenFlags
            }
          },
          actorLink: false,
          disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
          locked: false
        };
        
        console.log(`Mastery System | [SPAWN STONES] Creating power stone ${i + 1}/${powerStoneCount} with tokenData:`, {
          name: tokenData.name,
          actorId: tokenData.actorId,
          img: tokenData.img,
          imgSource: 'from stoneActor or settings',
          position: { x: tokenData.x, y: tokenData.y },
          actorLink: tokenData.actorLink
        });
        
        try {
          const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
          const createdToken = created[0];
          if (createdToken) {
            const tokenDoc = (createdToken as any).document || createdToken;
            const createdImg = tokenDoc?.img || (createdToken as any).img;
            
            console.log(`Mastery System | [SPAWN STONES] Created power stone ${i + 1}/${powerStoneCount}:`, {
              id: createdToken.id,
              name: (createdToken as any).name,
              position: { x: (createdToken as any).x || tokenDoc?.x, y: (createdToken as any).y || tokenDoc?.y },
              imgInData: tokenData.img,
              imgInDocument: createdImg,
              imgMatch: tokenData.img === createdImg,
              actorLink: tokenDoc?.actorLink
            });
            
            // Force update image if it doesn't match (Foundry sometimes uses actor image even with actorLink: false)
            if (tokenDoc && createdImg !== powerStoneImg) {
              console.log(`Mastery System | [SPAWN STONES] [IMAGE FIX] Token image mismatch, updating from "${createdImg}" to "${powerStoneImg}"`);
              await tokenDoc.update({ img: powerStoneImg });
              console.log(`Mastery System | [SPAWN STONES] [IMAGE FIX] Image updated successfully`);
            }
          } else {
            console.error(`Mastery System | [SPAWN STONES] Created array is empty for power stone ${i + 1}`);
          }
        } catch (error) {
          console.error(`Mastery System | [SPAWN STONES] Failed to spawn power stone ${i + 1}:`, error);
        }
      }
    } else {
      console.error(`Mastery System | [SPAWN STONES] Failed to get/create stone actor for user ${user.name}`);
    }
  } else {
    console.log(`Mastery System | [SPAWN STONES] Skipping power stones:`, {
      powerCount: powerStoneCount,
      hasUser: !!user
    });
  }
  
  // Spawn vitality stones
  if (vitalityStoneCount > 0) {
    console.log(`Mastery System | [SPAWN STONES] Spawning ${vitalityStoneCount} vitality stones`);
    const stoneActor = user 
      ? await ensurePlayerStoneActor(user, 'vitality')
      : null; // For enemy, we'll use a default actor or create one
    
    if (stoneActor || !user) {
      const vitalityRegion = findRegion(scene, getRegionName(seatIndex, 'VITALITY'));
      if (vitalityRegion) {
        console.log(`Mastery System | [SPAWN STONES] Found VITALITY region for seat ${seatIndex}:`, vitalityRegion);
        // Get image from settings first (if set and not empty), then stone actor, then character actor, then default
        // Settings image always takes precedence if explicitly configured
        const settingsImg = (game as any).settings.get('mastery-system', 'divineClashVitalityStoneImg');
        const stoneActorImg = (stoneActor as any)?.img;
        const actorImg = (actor as any).img;
        const defaultImg = 'systems/mastery-system/icons/svg/vitality-stone.svg';
        
        // Debug: Check all image sources
        console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Vitality stone image sources:`, {
          settingsImg: settingsImg || '(not set)',
          settingsImgTrimmed: settingsImg ? settingsImg.trim() : '(not set)',
          settingsImgIsValid: settingsImg && settingsImg.trim() !== '',
          stoneActorImg: stoneActorImg || '(not set)',
          stoneActorImgIsValid: stoneActorImg ? isValidImage(stoneActorImg) : false,
          actorImg: actorImg || '(not set)',
          actorImgIsValid: actorImg ? isValidImage(actorImg) : false,
          defaultImg: defaultImg
        });
        
        // Prefer settings image if it's set (even if it's the default path), otherwise use stone actor image if valid, then character actor, then default
        let vitalityStoneImg: string;
        if (settingsImg && settingsImg.trim() !== '') {
          vitalityStoneImg = settingsImg;
          console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Using SETTINGS image: ${vitalityStoneImg}`);
        } else if (stoneActorImg && isValidImage(stoneActorImg)) {
          vitalityStoneImg = stoneActorImg;
          console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Using STONE ACTOR image: ${vitalityStoneImg}`);
        } else if (actorImg && isValidImage(actorImg)) {
          vitalityStoneImg = actorImg;
          console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Using CHARACTER ACTOR image: ${vitalityStoneImg}`);
        } else {
          vitalityStoneImg = defaultImg;
          console.log(`Mastery System | [SPAWN STONES] [IMAGE DEBUG] Using DEFAULT image: ${vitalityStoneImg}`);
        }
        
        console.log(`Mastery System | [SPAWN STONES] Vitality stone image resolution:`, {
          stoneActorImg: stoneActorImg || '(none)',
          actorImg: actorImg || '(none)',
          settingsImg: settingsImg || '(none)',
          defaultImg: defaultImg,
          finalImg: vitalityStoneImg,
          decision: settingsImg && settingsImg.trim() !== '' ? 'settings' : (stoneActorImg && isValidImage(stoneActorImg) ? 'stoneActor' : (actorImg && isValidImage(actorImg) ? 'actor' : 'default'))
        });
        
        for (let i = 0; i < vitalityStoneCount; i++) {
          const pos = getRandomPointInRegion(vitalityRegion);
          const tokenData: any = {
            name: `Vitality Stone ${i + 1}`,
            actorId: (stoneActor as any)?.id || (actor as any).id, // Fallback to character actor if no stone actor
            img: vitalityStoneImg, // Explicitly set image for unlinked tokens
            x: pos.x,
            y: pos.y,
            flags: {
              'mastery-system': {
                divineClash: {
                  isStone: true,
                  stoneKind: 'vitality',
                  seatIndex,
                  seatUserId: user?.id || null,
                  state: 'vitality'
                } as DivineClashTokenFlags
              }
            },
            actorLink: false,
            disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            locked: false
          };
          
          console.log(`Mastery System | [SPAWN STONES] Creating vitality stone ${i + 1}/${vitalityStoneCount} with tokenData:`, {
            name: tokenData.name,
            actorId: tokenData.actorId,
            img: tokenData.img,
            imgSource: 'from stoneActor, actor, or settings',
            position: { x: tokenData.x, y: tokenData.y },
            actorLink: tokenData.actorLink
          });
          
          try {
            const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
            const createdToken = created[0];
            if (createdToken) {
              const tokenDoc = (createdToken as any).document || createdToken;
              const createdImg = tokenDoc?.img || (createdToken as any).img;
              
              console.log(`Mastery System | [SPAWN STONES] Created vitality stone ${i + 1}/${vitalityStoneCount}:`, {
                id: createdToken.id,
                name: (createdToken as any).name,
                position: { x: (createdToken as any).x || tokenDoc?.x, y: (createdToken as any).y || tokenDoc?.y },
                imgInData: tokenData.img,
                imgInDocument: createdImg,
                imgMatch: tokenData.img === createdImg,
                actorLink: tokenDoc?.actorLink
              });
              
              // Force update image if it doesn't match (Foundry sometimes uses actor image even with actorLink: false)
              if (tokenDoc && createdImg !== vitalityStoneImg) {
                console.log(`Mastery System | [SPAWN STONES] [IMAGE FIX] Token image mismatch, updating from "${createdImg}" to "${vitalityStoneImg}"`);
                await tokenDoc.update({ img: vitalityStoneImg });
                console.log(`Mastery System | [SPAWN STONES] [IMAGE FIX] Image updated successfully`);
              }
            } else {
              console.error(`Mastery System | [SPAWN STONES] Created array is empty for vitality stone ${i + 1}`);
            }
          } catch (error) {
            console.error(`Mastery System | [SPAWN STONES] Failed to spawn vitality stone ${i + 1}:`, error);
          }
        }
      } else {
        console.error(`Mastery System | [SPAWN STONES] VITALITY region not found for seat ${seatIndex}`);
      }
    } else {
      console.warn(`Mastery System | [SPAWN STONES] Cannot spawn vitality stones: no stone actor and user exists`);
    }
  } else {
    console.log(`Mastery System | [SPAWN STONES] Skipping vitality stones: count is ${vitalityStoneCount}`);
  }
  
  console.log(`Mastery System | [SPAWN STONES] Completed spawning for seat ${seatIndex}`);
}

/**
 * Spawn avatar token for a seat
 */
async function spawnAvatarForSeat(scene: Scene, seatIndex: number, actor: Actor): Promise<void> {
  console.log(`Mastery System | [SPAWN AVATAR] Starting for seat ${seatIndex}:`, {
    actorId: (actor as any).id,
    actorName: (actor as any).name,
    actorType: actor.type
  });
  
  // Find avatar position (use READY region center as fallback)
  const regionName = getRegionName(seatIndex, 'READY');
  console.log(`Mastery System | [SPAWN AVATAR] Looking for region: ${regionName}`);
  const seatRegion = findRegion(scene, regionName);
  if (!seatRegion) {
    console.warn(`Mastery System | [SPAWN AVATAR] Seat ${seatIndex} region "${regionName}" not found for avatar`);
    return;
  }
  
  console.log(`Mastery System | [SPAWN AVATAR] Found region:`, {
    id: seatRegion.id,
    x: seatRegion.x,
    y: seatRegion.y,
    width: seatRegion.width,
    height: seatRegion.height
  });
  
  const pos = {
    x: seatRegion.x + seatRegion.width / 2,
    y: seatRegion.y + seatRegion.height / 2
  };
  
  console.log(`Mastery System | [SPAWN AVATAR] Calculated position:`, pos);
  
  const tokenData: any = {
    name: (actor as any).name,
    actorId: (actor as any).id,
    x: pos.x,
    y: pos.y,
    flags: {
      'mastery-system': {
        divineClash: {
          isAvatar: true,
          seatIndex
        } as DivineClashTokenFlags
      }
    },
    actorLink: true,
    disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
    locked: false
  };
  
  console.log(`Mastery System | [SPAWN AVATAR] Token data:`, tokenData);
  
  try {
    console.log(`Mastery System | [SPAWN AVATAR] Creating token document...`);
    const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
    console.log(`Mastery System | [SPAWN AVATAR] Successfully created avatar token for seat ${seatIndex}:`, {
      count: created.length,
      tokenIds: created.map((t: any) => t.id),
      tokenNames: created.map((t: any) => t.name),
      tokenPositions: created.map((t: any) => ({ x: t.x, y: t.y }))
    });
    
    // Wait a moment for token to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify token is visible on canvas
    const canvasToken = canvas?.tokens?.placeables.find((t: any) => t.id === created[0].id);
    if (canvasToken) {
      console.log(`Mastery System | [SPAWN AVATAR] Token is visible on canvas at:`, {
        x: canvasToken.x,
        y: canvasToken.y,
        visible: canvasToken.visible
      });
    } else {
      console.warn(`Mastery System | [SPAWN AVATAR] Token created but not found on canvas yet`);
    }
  } catch (error) {
    console.error(`Mastery System | [SPAWN AVATAR] Failed to spawn avatar for seat ${seatIndex}:`, error);
    console.error(`Mastery System | [SPAWN AVATAR] Error details:`, {
      message: (error as Error).message,
      stack: (error as Error).stack
    });
  }
}

/**
 * Pull users to scene (via socket or direct activation)
 */
async function pullUsersToScene(scene: Scene, userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    try {
      const user = (game as any).users?.get(userId);
      if (!user || !user.active) {
        console.warn(`Mastery System | User ${userId} not found or not active`);
        continue;
      }
      
      // Try socket method first (if available)
      if ((game as any).socket && typeof (game as any).socket.emit === 'function') {
        try {
          (game as any).socket.emit('pullToScene', scene.id, userId);
          console.log(`Mastery System | Pulled user ${user.name} to scene via socket`);
        } catch (socketError) {
          // Fallback to direct activation
          console.warn('Mastery System | Socket pull failed, using direct activation', socketError);
          await scene.activate({ user });
        }
      } else {
        // Direct activation (only works for local user)
        if (user.id === game.user?.id) {
          await scene.activate();
        } else {
          console.warn(`Mastery System | Cannot directly activate scene for user ${user.name} (not local)`);
          // Try to broadcast via socket if available
          if ((game as any).socket) {
            (game as any).socket.emit('pullToScene', scene.id, userId);
          }
        }
      }
    } catch (error) {
      console.error(`Mastery System | Failed to pull user ${userId} to scene`, error);
    }
  }
}

/**
 * Calculate power stone count from actor (using system.stones)
 */
function calculatePowerStoneCount(actor: Actor): number {
  const system = (actor.system as any) || {};
  const stones = system.stones || {};
  
  console.log(`Mastery System | [CALCULATE POWER STONES] Starting calculation for actor:`, {
    actorId: (actor as any).id,
    actorName: (actor as any).name,
    hasStones: !!stones,
    stonesData: stones
  });
  
  // Use system.stones if available (new system)
  if (stones.total !== undefined && stones.vitality !== undefined) {
    // Power stones = total - vitality (or current - vitality if current is set)
    const totalStones = stones.current !== undefined ? stones.current : stones.total;
    const vitality = stones.vitality || 0;
    const powerStones = Math.max(0, totalStones - vitality);
    
    console.log(`Mastery System | [CALCULATE POWER STONES] Using system.stones:`, {
      total: stones.total,
      current: stones.current,
      vitality: vitality,
      powerStones: powerStones
    });
    
    return powerStones;
  }
  
  // Fallback to old stonePools system for backwards compatibility
  console.log(`Mastery System | [CALCULATE POWER STONES] Falling back to stonePools`);
  const stonePools = system.stonePools || {};
  let total = 0;
  for (const [key, pool] of Object.entries(stonePools)) {
    if (key === 'vitality') {
      console.log(`Mastery System | [CALCULATE POWER STONES] Skipping vitality pool`);
      continue;
    }
    const poolData = pool as any;
    const current = poolData.current || 0;
    total += current;
    console.log(`Mastery System | [CALCULATE POWER STONES] Pool "${key}": current=${current}, runningTotal=${total}`);
  }
  
  console.log(`Mastery System | [CALCULATE POWER STONES] Final total: ${total}`);
  return total;
}

/**
 * Calculate vitality stone count from actor (using system.stones)
 */
function calculateVitalityStoneCount(actor: Actor): number {
  // Check flag first
  const flagValue = (actor as any).getFlag('mastery-system', 'divineClash.vitality') as number | undefined;
  if (flagValue !== undefined && flagValue !== null) {
    console.log(`Mastery System | [CALCULATE VITALITY STONES] Using flag value: ${flagValue}`);
    return flagValue;
  }
  
  const system = (actor.system as any) || {};
  const stones = system.stones || {};
  
  // Use system.stones if available (new system)
  if (stones.vitality !== undefined) {
    const vitality = stones.vitality || 0;
    console.log(`Mastery System | [CALCULATE VITALITY STONES] Using system.stones.vitality: ${vitality}`);
    return vitality;
  }
  
  // Fallback to old stonePools system for backwards compatibility
  console.log(`Mastery System | [CALCULATE VITALITY STONES] Falling back to stonePools`);
  const stonePools = system.stonePools || {};
  const vitalityPool = stonePools.vitality || {};
  const fallback = (vitalityPool as any).max || 10;
  console.log(`Mastery System | [CALCULATE VITALITY STONES] Using stonePools.vitality.max: ${fallback}`);
  return fallback;
}

// Guard to prevent multiple simultaneous calls
let isStartingDivineClash = false;

/**
 * START: Initialize Divine Clash from selected tokens
 */
export async function startDivineClash(): Promise<void> {
  console.log('Mastery System | [DIVINE CLASH START] Beginning startDivineClash');
  
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start Divine Clash');
    return;
  }
  
  // Prevent multiple simultaneous calls
  if (isStartingDivineClash) {
    console.warn('Mastery System | [DIVINE CLASH START] Already in progress, ignoring duplicate call');
    return;
  }
  
  isStartingDivineClash = true;
  
  try {
    const controlled = canvas?.tokens?.controlled || [];
    console.log('Mastery System | [DIVINE CLASH START] Controlled tokens:', controlled.length);
    controlled.forEach((token: Token, idx: number) => {
      console.log(`Mastery System | [DIVINE CLASH START] Token ${idx}:`, {
        id: (token as any).id,
        name: token.name,
        actorId: token.actor ? (token.actor as any).id : null,
        actorName: token.actor ? (token.actor as any).name : null,
        actorType: token.actor?.type,
        hasActor: !!token.actor
      });
    });
    
    if (controlled.length === 0) {
      ui.notifications?.warn('Please select at least one character token to start Divine Clash');
      return;
    }
    
    // Separate players and enemy
    const playerTokens: Token[] = [];
    let enemyToken: Token | null = null;
    
    for (const token of controlled) {
      if (!token.actor) {
        console.log('Mastery System | [DIVINE CLASH START] Token has no actor, skipping:', (token as any).id);
        continue;
      }
      console.log('Mastery System | [DIVINE CLASH START] Processing token:', {
        id: token.id,
        name: token.name,
        actorType: token.actor.type,
        actorId: token.actor.id,
        actorName: token.actor.name
      });
      
      if (token.actor.type === 'character') {
        playerTokens.push(token);
        console.log('Mastery System | [DIVINE CLASH START] Added as player token');
      } else if (token.actor.type === 'npc') {
        // First NPC is enemy
        if (!enemyToken) {
          enemyToken = token;
          console.log('Mastery System | [DIVINE CLASH START] Added as enemy token');
        } else {
          console.log('Mastery System | [DIVINE CLASH START] NPC token ignored (enemy already set)');
        }
      } else {
        console.log('Mastery System | [DIVINE CLASH START] Unknown actor type, skipping:', token.actor.type);
      }
    }
    
    console.log('Mastery System | [DIVINE CLASH START] Summary:', {
      playerTokens: playerTokens.length,
      enemyToken: enemyToken ? enemyToken.actor?.name : null
    });
    
    // Get Divine Clash scene first (before checking tokens, so we can switch even with only enemy)
    const scene = getDivineClashScene();
    if (!scene) {
      ui.notifications?.error('Divine Clash scene not found. Please configure it in settings or create a scene named "Divine Clash"');
      return;
    }
    
    if (playerTokens.length === 0) {
      ui.notifications?.warn('Please select at least one character token');
      // Still switch to Divine Clash scene even if only enemy is selected
      console.log('Mastery System | [DIVINE CLASH START] No player tokens, but switching to Divine Clash scene anyway');
      await scene.activate();
      return;
    }
  
  // Initialize scene flags
  const seats: Record<number, DivineClashSeat> = {};
  
  // Seat 0: Enemy (if selected)
  if (enemyToken && enemyToken.actor) {
    console.log('Mastery System | [DIVINE CLASH START] Setting up enemy seat 0:', {
      actorId: enemyToken.actor.id,
      actorName: enemyToken.actor.name
    });
    seats[0] = {
      seatIndex: 0,
      actorId: (enemyToken.actor as any).id,
      userId: null, // GM-only
      isEnemy: true
    };
  } else {
    console.log('Mastery System | [DIVINE CLASH START] No enemy token selected, seat 0 will be empty');
  }
  
  // Seats 1..N: Players
  const userIdsToPull: string[] = [];
  for (let i = 0; i < playerTokens.length; i++) {
    const token = playerTokens[i];
    const actor = token.actor;
    if (!actor) {
      console.log(`Mastery System | [DIVINE CLASH START] Player token ${i} has no actor, skipping`);
      continue;
    }
    
    const seatIndex = i + 1;
    console.log(`Mastery System | [DIVINE CLASH START] Processing player ${i} for seat ${seatIndex}:`, {
      tokenId: (token as any).id,
      actorId: (actor as any).id,
      actorName: (actor as any).name,
      actorType: actor.type
    });
    
    // Find user for this actor
    let user: User | null = null;
    const characterUser = (game as any).users?.find((u: User) => (u as any).character?.id === (actor as any).id);
    console.log(`Mastery System | [DIVINE CLASH START] Character user search:`, {
      found: !!characterUser,
      userId: characterUser?.id,
      userName: characterUser?.name
    });
    
    if (characterUser) {
      user = characterUser;
      console.log(`Mastery System | [DIVINE CLASH START] Found character user:`, user.name);
    } else {
      // Fallback: find first active owner
      const owners = (game as any).users?.filter((u: User) => actor.testUserPermission(u, 'OWNER')) || [];
      console.log(`Mastery System | [DIVINE CLASH START] Owner search:`, {
        totalOwners: owners.length,
        ownerIds: owners.map((u: User) => u.id),
        ownerNames: owners.map((u: User) => u.name)
      });
      user = owners.find((u: User) => u.active) || owners[0] || null;
      if (user) {
        console.log(`Mastery System | [DIVINE CLASH START] Using owner as fallback:`, user.name);
      }
    }
    
    if (!user) {
      console.warn(`Mastery System | [DIVINE CLASH START] No user found for actor ${(actor as any).name}, skipping`);
      continue;
    }
    
    seats[seatIndex] = {
      seatIndex,
      actorId: (actor as any).id,
      userId: user.id,
      isEnemy: false
    };
    
    userIdsToPull.push(user.id);
    console.log(`Mastery System | [DIVINE CLASH START] Assigned seat ${seatIndex} to user ${user.name} (${user.id})`);
  }
  
  console.log('Mastery System | [DIVINE CLASH START] Seat assignment complete:', {
    seats: Object.keys(seats).length,
    userIdsToPull: userIdsToPull.length,
    seatDetails: Object.entries(seats).map(([_idx, seat]) => ({
      seatIndex: seat.seatIndex,
      actorId: seat.actorId,
      userId: seat.userId,
      isEnemy: seat.isEnemy
    }))
  });
  
  // Update scene flags
  await updateSceneFlags(scene, {
    phase: 'planning',
    seats,
    started: true
  });
  
  // Pull players to scene
  console.log('Mastery System | [DIVINE CLASH START] Pulling users to scene:', userIdsToPull);
  await pullUsersToScene(scene, userIdsToPull);
  
  // Switch GM to scene
  console.log('Mastery System | [DIVINE CLASH START] Activating scene for GM');
  await scene.activate();
  
  // Wait for canvas to be ready
  console.log('Mastery System | [DIVINE CLASH START] Waiting for canvas to be ready...');
  let waitCount = 0;
  while ((!canvas?.ready || canvas.scene?.id !== scene.id) && waitCount < 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    waitCount++;
  }
  console.log(`Mastery System | [DIVINE CLASH START] Canvas ready: ${canvas?.ready}, Scene ID match: ${canvas?.scene?.id === scene.id}, Wait iterations: ${waitCount}`);
  
  // Additional wait for scene resources
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Spawn tokens for each seat
  console.log('Mastery System | [DIVINE CLASH START] Starting token spawning for', Object.keys(seats).length, 'seats');
  console.log('Mastery System | [DIVINE CLASH START] Current scene:', {
    id: scene.id,
    name: scene.name,
    active: scene.active,
    canvasSceneId: canvas?.scene?.id,
    canvasReady: canvas?.ready
  });
  
  for (const [seatIndexStr, seat] of Object.entries(seats)) {
    const seatIndex = parseInt(seatIndexStr);
    console.log(`Mastery System | [DIVINE CLASH START] ========== Processing seat ${seatIndex} ==========`);
    console.log(`Mastery System | [DIVINE CLASH START] Seat data:`, {
      seatIndex: seat.seatIndex,
      actorId: seat.actorId,
      userId: seat.userId,
      isEnemy: seat.isEnemy
    });
    
    const actor = (game as any).actors?.get(seat.actorId);
    if (!actor) {
      console.error(`Mastery System | [DIVINE CLASH START] Actor ${seat.actorId} not found for seat ${seatIndex}, skipping`);
      continue;
    }
    console.log(`Mastery System | [DIVINE CLASH START] Actor details:`, {
      id: (actor as any).id,
      name: (actor as any).name,
      type: actor.type,
      img: (actor as any).img
    });
    
    const user = seat.userId ? (game as any).users?.get(seat.userId) : null;
    if (user) {
      console.log(`Mastery System | [DIVINE CLASH START] User details:`, {
        id: user.id,
        name: user.name,
        active: user.active,
        character: (user as any).character?.id
      });
    } else if (!seat.isEnemy) {
      console.warn(`Mastery System | [DIVINE CLASH START] No user found for seat ${seatIndex} (not enemy)`);
    } else {
      console.log(`Mastery System | [DIVINE CLASH START] Enemy seat ${seatIndex} - no user (GM-only)`);
    }
    
    if (seat.isEnemy) {
      // Enemy: spawn avatar and stones (if configured)
      console.log(`Mastery System | [DIVINE CLASH START] >>> Spawning ENEMY avatar for seat ${seatIndex}`);
      await spawnAvatarForSeat(scene, seatIndex, actor);
      console.log(`Mastery System | [DIVINE CLASH START] <<< Enemy avatar spawn complete for seat ${seatIndex}`);
      // Enemy stones optional - skip for now
    } else {
      // Player: spawn avatar, power stones, vitality stones
      console.log(`Mastery System | [DIVINE CLASH START] >>> Spawning PLAYER avatar for seat ${seatIndex}`);
      await spawnAvatarForSeat(scene, seatIndex, actor);
      console.log(`Mastery System | [DIVINE CLASH START] <<< Player avatar spawn complete for seat ${seatIndex}`);
      
      const powerCount = calculatePowerStoneCount(actor);
      const vitalityCount = calculateVitalityStoneCount(actor);
      console.log(`Mastery System | [DIVINE CLASH START] Stone counts for seat ${seatIndex}:`, {
        power: powerCount,
        vitality: vitalityCount,
        actorSystem: (actor.system as any)?.stonePools ? 'has stonePools' : 'no stonePools'
      });
      
      console.log(`Mastery System | [DIVINE CLASH START] >>> Spawning stones for seat ${seatIndex}`);
      await spawnStonesForSeat(scene, seatIndex, actor, user, powerCount, vitalityCount);
      console.log(`Mastery System | [DIVINE CLASH START] <<< Stone spawn complete for seat ${seatIndex}`);
    }
    
    // Verify tokens were created
    const sceneTokens = scene.tokens || [];
    const seatTokens = sceneTokens.filter((t: any) => {
      const flags = t.document?.getFlag('mastery-system', 'divineClash');
      return flags && (flags.seatIndex === seatIndex || (flags.isAvatar && seatIndex === seatIndex));
    });
    console.log(`Mastery System | [DIVINE CLASH START] Verification: Found ${seatTokens.length} tokens for seat ${seatIndex} on scene`);
    
    console.log(`Mastery System | [DIVINE CLASH START] ========== Completed seat ${seatIndex} ==========`);
  }
  
    ui.notifications?.info(`Divine Clash started with ${playerTokens.length} player(s)`);
  } finally {
    isStartingDivineClash = false;
  }
}

/**
 * REVEAL: Reveal attack/defense and move stones to exhausted
 */
export async function revealDivineClash(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reveal Divine Clash');
    return;
  }
  
  const scene = canvas?.scene;
  if (!scene) {
    ui.notifications?.warn('No active scene');
    return;
  }
  
  const flags = getSceneFlags(scene);
  if (!flags.started) {
    ui.notifications?.warn('Divine Clash not started. Use "Start" first.');
    return;
  }
  
  // Update phase
  await updateSceneFlags(scene, { phase: 'reveal' });
  
  // Collect summary data
  const summary: Array<{ name: string; attack: number; defense: number; ready: number; exhausted: number; vitality: number }> = [];
  
  // Process each seat
  for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
    const seatIndex = parseInt(seatIndexStr);
    const actor = seat.actorId ? (game as any).actors?.get(seat.actorId) : null;
    const actorName = (actor as any)?.name || `Seat ${seatIndex}`;
    
    // Find all stone tokens for this seat
    const tokens = scene.tokens || [];
    const seatTokens = tokens.filter((token: any) => {
      const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
      return tokenFlags?.isStone && tokenFlags.seatIndex === seatIndex && tokenFlags.stoneKind === 'power';
    });
    
    let attack = 0;
    let defense = 0;
    let ready = 0;
    let exhausted = 0;
    let vitality = 0;
    
    // Count stones in each zone and move attack/defense to exhausted
    const exhaustedRegion = findRegion(scene, getRegionName(seatIndex, 'EXHAUSTED'));
    
    for (const token of seatTokens) {
      const zone = getTokenZone(scene, token, seatIndex);
      
      if (zone === 'attack') {
        attack++;
        // Move to exhausted
        if (exhaustedRegion) {
          const pos = getRandomPointInRegion(exhaustedRegion);
          await token.document.update({
            x: pos.x,
            y: pos.y,
            locked: true,
            flags: {
              'mastery-system': {
                divineClash: {
                  ...(token.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags || {}),
                  state: 'exhausted'
                }
              }
            }
          });
          exhausted++;
        }
      } else if (zone === 'defense') {
        defense++;
        // Move to exhausted
        if (exhaustedRegion) {
          const pos = getRandomPointInRegion(exhaustedRegion);
          await token.document.update({
            x: pos.x,
            y: pos.y,
            locked: true,
            flags: {
              'mastery-system': {
                divineClash: {
                  ...(token.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags || {}),
                  state: 'exhausted'
                }
              }
            }
          });
          exhausted++;
        }
      } else if (zone === 'ready') {
        ready++;
      } else if (zone === 'exhausted') {
        exhausted++;
      }
    }
    
    // Count vitality stones
    const vitalityTokens = tokens.filter((token: any) => {
      const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
      return tokenFlags?.isStone && tokenFlags.seatIndex === seatIndex && tokenFlags.stoneKind === 'vitality';
    });
    vitality = vitalityTokens.length;
    
    summary.push({ name: actorName, attack, defense, ready, exhausted, vitality });
  }
  
  // Post chat message
  let message = '<div class="divine-clash-reveal"><h3>Divine Clash Reveal</h3><table><thead><tr><th>Player</th><th>Attack</th><th>Defense</th><th>Ready</th><th>Exhausted</th><th>Vitality</th></tr></thead><tbody>';
  for (const entry of summary) {
    message += `<tr><td>${entry.name}</td><td>${entry.attack}</td><td>${entry.defense}</td><td>${entry.ready}</td><td>${entry.exhausted}</td><td>${entry.vitality}</td></tr>`;
  }
  message += '</tbody></table></div>';
  
  await ChatMessage.create({
    content: message,
    speaker: { alias: 'Divine Clash System' }
  });
  
  ui.notifications?.info('Divine Clash revealed! Attack/Defense stones moved to Exhausted.');
}

/**
 * END ROUND: Regenerate stones based on Mastery Rank
 */
export async function endRoundDivineClash(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can end a round');
    return;
  }
  
  const scene = canvas?.scene;
  if (!scene) {
    ui.notifications?.warn('No active scene');
    return;
  }
  
  const flags = getSceneFlags(scene);
  if (!flags.started) {
    ui.notifications?.warn('Divine Clash not started. Use "Start" first.');
    return;
  }
  
  // Update phase back to planning
  await updateSceneFlags(scene, { phase: 'planning' });
  
  const regenMessages: string[] = [];
  
  // Process each seat
  for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
    const seatIndex = parseInt(seatIndexStr);
    const actor = seat.actorId ? (game as any).actors?.get(seat.actorId) : null;
    if (!actor) continue;
    
    // Get Mastery Rank
    const system = (actor.system as any) || {};
    const masteryRank = system.mastery?.rank || 2;
    const regen = Math.max(1, masteryRank);
    
    // Find exhausted power stones for this seat
    const tokens = scene.tokens || [];
    const exhaustedStones = tokens.filter((token: any) => {
      const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
      return tokenFlags?.isStone &&
             tokenFlags.seatIndex === seatIndex &&
             tokenFlags.stoneKind === 'power' &&
             tokenFlags.state === 'exhausted' &&
             token.document?.locked;
    });
    
    // Move up to regen stones to ready
    const readyRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
    if (!readyRegion) continue;
    
    let moved = 0;
    for (let i = 0; i < Math.min(regen, exhaustedStones.length); i++) {
      const token = exhaustedStones[i];
      const pos = getRandomPointInRegion(readyRegion);
      
      await (token as any).document.update({
        x: pos.x,
        y: pos.y,
        locked: false,
        flags: {
          'mastery-system': {
            divineClash: {
              ...((token as any).document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags || {}),
              state: 'ready'
            }
          }
        }
      });
      moved++;
    }
    
    if (moved > 0) {
      regenMessages.push(`${(actor as any).name}: +${moved} Ready`);
    }
  }
  
  // Post chat message
  if (regenMessages.length > 0) {
    await ChatMessage.create({
      content: `<div class="divine-clash-regen"><h4>Regeneration Applied</h4><ul>${regenMessages.map(m => `<li>${m}</li>`).join('')}</ul></div>`,
      speaker: { alias: 'Divine Clash System' }
    });
  }
  
  ui.notifications?.info('Round ended. Regeneration applied.');
}

/**
 * RESET: Cleanup all Divine Clash tokens
 */
export async function resetDivineClash(): Promise<void> {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reset Divine Clash');
    return;
  }
  
  const scene = canvas?.scene;
  if (!scene) {
    ui.notifications?.warn('No active scene');
    return;
  }
  
  const cleanupAvatars = (game as any).settings.get('mastery-system', 'divineClashCleanupAvatars') as boolean;
  
  // Find all Divine Clash tokens
  const tokens = scene.tokens || [];
  const tokensToDelete: string[] = [];
  
  for (const token of tokens) {
    const tokenFlags = (token as any).document?.getFlag('mastery-system', 'divineClash') as DivineClashTokenFlags | undefined;
    if (tokenFlags?.isStone) {
      tokensToDelete.push((token as any).id);
    } else if (tokenFlags?.isAvatar && cleanupAvatars) {
      tokensToDelete.push((token as any).id);
    }
  }
  
  if (tokensToDelete.length > 0) {
    await scene.deleteEmbeddedDocuments('Token', tokensToDelete);
  }
  
  // Clear scene flags
  await scene.unsetFlag('mastery-system', 'divineClash');
  
  ui.notifications?.info(`Divine Clash reset. Removed ${tokensToDelete.length} token(s).`);
}

/**
 * Get current phase
 */
export function getDivineClashPhase(): DivineClashPhase | null {
  const scene = canvas?.scene;
  if (!scene) return null;
  const flags = getSceneFlags(scene);
  return flags.phase;
}

/**
 * Check if current scene is Divine Clash scene
 */
export function isDivineClashScene(): boolean {
  const scene = canvas?.scene;
  if (!scene) return false;
  const flags = getSceneFlags(scene);
  return flags.started;
}

