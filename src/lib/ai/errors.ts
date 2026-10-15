export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export class AiTimeoutError extends Error {
  constructor(message = "El asistente tardó demasiado en responder") {
    super(message);
    this.name = "AiTimeoutError";
  }
}

export class AiInvalidResponseError extends Error {
  constructor(message = "El asistente devolvió una respuesta inválida") {
    super(message);
    this.name = "AiInvalidResponseError";
  }
}
