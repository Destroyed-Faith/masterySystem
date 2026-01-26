export class ArtifactLevelEditor extends FormApplication {

    constructor(parentBuilder, level, options = {}) {
        super({}, options);
        this.parentBuilder = parentBuilder;
        this.level = level;
        this.artifact = parentBuilder.artifact;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "artifact-level-editor",
            title: "Activities for Level",
            template: "modules/artifact-awakening/templates/artifact-level-editor.hbs",
            width: 700, // vorher evtl. 600
            height: 600, // z. B. 600 oder "auto"
            classes: ["artifact-awakening"],
            resizable: true // <<< Wichtig!
        });
    }

    getData() {
        return {
            level: this.level,
            activities: this.artifact.activities
                .map((act, realIndex) => ({...act, originalIndex: realIndex}))
                .filter(act => act.levels.includes(this.level))
        };
    }
    activateListeners(html) {
        super.activateListeners(html);

        html.find("#add-activity").click(ev => {
            ev.preventDefault();
            this._openActivityTypeDialog();
        });

        html.find(".remove-activity").click(ev => {
            const index = parseInt($(ev.currentTarget).data("index"));
            this.artifact.activities.splice(index, 1);
            // this.render(); ← das NICHT!
            this.close();
            ArtifactLevelEditor.open(this.parentBuilder, this.level);
        });

        html.find(".edit-activity").click(ev => {
            const index = parseInt($(ev.currentTarget).data("index"));
            this._openActivitySheet(index);
        });

        html.find(".copy-activity").click(ev => {
            ev.stopPropagation();
            const index = parseInt($(ev.currentTarget).data("index"));
            if (!isNaN(index)) this._copyActivity(index);
        });

        html.find(".remove-activity").click(ev => {
            ev.stopPropagation();
            const index = parseInt($(ev.currentTarget).data("index"));
            if (!isNaN(index)) {
                this.artifact.activities.splice(index, 1);
                this.close();
                ArtifactLevelEditor.open(this.parentBuilder, this.level);
            }
        });


    }

    async _openActivityTypeDialog() {
        const activityType = await new Promise((resolve) => {
            new Dialog({
                title: `Select Activity Type for Level ${this.level}`,
                content: `
                    <form>
                        <div class="form-group">
                            <label>Activity Type</label>
                            <select name="activityType">
                                <option value="attack">Attack</option>
                                <option value="check">Check</option>
                                <option value="damage">Damage</option>
                                <option value="enchant">Enchant</option>
                                <option value="heal">Heal</option>
                                <option value="save">Save</option>
                                <option value="summon">Summon</option>
                                <option value="utility">Utility</option>
                            </select>
                        </div>
                    </form>`,
                buttons: {
                    ok: {
                        label: "OK",
                        callback: html => {
                            const type = html.find("[name='activityType']").val();
                            resolve(type);
                        }
                    }
                }
            }).render(true);
        });

        const dummyItem = new CONFIG.Item.documentClass({
            name: `Artifact Activity (${activityType})`,
            type: "feat"
        }, {parent: null});

        dummyItem.sheet.render(true);

        this.artifact.activities.push({
            label: `Activity (${activityType})`,
            levels: [this.level],
            itemData: dummyItem.toObject()
        });

        this.close();
        ArtifactLevelEditor.open(this.parentBuilder, this.level);
    }

    async _openActivitySheet(index) {
        const activity = this.artifact.activities[index];

        if (!activity) {
            ui.notifications.error(`Activity at index ${index} does not exist.`);
            return;
        }

        if (!activity.itemData) {
            ui.notifications.error(`Activity at index ${index} has no item data.`);
            return;
        }

        const activityData = activity.itemData;

        const dummyItem = new CONFIG.Item.documentClass(activityData, {parent: null});
        dummyItem.sheet.render(true);
    }

    async _updateObject() {
        // Updates are live in parentBuilder.artifact → no action here
    }
    async _copyActivity(index) {
        const sourceActivity = this.artifact.activities[index];
        const type = sourceActivity.itemData.system?.type || "utility";

        // 1️⃣ Ziel-Level abfragen
        const targetLevel = await new Promise((resolve) => {
            new Dialog({
                title: "Copy Activity to Another Level",
                content: `
                <form>
                    <div class="form-group">
                        <label>Target Level</label>
                        <select name="targetLevel">
                            ${[...Array(10).keys()].map(lvl =>
                    `<option value="${lvl + 1}">${lvl + 1}</option>`
                ).join("")}
                        </select>
                    </div>
                </form>`,
                buttons: {
                    ok: {
                        label: "Next",
                        callback: html => {
                            const lvl = parseInt(html.find("[name='targetLevel']").val());
                            resolve(lvl);
                        }
                    }
                }
            }).render(true);
        });

        // 2️⃣ Aktuelle Werte auslesen
        let currentBonusToHit = sourceActivity.modifiers?.bonusToHit || 0;
        let currentBonusDamage = sourceActivity.modifiers?.bonusDamage || 0;
        let currentExtraDice = sourceActivity.modifiers?.extraDice || 0;
        let currentDiceType = sourceActivity.modifiers?.diceType || "";

        let currentAmount = sourceActivity.modifiers?.newAmount || 0;
        let currentDC = sourceActivity.modifiers?.newDC || 0;
        let currentSaveDamage = sourceActivity.modifiers?.saveDamage || "";

        // 3️⃣ Anpassungsdialog vorbereiten
        let extraFields = "";

        if (type === "attack") {
            extraFields = `
            <div class="form-group">
                <label>Bonus to Hit (current: ${currentBonusToHit})</label>
                <input type="number" name="bonusToHit" value="0">
            </div>
            <div class="form-group">
                <label>Bonus Damage (current: ${currentBonusDamage})</label>
                <input type="number" name="bonusDamage" value="0">
            </div>
            <div class="form-group">
                <label>Extra Dice (Number, current: ${currentExtraDice})</label>
                <input type="number" name="extraDice" value="0">
            </div>
            <div class="form-group">
                <label>Dice Type (current: ${currentDiceType || "none"})</label>
                <select name="diceType">
                    <option value="">None</option>
                    <option value="d4">d4</option>
                    <option value="d6">d6</option>
                    <option value="d8">d8</option>
                    <option value="d10">d10</option>
                    <option value="d12">d12</option>
                </select>
            </div>
        `;
        }

        if (type === "damage" || type === "heal") {
            extraFields = `
            <div class="form-group">
                <label>New Amount (current: ${currentAmount})</label>
                <input type="number" name="newAmount" value="0">
            </div>
            <div class="form-group">
                <label>Dice Type (current: ${currentDiceType || "none"})</label>
                <select name="diceType">
                    <option value="">None</option>
                    <option value="d4">d4</option>
                    <option value="d6">d6</option>
                    <option value="d8">d8</option>
                    <option value="d10">d10</option>
                    <option value="d12">d12</option>
                </select>
            </div>
        `;
        }

        if (type === "save") {
            extraFields = `
            <div class="form-group">
                <label>New Save DC (current: ${currentDC})</label>
                <input type="number" name="newDC" value="0">
            </div>
            <div class="form-group">
                <label>Save Damage (current: ${currentSaveDamage || "none"})</label>
                <input type="text" name="saveDamage" value="">
            </div>
        `;
        }

        // Wenn der Typ keinen Modifikationsdialog hat, direkt kopieren
        let modifiers = {};

        if (["attack", "damage", "heal", "save"].includes(type)) {

            // 4️⃣ Anpassungsdialog anzeigen
            modifiers = await new Promise((resolve) => {
                new Dialog({
                    title: "Adjust Modifiers",
                    content: `<form>${extraFields}</form>`,
                    buttons: {
                        ok: {
                            label: "Copy Activity",
                            callback: html => {
                                let mods = {};

                                if (type === "attack") {
                                    mods.bonusToHit = parseInt(html.find("[name='bonusToHit']").val()) || 0;
                                    mods.bonusDamage = parseInt(html.find("[name='bonusDamage']").val()) || 0;
                                    mods.extraDice = parseInt(html.find("[name='extraDice']").val()) || 0;
                                    mods.diceType = html.find("[name='diceType']").val();
                                }

                                if (type === "damage" || type === "heal") {
                                    mods.newAmount = parseInt(html.find("[name='newAmount']").val()) || 0;
                                    mods.diceType = html.find("[name='diceType']").val();
                                }

                                if (type === "save") {
                                    mods.newDC = parseInt(html.find("[name='newDC']").val()) || 0;
                                    mods.saveDamage = html.find("[name='saveDamage']").val();
                                }

                                resolve(mods);
                            }
                        }
                    }
                }).render(true);
            });
        }

        // 5️⃣ Kopieren und speichern
        const newActivity = {
            label: sourceActivity.label,
            levels: [targetLevel],
            itemData: foundry.utils.duplicate(sourceActivity.itemData),
            modifiers: modifiers
        };

        newActivity.itemData.name = `${sourceActivity.itemData.name} (Lv ${targetLevel})`;

        this.artifact.activities.push(newActivity);

        ui.notifications.info(`Activity copied to Level ${targetLevel}`);

        this.close();
        ArtifactLevelEditor.open(this.parentBuilder, this.level);
    }

    static open(parentBuilder, level) {
        new ArtifactLevelEditor(parentBuilder, level).render(true);
    }


}
