"use client";

import { Fragment, useEffect, useState } from "react";
import { COLLAGE_UI, LIFE_SCENES, PERSON, PIECES } from "@/content/collage";
import type { HeroData } from "./data";
import { Arrow } from "./Arrow";
import { Scene, useReducedMotion, useTabHidden } from "./Scene";

/** Letztes Wort groß, der Rest klein: „Founder of“ + „Late“. */
const splitLast = (s: string) => {
  const i = s.lastIndexOf(" ");
  return i < 0 ? ["", s] : [s.slice(0, i), s.slice(i + 1)];
};

/** Wie oft sich am Board etwas tut (ms). Bewusst selten: lebendig, nicht zappelig. */
const PIECE_TICK = 7800;

/**
 * Erster Bildschirm, persönliches Board: Board-Fläche → Fenster mit wechselnden
 * Lebens-Szenen → freigestellte Figur, die oben aus dem Fenster ragt → Stücke rundherum
 * → Schrift-Komposition. Die Arbeit ist hier nur eine kleine Zeile mit Links.
 */
export function CollageHero({ data }: { data: HeroData }) {
  const reduced = useReducedMotion();
  const hidden = useTabHidden();
  const [idx, setIdx] = useState(0);
  // Board „lebt“: je Takt ist reihum ein Stück dran und tauscht sein Bild oder rutscht minimal
  const [turns, setTurns] = useState<{ last: number; count: number[] }>({ last: -1, count: PIECES.map(() => 0) });

  useEffect(() => {
    if (reduced || hidden) return;
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % LIFE_SCENES.length), LIFE_SCENES[idx].hold);
    return () => window.clearTimeout(t);
  }, [idx, reduced, hidden]);

  useEffect(() => {
    if (reduced || hidden) return;
    const t = window.setInterval(
      () =>
        setTurns(({ last, count }) => {
          const next = (last + 1) % PIECES.length;
          return { last: next, count: count.map((c, i) => (i === next ? c + 1 : c)) };
        }),
      PIECE_TICK,
    );
    return () => window.clearInterval(t);
  }, [reduced, hidden]);

  const [first, rest] = [data.name.split(" ")[0], data.name.split(" ").slice(1).join(" ")];
  const [roleSmall, roleBig] = splitLast(data.role);

  return (
    <section className="b-hero" aria-labelledby="c-name">
      <div className="board" aria-hidden="true" />

      <div className="b-pieces" aria-hidden="true">
        {PIECES.map((p, i) => {
          // Stücke mit mehreren Bildern tauschen, die anderen rutschen minimal
          const n = turns.count[i];
          const photo = p.photos[n % p.photos.length];
          const nudge = p.photos.length > 1 ? 0 : n % 3;
          const label = p.label === "place" ? data.place : p.label === "since" ? data.since : "";
          return (
            <figure
              key={p.id}
              className={`b-piece b-piece--${p.id}`}
              data-nudge={nudge}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={photo.src} src={photo.src} alt="" loading="lazy" decoding="async" />
              <span className="tape tape--a" />
              {label && <figcaption className="strip">{label}</figcaption>}
            </figure>
          );
        })}
      </div>

      <div className="b-window" aria-hidden="true">
        <div className="b-scenes">
          {LIFE_SCENES.map((s, i) => (
            <Scene key={s.id} s={s} on={i === idx} first={i === 0} />
          ))}
        </div>
        <span className="tape tape--tl" />
        <span className="tape tape--br" />
      </div>

      <div className="b-person">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PERSON.src}
          alt={PERSON.alt}
          width={PERSON.width}
          height={PERSON.height}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <h1 id="c-name" className="b-name">
        <span className="t-xl">{first}</span> <span className="t-m">{rest}</span>
      </h1>
      <p className="b-role">
        {roleSmall && <span className="t-m">{roleSmall}</span>} <span className="t-xl">{roleBig}</span>
      </p>

      {data.x && (
        <a className="b-follow" href={data.x.href} target="_blank" rel="noopener">
          <span className="b-follow-main">{COLLAGE_UI.followX}</span>
          <span className="b-follow-handle">
            {data.x.text}
            <Arrow />
          </span>
        </a>
      )}

      <p className="b-slip">{data.strength}</p>

      <nav className="b-projects" aria-label="Projects">
        <p className="b-projects-list">
          {data.projects.map((p, i) => (
            <Fragment key={p.href}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              <a href={p.href} target="_blank" rel="noopener">
                {p.title}
              </a>
            </Fragment>
          ))}
        </p>
        <a className="b-towork" href="#work">
          {COLLAGE_UI.toWork}
          <span aria-hidden="true"> ↓</span>
        </a>
      </nav>

      <div className="grain" aria-hidden="true" />
    </section>
  );
}
