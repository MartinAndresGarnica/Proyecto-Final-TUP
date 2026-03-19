import { User } from "../models/user.model";
import { Reservation } from "../models/reservation.model";
import { ReservationSeat } from "../models/reservation-seat.model";
import { Screening } from "../models/screening.model";
import { Seat } from "../models/seat.model";
import { sequelize } from "../config/database";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { Op } from "sequelize";

// Inicializar el cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

export class PaymentService {
  /**
   * Crea una preferencia de pago en Mercado Pago y registra la reserva en la BD
   * @param userId - ID del usuario
   * @param screeningId - ID de la función
   * @param seatIds - Array de IDs de asientos
   * @returns El objeto de preferencia de Mercado Pago con idReservation en external_reference
   */
  async createPreference(
    userId: number,
    screeningId: number,
    seatIds: number[],
  ): Promise<any> {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validar usuario existe
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // 2. Obtener el Screening con el ticketPrice
      const screening = await Screening.findByPk(screeningId);
      if (!screening) {
        throw new Error("Screening not found");
      }

      // 3. Validar que todos los asientos existan
      const seats = await Seat.findAll({
        where: {
          idSeat: seatIds,
        },
      });

      if (seats.length !== seatIds.length) {
        throw new Error("One or more seats not found");
      }

      // 4. Calcular el total (cantidad de asientos x ticketPrice)
      const ticketPrice = screening.ticketPrice as number;
      const total = ticketPrice * seatIds.length;

      // 5. Crear la reserva en status 'Pending'
      const reservation = await Reservation.create(
        {
          userId,
          screeningId,
          status: "Pending",
          total,
          reservationDate: new Date(),
        },
        { transaction },
      );

      // 6. Crear los registros en ReservationSeat
      const reservationSeats = seatIds.map((seatId) => ({
        reservationId: reservation.idReservation,
        seatId,
      }));

      await ReservationSeat.bulkCreate(reservationSeats, { transaction });

      // 7. Crear la preferencia en Mercado Pago
      const preference = new Preference(client);

      const preferenceData = {
        body: {
          items: [
            {
              id: `screening_${screeningId}`,
              title: `Ticket - Función ${screeningId}`,
              quantity: seatIds.length,
              unit_price: ticketPrice,
              currency_id: "ARS",
            },
          ],
          external_reference: reservation.idReservation.toString(),
          notification_url:
            process.env.NOTIFICATION_WEBHOOK_URL ||
            "https://trabajo-final-integrador-backend.onrender.com/api/payments/webhook",

          back_urls: {
            success:
              process.env.MERCADOPAGO_SUCCESS_URL ||
              "https://trabajo-final-integrador-frontend.onrender.com/payment-success",
            pending:
              process.env.MERCADOPAGO_PENDING_URL ||
              "https://trabajo-final-integrador-frontend.onrender.com/payment-pending",
            failure:
              process.env.MERCADOPAGO_FAILURE_URL ||
              "https://trabajo-final-integrador-frontend.onrender.com/payment-failure",
          },
          auto_return: "approved",
        },
      };

      const mpPreference = await preference.create(preferenceData);

      // Confirmar la transacción
      await transaction.commit();

      // Retornar la preferencia con el ID de reserva
      return {
        idReservation: reservation.idReservation,
        preferenceId: mpPreference.id,
        initPoint: mpPreference.init_point,
        sandboxInitPoint: mpPreference.sandbox_init_point,
      };
    } catch (error) {
      // Revertir transacción en caso de error
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Actualiza el estado de una reserva cuando se aprueba el pago
   * @param externalReference - El external_reference de la preferencia (idReservation)
   * @returns La reserva actualizada
   */
  async approveReservation(externalReference: string): Promise<Reservation> {
    const reservationId = parseInt(externalReference, 10);

    const reservation = await Reservation.findByPk(reservationId);

    if (!reservation) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    reservation.status = "Approved";
    await reservation.save();

    return reservation;
  }

  /**
   * Obtiene el estado de una reserva
   * @param reservationId - ID de la reserva
   * @returns La reserva con sus asientos asociados
   */
  async getReservationStatus(
    reservationId: number,
  ): Promise<Reservation | null> {
    return await Reservation.findByPk(reservationId, {
      include: [
        {
          model: User,
        },
        {
          model: Screening,
        },
        {
          model: ReservationSeat,
          include: [Seat],
        },
      ],
    });
  }

  /**
   * Cancela una reserva (la marca como Cancelled)
   * @param reservationId - ID de la reserva
   * @returns La reserva actualizada
   */
  async cancelReservation(reservationId: number): Promise<Reservation> {
    const reservation = await Reservation.findByPk(reservationId);

    if (!reservation) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.status === "Approved") {
      throw new Error("Cannot cancel an approved reservation");
    }

    reservation.status = "Cancelled";
    await reservation.save();

    return reservation;
  }

  /**
   * Cancela automáticamente todas las reservas que han estado en estado
   * "Pending" por más de la cantidad de minutos especificada. Esta lógica
   * se invoca periódicamente desde el arranque del servidor (job simple).
   * @param minutes - número de minutos antes de expirar (por defecto 10)
   * @returns cantidad de filas actualizadas
   */
  async expirePendingReservations(minutes = 1): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 20 * 1000);
    const [updated] = await Reservation.update(
      { status: "Cancelled" },
      {
        where: {
          status: "Pending",
          reservationDate: { [Op.lt]: cutoff },
        },
      },
    );
    return updated;
  }

  /**
   * Elimina reservas en estado "Cancelled" cuyo `updatedAt` sea anterior
   * a `seconds` segundos atrás. Esto asegura que una reserva marcada como
   * Cancelled sea borrada automáticamente tras el tiempo especificado.
   * @param seconds - segundos a esperar antes de eliminar (por defecto 15)
   * @returns cantidad de filas eliminadas
   */
  async deleteOldCancelledReservations(seconds = 15): Promise<number> {
    const cutoff = new Date(Date.now() - seconds * 1000);
    const deleted = await Reservation.destroy({
      where: {
        status: "Cancelled",
        updatedAt: { [Op.lt]: cutoff },
      },
    });
    return deleted;
  }
}

export default new PaymentService();
