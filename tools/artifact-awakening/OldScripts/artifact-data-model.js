export class ArtifactDataModel extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            level: new fields.NumberField({ initial: 1, min: 1, max: 10 }),

            description: new fields.SchemaField({
                value: new fields.HTMLField({ initial: "" }),
                unidentified: new fields.HTMLField({ initial: "" }),
                chat: new fields.HTMLField({ initial: "" })
            }),


            source: new fields.StringField({ initial: "" }),
            rarity: new fields.StringField({ initial: "" }),
            attunement: new fields.BooleanField({ initial: false }),

            uses: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0 }),
                max: new fields.NumberField({ initial: 0 })
            }),

            passiveBonuses: new fields.SchemaField({
                str: new fields.NumberField({ initial: 0 }),
                dex: new fields.NumberField({ initial: 0 }),
                ac: new fields.NumberField({ initial: 0 }),
                movement: new fields.NumberField({ initial: 0 })
            }),

            actions: new fields.ArrayField(new fields.SchemaField({
                name: new fields.StringField({initial: ""}),
                type: new fields.StringField({initial: ""}),
                description: new fields.HTMLField({initial: ""})
            })),

            skills: new fields.ArrayField(new fields.SchemaField({
                name: new fields.StringField({ required: true }),
                description: new fields.HTMLField({ initial: "" }),
                type: new fields.StringField({ initial: "Action" }),
                unlockLevel: new fields.NumberField({ initial: 1 })
            }))
        };
    }
}
