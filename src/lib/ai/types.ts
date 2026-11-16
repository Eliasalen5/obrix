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
  /**
   * Devuelve la identificación visual cruda; el servicio la valida.
   * `opts.detalle` es la tarea que el usuario quiere hacer con lo que muestra
   * la foto; ayuda a desambiguar la identificación.
   */
  identificarImagen(
    imagenBase64: string,
    mime: string,
    signal: AbortSignal,
    opts?: { detalle?: string },
  ): Promise<unknown>;
}
