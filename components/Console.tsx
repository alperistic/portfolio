"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { fill, type ObjectId, type PublicContent } from "@/content";
import { getView } from "@/lib/view";

/** Was die Konsole im Himmel auslösen darf. */
export type ConsoleActions = {
  focus: (id: ObjectId) => void;
  home: () => void;
  /** Blick auf das versteckte schwarze Loch (zurück in die Übersicht). */
  lookAtHole: () => void;
  tour: () => void;
  toList: () => void;
  /** Ton an/aus, liefert den neuen Zustand. */
  toggleSound: () => boolean;
  /** Jahresring anhören bzw. anhalten; liefert, ob er jetzt läuft. */
  playRing: () => boolean;
  /** Lebenszeichen: Funke zum zuletzt bearbeiteten Projekt. */
  spark: (id: ObjectId) => void;
};

type Props = {
  content: PublicContent;
  /** Aktuelles Objekt im Fokus — bestimmt den Pfad im Prompt (`~/offerre`). */
  focused: ObjectId | null;
  /** Lebenszeichen für `last`. */
  pulse: { id: ObjectId; ago: string } | null;
  /** Andere Sprachen mit Pfad, für `lang`. */
  langs: { locale: string; href: string }[];
  actions: ConsoleActions;
};

type Line = { k: "in" | "out" | "dim"; text: string };

/** Ort im Himmel → Kurzname für `ls`/`cd`: aus dem Label (klein, Sonderzeichen und Leerzeichen als `-`). */
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9.äöüß]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Konsole: Taste „/“ öffnet oben eine kleine Kommandozeile (wie die Entwickler-Konsole
 * in alten Shootern). Für die, die gern etwas ausprobieren — alles, was sie kann, geht
 * auch über die normale Bedienung. Nur im Himmel und nur mit Tastatur.
 *
 * Esc oder `exit` schließt; Pfeil hoch/runter blättert durch die letzten Befehle,
 * Tab vervollständigt Befehle und Orte.
 */
