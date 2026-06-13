/**
 * Minor Expressions (cantrips) — catalog and tier/scaling helpers.
 * Vitality has no catalog entries; selections are capped by mastery rank and require attribute ≥ 8.
 */

export const MINOR_EXPRESSION_MIN_ATTRIBUTE = 8;

export const MINOR_EXPRESSION_TIERS = [8, 16, 24, 32, 40] as const;
export type MinorExpressionTier = (typeof MINOR_EXPRESSION_TIERS)[number];

export type MinorExpressionAttribute =
  | 'might'
  | 'agility'
  | 'intellect'
  | 'resolve'
  | 'influence'
  | 'wits';

export interface MinorExpressionDefinition {
  id: string;
  attribute: MinorExpressionAttribute;
  name: string;
  tagline: string;
  /** Optional rules capsule (e.g. Minor Conjuration limits), shown once in the UI */
  constraints?: string;
  tiers: Record<MinorExpressionTier, string>;
}

const M: MinorExpressionAttribute = 'might';
const A: MinorExpressionAttribute = 'agility';
const I: MinorExpressionAttribute = 'intellect';
const R: MinorExpressionAttribute = 'resolve';
const F: MinorExpressionAttribute = 'influence';
const W: MinorExpressionAttribute = 'wits';

export const MINOR_EXPRESSIONS: MinorExpressionDefinition[] = [
  {
    id: 'might-hold-fast',
    attribute: M,
    name: 'Hold the Door',
    tagline:
      'Du kannst für einen Moment etwas aufhalten, das eigentlich nicht aufzuhalten sein sollte.',
    tiers: {
      8: 'Du hältst eine Tür, ein Tor, einen schweren Balken oder eine fallende Last kurz genug auf, um einen Moment zu gewinnen.',
      16: 'Du hältst stärkeren Druck, schwerere Tore oder ein nachgebendes Hindernis lange genug auf, dass 1–2 Leute reagieren oder entkommen können.',
      24: 'Du fängst einen kleinen Einsturz, massiven Druck oder ein brechendes Hindernis für einen klar heroischen Moment ab.',
      32: 'Du verschaffst einer kleinen Gruppe Zeit gegen etwas, das eigentlich zu viel für einen Einzelnen wäre.',
      40: 'Du erzeugst einen legendären „Hold the Door“-Moment und hältst kurz etwas auf, das alle anderen längst aufgegeben hätten.'
    }
  },
  {
    id: 'might-force-open',
    attribute: M,
    name: 'Iron Grip',
    tagline: 'Wenn du etwas hältst, hältst du es wirklich.',
    tiers: {
      8: 'Du verlierst Seil, Kante, Griff oder Träger nicht so leicht.',
      16: 'Du kannst jemanden sicher halten, etwas zuverlässig festziehen oder ein wegrutschendes Objekt stabilisieren.',
      24: 'Selbst unter starkem Zug, Nässe, Gewicht oder Panik bleibt dein Griff erstaunlich sicher.',
      32: 'Du hältst Dinge fest, die anderen längst entglitten wären, und kannst andere dabei mit sichern.',
      40: 'Dein Griff wirkt wie ein Schraubstock; sobald du etwas wirklich packst, fühlt es sich an, als müsste eher die Welt nachgeben als deine Hand.'
    }
  },
  {
    id: 'might-clear-path',
    attribute: M,
    name: 'Break Through',
    tagline: 'Du gehst nicht um ein Hindernis herum — du gehst durch.',
    tiers: {
      8: 'Du drückst dich durch leichte Barrikaden, lose Möbel, blockierte Türen oder dichte Menschenmengen.',
      16: 'Du durchbrichst ernstere Blockaden aus Holz, Gerümpel, Möbeln oder dichtem Widerstand.',
      24: 'Du erzwingst dir einen Weg durch massive Hindernisse, provisorische Sperren oder chaotisch verbarrikadierte Passagen.',
      32: 'Du schaffst Öffnungen oder Wege durch Dinge, die andere erst mühsam räumen müssten.',
      40: 'Du wirkst wie Naturgewalt in Bewegung und gehst durch fast alles Physische hindurch, das nicht explizit dafür gebaut wurde, dich aufzuhalten.'
    }
  },
  {
    id: 'might-shoulder-the-burden',
    attribute: M,
    name: 'Titan Carry',
    tagline:
      'Du trägst Menschen, Lasten oder sperrige Dinge so, als wären sie für dich weniger relevant als für andere.',
    tiers: {
      8: 'Du trägst eine verletzte Person oder schwere Last über kurze Distanz sicher.',
      16: 'Du schultersch jemanden samt Ausrüstung oder bewegst schwere Lasten über ordentliche Distanz.',
      24: 'Du transportierst Verwundete, sperrige Lasten oder mehrere schwere Dinge unter schlechten Bedingungen weiter, als andere könnten.',
      32: 'Du bewegst schwere Lasten oder Personen auch durch Treppen, Schlamm, Trümmer oder chaotische Wege mit beeindruckender Ausdauer.',
      40: 'Du wirkst beim Tragen beinahe monströs verlässlich und bringst Menschen oder Lasten dorthin, wo sie hinmüssen, egal wie hart der Weg ist.'
    }
  },
  {
    id: 'might-menace-of-flesh',
    attribute: M,
    name: "Tyrant's Aura",
    tagline: 'Du betrittst einen Raum und Leute merken körperlich, dass du gefährlich bist.',
    tiers: {
      8: 'Einzelne Menschen nehmen deine körperliche Gefährlichkeit sofort wahr.',
      16: 'Kleine Gruppen werden stiller, vorsichtiger oder treten intuitiv zurück.',
      24: 'Deine Präsenz färbt einen Raum körperlich; Leute rechnen instinktiv mit Gewalt, auch wenn du ruhig bleibst.',
      32: 'Selbst harte Leute merken, dass sie dich lieber ernst nehmen sollten.',
      40: 'Deine bloße Anwesenheit kippt die Luft im Raum; Körper reagieren vor Gedanken.'
    }
  },
  {
    id: 'might-set-your-feet',
    attribute: M,
    name: 'Immovable',
    tagline: 'Du kannst dich setzen wie ein Anker.',
    tiers: {
      8: 'Du hältst auf unangenehmem, rutschigem oder drängendem Untergrund überraschend gut Stand.',
      16: 'Du wirst nicht leicht aus Haltung, Griff oder Position gebracht.',
      24: 'Selbst mehrere störende Faktoren gleichzeitig verschieben dich kaum, wenn du dich einmal gesetzt hast.',
      32: 'Andere müssen mit dir rechnen wie mit einem Pfeiler; du hältst Linien, Durchgänge oder Positionen körperlich.',
      40: 'Wenn du dich stellst, wirkt es fast, als müsse alles um dich herum einen Umweg um dich machen.'
    }
  },
  {
    id: 'agility-soft-step',
    attribute: A,
    name: 'Feather Step',
    tagline: 'Deine Schritte und Landungen sind so leicht, dass du kaum Gewicht erzeugst.',
    tiers: {
      8: 'Du gehst deutlich leiser und hinterlässt nur wenig spürbares Gewicht.',
      16: 'Dielen, Schutt, Stoff, Laub oder leicht empfindliche Flächen reagieren viel weniger auf dich.',
      24: 'Du bewegst dich mit beinahe unnatürlich leichtem Tritt durch problematischen Untergrund.',
      32: 'Deine Schritte wirken oft, als würdest du den Boden kaum wirklich belasten.',
      40: 'Du scheinst fast ohne Gewicht zu gehen; Schritt, Landung und Kontakt sind minimal.'
    }
  },
  {
    id: 'agility-light-fingers',
    attribute: A,
    name: 'Bounding Leap',
    tagline:
      'Du kannst deutlich weiter und höher springen, als normale Bewegung erwarten ließe.',
    tiers: {
      8: 'Du überwindest kleine Gräben, Mauerkanten und Höhenunterschiede deutlich besser als gewöhnlich.',
      16: 'Deine Sprünge tragen dich weit genug, um Orte zu erreichen, die andere nur mit Hilfe schaffen.',
      24: 'Du überbrückst eindrucksvolle Distanzen oder Höhen und machst Bewegung vertikal viel freier.',
      32: 'Deine Sprünge wirken klar übermenschlich in Reichweite und Sicherheit.',
      40: 'Du bewegst dich mit Sätzen, die fast wie kurze Flugmomente aussehen.'
    }
  },
  {
    id: 'agility-catch-yourself',
    attribute: A,
    name: 'Catfall',
    tagline:
      'Du kannst große Stürze oder Sprünge extrem weich, rollend oder federnd abfangen.',
    tiers: {
      8: 'Du fängst Sprünge, Stufen, Kanten und kleinere Stürze sauber ab.',
      16: 'Auch deutliche Höhenunterschiede oder harte Landungen wirken bei dir kontrolliert und weich.',
      24: 'Du kannst große Sprünge oder tiefe Abstiege rollend oder federnd entschärfen.',
      32: 'Selbst gefährlich wirkende Höhen lassen sich von dir oft überraschend elegant abfangen.',
      40: 'Du landest aus absurden Höhen oder Distanzen mit einer Unwirklichkeit, die andere wie Schwerfällige aussehen lässt.'
    }
  },
  {
    id: 'agility-fine-hands',
    attribute: A,
    name: 'Wall Spring',
    tagline:
      'Du kannst Wände, Vorsprünge oder schräge Flächen für einen zusätzlichen Satz oder Richtungswechsel nutzen.',
    tiers: {
      8: 'Du nutzt Kanten, niedrige Wände oder schräge Flächen für kleine Korrekturen oder Zusatzsätze.',
      16: 'Du holst sichtbar extra Bewegung oder Höhe aus Wänden und Vorsprüngen.',
      24: 'Du kannst komplexere Richtungswechsel oder Folgebewegungen über vertikale Flächen machen.',
      32: 'Enge Räume, Dächer, Mauern und vertikale Hindernisse werden zu spielbaren Bewegungsflächen für dich.',
      40: 'Du wirkst in vertikaler Bewegung beinahe unmöglich frei, solange irgendwo noch eine Fläche zum Abstoßen existiert.'
    }
  },
  {
    id: 'agility-perfect-balance',
    attribute: A,
    name: 'Reed on the Wind',
    tagline: 'Du kannst auf absurd kleinen, schmalen oder instabilen Flächen sicher stehen.',
    tiers: {
      8: 'Du hältst sicher auf schmalen Kanten, Balken oder instabilem Untergrund.',
      16: 'Du kannst auf kleinen, wackligen oder unangenehmen Flächen ruhig stehen oder dich vorsichtig bewegen.',
      24: 'Du balancierst auf absurden kleinen oder problematischen Flächen, solange noch physisch Platz da ist.',
      32: 'Selbst nasse, lose oder stark schwankende Flächen bringen dich erstaunlich wenig aus dem Gleichgewicht.',
      40: 'Deine Balance wirkt fast schwerelos; wo andere nicht einmal treten würden, kannst du sicher stehen.'
    }
  },
  {
    id: 'agility-slip-through',
    attribute: A,
    name: 'Flow Through',
    tagline:
      'Du kannst dich durch enge, chaotische oder vertikale Umgebungen fast fließend bewegen.',
    tiers: {
      8: 'Du kommst sauber durch Engstellen, Hindernisse oder chaotische Räume.',
      16: 'Du verlierst beim Klettern, Zwängen, Ducken oder Umgehen von Hindernissen kaum deinen Rhythmus.',
      24: 'Selbst vertikale, enge oder unordentliche Umgebungen bremsen dich nur wenig aus.',
      32: 'Du bewegst dich durch schwierige Räume wie Wasser durch Ritzen.',
      40: 'Hindernisreiche Umgebungen scheinen für dich eher Wege als Probleme zu sein.'
    }
  },
  {
    id: 'intellect-mage-hand',
    attribute: I,
    name: 'Mage Hand',
    tagline:
      'Du erschaffst eine kleine magische Kraft/Hand, die leichte Gegenstände auf kurze Distanz bewegen, holen oder kippen kann.',
    tiers: {
      8: 'Du bewegst, holst oder kippst kleine leichte Objekte in kurzer Distanz.',
      16: 'Du manipulierst Objekte verlässlicher, präziser und etwas weiter entfernt.',
      24: 'Du führst mehrere kleine Fern-Handgriffe nacheinander sauber aus.',
      32: 'Deine magische Hand wird deutlich geschickter, weiter und vielseitiger.',
      40: 'Deine Fernmanipulation leichter Dinge wirkt fast wie eine natürliche Verlängerung deiner eigenen Hand.'
    }
  },
  {
    id: 'intellect-message',
    attribute: I,
    name: 'Message',
    tagline:
      'Du kannst einer Person in kurzer Distanz eine leise, gezielte Botschaft zuflüstern, die nur sie hört.',
    tiers: {
      8: 'Ein kurzer Flüstersatz an eine Person in der Nähe.',
      16: 'Mehr Reichweite, mehr Klarheit, kurze Antwort möglich.',
      24: 'Ein kurzer Hin-und-her-Austausch über brauchbare Distanz.',
      32: 'Mehrere kurze Botschaften auch über Störgeräusche oder einfache Hindernisse hinweg.',
      40: 'Fast wie ein diskretes unsichtbares Gespräch im kleinen Rahmen.'
    }
  },
  {
    id: 'intellect-arcane-spark',
    attribute: I,
    name: 'Arcane Spark',
    tagline:
      'Du erzeugst kleine Lichtpunkte, Funken, Glyphenflackern oder sichtbare arkane Markierungen.',
    tiers: {
      8: 'Ein kleiner Lichtpunkt, Funke oder glimmendes Zeichen.',
      16: 'Mehrere kleine Lichter oder kurze magische Markierungen.',
      24: 'Bewegliche Lichtpunkte, kleine Symbole oder stabilere Zeichen.',
      32: 'Saubere arkane Anzeigen, längere Leuchtdauer und komplexere kleine Lichtmuster.',
      40: 'Eine meisterhafte kleine Licht- und Glyphensprache, die sich wie ein echtes Werkzeug anfühlt.'
    }
  },
  {
    id: 'intellect-detect-trace',
    attribute: I,
    name: 'Detect Trace',
    tagline:
      'Du kannst schwache magische Rückstände, Resonanzen oder Ritualspuren wahrnehmen.',
    tiers: {
      8: 'Du spürst, dass hier Magie oder etwas Unnatürliches war.',
      16: 'Grobe Richtung, Frische oder Stärke wird erkennbar.',
      24: 'Du kannst besser unterscheiden, ob der Rückstand eher von Ritual, Objekt oder Person stammt.',
      32: 'Schwache Unterschiede und feinere Reste werden zuverlässig wahrnehmbar.',
      40: 'Du liest selbst zarte arkane Nachbilder erstaunlich sicher, ohne echte Analyse zu ersetzen.'
    }
  },
  {
    id: 'intellect-script-whisper',
    attribute: I,
    name: 'Script Whisper',
    tagline:
      'Du erschaffst geheime, unsichtbare Runen oder Zeichen, die nur unter den richtigen Umständen lesbar werden.',
    tiers: {
      8: 'Du kannst ein einzelnes kurzes verborgenes Zeichen, Wort oder Symbol hinterlassen.',
      16: 'Du hinterlässt kurze geheime Botschaften oder kleine Runenfolgen, die gezielt sichtbar gemacht werden können.',
      24: 'Deine verborgenen Runen können kleine Absätze, mehrere Markierungen oder einfache strukturierte Hinweise tragen.',
      32: 'Du legst komplexere geheime Schriftlagen, Zeichenpfade oder verschachtelte Runen an, die zuverlässig verborgen bleiben.',
      40: 'Du erschaffst meisterhafte unsichtbare Schrift und Runenwerke, die großflächig, fein und schwer zu entdecken sind.'
    }
  },
  {
    id: 'intellect-minor-conjuration',
    attribute: I,
    name: 'Minor Conjuration',
    tagline:
      'Du erschaffst eine kleine Menge einfacher Materie oder Substanz für kurze Zeit.',
    constraints:
      'Wichtige Grenze: nur einfache Materie; nichts Präzisionsgebautes; nichts Komplexlebendiges; nichts, was echte Herstellung, Rituale oder Powers ersetzen soll.',
    tiers: {
      8: 'Eine Handvoll einer einfachen Substanz: Wasser, Erde, Sand, Asche, Metallspäne, Kies, Lehm oder ähnliches.',
      16: 'Etwa ein Eimer voll einer einfachen Substanz.',
      24: 'Etwa eine Badewanne voll einer einfachen Substanz.',
      32: 'Eine große Truhe, Wanne oder kleine Wagenladung einer einfachen Substanz.',
      40: 'Eine beeindruckend große Menge einfacher Materie, groß genug, um einen kleinen Bereich sichtbar zu füllen oder deutlich zu verändern.'
    }
  },
  {
    id: 'resolve-alarm',
    attribute: R,
    name: 'Alarm',
    tagline:
      'Du setzt auf einen Gegenstand, Schlafplatz, Zugang oder kleinen Bereich eine stille Warnung, die dich aufmerksam macht, wenn sie gebrochen wird.',
    tiers: {
      8: 'Ein Gegenstand, Rucksack, Bettrolle oder persönlicher Platz.',
      16: 'Ein Zugang, Fenster, Tür oder kleine Lagerstelle.',
      24: 'Ein kleiner Raum oder klarer Radius.',
      32: 'Mehrere Zugänge oder ein größerer Bereich.',
      40: 'Ein ganzes Lager, eine Halle oder ein sauber gesetzter kleiner Schutzraum.'
    }
  },
  {
    id: 'resolve-still-mind',
    attribute: R,
    name: 'Still Mind',
    tagline:
      'Du kannst deinen Geist in kurzer Zeit sammeln, ordnen und gegen Panik, Verwirrung oder aufsteigende Unruhe abschirmen.',
    tiers: {
      8: 'Du findest rasch Ruhe und Fokus.',
      16: 'Du schiebst starke Unruhe oder geistigen Druck für eine Weile zurück.',
      24: 'Selbst heftige innere Turbulenz lässt sich klarer ordnen.',
      32: 'Du kannst dich fast sofort wieder sammeln und handlungsfähig machen.',
      40: 'Deine innere Ordnung wirkt außergewöhnlich fest und schwer zu erschüttern.'
    }
  },
  {
    id: 'resolve-read-omen',
    attribute: R,
    name: 'Read Omen',
    tagline:
      'Du kannst aus Stimmung, Zeichen, Zufällen, Tierverhalten, Wind, Stille oder kleinen Unstimmigkeiten ein gutes oder ungutes Vorzeichen lesen.',
    tiers: {
      8: 'Ein grobes Gefühl: gut, schlecht, falsch, unruhig.',
      16: 'Klarere Tendenzen bezogen auf Ort, Reise, Handlung oder Begegnung.',
      24: 'Mehrere kleine Zeichen lassen sich zu einem brauchbaren Vorzeichenbild zusammensetzen.',
      32: 'Deine Deutung wird erstaunlich konkret in ihrer Richtung.',
      40: 'Du liest aus kleinsten Brüchen in der Welt belastbare Warnungen oder Hoffnungszeichen.'
    }
  },
  {
    id: 'resolve-cold-comfort',
    attribute: R,
    name: 'Cold Comfort',
    tagline:
      'Du kannst jemandem mit ruhiger Gewissheit, dunkler Ehrlichkeit oder stiller Zuversicht Halt geben, ohne falsche Hoffnung zu machen.',
    tiers: {
      8: 'Eine Person beruhigt sich durch deine Worte oder Anwesenheit.',
      16: 'Jemand, der innerlich kippt, findet durch dich wieder Halt.',
      24: 'Deine Ruhe kann kleine Gruppen mit stabilisieren.',
      32: 'Selbst in düsteren Situationen schaffst du tragfähige emotionale Ruhe.',
      40: 'Du wirkst wie ein dunkler Anker, an dem andere sich festhalten können.'
    }
  },
  {
    id: 'resolve-sense-taint',
    attribute: R,
    name: 'Sense Taint',
    tagline:
      'Du kannst an Orten, Dingen oder Personen spüren, ob etwas verdorben, falsch, unheilvoll oder geistig „schmutzig“ ist.',
    tiers: {
      8: 'Du spürst dumpf, dass etwas nicht stimmt.',
      16: 'Du kannst Person, Objekt oder Bereich als Quelle besser unterscheiden.',
      24: 'Frische, Stärke oder Art der Verdorbenheit werden deutlicher.',
      32: 'Selbst subtile Unreinheit oder geistige Fäulnis werden spürbar.',
      40: 'Dein Gespür für falsche Präsenz, Verderbnis und geistige Schwere ist außergewöhnlich fein.'
    }
  },
  {
    id: 'resolve-keep-watch',
    attribute: R,
    name: 'Keep Watch',
    tagline:
      'Du kannst in stiller Konzentration über lange Zeit wach, aufmerksam und innerlich gespannt bleiben, fast als würdest du auf etwas Unsichtbares lauschen.',
    tiers: {
      8: 'Du hältst verlässlicher Wache als andere.',
      16: 'Müdigkeit, Monotonie und lange Stille stumpfen dich viel weniger ab.',
      24: 'Feine Veränderungen in Geräusch, Luft oder Stimmung fallen dir eher auf.',
      32: 'Über lange Wachen bleibst du bemerkenswert klar und gespannt.',
      40: 'Deine Wachsamkeit wirkt fast unnatürlich gesammelt, als würdest du auch das Unsichtbare mithören.'
    }
  },
  {
    id: 'influence-carry-voice',
    attribute: F,
    name: 'Mirror Shade',
    tagline:
      'Du erzeugst einen kurzen Verwechslungs- oder Doppelbild-Effekt um dich herum.',
    tiers: {
      8: 'Ein kurzer falscher Eindruck, eine Blicktäuschung oder ein verwechselbarer Nachhall von dir.',
      16: 'Beobachter hängen für einen Moment an einer falschen Position oder Version von dir fest.',
      24: 'In Gruppen oder bewegten Szenen entsteht spürbare Verwirrung darüber, wo genau du gerade bist.',
      32: 'Verfolger, Beobachter oder flüchtige Zeugen erinnern sich oft zuerst an die falsche Version von dir.',
      40: 'Dein Bild kann sich sozial fast wie ein geisterhafter Zwilling vom eigentlichen Moment lösen.'
    }
  },
  {
    id: 'influence-read-the-room',
    attribute: F,
    name: 'Read the Room',
    tagline: 'Du liest nicht nur die Stimmung, sondern die verborgene soziale Wahrheit einer Szene.',
    tiers: {
      8: 'Du spürst Grundstimmung und offensichtliche Spannung.',
      16: 'Du erkennst, wer nur mitspielt, wer gleich kippt und wo Bruchlinien liegen.',
      24: 'Macht, Angst, Unsicherheit und emotionale Trigger einer kleinen Gruppe werden klar lesbar.',
      32: 'Selbst verdeckte Spannungen oder unausgesprochene soziale Rollen entgehen dir selten.',
      40: 'Du liest soziale Räume fast so, als würdest du den unausgesprochenen Untertext hören.'
    }
  },
  {
    id: 'influence-ease-tension',
    attribute: F,
    name: 'Glamour',
    tagline: 'Du legst ein trügerisches Erscheinungsbild über dich.',
    tiers: {
      8: 'Kleidung, Stil, Auftreten oder soziale Anmutung lassen sich sichtbar verschieben.',
      16: 'Du wirkst glaubhaft wie eine andere Herkunft, Rolle, Klasse oder Altersstufe.',
      24: 'Das Erscheinungsbild wird deutlich flexibler und kann ganze soziale Eindrücke neu schreiben.',
      32: 'Du kannst deine wahrgenommene äußere Erscheinung stark verändern.',
      40: 'Dein Glamour kann fast eine vollständige äußere Neuinterpretation deiner Person erzeugen.'
    }
  },
  {
    id: 'influence-command-presence',
    attribute: F,
    name: 'Vanish',
    tagline: 'Du kannst dich sozial und visuell aus dem Moment lösen und „weg“ sein.',
    tiers: {
      8: 'Du nutzt einen kurzen Bruch der Aufmerksamkeit, um aus dem Fokus zu verschwinden.',
      16: 'In Menge, Unruhe oder Bewegung bist du schnell nicht mehr dort, wo man dich erwartet.',
      24: 'Beobachter verlieren dich spürbar leichter aus Blick und Gedächtnis der Szene.',
      32: 'Du bist oft schon „weg“, bevor andere ihren Blick sortiert haben.',
      40: 'Dein Verschwinden wirkt wie ein kleiner sozialer Blink-Effekt, ohne echter Teleport zu sein.'
    }
  },
  {
    id: 'influence-silver-tongue',
    attribute: F,
    name: 'Silver Tongue',
    tagline:
      'Deine Worte können andere für einen kurzen Moment ihre eigenen Interessen, Vorbehalte, Verletzungen oder Vorsicht vergessen lassen.',
    tiers: {
      8: 'Man hört dir merklich eher zu als gewöhnlich.',
      16: 'Einzelne Personen lassen sich für einen Moment aus ihrer Vorsicht oder Agenda herausziehen.',
      24: 'Gespräche laufen spürbar eher auf deinem Frame als auf ihrem.',
      32: 'Selbst schwierige Gegenüber kommen dir weiter entgegen, als sie ursprünglich wollten.',
      40: 'Deine Worte können für kurze Zeit beinahe die Prioritäten im Raum neu sortieren.'
    }
  },
  {
    id: 'influence-silken-barb',
    attribute: F,
    name: 'Silken Barb',
    tagline: 'Du setzt einen eleganten, subtilen Satz, der im Kopf hängen bleibt und nachwirkt.',
    tiers: {
      8: 'Ein Zweifel oder kleiner Stachel bleibt bei einer Person zurück.',
      16: 'Die Bemerkung färbt sichtbar die Nachwirkung eines Gesprächs.',
      24: 'Der gesetzte Gedanke arbeitet länger und tiefer an Selbstbild, Unsicherheit oder Haltung.',
      32: 'Auch kleine Gruppen können durch einen gesetzten Satz jemanden oder etwas anders sehen.',
      40: 'Deine feinen sozialen Klingen hinterlassen elegante, lang anhaltende mentale Nachwirkungen.'
    }
  },
  {
    id: 'wits-nose-for-trouble',
    attribute: W,
    name: 'Nose for Trouble',
    tagline:
      'Du spürst schnell, wenn eine Situation kippt, etwas faul ist oder Ärger in der Luft liegt.',
    tiers: {
      8: 'Du merkst früh, dass etwas nicht stimmt.',
      16: 'Du nimmst kipplige Situationen, Hinterhalte oder Ärgerquellen klarer wahr.',
      24: 'Du spürst oft, wo Ärger gleich herkommen wird.',
      32: 'Selbst gut getarnte schlechte Stimmung oder drohende Probleme entgehen dir selten.',
      40: 'Dein Instinkt für Trouble wirkt fast unheimlich zuverlässig.'
    }
  },
  {
    id: 'wits-quick-read',
    attribute: W,
    name: 'Quick Read',
    tagline:
      'Du kannst eine Person, ein Objekt oder eine Situation in wenigen Augenblicken grob, aber oft treffsicher einschätzen.',
    tiers: {
      8: 'Erste brauchbare Einschätzung in Sekunden.',
      16: 'Charakter, Zustand oder Haken einer Sache werden rasch klar.',
      24: 'Du liest Situationen oder Menschen mit auffälliger Sicherheit an.',
      32: 'Selbst komplexere Lagen ergeben für dich schnell ein stimmiges Bild.',
      40: 'Deine ersten Eindrücke sind erschreckend oft treffsicher.'
    }
  },
  {
    id: 'wits-find-the-angle',
    attribute: W,
    name: 'Find the Angle',
    tagline:
      'Du erkennst rasch den einfachsten, cleversten oder praktischsten Ansatzpunkt in einer Situation.',
    tiers: {
      8: 'Du findest schnell den naheliegenden praktikablen Weg.',
      16: 'Du entdeckst oft den besseren Hebel, Zugang oder Trick.',
      24: 'Selbst chaotische Situationen haben für dich meist irgendwo einen funktionierenden Winkel.',
      32: 'Du siehst in schwierigen Lagen schnell, wo man wirklich ansetzen muss.',
      40: 'Fast jede festgefahrene Szene zeigt dir irgendeinen nutzbaren Angle.'
    }
  },
  {
    id: 'wits-keep-the-thread',
    attribute: W,
    name: 'Keep the Thread',
    tagline:
      'Du verlierst in chaotischen Gesprächen, Szenen oder Suchmomenten nicht so leicht den Faden.',
    tiers: {
      8: 'Du behältst das Wesentliche leichter im Kopf.',
      16: 'Auch bei Ablenkung oder Chaos bleibt die zentrale Linie für dich erhalten.',
      24: 'Mehrere Spuren, Verdachte oder Gesprächsstränge kannst du sauberer zusammenhalten.',
      32: 'Selbst in unübersichtlichen Szenen verlierst du kaum die eigentliche Sache.',
      40: 'Wo andere geistig zerfasern, hältst du die innere Linie fast mühelos.'
    }
  },
  {
    id: 'wits-improvised-solution',
    attribute: W,
    name: 'Improvised Solution',
    tagline: 'Du kannst aus einfachen Dingen schnell eine brauchbare kleine Zwecklösung machen.',
    tiers: {
      8: 'Einfache provisorische Hilfen, Keile, Haken, Marker oder Behelfslösungen.',
      16: 'Nützlichere kleine Konstruktionen aus dem, was gerade da ist.',
      24: 'Überraschend verlässliche Improvisationen mit klar erkennbarem Nutzen.',
      32: 'Aus fast jeder Umgebung lässt sich schnell etwas Brauchbares ziehen.',
      40: 'Deine Improvisationen wirken im Kleinen fast wie ein eigener Handwerksstil.'
    }
  },
  {
    id: 'wits-street-sense',
    attribute: W,
    name: 'Street Sense',
    tagline:
      'Du findest dich in Gassen, Märkten, Lagern, Tavernen und unübersichtlichen Alltagsräumen schnell zurecht.',
    tiers: {
      8: 'Du erkennst schnell Ausgänge, Engstellen und nützliche Punkte.',
      16: 'Du verstehst rasch, wie ein Ort sozial und praktisch funktioniert.',
      24: 'Selbst fremde Alltagsräume werden zügig lesbar und nutzbar für dich.',
      32: 'Du findest fast immer die richtigen Leute, Wege oder Orte zum Untertauchen, Beobachten oder Durchkommen.',
      40: 'In menschlichen Alltagsräumen bist du fast nie wirklich verloren.'
    }
  }
];

