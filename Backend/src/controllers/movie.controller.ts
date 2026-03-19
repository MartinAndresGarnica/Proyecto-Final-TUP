import { Request, Response } from "express";
import movieService from "../services/movie.services";
import { AppError } from "../utils/AppError";

class MoviesController {
    async list(req: Request, res: Response) {
        const movies = await movieService.list();
        res.status(200).json(movies);
    }

    async getById(req: Request, res: Response) {
        const id = req.params.id;
        if (!id) {
            throw new AppError("ID no proporcionado", 400);
        }
        const movie = await movieService.getById(parseInt(id));
        if (!movie) {
            throw new AppError("Película no encontrada", 404);
        }
        res.status(200).json(movie);
    }

    async create(req: Request, res: Response) {
        const {
            name,
            length,
            description,
            genre,
            categorie,
            director,
            lenguage,
            subtitles,
            poster,
        } = req.body;

        const created = await movieService.create({
            name,
            length,
            description,
            genre,
            categorie,
            director,
            lenguage,
            subtitles,
            poster
        });
        res.status(201).json(created);
    }

    async update(req: Request, res: Response) {
        const id = req.params.id;
        if (!id) {
            throw new AppError("ID no proporcionado", 400);
        }
        const updatedMovie = req.body;
        const movie = await movieService.update(parseInt(id), updatedMovie);
        res.status(200).json(movie);
    }

    async delete(req: Request, res: Response) {
        const id = req.params.id;
        if (!id) {
            throw new AppError("ID no proporcionado", 400);
        }
        await movieService.delete(parseInt(id));
        res.status(200).json({ message: "Movie deleted" });
    }
}

export default new MoviesController();