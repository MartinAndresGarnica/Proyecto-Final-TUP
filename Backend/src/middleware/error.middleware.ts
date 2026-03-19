import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

/**
 * Middleware centralizado para el manejo de excepciones.
 * Captura todos los errores (síncronos o asíncronos en Express v5) lanzados por los controladores.
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("🚀 ERROR HANDLER TRIGGERED:", err.message);
  let statusCode = 500;
  let status = "error";
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
  } else {
    // Si es un error desconocido (Error de sistema, JS, BD) logeamos su traza
    console.error("💥 ERROR INESPERADO:", err);
    // En desarrollo enviamos el mensaje real, en producción enviamos un genérico
    if (process.env.NODE_ENV === "development") {
      message = err.message || "Internal Server Error";
    }
  }

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
