"use client";

import { Fragment, useEffect, useState } from "react";
import { COLLAGE_UI, LIFE_SCENES, PERSON } from "@/content/collage";
import type { HeroData } from "./data";
import { Arrow } from "./Arrow";
import { pad, Scene, useReducedMotion, useTabHidden } from "./Scene";
import { Silhouette } from "./Silhouette";

/**
 * Erster Bildschirm, persönliche Collage: nur Lebens-Szenen im Wechsel, davor die
 * Figur, darüber die Schrift. Die Arbeit ist hier nur eine kleine Zeile mit Links;
 * die eigentliche Arbeits-Collage folgt als zweites Kapitel.
 */
export function CollageHero({ data }: { data: HeroData }) {
  const reduced = useReducedMotion();
  const hidden = useTabHidden();
  const [idx, setIdx] = useState(0);

  // Szenen-Zyklus: jede Szene steht ihre eigene Zeit, dann der nächste Schnitt
  useEffect(() => {
    if (reduced || hidden) return;
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % LIFE_SCENES.length), LIFE_SCENES[idx].hold);
    return () => window.clearTimeout(t);
  }, [idx, reduced, hidden]);

  const scene = LIFE_SCENES[idx];
  const person = PERSON[0];

  return (
    <section className="c-hero" aria-labelledby="c-name">
      <div className="c-scenes" aria-hidden="true">
        {LIFE_SCENES.map((s, i) => (
          <Scene key={s.id} s={s} on={i === idx} play={!reduced && !hidden} />
        ))}
      </div>
      <div className="c-grade" aria-hidden="true" />

      <div className="c-person">
        {person.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.src} alt={person.alt} />
        ) : (
          <>
            <Silhouette />
            <span className="c-person-label" aria-hidden="true">
              {person.placeholder.label} · {COLLAGE_UI.placeholder}
            </span>
          </>
        )}
      </div>

      <div className="c-grain" aria-hidden="true" />

      <div className="c-top">
        <p className="c-sub">{data.subline}</p>
        {data.x && (
          <a className="c-follow" href={data.x.href} target="_blank" rel="noopener">
            {COLLAGE_UI.followX}
            <span className="c-follow-handle">{data.x.text}</span>
          </a>
        )}
      </div>

      <div className="c-title">
        <h1 id="c-name" className="c-name">
          {data.name.split(" ").map((w) => (
            <span key={w}>{w} </span>
          ))}
        </h1>
        <p className="c-role">{data.role}</p>
        <p className="c-worksline">
          {data.projects.map((p, i) => (
            <Fragment key={p.href}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              <a href={p.href} target="_blank" rel="noopener">
                {p.title}
              </a>
            </Fragment>
          ))}
        </p>
        <p className="c-strength">{data.strength}</p>
        <div className="c-actions">
          {data.x && (
            <a className="c-follow c-follow--solid" href={data.x.href} target="_blank" rel="noopener">
              {COLLAGE_UI.followX}
              <Arrow />
            </a>
          )}
          <a className="c-towork" href="#work">
            {COLLAGE_UI.toWork}
            <span aria-hidden="true"> ↓</span>
          </a>
        </div>
      </div>

      {!scene.src && (
        <p className="c-slot" aria-hidden="true">
          {COLLAGE_UI.scene} {pad(idx + 1)} · {scene.placeholder.label} · {COLLAGE_UI.placeholder}
        </p>
      )}
    </section>
  );
}
