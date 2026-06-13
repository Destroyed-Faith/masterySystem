/**
 * Tower Wizard — Build Role Matrix.
 *
 * Scores a finished 6-power package across five axes (Offense, Defense,
 * Control, Sustain, Mobility/Utility) and derives a radar/pentagon geometry
 * plus a short verdict (dominant archetype + focus/coherence).
 *
 * Pure module: no DOM, all trig done here so Handlebars only interpolates
 * precomputed coordinates.
 */

import { findCatalogEntry, findTemplateById } from '../../utils/power-catalog.js';
import type { PowerLevelKey } from '../../types/item.js';
import type { ReviewPowerRow } from './tower-wizard-types.js';

export type RoleAxisKey = 'offense' | 'defense' | 'control' | 'sustain' | 'mobility';

export interface RoleAxisScore {
    key: RoleAxisKey;
    label: string;
    score: number;
}

export interface RoleRadarLabel {
    x: number;
    y: number;
    anchor: 'start' | 'middle' | 'end';
    label: string;
    score: number;
}

export interface RoleRadarGeometry {
    size: number;
    center: number;
    gridPolygons: string[];
    axisLines: Array<{ x2: number; y2: number }>;
    dataPolygon: string;
    labels: RoleRadarLabel[];
}

export type RoleFocusKey = 'sharp' | 'balanced' | 'unfocused';

export interface BuildRoleRating {
    axes: RoleAxisScore[];
    radar: RoleRadarGeometry;
    directionLabel: string;
    focusKey: RoleFocusKey;
    focusLabel: string;
    summary: string;
}

/** Axis order around the pentagon, starting at the top and going clockwise. */
const AXIS_ORDER: RoleAxisKey[] = ['offense', 'control', 'mobility', 'sustain', 'defense'];

export const AXIS_LABELS: Record<RoleAxisKey, string> = {
    offense: 'Offense',
    defense: 'Defense',
    control: 'Control',
    sustain: 'Sustain',
    mobility: 'Mobility',
};

/** Per-axis saturation — raw points that map to a 100 score. Heuristic. */
const AXIS_SATURATION: Record<RoleAxisKey, number> = {
    offense: 12,
    defense: 12,
    control: 10,
    sustain: 10,
    mobility: 9,
};

const OFFENSIVE_ACTIVE_BUFFS = new Set([
    'ab-damage',
    'ab-penetration',
    'ab-critical',
    'ab-damage-penetration',
]);

const OFFENSIVE_SPECIALS = new Set([
    'bleeding', 'ignite', 'shock', 'poisoned', 'corrode', 'expose',
    'sundered', 'penetration', 'precision', 'smite', 'crit', 'soulburn',
]);

const CONTROL_SPECIALS = new Set([
    'stunned', 'stun', 'prone', 'frightened', 'root', 'freeze', 'blinded',
    'disarm', 'knockback', 'push', 'pull', 'hex', 'mark', 'weaken',
]);

const REPOSITION_SPECIALS = new Set(['push', 'pull', 'knockback']);
const DEFENSE_SPECIALS = new Set(['brace', 'bulwark', 'immovable']);

const DEFENSE_SUBFAMILIES = new Set(['armor', 'evade', 'damage-reduction']);
const OFFENSE_SUBFAMILIES = new Set(['damage-single', 'damage-aoe', 'weapon-attack', 'damage']);
const CONTROL_SUBFAMILIES = new Set(['control', 'hard-control', 'persistent-zone']);
const SUSTAIN_SUBFAMILIES = new Set(['temp-hp', 'regen', 'health', 'recovery']);
const MOBILITY_SUBFAMILIES = new Set(['phasing', 'illusion', 'barrier', 'awareness']);

type RawScores = Record<RoleAxisKey, number>;

function emptyScores(): RawScores {
    return { offense: 0, defense: 0, control: 0, sustain: 0, mobility: 0 };
}

interface RowFeatures {
    templateId: string;
    category: string;
    subfamily: string;
    specialKeys: string[];
    mechanics: Record<string, unknown>;
}

