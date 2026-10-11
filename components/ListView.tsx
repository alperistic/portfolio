import type { LangLink, PublicContent } from "@/content";
import { Glyph } from "./Glyph";
import { ObjectBody, Tags } from "./ObjectContent";
import { FallbackNote, LangSwitch, ToSky } from "./ViewControls";

/**
 * Listenansicht: alle Inhalte als echtes HTML (Überschriften, Listen, Links).
 * Steht immer im statischen Export — für Crawler, Screenreader, ohne
 * JavaScript, ohne WebGL und für alle, die nicht fliegen wollen.
 * Gleicher Look wie der Himmel: dunkel, dahinter ein Standbild des Sternenhimmels.
 */
export function ListView({ content, langs }: { content: PublicContent; langs: LangLink[] }) {
  const { ui, tourOrder, objects, brand, locale } = content;
  const alper = objects.alper;
  const rest = tourOrder.filter((id) => id !== "alper");

  return (
    <div className="listview">
      <div className="lv-bg" aria-hidden="true" />
      <header className="lv-top">
        <p className="lv-brand">{brand.name}</p>
        <div className="lv-ctl">
          <LangSwitch langs={langs} current={locale} label={ui.langGroup} className="lv-lang" />
          <ToSky ui={ui} />
        </div>
      </header>

      <main className="lv-main">
        <FallbackNote ui={ui} />

        <header className="lv-hero" id="alper">
          <p className="p-kick">{alper?.kicker ?? brand.subline}</p>
          <h1 className="lv-title" id="lv-title" tabIndex={-1}>
            {alper?.title ?? brand.name}
          </h1>
          <p className="lv-sub">{brand.subline}</p>
          {alper && (
            <div className="p-body">
              <ObjectBody o={alper} locale={locale} />
            </div>
          )}
        </header>

        <nav className="lv-toc" aria-labelledby="lv-toc-h">
          <h2 className="p-sec" id="lv-toc-h">
            {ui.contents}
          </h2>
          <ol>
            {rest.map((id) => {
              const o = objects[id]!;
              return (
                <li key={id}>
                  <a href={`#${id}`}>
                    <Glyph id={id} />
                    <span className="lg-t">{o.label}</span>
                    <span className="lg-m">{o.meta}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        {rest.map((id) => {
          const o = objects[id]!;
          return (
            <section key={id} id={id} className="lv-sec" aria-labelledby={`${id}-h`}>
              <p className="p-kick">{o.kicker}</p>
              <h2 className="p-title" id={`${id}-h`} tabIndex={-1}>
                {o.title}
              </h2>
              <Tags o={o} />
              <div className="p-body">
                <ObjectBody o={o} locale={locale} />
              </div>
            </section>
          );
        })}
      </main>

      <footer className="lv-foot">
        <p>
          {brand.name} · {brand.subline}
        </p>
      </footer>
    </div>
  );
}
