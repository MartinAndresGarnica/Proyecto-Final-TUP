import { UserService } from "../services/user.services";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/AppError";

export class UserController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
  }

  async getUsers(req: Request, res: Response): Promise<Response> {
    const users = await this.userService.getAllUsers();
    return res.status(200).json(users);
  }

  async createUser(req: Request, res: Response): Promise<Response> {
    const { name, email, password, role = false } = req.body;
    if (!password) {
      throw new AppError("Password is required", 400);
    }
    const createdUser = await this.userService.createUser({
      name,
      email,
      password,
      role,
    });
    return res.status(201).json(createdUser); // Return created user
  }

  async updateUser(req: Request, res: Response): Promise<Response> {
    const idUser = Number(req.params.id);
    if (isNaN(idUser)) {
      throw new AppError("Invalid user ID", 400);
    }
    const { name, email, password, role } = req.body;
    const updatedUser = await this.userService.updateUser(idUser, {
      name,
      email,
      password,
      role,
    });
    if (updatedUser) {
      return res.status(200).json(updatedUser);
    } else {
      throw new AppError("User not found", 404);
    }
  }

  async deleteUser(req: Request, res: Response): Promise<Response> {
    const idUser = Number(req.params.id);
    if (isNaN(idUser)) {
      throw new AppError("Invalid user ID", 400);
    }
    const success = await this.userService.deleteUser(idUser);
    if (success) {
      return res.status(200).json({ message: "User deleted successfully" });
    } else {
      throw new AppError("User not found", 404);
    }
  }

  // profile operations for authenticated user
  async getProfile(req: any, res: Response): Promise<Response> {
    const idUser = req.user?.idUser;
    if (!idUser) throw new AppError("Not authenticated", 401);

    const user = await this.userService.getUserById(idUser);
    if (!user) throw new AppError("User not found", 404);
    const { password, ...data } = user.toJSON() as any;
    return res.status(200).json(data);
  }

  async updateProfile(req: any, res: Response): Promise<Response> {
    const idUser = req.user?.idUser;
    if (!idUser) throw new AppError("Not authenticated", 401);

    const { name, email, password, currentPassword } = req.body;
    const user = await this.userService.getUserById(idUser);
    if (!user) throw new AppError("User not found", 404);

    // if changing password, verify current password
    if (password) {
      if (!currentPassword) {
        throw new AppError("Current password required to change password", 400);
      }
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) {
        throw new AppError("Current password is incorrect", 401);
      }
      user.password = await bcrypt.hash(password, 10);
    }

    const updated = await this.userService.updateUser(idUser, {
      name,
      email,
      password: user.password,
    });
    if (!updated)
      throw new AppError("User not found after update", 404);
      
    const { password: pwd, ...data } = updated.toJSON() as any;
    return res.status(200).json(data);
  }
}
