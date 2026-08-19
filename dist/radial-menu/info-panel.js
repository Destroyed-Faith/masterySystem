/**
 * Info Panel for Radial Menu
 */
import { getSegmentIdForOption } from './options.js';
import { artifactToVirtualWeapon, isVirtualUnarmedWeapon, resolveEquippedWeaponForAttackType, } from '../utils/unarmed-fallback.js';
/**
 * Convert world coordinates to screen coordinates
 */
function worldToScreen(worldX, worldY) {
    // Try multiple methods for Foundry v13 compatibility
    let screenX = 0;
    let screenY = 0;
    // Method 1: Use canvas stage toGlobal (if available)
    if (canvas.stage && typeof canvas.stage.toGlobal === 'function') {
        const worldPoint = new PIXI.Point(worldX, worldY);
        const globalPoint = canvas.stage.toGlobal(worldPoint);
        screenX = globalPoint.x;
        screenY = globalPoint.y;
    }
    // Method 2: Use renderer plugins interaction (older API)
    else if (canvas.app?.renderer?.plugins?.interaction?.mapPositionToPoint) {
        const point = new PIXI.Point();
        canvas.app.renderer.plugins.interaction.mapPositionToPoint(point, worldX, worldY);
        screenX = point.x;
        screenY = point.y;
    }
    // Method 3: Manual calculation using stage transform
    else if (canvas.stage) {
        const stage = canvas.stage;
        const transform = stage.worldTransform;
        screenX = transform.a * worldX + transform.c * worldY + transform.tx;
        screenY = transform.b * worldX + transform.d * worldY + transform.ty;
    }
    // Fallback: use canvas dimensions and grid
    else {
        // Rough approximation using stage scale
        const scale = canvas.stage?.scale?.x || 1;
        screenX = worldX * scale;
        screenY = worldY * scale;
    }
    return { x: screenX, y: screenY };
}
/**
 * Get or create the info panel div
 */
function getOrCreateInfoDiv() {
    let infoDiv = document.getElementById('ms-radial-info');
    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'ms-radial-info';
        infoDiv.className = 'ms-radial-info hidden';
        document.body.appendChild(infoDiv);
    }
    return infoDiv;
}
/**
 * Show the info panel with option details
 */
export function showRadialInfoPanel(token, option) {
    const info = getOrCreateInfoDiv();
    info.classList.remove('hidden');
    const screenPos = worldToScreen(token.center.x, token.center.y);
    // Position to the right of the token center
    info.style.left = `${screenPos.x + 200}px`;
    info.style.top = `${screenPos.y - 100}px`;
    const segmentId = getSegmentIdForOption(option);
    const category = segmentId === 'active-buff' ? 'attack' : segmentId;
    const castRange = option.rangeMeters ??
        (option.burstMeleeAoE ? undefined : option.range);
    const rangeText = castRange !== undefined ? `${castRange}m` : (option.range !== undefined ? `${option.range}m` : '–');
    const aoeM = (option.burstMeleeAoE && option.burstMeleeRadiusMeters) ||
        (option.aoeShape === 'radius' ? option.aoeRadiusMeters : undefined);
    const aoeText = typeof aoeM === 'number' && aoeM > 0
        ? (option.burstMeleeAoE ? `AoE burst ${aoeM}m` : `AoE radius ${aoeM}m`)
        : '';
    // Get weapon damage if this is a weapon attack
    let damageText = '';
    let reachText = '';
    let specialText = '';
    if (option.slot === 'attack' && token.actor) {
        const actor = token.actor;
        const items = actor.items ? Array.from(actor.items) : [];
        // Forced weapon (artifact / natural weapon attack option) wins: show the
        // derived artifact weapon damage, not a generic fallback.
        let weapon = null;
        const forcedWeaponItemId = option.forcedWeaponItemId;
        if (forcedWeaponItemId) {
            const forced = items.find((i) => i.id === forcedWeaponItemId);
            if (forced?.type === 'artifact') {
                weapon = artifactToVirtualWeapon(forced);
            }
            else if (forced?.type === 'weapon') {
                weapon = forced;
            }
        }
        if (!weapon) {
            // Same resolution the attack/damage pipeline uses: equipped weapon OR
            // equipped/bound artifact weapon (derived dice) OR virtual unarmed (1d8).
            const isRanged = (option.tags || []).some((t) => /ranged/i.test(String(t))) ||
                /\branged\b/i.test(`${option.name} ${option.description || ''}`);
            weapon = resolveEquippedWeaponForAttackType(items, isRanged ? 'ranged' : 'melee');
            // Legacy behavior: an attack option with only a ranged weapon equipped
            // still showed that weapon — keep any equipped weapon as last resort.
            if (!weapon || isVirtualUnarmedWeapon(weapon)) {
                const anyEquipped = items.find((i) => i.type === 'weapon' && i.system?.equipped === true);
                if (anyEquipped)
                    weapon = anyEquipped;
            }
        }
        if (weapon) {
            const weaponSystem = weapon.system;
            damageText = weaponSystem.damage || weaponSystem.weaponDamage || '';
            // Get reach from weapon
            const innateAbilities = weaponSystem.innateAbilities || [];
            const reachAbility = innateAbilities.find((a) => a.includes('Reach'));
            if (reachAbility) {
                // Match new format: "Reach (+1 m)" or "Reach (+2 m)"
                const bonusMatch = reachAbility.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
                if (bonusMatch) {
                    const bonus = parseInt(bonusMatch[1], 10);
                    const totalReach = 2 + bonus; // 2m base + bonus
                    reachText = `Reach: ${totalReach}m`;
                }
                else {
                    // Legacy support: Match old format: "Reach (2 m)" or "Reach (3 m)"
                    const legacyMatch = reachAbility.match(/Reach\s*\((\d+)\s*m\)/i);
                    if (legacyMatch) {
                        reachText = `Reach: ${legacyMatch[1]}m`;
                    }
                }
            }
            // Get special ability
            if (weaponSystem.special && weaponSystem.special !== '—') {
                specialText = weaponSystem.special;
            }
        }
    }
    // Build info HTML
    let infoHTML = `
    <div class="ms-info-title">${option.name}</div>
    <div class="ms-info-meta">
      <span class="ms-info-source">${option.source}</span> · <span class="ms-info-slot">${category}</span>
    </div>
  `;
    if (damageText) {
        infoHTML += `<div class="ms-info-damage"><strong>Damage:</strong> ${damageText}</div>`;
    }
    if (reachText) {
        infoHTML += `<div class="ms-info-reach">${reachText}</div>`;
    }
    else if (!option.burstMeleeAoE) {
        infoHTML += `<div class="ms-info-range">Range: ${rangeText}</div>`;
    }
    if (aoeText) {
        infoHTML += `<div class="ms-info-aoe">${aoeText}</div>`;
    }
    if (specialText) {
        infoHTML += `<div class="ms-info-special"><strong>Special Effect:</strong> ${specialText}</div>`;
    }
    infoHTML += `<div class="ms-info-desc">${option.description || 'No description available'}</div>`;
    info.innerHTML = infoHTML;
}
/**
 * Hide the info panel
 */
export function hideRadialInfoPanel() {
    const info = document.getElementById('ms-radial-info');
    if (info) {
        info.classList.add('hidden');
    }
}
//# sourceMappingURL=info-panel.js.map