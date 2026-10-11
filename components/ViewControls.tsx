"use client";

import type { LangLink, Locale, PublicContent } from "@/content";
import { setView, useView } from "@/lib/view";

type Ui = PublicContent["ui"];

/**
 * Sprachumschalter (Himmel und Liste). Wer die Liste selbst gewählt hat,
 * landet auch in der anderen Sprache wieder in der Liste.
 */
export function LangSwitch({ langs, current, label, className }: { langs: LangLink[]; current: Locale; label: string; className: string }) {
  const v = useView();
  const keepList = v?.view === "list" && v.why === "user";
  return (
    <nav className={className} aria-label={label}>
      {langs.map((l, i) => (
        <span key={l.locale}>
          {i > 0 && <span className="sep" aria-hidden="true">/</span>}
          <a
            href={keepList ? `${l.href}?view=list` : l.href}
            hrefLang={l.locale}
            lang={l.locale}
            aria-current={l.locale === current ? "page" : undefined}
            title={l.name}
          >
            <span aria-hidden="true">{l.locale.toUpperCase()}</span>
            <span className="sr">{l.name}</span>
          </a>
        </span>
      ))}
    </nav>
  );
}

const AUTO = new Set(["weak", "slow", "lost", "load"]);

/** „Zum Himmel“ in der Listenansicht — nur, wenn das Gerät WebGL 2 kann. */
export function ToSky({ ui }: { ui: Ui }) {
  const v = useView();
  if (!v || v.why === "webgl") return null;
  return (
    <button
      type="button"
      className="lv-sky-btn"
      onClick={() => {
        setView("sky", "user");
        requestAnimationFrame(() => document.querySelector<HTMLElement>(".to-list")?.focus({ preventScroll: true }));
      }}
    >
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <circle cx="7" cy="7" r="2" fill="currentColor" stroke="none" />
        <circle cx="7" cy="7" r="5.6" opacity=".5" />
      </svg>
      {v.why && AUTO.has(v.why) ? ui.tryAnyway : ui.skyView}
    </button>
  );
}

/** Hinweis, warum die Listenansicht automatisch kam. */
export function FallbackNote({ ui }: { ui: Ui }) {
  const v = useView();
  const why = v?.view === "list" ? v.why : null;
  return (
    <p className="lv-note" role="status" hidden={!why || why === "user"}>
      {why && why !== "user" ? ui.fallback[why] : null}
    </p>
  );
}
