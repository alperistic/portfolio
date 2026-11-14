import Link from "next/link";
import { variantData } from "../data";
import s from "../varianten.module.css";

/**
 * Variante B — Logbuch. Bewusst weit weg vom Himmel: hell, textgeführt,
 * eine Spalte. Wer in 20 Sekunden wissen will, wer Alper ist und was er
 * gebaut hat, liest es von oben nach unten, ohne etwas zu bedienen.
 */
export default function VarianteB() {
  const d = variantData();
  return (
    <div className={s.b}>
      <main className={s.bMain}>
        <header className={s.bHead}>
          <span className={s.bSun} aria-hidden="true" />
          <h1 className={s.bName}>{d.brand.name}</h1>
          <p className={s.bSub}>{d.brand.subline}</p>
          <p className={s.bLead}>{d.lead}</p>
          <p className={s.bCta}>
            <a href={d.brand.follow.href}>
              {d.brand.follow.label} ({d.brand.follow.handle}) <span aria-hidden="true">↗</span>
            </a>
          </p>
        </header>

        <section aria-labelledby="b-proj">
          <h2 id="b-proj" className={s.bH2}>Gebaut</h2>
          <ul className={s.bRows}>
            {d.projects.map((p) => (
              <li key={p.id}>
                <div className={s.bRowTop}>
                  <strong>{p.title}</strong>
                  <span className={s.bStatus}>
                    <i style={{ background: p.color }} />
                    {p.status}
                  </span>
                  {p.link && (
                    <a href={p.link.href}>
                      {p.link.text} <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
                <p>{p.lead}</p>
              </li>
            ))}
          </ul>
          {d.late && <p className={s.bNote}>{d.late.lead}</p>}
        </section>

        <div className={s.bCols}>
          <section aria-labelledby="b-weg">
            <h2 id="b-weg" className={s.bH2}>Werdegang</h2>
            <ul className={s.bPlain}>
              {d.stations.map((st) => (
                <li key={st.period + st.title}>
                  <span className={s.bYear}>{st.period}</span> {st.title}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="b-stack">
            <h2 id="b-stack" className={s.bH2}>Stack</h2>
            <ul className={s.bPlain}>
              {d.skills.slice(0, 5).map((g) => (
                <li key={g.title}>
                  <span className={s.bYear}>{g.title}</span> {g.skills.join(", ")}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className={s.bFoot}>
          <p>{d.contactLead}</p>
          <p className={s.bLinks}>
            {d.contact.map((l) => (
              <a key={l.label} href={l.href}>
                {l.text}
              </a>
            ))}
            <Link href="/">Zum Himmel ↗</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
