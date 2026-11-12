import {
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
} from "@/lib/validators/asistente";

export const PROYECTO_PENDIENTE_KEY = "obrix:proyecto:pendiente";

export type ProyectoPendiente = {
  descripcion: string;
  autoEstimar: boolean;
};

function obtenerSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function guardarProyectoPendiente(
  descripcion: string,
  autoEstimar = true,
): void {
  const texto = descripcion.trim();
  if (texto.length < DESCRIPCION_MIN || texto.length > DESCRIPCION_MAX) return;

  const storage = obtenerSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(
      PROYECTO_PENDIENTE_KEY,
      JSON.stringify({ descripcion: texto, autoEstimar }),
    );
  } catch {
    // sessionStorage puede fallar en modo privado o por cuota.
  }
}

export function consumirProyectoPendiente(): ProyectoPendiente | null {
  const storage = obtenerSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(PROYECTO_PENDIENTE_KEY);
    if (!raw) return null;
    storage.removeItem(PROYECTO_PENDIENTE_KEY);

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const { descripcion, autoEstimar } = parsed as {
      descripcion?: unknown;
      autoEstimar?: unknown;
    };
    if (typeof descripcion !== "string") return null;

    const texto = descripcion.trim();
    if (texto.length < DESCRIPCION_MIN || texto.length > DESCRIPCION_MAX) {
      return null;
    }

    return { descripcion: texto, autoEstimar: autoEstimar !== false };
  } catch {
    return null;
  }
}
