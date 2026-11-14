export interface AiProvider {
  readonly nombre: string;
  readonly esDemo: boolean;
  generarProyecto(
    descripcion: string,
    signal: AbortSignal,
  ): Promise<unknown>;
  /**
   * Interpreta una búsqueda en lenguaje natural y devuelve un objeto
   * `{ terminos: string, categoria?: string }` (sin validar; lo valida el servicio).
   */
  interpretarBusqueda(
    consulta: string,
    signal: AbortSignal,
  ): Promise<unknown>;
}
