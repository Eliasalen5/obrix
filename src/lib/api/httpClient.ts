export type ApiErrorDetail = { path: string; message: string };

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; details?: ApiErrorDetail[] };

export async function request<T>(
  url: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const hasBody = init.body !== undefined && init.body !== null;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: hasBody
        ? { "content-type": "application/json", ...(init.headers ?? {}) }
        : init.headers,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "No se pudo conectar con el servidor",
    };
  }

  if (res.status === 204) return { ok: true, data: undefined as T };

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = body as { error?: string; details?: ApiErrorDetail[] } | null;
    return {
      ok: false,
      status: res.status,
      error: err?.error ?? "Error inesperado",
      details: err?.details,
    };
  }

  return { ok: true, data: (body as { data: T }).data };
}
