import { Router, Request, Response } from "express";
import { Movie } from "../models/movie.model";
import { User } from "../models/user.model";
import { Room } from "../models/room.model";
import { Seat } from "../models/seat.model";
import { Screening } from "../models/screening.model";
import { Reservation } from "../models/reservation.model";
import { ReservationSeat } from "../models/reservation-seat.model";
import { Carousel } from "../models/carousel.model";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/seed", async (req: Request, res: Response) => {
  try {
    // Clear data (order matters due to FKs)
    await ReservationSeat.destroy({ where: {}, truncate: false });
    await Reservation.destroy({ where: {}, truncate: false });
    await Screening.destroy({ where: {}, truncate: false });
    await Seat.destroy({ where: {}, truncate: false });
    await Room.destroy({ where: {}, truncate: false });
    await Movie.destroy({ where: {}, truncate: false });
    await User.destroy({ where: {}, truncate: false });
    await Carousel.destroy({ where: {}, truncate: false }); // Clear carousel data

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // 1. Carousel Items
    const initialCarouselItems = [
      {
        title: "Estreno de Verano",
        subtitle: "No te pierdas nuestra nueva película",
        desktopImageUrl: `${baseUrl}/uploads/carousel/seed-banner-1.jpg`,
        link: "/movies/1",
        order: 1,
        isActive: true,
      },
      {
        title: "Oferta Especial",
        subtitle: "2x1 en entradas todos los martes",
        desktopImageUrl: `${baseUrl}/uploads/carousel/seed-banner-2.jpg`,
        link: "/offers/tuesday",
        order: 2,
        isActive: true,
      },
      {
        title: "Noche de Clásicos",
        subtitle: "Revive los clásicos en pantalla grande.",
        desktopImageUrl: `${baseUrl}/uploads/carousel/seed-banner-3.jpg`,
        link: "/cartelera",
        order: 3,
        isActive: false, // Este no estará activo inicialmente
      },
    ];
    await Carousel.bulkCreate(initialCarouselItems);

    // 2. Movies
    const movies = [
      {
        name: "Inception",
        length: 148,
        description: "Sueños dentro de sueños.",
        genre: "Ciencia ficción",
        categorie: "Estreno",
        director: "Christopher Nolan",
        lenguage: "Inglés",
        subtitles: true,
        poster:
          "https://m.media-amazon.com/images/I/714b1KQmskL._AC_UF894,1000_QL80_.jpg",
      },
      {
        name: "Interstellar",
        length: 169,
        description: "Viaje espacial y relatividad.",
        genre: "Ciencia ficción",
        categorie: "Estreno",
        director: "Christopher Nolan",
        lenguage: "Inglés",
        subtitles: true,
        poster:
          "https://m.media-amazon.com/images/I/91obuWzA3XL._AC_UF894,1000_QL80_.jpg",
      },
      {
        name: "The Dark Knight",
        length: 152,
        description:
          "Batman tiene que mantener el equilibrio entre el heroísmo y el vigilantismo para pelear contra un vil criminal conocido como el Guasón, que pretende orillar a Ciudad Gótica a la anarquía.",
        genre: "Acción",
        categorie: "Clásico",
        director: "Christopher Nolan",
        lenguage: "Inglés",
        subtitles: true,
        poster: "https://i.ebayimg.com/images/g/TvwAAOSwmoxfQ2ku/s-l1200.jpg",
      },
      {
        name: "Pulp Fiction",
        length: 154,
        description:
          "Vincent Vega y Jules Winnfield son sicarios con una inclinación por las discusiones filosóficas. En esta película policíaca ultramoderna con múltiples tramas, sus historias se entrelazan con las de su jefe, el gánster Marsellus Wallace, su esposa, la actriz Mia, el boxeador en apuros Butch Coolidge, el mediador Winston Wolfe y una pareja de ladrones nerviosos, Pumpkin y Honey Bunny.",
        genre: "Crimen",
        categorie: "Clásico",
        director: "Quentin Tarantino",
        lenguage: "Inglés",
        subtitles: true,
        poster:
          "https://m.media-amazon.com/images/I/718LfFW+tIL._AC_UF894,1000_QL80_.jpg",
      },
      {
        name: "The Matrix",
        length: 136,
        description: "Realidad simulada y revolución.",
        genre: "Ciencia ficción",
        categorie: "Clásico",
        director: "The Wachowskis",
        lenguage: "Inglés",
        subtitles: true,
        poster: "https://static.posters.cz/image/1300/104636.jpg",
      },
      {
        name: "Forrest Gump",
        length: 142,
        description: "Vida extraordinaria de un hombre común.",
        genre: "Drama",
        categorie: "Clásico",
        director: "Robert Zemeckis",
        lenguage: "Inglés",
        subtitles: true,
        poster:
          "https://via.placeholder.com/300x450/1a1a1a/87CEEB?text=Forrest+Gump",
      },
    ];
    const createdMovies = await Movie.bulkCreate(movies);

    // 3. Rooms
    const rooms = [
      {
        name: "Sala 1",
        capacity: 40,
        type: "2D",
        rows: 5,
        cols: 8,
        isActive: true,
      },
      {
        name: "Sala 2",
        capacity: 60,
        type: "3D",
        rows: 6,
        cols: 10,
        isActive: true,
      },
    ];
    const createdRooms = await Room.bulkCreate(rooms);

    // 4. Seats
    const seatsData = [];
    for (const room of createdRooms) {
      for (let r = 1; r <= room.rows; r++) {
        for (let c = 1; c <= room.cols; c++) {
          seatsData.push({
            row: r,
            column: c,
            roomId: room.idRoom,
            type: "Standard",
          });
        }
      }
    }
    await Seat.bulkCreate(seatsData);

    // 5. Users
    const users = [
      {
        name: "Admin",
        email: "admin@example.com",
        password: await bcrypt.hash("admin", 10),
        role: true,
      },
      {
        name: "Client",
        email: "client@example.com",
        password: await bcrypt.hash("client", 10),
        role: false,
      },
    ];
    await User.bulkCreate(users);

    // 6. Screenings
    if (createdMovies.length > 0 && createdRooms.length > 0) {
      const now = new Date();
      const screenings = [
        {
          movieId: createdMovies[0]!.idMovie,
          roomId: createdRooms[0]!.idRoom,
          date: now,
          start: new Date(now.getTime() + 3600000), // +1 hour
          end: new Date(now.getTime() + 7200000), // +2 hours
          ticketPrice: 350,
        },
        {
          movieId: createdMovies[1]!.idMovie,
          roomId: createdRooms[1]!.idRoom,
          date: now,
          start: new Date(now.getTime() + 10800000),
          end: new Date(now.getTime() + 14400000),
          ticketPrice: 400,
        },
      ];
      await Screening.bulkCreate(screenings);
    }

    return res.status(200).json({ message: "Seed applied successfully" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Seed failed", error: error.message });
  }
});

export default router;