function extractFeatures(row: ReviewPowerRow): RowFeatures | null {
    const spec = row.spec;
    if (!spec?.templateId) return null;
    const entry = findCatalogEntry(spec.templateId, spec.special ?? null);
    const template = findTemplateById(spec.templateId);
    if (!entry || !template) return null;

    const levelKey = String(spec.rank) as PowerLevelKey;
    const levelRow = template.levels?.[levelKey];
    const mechanics = (levelRow?.mechanics ?? {}) as Record<string, unknown>;

    return {
        templateId: spec.templateId,
        category: entry.category,
        subfamily: entry.subfamily ?? '',
        specialKeys: entry.specialKeys ?? [],
        mechanics,
    };
}

function has(mech: Record<string, unknown>, key: string): boolean {
    const v = mech[key];
    if (v == null) return false;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v.trim() !== '' && v.trim() !== '0';
    if (typeof v === 'object') return true;
    return !!v;
}

function accumulate(scores: RawScores, f: RowFeatures): void {
    const mech = f.mechanics;
    const specials = new Set(f.specialKeys);
    const id = f.templateId;

    // Defense
    if (has(mech, 'armor')) scores.defense += 2;
    if (has(mech, 'evade')) scores.defense += 2;
    if (has(mech, 'damageReductionPct')) scores.defense += 3;
    if (DEFENSE_SUBFAMILIES.has(f.subfamily)) scores.defense += 2;
    for (const k of DEFENSE_SPECIALS) if (specials.has(k)) scores.defense += 2;

    // Offense
    if (has(mech, 'damageRider')) scores.offense += 2.5;
    if (has(mech, 'critical')) scores.offense += 3;
    if (OFFENSE_SUBFAMILIES.has(f.subfamily)) scores.offense += 2;
    if (f.category === 'active') scores.offense += 1;
    if (OFFENSIVE_ACTIVE_BUFFS.has(id)) scores.offense += 3;
    {
        let n = 0;
        for (const k of OFFENSIVE_SPECIALS) if (specials.has(k)) n += 1;
        scores.offense += Math.min(n, 2) * 1.5;
    }

    // Control
    {
        let n = 0;
        for (const k of CONTROL_SPECIALS) if (specials.has(k)) n += 1;
        scores.control += Math.min(n, 3) * 2;
    }
    if (CONTROL_SUBFAMILIES.has(f.subfamily)) scores.control += 2;

    // Sustain
    if (has(mech, 'regen')) scores.sustain += 3;
    if (has(mech, 'tempHP')) scores.sustain += 2.5;
    if (has(mech, 'healing')) scores.sustain += 3;
    if (SUSTAIN_SUBFAMILIES.has(f.subfamily)) scores.sustain += 2.5;
    if (specials.has('regeneration')) scores.sustain += 2;
    if (/heal|cleanse/.test(id)) scores.sustain += 2;

    // Mobility / Utility
    if (has(mech, 'movementBonus')) scores.mobility += 3;
    if (has(mech, 'phasing')) scores.mobility += 3;
    if (has(mech, 'initiativeD8')) scores.mobility += 2;
    if (MOBILITY_SUBFAMILIES.has(f.subfamily)) scores.mobility += 2.5;
    for (const k of REPOSITION_SPECIALS) if (specials.has(k)) scores.mobility += 1;
    if (/cleanse/.test(id)) scores.mobility += 2;

    // tempHP also reinforces a defensive lean
    if (has(mech, 'tempHP')) scores.defense += 1.5;
}

function normalize(raw: RawScores): RoleAxisScore[] {
    return AXIS_ORDER.map((key) => {
        const sat = AXIS_SATURATION[key];
        const score = Math.max(0, Math.min(100, Math.round((raw[key] / sat) * 100)));
        return { key, label: AXIS_LABELS[key], score };
    });
}

const RADAR_SIZE = 240;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 92;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1];

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

function axisAngle(index: number, total: number): number {
    // Start at top (-90deg), go clockwise.
    return (-90 + (index * 360) / total) * (Math.PI / 180);
}

function pointAt(angle: number, radius: number): { x: number; y: number } {
    return {
        x: round1(RADAR_CENTER + Math.cos(angle) * radius),
        y: round1(RADAR_CENTER + Math.sin(angle) * radius),
    };
}

