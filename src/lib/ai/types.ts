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
  /**
   * Interpreta una pregunta de seguimiento sobre una foto ya identificada y
   * devuelve `{ interpretacion, terminos, categoria? }` (crudo; lo valida el
   * servicio). La IA solo interpreta intención y genera términos: NUNCA
   * inventa productos ni precios.
   */
  responderConsultaImagen(
    pregunta: string,
    contexto: ContextoConsultaImagen,
    signal: AbortSignal,
  ): Promise<unknown>;
}

/** Contexto mínimo de la identificación previa para una pregunta de seguimiento. */
export type ContextoConsultaImagen = {
  objeto: string;
  tipo: string;
  caracteristicas: string[];
  terminos: string;
  categoria?: string;
  detalle?: string;
};
