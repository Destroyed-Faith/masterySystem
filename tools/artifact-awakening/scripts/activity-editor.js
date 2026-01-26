export class ActivityEditor {

    /**
     * Konfigurations-Dialog für neue Activity
     */
    static openActivityConfigDialog(node, selectedType, parentApp) {
        let configFields = `
            <form>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="activityName" value="">
                </div>
        `;

        if (selectedType === "Attack") {
            configFields += `
                <div class="form-group">
                    <label>Schadensformel (z.B. 2d6+4)</label>
                    <input type="text" name="damage" value="">
                </div>
            `;
        }
        if (selectedType === "Heal") {
            configFields += `
                <div class="form-group">
                    <label>Heilformel (z.B. 1d8+3)</label>
                    <input type="text" name="heal" value="">
                </div>
            `;
        }
        if (selectedType === "Check") {
            configFields += `
                <div class="form-group">
                    <label>DC</label>
                    <input type="number" name="dc" value="">
                </div>
            `;
        }

        configFields += `</form>`;

        new Dialog({
            closeOnSubmit: false,
            title: `Neue ${selectedType}-Activity anlegen`,
            content: configFields,
            buttons: {
                ok: {
                    label: "Speichern",
                    callback: configDlg => {
                        const name = configDlg.find("[name='activityName']").val() || selectedType;
                        const newActivity = { type: selectedType, name };

                        if (selectedType === "Attack") {
                            newActivity.damage = configDlg.find("[name='damage']").val() || "";
                        }
                        if (selectedType === "Heal") {
                            newActivity.heal = configDlg.find("[name='heal']").val() || "";
                        }
                        if (selectedType === "Check") {
                            newActivity.dc = configDlg.find("[name='dc']").val() || "";
                        }

                        node.activities.push(newActivity);
                        // parentApp.render(true); // entfernt, um Dialog offen zu halten
                    }
                },
                cancel: { label: "Abbrechen" }
            }
        }).render(true);
    }

    /**
     * Bearbeiten einer bestehenden Activity
     */
    static openActivityEditDialog(node, index, act, parentApp) {
        let configFields = `
            <form>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="activityName" value="${act.name || ""}">
                </div>
        `;

        if (act.type === "Attack") {
            configFields += `
                <div class="form-group">
                    <label>Schadensformel</label>
                    <input type="text" name="damage" value="${act.damage || ""}">
                </div>
            `;
        }
        if (act.type === "Heal") {
            configFields += `
                <div class="form-group">
                    <label>Heilformel</label>
                    <input type="text" name="heal" value="${act.heal || ""}">
                </div>
            `;
        }
        if (act.type === "Check") {
            configFields += `
                <div class="form-group">
                    <label>DC</label>
                    <input type="number" name="dc" value="${act.dc || ""}">
                </div>
            `;
        }

        configFields += `</form>`;

        new Dialog({
            closeOnSubmit: false,
            title: `Activity bearbeiten`,
            content: configFields,
            buttons: {
                ok: {
                    label: "Speichern",
                    callback: configDlg => {
                        act.name = configDlg.find("[name='activityName']").val();
                        if (act.type === "Attack") act.damage = configDlg.find("[name='damage']").val();
                        if (act.type === "Heal") act.heal = configDlg.find("[name='heal']").val();
                        if (act.type === "Check") act.dc = configDlg.find("[name='dc']").val();

                        // parentApp.render(true); // entfernt, um Dialog offen zu halten
                    }
                },
                cancel: { label: "Abbrechen" }
            }
        }).render(true);
    }
}
