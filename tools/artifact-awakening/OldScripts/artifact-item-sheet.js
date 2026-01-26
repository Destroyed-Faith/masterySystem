import {ThreadPoints} from "./threadpoints.js";

export class ArtifactItemSheet extends ItemSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["artifact-awakening", "sheet", "item"],
            width: 600,
            height: 500,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
        });
    }

    get template() {
        return "modules/artifact-awakening/templates/artifact-item-sheet.hbs";
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".level-up-button").click(this._onLevelUp.bind(this));

        // --- Drop-Zone Event ---
        html.find(".activity-drop-area").on("drop", this._onDropItem.bind(this));

        // --- Plus-Button ---
        html.find(".activity-add-button").click(ev => {
            this._openActivityDialog();
        });


        if (this.isEditable) {
            this._onDrop = this._onDropItem.bind(this);
            html[0].addEventListener("drop", this._onDrop);
        }
        html.find(".level-up-button").click(this._onLevelUp.bind(this));

        html.find(".edit-description").click(ev => {
            const button = $(ev.currentTarget);
            const target = button.data("target");
            const currentContent = foundry.utils.getProperty(this.item.system, target.split('.').slice(1).join('.')) || "";

            TextEditor.enrichHTML(currentContent).then(enrichedContent => {

                new Dialog({
                    title: "Edit Description",
                    content: `
                    <form>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="custom-editor-content" rows="10" style="width:100%;">${currentContent}</textarea>
                        </div>
                    </form>
                `,
                    buttons: {
                        save: {
                            label: "Save",
                            callback: html => {
                                const newValue = html.find("#custom-editor-content").val();
                                this.item.update({ [target]: newValue });
                            }
                        },
                        cancel: {
                            label: "Cancel"
                        }
                    }
                }).render(true);
            });
        });
    }

    // GANZ WICHTIG: Editor-Registrierung für eigene Felder
    activateEditor(name, options = {}, initialContent = "") {
        const editors = [
            "system.description.value",
            "system.description.unidentified",
            "system.description.chat"
        ];

        if (editors.includes(name)) {
            const selector = `textarea[name="${name}"]`;
            options.target = selector;
            console.log(`Registering editor for ${name} on ${selector}`);
        }

        return super.activateEditor(name, options, initialContent);
    }

    async _onLevelUp(event) {
        event.preventDefault();
        const item = this.item;
        const actor = item.actor;

        if (!actor) {
            ui.notifications.warn("This item must be owned by an Actor to level up.");
            return;
        }

        const success = await ThreadPoints.spend(actor, 1);
        if (success) {
            await item.update({"system.level": item.system.level + 1});
            ui.notifications.info(`${item.name} leveled up to Level ${item.system.level}!`);
        }
    }

    async _onDropItem(event) {
        event.preventDefault();
        event.stopPropagation();

        const data = await TextEditor.getDragEventData(event);
        if (!data) return;

        // Beispiel: wir erlauben nur Feats oder Spells (oder du kannst alles zulassen)
        if (data.type !== "Item") return;

        const itemData = data.data;

        console.log("Dropped Item:", itemData);

        // Hier kannst du später noch Filter hinzufügen, falls nur bestimmte Typen erlaubt sein sollen
        await this.item.update({
            "system.skills": [...(this.item.system.skills || []), {
                name: itemData.name,
                description: itemData.system.description?.value || "",
                unlockLevel: 1, // Standardmäßig freischalten auf Level 1
                type: itemData.type
            }]
        });

        // Re-render das Sheet
        this.render(true);
    }

    _openActivityDialog() {
        const types = [
            "attack",
            "check",
            "damage",
            "enchant",
            "heal",
            "save",
            "summon",
            "utility"
        ];

        let options = types.map(t => `
        <div class="activity-radio">
            <label>
                <input type="radio" name="activity-type" value="${t}" ${t === "utility" ? "checked" : ""}>
                ${t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
        </div>
    `).join("");

        new Dialog({
            title: "Create New Activity",
            content: `
            <form>
                <div class="form-group">
                    <input type="text" name="activity-name" placeholder="Activity Name" style="width: 100%;" />
                </div>
                <hr>
                <div class="form-group">
                    <div class="activity-radio-group">
                        ${options}
                    </div>
                </div>
            </form>
        `,
            buttons: {
                create: {
                    label: "Create",
                    callback: html => {
                        let name = html.find('[name="activity-name"]').val().trim();
                        const type = html.find('[name="activity-type"]:checked').val();

                        // Wenn kein Name, nutze den Typ
                        if (!name) name = type.charAt(0).toUpperCase() + type.slice(1);

                        const actions = this.item.system.actions || [];
                        actions.push({
                            name: name,
                            type: type,
                            description: ""
                        });
                        console.log("Vor Update - aktuelle actions:", this.item.system.actions);
                        console.log("Adding action:", name, type);
                        this.item.update({"system.actions": actions}).then(() => {
                            this.render(true);
                        });
                    }
                },
            },
            default: "create"
        }).render(true);
    }


}

