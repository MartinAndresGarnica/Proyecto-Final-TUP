import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Set security HTTP headers
app.use(helmet());

// Cross-site Resource Sharing
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100, // Limitar cada IP a 100 peticiones por `window` (aquí, por 15 minutos)
  standardHeaders: "draft-7", // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Demasiadas peticiones desde esta IP, por favor inténtalo de nuevo después de 15 minutos"
});

app.use(globalLimiter);


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Necesario para Multer

// Servir archivos estáticos desde la carpeta 'uploads'
app.use("/uploads", express.static("uploads"));

app.use("/api", apiRoutes);

app.get("/", (req, res) => res.send("API Mock Server running"));

app.get("/api/test-error-sync", (req, res, next) => {
  throw new Error("Trigger sync error directly");
});
app.get("/api/test-apperror-sync", (req, res, next) => {
  const { AppError } = require("./utils/AppError");
  throw new AppError("Trigger app error directly", 400);
});

// Middleware de manejo global de errores (debe ir al final de la cadena de rutas)
app.use(errorHandler);

export default app;
