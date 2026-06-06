/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Read-friendly summary (slot / profile / level, Base Values) plus a read-only
 * Progression tab. Abilities are generated from the Level 1/2/3 picks in the
 * Artifact Builder node editor — this sheet never edits embedded powers.
 */
import { ARTIFACT_SLOT_LABELS, BASE_PROFILE_LABELS, BASE_VALUE_TYPE_LABELS, } from '../utils/artifact-rules.js';
export class ArtifactSheetV2 extends foundry.appv1.sheets.ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['mastery-system', 'sheet', 'item', 'artifact-sheet-v2'],
            width: 700,
            height: 800,
            resizable: true,
            submitOnChange: true,
            closeOnSubmit: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'description'
                }
            ]
        });
    }
    /** @override */
    get template() {
        return 'systems/mastery-system/templates/item/artifact-sheet-v2.hbs';
    }
    /** @override */
    getData(options) {
        const context = super.getData(options);
        const item = this.item;
        const system = item.system;
        // ---- Read-friendly summary (what the artifact is + what it does) ----
        const slotKey = String(system.slot || '');
        const profileKey = String(system.baseProfile || '');
        const currentLevel = Math.max(1, Math.min(10, Number(system.currentLevel) || Number(system.level) || 1));
        const baseValueRows = (Array.isArray(system.baseValues) ? system.baseValues : []).map((bv) => ({
            slot: String(bv.slot || '').toUpperCase(),
            typeLabel: BASE_VALUE_TYPE_LABELS[bv.type] || bv.type || '',
            label: bv.label || '',
            value: bv.value != null && bv.value !== '' ? String(bv.value) : bv.note || '',
        }));
        const abilities = (Array.isArray(system.levelProgression) ? system.levelProgression : [])
            .slice()
            .sort((a, b) => (Number(a?.level) || 0) - (Number(b?.level) || 0))
            .map((row) => ({
            level: Number(row.level) || 1,
            name: row.name || '',
            type: row.type || '',
            effect: row.effect || '',
            special: row.special || '',
            unlocked: (Number(row.level) || 1) <= currentLevel,
        }));
        context.item = item;
        context.system = system;
        context.isEditable = this.isEditable;
        context.summary = {
            slotLabel: ARTIFACT_SLOT_LABELS[slotKey] || '',
            baseProfileLabel: BASE_PROFILE_LABELS[profileKey] || '',
            currentLevel,
            baseValues: baseValueRows,
            abilities,
            hasAbilities: abilities.length > 0,
            hasBaseValues: baseValueRows.length > 0,
        };
        return context;
    }
}
//# sourceMappingURL=artifact-sheet-v2.js.map