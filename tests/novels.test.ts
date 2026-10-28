import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { novelStore } from "../lib/novels";
import { AppError } from "../lib/errors";
import { exportText } from "../lib/document";

let db: PGlite;
let server: PGLiteSocketServer;
let prisma: PrismaClient;
let store: ReturnType<typeof novelStore>;
const document = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
const status = (code: number) => (error: unknown) =>
  error instanceof AppError && error.status === code;

before(async () => {
  db = await PGlite.create();
  for (const migration of [
    "20261028000000_test_baseline",
    "20261028010000_initial",
  ]) {
    await db.exec(
      await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"),
    );
  }
  server = new PGLiteSocketServer({ db, port: 55432, host: "127.0.0.1" });
  await server.start();
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://postgres:postgres@${server.getServerConn()}/postgres?connection_limit=1&sslmode=disable`,
      },
    },
  });
  store = novelStore(prisma);
});
after(async () => {
  await prisma?.$disconnect();
  await server?.stop();
  await db?.close();
});

test("creates a novel with its first chapter and reads it back through Prisma", async () => {
  const novel = await store.create("author-a", {
    title: "  Mein Roman  ",
    description: "Eine Idee",
    ownerId: "spoofed",
  });
  const loaded = await store.get("author-a", novel.id);
  assert.equal(loaded.ownerId, "author-a");
  assert.equal(loaded.title, "Mein Roman");
  assert.equal(loaded.chapters.length, 1);
  assert.equal(loaded.chapters[0].version, 0);
  assert.equal((await store.list("spoofed")).length, 0);
});

test("another account cannot read, add chapters, save, or access export data", async () => {
  const novel = await store.create("owner", { title: "Private Geschichte" });
  const own = await store.get("owner", novel.id);
  assert.deepEqual(await store.list("outsider"), []);
  await assert.rejects(store.get("outsider", novel.id), status(404));
  await assert.rejects(
    store.addChapter("outsider", { novelId: novel.id, title: "Angriff" }),
    status(404),
  );
  await assert.rejects(
    store.saveChapter("outsider", {
      id: own.chapters[0].id,
      title: "Geändert",
      version: 0,
      content: document("Nicht erlaubt"),
    }),
    status(404),
  );
  assert.equal(
    (await store.get("owner", novel.id)).chapters[0].title,
    "Kapitel 1",
  );
});

test("persists formatted text, rejects stale tabs, and preserves the winning draft", async () => {
  const novel = await store.create("writer", { title: "Die Tür" });
  const chapter = (await store.get("writer", novel.id)).chapters[0];
  const content = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Über den Dächern.",
            marks: [{ type: "bold" }],
          },
        ],
      },
    ],
  };
  const save = await store.saveChapter("writer", {
    id: chapter.id,
    title: "Anfang",
    version: 0,
    content,
  });
  assert.equal(save.version, 1);
  const results = await Promise.allSettled([
    store.saveChapter("writer", {
      id: chapter.id,
      title: "Tab A",
      version: 1,
      content: document("Gewinner A"),
    }),
    store.saveChapter("writer", {
      id: chapter.id,
      title: "Tab B",
      version: 1,
      content: document("Gewinner B"),
    }),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const rejected = results.find(
    (result) => result.status === "rejected",
  ) as PromiseRejectedResult;
  assert.equal(rejected.reason.status, 409);
  const loaded = await store.get("writer", novel.id);
  assert.equal(loaded.chapters[0].version, 2);
  assert.match(loaded.chapters[0].plainText, /^Gewinner [AB]$/);
  const exported = exportText(loaded);
  assert.match(exported, /Die Tür/);
  assert.match(exported, /Gewinner [AB]/);
});

test("invalid documents and versions do not alter saved chapters", async () => {
  const novel = await store.create("validation", { title: "Geschichte" });
  const chapter = (await store.get("validation", novel.id)).chapters[0];
  for (const input of [
    { content: { type: "script" }, version: 0 },
    { content: document("Text"), version: -1 },
    { content: document("Text"), version: 0.5 },
  ]) {
    await assert.rejects(
      store.saveChapter("validation", {
        id: chapter.id,
        title: "Kapitel",
        ...input,
      }),
      status(400),
    );
  }
  const loaded = await store.get("validation", novel.id);
  assert.equal(loaded.chapters[0].version, 0);
  assert.equal(loaded.chapters[0].plainText, "");
});

test("AI budget is persistent, separated by owner and UTC date, and caps attempts at ten", async () => {
  for (let i = 0; i < 10; i++)
    await store.consumeAiAttempt("ai-owner", "2026-10-28");
  await assert.rejects(
    store.consumeAiAttempt("ai-owner", "2026-10-28"),
    status(429),
  );
  await store.consumeAiAttempt("another-owner", "2026-10-28");
  await store.consumeAiAttempt("ai-owner", "2026-10-29");
  assert.equal(
    (
      await prisma.aiUsage.findUniqueOrThrow({
        where: { ownerId_day: { ownerId: "ai-owner", day: "2026-10-28" } },
      })
    ).count,
    10,
  );
});
