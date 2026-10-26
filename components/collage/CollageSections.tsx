import type { Fact, PublicContent } from "@/content";
import { COLLAGE_UI } from "@/content/collage";
import { Arrow } from "./Arrow";
import { PROJECT_ORDER, xLink } from "./data";

const factValue = (facts: Fact[] | undefined, label: string) => {
  const v = facts?.find((f) => f.label === label)?.value;
  return Array.isArray(v) ? v.join(" · ") : v;
};

/**
 * Die ruhige Ebene unter den Collagen: zum Überfliegen in 30 Sekunden, ohne
 * Interaktion. Server Component — reines HTML, kein JavaScript im Browser.
 */
export function CollageSections({ content }: { content: PublicContent }) {
  const o = content.objects;
  const x = xLink(content);
  const contactLinks = o.kontakt?.links ?? [];
  // X zuerst: Folgen ist die Haupt-Handlung dieser Variante
  const contacts = [...contactLinks].sort((a, b) => Number(b.href === x?.href) - Number(a.href === x?.href));

  return (
    <div className="c-skim">
      <section className="c-sec" aria-labelledby="c-sec-work">
        <h2 id="c-sec-work" className="c-h">
          {COLLAGE_UI.sections.work}
        </h2>
        <div className="c-sec-body c-work-list">
          {PROJECT_ORDER.map((id) => {
            const p = o[id];
            if (!p) return null;
            const link = p.links?.find((l) => l.href);
            return (
              <article key={id} className="c-item">
                <h3>{p.title}</h3>
                <p className="c-status">
                  <i style={{ background: p.tags[0]?.color }} aria-hidden="true" />
                  {p.tags[0]?.text}
                </p>
                <p className="c-item-lead">{p.lead}</p>
                <dl>
                  <div>
                    <dt>{COLLAGE_UI.role}</dt>
                    <dd>{factValue(p.facts, "My role")}</dd>
                  </div>
                  <div>
                    <dt>{COLLAGE_UI.stack}</dt>
                    <dd>{factValue(p.facts, "Stack")}</dd>
                  </div>
                </dl>
                {link?.href && (
                  <a className="c-link" href={link.href} target="_blank" rel="noopener">
                    {link.text}
                    <Arrow />
                  </a>
                )}
              </article>
            );
          })}
          {o.late && (
            <article className="c-item c-item--late">
              <h3>{o.late.title}</h3>
              <p className="c-status">
                <i style={{ background: o.late.tags[0]?.color }} aria-hidden="true" />
                {o.late.tags[0]?.text}
              </p>
              <p className="c-item-lead">{o.late.lead}</p>
              {o.late.body?.map((b) => (
                <p key={b} className="c-item-body">
                  {b}
                </p>
              ))}
              {o.late.links
                ?.filter((l) => l.href)
                .map((l) => (
                  <a key={l.href} className="c-link" href={l.href} target="_blank" rel="noopener">
                    {l.label} · {l.text}
                    <Arrow />
                  </a>
                ))}
            </article>
          )}
        </div>
      </section>

      {o.werdegang && (
        <section className="c-sec" aria-labelledby="c-sec-path">
          <h2 id="c-sec-path" className="c-h">
            {COLLAGE_UI.sections.path}
          </h2>
          <ol className="c-sec-body c-path">
            {[...(o.werdegang.stations ?? [])].reverse().map((s) => (
              <li key={s.period + s.title}>
                <span className="c-path-when">{s.period}</span>
                <span className="c-path-what">
                  {s.title}
                  {s.detail && <span className="c-path-detail">{s.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {o.skills && (
        <section className="c-sec" aria-labelledby="c-sec-stack">
          <h2 id="c-sec-stack" className="c-h">
            {COLLAGE_UI.sections.stack}
          </h2>
          <div className="c-sec-body c-stack">
            {o.skills.skillGroups?.map((g) => (
              <div key={g.title} className="c-stack-group">
                <h3>{g.title}</h3>
                <ul>
                  {g.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {o.kontakt && (
        <section className="c-sec" aria-labelledby="c-sec-contact">
          <h2 id="c-sec-contact" className="c-h">
            {COLLAGE_UI.sections.contact}
          </h2>
          <div className="c-sec-body">
            <p className="c-contact-lead">{o.kontakt.lead}</p>
            <ul className="c-contact">
              {contacts.map((l) => (
                <li key={l.label}>
                  <span className="c-contact-k">{l.label}</span>
                  {l.href ? (
                    <a href={l.href} target="_blank" rel="noopener">
                      {l.text}
                      <Arrow />
                    </a>
                  ) : (
                    <span className="c-ph">{l.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <footer className="c-foot">
        {content.brand.name} · {content.brand.subline}
      </footer>
    </div>
  );
}
