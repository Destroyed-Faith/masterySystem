/**
 * Blood Pool / Blutlache System
 * Creates visual blood pools on the canvas when damage is dealt
 */
/**
 * Create a blood pool at a token's position
 * @param token - The token that took damage
 * @param damage - Amount of damage dealt (affects pool size)
 * @param persistent - If true, creates a Tile that persists. If false, creates temporary graphics
 * @param bloodColor - Optional hex color (e.g., "#8b0000"). If not provided, uses actor's bloodColor or default dark red
 */
export async function createBloodPool(token, damage, persistent = false, bloodColor) {
    if (!token || !canvas?.ready) {
        console.warn('Mastery System | Cannot create blood pool: canvas not ready or token invalid');
        return;
    }
    // Get blood color from parameter, actor, or default
    let finalBloodColor = bloodColor;
    if (!finalBloodColor && token.actor) {
        const actorSystem = token.actor.system;
        finalBloodColor = actorSystem?.bloodColor;
    }
    // Default to dark red if no color specified
    if (!finalBloodColor || !finalBloodColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        finalBloodColor = '#8b0000';
    }
    // Convert hex color to RGB for PIXI
    const hex = finalBloodColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const pixiColor = (r << 16) | (g << 8) | b;
    // Create darker variants for gradient
    const darkerR = Math.max(0, Math.floor(r * 0.4));
    const darkerG = Math.max(0, Math.floor(g * 0.4));
    const darkerB = Math.max(0, Math.floor(b * 0.4));
    const darkerColor = (darkerR << 16) | (darkerG << 8) | darkerB;
    const tokenCenter = token.center;
    const gridSize = canvas.grid?.size || 100;
    // Calculate pool size based on damage (minimum 1 grid unit, scales with damage)
    const baseSize = gridSize * 0.4; // Base size: 40% of grid unit
    const damageMultiplier = Math.min(1 + (damage / 20), 2.5); // Scale up to 2.5x with damage
    const poolRadius = baseSize * damageMultiplier;
    if (persistent) {
        // Create a persistent Tile
        try {
            const tileData = {
                img: '', // We'll use a data URI for a circle
                x: tokenCenter.x,
                y: tokenCenter.y,
                width: poolRadius * 2,
                height: poolRadius * 2,
                rotation: 0,
                z: 100, // Below tokens but above background
                alpha: 0.6,
                tint: pixiColor, // Use custom blood color
                locked: false,
                hidden: false
            };
            // Create a simple circle as data URI with custom color
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Draw a semi-transparent circle with some variation using custom color
                const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`); // Center
                gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.5)`); // Medium
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.2)`); // Edge
                ctx.fillStyle = gradient;
                ctx.beginPath();
                // Make it slightly irregular (not a perfect circle)
                const centerX = 100;
                const centerY = 100;
                const radius = 90;
                ctx.ellipse(centerX, centerY, radius, radius * 0.9, 0, 0, Math.PI * 2);
                ctx.fill();
                // Add some darker spots for realism
                ctx.fillStyle = `rgba(${darkerR}, ${darkerG}, ${darkerB}, 0.4)`;
                ctx.beginPath();
                ctx.arc(centerX - 20, centerY + 10, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + 15, centerY - 15, 12, 0, Math.PI * 2);
                ctx.fill();
            }
            tileData.img = canvas.toDataURL('image/png');
            // Create the tile
            const scene = canvas.scene;
            if (scene) {
                await TileDocument.create(tileData, { parent: scene });
                console.log('Mastery System | Blood pool tile created', {
                    x: tokenCenter.x,
                    y: tokenCenter.y,
                    radius: poolRadius,
                    damage
                });
            }
        }
        catch (error) {
            console.error('Mastery System | Error creating blood pool tile', error);
            // Fallback to temporary graphics
            createTemporaryBloodPool(token, damage, poolRadius, pixiColor, darkerColor);
        }
    }
    else {
        // Create temporary graphics (disappears on scene reload)
        createTemporaryBloodPool(token, damage, poolRadius, pixiColor, darkerColor);
    }
}
/**
 * Create a temporary blood pool using PIXI.Graphics
 */
function createTemporaryBloodPool(token, damage, radius, pixiColor, darkerColor) {
    const tokenCenter = token.center;
    // Create graphics
    const bloodPool = new PIXI.Graphics();
    // Draw pool with gradient effect (simulated with multiple circles) using custom color
    // Outer edge (lighter)
    bloodPool.beginFill(pixiColor, 0.3);
    bloodPool.drawEllipse(0, 0, radius, radius * 0.9);
    bloodPool.endFill();
    // Middle layer
    bloodPool.beginFill(pixiColor, 0.5);
    bloodPool.drawEllipse(0, 0, radius * 0.7, radius * 0.6);
    bloodPool.endFill();
    // Center (darker)
    bloodPool.beginFill(darkerColor, 0.7);
    bloodPool.drawEllipse(0, 0, radius * 0.4, radius * 0.35);
    bloodPool.endFill();
    // Add some irregular dark spots
    bloodPool.beginFill(darkerColor, 0.6);
    bloodPool.drawEllipse(-radius * 0.2, radius * 0.1, radius * 0.15, radius * 0.12);
    bloodPool.endFill();
    bloodPool.beginFill(darkerColor, 0.6);
    bloodPool.drawEllipse(radius * 0.15, -radius * 0.15, radius * 0.12, radius * 0.1);
    bloodPool.endFill();
    // Position at token center
    bloodPool.position.set(tokenCenter.x, tokenCenter.y);
    // Add to background layer (below tokens)
    let backgroundContainer = null;
    if (canvas.background) {
        if (canvas.background.container && typeof canvas.background.container.addChild === 'function') {
            backgroundContainer = canvas.background.container;
        }
        else if (typeof canvas.background.addChild === 'function') {
            backgroundContainer = canvas.background;
        }
    }
    // Fallback to tiles layer
    if (!backgroundContainer && canvas.tiles) {
        if (canvas.tiles.container && typeof canvas.tiles.container.addChild === 'function') {
            backgroundContainer = canvas.tiles.container;
        }
        else if (typeof canvas.tiles.addChild === 'function') {
            backgroundContainer = canvas.tiles;
        }
    }
    if (backgroundContainer) {
        backgroundContainer.addChild(bloodPool);
        // Store reference for cleanup if needed
        bloodPool.msBloodPool = true;
        bloodPool.msTokenId = token.id;
        console.log('Mastery System | Temporary blood pool created', {
            x: tokenCenter.x,
            y: tokenCenter.y,
            radius,
            damage
        });
    }
    else {
        console.warn('Mastery System | Could not find background layer for blood pool');
    }
}
/**
 * Remove all blood pools for a specific token (if temporary)
 */
export function removeBloodPoolsForToken(tokenId) {
    if (!canvas?.ready)
        return;
    // Find and remove temporary blood pools
    const layers = [canvas.background, canvas.tiles].filter(Boolean);
    for (const layer of layers) {
        if (!layer)
            continue;
        const container = layer.container || layer;
        if (container && container.children) {
            for (let i = container.children.length - 1; i >= 0; i--) {
                const child = container.children[i];
                if (child.msBloodPool && child.msTokenId === tokenId) {
                    container.removeChild(child);
                    child.destroy();
                }
            }
        }
    }
}
//# sourceMappingURL=blood-pool.js.map