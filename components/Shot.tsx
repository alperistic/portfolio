"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Media } from "@/content";

type Props = {
  m: Media;
  labels: { enlarge: string; shrink: string };
  /**
   * Panel: ob es gerade offen ist (Clip läuft nur dann). Listenansicht: nicht
   * gesetzt — dort läuft der Clip, solange er im Bild ist.
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

/**
 * Einblick in die Arbeit: Screenshot oder stummer Clip in Schleife, darunter
 * die Bildunterschrift mit „Vergrößern“ (natives <dialog>, Esc schließt). Auf
 * dem Desktop vergrößert auch ein Klick aufs Bild; mobil nicht, damit beim
 * Scrollen im Sheet nichts aus Versehen aufgeht.
 * Clips laufen nur, wenn man sie sieht, und bei reduzierter Bewegung gar nicht
 * von selbst — dann steht das Standbild mit Bedienelementen da.
 */
export function Shot({ m, labels, active }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [big, setBig] = useState(false);
  // Reduzierte Bewegung: Standbild mit Bedienelementen statt Autoplay
  const still = useSyncExternalStore(subscribeRM, reducedMotion, () => false);

  // Clip abspielen, solange sichtbar (und Panel offen)
  useEffect(() => {
    const v = video.current;
    if (!v || still) return;
    if (active === false || big) {
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
  }, [active, still, big]);

  const open = () => {
    dialog.current?.showModal();
    setBig(true);
  };
  const close = () => dialog.current?.close();

  const media = (large: boolean) =>
    m.video ? (
      <video
        ref={large ? undefined : video}
        poster={m.src}
        width={m.width}
        height={m.height}
        muted
        loop
        playsInline
        autoPlay={large && !still}
        controls={still || large}
        preload={large ? "auto" : "metadata"}
        aria-label={m.alt}
      >
        {m.video.map((s) => (
          <source key={s} src={s} type={s.endsWith(".webm") ? "video/webm" : "video/mp4"} />
        ))}
      </video>
    ) : (
      // Statischer Export ohne Bild-Optimierung: die Dateien sind schon passend verkleinert
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.src} width={m.width} height={m.height} alt={m.alt} loading="lazy" decoding="async" />
    );

  return (
    <figure className={`p-shot${m.pixelated ? " px" : ""}`}>
      <div
        className="p-shot-frame"
        onClick={(e) => {
          if (!matchMedia(DESKTOP).matches) return;
          // Mit eigenen Bedienelementen (reduzierte Bewegung) gehört der Klick aufs Video ihnen
          if (still && e.target instanceof HTMLVideoElement) return;
          open();
        }}
      >
        {media(false)}
      </div>
      <dialog
        ref={dialog}
        className={`shot-big${m.pixelated ? " px" : ""}`}
        // Kleine Screenshots nicht über ihre Auflösung hinaus aufblasen (Pixel-Art darf)
        style={{ width: `min(${m.pixelated ? 1100 : Math.max(m.width * 1.2, 600)}px, 92vw)` }}
        onClose={() => setBig(false)}
        onClick={(e) => {
          // Klick auf den abgedunkelten Rand schließt
          if (e.target === e.currentTarget) close();
        }}
        aria-label={m.alt}
      >
        {big && media(true)}
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
