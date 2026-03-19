import { Router } from "express";
import rateLimit from "express-rate-limit";
import AuthController from "../controllers/auth.controller";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5, // Límite de 5 peticiones fallidas previas a bloqueo por IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Demasiados intentos de inicio de sesión o registro desde esta IP, por favor inténtalo de nuevo después de 15 minutos"
});

router.post("/auth/register", authLimiter, AuthController.register.bind(AuthController));
router.post("/auth/login", authLimiter, AuthController.login.bind(AuthController));

// password recovery endpoints
router.post(
  "/auth/forgot-password",
  AuthController.forgotPassword.bind(AuthController),
);
router.post(
  "/auth/reset-password",
  AuthController.resetPassword.bind(AuthController),
);

export default router;
