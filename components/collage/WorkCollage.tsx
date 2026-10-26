"use client";

import { useEffect, useState } from "react";
import { COLLAGE_UI, PROJECT_MOOD, type CollageProject } from "@/content/collage";
import { Arrow } from "./Arrow";
import type { WorkData, WorkPiece } from "./data";
import { useInView, usePlayback, useReducedMotion, useTabHidden } from "./Scene";

/**
 * Zweites Kapitel, Arbeits-Board: dasselbe Material wie oben, eigene Komposition.
 * Je Projekt ein Stück aus drei Lagen — Stimmungsfoto, darauf der echte Einblick aus
 * public/work/ (ausgeschnitten, mit Tape), dazu ein Etikett mit Name, Einzeiler,
 * Status und Link. Hover, Fokus oder Tippen hebt ein Stück an; die anderen bleiben ruhig.
 */
export function WorkCollage({ data }: { data: WorkData }) {
  const reduced = useReducedMotion();
  const hidden = useTabHidden();
  const [ref, inView] = useInView<HTMLElement>(0.15);
  // Angetipptes Stück (Touch): bleibt angehoben, bis ein anderes dran ist oder Esc
  const [pinned, setPinned] = useState<CollageProject | null>(null);

  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned]);

  return (
    <section ref={ref} id="work" className="w-board" aria-labelledby="c-work-h">
      <div className="board board--work" aria-hidden="true" />

      <header className="w-head">
        <h2 id="c-work-h" className="w-title">
          {COLLAGE_UI.sections.work}
        </h2>
        <div className="w-roof">
          <p>
            {COLLAGE_UI.builtUnder} <strong>{data.late.title}</strong>
            <span className="w-roof-lead"> — {data.late.lead}</span>
          </p>
          {data.late.link && (
            <a href={data.late.link.href} target="_blank" rel="noopener">
              {data.late.link.label}
              <Arrow />
            </a>
          )}
          <span className="tape tape--roof" aria-hidden="true" />
        </div>
      </header>

      <ul className="w-pieces">
        {data.pieces.map((p) => (
          <Piece
            key={p.id}
            p={p}
            up={pinned === p.id}
            play={inView && !reduced && !hidden}
            still={reduced}
            onTap={() => setPinned((cur) => (cur === p.id ? null : p.id))}
          />
        ))}
      </ul>

      <div className="grain" aria-hidden="true" />
    </section>
  );
}

type PieceProps = { p: WorkPiece; up: boolean; play: boolean; still: boolean; onTap: () => void };

/** Ein Projekt-Stück: Stimmungsfoto, echter Einblick, Etikett. */
function Piece({ p, up, play, still, onTap }: PieceProps) {
  const m = p.media;
  const mood = PROJECT_MOOD[p.id];
  const clip = !!m?.video && !still;
  const video = usePlayback(clip && play);

  return (
    <li
      className={`w-piece w-piece--${p.id}${up ? " is-up" : ""}`}
      onClick={(e) => {
        // Ein Link öffnet sein Ziel; alles andere am Stück hebt es an
        if (!(e.target instanceof Element && e.target.closest("a"))) onTap();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="w-mood" src={mood.src} alt={mood.alt} loading="lazy" decoding="async" />

      {m && (
        <figure className={`w-shot${m.pixelated ? " px" : ""}`}>
          {clip ? (
            <video
              ref={video}
              poster={m.src}
              width={m.width}
              height={m.height}
              muted
              loop
              playsInline
              preload="none"
              aria-label={m.alt}
            >
              {m.video!.map((s) => (
                <source key={s} src={s} type={s.endsWith(".webm") ? "video/webm" : "video/mp4"} />
              ))}
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.src} width={m.width} height={m.height} alt={m.alt} loading="lazy" decoding="async" />
          )}
          <span className="tape tape--a" aria-hidden="true" />
          <span className="tape tape--b" aria-hidden="true" />
        </figure>
      )}

      <div className="w-label">
        <h3>{p.title}</h3>
        <p className="w-lead">{p.lead}</p>
        <p className="w-meta">
          <span className="w-status">
            <i style={{ background: p.statusColor }} aria-hidden="true" />
            {p.status}
          </span>
          {p.link && (
            <a href={p.link.href} target="_blank" rel="noopener">
              {p.link.text}
              <Arrow />
            </a>
          )}
        </p>
      </div>
    </li>
  );
}
