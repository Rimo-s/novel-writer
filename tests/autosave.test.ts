import assert from "node:assert/strict";
import { test } from "node:test";
import { Autosave, type SaveState } from "../lib/autosave";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("typing during an in-flight save queues a second save with the returned version", async () => {
  const pending = deferred<{ version: number }>();
  const calls: [string, number][] = [];
  const states: SaveState[] = [];
  const saver = new Autosave(
    "",
    0,
    async (draft, version) => {
      calls.push([draft, version]);
      return calls.length === 1 ? pending.promise : { version: 2 };
    },
    (state) => states.push(state),
    60_000,
  );
  saver.update("Erster Satz");
  const flushed = saver.flush();
  saver.update("Erster Satz. Zweiter Satz.");
  assert.equal(saver.flush(), flushed);
  pending.resolve({ version: 1 });
  assert.equal(await flushed, true);
  assert.deepEqual(calls, [
    ["Erster Satz", 0],
    ["Erster Satz. Zweiter Satz.", 1],
  ]);
  assert.equal(saver.dirty, false);
  assert.equal(states.at(-1), "saved");
  saver.dispose();
});

test("a network failure keeps the draft dirty and retries the original version", async () => {
  let attempts = 0;
  const versions: number[] = [];
  const saver = new Autosave(
    "",
    3,
    async (_draft, version) => {
      versions.push(version);
      if (++attempts === 1) throw new Error("Offline");
      return { version: 4 };
    },
    () => {},
    60_000,
  );
  saver.update("Nicht verlieren");
  assert.equal(await saver.flush(), false);
  assert.equal(saver.dirty, true);
  assert.equal(await saver.flush(), true);
  assert.deepEqual(versions, [3, 3]);
  saver.dispose();
});

test("conflicts block automatic overwrites even if the user keeps typing", async () => {
  let attempts = 0;
  let state: SaveState = "saved";
  const saver = new Autosave(
    "",
    1,
    async () => {
      attempts++;
      throw Object.assign(new Error("Konflikt"), { status: 409 });
    },
    (value) => {
      state = value;
    },
    60_000,
  );
  saver.update("Lokaler Text");
  assert.equal(await saver.flush(), false);
  saver.update("Lokaler Text bleibt");
  assert.equal(await saver.flush(), false);
  assert.equal(state, "conflict");
  assert.equal(attempts, 1);
  assert.equal(saver.dirty, true);
  saver.dispose();
});

test("effect cleanup and reactivation still notify after React Strict Mode replay", async () => {
  const states: SaveState[] = [];
  const saver = new Autosave(
    "",
    0,
    async () => ({ version: 1 }),
    (state) => states.push(state),
    60_000,
  );
  saver.dispose();
  saver.activate();
  saver.update("Text");
  await saver.flush();
  assert.equal(states.at(-1), "saved");
  saver.dispose();
});