export function Console({ content, focused, pulse, langs, actions }: Props) {
  const { term, objects, tourOrder, brand } = content;
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const history = useRef<string[]>([]);
  const histPos = useRef(-1);
  const returnTo = useRef<HTMLElement | null>(null);
  const greeted = useRef(false);

  const places = tourOrder.map((id) => ({ id, name: slug(objects[id]!.label) }));
  const here = focused ? `~/${places.find((p) => p.id === focused)?.name ?? focused}` : "~";
  const prompt = `alper@late ${here} %`;

  // Hinweis für die, die in die Entwickler-Konsole des Browsers schauen
  useEffect(() => {
    console.log(`%c${term.devtools}`, "color:#f1c98e;font:12px ui-monospace,monospace");
  }, [term.devtools]);

  // „/“ öffnet (nicht in Eingabefeldern, nicht in der Listenansicht)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open || e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (getView().view !== "sky") return;
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable], dialog")) return;
      e.preventDefault();
      returnTo.current = document.activeElement as HTMLElement | null;
      if (!greeted.current) {
        greeted.current = true;
        setLines([{ k: "dim", text: term.hello }]);
      }
      setOpen(true);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, term.hello]);

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  /** Schließen; `nav` = ein Befehl fliegt irgendwohin, dann übernimmt der Himmel den Fokus. */
  const close = (nav = false) => {
    setOpen(false);
    if (!nav) returnTo.current?.focus?.({ preventScroll: true });
  };

  const findPlace = (q: string) => {
    const s = slug(q);
    return (
      places.find((p) => p.name === s || p.id === s) ??
      places.find((p) => p.name.startsWith(s) || p.id.startsWith(s)) ??
      null
    );
  };

  /** Führt einen Befehl aus und liefert die Antwortzeilen. */
  const run = (raw: string): Line[] | "clear" | "exit" | "nav" => {
    const [cmd = "", ...rest] = raw.trim().split(/\s+/);
    const arg = rest.join(" ");
    const c = cmd.toLowerCase();
    const out = (...t: string[]): Line[] => t.map((text) => ({ k: "out", text }));
    switch (c) {
      case "":
        return [];
      case "help":
      case "?": {
        const w = Math.max(...term.help.map(([k]) => k.length)) + 3;
        return out(...term.help.map(([k, d]) => k.padEnd(w) + d));
      }
      case "ls":
      case "dir": {
        const names = places.map((p) => p.name);
        if (rest.some((r) => r.startsWith("-") && r.includes("a"))) names.push(term.hole);
        return out(names.join("   "));
      }
      case "cd":
      case "goto": {
        if (!arg || arg === "~" || arg === ".." || arg === "/") {
          actions.home();
          return "nav";
        }
        if (slug(arg) === term.hole || slug(arg) === term.hole.slice(1)) {
          actions.lookAtHole();
          return [...out(term.holeSay)];
        }
        const p = findPlace(arg);
        if (!p) return out(fill(term.noPlace, arg));
        actions.focus(p.id);
        return "nav";
      }
      case "open": {
        const p = arg ? findPlace(arg) : focused ? places.find((x) => x.id === focused) : null;
        const href = p ? objects[p.id]?.links?.find((l) => l.href?.startsWith("http"))?.href : undefined;
        if (!p) return out(fill(term.noPlace, arg || "?"));
        if (!href) return out(term.noLink);
        window.open(href, "_blank", "noopener,noreferrer");
        return out(href.replace(/^https?:\/\//, ""));
      }
      case "last":
        if (!pulse) return out(term.lastNone);
        actions.spark(pulse.id);
        return out(`${slug(objects[pulse.id]!.label)} · ${pulse.ago}`);
      case "play":
        return out(actions.playRing() ? term.play : term.stop);
      case "tour":
        actions.tour();
        return "nav";
      case "whoami":
        return out(fill(term.whoami, `${brand.name}, ${brand.subline}`.toLowerCase()));
      case "sound":
      case "ton":
        return out(actions.toggleSound() ? term.soundOn : term.soundOff);
      case "list":
        actions.toList();
        return "nav";
      case "lang": {
        const to = langs.find((l) => l.locale === arg.toLowerCase()) ?? langs.find((l) => l.locale !== content.locale);
        if (to) location.href = to.href;
        return [];
      }
      case "follow":
      case "x":
        window.open(brand.follow.href, "_blank", "noopener");
        return out(brand.follow.handle);
      case "mail": {
        const mail = objects.kontakt?.links?.find((l) => l.href?.startsWith("mailto:"));
        if (!mail?.href) return out(term.noLink);
        location.href = mail.href;
        return out(mail.text);
      }
      case "clear":
      case "cls":
        return "clear";
      case "exit":
      case "quit":
      case ":q":
        return "exit";
      default: {
        const egg = term.eggs[c];
        return out(egg ?? fill(term.unknown, cmd));
      }
    }
  };

  const submit = () => {
    const raw = value;
    setValue("");
    histPos.current = -1;
    if (raw.trim()) history.current = [raw, ...history.current.filter((h) => h !== raw)].slice(0, 30);
    const res = run(raw);
    if (res === "clear") return setLines([]);
    const echo: Line = { k: "in", text: `${prompt} ${raw}` };
    if (res === "exit" || res === "nav") {
      setLines((l) => [...l, echo]);
      return close(res === "nav");
    }
    setLines((l) => [...l, echo, ...res].slice(-80));
  };

  /** Tab: erst Befehl, dann Ort vervollständigen (eindeutiger Präfix). */
  const complete = () => {
    const parts = value.split(" ");
    if (parts.length === 1) {
      const cmds = [...new Set(term.help.map(([k]) => k.split(" ")[0]))];
      const hits = cmds.filter((k) => k.startsWith(parts[0].toLowerCase()));
      if (hits.length === 1) setValue(hits[0] + " ");
      else if (hits.length > 1) setLines((l) => [...l, { k: "dim", text: hits.join("   ") }]);
      return;
    }
    const q = parts.slice(1).join(" ").toLowerCase();
    const hits = places.map((p) => p.name).filter((n) => n.startsWith(q));
    if (hits.length === 1) setValue(`${parts[0]} ${hits[0]}`);
    else if (hits.length > 1) setLines((l) => [...l, { k: "dim", text: hits.join("   ") }]);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      histPos.current = Math.max(-1, Math.min(h.length - 1, histPos.current + (e.key === "ArrowUp" ? 1 : -1)));
      setValue(histPos.current < 0 ? "" : h[histPos.current]);
    }
  };

  return (
    <div className={`con${open ? " open" : ""}`} role="region" aria-label={term.label} hidden={!open}>
      <div className="con-log" ref={logRef} aria-live="polite">
        {lines.map((l, i) => (
          <p key={i} className={`con-${l.k}`}>
            {l.text}
          </p>
        ))}
      </div>
      <form
        className="con-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="con-in" className="con-prompt">
          {prompt}
        </label>
        <input
          id="con-in"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
      </form>
    </div>
  );
}
