# Portfolio — Alper Bulat

360°-Weltall-Portfolio: Projekte, Werdegang, Skills und Kontakt als Himmelsobjekte. Next 16 (statischer Export) + three.js.

- Konzept & Entscheidungen: [`docs/konzept.md`](docs/konzept.md)
- Inhalte (einzige Quelle): [`docs/content.md`](docs/content.md)
- Arbeitsregeln für Claude-Sessions: [`CLAUDE.md`](CLAUDE.md)

```bash
npm ci && npm run dev
```

## Struktur

- `content/` — typisierte Inhalte (Quelle: `docs/content.md`), `de.ts` und `en.ts` mit gleicher Struktur. Ausgeblendete Einträge (`visible: "nein" | "offen"`) filtert `getPublicContent()` zur Build-Zeit heraus.
- `app/(de)/` → `/`, `app/(en)/en/` → `/en/`: je Sprache ein eigenes Root-Layout (eigenes `<html lang>`), Metadaten und hreflang aus `lib/site.ts`. `SITE_URL` setzt die Basis-URL, solange die Domain offen ist.
- `lib/scene/` — three.js-Szene (vanilla): `engine.ts` (Kamera, Reisen, Label-Platzierung ohne Überlappung, Loop), `sky.ts`, `post.ts` (Bloom, Kino-Pass mit farberhaltendem Tone-Mapping), `compass.ts` (Kompass-Band), `layout.ts` (Positionen und Akzentfarben der Objekte), `objects/` (ein Modul pro Himmelsobjekt).
- `components/` — React-UI: `Universe.tsx` (mountet die Szene, Labels, Tastatur, Tour), `Panel.tsx` (Panel bzw. ziehbares Bottom-Sheet), `ListView.tsx` (Listenansicht, semantisches HTML), `ObjectContent.tsx` (Inhalt eines Objekts, gemeinsam für Panel und Liste), `Legend.tsx` + `Glyph.tsx` (Legende).
- Himmel oder Liste: `lib/view-script.ts` entscheidet vor dem ersten Bild (WebGL 2? Software-Rendering?), `lib/view.ts` schaltet zur Laufzeit um. `?view=list` erzwingt die Liste, `?view=sky` den Himmel (ohne automatischen Rückfall).
