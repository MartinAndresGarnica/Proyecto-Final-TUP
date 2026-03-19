import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { getMovies, getScreenings, getBanners } from "../api/mockClient";
import { useNavigate } from "react-router-dom";
import HeroCarousel from "./HeroCarousel";
import type { IHeroCarouselItem } from "./HeroCarousel";

interface Movie {
  idMovie: number;
  name: string;
  description: string;
  length: number;
  genre: string;
  categorie: string;
  director: string;
  lenguage: string;
  subtitles: boolean;
  poster: string;
}

interface Screening {
  idScreening: number;
  date: string;
  start: string;
  end: string;
  ticketPrice: number;
  movieId: number;
}

interface ICarouselBanner {
  id: number;
  title: string;
  subtitle: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  link: string;
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Función auxiliar para formatear los días (ej: "Hoy", "Mañana", "Lunes 15/03")
const getDayLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === tomorrow.toDateString()) return "Mañana";

  const formatter = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";
  const day = parts.find((p) => p.type === "day")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";

  // Retorna el día con la primera letra mayúscula (ej: "Miércoles 12/04")
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day}/${month}`;
};

export const Cartelera: React.FC<{
  onSelectScreening: (screening: Screening, movie: Movie) => void;
}> = ({ onSelectScreening }) => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [allScreenings, setAllScreenings] = useState<Screening[]>([]);
  const [filter, setFilter] = useState("");
  const [carouselBanners, setCarouselBanners] = useState<ICarouselBanner[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const moviesData = await getMovies();
      const screeningsData = await getScreenings();
      setMovies(moviesData || []);
      setAllScreenings(screeningsData || []);

      const bannersData = await getBanners();
      setCarouselBanners(bannersData || []);
    };
    fetchData();
  }, []);

  const moviesWithScreenings = movies.filter((m) =>
    allScreenings.some((s) => s.movieId === m.idMovie),
  );

  const filtered = moviesWithScreenings.filter(
    (m) => !filter || m.genre.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.idMovie}`);
  };

  const activeCarouselItems: IHeroCarouselItem[] = carouselBanners
    .filter((banner) => banner.isActive)
    .sort((a, b) => a.order - b.order)
    .map((banner) => ({
      id: banner.id.toString(),
      title: banner.title,
      subtitle: banner.subtitle || "",
      backgroundImage: banner.desktopImageUrl,
      trailerLink: banner.link || "#",
      infoLink: banner.link || "#",
    }));

  return (
    <>
      {<HeroCarousel items={activeCarouselItems} />}

      <Container className="py-5">
        <h2 className="text-start mb-4 fw-bold">PELÍCULAS EN CARTELERA</h2>
        <Row className="text-start mb-4 justify-content-start">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-bold">Filtrar por género</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingresa un género..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="justify-content-center">
          {filtered.map((m) => {
            const movieScreenings = allScreenings.filter(
              (s) => s.movieId === m.idMovie,
            );

            return (
              <Col
                md={3}
                sm={6}
                xs={12}
                key={m.idMovie}
                className="mb-4 d-flex justify-content-center" // Centramos la tarjeta en la columna
              >
                <div
                  className="h-100 shadow-sm border-0 rounded-1 pb-4"
                  onClick={() => handleMovieClick(m)}
                  style={{
                    width: "100%",
                    maxWidth: "16rem",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    textAlign: "justify",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-5px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "none")
                  }
                >
                  <Card.Body className="d-flex flex-column h-100">
                    <Card.Img
                      variant="top"
                      style={{
                        width: "100%",
                        height: "400px",
                        objectFit: "cover",
                      }}
                      src={m.poster}
                      alt={m.name}
                      className="mb-3 rounded-top-1"
                    />
                    <Card.Title className="ms-3 fw-bold text-truncate">
                      {m.name.toUpperCase()}
                    </Card.Title>
                    <Card.Subtitle className="mb-2 ms-3">
                      {m.genre.toUpperCase()}
                    </Card.Subtitle>
                  </Card.Body>
                </div>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};
