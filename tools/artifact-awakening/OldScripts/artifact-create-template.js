export async function createNewArtifact() {
    const artifactData = {
        name: "New Artifact",
        type: "artifact",  // WICHTIG!
        img: "icons/svg/book.svg",
        system: {
            level: 1,
            passiveBonuses: {
                str: 0,
                dex: 0,
                ac: 0,
                movement: 0
            },
            skills: [
                {
                    name: "Skill Placeholder",
                    description: "Describe the effect of your skill here.",
                    type: "Action",
                    unlockLevel: 1
                }
            ],
            setBonus: {
                active: false,
                description: "Describe your set bonus here."
            }
        },
        flags: {
            "artifact-awakening": {
                isArtifact: true
            }
        }
    };

    // Artefakt erstellen
    const item = await Item.create(artifactData);

    // Artefakt auf eigenes Sheet umstellen
    await item.update({
        "flags.core.sheetClass": "artifact-awakening.ArtifactItemSheet"
    });

    // Danach öffnen
    item.sheet.render(true);

    ui.notifications.info(`Created a new Artifact: ${artifactData.name}`);
}
