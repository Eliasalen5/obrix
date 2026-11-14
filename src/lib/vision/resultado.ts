import {
  visionResponseSchema,
  type VisionResponse,
} from "@/lib/validators/vision";

export const RESULTADO_VISION_KEY = "obrix:vision:resultado";

function sessionStorageSeguro(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Solo guarda identificación y ofertas; la fotografía nunca se almacena. */
export function guardarResultadoVision(resultado: VisionResponse): void {
  const storage = sessionStorageSeguro();
  if (!storage) return;
  try {
    storage.setItem(RESULTADO_VISION_KEY, JSON.stringify(resultado));
  } catch {
    // sessionStorage puede fallar en modo privado o por cuota.
  }
}

export function obtenerResultadoVision(): VisionResponse | null {
  const storage = sessionStorageSeguro();
  if (!storage) return null;
  try {
    const raw = storage.getItem(RESULTADO_VISION_KEY);
    if (!raw) return null;
    const parsed = visionResponseSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
