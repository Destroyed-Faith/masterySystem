import { ArtifactDataModel } from "./artifact-data-model.js";

export class ArtifactItem extends CONFIG.Item.documentClass {

    static defineSchema = ArtifactDataModel.defineSchema;

    get isArtifact() {
        return this.flags["artifact-awakening"]?.isArtifact === true;
    }


    prepareData() {
        super.prepareData();

        if (!this.isArtifact) return; // nur Artefakte behandeln

        const itemData = this.system;
        itemData.level ??= 1;
        itemData.passiveBonuses ??= { str: 0, dex: 0, ac: 0, movement: 0 };
        itemData.skills ??= [];
        itemData.setBonus ??= { active: false, description: "" };
    }

    getActiveSkills() {
        const level = this.system.level;
        return this.system.skills.filter(skill => skill.unlockLevel <= level);
    }

    getNextUpgrade() {
        const level = this.system.level;
        return this.system.skills.find(skill => skill.unlockLevel === level + 1);
    }

    async levelUp() {
        if (this.system.level < 10) {
            await this.update({ "system.level": this.system.level + 1 });
            ui.notifications.info(`${this.name} upgraded to Level ${this.system.level}!`);
        } else {
            ui.notifications.warn(`${this.name} is already at max level.`);
        }
    }



}
