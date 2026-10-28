import assert from "node:assert/strict";
import { test } from "node:test";
import { readBody, errorResponse } from "../lib/http";
import { documentData, exportText } from "../lib/document";
import { AppError } from "../lib/errors";

const request = (body: string, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/scene", {
    method: "PATCH",
    headers: { origin, "content-type": "application/json" },
    body,
  });
const status = (code: number) => (error: unknown) =>
  error instanceof AppError && error.status === code;

test("mutating requests reject cross-origin writes, malformed JSON and arrays", async () => {
  await assert.rejects(
    readBody(request("{}", "https://attacker.invalid")),
    status(403),
  );
  await assert.rejects(readBody(request("invalid")), status(400));
  await assert.rejects(readBody(request("[]")), status(400));
  assert.deepEqual(await readBody(request('{"title":"Übung"}')), {
    title: "Übung",
  });
});

test("request size limit counts bytes even without content-length", async () => {
  await assert.rejects(
    readBody(request(JSON.stringify({ text: "ä".repeat(160_000) }))),
    status(413),
  );
});

test("documents validate structure and reject unsafe links and oversized content", () => {
  for (const value of [
    { type: "script" },
    { type: "paragraph" },
    { type: "doc", content: [{ type: "text", text: "wrong level" }] },
    {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "link",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    },
  ]) {
    assert.throws(() => documentData(value), status(400));
  }
  assert.throws(
    () =>
      documentData({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "a".repeat(250_000) }],
          },
        ],
      }),
    status(400),
  );
});

test("Unicode and paragraph boundaries survive plaintext export", () => {
  const content = {
    type: "doc",
    content: ["Eine Tür öffnet sich.", "ڕۆژ — ☀"].map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
  const data = documentData(content);
  assert.equal(data.plainText, "Eine Tür öffnet sich.\nڕۆژ — ☀");
  assert.equal(
    exportText({
      title: "Überall",
      description: "",
      chapters: [{ title: "Kapitel 1", plainText: data.plainText }],
    }),
    "Überall\n\nKapitel 1\n\nEine Tür öffnet sich.\nڕۆژ — ☀",
  );
});

test("expected API errors expose only their deliberate public message", async () => {
  const response = errorResponse(new AppError(409, "Konflikt"));
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "Konflikt" });
});
