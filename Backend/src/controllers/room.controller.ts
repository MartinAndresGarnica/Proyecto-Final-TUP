import { Request, Response } from "express";
import { RoomService } from "../services/room.services";
import { Room } from "../models/room.model";
import { AppError } from "../utils/AppError";

export class RoomController {
  private roomService: RoomService;
  constructor() {
    this.roomService = new RoomService();
  }

  async getAllRooms(req: Request, res: Response): Promise<Response> {
    const rooms = await this.roomService.getAllRooms();
    return res.status(200).json(rooms);
  }

  async getRoomById(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    const room = await this.roomService.getRoomById(id);
    if (room) {
      return res.status(200).json(room);
    } else {
      throw new AppError("Room not found", 404);
    }
  }

  async getRoomSeats(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    const seats = await this.roomService.getRoomSeats(id);
    return res.status(200).json(seats);
  }

  async createRoom(req: Request, res: Response): Promise<Response> {
    const { name, type, rows, cols, seats } = req.body;
    const room = await this.roomService.createRoom({
      name,
      type,
      rows: Number(rows),
      cols: Number(cols),
      seats,
    });
    return res.status(201).json(room);
  }

  async updateRoom(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    const { name, type, rows, cols, seats } = req.body;

    const payload: Partial<Room> & { seats?: any } = {};
    if (name) payload.name = name;
    if (type) payload.type = type;
    if (seats) payload.seats = seats;
    if (rows) payload.rows = Number(rows);
    if (cols) payload.cols = Number(cols);

    const result = await this.roomService.updateRoom(id, payload);

    if (result) {
      return res.status(200).json(result);
    } else {
      throw new AppError("Room not found", 404);
    }
  }

  async deleteRoom(req: Request, res: Response): Promise<Response> {
    const rawId = req.params?.id;
    if (!rawId) throw new AppError("Missing id param", 400);
    const id = Number(rawId);
    if (Number.isNaN(id)) throw new AppError("Invalid id param", 400);

    try {
      const success = await this.roomService.deleteRoom(id);
      if (success) {
        return res.status(200).json({ message: "Room deleted successfully" });
      } else {
        throw new AppError("Room not found", 404);
      }
    } catch (error: any) {
      if (
        error.message &&
        error.message.toLowerCase().includes("screenings")
      ) {
        throw new AppError(error.message, 409);
      }
      throw error;
    }
  }
}