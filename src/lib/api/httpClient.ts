export type ApiErrorDetail = { path: string; message: string };

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; details?: ApiErrorDetail[] };

export type HttpConfig = {
  /** Prefijo para rutas relativas. Web: "" (mismo origen). Mobile: URL absoluta del API. */
  baseUrl: string;
  /** Headers por defecto en cada request (p. ej. `Authorization: Bearer`). */
  headers: Record<string, string>;
};

let httpConfig: HttpConfig = { baseUrl: "", headers: {} };

/**
 * Configura el transporte HTTP global. La web no la usa (deja baseUrl="" y usa
 * rutas relativas al mismo origen); la app mobile la usa al arrancar para apuntar
 * a la URL absoluta del API y adjuntar el token Bearer.
 */
export function configureHttp(config: Partial<HttpConfig>): void {
  httpConfig = {
    baseUrl: config.baseUrl ?? httpConfig.baseUrl,
    headers: config.headers ?? httpConfig.headers,
  };
}

/** Restaura el transporte por defecto (rutas relativas, sin headers). Para tests. */
export function resetHttp(): void {
  httpConfig = { baseUrl: "", headers: {} };
}

function resolveUrl(url: string): string {
  if (!httpConfig.baseUrl) return url;
  if (/^https?:\/\//.test(url)) return url;
  return `${httpConfig.baseUrl.replace(/\/$/, "")}${url}`;
}

export async function request<T>(
  url: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const hasBody = init.body !== undefined && init.body !== null;

  const mergedHeaders: Record<string, string> = {
    ...httpConfig.headers,
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  if (hasBody) mergedHeaders["content-type"] = "application/json";
  const hasHeaders = Object.keys(mergedHeaders).length > 0;

  let res: Response;
  try {
    res = await fetch(resolveUrl(url), {
      ...init,
      headers: hasHeaders ? mergedHeaders : undefined,
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
  let parseado = false;
  try {
    body = await res.json();
    parseado = true;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = body as { error?: string; details?: ApiErrorDetail[] } | null;
    // Si el server devolvió HTML/texto (p.ej. 502 de un proxy), no perdemos
    // el status: mostramos un mensaje acorde en vez de "Error inesperado".
    const fallback = parseado ? "Error inesperado" : `Error del servidor (${res.status})`;
    return {
      ok: false,
      status: res.status,
      error: err?.error ?? fallback,
      details: err?.details,
    };
  }

  // 2xx pero sin JSON parseable (HTML/texto/vacío): no es un éxito válido,
  // devolver `data: undefined` haría crashear a quien lea el resultado.
  if (!parseado) {
    return {
      ok: false,
      status: res.status,
      error: `Respuesta inválida del servidor (${res.status})`,
    };
  }

  // Respuestas correctas sin wrapper { data }: devolvemos el body tal cual
  // para no romper endpoints que aún retornan el recurso directo.
  const conWrapper = body as { data?: T };
  return { ok: true, data: (conWrapper?.data ?? (body as T)) };
}
