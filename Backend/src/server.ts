import app from "./app";
import { connectDB } from "./config/database";
// se importa estáticamente el servicio de pagos para evitar problemas de resolución
// de módulos y también facilitar el tipado de las promesas más abajo.
import paymentService from "./services/payment.service";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  // job simple para expirar reservas en estado "Pending".
  // La importación ya está resuelta más arriba, así que solo usamos el servicio.
  const runExpiration = () => {
    paymentService
      .expirePendingReservations()
      .then((count: number) => {
        if (count > 0) {
          console.log(`Expired ${count} pending reservations`);
        }
      })
      .catch((err: any) => console.error("Expiration job failed:", err));
  };

  runExpiration();
  setInterval(runExpiration, 5 * 1000);

  // job para eliminar reservas en estado "Cancelled" pasados 15 segundos
  const runDeletion = () => {
    paymentService
      .deleteOldCancelledReservations(15)
      .then((deleted: number) => {
        if (deleted > 0) {
          console.log(`Deleted ${deleted} cancelled reservations`);
        }
      })
      .catch((err: any) => console.error("Deletion job failed:", err));
  };

  runDeletion();
  // chequeo frecuente para borrar lo más rápido posible (cada 20s)
  setInterval(runDeletion, 20 * 1000);
});
