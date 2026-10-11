import type { SiteContent } from "./types";

/**
 * English content — translated from docs/content.md (as of 24.09.2026).
 * Same structure and the same `visible` flags as de.ts. Same tone: direct,
 * calm, no superlatives, nothing added.
 * Status: translation still to be approved by Alper.
 */
export const en: SiteContent = {
  locale: "en",
  meta: {
    title: "Alper Bulat — Founder of Late",
    description:
      "Alper Bulat, founder of Late, based in Karlsruhe. I build working software — from the idea to running it in production.",
  },
  brand: {
    name: "Alper Bulat",
    subline: "Founder of Late · Karlsruhe",
  },
  ui: {
    loading: "Calibrating sky",
    dragHint: "Drag to look around",
    tourStart: "Start tour",
    back: "← Back to Alper",
    backFromCenter: "← Overview",
    next: "Next star",
    restart: "Start over",
    close: "Close",
    center: "Center",
    lookAt: "View {name}",
    legend: "Legend",
    tourStep: "Stop",
    canvasLabel: "Sky, drag to look around",
    langGroup: "Language",
    langName: "English",
    listView: "List view",
    skyView: "Back to the sky",
    keysHint: "Tab selects an object, Enter flies there, left/right arrow follows the tour, Esc takes you back.",
    contents: "Contents",
    fallback: {
      webgl: "This device can't display the 3D sky. Here is all the content as a list.",
      weak: "The 3D sky would stutter on this device. Here is all the content as a list.",
      slow: "The 3D sky didn't run smoothly on this device. Here is all the content as a list.",
      lost: "The graphics stopped working. Here is all the content as a list.",
      load: "The sky couldn't be loaded. Here is all the content as a list.",
    },
    tryAnyway: "Load the sky anyway",
    skipIntro: "Skip intro",
    sound: "Sound",
    autoPlay: "Play tour automatically",
    autoPause: "Pause tour",
    enlarge: "Enlarge preview",
    shrink: "Close preview",
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
      kicker: "The central star",
      title: "Alper Bulat",
      tags: [
        { text: "Founder of Late", color: "#f1c98e" },
        { text: "Karlsruhe" },
      ],
      lead: "I build working software — from the idea to running it in production. With AI-assisted development workflows, but with clear accountability: architecture, verification and decisions stay with me.",
      body: [
        "Turning vague product ideas into shipped software — iterating fast with coding agents without giving up control.",
      ],
    },

    werdegang: {
      id: "werdegang",
      visible: "ja",
      label: "Timeline",
      meta: "Constellation",
      kicker: "Constellation",
      title: "Timeline",
      tags: [],
      lead: "Each stop a star.",
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
          title: "Founder of Late (self-employed)",
          detail: "offerre live",
          visible: "ja",
        },
        {
          year: "2026",
          period: "since 09/2026",
          title: "Working student – e-commerce specialist",
          visible: "ja",
        },
      ],
    },

    offerre: {
      id: "offerre",
      visible: "ja",
      label: "offerre",
      meta: "Project · Live",
      kicker: "Late · 01 / 03",
      title: "offerre",
      tags: [{ text: "Live since April 2026", color: "#6fe3c1" }],
      lead: "AI-assisted quote creation for German SMEs.",
      media: {
        src: "/work/offerre-entwurf.webp",
        width: 505,
        height: 300,
        alt: "Quote draft in offerre: four line items with prices, each citing its source in the price list. One item is missing a quantity and is flagged instead of estimated.",
        caption: "A draft from an inquiry. Every line item names its source in the price list; anything missing is flagged, not guessed. Sample data.",
      },
      body: [
        "A customer request in free text plus the company's own price list automatically becomes a calculated draft quote. The AI reads, the code calculates, the business decides and sends.",
      ],
      facts: [
        {
          label: "Who it's for",
          value:
            "Small and medium-sized businesses, especially trades — everything before the invoice, as a complement to lexoffice/sevDesk.",
        },
        {
          label: "My role",
          value: "Built and run alone — product, backend, frontend, infrastructure.",
        },
        {
          label: "Evidence",
          value: [
            "~680 commits since launch",
            "more than 150 pull requests with a review workflow",
            "130+ automated tests",
            "own infrastructure on Hetzner (Docker, Caddy)",
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
      kicker: "Late · 02 / 03",
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
        "Founders put their products up against each other in 1:1 AI-judged matches; every win builds a public win/loss record. The scoring is deterministic, in code — not based on gut feeling.",
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
      kicker: "Late · 03 / 03",
      title: "Evidence-First Pipeline",
      tags: [{ text: "Open source", color: "#8fb0ff" }],
      lead: "AI document analysis where every claim brings its evidence.",
      media: {
        src: "/work/pipeline-belege.webp",
        width: 1100,
        height: 850,
        alt: "Result view of the Evidence-First Pipeline for a sample lease: citation metrics, then the contract parties, each with page number and verbatim quote.",
        caption: "Result for a sample contract: every value comes with page number and verbatim quote.",
      },
      body: [
        "The language model finds where something is written in a long contract. Every extracted value comes with a page number and a verbatim quote and is checked against the source text before it is shown. Whatever a rule can decide is decided in code. The result is a proposal for review, never a decision.",
      ],
      facts: [
        {
          label: "Who it's for",
          value: "Document workflows in liable professions: law firms, tax advisors, property management.",
        },
        { label: "My role", value: "Concept and build." },
        {
          label: "Evidence",
          value: [
            "Quotes are verified against the cited page, and the match rate is shown in the interface",
            "Amounts, deadlines and parties are assigned by Python code, not by the model",
            "Uploads stay in memory; the audit log stores hashes, not document text",
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
      meta: "Umbrella brand",
      kicker: "Cosmic web",
      title: "Late",
      tags: [{ text: "Umbrella brand", color: "#a99bff" }],
      lead: "The house I build software under.",
      body: [
        "Late is my company: a small human core with AI agents as the operating team, organized around a library of capabilities rather than roles. offerre, insertcoin.lol and the Evidence-First Pipeline were built under it.",
        "The rule behind it: the model extracts, code computes, and a human decides everything that leaves the building.",
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
      meta: "Star cluster",
      kicker: "Open star cluster",
      title: "Skills & Stack",
      tags: [],
      lead: "What I deliver — and what with.",
      skillGroups: [
        {
          title: "Shipping products",
          skills: [
            "From idea to production",
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
          title: "Building with coding agents",
          skills: ["Claude Code", "Codex", "Agentic workflows", "Specs & verification"],
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
      lead: "Building something and need someone who actually ships it? Write to me.",
      links: [
        { label: "GitHub", text: "github.com/alperistic", href: "https://github.com/alperistic" },
        // Email: open — Alper decides (own domain address recommended).
        { label: "Email", text: "Address to follow" },
      ],
    },
  },
};
