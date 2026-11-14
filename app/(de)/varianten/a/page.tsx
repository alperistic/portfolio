import Link from "next/link";
import { variantData } from "../data";
import s from "../varianten.module.css";

/**
 * Variante A — Umlaufbahnen. Der erste Bildschirm IST die Projektübersicht:
 * Alper als Sonne, jedes Produkt eine Bahn, Status und Link ohne Klick lesbar.
 */
export default function VarianteA() {
  const d = variantData();
  const angles = [55, 205, -50];
  return (
    <div className={s.a}>
      <main className={s.aMain}>
        <section className={s.aText}>
          <p className={s.kick}>{d.brand.subline}</p>
          <h1 className={s.aName}>{d.brand.name}</h1>
          <p className={s.aLead}>{d.lead}</p>
          <ol className={s.aList}>
            {d.projects.map((p, i) => (
              <li key={p.id}>
                <span className={s.aRing} style={{ ["--c" as string]: p.color }}>{i + 1}</span>
                <span>
                  <strong>{p.title}</strong> <em style={{ color: p.color }}>{p.status}</em>
                  <br />
                  <span className={s.aSmall}>{p.lead}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className={s.aCta}>
            <a className={s.btn} href={d.brand.follow.href}>
              {d.brand.follow.label} <span aria-hidden="true">↗</span>
            </a>
            <Link className={s.ghost} href="/">Zum Himmel</Link>
          </p>
        </section>
        <section className={s.orbit} aria-label="Projekte als Umlaufbahnen">
          <div className={s.sun} aria-hidden="true" />
          {d.projects.map((p, i) => (
            <div
              key={p.id}
              className={s.ring}
              style={{ ["--r" as string]: `${34 + i * 22}%`, ["--a" as string]: `${angles[i]}deg`, ["--c" as string]: p.color }}
            >
              <a className={s.body} href={p.link?.href ?? "#"} aria-label={`${p.title}, ${p.status}`}>
                <span className={s.dot} />
                <span className={s.tag}>
                  <strong>{p.title}</strong>
                  <em>{p.status}</em>
                </span>
              </a>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
