import React, { useState } from "react";
import { Container, Navbar, Nav, Button, Alert } from "react-bootstrap";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link,
  Outlet,
} from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginRegister } from "./components/LoginRegister";
import { Cartelera } from "./components/Cartelera";
import { SeleccionAsientos } from "./components/SeleccionAsientos";
import { ProcesoCompra } from "./components/ProcesoCompra";
import { Historial } from "./components/Historial";
import { AdminPanel } from "./components/AdminPanel";
import { AdminPanelScreenings } from "./components/AdminPanelScreenings";
import { MoviePage } from "./components/Movie";
// Import new pages
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ProfilePage } from "./pages/ProfilePage";
// Import new payment status pages
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { PaymentPendingPage } from "./pages/PaymentPendingPage";
import { PaymentFailurePage } from "./pages/PaymentFailurePage";

interface Screening {
  idScreening: number;
  date: string;
  start: string;
  end: string;
  ticketPrice: number;
}

interface Movie {
  IdMovie: number;
  Name: string;
  Length: number;
  Description: string;
  Genre: string;
  Director: string;
  Poster: string;
}

interface Seat {
  id: number;
  row: number;
  column: number;
}

function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = Boolean(
    String(user.role).toLowerCase() === "admin" || user.role === true,
  );

  if (adminOnly && !isAdmin) {
    return <Navigate to="/cartelera" replace />;
  }

  return children;
}

function BookingWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { screening?: Screening; movie?: Movie };

  if (!state?.screening || !state?.movie) {
    return <Navigate to="/cartelera" replace />;
  }

  return (
    <SeleccionAsientos
      screening={state.screening}
      movie={state.movie}
      onConfirm={(seats) => {
        navigate("/checkout", {
          state: { seats, screening: state.screening, movie: state.movie },
        });
      }}
      onBack={() => navigate("/cartelera")}
    />
  );
}

function CheckoutWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    seats?: Seat[];
    screening?: Screening;
    movie?: Movie;
  };

  if (!state?.seats || !state?.screening || !state?.movie) {
    return <Navigate to="/cartelera" replace />;
  }

  return (
    <ProcesoCompra
      screening={state.screening}
      movie={state.movie}
      seats={state.seats}
      onConfirm={() => {}}
      onBack={() =>
        navigate("/booking", {
          state: { screening: state.screening, movie: state.movie },
        })
      }
    />
  );
}

function MainLayout({
  notification,
  setNotification,
}: {
  notification: string | null;
  setNotification: (msg: string | null) => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = Boolean(
    user && (String(user.role).toLowerCase() === "admin" || user.role === true),
  );

  return (
    <div
      className="d-flex flex-column lead"
      style={{ minHeight: "100vh", backgroundColor: "#F3F4F6" }}
    >
      <Navbar bg="dark" expand="lg" sticky="top" className="shadow-sm">
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold"
            style={{ fontSize: "1.5rem", color: "#ffc107" }}
          >
            🎬 CineFlix
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto gap-3">
              <Nav.Link
                as={Link}
                to="/cartelera"
                className={
                  location.pathname === "/cartelera"
                    ? "text-warning fw-bold"
                    : "text-white"
                }
              >
                Cartelera
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/historial"
                className={
                  location.pathname === "/historial"
                    ? "text-warning fw-bold"
                    : "text-white"
                }
              >
                Mis Reservas
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/profile"
                className={
                  location.pathname === "/profile"
                    ? "text-warning fw-bold"
                    : "text-white"
                }
              >
                Perfil
              </Nav.Link>

              {isAdmin && (
                <Nav.Link
                  as={Link}
                  to="/admin"
                  className={
                    location.pathname.startsWith("/admin")
                      ? "text-warning fw-bold"
                      : "text-white"
                  }
                >
                  Admin
                </Nav.Link>
              )}
            </Nav>
            <div className="ms-3 d-flex align-items-center gap-2">
              <span className="text-white fw-bold">{user?.name}</span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="flex-grow-1">
        {notification && (
          <Alert
            variant="success"
            onClose={() => setNotification(null)}
            dismissible
          >
            {notification}
          </Alert>
        )}
        <Outlet />
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-4">
        <p className="mb-0">© 2025 CineFlix - Sistema de Gestión de Cine</p>
      </footer>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<string | null>(null);

  const handleShowNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/cartelera" replace />
          ) : (
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <LoginRegister
                onClose={() => navigate("/cartelera")}
                onShowNotification={handleShowNotification}
              />
            </div>
          )
        }
      />
      {/* password recovery and profile routes (accessible even if not logged for recovery) */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* main application routes requiring authentication */}
      <Route
        element={
          <MainLayout
            notification={notification}
            setNotification={setNotification}
          />
        }
      >
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/cartelera" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/cartelera"
          element={
            <RequireAuth>
              <Cartelera
                onSelectScreening={(s, m) =>
                  navigate("/booking", { state: { screening: s, movie: m } })
                }
              />
            </RequireAuth>
          }
        />
        <Route
          path="/movie/:id"
          element={
            <RequireAuth>
              <MoviePage />
            </RequireAuth>
          }
        />
        <Route
          path="/booking"
          element={
            <RequireAuth>
              <BookingWrapper />
            </RequireAuth>
          }
        />

        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutWrapper />
            </RequireAuth>
          }
        />
        <Route
          path="/historial"
          element={
            <RequireAuth>
              <Historial />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <AdminPanel />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/screenings"
          element={
            <RequireAuth adminOnly>
              <AdminPanelScreenings />
            </RequireAuth>
          }
        />
        {/* New Payment Status Routes */}
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-pending" element={<PaymentPendingPage />} />
        <Route path="/payment-failure" element={<PaymentFailurePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
