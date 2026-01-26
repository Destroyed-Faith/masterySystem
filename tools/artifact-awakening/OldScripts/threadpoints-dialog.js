import { ThreadPoints } from "./threadpoints.js";

export class ThreadPointsDialog extends Application {
    constructor(actor, options = {}) {
        super(options);
        this.actor = actor;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "threadpoints-dialog",
            classes: ["threadpoints"],
            title: "Manage Threadpoints",
            template: "modules/artifact-awakening/templates/threadpoints-dialog.hbs",
            width: 300,
            height: "auto",
            resizable: false
        });
    }

    getData() {
        const points = ThreadPoints.get(this.actor);
        return {
            points
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".add-point").click(async (event) => {
            event.preventDefault();
            await ThreadPoints.add(this.actor, 1);
            this.render(true);
        });

        html.find(".remove-point").click(async (event) => {
            event.preventDefault();
            await ThreadPoints.add(this.actor, -1);
            this.render(true);
        });

        html.find(".close-dialog").click((event) => {
            event.preventDefault();
            this.close();
        });
    }
}
