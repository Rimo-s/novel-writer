import Link from "next/link";
import NewNovel from "@/components/NewNovel";
import { pageUser } from "@/lib/auth";
import { novelStore } from "@/lib/novels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const novels = await novelStore(prisma).list(await pageUser());
  return (
    <main className="page-shell dashboard">
      <div className="section-heading">
        <span className="eyebrow">Platz für deine Ideen</span>
        <h1>Deine Geschichten.</h1>
        <p>Finde zurück in deine Welt. Oder erschaffe eine neue.</p>
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
                <span className="eyebrow">{novel._count.chapters} Kapitel</span>
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
                  <span aria-hidden="true">↗</span>
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
