"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Editor, { type EditorHandle } from "@/components/Editor";
import Icon from "@/components/Icon";
import { requestJson } from "@/lib/client";
import type { ChapterView } from "@/lib/types";

export default function NovelClient({
  novel,
  ownerId,
  aiEnabled,
}: {
  novel: { id: string; title: string; chapters: ChapterView[] };
  ownerId: string;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [chapters, setChapters] = useState(novel.chapters);
  const [activeId, setActiveId] = useState(novel.chapters[0]?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const editor = useRef<EditorHandle>(null);
  const active = chapters.find((chapter) => chapter.id === activeId);
  const saved = useCallback(
    (chapter: ChapterView) =>
      setChapters((list) =>
        list.map((item) => (item.id === chapter.id ? chapter : item)),
      ),
    [],
  );

  async function navigate(action: () => void | Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (editor.current && !(await editor.current.flush())) return;
      await action();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Aktion fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="writing-layout">
      <aside className="chapter-sidebar">
        <button
          className="back-link"
          disabled={busy}
          onClick={() => {
            void navigate(() => router.push("/dashboard"));
          }}
        >
          <Icon name="back" /> Alle Schreibprojekte
        </button>
        <span className="eyebrow">Dein Manuskript</span>
        <h1>{novel.title}</h1>
        <button
          className="chapter-toggle"
          type="button"
          aria-controls="chapter-navigation"
          aria-expanded={chaptersOpen}
          onClick={() => setChaptersOpen((open) => !open)}
        >
          <span>
            <Icon name="book" />
            <span>
              Kapitel{" "}
              {Math.max(
                1,
                chapters.findIndex((chapter) => chapter.id === activeId) + 1,
              )}{" "}
              von {chapters.length}
            </span>
          </span>
          <Icon name="down" />
        </button>
        <div
          id="chapter-navigation"
          className="chapter-navigation"
          data-open={chaptersOpen}
        >
          <div className="sidebar-label">
            Kapitel <span>{chapters.length}</span>
          </div>
          <nav aria-label="Kapitel">
            <ol>
              {chapters.map((chapter, index) => (
                <li key={chapter.id}>
                  <button
                    aria-current={chapter.id === activeId ? "page" : undefined}
                    disabled={busy}
                    onClick={() => {
                      void navigate(() => {
                        setActiveId(chapter.id);
                        setChaptersOpen(false);
                      });
                    }}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className="chapter-name">{chapter.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              void navigate(async () => {
                const chapter = await requestJson<ChapterView>(
                  "/api/scene",
                  "POST",
                  {
                    novelId: novel.id,
                    title: `Kapitel ${chapters.length + 1}`,
                  },
                );
                setChapters((list) => [...list, chapter]);
                setActiveId(chapter.id);
                setChaptersOpen(false);
              });
            }}
          >
            <Icon name="plus" /> Kapitel hinzufügen
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              void navigate(async () => {
                const response = await fetch(`/api/novels/${novel.id}/export`);
                if (!response.ok)
                  throw new Error(
                    "Export fehlgeschlagen. Bitte versuche es erneut.",
                  );
                const url = URL.createObjectURL(await response.blob());
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${novel.title.replace(/[^\p{L}\p{N}\s_-]/gu, "").slice(0, 80) || "manuskript"}.txt`;
                anchor.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              });
            }}
          >
            <Icon name="download" />
            <span>Als TXT exportieren</span>
          </button>
          <p className="fine-print">
            Deine Änderungen werden automatisch gespeichert. Nicht gesendete
            Entwürfe können zur Wiederherstellung in diesem Browser verbleiben.
          </p>
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
      </aside>
      {active ? (
        <Editor
          key={active.id}
          ref={editor}
          chapter={active}
          ownerId={ownerId}
          onSaved={saved}
          aiEnabled={aiEnabled}
          locked={busy}
        />
      ) : (
        <p className="notice">Füge dein erstes Kapitel hinzu.</p>
      )}
    </div>
  );
}
