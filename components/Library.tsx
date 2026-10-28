import Link from "next/link";
import Icon from "./Icon";
import NewNovel from "./NewNovel";

type LibraryNovel = {
  id: string;
  title: string;
  description: string;
  updatedAt: Date;
  _count: { chapters: number };
};

export default function Library({ novels }: { novels: LibraryNovel[] }) {
  return (
    <main className="page-shell dashboard">
      <div className="dashboard-heading">
        <div className="section-heading">
          <span className="eyebrow">Platz für deine Ideen</span>
          <h1>Deine Geschichten.</h1>
          <p>Finde zurück in deine Welt. Oder erschaffe eine neue.</p>
        </div>
        <a className="button" href="#new-project">
          <Icon name="plus" /> Neues Schreibprojekt
        </a>
      </div>
      <div className="library-summary">
        <Icon name="book" />
        <span>
          {novels.length}{" "}
          {novels.length === 1 ? "Schreibprojekt" : "Schreibprojekte"}
        </span>
        <span className="summary-divider" />
        <span>Dein Platz für große Ideen</span>
      </div>
      <div className="dashboard-grid">
        <section aria-label="Deine Schreibprojekte" className="novel-list">
          {novels.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">
                N
              </span>
              <h2>Hier beginnt etwas.</h2>
              <p>
                Lege dein erstes Schreibprojekt an. Ein Titel reicht, den Rest
                findest du beim Schreiben.
              </p>
            </div>
          ) : (
            novels.map((novel) => (
              <Link
                className="card novel-card"
                href={`/novel/${novel.id}`}
                key={novel.id}
              >
                <div className="novel-card-top">
                  <span className="book-cover" aria-hidden="true">
                    <Icon name="book" />
                  </span>
                  <span className="chapter-count">
                    {novel._count.chapters} Kapitel
                  </span>
                </div>
                <h2>{novel.title}</h2>
                <p>
                  {novel.description ||
                    "Eine Geschichte, die darauf wartet, erzählt zu werden."}
                </p>
                <div className="card-footer">
                  <span>
                    Bearbeitet am{" "}
                    {new Intl.DateTimeFormat("de-DE", {
                      dateStyle: "medium",
                      timeZone: "Europe/Berlin",
                    }).format(novel.updatedAt)}
                  </span>
                  <span className="card-action">
                    Weiterschreiben <Icon name="arrow" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </section>
        <NewNovel />
      </div>
    </main>
  );
}
