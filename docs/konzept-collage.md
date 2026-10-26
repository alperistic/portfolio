# Konzept: Lebende Collage (Vergleichsvariante)

Stand: 26.10.2026 · Entscheidung von Alper: Neben dem Weltall entsteht eine zweite Variante der Seite, damit beide gegeneinander getestet werden können. Das Weltall (`docs/konzept.md`) bleibt live und unverändert, bis der Vergleich entschieden ist.

## Zweck und Messlatte

Die Seite verkauft nichts, das machen late.systems und offerre.de. Sie soll Alper als Person zeigen: Stil, Persönlichkeit und dass er wirklich ausliefert.

- **Hauptgruppe:** Builder und Founder auf X, Englisch zuerst. **Haupt-Handlung:** Alper auf X folgen (@alperistic).
- **Nebengruppe:** Recruiter. Sie brauchen einen Überblick in 30 Sekunden, ohne Interaktion.
- **Die drei Fragen, die nach 10 Sekunden ohne Klick beantwortet sein müssen:**
  1. Wer ist das und was macht er?
  2. Ist das echt? Die laufenden Produkte stehen mit Status und Link schon auf dem ersten Bildschirm.
  3. Warum sollte ich folgen? Persönlichkeit, dazu ein sichtbarer Knopf „Follow on X“.

## Bildidee

Vorbild ist die Bildsprache von Musikvideos à la Pashanim: Eine freigestellte Person steht ruhig im Vordergrund, und hinter ihr wechseln die Szenen. Mal hart geschnitten, mal kurz überblendet: Dämmerung über Wasser, Blumen, Nachtfahrten, Gegenstände in Nahaufnahme. Die Freistellung darf ein wenig „Greenscreen“ sein, mit leichtem Lichtsaum am Rand. Das ist Charme, kein Fehler. Darüber liegt riesige, sehr dünne, hellblaue Schrift, die das Motiv überlappt. Die Stimmung ist warm, nächtlich und analog, mit Filmkorn und leichter Vignette.

Leitplanken:

- **Nur eigenes oder lizenziertes Material.** Keine Stilbilder aus dem Netz, keine Szenen aus fremden Videos (das Repo und die Seite sind öffentlich).
- **Szenen aus Alpers echtem Leben** statt geliehener Luxussymbole. Porsche und Parfum wirken bei einem Rapper, bei einem Gründer ohne öffentliche Umsätze aber wie Hustle-Inszenierung.
- **Persönlich, nicht kitschig.** Keine Emojis, kein Glassmorphism, keine Sticker-Orgie. Die Collage lebt vom Rhythmus der Schnitte und von der Schrift, nicht von möglichst vielen Elementen.

## Projekte in der Collage

Die wechselnden Szenen sind gleichzeitig eine Tour durch die Arbeit:

- Der Szenen-Zyklus mischt **Lebens-Szenen** mit **Projekt-Szenen**: offerre (Werkstatt/Handwerk), insertcoin.lol (Arcade, Neon, Magenta/Cyan), Evidence-First Pipeline (Papier, Akten, Zitate).
- Läuft eine Projekt-Szene, fliegt der echte **Einblick** des Projekts als Collage-Element ein. Er ist leicht gedreht, wie ein aufgeklebter Ausschnitt; die Dateien liegen schon in `public/work/`. Gleichzeitig leuchtet das Projekt im Beleg-Streifen auf.
- **Beleg-Streifen** auf dem ersten Bildschirm: offerre · live · Link / insertcoin.lol · live · Link / Evidence-First Pipeline · open source · Link, darunter Late als Dach. Hover oder Tap auf ein Projekt springt sofort zu seiner Szene und hält den Zyklus an.

## Aufbau

1. **Erster Bildschirm (100svh):** Szenen-Ebene → Person → Schrift (Name, Rolle „Founder of Late“, der Stärke-Satz aus dem Content) → Beleg-Streifen → „Follow on X“ (oben rechts und am Streifen). Alle Texte kommen aus `content/`, nichts wird erfunden.
2. **Darunter eine ruhige Ebene zum Überfliegen** (für Recruiter, gleiches Typo-System auf dunklem Grund): Work (drei Projekte plus Late, kurz), Path (Werdegang), Stack (Skill-Gruppen), Contact (X, GitHub, E-Mail-Platzhalter). Klassisches Scrollen ist hier ausdrücklich erlaubt, weil es eine eigene Variante ist.

## Bildmaterial (Slots)

Alper liefert später:

- 3–5 Fotos von sich vor ruhigem Hintergrund (für die Freistellung), Hochformat, möglichst hohe Auflösung.
- 10–20 eigene Szenen (Fotos oder kurze Clips, 3–6 s), davon je 1–2 pro Projekt.

Bis dahin zeigt der Prototyp **erkennbare Platzhalter**: generierte Farbflächen bzw. Verläufe je Szene mit Slot-Namen und eine schlichte Silhouette statt der Person. Alle Slots stehen in einer Manifest-Datei. Echtes Material wird nur eingetauscht, ohne Code-Umbau.

## Technik

- Route `/collage` (Englisch), gleiche Next-App, gleiche Inhalte aus `content/en.ts`. Eine DE-Fassung folgt erst nach dem Vergleich.
- `noindex` und nicht in der Sitemap, damit der Prototyp der Live-Seite keine Suchmaschinen-Konkurrenz macht. Von der Weltall-Seite aus nicht verlinkt.
- Keine three.js-Szene. CSS und wenig JS (Bilder, Videos, Überblendungen). Schnell auf jedem Handy.
- Schrift: zusätzlich eine dünne geometrische Display-Schrift, lokal als woff2 mit OFL-Lizenz unter `app/fonts/` (wie Sora und Plex, kein next/font/google).
- `prefers-reduced-motion`: kein automatischer Szenenwechsel, ein ruhiges Standbild, Projekte nur per Tap.
- Mobil: Person kleiner und nach unten verankert, Schrift bricht um, Beleg-Streifen gestapelt, „Follow on X“ immer erreichbar.

## Bewusst nicht

Kein Umbau der Weltall-Seite, keine Zusammenlegung beider Konzepte und kein Merge-Ziel vor dem Vergleich. Kein Tracking.
