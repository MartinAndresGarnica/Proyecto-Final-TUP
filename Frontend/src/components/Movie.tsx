import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { getMovies, getScreenings } from "../api/mockClient";
import { useParams, useNavigate } from "react-router-dom";

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

// Copiada de Cartelera para mantener el mismo formato de etiquetas de día
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

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day}/${month}`;
};

export const MoviePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      const moviesData: Movie[] = await getMovies();
      const movie = moviesData.find((m: Movie) => m.idMovie === Number(id));
      setSelectedMovie(movie || null);
    };
    fetchMovie();
  }, [id]);

  useEffect(() => {
    if (!selectedMovie) {
      setScreenings([]);
      setSelectedDate(null);
      return;
    }

    const fetchScreenings = async () => {
      const data = await getScreenings(selectedMovie.idMovie);
      setScreenings(data || []);
      if (data && data.length > 0) {
        setSelectedDate(getDayLabel(data[0].start));
      }
    };
    fetchScreenings();
  }, [selectedMovie]);

  const uniqueDatesDetail = Array.from(
    new Set(screenings.map((s) => getDayLabel(s.start))),
  );

  const screeningsForSelectedDate = screenings.filter(
    (s) => getDayLabel(s.start) === selectedDate,
  );

  const handleBack = () => {
    navigate("/cartelera");
  };

  const handleSelect = (s: Screening) => {
    if (!selectedMovie) return;
    navigate("/booking", { state: { screening: s, movie: selectedMovie } });
  };

  if (!selectedMovie) {
    return (
      <Container className="py-5">
        <p className="text-center">Película no encontrada.</p>
        <div className="text-center">
          <Button variant="secondary" onClick={handleBack}>
            ← Volver a Cartelera
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="fw-bold text-primary mb-3">{selectedMovie.name}</h2>
      <Row>
        <Col md={5} className="d-flex justify-content-center">
          <div
            className="h-100 border-0 rounded-5 justify-content-center "
            style={{
              width: "100%",
              maxWidth: "16rem",
            }}
          >
            <Card.Body className="d-flex flex-column h-100">
              <Card.Img
                variant="top"
                style={{
                  width: "100%",
                  height: "400px",
                  objectFit: "contain",
                }}
                src={selectedMovie.poster}
                alt={selectedMovie.name}
              />
            </Card.Body>
          </div>
        </Col>
        <Col md={7} className="text-start">
          <p>
            <strong>DESCRIPCION: </strong>
            {selectedMovie.description}
          </p>
          <p>
            <strong>DIRECTOR:</strong> {selectedMovie.director}
          </p>
          <p>
            <strong>DURACIÓN:</strong> {selectedMovie.length} minutos
          </p>
        </Col>
      </Row>

      <Row className="mt-5 justify-content-center">
        <Col>
          <h3 className="fw-bold text-primary mb-4 text-center">
            🕐 Horarios Disponibles
          </h3>

          <div className="d-flex justify-content-center gap-2 mb-4 flex-wrap">
            {uniqueDatesDetail.map((date) => (
              <Button
                key={date}
                variant={
                  selectedDate === date ? "primary" : "outline-secondary"
                }
                className="px-4 py-2 fw-bold"
                onClick={() => setSelectedDate(date)}
              >
                {date}
              </Button>
            ))}
          </div>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-dark text-white fw-bold fs-5">
              Funciones
            </Card.Header>
            <Card.Body className="bg-light">
              <p className="fw-bold text-muted mb-3 border-bottom pb-2">
                {selectedMovie.lenguage.toUpperCase()} ·{" "}
                {selectedMovie.subtitles ? "SUBTITULADO" : "DOBLADO"}
              </p>
              <Row className="justify-content-start">
                {screeningsForSelectedDate.length > 0 ? (
                  screeningsForSelectedDate.map((s) => (
                    <Col
                      md={3}
                      sm={4}
                      xs={6}
                      key={s.idScreening}
                      className="mb-3"
                    >
                      <Button
                        variant="success"
                        className="w-100 py-2 fw-bold shadow-sm"
                        onClick={() => handleSelect(s)}
                        style={{
                          backgroundColor: "#48c774",
                          borderColor: "#48c774",
                        }}
                      >
                        <div className="fs-5">
                          {new Date(s.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </Button>
                    </Col>
                  ))
                ) : (
                  <p className="text-center text-muted w-100 mt-3">
                    No hay horarios para este día.
                  </p>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
