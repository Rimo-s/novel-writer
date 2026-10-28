import Link from "next/link";

export default function Setup() {
  return (
    <main className="page-shell narrow">
      <span className="eyebrow">Fast bereit</span>
      <h1>Dein Schreibbereich wartet.</h1>
      <p>
        Diese Installation ist noch nicht vollständig eingerichtet. Anmeldung
        und Speicherung werden erst nach der Einrichtung freigeschaltet.
      </p>
      <div className="card">
        <h2>Für die Einrichtung</h2>
        <p>
          Die README im Repository erklärt die Clerk-Schlüssel, die
          PostgreSQL-Verbindung und die Datenbankmigration. Danach die Anwendung
          neu starten.
        </p>
        <p>
          Für die optionale KI-Hilfe werden zusätzlich ein OpenAI-Schlüssel und
          eine Modell-ID benötigt.
        </p>
        <a
          className="button"
          href="https://github.com/Rimo-s/novel-writer#lokales-setup"
        >
          Setup-Anleitung öffnen ↗
        </a>
      </div>
      <Link className="back-link" href="/">
        ← Zur Startseite
      </Link>
    </main>
  );
}
