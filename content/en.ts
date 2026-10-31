import type { SiteContent } from "./types";

/**
 * English content — translated from docs/content.md (as of 31.10.2026).
 * Same structure and the same `visible` flags as de.ts. Same tone: direct,
 * calm, no superlatives, nothing added.
 * Status: translation still to be approved by Alper.
 */
export const en: SiteContent = {
  locale: "en",
  meta: {
    title: "Alper Bulat — Founder of Late",
    description:
      "Alper Bulat, founder of Late in Karlsruhe, builds software products with coding agents: offerre, insertcoin.lol and the open-source Evidence-First Pipeline.",
  },
  brand: {
    name: "Alper Bulat",
    subline: "Founder of Late · Karlsruhe",
    follow: { label: "Follow on X", handle: "@alperistic", href: "https://x.com/alperistic" },
  },
  ui: {
    loading: "Calibrating sky",
    dragHint: "Drag to look around",
    tourStart: "Start tour",
    back: "← Overview",
    backFromCenter: "← Overview",
    next: "Next star",
    restart: "Start over",
    close: "Close",
    center: "Center",
    lookAt: "View {name}",
    legend: "Legend",
    tourStep: "Step",
    canvasLabel: "Sky, drag to look around",
    langGroup: "Language",
    langName: "English",
    listView: "List view",
    skyView: "Back to the sky",
    keysHint: "Tab selects an object, Enter flies there, ←/→ move through the tour, Esc takes you back.",
    contents: "Contents",
    fallback: {
      webgl: "This device can't display the 3D sky. Everything is here as a list.",
      weak: "The 3D sky would stutter on this device. Everything is here as a list.",
      slow: "The 3D sky didn't run smoothly on this device. Everything is here as a list.",
      lost: "The graphics stopped working. Everything is here as a list.",
      load: "The sky couldn't be loaded. Everything is here as a list.",
    },
    tryAnyway: "Load the sky anyway",
    skipIntro: "Skip intro",
    sound: "Sound",
    autoPlay: "Play tour automatically",
    autoPause: "Pause tour",
    open: "Open {name}",
    enlarge: "Enlarge",
    shrink: "Close",
    commitNote: "Every small point of light around it is a commit: oldest inside, newest outside.",
    ringNote:
      "The ring of points around the sun is my past year on GitHub: one point per day, brighter means more contributions.",
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
      meta: "Center",
      kicker: "Founder of Late · Karlsruhe",
      title: "Alper Bulat",
      tags: [],
      lead: "I build and run software products with coding agents. Architecture, review and decisions stay with me.",
      links: [{ label: "How I work", text: "Late OS on GitHub", href: "https://github.com/alperistic/oneos" }],
    },

    werdegang: {
      id: "werdegang",
      visible: "ja",
      label: "Timeline",
      meta: "Constellation",
      kicker: "2020 – today",
      title: "Timeline",
      tags: [],
      lead: "",
      stations: [
        {
          year: "2020",
          period: "2020",
          title: "Abitur (university entrance qualification)",
          visible: "ja",
        },
        {
          year: "2020",
          period: "10/2020 – 02/2021",
          title: "Internship, software/web development",
          detail:
            "technicsatelier GmbH, Stuttgart — frontend components with HTML, CSS, JavaScript, TypeScript",
          visible: "ja",
        },
        {
          year: "2026",
          period: "since 04/2026",
          title: "Founder of Late",
          detail: "offerre, insertcoin.lol",
          visible: "ja",
        },
        {
          year: "2026",
          period: "since 09/2026",
          title: "E-commerce specialist, part-time (working student)",
          visible: "ja",
        },
      ],
    },

    offerre: {
      id: "offerre",
      visible: "ja",
      label: "offerre",
      meta: "Project · Live",
      kicker: "Late",
      title: "offerre",
      tags: [{ text: "Live since April 2026", color: "#6fe3c1" }],
      lead: "Turns customer inquiries into priced draft quotes, for small businesses in Germany.",
      media: {
        src: "/work/offerre-entwurf.webp",
        width: 505,
        height: 300,
        alt: "Quote draft in offerre: four line items with prices, each citing its source in the price list. One item is missing a quantity and is flagged instead of estimated.",
        caption: "A draft from an inquiry, with sample data.",
      },
      body: [
        "A customer request in free text plus the company's own price list automatically becomes a calculated draft quote. The AI reads, the code calculates, the business decides and sends.",
      ],
      facts: [
        {
          label: "Who it's for",
          value:
            "Small service businesses with their own price list, such as cleaning, IT maintenance or retail. Everything before the invoice, alongside invoicing tools like lexoffice or sevDesk.",
        },
        {
          label: "My role",
          value: "Built and run solo — product, backend, frontend, infrastructure.",
        },
        {
          label: "Evidence",
          value: [
            "Live at offerre.de since April 2026",
            "Every line item names its source in the price list; anything missing is flagged, not guessed",
            "AI processing in the EU (Azure OpenAI), billing via Stripe, hosted on Hetzner",
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
            "Docker/Caddy on Hetzner",
          ],
        },
      ],
      links: [{ label: "Website", text: "offerre.de", href: "https://offerre.de" }],
    },

    insertcoin: {
      id: "insertcoin",
      visible: "ja",
      label: "insertcoin.lol",
      meta: "Project · Live",
      kicker: "Late",
      title: "insertcoin.lol",
      tags: [{ text: "Live", color: "#ff7ad9" }],
      lead: "An arcade where startups compete against each other.",
      media: {
        src: "/work/insertcoin-kampf.webp",
        video: ["/work/insertcoin-kampf.webm", "/work/insertcoin-kampf.mp4"],
        width: 720,
        height: 536,
        alt: "Excerpt from the insertcoin.lol trailer: pixel-art fighters face off in the arena, offerre among them.",
        caption: "Trailer excerpt: products enter the arena as fighters.",
        pixelated: true,
      },
      body: [
        "Founders enter their products in 1:1 AI-judged matches; every win builds a public win/loss record. Scoring runs deterministically in code.",
      ],
      facts: [
        {
          label: "Who it's for",
          value: "Indie founders who want visibility instead of yet another directory listing.",
        },
        { label: "My role", value: "Concept, build, operations." },
        {
          label: "Stack",
          display: "chips",
          value: ["Next.js", "Supabase (Postgres)", "Vercel", "Stripe", "LLM via Vercel AI Gateway"],
        },
      ],
      links: [{ label: "Website", text: "insertcoin.lol", href: "https://insertcoin.lol" }],
    },

    pipeline: {
      id: "pipeline",
      visible: "ja",
      label: "Evidence-First",
      meta: "Open source",
      kicker: "Late",
      title: "Evidence-First Pipeline",
      tags: [{ text: "Open source", color: "#8fb0ff" }],
      lead: "AI document analysis where every claim comes with its source.",
      media: {
        src: "/work/pipeline-belege.webp",
        width: 1100,
        height: 850,
        alt: "Result view of the Evidence-First Pipeline for a sample lease: citation metrics, then the contract parties, each with page number and verbatim quote.",
        caption: "Result for a sample rental contract.",
      },
      body: [
        "The model finds the passage in the contract, the code checks the quote against the page and assigns amounts, deadlines and parties. The result is a proposal for review, not a decision.",
      ],
      facts: [
        {
          label: "Who it's for",
          value: "Document workflows in professions where errors carry liability: law firms, tax advisors, property management.",
        },
        { label: "My role", value: "Concept and build." },
        {
          label: "Evidence",
          value: [
            "Quotes are checked against the cited page; the match rate is visible in the UI",
            "Amounts, deadlines and parties are assigned by Python code, not the model",
            "Uploads stay in memory; the audit log stores hashes instead of document text",
            "MIT license, runs locally in demo mode without credentials",
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
      meta: "Company",
      kicker: "Cosmic web",
      title: "Late",
      tags: [],
      lead: "My company. offerre, insertcoin.lol and the Evidence-First Pipeline are built under it.",
      body: [
        "A small human core with AI agents as the operating team, organized by skills rather than roles. How it is set up is public in Late OS.",
      ],
      links: [
        { label: "Website", text: "late-systems.vercel.app", href: "https://late-systems.vercel.app" },
        {
          label: "Late OS",
          text: "Late OS on GitHub",
          href: "https://github.com/alperistic/oneos",
        },
      ],
    },

    skills: {
      id: "skills",
      visible: "ja",
      label: "Skills & Stack",
      meta: "Star cluster",
      kicker: "Open star cluster",
      title: "Skills & Stack",
      tags: [],
      lead: "",
      skillGroups: [
        {
          title: "Building with coding agents",
          skills: ["Claude Code", "Codex", "Specs & verification"],
        },
        {
          title: "Shipping products",
          skills: [
            "Product scoping",
            "Review workflow",
            "Automated tests",
            "Stripe billing",
            "Auth",
          ],
        },
        {
          title: "AI in the product",
          skills: [
            "LLM features in production",
            "Extraction from free text",
            "Deterministic logic in code",
            "Azure OpenAI (EU)",
            "Anthropic Claude",
            "Vercel AI Gateway",
          ],
        },
        {
          title: "Web & frontend",
          skills: ["TypeScript", "React", "Next.js", "Vite", "three.js", "Tailwind CSS"],
        },
        {
          title: "Backend & data",
          skills: [
            "Python",
            "FastAPI",
            "SQLAlchemy",
            "PostgreSQL",
            "Supabase",
            "XRechnung & ZUGFeRD",
            "PDF processing",
          ],
        },
        {
          title: "Operations & privacy",
          skills: [
            "Hetzner",
            "Docker",
            "Caddy",
            "Vercel",
            "Cloudflare",
            "GDPR & EU data residency",
            "Privacy-friendly analytics",
          ],
        },
        {
          title: "Languages",
          skills: ["German (native)", "English (C1/C2)", "Turkish"],
        },
      ],
    },

    kontakt: {
      id: "kontakt",
      visible: "ja",
      label: "Contact",
      meta: "Pulsar · Signal",
      kicker: "Pulsar",
      title: "Contact",
      tags: [],
      lead: "I post what I build and how on X. For everything else: email.",
      links: [
        { label: "X", text: "@alperistic", href: "https://x.com/alperistic" },
        { label: "GitHub", text: "github.com/alperistic", href: "https://github.com/alperistic" },
        { label: "Email", text: "alper@offerre.de", href: "mailto:alper@offerre.de" },
      ],
    },
  },
};
