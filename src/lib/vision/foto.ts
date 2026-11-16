// Guarda la foto del usuario SOLO en memoria del navegador (object URL del
// File). Nunca se persiste en sessionStorage/localStorage ni se envía a un
// servidor salvo para la identificación. Sobrevive a la navegación SPA, se
// pierde al recargar (en ese caso se muestra un placeholder).
let fotoUrl: string | null = null;

export function guardarFotoVision(file: File): void {
  if (typeof window === "undefined") return;
  limpiarFotoVision();
  try {
    fotoUrl = URL.createObjectURL(file);
  } catch {
    fotoUrl = null;
  }
}

export function obtenerFotoVision(): string | null {
  return fotoUrl;
}

export function limpiarFotoVision(): void {
  if (fotoUrl) {
    try {
      URL.revokeObjectURL(fotoUrl);
    } catch {
      // revokeObjectURL puede fallar en entornos no navegador.
    }
  }
  fotoUrl = null;
}
