"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SOLID_AT, startDust, type Dust } from "@/lib/opening-dust";

/** Wie lange die Titelkarte steht, bevor sie von selbst geht (ms). */
const HOLD = 5000;
/** Dauer des Ausblendens (ms) — danach übernimmt die UI. */
const OUT = 700;

type Props = {
  name: string;
  subline: string;
  skipLabel: string;
  onDone: () => void;
};

/**
 * Eröffnung beim ersten Besuch (je Sitzung): Während die Kamera aus der Nähe
 * der Sonne zurückfährt, lösen sich Funken aus der Sonne und formen den Namen
 * (Sternenstaub, siehe lib/opening-dust.ts). Dann blendet die Schrift scharf
 * ein, darunter Rolle und eine feine Goldlinie. Beim Ausblenden zerstreut sich
 * der Staub wieder, die Bedienelemente kommen gestaffelt dazu.
 *
 * Lässt sich die Schrift nicht abtasten, läuft der Name wie bisher Buchstabe
 * für Buchstabe ein. Jede Eingabe (Klick, Taste, Scrollen, Tippen) überspringt
 * sofort. Die Karte ist für Screenreader ausgeblendet — dieselben Inhalte
 * stehen im Panel und in der Listenansicht.
 */
export function Opening({ name, subline, skipLabel, onDone }: Props) {
  const [out, setOut] = useState(false);
  const [dust, setDust] = useState(false);
  const [solid, setSolid] = useState(false);
  const done = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const dustRef = useRef<Dust | null>(null);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setOut(true);
    dustRef.current?.scatter(OUT + 200);
    window.setTimeout(onDone, OUT);
  }, [onDone]);

  useEffect(() => {
    const t = window.setTimeout(finish, HOLD);
    const skip = () => finish();
    const opts = { capture: true, passive: true } as const;
    addEventListener("pointerdown", skip, opts);
    addEventListener("keydown", skip, opts);
    addEventListener("wheel", skip, opts);
    return () => {
      clearTimeout(t);
      removeEventListener("pointerdown", skip, opts);
      removeEventListener("keydown", skip, opts);
      removeEventListener("wheel", skip, opts);
    };
  }, [finish]);

  // Sternenstaub starten, sobald die Schrift geladen ist (sonst stimmen die Maße nicht)
  useEffect(() => {
    let alive = true;
    let solidT = 0;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 400))]).then(() => {
      if (!alive || done.current || !canvasRef.current || !nameRef.current) return;
      const chars = [...nameRef.current.querySelectorAll<HTMLElement>(".op-c")];
      // Ohne die Einlauf-Animation messen (sie verschiebt die Buchstaben noch)
      chars.forEach((c) => (c.style.animation = "none"));
      const d = startDust(canvasRef.current, chars);
      if (!d) {
        chars.forEach((c) => (c.style.animation = ""));
        return;
      }
      dustRef.current = d;
      setDust(true);
      solidT = window.setTimeout(() => setSolid(true), SOLID_AT * 1000);
    });
    return () => {
      alive = false;
      clearTimeout(solidT);
      dustRef.current?.stop();
    };
  }, []);

  const words = name.split(" ");
  // Laufindex je Buchstabe über alle Wörter (für die Staffelung)
  const starts = words.map((_, i) => words.slice(0, i).join("").length);

  return (
    <div className={`opening${out ? " out" : ""}${dust ? " dust" : ""}${solid ? " solid" : ""}`}>
      <div className="op-card" aria-hidden="true">
        <p className="op-n" ref={nameRef}>
          {words.map((w, wi) => (
            <span key={wi} className="op-w">
              {[...w].map((ch, ci) => (
                <span key={ci} className="op-c" style={{ "--i": starts[wi] + ci } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p className="op-s">{subline}</p>
        <span className="op-l" />
      </div>
      <canvas className="op-dust" ref={canvasRef} aria-hidden="true" />
      <button type="button" className="op-skip" onClick={finish}>
        {skipLabel}
      </button>
    </div>
  );
}
