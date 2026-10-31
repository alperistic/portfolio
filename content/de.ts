import type { SiteContent } from "./types";

/**
 * Deutsche Inhalte — 1:1 aus docs/content.md (Stand 31.10.2026).
 * Neue Station / neues Projekt = neuer Eintrag hier, kein Code-Umbau.
 * Einträge mit `visible: "nein" | "offen"` bleiben vorbereitet, werden aber
 * serverseitig herausgefiltert und landen nicht im ausgelieferten JavaScript.
 */
export const de: SiteContent = {
  locale: "de",
  meta: {
    title: "Alper Bulat — Gründer von Late",
    description:
      "Alper Bulat, Gründer von Late in Karlsruhe, baut Softwareprodukte mit Coding-Agents: offerre, insertcoin.lol und die Evidence-First Pipeline.",
  },
  brand: {
    name: "Alper Bulat",
    subline: "Gründer von Late · Karlsruhe",
    follow: { label: "Auf X folgen", handle: "@alperistic", href: "https://x.com/alperistic" },
  },
  ui: {
    loading: "Kalibriere Himmel",
    dragHint: "Ziehen zum Umsehen",
    tourStart: "Tour starten",
    back: "← Übersicht",
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
      webgl: "Dieses Gerät kann den 3D-Himmel nicht darstellen. Alles steht hier als Liste.",
      weak: "Der 3D-Himmel würde auf diesem Gerät ruckeln. Alles steht hier als Liste.",
      slow: "Der 3D-Himmel lief auf diesem Gerät nicht flüssig. Alles steht hier als Liste.",
      lost: "Die Grafik ist ausgefallen. Alles steht hier als Liste.",
      load: "Der Himmel konnte nicht geladen werden. Alles steht hier als Liste.",
    },
    tryAnyway: "Himmel trotzdem laden",
    skipIntro: "Intro überspringen",
    sound: "Ton",
    autoPlay: "Tour automatisch abspielen",
    autoPause: "Tour anhalten",
    open: "{name} öffnen",
    enlarge: "Vergrößern",
    shrink: "Schließen",
    play: "Clip abspielen",
    pause: "Clip anhalten",
    commitNote: "Jeder kleine Lichtpunkt am Rand ist ein Commit: innen die ältesten, außen die neuesten.",
    ringNote:
      "Der Ring aus Lichtpunkten um die Sonne ist mein vergangenes Jahr auf GitHub: jeder Punkt ein Tag, je heller, desto mehr Beiträge.",
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
      kicker: "Gründer von Late · Karlsruhe",
      title: "Alper Bulat",
      tags: [],
      lead: "Ich baue und betreibe Softwareprodukte mit Coding-Agents. Architektur, Prüfung und Entscheidungen bleiben bei mir.",
      links: [{ label: "So arbeite ich", text: "Late OS auf GitHub", href: "https://github.com/alperistic/oneos" }],
    },

    werdegang: {
      id: "werdegang",
      visible: "ja",
      label: "Werdegang",
      meta: "Sternbild",
      kicker: "2020 – heute",
      title: "Werdegang",
      tags: [],
      lead: "",
      stations: [
        { year: "2020", period: "2020", title: "Abitur", visible: "ja" },
        {
          year: "10/2020",
          period: "10/2020 – 02/2021",
          title: "Praktikum Software-/Webentwicklung",
          detail:
            "technicsatelier GmbH, Stuttgart — Frontend-Bausteine mit HTML, CSS, JavaScript, TypeScript",
          visible: "ja",
        },
        {
          year: "04/2026",
          period: "seit 04/2026",
          title: "Gründer von Late",
          detail: "offerre, insertcoin.lol",
          highlight: true,
          visible: "ja",
        },
        {
          year: "09/2026",
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
      kicker: "Late",
      title: "offerre",
      tags: [{ text: "Live seit April 2026", color: "#6fe3c1" }],
      lead: "Macht aus Kundenanfragen kalkulierte Angebotsentwürfe, für kleine Betriebe in Deutschland.",
      media: {
        src: "/work/offerre-entwurf.webp",
        width: 505,
        height: 300,
        alt: "Angebotsentwurf in offerre: vier Positionen mit Preisen, jede mit ihrer Quelle in der Preisliste. Bei einer Position fehlt die Menge, sie ist markiert statt geschätzt.",
        caption: "Ein Entwurf aus einer Anfrage, mit Beispieldaten.",
      },
      body: [
        "Aus einer Kundenanfrage in Freitext und der eigenen Preisliste wird automatisch ein kalkulierter Angebotsentwurf. Die KI liest, der Code rechnet, der Betrieb entscheidet und verschickt.",
      ],
      facts: [
        {
          label: "Für wen",
          value:
            "Kleine Dienstleister mit eigener Preisliste, zum Beispiel Reinigung, IT-Wartung oder Handel. Alles vor der Rechnung, neben lexoffice oder sevDesk.",
        },
        {
          label: "Meine Rolle",
          value:
            "Allein gebaut und betrieben — Produkt, Backend, Frontend, Infrastruktur.",
        },
        {
          label: "Belege",
          value: [
            "Live unter offerre.de seit April 2026",
            "Jede Position nennt ihre Quelle in der Preisliste; fehlt eine Angabe, wird sie markiert statt geraten",
            "KI-Verarbeitung in der EU (Azure OpenAI), Abrechnung über Stripe, Betrieb auf Hetzner",
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
      kicker: "Late",
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
        "Founder treten mit ihren Produkten 1:1 in KI-bewerteten Matches an; jeder Sieg baut einen öffentlichen Win/Loss-Rekord auf. Die Wertung läuft deterministisch im Code.",
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
      kicker: "Late",
      title: "Evidence-First Pipeline",
      tags: [{ text: "Open Source", color: "#8fb0ff" }],
      lead: "Dokumentanalyse mit KI, bei der jede Aussage ihren Beleg mitbringt.",
      media: {
        src: "/work/pipeline-belege-detail.webp",
        full: "/work/pipeline-belege.webp",
        width: 736,
        height: 464,
        alt: "Ausschnitt der Ergebnisansicht der Evidence-First Pipeline mit einem Beispiel-Mietvertrag: Dokumenttyp und Vertragsparteien, unter jeder Partei Seitenzahl und wörtliches Zitat aus dem Vertrag.",
        caption: "Ergebnis für einen Beispiel-Mietvertrag.",
      },
      body: [
        "Das Modell findet die Stelle im Vertrag, der Code prüft das Zitat gegen die Seite und ordnet Beträge, Fristen und Parteien zu. Heraus kommt ein Vorschlag zur Prüfung, keine Entscheidung.",
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
            "MIT-Lizenz, läuft lokal im Demo-Modus ohne Zugangsdaten",
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
      meta: "Firma",
      kicker: "Kosmisches Netz",
      title: "Late",
      tags: [],
      lead: "Meine Firma. Darunter entstehen offerre, insertcoin.lol und die Evidence-First Pipeline.",
      body: [
        "Ein kleiner menschlicher Kern, KI-Agenten als operatives Team, organisiert über Skills statt Rollen. Wie das aufgebaut ist, liegt offen in Late OS.",
      ],
      links: [
        { label: "Website", text: "late-systems.vercel.app", href: "https://late-systems.vercel.app" },
        {
          label: "Late OS",
          text: "Late OS auf GitHub",
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
      lead: "",
      // Je Gruppe ein heller Stern (Fähigkeit), je Eintrag ein kleiner Stern (Beleg/Werkzeug).
      // Titel und Einträge kurz halten: sie schweben als Labels im Himmel.
      skillGroups: [
        {
          title: "Mit Coding-Agents bauen",
          skills: ["Claude Code", "Codex", "Specs & Verifikation"],
        },
        {
          title: "Produkte ausliefern",
          skills: [
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
      lead: "Was ich baue und wie, schreibe ich auf X. Für alles andere: E-Mail.",
      links: [
        { label: "X", text: "@alperistic", href: "https://x.com/alperistic" },
        { label: "GitHub", text: "github.com/alperistic", href: "https://github.com/alperistic" },
        { label: "E-Mail", text: "alper@offerre.de", href: "mailto:alper@offerre.de" },
      ],
    },
  },
};
