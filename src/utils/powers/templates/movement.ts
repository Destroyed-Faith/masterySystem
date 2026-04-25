/**
 * Movement Power Templates (10)
 *
 * Source: d:\DestroyedFaith\Powers\Movement.md — Levels 1..16.
 * Each template replaces the normal 10 m Movement; movementBonus carries the
 * listed distance so the aggregator can expose it to the UI and triggers.
 */

import type { PowerTemplate } from './_shared.js';
import { buildLevels, movementRow } from './_shared.js';

/** Shared: movement scaling helper. Takes a distance-per-level array of length 16. */
function movementTemplate(def: {
    id: string;
    name: string;
    subfamily: string;
    fluff: string;
    distances: number[]; // length 16
    effectFormatter: (m: number, lvl: number) => string;
}): PowerTemplate {
    if (def.distances.length !== 16) {
        throw new Error(`movementTemplate '${def.id}' needs 16 distance entries, got ${def.distances.length}`);
    }
    return {
        templateId: def.id,
        templateName: def.name,
        name: `Movement: ${def.name}`,
        subfamily: def.subfamily,
        category: 'movement',
        tags: [],
        fluff: def.fluff,
        cost: { action: 'movement' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => movementRow(def.distances[lvl - 1], def.effectFormatter(def.distances[lvl - 1], lvl))),
    };
}

export const MOVEMENT_TEMPLATES: PowerTemplate[] = [
    movementTemplate({
        id: 'movement-ground-dash',
        name: 'Ground Dash',
        subfamily: 'ground',
        fluff: 'You commit your Movement to speed, crossing ground faster than a normal combatant.',
        distances: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 34, 34, 34],
        effectFormatter: (m) => `Move up to **${m} m** along a legal ground path.`,
    }),
    movementTemplate({
        id: 'movement-safe-movement',
        name: 'Safe Movement',
        subfamily: 'safe',
        fluff: 'You move with perfect timing, slipping past openings without giving enemies a clean reaction window.',
        distances: [2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        effectFormatter: (m) => `Move up to **${m} m** along a legal ground path. This movement does not provoke movement-triggered Reactions.`,
    }),
    movementTemplate({
        id: 'movement-teleport',
        name: 'Teleport',
        subfamily: 'teleport',
        fluff: 'You fold distance and appear somewhere else without crossing the space between.',
        distances: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        effectFormatter: (m) => `Teleport up to **${m} m** to a visible legal space.`,
    }),
    movementTemplate({
        id: 'movement-teleport-with-ally',
        name: 'Teleport with Ally',
        subfamily: 'teleport',
        fluff: 'You fold distance around yourself and one nearby ally, pulling them through the same break in space.',
        distances: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 12, 12],
        effectFormatter: (m, lvl) =>
            lvl === 1
                ? '—'
                : `Teleport yourself and **one willing ally within 2 m** up to **${m} m** to visible legal spaces.`,
    }),
    movementTemplate({
        id: 'movement-flight',
        name: 'Flight',
        subfamily: 'flight',
        fluff: 'You lift from the ground and move through the air under your own power.',
        distances: [1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24],
        effectFormatter: (m) => `Fly up to **${m} m**.`,
    }),
    movementTemplate({
        id: 'movement-leap',
        name: 'Leap',
        subfamily: 'leap',
        fluff: 'You launch yourself in a powerful arc, crossing gaps or height that normal movement cannot handle.',
        distances: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 28, 28],
        effectFormatter: (m) => `Leap up to **${m} m** horizontally or **${Math.floor(m / 2)} m** vertically.`,
    }),
    movementTemplate({
        id: 'movement-wall-walk',
        name: 'Wall Walk',
        subfamily: 'wall-walk',
        fluff: 'You cling, crawl, run, or move across surfaces that normal movement cannot use.',
        distances: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 28, 28, 28, 28, 28],
        effectFormatter: (m) => `Move up to **${m} m** along walls, ceilings, or similar solid surfaces.`,
    }),
    movementTemplate({
        id: 'movement-burrow',
        name: 'Burrow',
        subfamily: 'burrow',
        fluff: 'You force your way through soft material beneath or around the battlefield.',
        distances: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        effectFormatter: (m) => `Burrow up to **${m} m** through suitable soft material.`,
    }),
    movementTemplate({
        id: 'movement-phase-passage',
        name: 'Phase Passage',
        subfamily: 'phase',
        fluff: 'You briefly become able to pass through matter, but only as movement, not as protection.',
        distances: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8],
        effectFormatter: (m, lvl) =>
            lvl === 1
                ? '—'
                : `Move through up to **${m} m** total thickness of solid material during this Movement.`,
    }),
    // Trample is special — offensive movement with fixed path damage. Encode
    // distance + damage dice per level and rely on effect.dice so the
    // aggregator can surface the impact die pool.
    (() => {
        const trampleDistances = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 24, 24, 24, 24, 24];
        const trampleDice = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
        return {
            templateId: 'movement-trample',
            templateName: 'Trample',
            name: 'Movement: Trample',
            subfamily: 'trample',
            category: 'movement' as const,
            tags: [],
            fluff: 'You turn movement itself into impact, crashing through enemies as you cross the battlefield.',
            cost: { action: 'movement' },
            roll: { kind: 'none' },
            levels: buildLevels((lvl) => ({
                type: 'Movement',
                range: { kind: 'self' },
                aoe: { shape: 'line', note: 'Path' },
                duration: { kind: 'instant' },
                effect: {
                    text: `Move up to **${trampleDistances[lvl - 1]} m**. Each creature you move through takes **${trampleDice[lvl - 1]}d8 damage**, once per creature.`,
                    dice: `${trampleDice[lvl - 1]}d8`,
                },
                specials: [],
                mechanics: {
                    movementBonus: trampleDistances[lvl - 1],
                    damageRider: { flat: `+${trampleDice[lvl - 1]}d8` },
                    applyWhen: 'attack-rider',
                    duration: 'instant',
                },
            })),
        } satisfies PowerTemplate;
    })(),
];
