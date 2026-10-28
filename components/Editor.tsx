"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { Autosave, type SaveState } from "@/lib/autosave";
import { requestJson } from "@/lib/client";
import { documentData } from "@/lib/document";
import type { ChapterView } from "@/lib/types";

type Draft = { title: string; content: JSONContent };
type Recovery = Draft & { version: number };
export type EditorHandle = { flush: () => Promise<boolean> };

function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const statusLabels: Record<SaveState, string> = {
  saved: "Alle Änderungen gespeichert",
  pending: "Ungespeicherte Änderungen",
  saving: "Wird gespeichert …",
  error: "Speichern fehlgeschlagen",
  conflict: "Versionskonflikt",
};

const Editor = forwardRef<
  EditorHandle,
  {
    chapter: ChapterView;
    ownerId: string;
    onSaved: (chapter: ChapterView) => void;
    aiEnabled: boolean;
    locked?: boolean;
  }
>(function Editor({ chapter, ownerId, onSaved, aiEnabled, locked = false }, ref) {
  const [title, setTitle] = useState(chapter.title);
  const [status, setStatus] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [aiError, setAiError] = useState("");
  const [words, setWords] = useState(
    () =>
      documentData(chapter.content)
        .plainText.trim()
        .split(/\s+/u)
        .filter(Boolean).length,
  );
  const draft = useRef<Draft>({
    title: chapter.title,
    content: chapter.content,
  });
  const storageKey = `novel-writer:${ownerId}:${chapter.id}`;
  const savedCallback = useRef(onSaved);
  useEffect(() => {
    savedCallback.current = onSaved;
  }, [onSaved]);

  const [saver] = useState(
    () =>
      new Autosave<Draft>(
        draft.current,
        chapter.version,
        async (value, version) => {
          const result = await requestJson<{ version: number }>(
            "/api/scene",
            "PATCH",
            { ...value, id: chapter.id, version },
          );
          savedCallback.current({
            ...chapter,
            ...value,
            version: result.version,
          });
          return result;
        },
        (state, message) => {
          setStatus(state);
          setError(message ?? "");
          if (state === "saved") {
            try {
              localStorage.removeItem(storageKey);
            } catch {
              /* Saving on the server remains authoritative. */
            }
          }
        },
      ),
  );

  function changed(value: Draft) {
    draft.current = value;
    saver.update(value);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ...value, version: saver.version }),
      );
    } catch {
      setStorageError(true);
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Jede Geschichte beginnt mit einem Satz …",
      }),
    ],
    content: chapter.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Kapiteltext",
        role: "textbox",
        "aria-multiline": "true",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      changed({ ...draft.current, content: editor.getJSON() });
      setWords(editor.getText().trim().split(/\s+/u).filter(Boolean).length);
    },
  });

  useImperativeHandle(ref, () => ({ flush: () => saver.flush() }), [saver]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const value = JSON.parse(stored);
        const validated = documentData(value.content);
        if (
          typeof value.title === "string" &&
          value.title.length <= 120 &&
          Number.isInteger(value.version)
        ) {
          setRecovery({
            title: value.title,
            content: validated.content,
            version: value.version,
          });
        }
      }
    } catch {
      setStorageError(true);
    }
    const warn = (event: BeforeUnloadEvent) => {
      if (saver.dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [saver, storageKey]);

  useEffect(() => {
    saver.activate();
    return () => saver.dispose();
  }, [saver]);

  async function suggest() {
    setAiBusy(true);
    setAiError("");
    setSuggestion("");
    try {
      if (!(await saver.flush())) return;
      const result = await requestJson<{ text: string }>("/api/ai", "POST", {
        chapterId: chapter.id,
      });
      setSuggestion(result.text);
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "KI-Anfrage fehlgeschlagen.",
      );
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="chapter-workspace" inert={locked}>
      <div className="editor-meta">
        <span
          className={`save-state ${status}`}
          role="status"
          aria-live="polite"
        >
          {statusLabels[status]}
        </span>
        <span>{words} Wörter</span>
      </div>
      {recovery && (
        <div className="notice">
          <strong>Ein lokaler Entwurf ist vorhanden.</strong>
          <p>
            {recovery.version === saver.version
              ? "Du kannst ihn wiederherstellen oder verwerfen."
              : "Er gehört zu einer älteren Speicherversion. Lade ihn zur manuellen Übernahme herunter."}
          </p>
          <div className="actions">
            {recovery.version === saver.version && (
              <button
                className="button small"
                disabled={!editor}
                onClick={() => {
                  if (!editor) return;
                  setTitle(recovery.title);
                  draft.current = {
                    title: recovery.title,
                    content: recovery.content,
                  };
                  editor.commands.setContent(recovery.content, {
                    emitUpdate: false,
                  });
                  changed(draft.current);
                  setRecovery(null);
                  setWords(
                    editor.getText().trim().split(/\s+/u).filter(Boolean)
                      .length,
                  );
                }}
              >
                Wiederherstellen
              </button>
            )}
            <button
              className="button secondary small"
              onClick={() =>
                download(
                  `${recovery.title}\n\n${documentData(recovery.content).plainText}`,
                  "entwurf.txt",
                )
              }
            >
              Entwurf herunterladen
            </button>
            <button
              className="text-button"
              onClick={() => {
                try {
                  localStorage.removeItem(storageKey);
                } catch {
                  setStorageError(true);
                }
                setRecovery(null);
              }}
            >
              Verwerfen
            </button>
          </div>
        </div>
      )}
      {(status === "error" || status === "conflict") && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <div className="actions">
            {status === "error" && (
              <button
                className="button secondary small"
                onClick={() => {
                  void saver.flush();
                }}
              >
                Erneut speichern
              </button>
            )}
            <button
              className="button secondary small"
              onClick={() =>
                download(
                  `${draft.current.title}\n\n${documentData(draft.current.content).plainText}`,
                  "entwurf.txt",
                )
              }
            >
              Entwurf herunterladen
            </button>
          </div>
        </div>
      )}
      {storageError && (
        <p className="notice">
          Lokale Entwurfssicherung ist in diesem Browser nicht verfügbar. Bitte
          prüfe den Speicherstatus, bevor du die Seite verlässt.
        </p>
      )}
      <article className="manuscript">
        <label className="sr-only" htmlFor="chapter-title">
          Kapiteltitel
        </label>
        <input
          className="chapter-title"
          id="chapter-title"
          value={title}
          maxLength={120}
          disabled={Boolean(recovery)}
          onChange={(event) => {
            setTitle(event.target.value);
            changed({ ...draft.current, title: event.target.value });
          }}
        />
        <div className="toolbar" role="toolbar" aria-label="Text formatieren">
          <button
            title="Fett (Strg+B)"
            disabled={!editor || Boolean(recovery)}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <strong>Fett</strong>
          </button>
          <button
            title="Kursiv (Strg+I)"
            disabled={!editor || Boolean(recovery)}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <em>Kursiv</em>
          </button>
          <button
            disabled={!editor || Boolean(recovery)}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            Überschrift
          </button>
          <button
            disabled={!editor || Boolean(recovery)}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            Liste
          </button>
          <button
            disabled={!editor || Boolean(recovery)}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            Zurück
          </button>
          <button
            disabled={!editor || Boolean(recovery)}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            Vor
          </button>
          <button
            className="save-button"
            disabled={
              status === "saved" || status === "conflict" || Boolean(recovery)
            }
            onClick={() => {
              void saver.flush();
            }}
          >
            Speichern
          </button>
        </div>
        <div inert={Boolean(recovery)}>
          <EditorContent editor={editor} />
        </div>
      </article>
      <aside className="ai-panel card">
        <div>
          <span className="eyebrow">Wenn dir die Worte fehlen</span>
          <h2>Ein neuer Gedanke.</h2>
          <p>
            Die KI liest den Schluss dieses Kapitels und schlägt eine
            Fortsetzung vor. Du entscheidest, was bleibt.
          </p>
        </div>
        {aiEnabled ? (
          <>
            <p className="fine-print">
              Bei einer Anfrage werden Kapiteltitel und bis zu 12.000 Zeichen
              deines Textes an OpenAI gesendet. Maximal 10 Versuche pro Tag
              (UTC).
            </p>
            <button
              className="button secondary"
              disabled={aiBusy || Boolean(recovery) || status === "conflict"}
              onClick={() => {
                void suggest();
              }}
            >
              {aiBusy ? "Idee entsteht …" : "Fortsetzung vorschlagen"}
            </button>
          </>
        ) : (
          <p className="fine-print">
            KI-Unterstützung ist für diese Installation noch nicht aktiviert. Du
            kannst ganz normal weiterschreiben.
          </p>
        )}
        {aiError && (
          <p className="notice error" role="alert">
            {aiError}
          </p>
        )}
        {suggestion && (
          <div className="suggestion">
            <p>{suggestion}</p>
            <div className="actions">
              <button
                className="button small"
                disabled={!editor || Boolean(recovery)}
                onClick={() => {
                  editor
                    ?.chain()
                    .focus()
                    .insertContentAt(
                      editor.state.doc.content.size,
                      suggestion
                        .split(/\n+/)
                        .filter(Boolean)
                        .map((text) => ({
                          type: "paragraph",
                          content: [{ type: "text", text }],
                        })),
                    )
                    .run();
                  setSuggestion("");
                }}
              >
                Am Kapitelende übernehmen
              </button>
              <button className="text-button" onClick={() => setSuggestion("")}>
                Verwerfen
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
});

export default Editor;
