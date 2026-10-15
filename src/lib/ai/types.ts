export interface AiProvider {
  readonly nombre: string;
  readonly esDemo: boolean;
  generarProyecto(
    descripcion: string,
    signal: AbortSignal,
  ): Promise<unknown>;
}
