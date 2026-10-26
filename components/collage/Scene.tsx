"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import type { SceneSlot } from "@/content/collage";

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const subscribeVis = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};

/** Reduzierte Bewegung: kein Auto-Zyklus, kein Ken-Burns, Standbilder. */
export const useReducedMotion = () => useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
/** Tab im Hintergrund: Zyklus und Clips stehen. */
export const useTabHidden = () => useSyncExternalStore(subscribeVis, () => document.hidden, () => false);

export const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src);
export const pad = (n: number) => String(n).padStart(2, "0");

/** Clip abspielen, solange `play` gilt — sonst anhalten. */
export function usePlayback(play: boolean) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) v.play().catch(() => undefined);
    else v.pause();
  }, [play]);
  return ref;
}

/**
 * Eine Szene: Platzhalter-Verlauf aus dem Manifest, darüber (falls vorhanden) das
 * echte Foto oder der Clip. Schnitt bzw. Überblendung und Ken-Burns macht das CSS
 * (`.c-scene`), hier wird nur umgeschaltet.
 */
export function Scene({ s, on, play }: { s: SceneSlot; on: boolean; play: boolean }) {
  const video = usePlayback(on && play);
  const style = { "--hold": `${s.hold}ms`, "--focus": s.focus ?? "50% 50%" } as CSSProperties;

  return (
    <div className={`c-scene${on ? " is-on" : ""}${s.cut === "fade" ? " fade" : ""}`} style={style}>
      <div className="c-scene-img" style={{ background: s.placeholder.palette }}>
        {s.src &&
          (isVideo(s.src) ? (
            <video ref={video} muted loop playsInline preload="metadata">
              <source src={s.src} type={s.src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            </video>
          ) : (
            // Statischer Export ohne Bild-Optimierung: Dateien vorher passend verkleinern
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.src} alt="" decoding="async" />
          ))}
      </div>
    </div>
  );
}
