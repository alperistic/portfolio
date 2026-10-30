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
- **Intro (Vorschlag):** Ich baue funktionierende Software — von der Idee bis zum laufenden Betrieb. Mit KI-gestützten Entwicklungs-Workflows, aber mit klarer Verantwortung: Architektur, Verifikation und Entscheidungen liegen bei mir.
- **Stärke (für Unterzeile/Tour-Intro):** Vage Produktideen in ausgelieferte Software verwandeln — schnell iterieren mit Coding-Agents, ohne die Kontrolle abzugeben.

---

## Projekte

### offerre — Spiralgalaxie · Late 01 · sichtbar: ja

- **Einzeiler:** KI-gestützte Angebotserstellung für deutsche KMU.
- **Was es tut:** Aus einer Kundenanfrage in Freitext und der eigenen Preisliste wird automatisch ein kalkulierter Angebotsentwurf. Die KI liest, der Code rechnet, der Betrieb entscheidet und verschickt.
- **Für wen:** Kleine und mittlere Betriebe, vor allem Handwerk — alles vor der Rechnung, als Ergänzung zu lexoffice/sevDesk.
- **Status:** Live seit April 2026.
- **Meine Rolle:** Allein gebaut und betrieben — Produkt, Backend, Frontend, Infrastruktur.
- **Belege:** ~680 Commits seit Livegang · über 150 Pull Requests mit Review-Workflow · 130+ automatisierte Tests · eigene Infrastruktur auf Hetzner (Docker, Caddy).
- **Stack:** Python/FastAPI, SQLAlchemy, Pydantic · React, Vite, Tailwind · PostgreSQL · Azure OpenAI (EU) · Stripe · Docker/Caddy auf Hetzner
- **Links:** https://offerre.de
- **Einblick:** Screenshot eines Angebotsentwurfs mit Beispieldaten (Quelle: Vorschau-Bild der offerre-Website, `public/work/offerre-entwurf.webp`). Bildunterschrift: „Ein Entwurf aus einer Anfrage. Jede Position nennt ihre Quelle in der Preisliste; fehlt eine Angabe, wird sie markiert statt geraten. Beispieldaten.“
- **Framing-Regel:** Keine Kunden-, Nutzer- oder Umsatzzahlen behaupten (es gibt keine öffentlichen). Keine internen Vertriebsdetails.

### insertcoin.lol — Sternentstehungs-Nebel · Late 02 · sichtbar: ja

- **Einzeiler:** Eine Arcade, in der Startups gegeneinander antreten.
- **Was es tut:** Founder treten mit ihren Produkten 1:1 in KI-bewerteten Matches an; jeder Sieg baut einen öffentlichen Win/Loss-Rekord auf. Die Wertung ist deterministisch im Code, nicht nach Gefühl.
- **Für wen:** Indie-Founder, die Sichtbarkeit wollen statt eines weiteren Verzeichnis-Eintrags.
- **Status:** Live (geprüft am 11.10.2026: Matches und Rangliste laufen öffentlich).
- **Meine Rolle:** Konzept, Bau, Betrieb.
- **Stack:** Next.js, Supabase (Postgres), Vercel, Stripe, LLM über Vercel AI Gateway
- **Links:** https://insertcoin.lol
- **Einblick:** 8-Sekunden-Ausschnitt aus dem Trailer, stumm, in Schleife (`public/work/insertcoin-kampf.*`). Bildunterschrift: „Ausschnitt aus dem Trailer: Produkte treten als Kämpfer in der Arena an.“

### Evidence-First Pipeline — Doppelstern · Late 03 · sichtbar: ja

- **Einzeiler:** Dokumentanalyse mit KI, bei der jede Aussage ihren Beleg mitbringt.
- **Was es tut:** Das Sprachmodell findet, wo in einem langen Vertrag etwas steht. Jeder extrahierte Wert kommt mit Seitenzahl und wörtlichem Zitat und wird gegen den Quelltext geprüft, bevor er erscheint. Was eine Regel entscheiden kann, entscheidet der Code. Das Ergebnis ist ein Vorschlag zur Prüfung, nie eine Entscheidung.
- **Für wen:** Dokumenten-Workflows in Berufen mit Haftung: Kanzleien, Steuerberatung, Hausverwaltung.
- **Status:** Open Source.
- **Meine Rolle:** Konzept und Bau.
- **Belege:** Zitate werden gegen die zitierte Seite geprüft, die Trefferquote steht sichtbar in der Oberfläche · Beträge, Fristen und Parteien ordnet Python-Code zu, nicht das Modell · Uploads bleiben im Speicher, das Audit-Log speichert Hashes statt Dokumenttext.
- **Stack:** Python, Azure OpenAI, Pydantic, rapidfuzz, Streamlit
- **Links:** https://github.com/alperistic/evidence-first-doc-pipeline
- **Einblick:** Ergebnisansicht mit Beispiel-Mietvertrag aus dem README-Screenshot (`public/work/pipeline-belege.webp`). Bildunterschrift: „Ergebnis für einen Beispielvertrag: Jede Angabe steht mit Seitenzahl und wörtlichem Zitat da.“
- **Quelle:** README des öffentlichen Repos.

