/**
 * Divine Clash Manager
 * Handles automation for the Divine Clash board system
 */
/**
 * Get Divine Clash scene (by ID or name)
 */
function getDivineClashScene() {
    const sceneId = game.settings.get('mastery-system', 'divineClashSceneId');
    if (sceneId && sceneId.trim() !== '') {
        const scene = game.scenes?.get(sceneId);
        if (scene)
            return scene;
    }
    // Fallback: find by name
    const scenes = game.scenes || [];
    const scene = scenes.find((s) => s.name === 'Divine Clash');
    return scene || null;
}
/**
 * Get scene flags for Divine Clash
 */
function getSceneFlags(scene) {
    const flags = scene.getFlag('mastery-system', 'divineClash');
    return flags || {
        phase: 'planning',
        seats: {},
        started: false
    };
}
/**
 * Update scene flags
 */
async function updateSceneFlags(scene, updates) {
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
function findRegion(scene, namePattern) {
    console.log(`Mastery System | [FIND REGION] Looking for region: "${namePattern}"`);
    // In Foundry V13, regions are placeables on the canvas
    let regions = [];
    // Try canvas.regions.placeables first (V13 API)
    if (canvas?.regions?.placeables) {
        regions = Array.from(canvas.regions.placeables.values());
        console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via canvas.regions.placeables`);
    }
    else {
        // Fallback: try scene.regions collection
        if (scene.regions) {
            if (scene.regions instanceof Map || scene.regions.size !== undefined) {
                regions = Array.from(scene.regions.values());
                console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via scene.regions (Collection)`);
            }
            else if (Array.isArray(scene.regions)) {
                regions = scene.regions;
                console.log(`Mastery System | [FIND REGION] Found ${regions.length} regions via scene.regions (Array)`);
            }
        }
    }
    if (regions.length === 0) {
        console.warn(`Mastery System | [FIND REGION] No regions found in any expected location`);
        return null;
    }
    console.log(`Mastery System | [FIND REGION] Available region names:`, regions.map((r) => {
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
                }
                else if (shape.x1 !== undefined && shape.y1 !== undefined) {
                    x = shape.x1;
                    y = shape.y1;
                    width = (shape.x2 || shape.x1 + 100) - shape.x1;
                    height = (shape.y2 || shape.y1 + 100) - shape.y1;
                    console.log(`Mastery System | [FIND REGION] Using region.document.shape (x1/y1):`, { x, y, width, height });
                }
                else if (shape.center) {
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
                }
                else if (shape.x1 !== undefined && shape.y1 !== undefined) {
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
function getRandomPointInRegion(region) {
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
function isPointInRegion(point, region) {
    return point.x >= region.x &&
        point.x <= region.x + region.width &&
        point.y >= region.y &&
        point.y <= region.y + region.height;
}
/**
 * Get region name for a seat and zone
 */
function getRegionName(seatIndex, zone) {
    return `DC_SEAT_${seatIndex}_${zone}`;
}
/**
 * Find which zone a token is in (by checking regions)
 */
function getTokenZone(scene, token, seatIndex) {
    const tokenCenter = token.center;
    const zones = ['ready', 'attack', 'defense', 'exhausted', 'vitality', 'burned'];
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
async function ensurePlayerStoneActor(user, kind) {
    const actorName = `DC Stone (${kind === 'power' ? 'Power' : 'Vitality'}) - ${user.name}`;
    const kindName = kind === 'power' ? 'Power' : 'Vitality';
    console.log(`Mastery System | [ENSURE STONE ACTOR] Looking for ${kindName} stone actor for user ${user.name}`);
    // Strategy 0: Check for configured base stone actor (global basisstein)
    const baseActorId = kind === 'power'
        ? game.settings.get('mastery-system', 'divineClashBasePowerStoneActorId')
        : game.settings.get('mastery-system', 'divineClashBaseVitalityStoneActorId');
    if (baseActorId && baseActorId.trim() !== '') {
        const baseActor = game.actors?.get(baseActorId);
        if (baseActor) {
            console.log(`Mastery System | [ENSURE STONE ACTOR] Using configured base stone actor: ${baseActor.name} (${baseActorId})`);
            // Ensure user has OWNER permission (so they can move their stone tokens)
            const currentOwnership = baseActor.ownership || {};
            const userPermission = currentOwnership[user.id] || CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
            if (userPermission < CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
                const newOwnership = { ...currentOwnership, [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
                await baseActor.update({ ownership: newOwnership });
                console.log(`Mastery System | [ENSURE STONE ACTOR] Granted OWNER permission to user ${user.name}`);
            }
            return baseActor;
        }
        else {
            console.warn(`Mastery System | [ENSURE STONE ACTOR] Configured base stone actor ID ${baseActorId} not found, falling back to per-user actors`);
        }
    }
    // Strategy 1: Check for exact name match
    let existing = game.actors?.find((a) => {
        const name = a.name;
        const type = a.type;
        return name === actorName && type === 'npc';
    });
    if (existing) {
        console.log(`Mastery System | [ENSURE STONE ACTOR] Found exact match: ${existing.name}`);
        // Ensure ownership
        const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await existing.update({ ownership });
        return existing;
    }
    // Strategy 2: Find any stone actor owned by this user that matches the kind
    const allActors = game.actors || [];
    const userOwnedActors = allActors.filter((a) => {
        const hasOwnership = a.testUserPermission?.(user, 'OWNER') ||
            a.ownership?.[user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        return hasOwnership && a.type === 'npc';
    });
    console.log(`Mastery System | [ENSURE STONE ACTOR] Found ${userOwnedActors.length} NPC actors owned by ${user.name}`);
    // Look for actors with stone-related names
    const stoneKeywords = kind === 'power'
        ? ['power', 'stone', 'dc stone']
        : ['vitality', 'stone', 'dc stone'];
    existing = userOwnedActors.find((a) => {
        const name = (a.name || '').toLowerCase();
        return stoneKeywords.some(keyword => name.includes(keyword)) &&
            (kind === 'power' ? !name.includes('vitality') : name.includes('vitality'));
    });
    if (existing) {
        console.log(`Mastery System | [ENSURE STONE ACTOR] Found existing stone actor by name pattern: ${existing.name}`);
        // Ensure ownership
        const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await existing.update({ ownership });
        return existing;
    }
    // Strategy 3: If user has exactly one stone actor of the right kind, use it
    // (This handles cases where the user has manually created stone actors)
    const stoneActors = userOwnedActors.filter((a) => {
        const name = (a.name || '').toLowerCase();
        return name.includes('stone');
    });
    if (stoneActors.length === 1 && kind === 'power') {
        // If only one stone actor exists and we need power, use it
        console.log(`Mastery System | [ENSURE STONE ACTOR] Using single existing stone actor: ${stoneActors[0].name}`);
        const ownership = { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
        await stoneActors[0].update({ ownership });
        return stoneActors[0];
    }
    // Strategy 4: Create new actor if none found
    console.log(`Mastery System | [ENSURE STONE ACTOR] No existing stone actor found, creating new one: ${actorName}`);
    const actorData = {
        name: actorName,
        type: 'npc',
        ownership: { [user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
        img: kind === 'power'
            ? (game.settings.get('mastery-system', 'divineClashPowerStoneImg') || 'systems/mastery-system/icons/svg/power-stone.svg')
            : (game.settings.get('mastery-system', 'divineClashVitalityStoneImg') || 'systems/mastery-system/icons/svg/vitality-stone.svg')
    };
    try {
        const actor = await Actor.create(actorData);
        console.log(`Mastery System | [ENSURE STONE ACTOR] Created new stone actor: ${actorName}`);
        return actor;
    }
    catch (error) {
        console.error(`Mastery System | [ENSURE STONE ACTOR] Failed to create stone actor: ${actorName}`, error);
        return null;
    }
}
/**
 * Spawn stone tokens for a seat
 */
async function spawnStonesForSeat(scene, seatIndex, actor, user, powerStoneCount, vitalityStoneCount) {
    console.log(`Mastery System | [SPAWN STONES] Starting for seat ${seatIndex}:`, {
        powerCount: powerStoneCount,
        vitalityCount: vitalityStoneCount,
        hasUser: !!user,
        userId: user?.id
    });
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
                id: stoneActor.id,
                name: stoneActor.name
            });
            // Get image from actor or settings
            const powerStoneImg = stoneActor.img ||
                game.settings.get('mastery-system', 'divineClashPowerStoneImg') ||
                'systems/mastery-system/icons/svg/power-stone.svg';
            for (let i = 0; i < powerStoneCount; i++) {
                const pos = getRandomPointInRegion(seatRegion);
                const tokenData = {
                    name: `Power Stone ${i + 1}`,
                    actorId: stoneActor.id,
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
                            }
                        }
                    },
                    actorLink: false,
                    disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                    locked: false
                };
                try {
                    const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
                    console.log(`Mastery System | [SPAWN STONES] Created power stone ${i + 1}/${powerStoneCount}:`, {
                        id: created[0]?.id,
                        position: { x: pos.x, y: pos.y }
                    });
                }
                catch (error) {
                    console.error(`Mastery System | [SPAWN STONES] Failed to spawn power stone ${i + 1}:`, error);
                }
            }
        }
        else {
            console.error(`Mastery System | [SPAWN STONES] Failed to get/create stone actor for user ${user.name}`);
        }
    }
    else {
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
                // Get image from actor or settings
                const vitalityStoneImg = stoneActor?.img ||
                    actor.img ||
                    game.settings.get('mastery-system', 'divineClashVitalityStoneImg') ||
                    'systems/mastery-system/icons/svg/vitality-stone.svg';
                for (let i = 0; i < vitalityStoneCount; i++) {
                    const pos = getRandomPointInRegion(vitalityRegion);
                    const tokenData = {
                        name: `Vitality Stone ${i + 1}`,
                        actorId: stoneActor?.id || actor.id, // Fallback to character actor if no stone actor
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
                                }
                            }
                        },
                        actorLink: false,
                        disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                        locked: false
                    };
                    try {
                        const created = await scene.createEmbeddedDocuments('Token', [tokenData]);
                        console.log(`Mastery System | [SPAWN STONES] Created vitality stone ${i + 1}/${vitalityStoneCount}:`, {
                            id: created[0]?.id,
                            position: { x: pos.x, y: pos.y }
                        });
                    }
                    catch (error) {
                        console.error(`Mastery System | [SPAWN STONES] Failed to spawn vitality stone ${i + 1}:`, error);
                    }
                }
            }
            else {
                console.error(`Mastery System | [SPAWN STONES] VITALITY region not found for seat ${seatIndex}`);
            }
        }
        else {
            console.warn(`Mastery System | [SPAWN STONES] Cannot spawn vitality stones: no stone actor and user exists`);
        }
    }
    else {
        console.log(`Mastery System | [SPAWN STONES] Skipping vitality stones: count is ${vitalityStoneCount}`);
    }
    console.log(`Mastery System | [SPAWN STONES] Completed spawning for seat ${seatIndex}`);
}
/**
 * Spawn avatar token for a seat
 */
