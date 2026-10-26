import type { SiteContent } from "./types";

/**
 * Deutsche Inhalte — 1:1 aus docs/content.md (Stand 24.09.2026).
 * Neue Station / neues Projekt = neuer Eintrag hier, kein Code-Umbau.
 * Einträge mit `visible: "nein" | "offen"` bleiben vorbereitet, werden aber
 * serverseitig herausgefiltert und landen nicht im ausgelieferten JavaScript.
 */
export const de: SiteContent = {
  locale: "de",
  meta: {
    title: "Alper Bulat — Gründer von Late",
    description:
      "Alper Bulat aus Karlsruhe, Gründer von Late. Ich baue funktionierende Software — von der Idee bis zum laufenden Betrieb.",
  },
  brand: {
    name: "Alper Bulat",
    subline: "Gründer von Late · Karlsruhe",
  },
  ui: {
    loading: "Kalibriere Himmel",
    dragHint: "Ziehen zum Umsehen",
    tourStart: "Tour starten",
    back: "← Zurück zu Alper",
    backFromCenter: "← Übersicht",
    next: "Nächster Stern",
    restart: "Von vorn",
    close: "Schließen",
    center: "Zentrum",
    lookAt: "{name} ansehen",
    legend: "Legende",
    tourStep: "Station",
    canvasLabel: "Himmel, ziehen zum Umsehen",
    langGroup: "Sprache",
    langName: "Deutsch",
    listView: "Listenansicht",
    skyView: "Zum Himmel",
    keysHint: "Tab wählt ein Objekt, Enter fliegt hin, Pfeil links/rechts folgt der Tour, Esc führt zurück.",
    contents: "Inhalt",
    fallback: {
      webgl: "Dieses Gerät kann den 3D-Himmel nicht darstellen. Hier stehen alle Inhalte als Liste.",
      weak: "Der 3D-Himmel würde auf diesem Gerät ruckeln. Hier stehen alle Inhalte als Liste.",
      slow: "Der 3D-Himmel lief auf diesem Gerät nicht flüssig. Hier stehen alle Inhalte als Liste.",
      lost: "Die Grafik ist ausgefallen. Hier stehen alle Inhalte als Liste.",
      load: "Der Himmel konnte nicht geladen werden. Hier stehen alle Inhalte als Liste.",
    },
    tryAnyway: "Himmel trotzdem laden",
    skipIntro: "Intro überspringen",
    sound: "Ton",
    autoPlay: "Tour automatisch abspielen",
    autoPause: "Tour anhalten",
    enlarge: "Einblick vergrößern",
    shrink: "Vergrößerung schließen",
    commitNote: "Jeder kleine Lichtpunkt am Rand ist ein Commit: innen die ältesten, außen die neuesten.",
  },
  tourOrder: [
    "alper",
    "late",
    "offerre",
    "insertcoin",
    "pipeline",
    "werdegang",
    "skills",
    "kontakt",
  ],
  objects: {
    alper: {
      id: "alper",
      visible: "ja",
      label: "Alper",
      meta: "Zentrum",
      kicker: "Der eigene Stern",
      title: "Alper Bulat",
      tags: [
        { text: "Gründer von Late", color: "#f1c98e" },
        { text: "Karlsruhe" },
      ],
      lead: "Ich baue funktionierende Software — von der Idee bis zum laufenden Betrieb. Mit KI-gestützten Entwicklungs-Workflows, aber mit klarer Verantwortung: Architektur, Verifikation und Entscheidungen liegen bei mir.",
      body: [
        "Vage Produktideen in ausgelieferte Software verwandeln — schnell iterieren mit Coding-Agents, ohne die Kontrolle abzugeben.",
      ],
    },

    werdegang: {
      id: "werdegang",
      visible: "ja",
      label: "Werdegang",
      meta: "Sternbild",
      kicker: "Sternbild",
      title: "Werdegang",
      tags: [],
      lead: "Jede Station ein Stern.",
      stations: [
        { year: "2020", period: "2020", title: "Abitur", visible: "ja" },
        {
          year: "2020",
          period: "10/2020 – 02/2021",
          title: "Praktikum Software-/Webentwicklung",
          detail:
            "technicsatelier GmbH, Stuttgart — Frontend-Bausteine mit HTML, CSS, JavaScript, TypeScript",
          visible: "ja",
        },
        {
          year: "2026",
          period: "seit 04/2026",
          title: "Gründer von Late (selbstständig)",
          detail: "offerre live",
          visible: "ja",
        },
        {
          year: "2026",
          period: "seit 09/2026",
          title: "Werkstudent – Fachkraft im E-Commerce",
          visible: "ja",
        },
      ],
    },

    offerre: {
      id: "offerre",
      visible: "ja",
      label: "offerre",
      meta: "Projekt · Live",
      kicker: "Late · 01 / 03",
      title: "offerre",
      tags: [{ text: "Live seit April 2026", color: "#6fe3c1" }],
      lead: "KI-gestützte Angebotserstellung für deutsche KMU.",
      media: {
        src: "/work/offerre-entwurf.webp",
        width: 505,
        height: 300,
        alt: "Angebotsentwurf in offerre: vier Positionen mit Preisen, jede mit ihrer Quelle in der Preisliste. Bei einer Position fehlt die Menge, sie ist markiert statt geschätzt.",
        caption: "Ein Entwurf aus einer Anfrage. Jede Position nennt ihre Quelle in der Preisliste; fehlt eine Angabe, wird sie markiert statt geraten. Beispieldaten.",
      },
      body: [
        "Aus einer Kundenanfrage in Freitext und der eigenen Preisliste wird automatisch ein kalkulierter Angebotsentwurf. Die KI liest, der Code rechnet, der Betrieb entscheidet und verschickt.",
      ],
      facts: [
        {
          label: "Für wen",
          value:
            "Kleine und mittlere Betriebe, vor allem Handwerk — alles vor der Rechnung, als Ergänzung zu lexoffice/sevDesk.",
        },
        {
          label: "Meine Rolle",
          value:
            "Allein gebaut und betrieben — Produkt, Backend, Frontend, Infrastruktur.",
        },
        {
          label: "Belege",
          value: [
            "~680 Commits seit Livegang",
            "über 150 Pull Requests mit Review-Workflow",
            "130+ automatisierte Tests",
            "eigene Infrastruktur auf Hetzner (Docker, Caddy)",
          ],
        },
        {
          label: "Stack",
          display: "chips",
          value: [
            "Python/FastAPI, SQLAlchemy, Pydantic",
            "React, Vite, Tailwind",
            "PostgreSQL",
            "Azure OpenAI (EU)",
            "Stripe",
            "Docker/Caddy auf Hetzner",
          ],
        },
      ],
      links: [{ label: "Website", text: "offerre.de", href: "https://offerre.de" }],
    },

    insertcoin: {
      id: "insertcoin",
      visible: "ja",
      label: "insertcoin.lol",
      meta: "Projekt · Live",
      kicker: "Late · 02 / 03",
      title: "insertcoin.lol",
      tags: [{ text: "Live", color: "#ff7ad9" }],
      lead: "Eine Arcade, in der Startups gegeneinander antreten.",
      media: {
        src: "/work/insertcoin-kampf.webp",
        video: ["/work/insertcoin-kampf.webm", "/work/insertcoin-kampf.mp4"],
        width: 720,
        height: 536,
        alt: "Ausschnitt aus dem Trailer von insertcoin.lol: Pixel-Art-Kämpfer treten in der Arena gegeneinander an, darunter offerre.",
        caption: "Ausschnitt aus dem Trailer: Produkte treten als Kämpfer in der Arena an.",
        pixelated: true,
      },
      body: [
        "Founder treten mit ihren Produkten 1:1 in KI-bewerteten Matches an; jeder Sieg baut einen öffentlichen Win/Loss-Rekord auf. Die Wertung ist deterministisch im Code, nicht nach Gefühl.",
      ],
      facts: [
        {
          label: "Für wen",
          value:
            "Indie-Founder, die Sichtbarkeit wollen statt eines weiteren Verzeichnis-Eintrags.",
        },
        { label: "Meine Rolle", value: "Konzept, Bau, Betrieb." },
        {
          label: "Stack",
          display: "chips",
          value: [
            "Next.js",
            "Supabase (Postgres)",
            "Vercel",
            "Stripe",
            "LLM über Vercel AI Gateway",
          ],
        },
      ],
      links: [{ label: "Website", text: "insertcoin.lol", href: "https://insertcoin.lol" }],
    },

    pipeline: {
      id: "pipeline",
      visible: "ja",
      label: "Evidence-First",
      meta: "Open Source",
      kicker: "Late · 03 / 03",
      title: "Evidence-First Pipeline",
      tags: [{ text: "Open Source", color: "#8fb0ff" }],
      lead: "Dokumentanalyse mit KI, bei der jede Aussage ihren Beleg mitbringt.",
      media: {
        src: "/work/pipeline-belege.webp",
        width: 1100,
        height: 850,
        alt: "Ergebnisansicht der Evidence-First Pipeline mit einem Beispiel-Mietvertrag: Kennzahlen zur Belegquote, darunter Vertragsparteien, jede mit Seitenzahl und wörtlichem Zitat.",
        caption: "Ergebnis für einen Beispielvertrag: Jede Angabe steht mit Seitenzahl und wörtlichem Zitat da.",
      },
      body: [
        "Das Sprachmodell findet, wo in einem langen Vertrag etwas steht. Jeder extrahierte Wert kommt mit Seitenzahl und wörtlichem Zitat und wird gegen den Quelltext geprüft, bevor er erscheint. Was eine Regel entscheiden kann, entscheidet der Code. Das Ergebnis ist ein Vorschlag zur Prüfung, nie eine Entscheidung.",
      ],
      facts: [
        {
          label: "Für wen",
          value: "Dokumenten-Workflows in Berufen mit Haftung: Kanzleien, Steuerberatung, Hausverwaltung.",
        },
        { label: "Meine Rolle", value: "Konzept und Bau." },
        {
          label: "Belege",
          value: [
            "Zitate werden gegen die zitierte Seite geprüft, die Trefferquote steht sichtbar in der Oberfläche",
            "Beträge, Fristen und Parteien ordnet Python-Code zu, nicht das Modell",
            "Uploads bleiben im Speicher, das Audit-Log speichert Hashes statt Dokumenttext",
          ],
        },
        {
          label: "Stack",
          display: "chips",
          value: ["Python", "Azure OpenAI", "Pydantic", "rapidfuzz", "Streamlit"],
        },
      ],
      links: [
        {
          label: "Code",
          text: "GitHub",
          href: "https://github.com/alperistic/evidence-first-doc-pipeline",
        },
      ],
    },

    late: {
      id: "late",
      visible: "ja",
      label: "Late",
      meta: "Dachmarke",
      kicker: "Kosmisches Netz",
      title: "Late",
      tags: [{ text: "Dachmarke", color: "#a99bff" }],
      lead: "Das Haus, unter dem ich Software baue.",
      body: [
        "Late ist meine Firma: ein kleiner menschlicher Kern, KI-Agenten als operatives Team, organisiert über eine Bibliothek aus Fähigkeiten statt über Rollen. offerre, insertcoin.lol und die Evidence-First Pipeline sind darunter entstanden.",
        "Die Regel dahinter: Das Modell extrahiert, der Code rechnet, der Mensch entscheidet alles, was nach außen geht.",
      ],
      links: [
        {
          label: "Late OS",
          text: "GitHub",
          href: "https://github.com/alperistic/oneos",
        },
      ],
    },

    skills: {
      id: "skills",
      visible: "ja",
      label: "Skills & Stack",
      meta: "Sternhaufen",
      kicker: "Offener Sternhaufen",
      title: "Skills & Stack",
      tags: [],
      lead: "Was ich liefere — und womit.",
      // Je Gruppe ein heller Stern (Fähigkeit), je Eintrag ein kleiner Stern (Beleg/Werkzeug).
      // Titel und Einträge kurz halten: sie schweben als Labels im Himmel.
      skillGroups: [
        {
          title: "Produkte ausliefern",
          skills: [
            "Von der Idee bis zum Betrieb",
            "Produkt-Scoping",
            "Review-Workflow",
            "Automatisierte Tests",
            "Stripe-Billing",
            "Auth",
          ],
        },
        {
          title: "KI im Produkt",
          skills: [
            "LLM-Features in Produktion",
            "Extraktion aus Freitext",
            "Deterministische Logik im Code",
            "Azure OpenAI (EU)",
            "Anthropic Claude",
            "Vercel AI Gateway",
          ],
        },
        {
          title: "Mit Coding-Agents bauen",
          skills: ["Claude Code", "Codex", "Agentische Workflows", "Specs & Verifikation"],
        },
        {
          title: "Web & Frontend",
          skills: ["TypeScript", "React", "Next.js", "Vite", "three.js", "Tailwind CSS"],
        },
        {
          title: "Backend & Daten",
          skills: [
            "Python",
            "FastAPI",
            "SQLAlchemy",
            "PostgreSQL",
            "Supabase",
            "XRechnung & ZUGFeRD",
            "PDF-Verarbeitung",
          ],
        },
        {
          title: "Betrieb & Datenschutz",
          skills: [
            "Hetzner",
            "Docker",
            "Caddy",
            "Vercel",
            "Cloudflare",
            "DSGVO & EU-Datenhaltung",
            "Datenschutzfreundliche Analytics",
          ],
        },
        {
          title: "Sprachen",
          skills: ["Deutsch (Muttersprache)", "Englisch (C1/C2)", "Türkisch"],
        },
      ],
    },

    kontakt: {
      id: "kontakt",
      visible: "ja",
      label: "Kontakt",
      meta: "Pulsar · Signal",
      kicker: "Pulsar",
      title: "Kontakt",
      tags: [],
      lead: "Du baust etwas und brauchst jemanden, der es wirklich ausliefert? Schreib mir.",
      links: [
        { label: "GitHub", text: "github.com/alperistic", href: "https://github.com/alperistic" },
        { label: "X", text: "@alperistic", href: "https://x.com/alperistic" },
        // E-Mail: offen — Alper entscheidet (eigene Domain-Adresse empfohlen).
        { label: "E-Mail", text: "Adresse folgt" },
      ],
    },
  },
};
