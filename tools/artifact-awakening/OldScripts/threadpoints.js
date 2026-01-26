import { ThreadPointsDialog } from "./threadpoints-dialog.js";

export class ThreadPoints {

    static get(actor) {
        return actor.getFlag('artifact-awakening', 'threadpoints') || 0;
    }

    static async set(actor, points) {
        await actor.setFlag('artifact-awakening', 'threadpoints', points);
    }

    static async add(actor, amount) {
        const current = ThreadPoints.get(actor);
        await ThreadPoints.set(actor, current + amount);
        ui.notifications.info(`${actor.name} gains ${amount} Threadpoint(s).`);
    }

    static async spend(actor, cost) {
        const current = ThreadPoints.get(actor);
        if (current >= cost) {
            await ThreadPoints.set(actor, current - cost);
            ui.notifications.info(`${actor.name} spends ${cost} Threadpoint(s).`);
            return true;
        } else {
            ui.notifications.warn(`${actor.name} does not have enough Threadpoints!`);
            return false;
        }
    }

    static async openDialog(actor) {
        new ThreadPointsDialog(actor).render(true);
    }
}
