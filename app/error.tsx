"use client";

import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page-shell narrow">
      <span className="eyebrow">Ein kurzer Zwischenstopp</span>
      <h1>Das hat gerade nicht geklappt.</h1>
      <p>
        Dein Schreibbereich konnte nicht geladen werden. Bitte versuche es
        erneut. Wenn der Fehler bleibt, prüfe die Datenbankverbindung und die
        Einrichtung.
      </p>
      <div className="actions">
        <button className="button" onClick={reset}>
          Erneut versuchen
        </button>
        <Link className="button secondary" href="/">
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
