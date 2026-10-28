"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { requestJson } from "@/lib/client";

export default function NewNovel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const novel = await requestJson<{ id: string }>("/api/novels", "POST", {
        title: fields.get("title"),
        description: fields.get("description"),
      });
      router.push(`/novel/${novel.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Projekt konnte nicht erstellt werden.",
      );
      setBusy(false);
    }
  }

  return (
    <form id="new-project" className="card new-novel" onSubmit={submit}>
      <span className="form-icon">
        <Icon name="plus" />
      </span>
      <span className="eyebrow">Eine neue Idee</span>
      <h2>Deine nächste Geschichte.</h2>
      <label htmlFor="novel-title">Titel</label>
      <input
        id="novel-title"
        name="title"
        placeholder="Wie heißt deine Geschichte?"
        maxLength={120}
        required
        disabled={busy}
      />
      <label htmlFor="novel-description">
        Kurzbeschreibung <span className="muted">(optional)</span>
      </label>
      <textarea
        id="novel-description"
        name="description"
        placeholder="Eine Figur, eine Welt, ein erster Gedanke …"
        maxLength={1000}
        rows={3}
        disabled={busy}
      />
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        <Icon name={busy ? "loader" : "plus"} className={busy ? "spin" : ""} />
        {busy ? "Wird angelegt …" : "Schreibprojekt anlegen"}
      </button>
    </form>
  );
}
