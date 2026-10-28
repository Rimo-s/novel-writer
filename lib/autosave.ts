export type SaveState = "saved" | "pending" | "saving" | "error" | "conflict";

// Serializes saves so a slow response can never overwrite a newer draft/version.
export class Autosave<T> {
  private draft: T;
  private revision = 0;
  private savedRevision = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private running?: Promise<boolean>;
  private blocked = false;
  private disposed = false;

  constructor(
    initial: T,
    public version: number,
    private save: (draft: T, version: number) => Promise<{ version: number }>,
    private notify: (state: SaveState, message?: string) => void,
    private delay = 900,
  ) {
    this.draft = initial;
  }

  get dirty() {
    return this.revision !== this.savedRevision;
  }

  update(draft: T) {
    this.draft = draft;
    this.revision++;
    clearTimeout(this.timer);
    if (this.blocked) return;
    this.emit("pending");
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.delay);
  }

  flush(): Promise<boolean> {
    clearTimeout(this.timer);
    if (this.running) return this.running;
    if (this.blocked) return Promise.resolve(false);
    this.running = this.drain().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }

  private async drain() {
    while (this.dirty) {
      const draft = this.draft;
      const revision = this.revision;
      this.emit("saving");
      try {
        const result = await this.save(draft, this.version);
        this.version = result.version;
        this.savedRevision = revision;
      } catch (error) {
        // A conflict needs an explicit reload. Never silently adopt the new version.
        this.blocked = Boolean(
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 409,
        );
        this.emit(
          this.blocked ? "conflict" : "error",
          error instanceof Error ? error.message : "Speichern fehlgeschlagen.",
        );
        return false;
      }
    }
    this.emit("saved");
    return true;
  }

  private emit(state: SaveState, message?: string) {
    if (!this.disposed) this.notify(state, message);
  }
  activate() {
    this.disposed = false;
  }
  dispose() {
    clearTimeout(this.timer);
    this.disposed = true;
  }
}
