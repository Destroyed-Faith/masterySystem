/**
 * Stone Regeneration Dialog
 *
 * Shown at the start of each round for PCs to allocate their
 * Mastery Rank worth of stone regeneration across attributes
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class StoneRegenDialog extends BaseDialog {
    actor;
    regenPoints;
    allocation;
    resolve;
    static DEFAULT_OPTIONS = {
        id: "mastery-stone-regen",
        classes: ["mastery-system", "stone-regen-dialog"],
        position: { width: 500 },
        window: { title: "Stone Regeneration", resizable: false }
    };
    static PARTS = {
        content: { template: "systems/mastery-system/templates/dialogs/stone-regen.hbs" }
    };
    /**
     * Show stone regen dialog for an actor
     */
    static async showForActor(actor, regenPoints) {
        return new Promise(resolve => {
            const app = new StoneRegenDialog(actor, regenPoints, resolve);
            app.render({ force: true });
        });
    }
    constructor(actor, regenPoints, resolve) {
        super({});
        this.actor = actor;
        this.regenPoints = regenPoints;
        this.resolve = resolve;
        // Initialize allocation to 0 for all attributes
        this.allocation = {
            might: 0,
            agility: 0,
            vitality: 0,
            intellect: 0,
            resolve: 0,
            influence: 0
        };
    }
    async _prepareContext(_options) {
        const system = this.actor.system;
        const stonePools = system.stonePools || {};
        const attributes = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
        const pools = attributes.map(attr => {
            const pool = stonePools[attr] || { current: 0, max: 0, sustained: 0 };
            const effectiveMax = pool.max - (pool.sustained || 0);
            const canRegen = pool.current < effectiveMax;
            return {
                key: attr,
                name: attr.charAt(0).toUpperCase() + attr.slice(1),
                current: pool.current,
                max: pool.max,
                sustained: pool.sustained || 0,
                effectiveMax,
                allocated: this.allocation[attr],
                canRegen
            };
        });
        const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
        const remaining = this.regenPoints - totalAllocated;
        return {
            actor: this.actor,
            regenPoints: this.regenPoints,
            pools,
            totalAllocated,
            remaining,
            canConfirm: remaining === 0
        };
    }
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        const root = this.element;
        // + buttons
        root.querySelectorAll('.js-add-point').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const attr = btn.dataset.attribute;
                if (!attr)
                    return;
                const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
                if (totalAllocated >= this.regenPoints) {
                    ui.notifications.warn('All regen points allocated!');
                    return;
                }
                const system = this.actor.system;
                const pool = system.stonePools?.[attr] || { current: 0, max: 0, sustained: 0 };
                const effectiveMax = pool.max - (pool.sustained || 0);
                const newValue = pool.current + this.allocation[attr] + 1;
                if (newValue > effectiveMax) {
                    ui.notifications.warn(`Cannot exceed ${effectiveMax} ${attr} stones!`);
                    return;
                }
                this.allocation[attr]++;
                await this.render({ force: true });
            };
        });
        // - buttons
        root.querySelectorAll('.js-remove-point').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const attr = btn.dataset.attribute;
                if (!attr)
                    return;
                if (this.allocation[attr] > 0) {
                    this.allocation[attr]--;
                    await this.render({ force: true });
                }
            };
        });
        // Confirm button
        const confirmBtn = root.querySelector('.js-confirm');
        if (confirmBtn) {
            confirmBtn.onclick = async (ev) => {
                ev.preventDefault();
                const totalAllocated = Object.values(this.allocation).reduce((sum, val) => sum + val, 0);
                if (totalAllocated !== this.regenPoints) {
                    ui.notifications.warn(`You must allocate all ${this.regenPoints} regen points!`);
                    return;
                }
                if (this.resolve) {
                    this.resolve(this.allocation);
                    this.resolve = undefined;
                }
                await this.close({ closeSource: "button" });
            };
        }
        // Skip button
        const skipBtn = root.querySelector('.js-skip');
        if (skipBtn) {
            skipBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.resolve) {
                    this.resolve(null); // No regen
                    this.resolve = undefined;
                }
                await this.close({ closeSource: "button" });
            };
        }
    }
    async _onClose(_options) {
        if (this.resolve) {
            this.resolve(null);
            this.resolve = undefined;
        }
        return super._onClose(_options);
    }
}
//# sourceMappingURL=stone-regen-dialog.js.map