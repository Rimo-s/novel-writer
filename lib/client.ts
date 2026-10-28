export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requestJson<T>(
  path: string,
  method: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(35_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new RequestError(
      response.status,
      data.error || "Die Anfrage ist fehlgeschlagen.",
    );
  return data as T;
}
