/**
 * Scene Controls → "Lighting" group (GM).
 *
 * Mode buttons AUTO / DAY / DIM / NIGHT / DARK persist on the scene and
 * re-render immediately; the group title reads e.g.
 * "Lighting: AUTO — Fourth Watch → NIGHT". Light-source buttons put a
 * mundane light profile on the selected tokens using Foundry's native token
 * light. A small field in the Scene Configuration edits the same flag.
 */
import { LIGHTING_MODES, LIGHTING_MODE_LABEL, LIGHTING_STATE_ICON, LIGHTING_STATE_LABEL, lightingStateForManualMode, } from './scene-lighting.js';
import { getSceneLightingMode, getSceneLightingStatus, LIGHTING_MODE_FLAG, setSceneLightingMode, } from './scene-lighting-foundry.js';
import { foundryLightDataForProfile, foundryLightDataOff, isLightSourceProfileId, LIGHT_SOURCE_PROFILE_IDS, LIGHT_SOURCE_PROFILES, } from './light-sources.js';
function g() {
    return globalThis;
}
function viewedScene() {
    return g().canvas?.scene ?? g().game?.scenes?.viewed ?? null;
}
function modeIcon(mode) {
    if (mode === 'auto')
        return 'fas fa-clock';
    const state = lightingStateForManualMode(mode);
    return state ? LIGHTING_STATE_ICON[state] : 'fas fa-adjust';
}
function modeTitle(mode, current) {
    const state = lightingStateForManualMode(mode);
    const detail = mode === 'auto'
        ? 'derive from the current Watch'
        : `force ${LIGHTING_STATE_LABEL[state]} (${state === 'daylight' ? 60 : state === 'dim' ? 30 : state === 'night' ? 8 : 0} m visual range)`;
    return `${mode === current ? '● ' : ''}Lighting ${LIGHTING_MODE_LABEL[mode]} — ${detail}`;
}
async function handleSetMode(mode) {
    if (!g().game?.user?.isGM) {
        g().ui?.notifications?.warn?.('Only the GM can change scene lighting.');
        return;
    }
    const scene = viewedScene();
    if (!scene) {
        g().ui?.notifications?.warn?.('No active scene.');
        return;
    }
    const status = await setSceneLightingMode(scene, mode);
    if (status)
        g().ui?.notifications?.info?.(status.label);
    try {
        g().ui?.controls?.render?.();
    }
    catch {
        /* ignore */
    }
}
function selectedTokenDocs() {
    const controlled = g().canvas?.tokens?.controlled ?? [];
    return controlled.map((t) => t?.document).filter(Boolean);
}
async function handleLightSource(profileId) {
    const docs = selectedTokenDocs();
    if (!docs.length) {
        g().ui?.notifications?.warn?.('Select one or more tokens first.');
        return;
    }
    const light = profileId === 'off' ? foundryLightDataOff() : foundryLightDataForProfile(LIGHT_SOURCE_PROFILES[profileId]);
    const label = profileId === 'off' ? 'no light source' : LIGHT_SOURCE_PROFILES[profileId].label;
    let n = 0;
    for (const doc of docs) {
        try {
            await doc.update({ light });
            n += 1;
        }
        catch (err) {
            console.warn('Mastery System | token light update failed', err);
        }
    }
    if (n)
        g().ui?.notifications?.info?.(`${n} token(s): ${label}.`);
}
export function buildLightingSceneControl(isGM) {
    const scene = viewedScene();
    const current = getSceneLightingMode(scene);
    const status = getSceneLightingStatus(scene);
    const tools = LIGHTING_MODES.map((mode) => ({
        name: `lighting-${mode}`,
        title: modeTitle(mode, current),
        icon: modeIcon(mode),
        visible: isGM,
        button: true,
        onClick: () => void handleSetMode(mode),
    }));
    for (const id of LIGHT_SOURCE_PROFILE_IDS) {
        const p = LIGHT_SOURCE_PROFILES[id];
        tools.push({
            name: `light-${id}`,
            title: `${p.label} on selected tokens — Bright ${p.brightM} m / Dim ${p.dimM} m`,
            icon: p.icon,
            visible: isGM,
            button: true,
            onClick: () => void handleLightSource(id),
        });
    }
    tools.push({
        name: 'light-off',
        title: 'Remove light source from selected tokens',
        icon: 'fas fa-ban',
        visible: isGM,
        button: true,
        onClick: () => void handleLightSource('off'),
    });
    return {
        name: 'masteryLighting',
        title: status.label,
        icon: status.state ? LIGHTING_STATE_ICON[status.state] : 'fas fa-adjust',
        layer: 'TokenLayer',
        tools,
        activeTool: '',
        visible: isGM,
        restricted: true,
    };
}
/** Click routing for Foundry builds that ignore `tool.onClick` on buttons. */
export function handleLightingToolClick(toolName) {
    if (toolName.startsWith('lighting-')) {
        const mode = toolName.slice('lighting-'.length);
        if (LIGHTING_MODES.includes(mode)) {
            void handleSetMode(mode);
            return true;
        }
        return false;
    }
    if (toolName === 'light-off') {
        void handleLightSource('off');
        return true;
    }
    if (toolName.startsWith('light-')) {
        const id = toolName.slice('light-'.length);
        if (isLightSourceProfileId(id)) {
            void handleLightSource(id);
            return true;
        }
    }
    return false;
}
/** Scene Configuration: a select bound to the same flag (persistent setting). */
export function injectSceneConfigLightingField(app, html) {
    try {
        const root = html instanceof HTMLElement ? html : html?.[0] ?? app?.element ?? null;
        if (!root)
            return;
        if (root.querySelector('[name="flags.mastery-system.lightingMode"]'))
            return;
        const scene = app?.document ?? app?.object ?? null;
        const current = getSceneLightingMode(scene);
        const options = LIGHTING_MODES.map((m) => `<option value="${m}" ${m === current ? 'selected' : ''}>${LIGHTING_MODE_LABEL[m]}${m === 'auto' ? ' (from Watch)' : ''}</option>`).join('');
        const field = document.createElement('div');
        field.className = 'form-group ms-scene-lighting-field';
        field.innerHTML = `<label>Mastery Lighting</label>
      <div class="form-fields"><select name="flags.mastery-system.${LIGHTING_MODE_FLAG}">${options}</select></div>
      <p class="hint">AUTO follows the current Watch (First/Second → Daylight, Third → Dim Light, Fourth → Night). Manual modes override it. Visual range: 60 / 30 / 8 / 0 m.</p>`;
        const form = root.querySelector('form') ?? root;
        const anchor = form.querySelector('[name="environment.darknessLevel"], [name="darkness"]')?.closest('.form-group') ?? null;
        if (anchor?.parentElement)
            anchor.parentElement.insertBefore(field, anchor);
        else {
            const footer = form.querySelector('footer, .form-footer');
            if (footer?.parentElement)
                footer.parentElement.insertBefore(field, footer);
            else
                form.appendChild(field);
        }
    }
    catch (err) {
        console.warn('Mastery System | scene config lighting field failed', err);
    }
}
let registered = false;
export function initializeLightingSceneControls() {
    if (registered)
        return;
    registered = true;
    const Hooks = g().Hooks;
    if (!Hooks?.on)
        return;
    Hooks.on('getSceneControlButtons', (controls) => {
        const isGM = !!g().game?.user?.isGM;
        if (!isGM)
            return;
        const control = buildLightingSceneControl(isGM);
        if (Array.isArray(controls))
            controls.push(control);
        else
            controls.masteryLighting = control;
    });
    Hooks.on('renderSceneConfig', (app, html) => injectSceneConfigLightingField(app, html));
}
//# sourceMappingURL=lighting-scene-controls.js.map