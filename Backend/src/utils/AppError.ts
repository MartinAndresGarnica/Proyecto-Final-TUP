/**
 * Clase base para manejar los errores operacionales predecibles de la aplicación
 * (ej. validaciones fallidas, recursos no encontrados, errores de autenticación).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Captura el stack trace excluyendo el constructor de AppError
    Error.captureStackTrace(this, this.constructor);
  }
}
