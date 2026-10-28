import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-shell narrow">
      <span className="eyebrow">404</span>
      <h1>Diese Seite fehlt.</h1>
      <p>
        Der Link ist ungültig oder dieses Schreibprojekt ist für dein Konto
        nicht verfügbar.
      </p>
      <Link className="button" href="/dashboard">
        Zu deinen Geschichten
      </Link>
    </main>
  );
}
