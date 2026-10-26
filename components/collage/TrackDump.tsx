"use client";

import { useEffect, useState } from "react";
import { COLLAGE_UI, DUMP } from "@/content/collage";
import { Arrow } from "./Arrow";
import { trackAnchor, type Track } from "./data";
import { useCamcorderClock, useInView, usePlayback, useReducedMotion, useTabHidden } from "./hooks";

/** Wie oft sich im Dump etwas tut (ms): ab und zu, keine Daueranimation. */
const TICK = 3400;
/** Dauer des Blitzlicht-Flashs (ms), passt zur CSS-Animation `.is-flash`. */
const FLASH_MS = 420;

/**
 * Ein Projekt als Track: Photo-Dump wie das „Augenblick“-Cover — der echte Einblick aus
 * public/work/ zwischen Stimmungsbildern, dicht, geschichtet, angeschnitten, mit Blitz-Look
 * und eigener Farbwelt je Projekt. „Lebend“: Solange der Track sichtbar ist, tauschen
 * ab und zu zwei Bilder den Platz oder eines blitzt kurz auf. Darunter lesbar: Stempel,
 * Einzeiler, Status, Rolle, Link.
 */
export function TrackDump({ t }: { t: Track }) {
  const reduced = useReducedMotion();
  const hidden = useTabHidden();
  const [ref, inView] = useInView<HTMLElement>(0.25);
  const live = inView && !reduced && !hidden;
  const moods = DUMP[t.id];
  const clock = useCamcorderClock();
  // Reihenfolge der Stimmungsbilder auf ihren Plätzen; Platz -1 ist der echte Einblick
  const [order, setOrder] = useState(() => moods.map((_, i) => i));
  const [flash, setFlash] = useState<number | null>(null);

  useEffect(() => {
    if (!live) return;
    let step = 0;
    const t = window.setInterval(() => {
      step++;
      // Abwechselnd: Blitz auf einem Platz (auch dem Einblick), dann ein Platztausch
      if (step % 2) {
        setFlash(Math.floor(Math.random() * (moods.length + 1)) - 1);
      } else {
        setOrder((o) => {
          const a = Math.floor(Math.random() * o.length);
          const b = (a + 1 + Math.floor(Math.random() * (o.length - 1))) % o.length;
          const n = [...o];
          [n[a], n[b]] = [n[b], n[a]];
          return n;
        });
      }
    }, TICK);
    return () => window.clearInterval(t);
  }, [live, moods.length]);

  useEffect(() => {
    if (flash === null) return;
    const t = window.setTimeout(() => setFlash(null), FLASH_MS);
    return () => window.clearTimeout(t);
  }, [flash]);

  const m = t.media;
  const clip = !!m?.video && !reduced;
  const video = usePlayback(clip && live);

  return (
    <section ref={ref} id={trackAnchor(t.id)} className={`track track--${t.id}`} aria-labelledby={`${t.id}-h`}>
      {/* Hintergrund: ein Bild aus dem Dump, unscharf und dunkel — keine leere Webseiten-Fläche */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="track-back" src={moods[0].src} alt="" loading="lazy" decoding="async" />
      <div className="dump">
        {order.map((mi, slot) => {
          const p = moods[mi];
          return (
            <figure key={slot} className={`dump-tile dump-tile--${slot + 1}${flash === slot ? " is-flash" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
              {/* Datumsaufdruck wie bei der Einwegkamera, nur auf einem Platz */}
              {slot === 3 && clock && (
                <span className="dump-date" aria-hidden="true">
                  {clock[0]}
                </span>
              )}
            </figure>
          );
        })}

        {m && (
          <figure
            className={`dump-tile dump-shot${m.pixelated ? " px" : ""}${flash === -1 ? " is-flash" : ""}`}
            style={{ aspectRatio: `${m.width} / ${m.height}` }}
          >
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
            <figcaption className="dump-cap">{COLLAGE_UI.realWork}</figcaption>
          </figure>
        )}

        {/* Release-Stempel wie der Titel auf einem Cover: klein, eigene Schrift je Werk */}
        <h2 id={`${t.id}-h`} className={`stamp stamp--${t.id}`}>
          {t.title}
        </h2>
      </div>

      <div className="track-info">
        <p className="track-no">
          {COLLAGE_UI.track} {t.no}
        </p>
        <div className="track-text">
          <p className="track-lead">{t.lead}</p>
          <dl className="track-meta">
            <div>
              <dt>Status</dt>
              <dd>
                <i style={{ background: t.statusColor }} aria-hidden="true" />
                {t.status}
              </dd>
            </div>
            {t.role && (
              <div>
                <dt>{COLLAGE_UI.role}</dt>
                <dd>{t.role}</dd>
              </div>
            )}
          </dl>
          {t.link && (
            <a className="track-link" href={t.link.href} target="_blank" rel="noopener">
              {t.link.text}
              <Arrow />
            </a>
          )}
          {m?.caption && <p className="track-cap">{m.caption}</p>}
        </div>
      </div>
    </section>
  );
}
