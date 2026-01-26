export class ThreadboundItem extends Item {

    prepareData() {
        super.prepareData();
        const itemData = this.system;

        // Standardwerte, falls nicht vorhanden
        itemData.level ??= 1;
        itemData.passiveBonuses ??= {
            str: 0,
            dex: 0,
            ac: 0,
            movement: 0
        };
        itemData.skills ??= [];
        itemData.setBonus ??= {
            active: false,
            description: "No set bonus yet."
        };
    }

    /**
     * Gibt alle Skills, die aktuell freigeschaltet sind, zurück
     */
    getActiveSkills() {
        const level = this.system.level || 1;
        return this.system.skills.filter(skill => skill.unlockLevel <= level);
    }

    /**
     * Gibt die nächste Fähigkeit, die freigeschaltet wird
     */
    getNextUpgrade() {
        const level = this.system.level || 1;
        return this.system.skills.find(skill => skill.unlockLevel === level + 1);
    }

    /**
     * Levelt das Item auf
     */
    async levelUp() {
        if (this.system.level < 10) {
            await this.update({ "system.level": this.system.level + 1 });
            ui.notifications.info(`${this.name} upgraded to Level ${this.system.level}!`);
        } else {
            ui.notifications.warn(`${this.name} is already at max level.`);
        }
    }
}
