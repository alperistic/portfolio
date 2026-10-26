"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

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

/** Reduzierte Bewegung: kein Auto-Schnitt, kein Rauschen, keine wechselnden Bilder. */
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

/* MiniDV-Einblendung: Datum und Uhrzeit des Besuchs, wie ein Camcorder sie einbrennt.
   Live statt erfunden; deutsche Monatskürzel wie auf einem Gerät aus Karlsruhe. */
const MONTHS = ["JAN", "FEB", "MÄR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"];
const pad = (n: number) => String(n).padStart(2, "0");
const stamp = () => {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${pad(d.getDate())} ${d.getFullYear()}|${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const subscribeClock = (cb: () => void) => {
  const t = window.setInterval(cb, 15000);
  return () => window.clearInterval(t);
};

/** [Datum, Uhrzeit] — auf dem Server (statischer Export) noch leer. */
export function useCamcorderClock(): [string, string] | null {
  const s = useSyncExternalStore(subscribeClock, stamp, () => "");
  return s ? (s.split("|") as [string, string]) : null;
}
