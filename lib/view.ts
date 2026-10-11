import { useSyncExternalStore } from "react";

/**
 * Himmel oder Liste? Die erste Entscheidung trifft ein kleines Inline-Script im
 * <head> (lib/view-script.ts), bevor der Browser das erste Bild malt — so blitzt
 * weder die Liste noch der Himmel kurz falsch auf. Danach ist `<html data-view>`
 * die Quelle der Wahrheit; das CSS blendet danach um, React liest hier mit.
 */
export type View = "sky" | "list";
/** Warum die Liste gezeigt wird: selbst gewählt oder einer der automatischen Gründe. */
export type Why = "user" | "webgl" | "weak" | "slow" | "lost" | "load";
export type ViewState = { view: View; why: Why | null; forced: boolean };

let state: ViewState | null = null;
const listeners = new Set<() => void>();

function read(): ViewState {
  const d = document.documentElement.dataset;
  const q = new URLSearchParams(location.search).get("view");
  return { view: d.view === "sky" ? "sky" : "list", why: (d.why as Why) || null, forced: q === "sky" };
}

export function getView(): ViewState {
  return (state ??= read());
}

/**
 * Wechselt die Ansicht. Eine selbst gewählte Liste steht auch in der URL
 * (`?view=list`), damit man den Link so weitergeben kann (z. B. an Recruiter).
 * Wer den Himmel selbst wählt, bekommt keinen automatischen Rückfall mehr.
 */
export function setView(view: View, why: Why | null = null) {
  const prev = getView();
  state = { view, why: view === "list" ? why : null, forced: prev.forced || (view === "sky" && why === "user") };
  const d = document.documentElement.dataset;
  d.view = view;
  if (state.why) d.why = state.why;
  else delete d.why;
  const url = new URL(location.href);
  if (view === "list" && why === "user") url.searchParams.set("view", "list");
  else url.searchParams.delete("view");
  history.replaceState(history.state, "", url);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Aktuelle Ansicht; `null` beim Server-Rendern und während der Hydration. */
export const useView = () => useSyncExternalStore(subscribe, getView, () => null);
