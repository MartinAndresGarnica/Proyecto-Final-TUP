import { z } from "zod";
import * as dotenv from "dotenv";

// Cargar variables de entorno antes de validarlas
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(10, "JWT_SECRET or secure token is required"),
  DB_HOST: z.string().default("localhost"),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_PORT: z.string().default("5432"),
  // Otras variables opcionales
  LOG_LEVEL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Error en la validación de variables de entorno:");
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
