import Link from "next/link";
import Icon from "@/components/Icon";

export default function Home() {
  return (
    <main className="page-shell landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> Dein nächstes Kapitel beginnt hier
          </span>
          <h1>
            Deine Welt.
            <br />
            Deine Worte.
            <br />
            <em>Deine Geschichte.</em>
          </h1>
          <p>
            Ein ruhiger Ort für große Ideen. Organisiere deine Kapitel, finde
            deinen Schreibfluss und gib deiner Geschichte Raum.
          </p>
          <div className="actions">
            <Link className="button" href="/dashboard">
              Geschichte beginnen <Icon name="arrow" />
            </Link>
            <a className="button secondary" href="#features">
              Entdecken <Icon name="down" />
            </a>
          </div>
          <div className="hero-benefits" aria-label="Dein Schreibbereich">
            <span>
              <Icon name="check" /> Eigene Kapitel
            </span>
            <span>
              <Icon name="check" /> Automatisch speichern
            </span>
            <span>
              <Icon name="check" /> TXT-Export
            </span>
          </div>
          <p className="fine-print">
            Ein Projekt in Entwicklung. Mit eigenem Konto und optionaler
            KI-Hilfe.
          </p>
        </div>
        <div
          className="hero-preview"
          aria-label="Illustratives Beispiel eines Manuskripts, keine gespeicherten Nutzerdaten"
        >
          <div className="preview-top">
            <span className="preview-dots" aria-hidden="true">
              ● ● ●
            </span>
            <span>DEIN MANUSKRIPT</span>
          </div>
          <div className="preview-body">
            <span className="eyebrow">
              Kapitel 01 <span className="preview-tag">Der Anfang</span>
            </span>
            <h2>
              Alles begann
              <br />
              mit einer Idee.
            </h2>
            <p>
              Die Stadt schlief noch, als sie das Fenster öffnete. Irgendwo
              zwischen den Dächern lag eine Geschichte, die nur darauf wartete,
              gefunden zu werden.
            </p>
            <p>Sie nahm den Stift. Und schrieb den ersten Satz.</p>
            <span className="ink-line" aria-hidden="true" />
            <div className="preview-note">
              Platz für das, was nur du erzählen kannst.
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="feature-section">
        <div className="section-heading">
          <span className="eyebrow">Weniger Ablenkung. Mehr Geschichte.</span>
          <h2>Für deinen Schreibfluss.</h2>
        </div>
        <div className="feature-grid">
          {[
            [
              "01",
              "Eine Welt, viele Kapitel.",
              "Halte deine Romane und Kapitel an einem Ort. Vom ersten Gedanken bis zur nächsten Wendung.",
            ],
            [
              "02",
              "Worte, die bleiben.",
              "Schreibe und formatiere im Editor. Ein sichtbarer Speicherstatus begleitet deine Arbeit.",
            ],
            [
              "03",
              "Du führst die Geschichte.",
              "Lass dir bei Bedarf eine KI-Fortsetzung vorschlagen. Übernimm nur die Gedanken, die zu dir passen.",
            ],
          ].map(([number, title, text]) => (
            <article key={number}>
              <span className="feature-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
