import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { supabase } from "./lib/supabase.js";
import Login from "./pages/Login.jsx";
import MealPlan from "./pages/MealPlan.jsx";
import ShoppingList from "./pages/ShoppingList.jsx";
import Settings from "./pages/Settings.jsx";

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

const IconClipboard = () => (
  <svg viewBox="0 0 24 24" {...ic}><rect x="8" y="3" width="8" height="4" rx="1.5" /><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><path d="M8 12h8M8 16h6" /></svg>
);
const IconBowl = () => (
  <svg viewBox="0 0 24 24" {...ic}><path d="M3 11h18" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M9 6c0-1 .8-1.6 0-3M13 6c0-1 .8-1.6 0-3" /></svg>
);
const IconCart = () => (
  <svg viewBox="0 0 24 24" {...ic}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.3 12.2a1 1 0 0 0 1 .8h8.3a1 1 0 0 0 1-.8L21 7H6" /></svg>
);
const IconGear = () => (
  <svg viewBox="0 0 24 24" {...ic}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.2V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.2-2.7H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.4V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.2 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.4 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" {...ic}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);

const TABS = [
  { to: "/plano", label: "Plano", Icon: IconBowl },
  { to: "/compras", label: "Compras", Icon: IconCart },
  { to: "/ajustes", label: "Configurações", Icon: IconGear },
];

function activeIdx(pathname) {
  let idx = 0;
  TABS.forEach((t, i) => {
    if (pathname.startsWith(t.to)) idx = i;
  });
  return idx;
}

// Mede a posição do item ativo (relativa ao container) para o indicador deslizante
function useSlider(pathname) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [box, setBox] = useState(null);
  const idx = activeIdx(pathname);

  function medir() {
    const c = containerRef.current;
    const el = itemRefs.current[idx];
    if (!c || !el) return;
    const cr = c.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    setBox({ left: er.left - cr.left, top: er.top - cr.top, width: er.width, height: er.height });
  }

  useLayoutEffect(() => { medir(); }, [pathname, idx]);
  useEffect(() => {
    const onR = () => medir();
    window.addEventListener("resize", onR);
    const t = setTimeout(medir, 250); // após carregar fontes
    return () => { window.removeEventListener("resize", onR); clearTimeout(t); };
  }, [idx]);

  return { containerRef, itemRefs, box };
}

function sliderStyle(box) {
  return box
    ? { transform: `translate(${box.left}px, ${box.top}px)`, width: box.width, height: box.height, opacity: 1 }
    : { opacity: 0 };
}

function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { containerRef, itemRefs, box } = useSlider(pathname);
  async function sair() {
    await supabase.auth.signOut();
    navigate("/login");
  }
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <img src="/icon-192.png" alt="" className="brand-logo" />
          <span>NutriMind</span>
        </div>
        <nav className="nav-links" ref={containerRef}>
          <span className="nav-slider" style={sliderStyle(box)} />
          {TABS.map(({ to, label, Icon, end }, i) => (
            <NavLink key={to} to={to} end={end} ref={(el) => (itemRefs.current[i] = el)} className="nav-link" title={label}>
              <span className="nav-link-ic"><Icon /></span>
              <span className="nav-link-lb">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="icon-btn glass-btn logout-desktop" onClick={sair} aria-label="Sair" title="Sair">
          <IconLogout />
        </button>
      </div>
    </header>
  );
}

// Navegação por gesto (swipe horizontal) no mobile, alternando entre as abas em loop
function useSwipeNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    let sx = 0, sy = 0, tracking = false;
    function start(e) {
      const t = e.touches[0];
      const el = e.target;
      if (el.closest && el.closest(".fab-mic, .agua-bar, .filter-scroll, input, textarea, select")) {
        tracking = false;
        return;
      }
      sx = t.clientX; sy = t.clientY; tracking = true;
    }
    function end(e) {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      const n = TABS.length;
      let idx = 0;
      TABS.forEach((tb, i) => { if (pathname.startsWith(tb.to)) idx = i; });
      const next = dx < 0 ? (idx + 1) % n : (idx - 1 + n) % n; // loop nas pontas
      navigate(TABS[next].to);
    }
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [pathname, navigate]);
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  useSwipeNav();
  if (loading)
    return (
      <div className="container center" style={{ marginTop: 80 }}>
        <span className="spinner" /> Carregando…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <TopBar />
      <div className="container">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/plano" element={<Protected><MealPlan /></Protected>} />
      <Route path="/compras" element={<Protected><ShoppingList /></Protected>} />
      <Route path="/ajustes" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/plano" replace />} />
    </Routes>
  );
}
