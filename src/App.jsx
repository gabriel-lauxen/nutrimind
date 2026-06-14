import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { supabase } from "./lib/supabase.js";
import Login from "./pages/Login.jsx";
import Questionnaire from "./pages/Questionnaire.jsx";
import MealPlan from "./pages/MealPlan.jsx";
import ShoppingList from "./pages/ShoppingList.jsx";
import Settings from "./pages/Settings.jsx";

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const gesto = useRef({ x: 0, y: 0, ativo: false });

  async function sair() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  }

  // Abre o drawer arrastando da borda direita para a esquerda; fecha arrastando para a direita
  useEffect(() => {
    const LARG = window.innerWidth || 360;
    function onStart(e) {
      const t = e.touches[0];
      const naBorda = t.clientX > LARG - 28; // perto da borda direita
      gesto.current = { x: t.clientX, y: t.clientY, ativo: naBorda || open };
    }
    function onMove(e) {
      if (!gesto.current.ativo) return;
      const t = e.touches[0];
      const dx = t.clientX - gesto.current.x;
      const dy = Math.abs(t.clientY - gesto.current.y);
      if (dy > 60) return; // movimento muito vertical: ignora
      if (!open && dx < -45) {
        setOpen(true);
        gesto.current.ativo = false;
      } else if (open && dx > 45) {
        setOpen(false);
        gesto.current.ativo = false;
      }
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
    };
  }, [open]);

  const links = (
    <>
      <NavLink to="/" end onClick={() => setOpen(false)}>Questionário</NavLink>
      <NavLink to="/plano" onClick={() => setOpen(false)}>Plano</NavLink>
      <NavLink to="/compras" onClick={() => setOpen(false)}>Lista de compras</NavLink>
      <NavLink to="/ajustes" onClick={() => setOpen(false)}>Ajustes</NavLink>
      <button className="btn-ghost" onClick={sair}>Sair</button>
    </>
  );

  return (
    <>
      <header className="navbar">
        <div className="brand">🥗 NutriMind</div>
        <nav className="nav-desktop">{links}</nav>
        <button
          className="hamburger"
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
        >
          <span /><span /><span />
        </button>
      </header>

      <div
        className={`drawer-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-head">
          <span className="brand">🥗 NutriMind</span>
          <button className="drawer-x" aria-label="Fechar menu" onClick={() => setOpen(false)}>×</button>
        </div>
        <nav className="drawer-nav">{links}</nav>
        <p className="drawer-hint">Dica: arraste da borda direita para abrir/fechar o menu.</p>
      </aside>
    </>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="container center" style={{ marginTop: 80 }}>
        <span className="spinner" /> Carregando…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Navbar />
      <div className="container">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Questionnaire /></Protected>} />
      <Route path="/plano" element={<Protected><MealPlan /></Protected>} />
      <Route path="/compras" element={<Protected><ShoppingList /></Protected>} />
      <Route path="/ajustes" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
