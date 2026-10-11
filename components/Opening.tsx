"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

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
 * der Sonne zurückfährt, läuft der Name Buchstabe für Buchstabe ein, darunter
 * die Rolle und eine feine Goldlinie. Danach blendet die Karte aus und die
 * Bedienelemente kommen gestaffelt dazu.
 *
 * Jede Eingabe (Klick, Taste, Scrollen, Tippen) überspringt sofort. Die Karte
 * ist für Screenreader ausgeblendet — dieselben Inhalte stehen im Panel und in
 * der Listenansicht.
 */
export function Opening({ name, subline, skipLabel, onDone }: Props) {
  const [out, setOut] = useState(false);
  const done = useRef(false);
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setOut(true);
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

  const words = name.split(" ");
  // Laufindex je Buchstabe über alle Wörter (für die Staffelung)
  const starts = words.map((_, i) => words.slice(0, i).join("").length);

  return (
    <div className={`opening${out ? " out" : ""}`}>
      <div className="op-card" aria-hidden="true">
        <p className="op-n">
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
      <button type="button" className="op-skip" onClick={finish}>
        {skipLabel}
      </button>
    </div>
  );
}
