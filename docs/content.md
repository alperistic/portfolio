# Content (Quelle der Wahrheit für die Seite)

Kuratiert von Alper (zuletzt 11.10.2026). **Nur was hier steht, darf auf die Seite.** Nichts dazuerfinden, keine Zahlen ergänzen. Fehlt etwas → als offene Frage markieren, nicht raten.

Sprache: Die Texte hier sind Deutsch. Englische Fassung wird in der Umsetzung übersetzt und von Alper abgenommen (gleicher Ton, keine Übertreibungen).

Sichtbarkeit pro Eintrag: `sichtbar: ja` = auf die Seite. Der Code kennt auch `nein` und `offen` (vorbereitet, aber ausgeblendet). Dieses Repo ist öffentlich: Was nicht auf die Seite soll, steht auch nicht hier, sondern in Alpers privatem Vault.

## Ton

Direkt, ruhig, selbstbewusst ohne Superlative. Belegbares statt Behauptungen („gebaut und betrieben" statt „erfolgreich"). Kein Marketing-Sprech, keine Emojis.

---

## Alper (Zentrum / Start)

- **Name:** Alper Bulat
- **Ort:** Karlsruhe
- **Rolle:** Gründer von Late
- **Intro:** Ich baue und betreibe Softwareprodukte mit Coding-Agents. Architektur, Prüfung und Entscheidungen bleiben bei mir. (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Link:** So arbeite ich, Late OS auf GitHub, https://github.com/alperistic/oneos (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Stärke:** entfällt auf der Seite (bisher: „Vage Produktideen in ausgelieferte Software verwandeln …“). (Lektorat 31.10.2026, Freigabe durch Alper offen)

---

## Projekte

### offerre — Spiralgalaxie · Late 01 · sichtbar: ja

- **Einzeiler:** Macht aus Kundenanfragen kalkulierte Angebotsentwürfe, für kleine Betriebe in Deutschland. (Freigabe Alper 31.10.2026)
- **Was es tut:** Aus einer Kundenanfrage in Freitext und der eigenen Preisliste wird automatisch ein kalkulierter Angebotsentwurf. Die KI liest, der Code rechnet, der Betrieb entscheidet und verschickt.
- **Für wen:** Kleine Dienstleister mit eigener Preisliste, zum Beispiel Reinigung, IT-Wartung oder Handel. Alles vor der Rechnung, neben lexoffice oder sevDesk. (Freigabe Alper 31.10.2026)
- **Status:** Live · Pilotphase (live seit April 2026, Freigabe Alper 31.10.2026).
- **Meine Rolle:** Allein gebaut und betrieben — Produkt, Backend, Frontend, Infrastruktur.
- **Belege:** Live unter offerre.de seit April 2026, derzeit Pilotphase · Jede Position nennt ihre Quelle in der Preisliste; fehlt eine Angabe, wird sie markiert statt geraten · KI-Verarbeitung in der EU (Azure OpenAI), Abrechnung über Stripe, Betrieb auf Hetzner. (Freigabe Alper 31.10.2026)
- **Stack:** Python/FastAPI, SQLAlchemy, Pydantic · React, Vite, Tailwind · PostgreSQL · Azure OpenAI (EU) · Stripe · Docker/Caddy auf Hetzner
- **Links:** https://offerre.de
- **Einblick:** Screenshot eines Angebotsentwurfs mit Beispieldaten (Quelle: Vorschau-Bild der offerre-Website, `public/work/offerre-entwurf.webp`). Bildunterschrift: „Ein Entwurf aus einer Anfrage, mit Beispieldaten.“ (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Framing-Regel:** Keine Kunden-, Nutzer- oder Umsatzzahlen behaupten (es gibt keine öffentlichen). Keine internen Vertriebsdetails.

### insertcoin.lol — Sternentstehungs-Nebel · Late 02 · sichtbar: ja

- **Einzeiler:** Eine Arcade, in der Startups gegeneinander antreten.
- **Was es tut:** Founder treten mit ihren Produkten 1:1 an. Die KI bewertet die Kriterien, der Code rechnet daraus das Ergebnis; jeder Sieg baut einen öffentlichen Win/Loss-Rekord auf. (Freigabe Alper 31.10.2026)
- **Für wen:** Indie-Founder, die Sichtbarkeit wollen statt eines weiteren Verzeichnis-Eintrags.
- **Status:** Live (geprüft am 11.10.2026: Matches und Rangliste laufen öffentlich).
- **Meine Rolle:** Konzept, Bau, Betrieb.
- **Stack:** Next.js, Supabase (Postgres), Vercel, Stripe, LLM über Vercel AI Gateway
- **Links:** https://insertcoin.lol
- **Einblick:** 8-Sekunden-Ausschnitt aus dem Trailer, stumm, in Schleife (`public/work/insertcoin-kampf.*`). Bildunterschrift: „Ausschnitt aus dem Trailer: Produkte treten als Kämpfer in der Arena an.“

### Evidence-First Pipeline — Doppelstern · Late 03 · sichtbar: ja

- **Einzeiler:** Dokumentanalyse mit KI, bei der jede Aussage ihren Beleg mitbringt.
- **Was es tut:** Das Modell findet die Stelle im Vertrag, der Code prüft das Zitat gegen die Seite und ordnet Beträge, Fristen und Parteien zu. Heraus kommt ein Vorschlag zur Prüfung, keine Entscheidung. (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Für wen:** Dokumenten-Workflows in Berufen mit Haftung: Kanzleien, Steuerberatung, Hausverwaltung.
- **Status:** Open Source.
- **Meine Rolle:** Konzept und Bau.
- **Belege:** Zitate werden gegen die zitierte Seite geprüft, die Trefferquote steht sichtbar in der Oberfläche · Beträge, Fristen und Parteien ordnet Python-Code zu, nicht das Modell · Uploads bleiben im Speicher, das Audit-Log speichert Hashes statt Dokumenttext · MIT-Lizenz, läuft lokal im Demo-Modus ohne Zugangsdaten. (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Stack:** Python, Azure OpenAI, Pydantic, rapidfuzz, Streamlit
- **Links:** https://github.com/alperistic/evidence-first-doc-pipeline
- **Einblick:** Ergebnisansicht mit Beispiel-Mietvertrag aus dem README-Screenshot (`public/work/pipeline-belege.webp`). Bildunterschrift: „Ergebnis für einen Beispiel-Mietvertrag.“ (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Quelle:** README des öffentlichen Repos.

### Late — Kosmisches Netz · Dachmarke · sichtbar: ja

- **Bezeichnung im Himmel:** Firma (statt Dachmarke, kein Tag mehr). (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Einzeiler:** Meine Firma. Darunter entstehen offerre, insertcoin.lol und die Evidence-First Pipeline. (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Was es ist:** Ich bin der menschliche Kern, KI-Agenten sind das operative Team, organisiert über Skills statt Rollen. Wie das aufgebaut ist, liegt offen in Late OS. (Freigabe Alper 31.10.2026)
- **Links:** Website, https://late-systems.vercel.app · Late OS, „Late OS auf GitHub“, https://github.com/alperistic/oneos (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **Framing-Regel:** Late ist die Dachmarke (Entscheidung 11.10.2026), Alper die Person dahinter. Kein Firmen-Pitch, keine internen Zahlen oder Prozessdetails. Visuell: verbindet die drei Projekte.

---

## Commit-Sterne

Um offerre, insertcoin.lol und die Evidence-First Pipeline sitzt je Commit ein kleiner Stern, innen die ältesten, außen die neuesten (freigegeben von Alper am 11.10.2026). Daten: nur Datum und Anzahl je Tag aus dem Hauptzweig, erzeugt mit `scripts/commit-stars.mjs` nach `content/commits.ts`. Keine Commit-Nachrichten, keine Autoren. Im Panel steht nur der Erklärsatz, keine Zahl.

- **DE:** Jeder kleine Lichtpunkt am Rand ist ein Commit: innen die ältesten, außen die neuesten.
- **EN:** Every small point of light around it is a commit: oldest inside, newest outside.

---

## Jahresring — GitHub-Beiträge um die Sonne

Um Alpers Sonne liegt sein vergangenes Jahr auf GitHub als Ring aus Lichtpunkten: die Wochen im Umlauf, die sieben Wochentage als Spuren, ein Punkt je Tag, die Helligkeit folgt der Zahl der Beiträge (freigegeben von Alper am 31.10.2026). Daten: nur Datum und Anzahl je Tag aus dem GitHub-Beitragskalender, private Repos nur als Anzahl, erzeugt mit `scripts/contribution-ring.mjs` nach `content/contributions.ts`. Im Alper-Panel steht nur der Erklärsatz, keine Zahl. (Lektorat 31.10.2026, Freigabe durch Alper offen)

- **DE:** Der Ring aus Lichtpunkten um die Sonne ist mein vergangenes Jahr auf GitHub: jeder Punkt ein Tag, je heller, desto mehr Beiträge.
- **EN:** The ring of points around the sun is my past year on GitHub: one point per day, brighter means more contributions.

---

## Werdegang — Sternbild

Jede Station ein Stern. Neue Stationen = neuer Eintrag in der Datenstruktur, das Sternbild wächst automatisch.

| Zeit | Station | sichtbar |
|---|---|---|
| 2020 | Abitur | ja |
| 10/2020 – 02/2021 | Praktikum Software-/Webentwicklung, technicsatelier GmbH, Stuttgart — Frontend-Bausteine mit HTML, CSS, JavaScript, TypeScript | ja |
| seit 04/2026 | Gründer von Late — offerre, insertcoin.lol (Lektorat 31.10.2026, Freigabe durch Alper offen) | ja |
| seit 09/2026 | Werkstudent – Fachkraft im E-Commerce (ohne Arbeitgebernamen) | ja |

Keine Noten, keine Schulnamen-Details darüber hinaus, keine Begründungen für Wechsel.

---

## Skills / Stack — Offener Sternhaufen

Jede Gruppe ein heller Stern im Haufen; Einträge erscheinen beim Hover/Fokus. Gruppen = Fähigkeiten, Einträge = Belege/Werkzeuge (Copy-Pass 28.09.2026). Labels kurz halten, sie schweben im Himmel.

Reihenfolge der Gruppen wie unten, „Mit Coding-Agents bauen“ zuerst; gestrichen: „Agentische Workflows“ und „Von der Idee bis zum Betrieb“; kein Lead mehr (bisher: „Was ich liefere — und womit.“). (Lektorat 31.10.2026, Freigabe durch Alper offen)

- **Mit Coding-Agents bauen:** Claude Code, Codex, Specs & Verifikation
- **Produkte ausliefern:** Produkt-Scoping, Review-Workflow, Automatisierte Tests, Stripe-Billing, Auth
- **KI im Produkt:** LLM-Features in Produktion, Extraktion aus Freitext, Deterministische Logik im Code · Azure OpenAI (EU), Anthropic Claude, Vercel AI Gateway
- **Web & Frontend:** TypeScript, React, Next.js, Vite, three.js, Tailwind CSS
- **Backend & Daten:** Python, FastAPI, SQLAlchemy, PostgreSQL, Supabase, XRechnung & ZUGFeRD, PDF-Verarbeitung
- **Betrieb & Datenschutz:** Hetzner, Docker, Caddy, Vercel, Cloudflare, DSGVO & EU-Datenhaltung, Datenschutzfreundliche Analytics
- **Sprachen:** Deutsch (Muttersprache), Englisch (C2), Türkisch

---

## Kontakt — Pulsar

- **X:** https://x.com/alperistic (Linktext „@alperistic“, steht als erster Link) (Lektorat 31.10.2026, Freigabe durch Alper offen)
- **GitHub:** https://github.com/alperistic
- **E-Mail:** hello@late.systems (Late-Adresse, Freigabe Alper 31.10.2026).
- **Kein LinkedIn** (bewusste Entscheidung).
- **CTA:** „Was ich baue und wie, schreibe ich auf X. Für alles andere: E-Mail.“ (Freigabe Alper 31.10.2026)

---

## Niemals auf die Seite

Alter/Geburtsdatum, Adresse, Telefonnummer, private Lebensumstände, Finanzen, Namen von Kunden/Leads, interne Strategie- und Entscheidungsnotizen, Inhalte aus Bewerbungen.
