import { Router } from "express";
import movieRoutes from "./movie.routes";
import authRoutes from "./auth.routes";
import screeningRoutes from "./screening.routes";
import userRoutes from "./user.routes";
import bookingRoutes from "./booking.routes";
import seedRoutes from "./seed.routes";
import roomRoutes from "./room.routes";
import carouselRoutes from "./carousel.routes";
import paymentRoutes from "./payment.routes";

const apiRoutes = Router();

apiRoutes.use(movieRoutes);
apiRoutes.use(authRoutes);
apiRoutes.use(screeningRoutes);
apiRoutes.use(userRoutes);
apiRoutes.use(bookingRoutes);
apiRoutes.use(seedRoutes);
apiRoutes.use(roomRoutes);
apiRoutes.use(carouselRoutes);
apiRoutes.use(paymentRoutes);

export default apiRoutes;
