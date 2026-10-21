/**
 * Destroyed Faith — Rules Index (world Journal).
 *
 * Idempotent GM helper: creates or updates a single world JournalEntry that
 * links into the three system-owned Rules Compendium packs. Does not import
 * pack contents into the world.
 */
const FLAG_SCOPE = 'mastery-system';
const FLAG_KEY = 'rulesIndex';
const INDEX_NAME = 'Destroyed Faith — Rules Index';
const PACKS = [
    {
        pack: 'rules-core',
        label: 'Core Rules',
        blurb: 'Character creation, combat, Stones, progression, equipment, magic, rituals, and recovery.',
    },
    {
        pack: 'rules-world',
        label: 'World & Echoes',
        blurb: 'Tyhra, cosmology, history, and every playable Echo with Artifacts and Echo Decks.',
    },
    {
        pack: 'rules-quickref',
        label: 'Quick Reference',
        blurb: 'Player cheat sheets and compact combat / resource reminders.',
    },
];
function packCollection(packName) {
    const g = globalThis;
    return g.game?.packs?.get(`mastery-system.${packName}`) ?? null;
}
async function ensurePackIndex(packName) {
    const pack = packCollection(packName);
    if (!pack)
        return [];
    if (typeof pack.getDocuments === 'function') {
        return pack.getDocuments();
    }
    if (typeof pack.getIndex === 'function') {
        const idx = await pack.getIndex({ fields: ['name', 'sort'] });
        return Array.from(idx ?? []);
    }
    return [];
}
function uuidFor(packName, docId) {
    return `Compendium.mastery-system.${packName}.JournalEntry.${docId}`;
}
async function buildIndexHtml() {
    const sections = [];
    sections.push(`<div class="df-rules-index">`);
    sections.push(`<h1>${INDEX_NAME}</h1>`);
    sections.push(`<p>Open a section below. Full chapters live in system Compendiums — this Index only links to them.</p>`);
    for (const meta of PACKS) {
        const docs = await ensurePackIndex(meta.pack);
        const sorted = [...docs].sort((a, b) => {
            const sa = Number(a.sort ?? 0);
            const sb = Number(b.sort ?? 0);
            if (sa !== sb)
                return sa - sb;
            return String(a.name || '').localeCompare(String(b.name || ''));
        });
        sections.push(`<section class="df-rules-index-pack">`);
        sections.push(`<h2>${meta.label}</h2>`);
        sections.push(`<p>${meta.blurb}</p>`);
        if (!sorted.length) {
            sections.push(`<p><em>Compendium <code>mastery-system.${meta.pack}</code> is empty or not loaded. Run <code>npm run build:rules-journals</code> and reload the system.</em></p>`);
        }
        else {
            sections.push('<ul>');
            for (const doc of sorted) {
                const id = String(doc._id || doc.id || '');
                const name = String(doc.name || id);
                if (!id)
                    continue;
                const uuid = uuidFor(meta.pack, id);
                sections.push(`<li>@UUID[${uuid}]{${name}}</li>`);
            }
            sections.push('</ul>');
        }
        sections.push('</section>');
    }
    sections.push(`<p><small>Source: Player's Guide (<code>docs/Rules/players-guide.md</code>). Power Catalogues are not included in this phase.</small></p>`);
    sections.push('</div>');
    return sections.join('\n');
}
function findExistingIndex() {
    const g = globalThis;
    const journals = g.game?.journal;
    if (!journals)
        return null;
    const list = Array.isArray(journals.contents)
        ? journals.contents
        : Array.from(journals ?? []);
    for (const entry of list) {
        const flag = entry?.getFlag?.(FLAG_SCOPE, FLAG_KEY) ?? entry?.flags?.[FLAG_SCOPE]?.[FLAG_KEY];
        if (flag)
            return entry;
        if (String(entry?.name || '') === INDEX_NAME)
            return entry;
    }
    return null;
}
/**
 * Create or update the world Rules Index Journal. GM only.
 * @returns The JournalEntry document, or null on failure.
 */
export async function ensureRulesIndexJournal() {
    const g = globalThis;
    if (!g.game?.user?.isGM) {
        g.ui?.notifications?.warn?.('Only the GM can create or update the Rules Index.');
        return null;
    }
    const html = await buildIndexHtml();
    const existing = findExistingIndex();
    if (existing) {
        const pages = existing.pages?.contents ?? existing.pages ?? [];
        const first = Array.isArray(pages) ? pages[0] : pages?.contents?.[0];
        if (first?.update) {
            await first.update({
                name: 'Index',
                'text.content': html,
                'text.format': 1,
            });
        }
        else if (existing.createEmbeddedDocuments) {
            await existing.createEmbeddedDocuments('JournalEntryPage', [
                {
                    name: 'Index',
                    type: 'text',
                    text: { format: 1, content: html },
                },
            ]);
        }
        await existing.setFlag?.(FLAG_SCOPE, FLAG_KEY, true);
        await existing.update?.({ name: INDEX_NAME });
        g.ui?.notifications?.info?.('Destroyed Faith Rules Index updated.');
        return existing;
    }
    const created = await g.JournalEntry?.create?.({
        name: INDEX_NAME,
        ownership: { default: 2 },
        pages: [
            {
                name: 'Index',
                type: 'text',
                text: { format: 1, content: html },
            },
        ],
        flags: { [FLAG_SCOPE]: { [FLAG_KEY]: true } },
    });
    g.ui?.notifications?.info?.('Destroyed Faith Rules Index created.');
    return created ?? null;
}
/** Register GM setting + API for the Rules Index. */
export function registerRulesJournalHooks() {
    const g = globalThis;
    const settings = g.game?.settings;
    if (!settings?.register)
        return;
    try {
        settings.register('mastery-system', 'rulesIndexHelper', {
            name: 'Destroyed Faith — Rules Index',
            hint: 'Create or refresh a world Journal that links to the Core Rules, World & Echoes, and Quick Reference Compendiums.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
            onChange: async (v) => {
                if (v) {
                    await ensureRulesIndexJournal();
                    try {
                        await settings.set('mastery-system', 'rulesIndexHelper', false);
                    }
                    catch {
                        /* ignore */
                    }
                }
            },
        });
    }
    catch (err) {
        console.warn('Mastery System | Rules Index setting registration failed', err);
    }
    g.game.mastery = g.game.mastery || {};
    g.game.mastery.ensureRulesIndexJournal = ensureRulesIndexJournal;
}
//# sourceMappingURL=rules-index.js.map