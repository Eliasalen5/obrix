import type { ZodError } from "zod";

export function zodDetails(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function jsonError(status: number, error: string, details?: unknown) {
  return Response.json(
    details === undefined ? { error } : { error, details },
    { status },
  );
}

export function prismaErrorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return typeof code === "string" ? code : undefined;
}

export function prismaErrorResponse(error: unknown) {
  switch (prismaErrorCode(error)) {
    case "P2002":
      return jsonError(409, "Ya existe un registro con ese valor único");
    case "P2003":
      return jsonError(400, "Referencia inválida (recurso relacionado inexistente)");
    case "P2014":
      return jsonError(409, "No se puede eliminar: tiene registros relacionados");
    case "P2025":
      return jsonError(404, "Recurso no encontrado");
    default:
      return jsonError(500, "Error interno del servidor");
  }
}
