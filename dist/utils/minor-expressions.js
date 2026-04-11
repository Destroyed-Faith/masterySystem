/**
 * Minor Expressions (cantrips) — catalog and tier/scaling helpers.
 * Vitality and Wits have no catalog entries; selections are capped by mastery rank and require attribute ≥ 8.
 */
export const MINOR_EXPRESSION_MIN_ATTRIBUTE = 8;
export const MINOR_EXPRESSION_TIERS = [8, 16, 24, 32, 40];
const M = 'might';
const A = 'agility';
const I = 'intellect';
const R = 'resolve';
const F = 'influence';
export const MINOR_EXPRESSIONS = [
    {
        id: 'might-hold-fast',
        attribute: M,
        name: 'Hold Fast',
        tagline: 'Kurzzeitig etwas stemmen, halten oder auffangen, das sonst nachgeben würde.',
        tiers: {
            8: 'Du kannst eine Tür, ein Regal, einen Balken oder eine fallende Last in plausibler Größe kurz aufhalten.',
            16: 'Du kannst schwerere Türen, Trümmerstücke oder eine nachgebende Struktur lange genug halten, damit jemand durchkommt oder reagiert.',
            24: 'Du kannst massivere Lasten für einen kurzen Moment stemmen und mehreren Personen Zeit verschaffen.',
            32: 'Du kannst einen klar heroischen „Hold the Door“-Moment erzeugen, auch unter sehr schlechten Bedingungen.',
            40: 'Du kannst legendäre Kurzzeitleistungen vollbringen: schwere Lasten abfangen, wegbrechen verzögern, andere retten oder einen Einsturz kurz umleiten.'
        }
    },
    {
        id: 'might-force-open',
        attribute: M,
        name: 'Force Open',
        tagline: 'Verklemmte oder verzogene Dinge mit Gewalt öffnen oder lösen.',
        tiers: {
            8: 'Fensterläden, verklemmte Türen, Truhendeckel, aufgequollenes Holz.',
            16: 'Rostige Luken, schwere Holztüren, verkeilte Durchgänge, festsitzende Scharniere.',
            24: 'Gröbere Sperren ohne echte Verriegelungsmechanik, stark verzogene Konstruktionen, hartnäckig verklemmte Zugänge.',
            32: 'Massivere Hindernisse, verstemmte Türen oder halb blockierte Eingänge, solange keine echte Sicherheitsmechanik oder Magie greift.',
            40: 'Fast alles rein Physische, das durch rohe Kraft plausibel überwindbar ist, auch wenn mehrere Leute dafür staunen würden.'
        }
    },
    {
        id: 'might-clear-path',
        attribute: M,
        name: 'Clear Path',
        tagline: 'Kleinere Hindernisse beiseite schaffen, um einen Weg freizumachen.',
        tiers: {
            8: 'Du räumst schnell einen schmalen Zugang frei oder schaffst Platz für eine Person.',
            16: 'Du beseitigst spürbare Blockaden wie umgestürzte Möbel, lose Trümmer oder Barrikadenreste.',
            24: 'Du kannst einen kleinen Durchgang, eine Treppe oder eine Ecke so freimachen, dass eine Gruppe weiterkommt.',
            32: 'Du schaffst in kurzer Zeit brauchbare Bewegungsschneisen durch schweres Gerümpel oder eingestürzte Innenräume.',
            40: 'Du kannst selbst chaotisch blockierte Bereiche erstaunlich schnell begehbar machen, solange keine eigentliche Grabungsarbeit nötig ist.'
        }
    },
    {
        id: 'might-shoulder-the-burden',
        attribute: M,
        name: 'Shoulder the Burden',
        tagline: 'Person, Last oder Ausrüstung länger und sicherer stützen, tragen oder schleifen.',
        tiers: {
            8: 'Du stützt oder trägst eine Person oder schwere Last über kurze Distanz.',
            16: 'Du bringst einen Verwundeten mitsamt etwas Ausrüstung zuverlässig aus der Gefahrenzone.',
            24: 'Du kannst jemanden über längere Strecke tragen, ziehen oder schultern, auch in schwierigem Gelände.',
            32: 'Du bewegst Menschen und Lasten unter Druck, Treppen, Schlamm oder schlechter Sicht mit bemerkenswerter Ausdauer.',
            40: 'Du wirkst beinahe übermenschlich belastbar, wenn es darum geht, jemanden „heimzubringen“.'
        }
    },
    {
        id: 'might-menace-of-flesh',
        attribute: M,
        name: 'Menace of Flesh',
        tagline: 'Durch Haltung, Blick und Körperpräsenz spürbar Druck aufbauen.',
        tiers: {
            8: 'Einzelne Personen nehmen dich sofort ernster.',
            16: 'Du kannst in einem Gespräch oder einer knappen Situation deutlich körperlichen Druck erzeugen.',
            24: 'Kleine Gruppen spüren instinktiv, dass du notfalls physisch dominieren würdest.',
            32: 'Selbst entschlossene Leute zögern kurz oder treten Raum ab.',
            40: 'Deine bloße Präsenz kann eine Szene körperlich „einfrieren“, ohne dass du etwas sagen musst.'
        }
    },
    {
        id: 'might-set-your-feet',
        attribute: M,
        name: 'Set Your Feet',
        tagline: 'Extrem stabil setzen und nur schwer aus der Position bringen.',
        tiers: {
            8: 'Du hältst Stand auf rutschigem, engem oder unangenehmem Untergrund.',
            16: 'Du kannst Gegenhalten, Stemmen oder Festhalten deutlich länger durchziehen.',
            24: 'Du bleibst auch unter Zug, Gedränge oder Druck erstaunlich stabil.',
            32: 'Mehrere Faktoren gleichzeitig bringen dich nicht leicht aus der Position.',
            40: 'Wenn du dich setzt, wirkt es fast so, als müsste die Welt um dich herum nachgeben.'
        }
    },
    {
        id: 'agility-soft-step',
        attribute: A,
        name: 'Soft Step',
        tagline: 'Bemerktenswert leise über knarzenden Untergrund bewegen.',
        tiers: {
            8: 'Du vermeidest das meiste offensichtliche Knarzen, Klappern oder Scharren.',
            16: 'Auch problematischer Untergrund bleibt oft erstaunlich ruhig unter dir.',
            24: 'Du bewegst dich durch Innenräume, Trümmer oder dichtes Mobiliar fast unhörbar.',
            32: 'Deine Schritte wirken unter normalen Bedingungen beinahe geisterhaft.',
            40: 'Selbst wachsame Menschen bemerken deine Bewegung oft erst, wenn sie dich bereits sehen.'
        }
    },
    {
        id: 'agility-light-fingers',
        attribute: A,
        name: 'Light Fingers',
        tagline: 'Kleine, frei zugängliche Gegenstände unauffällig nehmen oder versetzen.',
        tiers: {
            8: 'Du nimmst einzelne kleine Gegenstände unbemerkt vom Tisch, Regal oder Fensterbrett.',
            16: 'Du kannst Dinge im Vorbeigehen oder während eines Gesprächs beiläufig verschwinden lassen.',
            24: 'Du versetzt mehrere Kleinigkeiten, ohne Aufmerksamkeit darauf zu lenken.',
            32: 'Deine Handgriffe wirken fast wie Bühnenzauberei.',
            40: 'Leute erinnern sich später oft nicht einmal daran, wann etwas aus dem Blick geraten ist.'
        }
    },
    {
        id: 'agility-catch-yourself',
        attribute: A,
        name: 'Catch Yourself',
        tagline: 'Stolpern oder Rutschen im letzten Moment ausgleichen.',
        tiers: {
            8: 'Du fängst einfache Fehltritte oder Rutscher sauber ab.',
            16: 'Du rettest dich auch bei schlechten Kanten, Nässe oder knappen Bewegungen.',
            24: 'Selbst abrupte Balanceverluste enden oft nur in einem kontrollierten Nachsetzen.',
            32: 'Deine Körperkontrolle macht peinliche oder gefährliche Ausrutscher selten.',
            40: 'Du wirkst fast unmöglich sicher in jeder kleinen Korrekturbewegung.'
        }
    },
    {
        id: 'agility-fine-hands',
        attribute: A,
        name: 'Fine Hands',
        tagline: 'Filigrane oder heikle Handgriffe sauber und kontrolliert ausführen.',
        tiers: {
            8: 'Splitter, Nadeln, kleine Verschlüsse, fragile Gegenstände.',
            16: 'Feine Mechanik, empfindliche Materialien, exakte Platzierung.',
            24: 'Sehr heikle Handarbeit gelingt dir mit ruhiger Präzision.',
            32: 'Du kannst selbst unter schlechtem Licht, auf engem Raum oder unter Zeitdruck sauber arbeiten.',
            40: 'Deine Fingerfertigkeit wirkt in ihrem Bereich meisterhaft.'
        }
    },
    {
        id: 'agility-perfect-balance',
        attribute: A,
        name: 'Perfect Balance',
        tagline: 'Auf schmalen oder instabilen Flächen deutlich sicherer die Balance halten.',
        tiers: {
            8: 'Balken, Tischkanten, schmale Vorsprünge.',
            16: 'Schwieriger Untergrund, Bewegung auf schmalen Kanten, wackelige Flächen.',
            24: 'Seile, nasse Ränder, loses Gerüst, schräge Konstruktionen.',
            32: 'Sehr heikle Balance wirkt bei dir kontrolliert statt panisch.',
            40: 'Unter Nicht-Kampf-Bedingungen wirkt deine Balance beinahe unnatürlich perfekt.'
        }
    },
    {
        id: 'agility-slip-through',
        attribute: A,
        name: 'Slip Through',
        tagline: 'Hand, Arm oder Werkzeug erstaunlich gut durch enge Öffnungen bringen.',
        tiers: {
            8: 'Kleine Lücken für Hand oder Werkzeug.',
            16: 'Du zwängst dich durch Engstellen, durch die andere sich kaum trauen würden.',
            24: 'Du kannst dich durch enge Winkel und Spalten mit erstaunlicher Sauberkeit arbeiten.',
            32: 'Sehr enge Durchgänge oder komplizierte Körperlagen schrecken dich kaum.',
            40: 'Du findest fast immer einen Weg „durch“, solange es physisch gerade noch möglich ist.'
        }
    },
    {
        id: 'intellect-mage-hand',
        attribute: I,
        name: 'Mage Hand',
        tagline: 'Kleine magische Kraft bewegt leichte Gegenstände auf kurze Distanz.',
        tiers: {
            8: 'Ein kleiner Gegenstand in kurzer Distanz bewegen, ziehen oder überreichen.',
            16: 'Mehr Kontrolle, etwas mehr Reichweite, einfache Handgriffe wie kippen, holen, anstupsen.',
            24: 'Mehrere kleine Handgriffe nacheinander, saubere Fernmanipulation leichter Objekte.',
            32: 'Feiner, weiter und vielseitiger; kleine Gegenstände lassen sich erstaunlich elegant führen.',
            40: 'Meisterhafte kleine Fernmanipulation, fast wie eine unsichtbare Hand im Alltag.'
        }
    },
    {
        id: 'intellect-message',
        attribute: I,
        name: 'Message',
        tagline: 'Leise, gezielte Botschaft, die nur die Zielperson hört.',
        tiers: {
            8: 'Ein kurzer Satz an eine Person in der Nähe.',
            16: 'Etwas weiter, klarer, kurze Antwort möglich.',
            24: 'Kurzer Hin-und-her-Austausch über kleine Distanz.',
            32: 'Mehrere kurze Botschaften, auch durch einfache Hindernisse oder über Lärm hinweg.',
            40: 'Fast wie ein diskretes, unsichtbares Gespräch innerhalb sinnvoller Reichweite.'
        }
    },
    {
        id: 'intellect-arcane-spark',
        attribute: I,
        name: 'Arcane Spark',
        tagline: 'Kleine Lichtpunkte, Funken oder sichtbare arkane Markierungen.',
        tiers: {
            8: 'Ein kleiner Lichtpunkt, Funke oder glimmendes Zeichen.',
            16: 'Mehrere kleine Lichter oder kurze magische Markierungen.',
            24: 'Bewegliche Lichtpunkte, kleine Symbole, klarere visuelle Magie.',
            32: 'Saubere arkane Anzeigen, längere Leuchtdauer, kleine Muster oder Zeichenfolgen.',
            40: 'Elegante Licht- und Glyphenarbeit, die sich wie ein echtes Werkzeug anfühlt.'
        }
    },
    {
        id: 'intellect-detect-trace',
        attribute: I,
        name: 'Detect Trace',
        tagline: 'Schwache magische Rückstände oder Ritualspuren wahrnehmen.',
        tiers: {
            8: '„Hier ist etwas Magisches oder Unnatürliches.“',
            16: 'Grobe Richtung, Stärke oder Frische wird erkennbar.',
            24: 'Bessere Einordnung: eher Ritual, eher Objekt, eher Restenergie.',
            32: 'Feine Unterschiede und schwache Spuren werden verlässlicher wahrnehmbar.',
            40: 'Sehr sensibles Gespür für schwache Magiereste, ohne volle Analyse zu ersetzen.'
        }
    },
    {
        id: 'intellect-script-whisper',
        attribute: I,
        name: 'Script Whisper',
        tagline: 'Schrift oder Symbole kurz lesbarer machen oder grob deuten.',
        tiers: {
            8: 'Verblasste Schrift oder schwache Zeichen kurz lesbarer machen.',
            16: 'Einfache Runen, Warnzeichen oder Symbole grob deuten.',
            24: 'Kleine Passagen, Formeln oder Muster klarer erfassen.',
            32: 'Schwierige oder beschädigte Schrift wird erstaunlich zugänglich.',
            40: 'Selbst problematische Zeichen lassen sich in Form und Grundintention oft erfassen.'
        }
    },
    {
        id: 'intellect-minor-conjuration',
        attribute: I,
        name: 'Minor Conjuration',
        tagline: 'Kleine, harmlose, kurzlebige magische Manifestation oder Illusion.',
        tiers: {
            8: 'Eine winzige harmlose Erscheinung oder ein kurzes magisches Spielzeug.',
            16: 'Etwas stabiler, etwas klarer, etwas länger.',
            24: 'Kleine funktionale Spielereien, sichtbare Mini-Illusionen, flüchtige Objekte.',
            32: 'Deutlich vielseitiger in Form und Auftreten, solange alles klein und harmlos bleibt.',
            40: 'Meisterhafte kleine Manifestationen, die viel Stil und Nützlichkeit im Kleinen haben.'
        }
    },
    {
        id: 'resolve-alarm',
        attribute: R,
        name: 'Alarm',
        tagline: 'Stille Warnung auf Gegenstand oder kleinen Bereich legen.',
        tiers: {
            8: 'Ein einzelner Gegenstand, Beutel, Rucksack, Bettrolle oder persönlicher Platz.',
            16: 'Ein Zugang, Fenster, Tür, Kiste oder kleine Lagerstelle.',
            24: 'Ein kleiner Raum, ein Zeltbereich oder ein klar abgegrenzter Radius.',
            32: 'Mehrere Zugänge oder ein größerer Bereich.',
            40: 'Ein ganzes Lager, eine Halle oder ein sauber gesetzter Schutzraum im kleinen Maßstab.'
        }
    },
    {
        id: 'resolve-still-mind',
        attribute: R,
        name: 'Still Mind',
        tagline: 'Geist sammeln und gegen Panik oder Unruhe abschirmen.',
        tiers: {
            8: 'Du findest rasch Ruhe und Fokus.',
            16: 'Du schiebst Unruhe, Panik oder innere Zerrissenheit für eine Weile zurück.',
            24: 'Selbst starker Druck lässt sich innerlich sortieren.',
            32: 'Du kannst dich bemerkenswert schnell fassen und klar handeln.',
            40: 'Deine innere Ordnung wirkt fast unerschütterlich.'
        }
    },
    {
        id: 'resolve-read-omen',
        attribute: R,
        name: 'Read Omen',
        tagline: 'Aus Zeichen und Stimmung ein ungutes oder gutes Vorzeichen lesen.',
        tiers: {
            8: 'Du bekommst ein grobes Gefühl: gut, schlecht, falsch, unruhig.',
            16: 'Das Vorzeichen wird klarer und lässt sich auf Situation oder Ort beziehen.',
            24: 'Du kannst mehrere kleine Zeichen zusammenlesen und erkennst deutlichere Tendenzen.',
            32: 'Deine Deutung wirkt oft unheimlich treffsicher.',
            40: 'Du liest aus winzigen Brüchen in der Welt belastbare Stimmungen und Warnungen.'
        }
    },
    {
        id: 'resolve-cold-comfort',
        attribute: R,
        name: 'Cold Comfort',
        tagline: 'Mit ruhiger Gewissheit Halt geben, ohne falsche Hoffnung.',
        tiers: {
            8: 'Eine Person beruhigt sich sichtbar durch deine Worte oder Anwesenheit.',
            16: 'Du kannst jemanden stabilisieren, der innerlich kippt, zweifelt oder sich verliert.',
            24: 'Deine Ruhe greift auf kleine Gruppen über.',
            32: 'Auch harte Situationen lassen sich durch deine Gegenwart emotional tragen.',
            40: 'Du bist der ruhige Anker in sehr dunklen Momenten.'
        }
    },
    {
        id: 'resolve-sense-taint',
        attribute: R,
        name: 'Sense Taint',
        tagline: 'Spüren, ob etwas verdorben, falsch oder geistig „schmutzig“ ist.',
        tiers: {
            8: 'Du spürst dumpf, dass etwas nicht stimmt.',
            16: 'Du kannst Person, Objekt oder Bereich grob als Quelle unterscheiden.',
            24: 'Stärke, Frische oder Art der Unreinheit werden deutlicher.',
            32: 'Selbst subtile Verdorbenheit ist für dich oft spürbar.',
            40: 'Dein Gespür für Verderbnis, falsche Präsenz oder geistige Schwere ist außergewöhnlich fein.'
        }
    },
    {
        id: 'resolve-keep-watch',
        attribute: R,
        name: 'Keep Watch',
        tagline: 'Lange wach, aufmerksam und innerlich gespannt bleiben.',
        tiers: {
            8: 'Du hältst ruhiger und wacher Wache als andere.',
            16: 'Lange Stille, Müdigkeit und Monotonie stumpfen dich weniger ab.',
            24: 'Du bemerkst feine Veränderungen in Geräusch, Stimmung oder Bewegung eher als andere.',
            32: 'Selbst über längere Phasen bleibst du klar und reaktionsbereit.',
            40: 'Deine Wachsamkeit wirkt beinahe übernatürlich gesammelt.'
        }
    },
    {
        id: 'influence-carry-voice',
        attribute: F,
        name: 'Carry Voice',
        tagline: 'Stimme klar und kontrolliert auch über Lärm oder Distanz.',
        tiers: {
            8: 'Du erreichst zuverlässig eine kleine Gruppe oder einen Raum.',
            16: 'Deine Stimme setzt sich gegen Nebengeräusche und Unruhe durch.',
            24: 'Du kannst Hallen, Höfe oder größere Gruppen ohne Schreien füllen.',
            32: 'Deine Stimme wirkt präsent, geführt und beeindruckend über deutliche Distanz.',
            40: 'Du klingst, als wäre der Raum selbst auf deiner Seite.'
        }
    },
    {
        id: 'influence-read-the-room',
        attribute: F,
        name: 'Read the Room',
        tagline: 'Spannung, Machtverhältnisse und Grundstimmung rasch spüren.',
        tiers: {
            8: 'Du merkst schnell, ob eine Szene offen, gereizt oder angespannt ist.',
            16: 'Du erkennst grob, wer Druck ausübt, wer schwankt und wo Bruchlinien liegen.',
            24: 'Dynamiken in kleinen Gruppen werden für dich sehr lesbar.',
            32: 'Selbst feine soziale Verschiebungen entgehen dir selten.',
            40: 'Du liest Räume fast so, als würdest du die unausgesprochenen Rollen hören.'
        }
    },
    {
        id: 'influence-ease-tension',
        attribute: F,
        name: 'Ease Tension',
        tagline: 'Anspannung in einem Gespräch oder Raum spürbar senken.',
        tiers: {
            8: 'Zwei oder drei Personen fahren nicht sofort hoch.',
            16: 'Kleine Gruppen beruhigen sich merklich.',
            24: 'Ein ganzer Raum kann von dir sozial entschärft werden.',
            32: 'Auch scharfe Stimmungen lassen sich sichtbar dämpfen.',
            40: 'Deine Gegenwart kann Eskalation fast greifbar aus einer Szene herausnehmen.'
        }
    },
    {
        id: 'influence-command-presence',
        attribute: F,
        name: 'Command Presence',
        tagline: 'Leute kurz innehalten, zuhören oder dir Raum geben lassen.',
        tiers: {
            8: 'Einzelne Personen halten kurz inne oder achten auf dich.',
            16: 'Kleine Gruppen geben dir Aufmerksamkeit oder Raum.',
            24: 'Du kannst eine Szene merklich auf dich ziehen.',
            32: 'Selbst widerspenstige oder laute Menschen nehmen dich zunächst wahr.',
            40: 'Deine Präsenz ist im sozialen Raum schwer zu ignorieren.'
        }
    },
    {
        id: 'influence-silver-tongue',
        attribute: F,
        name: 'Silver Tongue',
        tagline: 'Worte besonders weich, glaubwürdig oder verführerisch wirken lassen.',
        tiers: {
            8: 'Einzelne Sätze landen spürbar gut.',
            16: 'Gespräche fühlen sich unter deiner Führung glatter und überzeugender an.',
            24: 'Deine Worte schaffen Bindung, Vertrauen oder Nachsicht deutlich leichter.',
            32: 'Selbst schwierige Gespräche kippen eher in deine Richtung.',
            40: 'Deine Sprache wirkt in ihrem Stil meisterhaft: charmant, beruhigend, verlockend oder glaubwürdig.'
        }
    },
    {
        id: 'influence-silken-barb',
        attribute: F,
        name: 'Silken Barb',
        tagline: 'Subtile Bemerkung, die hängen bleibt und später nachwirkt.',
        tiers: {
            8: 'Eine einzelne Person trägt deinen Seitenhieb oder Zweifel mit sich weiter.',
            16: 'Die Bemerkung bleibt spürbar hängen und färbt die Nachwirkung eines Gesprächs.',
            24: 'Sie wirkt über die Szene hinaus und kann die Haltung einer Person merklich verschieben.',
            32: 'Auch kleine Gruppen können durch deinen gesetzten Stachel anders auf etwas blicken.',
            40: 'Deine feinen sozialen Klingen hinterlassen lange, elegante Nachwirkungen.'
        }
    }
];
const BY_ID = new Map();
for (const def of MINOR_EXPRESSIONS) {
    BY_ID.set(def.id, def);
}
export function getMinorExpressionDefinition(id) {
    return BY_ID.get(id);
}
export function listMinorExpressionsByAttribute(attr) {
    return MINOR_EXPRESSIONS.filter((d) => d.attribute === attr);
}
export function attributeForExpressionId(id) {
    return BY_ID.get(id)?.attribute;
}
/** Highest tier threshold not above value; null if value < MIN or unknown. */
export function tierThresholdForAttributeValue(value) {
    const v = Math.floor(Number(value));
    if (!Number.isFinite(v) || v < MINOR_EXPRESSION_MIN_ATTRIBUTE)
        return null;
    let best = null;
    for (const t of MINOR_EXPRESSION_TIERS) {
        if (v >= t)
            best = t;
    }
    return best;
}
export function tierBodyForExpression(def, attributeValue) {
    const tier = tierThresholdForAttributeValue(attributeValue);
    if (!tier)
        return def.tagline;
    return def.tiers[tier];
}
export function sanitizeMinorExpressionIds(ids, getAttributeValue, masteryRank) {
    const cap = Math.max(0, Math.floor(Number(masteryRank)) || 0);
    const seen = new Set();
    const out = [];
    for (const raw of ids || []) {
        const id = String(raw || '').trim();
        if (!id || seen.has(id))
            continue;
        const def = BY_ID.get(id);
        if (!def)
            continue;
        const v = getAttributeValue(def.attribute);
        if (v < MINOR_EXPRESSION_MIN_ATTRIBUTE)
            continue;
        seen.add(id);
        out.push(id);
        if (out.length >= cap)
            break;
    }
    return out;
}
export const MINOR_EXPRESSION_ATTRIBUTES = [
    'might',
    'agility',
    'intellect',
    'resolve',
    'influence'
];
//# sourceMappingURL=minor-expressions.js.map