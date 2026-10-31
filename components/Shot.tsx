"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Media } from "@/content";

type Props = {
  m: Media;
  labels: { enlarge: string; shrink: string; play: string; pause: string };
  /**
   * Panel: ob es gerade offen ist (Clip läuft nur dann). Listenansicht: nicht
   * gesetzt — dort steht der Clip mit Standbild und normalen Bedienelementen.
   */
  active?: boolean;
};

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedMotion = () => matchMedia(RM).matches;
const DESKTOP = "(min-width: 768px)";

const sources = (list: string[]) =>
  list.map((s) => <source key={s} src={s} type={s.endsWith(".webm") ? "video/webm" : "video/mp4"} />);

/**
 * Einblick in die Arbeit: Screenshot oder stummer Clip in Schleife, darunter
 * die Bildunterschrift mit „Vergrößern“ (natives <dialog>, Esc schließt). Auf
 * dem Desktop vergrößert auch ein Klick aufs Bild; mobil nicht, damit beim
 * Scrollen im Sheet nichts aus Versehen aufgeht. Ist `src` nur ein Ausschnitt,
 * zeigt die Vergrößerung das ganze Bild (`full`).
 *
 * Clip im Panel: eigene, schlichte Bedienung (runder Knopf + Fortschrittslinie)
 * statt der Browser-Leiste. Die Videodatei wird erst angehängt, wenn das Panel
 * zum ersten Mal offen ist — die Startseite lädt keinen Clip. Er läuft nur,
 * solange man ihn sieht, und bei reduzierter Bewegung nicht von selbst (Start
 * per Knopf). In der Listenansicht (ohne Panel) bleibt die Browser-Bedienung.
 */
export function Shot({ m, labels, active }: Props) {
  const panel = active !== undefined;
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [big, setBig] = useState(false);
  const still = useSyncExternalStore(subscribeRM, reducedMotion, () => false);
  // Quellen erst beim ersten Öffnen des Panels anhängen (bis dahin nur das Standbild)
  const [armed, setArmed] = useState(false);
  if (panel && active && m.video && !armed) setArmed(true);
  /** Wunsch per Knopf: abspielen bzw. anhalten; `null` = automatisch (sichtbar → läuft). */
  const [manual, setManual] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);

  // Clip abspielen, solange sichtbar, Panel offen und gewünscht
  useEffect(() => {
    const v = video.current;
    if (!v || !panel) return;
    if (!active || big || !armed || !(manual ?? !still)) {
      v.pause();
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => undefined);
      else v.pause();
    });
    io.observe(v);
    return () => {
      io.disconnect();
      v.pause();
    };
  }, [panel, active, still, big, armed, manual]);

  // Fortschritt als feine Linie: ohne Übergang zurück an den Anfang springen (Schleife)
  const last = useRef(0);
  const onTime = () => {
    const v = video.current;
    const b = bar.current;
    if (!v || !b || !v.duration) return;
    const p = v.currentTime / v.duration;
    b.style.transition = p < last.current ? "none" : "";
    b.style.transform = `scaleX(${p.toFixed(4)})`;
    last.current = p;
  };

  const open = () => {
    dialog.current?.showModal();
    setBig(true);
  };
  const close = () => dialog.current?.close();

  const inline = () => {
    if (!m.video) {
      // Statischer Export ohne Bild-Optimierung: die Dateien sind schon passend verkleinert
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={m.src} width={m.width} height={m.height} alt={m.alt} loading="lazy" decoding="async" />;
    }
    if (!panel) {
      // Listenansicht: Standbild mit Browser-Bedienung, geladen wird erst beim Abspielen
      return (
        <video poster={m.src} width={m.width} height={m.height} muted loop playsInline controls preload="none" aria-label={m.alt}>
          {sources(m.video)}
        </video>
      );
    }
    return (
      <>
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
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={onTime}
        >
          {armed && sources(m.video)}
        </video>
        <button
          type="button"
          className="p-shot-play"
          aria-label={playing ? labels.pause : labels.play}
          aria-pressed={playing}
          onClick={(e) => {
            e.stopPropagation();
            setManual(!playing);
          }}
        >
          <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M3.2 2.2h2v7.6h-2zM6.8 2.2h2v7.6h-2z" /> : <path d="M3.8 2.1l6 3.9-6 3.9z" />}
          </svg>
        </button>
        <span className="p-shot-prog" aria-hidden="true">
          <i ref={bar} />
        </span>
      </>
    );
  };

  const large = () =>
    m.video ? (
      <video poster={m.src} width={m.width} height={m.height} muted loop playsInline autoPlay={!still} controls preload="auto" aria-label={m.alt}>
        {sources(m.video)}
      </video>
    ) : m.full ? (
      // Ganzes Bild: Maße unbekannt, die Höhe ergibt sich aus der Breite
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.full} alt={m.alt} decoding="async" />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.src} width={m.width} height={m.height} alt={m.alt} decoding="async" />
    );

  // Kleine Screenshots nicht über ihre Auflösung hinaus aufblasen (Pixel-Art und Vollbilder dürfen breit)
  const bigW = m.pixelated || m.full ? 1100 : Math.max(m.width * 1.2, 600);

  return (
    <figure className={`p-shot${m.pixelated ? " px" : ""}${m.video && panel ? " clip" : ""}`}>
      <div
        className="p-shot-frame"
        onClick={(e) => {
          if (!matchMedia(DESKTOP).matches) return;
          // Listenansicht: der Klick aufs Video gehört der Browser-Bedienung
          if (!panel && e.target instanceof HTMLVideoElement) return;
          open();
        }}
      >
        {inline()}
      </div>
      <dialog
        ref={dialog}
        className={`shot-big${m.pixelated ? " px" : ""}`}
        style={{ width: `min(${bigW}px, 92vw)` }}
        onClose={() => setBig(false)}
        onClick={(e) => {
          // Klick auf den abgedunkelten Rand schließt
          if (e.target === e.currentTarget) close();
        }}
        aria-label={m.alt}
      >
        {big && large()}
        <button type="button" className="shot-close" onClick={close} aria-label={labels.shrink}>
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <path d="M2 2l6 6M8 2l-6 6" />
          </svg>
        </button>
      </dialog>
      <figcaption>
        <span className="p-shot-cap">{m.caption}</span>
        <button type="button" className="p-shot-zoom" onClick={open}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <path d="M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 1.5 7 5M1.5 10.5 5 7" />
          </svg>
          {labels.enlarge}
        </button>
      </figcaption>
    </figure>
  );
}
