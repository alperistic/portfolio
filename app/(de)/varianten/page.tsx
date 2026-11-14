import Link from "next/link";
import s from "./varianten.module.css";

/** Übersicht der Entwürfe: je Variante Leitidee und wogegen sie antritt. */
export default function Varianten() {
  return (
    <div className={s.b}>
      <main className={s.bMain}>
        <h1 className={s.bName}>Varianten des Einstiegs</h1>
        <p className={s.bLead}>
          Zwei Entwürfe für den ersten Bildschirm und den Weg zu den Projekten. Gemessen an der Messlatte: Wer ist das,
          ist das echt, warum folgen — in 10 Sekunden, ohne Klick. Nur Inhalte aus <code>content/</code>.
        </p>
        <ul className={s.bRows}>
          <li>
            <div className={s.bRowTop}>
              <strong>A · Umlaufbahnen</strong>
              <Link href="/varianten/a">ansehen →</Link>
            </div>
            <p>
              Dunkel, im Weltall-Thema. Alper ist die Sonne, jedes Produkt eine Bahn mit Name und Status direkt am
              Himmelskörper, ein Klick führt zum Produkt. Projekte sind der erste Bildschirm statt ein Ziel der Tour.
            </p>
          </li>
          <li>
            <div className={s.bRowTop}>
              <strong>B · Logbuch</strong>
              <Link href="/varianten/b">ansehen →</Link>
            </div>
            <p>
              Bewusst weit weg: hell, eine Textspalte, keine Szene. Name, ein Satz, Folgen-Knopf, drei Produkte mit
              Status und Link, darunter Werdegang und Stack für Recruiter. Lädt sofort, funktioniert ohne WebGL.
            </p>
          </li>
        </ul>
        <p className={s.bNote}>
          Entwürfe, nicht verlinkt und nicht indexiert. <Link href="/">Zur echten Seite</Link>
        </p>
      </main>
    </div>
  );
}
