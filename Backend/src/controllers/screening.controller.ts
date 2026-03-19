import { Request, Response } from "express";
import {
  ScreeningService,
  ScreeningHasReservationsError,
} from "../services/screening.services";
import { AppError } from "../utils/AppError";

export class ScreeningController {
  private screeningService: ScreeningService;
  constructor() {
    this.screeningService = new ScreeningService();
  }

  async getAllScreenings(req: Request, res: Response): Promise<Response> {
    const { movieId } = req.query;
    const numMovieId = movieId ? Number(movieId) : undefined;
    const screenings = await this.screeningService.getScreenings(numMovieId);
    return res.status(200).json(screenings);
  }

  async getScreeningById(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    const screening = await this.screeningService.getScreeningById(id);
    if (screening) {
      return res.status(200).json(screening);
    } else {
      throw new AppError("Screening not found", 404);
    }
  }

  async createScreening(req: Request, res: Response): Promise<Response> {
    try {
      const { idScreening, date, start, end, ticketPrice, movieId, roomId } =
        req.body;
      const createdScreening = await this.screeningService.createScreening({
        date,
        start,
        end,
        ticketPrice,
        movieId,
        roomId,
      });
      return res.status(201).json(createdScreening);
    } catch (error: any) {
      if (error.name === "ScreeningValidationError") {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  async getSeatsForScreening(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    const occupied = await this.screeningService.getOccupiedSeats(id);
    return res.status(200).json({ occupied });
  }

  async updateScreening(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    try {
      const { date, start, end, ticketPrice, movieId, roomId } = req.body;
      const result = await this.screeningService.updateScreening(id, {
        date,
        start,
        end,
        ticketPrice,
        movieId,
        roomId,
      });
      if (result) {
        return res.status(200).json(result);
      } else {
        throw new AppError("Screening not found", 404);
      }
    } catch (error: any) {
      if (error.name === "ScreeningValidationError") {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  async deleteScreening(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    try {
      const success = await this.screeningService.deleteScreening(id);
      if (success) {
        return res
          .status(200)
          .json({ message: "Screening deleted successfully" });
      } else {
        throw new AppError("Screening not found", 404);
      }
    } catch (error: any) {
      if (error instanceof ScreeningHasReservationsError) {
        throw new AppError(error.message, 409); // 409 Conflict
      }
      throw error;
    }
  }
}