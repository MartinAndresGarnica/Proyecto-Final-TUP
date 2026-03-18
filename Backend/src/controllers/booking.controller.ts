import { Request, Response } from "express";
import bookingService from "../services/booking.services";
import { AppError } from "../utils/AppError";

export const getBookings = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.idUser;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const reservations = await bookingService.listReservationsByUser(userId);
  return res.status(200).json(reservations);
};

export const getAllBookingsAdmin = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }
  const reservations = await bookingService.listAllReservations();
  return res.status(200).json(reservations);
};

export const createBooking = async (req: Request, res: Response) => {
  const { screening, seats, userId: requestedUserId } = req.body;
  const user = (req as any).user;

  if (!screening || !seats) {
    throw new AppError("Missing screening or seats", 400);
  }

  let userId: number | undefined = user?.idUser;
  const isAdmin =
    user &&
    (String(user.role).toLowerCase() === "admin" || user.role === true);
  
  if (isAdmin && requestedUserId) {
    userId = requestedUserId;
  }

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const screeningId = screening.idScreening;

  try {
    const created = await bookingService.createReservation(
      screeningId,
      userId,
      seats,
    );
    return res.status(201).json(created);
  } catch (err: any) {
    if (err.message && err.message.includes("occupied")) {
      throw new AppError(err.message, 409);
    }
    throw err;
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { seats } = req.body;

  if (!seats || !Array.isArray(seats)) {
    throw new AppError("Invalid seats data", 400);
  }

  try {
    const updated = await bookingService.updateReservation(Number(id), seats);
    return res.json(updated);
  } catch (err: any) {
    if (err.message && err.message.includes("occupied")) {
      throw new AppError(err.message, 409);
    }
    throw err;
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await bookingService.deleteReservation(Number(id));
    return res.status(204).send();
  } catch (err: any) {
    if (err.message === "Reservation not found") {
      throw new AppError("Reservation not found", 404);
    }
    throw err;
  }
};