### Late — Kosmisches Netz · Dachmarke · sichtbar: ja

- **Einzeiler:** Das Haus, unter dem ich Software baue.
- **Was es ist:** Late ist meine Firma: ein kleiner menschlicher Kern, KI-Agenten als operatives Team, organisiert über eine Bibliothek aus Fähigkeiten statt über Rollen. offerre, insertcoin.lol und die Evidence-First Pipeline sind darunter entstanden.
- **Links:** Website, https://late-systems.vercel.app · Late OS, https://github.com/alperistic/oneos
- **Framing-Regel:** Late ist die Dachmarke (Entscheidung 11.10.2026), Alper die Person dahinter. Kein Firmen-Pitch, keine internen Zahlen oder Prozessdetails. Visuell: verbindet die drei Projekte.

---

## Commit-Sterne

Um offerre, insertcoin.lol und die Evidence-First Pipeline sitzt je Commit ein kleiner Stern, innen die ältesten, außen die neuesten (freigegeben von Alper am 11.10.2026). Daten: nur Datum und Anzahl je Tag aus dem Hauptzweig, erzeugt mit `scripts/commit-stars.mjs` nach `content/commits.ts`. Keine Commit-Nachrichten, keine Autoren. Im Panel steht nur der Erklärsatz, keine Zahl.

- **DE:** Jeder kleine Lichtpunkt am Rand ist ein Commit: innen die ältesten, außen die neuesten.
- **EN:** Every small point of light around it is a commit: oldest inside, newest outside.

---

## Werdegang — Sternbild

Jede Station ein Stern. Neue Stationen = neuer Eintrag in der Datenstruktur, das Sternbild wächst automatisch.

| Zeit | Station | sichtbar |
|---|---|---|
| 2020 | Abitur | ja |
| 10/2020 – 02/2021 | Praktikum Software-/Webentwicklung, technicsatelier GmbH, Stuttgart — Frontend-Bausteine mit HTML, CSS, JavaScript, TypeScript | ja |
| seit 04/2026 | Gründer von Late (selbstständig) — offerre live | ja |
| seit 09/2026 | Werkstudent – Fachkraft im E-Commerce (ohne Arbeitgebernamen) | ja |

Keine Noten, keine Schulnamen-Details darüber hinaus, keine Begründungen für Wechsel.

---

## Skills / Stack — Offener Sternhaufen

Jede Gruppe ein heller Stern im Haufen; Einträge erscheinen beim Hover/Fokus. Gruppen = Fähigkeiten, Einträge = Belege/Werkzeuge (Copy-Pass 28.09.2026). Labels kurz halten, sie schweben im Himmel.

- **Lead:** Was ich liefere — und womit.
- **Produkte ausliefern:** Von der Idee bis zum Betrieb, Produkt-Scoping, Review-Workflow, Automatisierte Tests, Stripe-Billing, Auth
- **KI im Produkt:** LLM-Features in Produktion, Extraktion aus Freitext, Deterministische Logik im Code · Azure OpenAI (EU), Anthropic Claude, Vercel AI Gateway
- **Mit Coding-Agents bauen:** Claude Code, Codex, Agentische Workflows, Specs & Verifikation
- **Web & Frontend:** TypeScript, React, Next.js, Vite, three.js, Tailwind CSS
- **Backend & Daten:** Python, FastAPI, SQLAlchemy, PostgreSQL, Supabase, XRechnung & ZUGFeRD, PDF-Verarbeitung
- **Betrieb & Datenschutz:** Hetzner, Docker, Caddy, Vercel, Cloudflare, DSGVO & EU-Datenhaltung, Datenschutzfreundliche Analytics
- **Sprachen:** Deutsch (Muttersprache), Englisch (C1/C2), Türkisch

---

## Kontakt — Pulsar

- **GitHub:** https://github.com/alperistic
- **E-Mail:** alper@offerre.de (Übergang, bis eine Adresse auf eigener Domain steht).
- **Kein LinkedIn** (bewusste Entscheidung).
- **CTA-Vorschlag:** „Du baust etwas und brauchst jemanden, der es wirklich ausliefert? Schreib mir."

---

## Niemals auf die Seite

Alter/Geburtsdatum, Adresse, Telefonnummer, private Lebensumstände, Finanzen, Namen von Kunden/Leads, interne Strategie- und Entscheidungsnotizen, Inhalte aus Bewerbungen.