function buildRadar(axes: RoleAxisScore[]): RoleRadarGeometry {
    const total = axes.length;

    const gridPolygons = GRID_LEVELS.map((level) =>
        axes
            .map((_, i) => {
                const p = pointAt(axisAngle(i, total), RADAR_RADIUS * level);
                return `${p.x},${p.y}`;
            })
            .join(' '),
    );

    const axisLines = axes.map((_, i) => {
        const p = pointAt(axisAngle(i, total), RADAR_RADIUS);
        return { x2: p.x, y2: p.y };
    });

    const dataPolygon = axes
        .map((axis, i) => {
            const p = pointAt(axisAngle(i, total), RADAR_RADIUS * (axis.score / 100));
            return `${p.x},${p.y}`;
        })
        .join(' ');

    const labels: RoleRadarLabel[] = axes.map((axis, i) => {
        const p = pointAt(axisAngle(i, total), RADAR_RADIUS + 16);
        let anchor: 'start' | 'middle' | 'end' = 'middle';
        if (p.x > RADAR_CENTER + 6) anchor = 'start';
        else if (p.x < RADAR_CENTER - 6) anchor = 'end';
        return { x: p.x, y: round1(p.y + 4), anchor, label: axis.label, score: axis.score };
    });

    return {
        size: RADAR_SIZE,
        center: RADAR_CENTER,
        gridPolygons,
        axisLines,
        dataPolygon,
        labels,
    };
}

const AXIS_ADJECTIVE: Record<RoleAxisKey, string> = {
    offense: 'Offensive',
    defense: 'Defensive',
    control: 'Controlling',
    sustain: 'Sustaining',
    mobility: 'Mobile',
};

const AXIS_NOUN: Record<RoleAxisKey, string> = {
    offense: 'damage dealer',
    defense: 'bulwark',
    control: 'controller',
    sustain: 'bruiser',
    mobility: 'skirmisher',
};

const AXIS_FULL_LABEL: Record<RoleAxisKey, string> = {
    offense: 'Offensive damage dealer',
    defense: 'Defensive bulwark',
    control: 'Battlefield controller',
    sustain: 'Resilient bruiser',
    mobility: 'Mobile skirmisher',
};

const FOCUS_LABELS: Record<RoleFocusKey, string> = {
    sharp: 'Klare Linie',
    balanced: 'Ausgewogen',
    unfocused: 'Unfokussiert',
};

function deriveVerdict(axes: RoleAxisScore[]): {
    directionLabel: string;
    focusKey: RoleFocusKey;
    focusLabel: string;
    summary: string;
} {
    const sorted = [...axes].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const second = sorted[1];
    const total = axes.reduce((sum, a) => sum + a.score, 0);

    let directionLabel: string;
    if (!top || top.score <= 0) {
        directionLabel = 'Undefined build';
    } else if (second && second.score > 0 && second.score >= top.score * 0.75) {
        directionLabel = `${AXIS_ADJECTIVE[second.key]} ${AXIS_NOUN[top.key]}`;
    } else {
        directionLabel = AXIS_FULL_LABEL[top.key];
    }

    let focusKey: RoleFocusKey;
    if (total <= 0) {
        focusKey = 'unfocused';
    } else {
        const topScore = top?.score ?? 0;
        const secondScore = second?.score ?? 0;
        const topShare = topScore / total;
        const gap = topScore - secondScore;
        const top2share = (topScore + secondScore) / total;
        // A clear single direction: one axis dominates by a real margin.
        if (gap >= 15 && topShare >= 0.3) focusKey = 'sharp';
        // Very even spread across the field: no real focus.
        else if (top2share <= 0.45) focusKey = 'unfocused';
        else focusKey = 'balanced';
    }

    let summary: string;
    if (!top || top.score <= 0) {
        summary = 'This build has no clear mechanical direction yet.';
    } else if (focusKey === 'sharp') {
        summary = `This build has a clear identity as a ${directionLabel.toLowerCase()}.`;
    } else if (focusKey === 'balanced') {
        summary = `A balanced ${directionLabel.toLowerCase()} with a solid secondary focus.`;
    } else {
        summary = 'A flexible all-rounder without a single clear focus.';
    }

    return { directionLabel, focusKey, focusLabel: FOCUS_LABELS[focusKey], summary };
}

/** Compute the full role rating (axes + radar geometry + verdict) for a build. */
export function computeBuildRoleRating(rows: ReviewPowerRow[]): BuildRoleRating {
    const raw = emptyScores();
    for (const row of rows) {
        const features = extractFeatures(row);
        if (features) accumulate(raw, features);
    }
    const axes = normalize(raw);
    const radar = buildRadar(axes);
    const verdict = deriveVerdict(axes);
    return { axes, radar, ...verdict };
}
