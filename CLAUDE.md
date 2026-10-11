@AGENTS.md

# Portfolio — Alper Bulat (Weltall-Konzept)

Persönliche Portfolio-Seite: ein 360°-Weltall, in dem Projekte, Werdegang, Skills und Kontakt als Himmelsobjekte leben. Alper ist der Stern im Zentrum.

## Zuerst lesen (jede Session)

1. `docs/konzept.md` — Vision, **getroffene Entscheidungen (nicht neu verhandeln)**, Objekt-Zuordnung, Interaktion, Technik, Etappenplan.
2. `docs/content.md` — **einzige Quelle für Inhalte.** Nichts erfinden, keine Zahlen ergänzen, `sichtbar`-Flags respektieren.
3. Der abgenommene Look (Prototyp B) und alte Screenshots liegen im privaten Archiv-Repo `alperistic/portfolio-archiv` unter `prototypes/` und `docs/shots/`. Dieses Repo ist öffentlich: nichts hineinlegen, was nicht auf die Seite darf.

## Stack

- Next 16 App Router, React 19, TypeScript, `output: "export"` (statisch). **Next 16 hat Breaking Changes** — vor Next-Code die Guides in `node_modules/next/dist/docs/` lesen.
- three.js „vanilla" für die Szene (`lib/scene/`), React nur für UI. Kein react-three-fiber ohne Rücksprache (Begründung in `docs/konzept.md`).
- Content typisiert unter `content/`, je Eintrag DE + EN.
- Kein Tailwind (bestehende Entscheidung: bespoke CSS). Kein Tracking, keine Cookies.

## Befehle

```bash
npm ci
npm run dev      # lokal
npm run build    # statischer Export nach out/
npm run lint
```

## Arbeitsweise

- **Sprache:** Antworten, Commits-Beschreibungen und PR-Texte auf Deutsch. Alper lernt noch — Entscheidungen kurz erklären, Trade-offs zeigen, Fachbegriffe mit einem Satz Kontext.
- **Eine Session = ein PR** entlang der Etappen in `docs/konzept.md`. Kleine, fokussierte Commits. PR selbst öffnen (nicht als Draft), PR-Body ist der Handoff: was, warum, was bewusst nicht, wie verifiziert.
- **Verifikation ist Pflicht, nicht nur Typecheck:** `npm run build` + `npm run lint` grün, dann die Seite wirklich rendern (Playwright/Chromium headless, WebGL ggf. mit `--use-angle=swiftshader --enable-unsafe-swiftshader`) und Screenshots prüfen: Desktop 1440×900 (Start + fokussiertes Objekt) und Mobil 390×844. Keine Konsolenfehler. Screenshots im PR beschreiben bzw. anhängen.
- **Screenshots schonen:** verkleinert aufnehmen, nicht dasselbe Bild mehrfach lesen — Bilder fressen Kontext.
- **Geschmack:** filmisch, nicht kitschig. Keine Planeten. Nebel ist Akzent, nicht Tapete. Highlighting steuert den Fokus. Keine Emojis, keine Lens-Flare-Orgie, keine generischen Glassmorphism-Klischees.
- **Privatsphäre:** Nur Inhalte aus `docs/content.md`. Niemals private Daten (Adresse, Telefon, Alter, Finanzen, Kunden-/Lead-Namen) ins Repo — das Repo ist die Quelle der öffentlichen Seite.
- **Fragen statt raten** bei: neuen Inhalten/Claims, Deployment/Domain, neuen schweren Abhängigkeiten, Abweichungen von „entschieden" in `docs/konzept.md`.
