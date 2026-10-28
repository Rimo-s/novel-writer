import { AppError } from "./errors";

export async function readBody(
  request: Request,
): Promise<Record<string, unknown>> {
  // Cookie-authenticated writes must originate from the current application.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new AppError(403, "Diese Anfrage stammt nicht von der Anwendung.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError(415, "JSON erwartet.");
  if (Number(request.headers.get("content-length")) > 300_000)
    throw new AppError(413, "Die Anfrage ist zu groß.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "Leere Anfrage.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 300_000) {
        await reader.cancel();
        throw new AppError(413, "Die Anfrage ist zu groß.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body;
  } catch {
    throw new AppError(400, "Ungültiges JSON.");
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  // Do not return database connection strings, provider errors, or manuscript text.
  console.error(
    "Novel Writer: request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    {
      error:
        "Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
    },
    { status: 500 },
  );
}