const BY_ID = new Map<string, MinorExpressionDefinition>();
for (const def of MINOR_EXPRESSIONS) {
  BY_ID.set(def.id, def);
}

export function getMinorExpressionDefinition(id: string): MinorExpressionDefinition | undefined {
  return BY_ID.get(id);
}

export function listMinorExpressionsByAttribute(attr: MinorExpressionAttribute): MinorExpressionDefinition[] {
  return MINOR_EXPRESSIONS.filter((d) => d.attribute === attr);
}

export function attributeForExpressionId(id: string): MinorExpressionAttribute | undefined {
  return BY_ID.get(id)?.attribute;
}

/** Highest tier threshold not above value; null if value < MIN or unknown. */
export function tierThresholdForAttributeValue(value: number): MinorExpressionTier | null {
  const v = Math.floor(Number(value));
  if (!Number.isFinite(v) || v < MINOR_EXPRESSION_MIN_ATTRIBUTE) return null;
  let best: MinorExpressionTier | null = null;
  for (const t of MINOR_EXPRESSION_TIERS) {
    if (v >= t) best = t;
  }
  return best;
}

/** True when the character's attribute value meets or exceeds this tier threshold. */
export function isTierUnlocked(attributeValue: number, tier: MinorExpressionTier): boolean {
  const v = Math.floor(Number(attributeValue));
  return Number.isFinite(v) && v >= tier;
}

export function tierBodyForExpression(def: MinorExpressionDefinition, attributeValue: number): string {
  const tier = tierThresholdForAttributeValue(attributeValue);
  if (!tier) return def.tagline;
  return def.tiers[tier];
}

export function sanitizeMinorExpressionIds(
  ids: string[] | undefined,
  getAttributeValue: (key: string) => number,
  masteryRank: number
): string[] {
  const cap = Math.max(0, Math.floor(Number(masteryRank)) || 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids || []) {
    const id = String(raw || '').trim();
    if (!id || seen.has(id)) continue;
    const def = BY_ID.get(id);
    if (!def) continue;
    const v = getAttributeValue(def.attribute);
    if (v < MINOR_EXPRESSION_MIN_ATTRIBUTE) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= cap) break;
  }
  return out;
}

export const MINOR_EXPRESSION_ATTRIBUTES: MinorExpressionAttribute[] = [
  'might',
  'agility',
  'intellect',
  'resolve',
  'influence',
  'wits'
];
