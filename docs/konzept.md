# Konzept: Weltall-Portfolio

Stand: 24.09.2026, aktualisiert 11.10.2026 · Entscheidungen von Alper, festgehalten nach Prototyp-Vergleich. Die Prototypen und alten Etappen-Screenshots liegen nicht in diesem öffentlichen Repo, sondern im privaten Archiv `alperistic/portfolio-archiv`.

## Vision in einem Satz

Man schwebt im All, sieht sich frei 360° um und reist zu leuchtenden Himmelsobjekten — jedes davon ist ein Teil von Alpers Arbeit. Alper selbst ist der Stern im Zentrum.

## Was entschieden ist (nicht neu verhandeln)

- **Look = Prototyp B „cinematic"** (im Archiv: `prototypes/weltall-b-cinematic.html`) ist die Basis. Alpers Urteil: „hat mich überzeugt und impressed, sieht sehr schön aus — am Design kann man feilen."
- **Prototyp A „minimal"** ist verworfen („sieht sehr leblos aus"). Nur einzelne UI-Ideen daraus dürfen übernommen werden, wenn sie B nicht beruhigen/entleeren: Kompass-Band oben (Orientierung beim Drehen), Legende zum Direktanspringen.
- **Keine Planeten.** Inhalte leben in Sternen, Galaxien, Nebeln, Sternhaufen und ähnlichen Objekten. Planeten aus Prototyp B fliegen raus.
- **Highlighting als Fokus-Werkzeug:** Was man ansieht/anfliegt, leuchtet auf; der Rest dimmt ab. So bleibt die Szene reich, aber lesbar.
- **Navigation = frei + geführt:** freies 360°-Drehen und Anklicken, plus optionale Tour („Nächster Stern →"), damit Eilige in ~60 s alles sehen.
- **Sprache: DE + EN.** `/` = Deutsch, `/en` = Englisch (statischer Export, beide Sprachen als eigene Seiten → SEO-fähig).
- **Die Welt IST die Seite.** Keine klassischen Scroll-Sektionen (frühere Konzepte mit Sektionen wurden abgelehnt).
- **Late ist die Dachmarke** (Entscheidung 11.10.2026, ersetzt „Personal-first, Late nur Signatur“): Alper ist die Person im Zentrum, Late das Haus, die Projekte sind Late-Produkte. Die Seite bleibt Alpers persönliche Seite.

## Himmelsobjekte → Inhalte

Vorschlag für die Zuordnung (Metapher soll zum Inhalt passen, darf in der Umsetzung verfeinert werden):

| Objekt | Inhalt | Warum diese Form |
|---|---|---|
| **Goldene Sonne mit Korona** | Alper (Start, Zentrum) | Der eigene Stern — hellstes, wärmstes Objekt. Einziges Objekt, das immer leicht strahlt. |
| **Spiralgalaxie** | offerre | Das größte, ausgereifteste Werk — eine ganze Welt für sich. |
| **Doppelstern** (zwei umeinander kreisende Sterne) | Evidence-First Pipeline | Behauptung ↔ Beleg, die sich gegenseitig prüfen; klein, präzise, eng gekoppelt. |
| **Sternentstehungs-Nebel mit Protostern** | insertcoin.lol | Entsteht gerade (Status: kurz vor Launch); Farbwelt darf leicht „arcade" sein (Magenta/Cyan). |
| **Kosmisches Netz / Filamente** mit Knotenpunkt | Late (Dachmarke) | Das Haus, das die Projekte verbindet. Bei Fokus leuchten die Filamente zu offerre, insertcoin und der Pipeline auf → perfekter Highlighting-Moment. |
| **Sternbild** (Punkte + Linien) | Werdegang | Jede Station ein Stern; das Sternbild wächst, wenn neue Stationen dazukommen. |
| **Offener Sternhaufen** (Plejaden-artig, blauer Reflexionsnebel) | Skills/Stack | Jeder helle Stern eine Skill-Gruppe, beim Hovern beschriftet. |
| **Pulsar** mit rotierenden Strahlen | Kontakt | Sendet ein Signal — „melde dich". |

**Deko ohne Inhalt** („weitere Elemente", sparsam, damit es lebt): gelegentliche Sternschnuppen, ein langsam ziehender Komet, ferne Hintergrundgalaxien, Milchstraßenband, Staub, der bei Reisen vorbeizieht. Optional ein Easter Egg (z. B. ein schwarzes Loch mit Gravitationslinse weit abseits).

## Interaktion

- **Umsehen:** Drag (Maus/Touch), Trägheit, Pitch geklemmt ±80°. Beim Start dezenter Hinweis „ziehen zum Umsehen". Nicht alle Objekte im Startblickfeld — Umdrehen soll belohnt werden.
- **Hover:** Objekt hellt auf, Label wird hervorgehoben, Cursor pointer. Labels immer sichtbar (klein), als HTML-Overlay.
- **Klick = Reise:** Kamerafahrt (~1,4–1,8 s, easeInOutCubic), dezente Warp-Andeutung (radial blur, FOV-Zug), Objekt landet leicht links der Mitte, rechts gleitet das Content-Panel rein. Alle anderen Objekte dimmen ab.
- **Zurück:** „← Zurück zu Alper", ESC, Klick ins Leere.
- **Tour:** Alper → Late → offerre → insertcoin → Pipeline → Werdegang → Skills → Kontakt (Dachmarke vor ihren Projekten).
- **Mobile (<768px):** Panel als Bottom-Sheet (max. 55vh, scrollbar), Tap statt Hover, weniger Partikel.
- **`prefers-reduced-motion`:** keine Kamerafahrt/Warp/Drift, stattdessen kurzer Fade-Schnitt.

## Design-Feinschliff gegenüber Prototyp B

Bekannte Schwächen, die in der Umsetzung gelöst werden sollen:
- Sternkerne brennen zu weiß aus → Tone-Mapping/Bloom-Threshold justieren, Farbtemperatur in den Kernen erhalten.
- Galaxie wirkt aus der Nähe körnig → mehr/kleinere Partikel mit weichem Falloff, Staubbahnen.
- Planeten entfernen (siehe oben).
- Typo schärfen: Hierarchie im Panel, Label-Lesbarkeit auf hellem Nebel (dezenter Text-Schatten/Backdrop).
- Der „Platzhalter"-Tag verschwindet, sobald echter Content aus `content/` kommt.
- Geschmacks-Leitplanken: filmisch, nicht kitschig. Keine Lens-Flare-Orgie, keine Emojis, keine generischen Glassmorphism-Klischees. Nebel ist Akzent, nicht Tapete.

## Barrierefreiheit, SEO, Fallback (Pflicht, nicht „später")

- Aller Content existiert zusätzlich als **semantisches HTML** im statischen Export (Überschriften, Listen, Links) — für Crawler, Screenreader und als **„Listenansicht"**-Umschalter für Menschen, die nicht fliegen wollen (Recruiter!).
- Kein WebGL / zu schwaches Gerät → automatisch die Listenansicht, im gleichen Look (dunkel, Sternenhimmel als statisches Bild).
- Tastaturbedienbar: Tab durch die Objekte, Enter = hinfliegen, ESC = zurück, Pfeile = Tour.

## Technik

- **Next 16 App Router, TypeScript, statischer Export** (bestehendes Setup). Vor dem Coden: `node_modules/next/dist/docs/` lesen (siehe `AGENTS.md`).
- **Szene: three.js „vanilla" als eigene TS-Module** (z. B. `lib/scene/`), gemountet in einer Client-Komponente. React nur für UI (Panel, Labels, Tour, Sprachumschalter, Listenansicht).
  - Begründung: Der Prototyp ist bereits vanilla three.js mit eigenen Shadern und Postprocessing — ein 1:1-Port ist risikoärmer und schlanker als ein Umbau auf react-three-fiber. Szene und UI kommunizieren über ein kleines Event-/State-Interface (`focus(id)`, `onFocusChange`, `onHover`).
- **Content getrennt vom Code:** typisierte Daten unter `content/` (Quelle: `docs/content.md`), je Eintrag DE + EN. Neue Station/neues Projekt = ein Eintrag, kein Code-Umbau.
- **Performance-Budget:** flüssig auf MacBook, benutzbar auf Mittelklasse-Handy; three.js per Tree-Shaking; Nebel-Cubemap einmal vorberechnen (wie im Prototyp); PixelRatio ≤ 2; Partikelzahlen nach Gerät.
- **Kein Tracking** in v1. Keine Cookies.

## Umsetzung in Etappen (je eine Cloud-Session = ein PR)

1. **Port:** Prototyp B als Next-Client-Komponente + Szene-Module, Content aus `content/`, Planeten ersetzt durch die Objekte oben (erst mal einfache Versionen), DE-Content. Build + Screenshots grün.
2. **Objekte & Highlighting:** Galaxie, Doppelstern, Nebel, Filamente (Late), Sternhaufen, Pulsar ausarbeiten; Fokus-Dimming; Deko (Sternschnuppen, Komet).
3. **UI & Typo:** Panel-Design, Labels, Tour, Kompass/Legende falls sinnvoll, Mobile-Bottom-Sheet, Design-Feinschliff-Liste oben.
4. **Zugänglichkeit & i18n:** Listenansicht, semantisches HTML, Tastatur, `/en`, reduced-motion, WebGL-Fallback.
5. **Launch-Vorbereitung:** Performance auf echten Geräten, Safari/Firefox, Meta/OG-Bild, Impressum/Datenschutz, Deployment.
6. **Inszenierung** (vorgezogen vor 5): Eröffnung, Zielerfassung, Sternbild zeichnet sich, Panel-Choreografie, Tour-Autopilot, Klang (opt-in), Maus-Parallaxe. Details unten.

## Inszenierung (Etappe 6)

Ziel: Die Seite soll sich wie der Anfang eines Films anfühlen, ohne ins Kitschige zu kippen. Jede Bewegung hat einen Zweck (Orientierung, Fokus, Rhythmus) und bleibt abschaltbar.

- **Eröffnung:** Beim ersten Besuch je Sitzung (`sessionStorage`) läuft während der Kamerafahrt eine Titelkarte ein: Name Buchstabe für Buchstabe, Rolle, Goldlinie (bewusst ohne Slogan — der offerre-Satz „KI liest, Code rechnet …“ gehört nur zu offerre). Danach kommt die Bedienung gestaffelt dazu. Jede Eingabe überspringt; `?nointro` und reduced-motion zeigen sie nie. Für Screenreader ausgeblendet (Inhalt steht im Panel/der Liste).
- **Zielerfassung:** Beim Hover rastet ein feiner Rahmen (vier Ecken) auf das Objekt ein, daneben die Distanz in AE. Ersetzt kein Label, sondern bestätigt das Ziel.
- **Sternbild zeichnet sich:** Beim Anflug auf den Werdegang leuchten die Stationen nacheinander auf, die Linie wächst mit einem Funken an der Spitze von Station zu Station; Stations-Labels erscheinen erst, wenn ihr Stern brennt.
- **Panel-Choreografie:** Titel per Clip-Reveal, Abschnitte gestaffelt, Kennzahlen in Belegen zählen einmal hoch (Screenreader lesen den fertigen Text).
- **Tour-Autopilot:** „Tour starten" fliegt selbstständig weiter; die Verweildauer richtet sich nach der Textmenge (`4 s + 0,075 s/Wort`, 6,5–12 s), sichtbar als Füllbalken im aktiven Schritt. Hover (Maus) oder Berühren hält an; Pause-Knopf im Panel; Zurück/ESC beendet.
- **Klang (opt-in):** Standardmäßig aus, Schalter „Ton" neben der Sprache. Komplett per WebAudio synthetisiert (keine Dateien): tiefer Grundton, Rauschen bei Reisen, je Objekt ein Ton der A-Moll-Pentatonik bei Hover/Ankunft, leises Signal beim Pulsar-Blitz. Stumm in der Listenansicht und bei verstecktem Tab. Wird bewusst nicht gespeichert.
- **Parallaxe:** Nur mit feinem Zeiger (Maus), sehr leicht, im Fokus gedämpft, aus bei reduced-motion und beim Ziehen/Reisen.
- **Bewusst nicht:** Hyperraum-Streifen, Kamera-Wackeln, Partikel-Explosionen, Ton per Default an, Intro bei jedem Besuch.

## Etappe 7: Arbeit zeigen, Sternenstaub, Gravitation (11.10.2026)

Anstoß: Vergleich mit hancore.dev — weniger neue Technik, mehr die eigene Metapher konsequent ausspielen.

- **Einblicke:** Jedes Projekt-Panel zeigt direkt unter dem Lead einen echten Einblick (`media` im Content): offerre einen Angebotsentwurf, insertcoin einen stummen Trailer-Ausschnitt in Schleife, die Pipeline ihre Ergebnisansicht. Rahmen mit vier Eckmarken wie die Zielerfassung, Klick vergrößert (natives `<dialog>`). Nur Demo-/Beispieldaten. Clips laufen nur sichtbar und bei offenem Panel, bei reduced-motion gar nicht von selbst.
- **Sternenstaub:** In der Eröffnung lösen sich Funken aus der Sonne und formen auf Bögen den Namen; dann blendet die Schrift scharf ein, beim Ausblenden zerstreut sich der Staub (`lib/opening-dust.ts`, Canvas 2D). Klappt das Abtasten nicht, bleibt die alte Buchstaben-Animation.
- **Gravitation am Zeiger:** Eine weiche Punktmassen-Linse im Kino-Pass biegt Sterne und Staub um den Mauszeiger. Nur feiner Zeiger, nur über offenem Himmel (nicht über Objekten, Labels, Panel), im Fokus halb, aus beim Ziehen/Reisen/Eröffnung/reduced-motion.

## Jahresring (31.10.2026)

Alpers GitHub-Beitragskalender als Sternenfeld, ohne Zahlen (Idee vom 30.10., Platz von Alper gewählt: Ring um die Sonne statt eigenes Objekt oder Hintergrund-Deko).

- **Form:** Das GitHub-Raster ist zu einem Ring um die Sonne gerollt: die Wochen im Umlauf, die sieben Wochentage als Spuren von innen (Sonntag) nach außen (Samstag), ein Lichtpunkt je Tag. Die Naht liegt oben hinter der Sonne, die Zeit läuft aus der Startansicht im Uhrzeigersinn. Innenradius etwa 3,5 Sonnenradien (außerhalb von Korona und Bloom), um 43° geneigt, damit er als offene Ellipse liest und nicht als Saturnring.
- **Helligkeit:** folgt den Beiträgen, logarithmisch auf das 95. Perzentil normiert (ein Ausreißer drückt nicht alles platt). Tage ohne Beitrag sind schwacher Staub. Gold wie die Sonne, zu warmem Weiß bei viel Aktivität, kein GitHub-Grün. Die letzten 14 Tage flackern leise wärmer, wie bei den Commit-Sternen.
- **Verhalten:** statisch, dimmt und hellt mit der Sonne. In der Eröffnung erst nach der Titelkarte weich eingeblendet. Im Alper-Panel nur der Erklärsatz aus `docs/content.md`.
- **Daten:** `scripts/contribution-ring.mjs` holt den Kalender lokal über `gh` und schreibt `content/contributions.ts` (nur Datum und Anzahl, eingecheckt wie die Commit-Sterne). Aktualisieren: Skript laufen lassen, committen.

## Launch-Stand (Etappe 5, Teil 1)

- **Hosting:** Vercel, Projekt `portfolio`. Jeder Merge auf `main` geht automatisch live (Produktion), jeder PR bekommt eine Vorschau-URL. Aktuell nur `portfolio-mauve-nu-64.vercel.app`, eigene Domain fehlt.
- **Teilen/SEO:** Vorschaubild je Sprache (`public/og-de.jpg`, `og-en.jpg`, 1200×630, echtes Bild der Eröffnung), Twitter-Card, `robots.txt`, `sitemap.xml` mit hreflang. Absolute URLs kommen aus `SITE_URL` bzw. der Vercel-Produktions-URL — bei neuer Domain nichts im Code ändern.
- **Icons:** eigene Sonne statt Next-Standard (`app/icon.svg`, `favicon.ico`, `apple-icon.png`).
- **Browser:** Chromium und WebKit (Safari-Engine) geprüft, keine Fehler, 60 fps. Firefox konnte lokal nicht automatisiert getestet werden (Playwright-Firefox startet auf diesem macOS nicht) → einmal von Hand prüfen.
- **Performance:** Szene wird nachgeladen; JS komprimiert ca. 300 KB (davon three.js ca. 130 KB). PixelRatio auf 2 gedeckelt.

## Offene Punkte (Alper entscheidet)

- **Eigene Domain + E-Mail** (entschieden: eigene Domain-Adresse statt Gmail; Domain noch zu kaufen). Danach Domain in Vercel verbinden, Adresse in `docs/content.md`/`content/` eintragen.
- **Impressum + Datenschutz:** brauchen eine ladungsfähige Anschrift (Impressums-Adresse holt Alper noch). Die Adresse gehört nicht ins Repo, solange sie privat ist — nur eine Geschäfts-/Service-Adresse.
- **Firefox** einmal manuell prüfen.
- ~~Live-Status von insertcoin.lol prüfen~~ erledigt 11.10.2026: live, Status und Link angepasst.
