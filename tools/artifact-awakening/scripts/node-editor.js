import { ActivityEditor } from "./activity-editor.js";

export class NodeEditor {

    static show(node, parentApp) {

        const bonusKeyMap = {
            "Stärke": "system.abilities.str.value",
            "Geschicklichkeit": "system.abilities.dex.value",
            "Konstitution": "system.abilities.con.value",
            "Intelligenz": "system.abilities.int.value",
            "Weisheit": "system.abilities.wis.value",
            "Charisma": "system.abilities.cha.value",

            "Stärke RW Bonus": "system.abilities.str.bonuses.save",
            "Geschicklichkeit RW Bonus": "system.abilities.dex.bonuses.save",
            "Konstitution RW Bonus": "system.abilities.con.bonuses.save",
            "Intelligenz RW Bonus": "system.abilities.int.bonuses.save",
            "Weisheit RW Bonus": "system.abilities.wis.bonuses.save",
            "Charisma RW Bonus": "system.abilities.cha.bonuses.save",

            "Alle RW Boni": "system.bonuses.abilities.save",
            "Alle Fähigkeitswurf Boni": "system.bonuses.abilities.check",

            "Initiative Bonus": "system.attributes.init.bonus",
            "Rüstungsklasse Bonus": "system.attributes.ac.bonus",

            "Angriffsbonus Nahkampf Waffen": "system.bonuses.mwak.attack",
            "Angriffsbonus Fernkampf Waffen": "system.bonuses.rwak.attack",
            "Angriffsbonus Nahkampf Zauber": "system.bonuses.msak.attack",
            "Angriffsbonus Fernkampf Zauber": "system.bonuses.rsak.attack",

            "Schadensbonus Nahkampf Waffen": "system.bonuses.mwak.damage",
            "Schadensbonus Fernkampf Waffen": "system.bonuses.rwak.damage",
            "Schadensbonus Nahkampf Zauber": "system.bonuses.msak.damage",
            "Schadensbonus Fernkampf Zauber": "system.bonuses.rsak.damage",

            "Zauber SG Bonus": "system.bonuses.spell.dc",

            "Maximale temporäre Trefferpunkte": "system.attributes.hp.tempmax",
            "TP Bonus pro Stufe": "system.attributes.hp.bonuses.level",
            "TP Bonus gesamt": "system.attributes.hp.bonuses.overall",

            "Bewegung Geschwindigkeit (Laufen)": "system.attributes.movement.walk",
            "Bewegung Geschwindigkeit (Fliegen)": "system.attributes.movement.fly",
            "Bewegung Geschwindigkeit (Schwimmen)": "system.attributes.movement.swim",
            "Bewegung Geschwindigkeit (Klettern)": "system.attributes.movement.climb",
            "Bewegung Geschwindigkeit (Graben)": "system.attributes.movement.burrow"
        };

        const changeModeMap = {
            "Addieren": "add",
            "Multiplizieren": "multiply",
            "Überschreiben": "override",
            "Upgrade": "upgrade",
            "Downgrade": "downgrade"
        };

        const item = game.items.get(node.id);
        if (!item) {
            ui.notifications.error("Item nicht gefunden! Kann Node nicht editieren.");
            return;
        }

        const bonuses = item.getFlag("artifact-awakening", "bonuses") || [];
        const existingEffects = item.effects || [];
        for (let effect of existingEffects) {
            for (let change of effect.changes) {
                // Ist das ein bekannter Bonus-Key?
                if (Object.values(bonusKeyMap).includes(change.key)) {
                    // Schon in den bonuses?
                    const alreadyInBonuses = bonuses.some(b => b.key === change.key);
                    if (!alreadyInBonuses) {
                        bonuses.push({
                            key: change.key,
                            mode: Object.entries(CONST.ACTIVE_EFFECT_MODES).find(([k,v]) => v === change.mode)?.[0].toLowerCase() || "add",
                            value: change.value
                        });
                    }
                }
            }
        }
        const usedKeys = bonuses.map(b => b.key);

        let bonusHTML = bonuses.length ? bonuses.map((b, i) => `
            <div class="bonus-entry" style="display: flex; gap: 0.5em; align-items: center;" data-index="${i}">
                <select class="bonus-key">
                    ${Object.entries(bonusKeyMap).map(([label, key]) => `
                        <option value="${key}" ${b.key === key ? "selected" : (usedKeys.includes(key) && b.key !== key ? "disabled" : "")}>${label}</option>
                    `).join("")}
                </select>
                <select class="bonus-mode">
                    ${Object.entries(changeModeMap).map(([label, mode]) => `
                        <option value="${mode}" ${b.mode === mode ? "selected" : ""}>${label}</option>
                    `).join("")}
                </select>
                <input type="text" class="bonus-value" value="${b.value}">
               <a class="create-effect" style="cursor: pointer;" title="Active Effect erstellen"><i class="fas fa-magic"></i></a>
               <a class="delete-bonus" style="cursor: pointer;" title="Bonus löschen"><i class="fas fa-trash"></i></a>
            </div>
        `).join("") : "<p>Keine Boni vorhanden.</p>";

        const bonusAddHTML = `
            <hr>
            <button type="button" id="add-bonus">+ Bonus hinzufügen</button>
            <br>
            <button type="button" id="open-item" style="margin-top: 0.5em;">Item öffnen</button>
        `;

        const content = `
            <h2>Node: ${node.name}</h2>

            <h3>Passive Boni</h3>
            <div id="bonus-container">
                ${bonusHTML}
            </div>
            ${bonusAddHTML}
        `;

        const dlg = new Dialog({
            title: `Node Editor: ${node.name}`,
            content: content,
            buttons: {
                save: {
                    label: "Speichern",
                    callback: async html => {
                        const newBonuses = [];
                        html.find(".bonus-entry").each((i, el) => {
                            const key = $(el).find(".bonus-key").val();
                            const mode = $(el).find(".bonus-mode").val();
                            const value = $(el).find(".bonus-value").val();
                            if (key && mode && value) {
                                newBonuses.push({ key, mode, value });
                            }
                        });

                        await item.update({ "flags.artifact-awakening.bonuses": newBonuses });

                        parentApp.render(true);
                    }
                }
            },
            render: html => {
                const win = html.closest(".window-app");
                win.attr("id", "artifact-node-editor");
                win.css({ "width": "520px", "height": "500px" });

                // Bonus hinzufügen
                html.find("#add-bonus").on("click", () => {

                    // Aktuelle benutzte Keys aktualisieren
                    const currentKeys = [];
                    html.find(".bonus-key").each((i, el) => {
                        const val = $(el).val();
                        if (val) currentKeys.push(val);
                    });

                    const newEntry = `
                        <div class="bonus-entry" style="display: flex; gap: 0.5em; align-items: center;">
                            <select class="bonus-key">
                                ${Object.entries(bonusKeyMap).map(([label, key]) => `
                                    <option value="${key}" ${currentKeys.includes(key) ? "disabled" : ""}>${label}</option>
                                `).join("")}
                            </select>
                            <select class="bonus-mode">
                                ${Object.entries(changeModeMap).map(([label, mode]) => `
                                    <option value="${mode}">${label}</option>
                                `).join("")}
                            </select>
                            <input type="text" class="bonus-value" value="">
                            <a class="create-effect" style="cursor: pointer;" title="Active Effect erstellen"><i class="fas fa-magic"></i></a>
                            <a class="delete-bonus" style="cursor: pointer;" title="Bonus löschen"><i class="fas fa-trash"></i></a>
                        </div>
                    `;
                    html.find("#bonus-container").append(newEntry);
                    refreshKeyDropdowns(html);
                });

                // Bonus löschen
                html.on("click", ".delete-bonus", ev => {
                    $(ev.currentTarget).closest(".bonus-entry").remove();
                    refreshKeyDropdowns(html);
                });

                // Item öffnen
                html.find("#open-item").on("click", () => {
                    const item = game.items.get(node.id);
                    if (item) {
                        item.sheet.render(true);
                    } else {
                        ui.notifications.warn("Item nicht gefunden.");
                    }
                });

                // Effekt erstellen Button
                html.on("click", ".create-effect", async ev => {
                    const entry = $(ev.currentTarget).closest(".bonus-entry");
                    const key = entry.find(".bonus-key").val();
                    const mode = entry.find(".bonus-mode").val();
                    const value = entry.find(".bonus-value").val();

                    if (!key || !mode || !value) {
                        ui.notifications.warn("Bitte Key, Modus und Wert angeben, bevor ein Effect erstellt wird.");
                        return;
                    }

                    // Alten Effekt mit gleichem key löschen
                    const existing = item.effects.find(eff => eff.changes.some(c => c.key === key));
                    if (existing) await existing.delete();

                    // Neuen Effekt anlegen
                    await item.createEmbeddedDocuments("ActiveEffect", [{
                        label: `Bonus: ${key}`,
                        icon: "icons/svg/aura.svg",
                        changes: [{
                            key: key,
                            mode: CONST.ACTIVE_EFFECT_MODES[mode.toUpperCase()],
                            value: value
                        }],
                        origin: item.uuid,
                        disabled: false
                    }]);

                    ui.notifications.info(`Active Effect für ${key} erstellt/aktualisiert.`);
                });

                function refreshKeyDropdowns(html) {
                    const usedKeys = [];
                    html.find(".bonus-key").each((i, el) => {
                        const val = $(el).val();
                        if (val) usedKeys.push(val);
                    });

                    html.find(".bonus-entry").each((i, entry) => {
                        const select = $(entry).find(".bonus-key");
                        const current = select.val();
                        select.find("option").each((j, opt) => {
                            const key = $(opt).val();
                            if (key === current) {
                                $(opt).prop("disabled", false);
                            } else {
                                $(opt).prop("disabled", usedKeys.includes(key));
                            }
                        });
                    });
                }

            }
        });



        dlg.render(true);
    }
}
