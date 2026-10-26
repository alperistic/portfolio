"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
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

/** Reduzierte Bewegung: kein Szenenwechsel, kein Zoom, keine wandernden Stücke. */
export const useReducedMotion = () => useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
/** Tab im Hintergrund: Wechsel und Clips stehen. */
export const useTabHidden = () => useSyncExternalStore(subscribeVis, () => document.hidden, () => false);

/** Ist das Element (grob) im Bild? Für Clips und Wechsel, die nur sichtbar laufen sollen. */
export function useInView<T extends Element>(threshold = 0.2): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

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
 * Eine Szene im Fenster. Schnitt bzw. Überblendung und der leichte Zoom kommen aus dem
 * CSS (`.b-scene`); hier wird nur umgeschaltet. Dekor: Das Fenster als Ganzes trägt
 * eine Beschreibung, die einzelnen Bilder sind leer beschriftet.
 */
export function Scene({ s, on, first }: { s: SceneSlot; on: boolean; first: boolean }) {
  const style = { "--hold": `${s.hold}ms`, "--focus": s.focus ?? "50% 50%" } as CSSProperties;
  return (
    <div className={`b-scene${on ? " is-on" : ""}${s.cut === "fade" ? " fade" : ""}`} style={style}>
      {/* Statischer Export ohne Bild-Optimierung: Dateien sind vorab passend verkleinert */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={s.src}
        alt=""
        decoding="async"
        loading={first ? "eager" : "lazy"}
        fetchPriority={first ? "high" : "low"}
      />
    </div>
  );
}