async function spawnAvatarForSeat(scene, seatIndex, actor) {
    console.log(`Mastery System | [SPAWN AVATAR] Starting for seat ${seatIndex}:`, {
        actorId: actor.id,
        actorName: actor.name,
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
    const tokenData = {
        name: actor.name,
        actorId: actor.id,
        x: pos.x,
        y: pos.y,
        flags: {
            'mastery-system': {
                divineClash: {
                    isAvatar: true,
                    seatIndex
                }
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
            tokenIds: created.map((t) => t.id),
            tokenNames: created.map((t) => t.name),
            tokenPositions: created.map((t) => ({ x: t.x, y: t.y }))
        });
        // Wait a moment for token to render
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify token is visible on canvas
        const canvasToken = canvas?.tokens?.placeables.find((t) => t.id === created[0].id);
        if (canvasToken) {
            console.log(`Mastery System | [SPAWN AVATAR] Token is visible on canvas at:`, {
                x: canvasToken.x,
                y: canvasToken.y,
                visible: canvasToken.visible
            });
        }
        else {
            console.warn(`Mastery System | [SPAWN AVATAR] Token created but not found on canvas yet`);
        }
    }
    catch (error) {
        console.error(`Mastery System | [SPAWN AVATAR] Failed to spawn avatar for seat ${seatIndex}:`, error);
        console.error(`Mastery System | [SPAWN AVATAR] Error details:`, {
            message: error.message,
            stack: error.stack
        });
    }
}
/**
 * Pull users to scene (via socket or direct activation)
 */
async function pullUsersToScene(scene, userIds) {
    for (const userId of userIds) {
        try {
            const user = game.users?.get(userId);
            if (!user || !user.active) {
                console.warn(`Mastery System | User ${userId} not found or not active`);
                continue;
            }
            // Try socket method first (if available)
            if (game.socket && typeof game.socket.emit === 'function') {
                try {
                    game.socket.emit('pullToScene', scene.id, userId);
                    console.log(`Mastery System | Pulled user ${user.name} to scene via socket`);
                }
                catch (socketError) {
                    // Fallback to direct activation
                    console.warn('Mastery System | Socket pull failed, using direct activation', socketError);
                    await scene.activate({ user });
                }
            }
            else {
                // Direct activation (only works for local user)
                if (user.id === game.user?.id) {
                    await scene.activate();
                }
                else {
                    console.warn(`Mastery System | Cannot directly activate scene for user ${user.name} (not local)`);
                    // Try to broadcast via socket if available
                    if (game.socket) {
                        game.socket.emit('pullToScene', scene.id, userId);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Mastery System | Failed to pull user ${userId} to scene`, error);
        }
    }
}
/**
 * Calculate power stone count from actor (sum of all pools except vitality)
 */
function calculatePowerStoneCount(actor) {
    const system = actor.system || {};
    const stonePools = system.stonePools || {};
    let total = 0;
    for (const [key, pool] of Object.entries(stonePools)) {
        if (key === 'vitality')
            continue;
        const poolData = pool;
        const max = poolData.max || 0;
        const sustained = poolData.sustained || 0;
        total += Math.max(0, max - sustained);
    }
    return total;
}
/**
 * Calculate vitality stone count from actor
 */
function calculateVitalityStoneCount(actor) {
    // Check flag first
    const flagValue = actor.getFlag('mastery-system', 'divineClash.vitality');
    if (flagValue !== undefined && flagValue !== null) {
        return flagValue;
    }
    // Fallback to stone pool
    const system = actor.system || {};
    const stonePools = system.stonePools || {};
    const vitalityPool = stonePools.vitality || {};
    return vitalityPool.max || 10;
}
/**
 * START: Initialize Divine Clash from selected tokens
 */
export async function startDivineClash() {
    console.log('Mastery System | [DIVINE CLASH START] Beginning startDivineClash');
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can start Divine Clash');
        return;
    }
    const controlled = canvas?.tokens?.controlled || [];
    console.log('Mastery System | [DIVINE CLASH START] Controlled tokens:', controlled.length);
    controlled.forEach((token, idx) => {
        console.log(`Mastery System | [DIVINE CLASH START] Token ${idx}:`, {
            id: token.id,
            name: token.name,
            actorId: token.actor ? token.actor.id : null,
            actorName: token.actor ? token.actor.name : null,
            actorType: token.actor?.type,
            hasActor: !!token.actor
        });
    });
    if (controlled.length === 0) {
        ui.notifications?.warn('Please select at least one character token to start Divine Clash');
        return;
    }
    // Separate players and enemy
    const playerTokens = [];
    let enemyToken = null;
    for (const token of controlled) {
        if (!token.actor) {
            console.log('Mastery System | [DIVINE CLASH START] Token has no actor, skipping:', token.id);
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
        }
        else if (token.actor.type === 'npc') {
            // First NPC is enemy
            if (!enemyToken) {
                enemyToken = token;
                console.log('Mastery System | [DIVINE CLASH START] Added as enemy token');
            }
            else {
                console.log('Mastery System | [DIVINE CLASH START] NPC token ignored (enemy already set)');
            }
        }
        else {
            console.log('Mastery System | [DIVINE CLASH START] Unknown actor type, skipping:', token.actor.type);
        }
    }
    console.log('Mastery System | [DIVINE CLASH START] Summary:', {
        playerTokens: playerTokens.length,
        enemyToken: enemyToken ? enemyToken.actor?.name : null
    });
    if (playerTokens.length === 0) {
        ui.notifications?.warn('Please select at least one character token');
        return;
    }
    // Get Divine Clash scene
    const scene = getDivineClashScene();
    if (!scene) {
        ui.notifications?.error('Divine Clash scene not found. Please configure it in settings or create a scene named "Divine Clash"');
        return;
    }
    // Initialize scene flags
    const seats = {};
    // Seat 0: Enemy (if selected)
    if (enemyToken && enemyToken.actor) {
        console.log('Mastery System | [DIVINE CLASH START] Setting up enemy seat 0:', {
            actorId: enemyToken.actor.id,
            actorName: enemyToken.actor.name
        });
        seats[0] = {
            seatIndex: 0,
            actorId: enemyToken.actor.id,
            userId: null, // GM-only
            isEnemy: true
        };
    }
    else {
        console.log('Mastery System | [DIVINE CLASH START] No enemy token selected, seat 0 will be empty');
    }
    // Seats 1..N: Players
    const userIdsToPull = [];
    for (let i = 0; i < playerTokens.length; i++) {
        const token = playerTokens[i];
        const actor = token.actor;
        if (!actor) {
            console.log(`Mastery System | [DIVINE CLASH START] Player token ${i} has no actor, skipping`);
            continue;
        }
        const seatIndex = i + 1;
        console.log(`Mastery System | [DIVINE CLASH START] Processing player ${i} for seat ${seatIndex}:`, {
            tokenId: token.id,
            actorId: actor.id,
            actorName: actor.name,
            actorType: actor.type
        });
        // Find user for this actor
        let user = null;
        const characterUser = game.users?.find((u) => u.character?.id === actor.id);
        console.log(`Mastery System | [DIVINE CLASH START] Character user search:`, {
            found: !!characterUser,
            userId: characterUser?.id,
            userName: characterUser?.name
        });
        if (characterUser) {
            user = characterUser;
            console.log(`Mastery System | [DIVINE CLASH START] Found character user:`, user.name);
        }
        else {
            // Fallback: find first active owner
            const owners = game.users?.filter((u) => actor.testUserPermission(u, 'OWNER')) || [];
            console.log(`Mastery System | [DIVINE CLASH START] Owner search:`, {
                totalOwners: owners.length,
                ownerIds: owners.map((u) => u.id),
                ownerNames: owners.map((u) => u.name)
            });
            user = owners.find((u) => u.active) || owners[0] || null;
            if (user) {
                console.log(`Mastery System | [DIVINE CLASH START] Using owner as fallback:`, user.name);
            }
        }
        if (!user) {
            console.warn(`Mastery System | [DIVINE CLASH START] No user found for actor ${actor.name}, skipping`);
            continue;
        }
        seats[seatIndex] = {
            seatIndex,
            actorId: actor.id,
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
        const actor = game.actors?.get(seat.actorId);
        if (!actor) {
            console.error(`Mastery System | [DIVINE CLASH START] Actor ${seat.actorId} not found for seat ${seatIndex}, skipping`);
            continue;
        }
        console.log(`Mastery System | [DIVINE CLASH START] Actor details:`, {
            id: actor.id,
            name: actor.name,
            type: actor.type,
            img: actor.img
        });
        const user = seat.userId ? game.users?.get(seat.userId) : null;
        if (user) {
            console.log(`Mastery System | [DIVINE CLASH START] User details:`, {
                id: user.id,
                name: user.name,
                active: user.active,
                character: user.character?.id
            });
        }
        else if (!seat.isEnemy) {
            console.warn(`Mastery System | [DIVINE CLASH START] No user found for seat ${seatIndex} (not enemy)`);
        }
        else {
            console.log(`Mastery System | [DIVINE CLASH START] Enemy seat ${seatIndex} - no user (GM-only)`);
        }
        if (seat.isEnemy) {
            // Enemy: spawn avatar and stones (if configured)
            console.log(`Mastery System | [DIVINE CLASH START] >>> Spawning ENEMY avatar for seat ${seatIndex}`);
            await spawnAvatarForSeat(scene, seatIndex, actor);
            console.log(`Mastery System | [DIVINE CLASH START] <<< Enemy avatar spawn complete for seat ${seatIndex}`);
            // Enemy stones optional - skip for now
        }
        else {
            // Player: spawn avatar, power stones, vitality stones
            console.log(`Mastery System | [DIVINE CLASH START] >>> Spawning PLAYER avatar for seat ${seatIndex}`);
            await spawnAvatarForSeat(scene, seatIndex, actor);
            console.log(`Mastery System | [DIVINE CLASH START] <<< Player avatar spawn complete for seat ${seatIndex}`);
            const powerCount = calculatePowerStoneCount(actor);
            const vitalityCount = calculateVitalityStoneCount(actor);
            console.log(`Mastery System | [DIVINE CLASH START] Stone counts for seat ${seatIndex}:`, {
                power: powerCount,
                vitality: vitalityCount,
                actorSystem: actor.system?.stonePools ? 'has stonePools' : 'no stonePools'
            });
            console.log(`Mastery System | [DIVINE CLASH START] >>> Spawning stones for seat ${seatIndex}`);
            await spawnStonesForSeat(scene, seatIndex, actor, user, powerCount, vitalityCount);
            console.log(`Mastery System | [DIVINE CLASH START] <<< Stone spawn complete for seat ${seatIndex}`);
        }
        // Verify tokens were created
        const sceneTokens = scene.tokens || [];
        const seatTokens = sceneTokens.filter((t) => {
            const flags = t.document?.getFlag('mastery-system', 'divineClash');
            return flags && (flags.seatIndex === seatIndex || (flags.isAvatar && seatIndex === seatIndex));
        });
        console.log(`Mastery System | [DIVINE CLASH START] Verification: Found ${seatTokens.length} tokens for seat ${seatIndex} on scene`);
        console.log(`Mastery System | [DIVINE CLASH START] ========== Completed seat ${seatIndex} ==========`);
    }
    ui.notifications?.info(`Divine Clash started with ${playerTokens.length} player(s)`);
}
/**
 * REVEAL: Reveal attack/defense and move stones to exhausted
 */
export async function revealDivineClash() {
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
    const summary = [];
    // Process each seat
    for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
        const seatIndex = parseInt(seatIndexStr);
        const actor = seat.actorId ? game.actors?.get(seat.actorId) : null;
        const actorName = actor?.name || `Seat ${seatIndex}`;
        // Find all stone tokens for this seat
        const tokens = scene.tokens || [];
        const seatTokens = tokens.filter((token) => {
            const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
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
                                    ...(token.getFlag('mastery-system', 'divineClash') || {}),
                                    state: 'exhausted'
                                }
                            }
                        }
                    });
                    exhausted++;
                }
            }
            else if (zone === 'defense') {
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
                                    ...(token.getFlag('mastery-system', 'divineClash') || {}),
                                    state: 'exhausted'
                                }
                            }
                        }
                    });
                    exhausted++;
                }
            }
            else if (zone === 'ready') {
                ready++;
            }
            else if (zone === 'exhausted') {
                exhausted++;
            }
        }
        // Count vitality stones
        const vitalityTokens = tokens.filter((token) => {
            const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
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
export async function endRoundDivineClash() {
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
    const regenMessages = [];
    // Process each seat
    for (const [seatIndexStr, seat] of Object.entries(flags.seats)) {
        const seatIndex = parseInt(seatIndexStr);
        const actor = seat.actorId ? game.actors?.get(seat.actorId) : null;
        if (!actor)
            continue;
        // Get Mastery Rank
        const system = actor.system || {};
        const masteryRank = system.mastery?.rank || 2;
        const regen = Math.max(1, masteryRank);
        // Find exhausted power stones for this seat
        const tokens = scene.tokens || [];
        const exhaustedStones = tokens.filter((token) => {
            const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
            return tokenFlags?.isStone &&
                tokenFlags.seatIndex === seatIndex &&
                tokenFlags.stoneKind === 'power' &&
                tokenFlags.state === 'exhausted' &&
                token.document?.locked;
        });
        // Move up to regen stones to ready
        const readyRegion = findRegion(scene, getRegionName(seatIndex, 'READY'));
        if (!readyRegion)
            continue;
        let moved = 0;
        for (let i = 0; i < Math.min(regen, exhaustedStones.length); i++) {
            const token = exhaustedStones[i];
            const pos = getRandomPointInRegion(readyRegion);
            await token.document.update({
                x: pos.x,
                y: pos.y,
                locked: false,
                flags: {
                    'mastery-system': {
                        divineClash: {
                            ...(token.document?.getFlag('mastery-system', 'divineClash') || {}),
                            state: 'ready'
                        }
                    }
                }
            });
            moved++;
        }
        if (moved > 0) {
            regenMessages.push(`${actor.name}: +${moved} Ready`);
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
export async function resetDivineClash() {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can reset Divine Clash');
        return;
    }
    const scene = canvas?.scene;
    if (!scene) {
        ui.notifications?.warn('No active scene');
        return;
    }
    const cleanupAvatars = game.settings.get('mastery-system', 'divineClashCleanupAvatars');
    // Find all Divine Clash tokens
    const tokens = scene.tokens || [];
    const tokensToDelete = [];
    for (const token of tokens) {
        const tokenFlags = token.document?.getFlag('mastery-system', 'divineClash');
        if (tokenFlags?.isStone) {
            tokensToDelete.push(token.id);
        }
        else if (tokenFlags?.isAvatar && cleanupAvatars) {
            tokensToDelete.push(token.id);
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
export function getDivineClashPhase() {
    const scene = canvas?.scene;
    if (!scene)
        return null;
    const flags = getSceneFlags(scene);
    return flags.phase;
}
/**
 * Check if current scene is Divine Clash scene
 */
export function isDivineClashScene() {
    const scene = canvas?.scene;
    if (!scene)
        return false;
    const flags = getSceneFlags(scene);
    return flags.started;
}
//# sourceMappingURL=divine-clash.js.map