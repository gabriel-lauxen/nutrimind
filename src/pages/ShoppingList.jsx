import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { gerarListaCompras, getGroqKey } from "../lib/groq.js";

export default function ShoppingList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [planoReg, setPlanoReg] = useState(null);
  const [lista, setLista] = useState(null);
  const [dias, setDias] = useState(7);
  const [marcados, setMarcados] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const id = localStorage.getItem("ultimo_plano_id");
      let q = supabase.from("meal_plans").select("*").eq("user_id", user.id);
      q = id ? q.eq("id", id) : q.order("created_at", { ascending: false }).limit(1);
      const { data } = await q.maybeSingle();
      setPlanoReg(data);

      // Carrega lista já gerada para este plano, se houver
      if (data) {
        const { data: sl } = await supabase
          .from("shopping_lists").select("*")
          .eq("meal_plan_id", data.id)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (sl) {
          setLista(sl.itens);
          if (sl.itens?.dias) setDias(sl.itens.dias);
        }
      }
      setCarregando(false);
    })();
  }, [user]);

  async function gerar() {
    setErro("");
    if (!getGroqKey()) {
      setErro("Configure sua chave da API Groq em Ajustes.");
      return;
    }
    if (!planoReg) return;
    setGerando(true);
    try {
      const result = await gerarListaCompras(planoReg.plano, Number(dias));
      setLista(result);
      setMarcados({});
      await supabase.from("shopping_lists").insert({
        user_id: user.id, meal_plan_id: planoReg.id, itens: result,
      });
    } catch (err) {
      setErro(err.message || "Erro ao gerar a lista.");
    } finally {
      setGerando(false);
    }
  }

  function toggle(cat, idx) {
    const k = `${cat}-${idx}`;
    setMarcados((m) => ({ ...m, [k]: !m[k] }));
  }

  if (carregando)
    return <div className="card center"><span className="spinner" /> Carregando…</div>;

  if (!planoReg)
    return (
      <div className="card">
        <h2>Gere um plano primeiro</h2>
        <p className="subtitle">A lista de compras é montada a partir do seu plano alimentar.</p>
        <button className="btn" onClick={() => navigate("/")}>Ir para o questionário</button>
      </div>
    );

  return (
    <>
      <div className="card">
        <h2>Lista de compras</h2>
        <p className="subtitle">Gerada pela IA a partir do seu plano alimentar, organizada por setor do mercado.</p>
        {erro && <div className="alert alert-error">{erro}</div>}
        <div className="row-between">
          <div className="field" style={{ marginBottom: 0, minWidth: 160 }}>
            <label>Período</label>
            <select value={dias} onChange={(e) => setDias(e.target.value)}>
              <option value={1}>1 dia</option>
              <option value={3}>3 dias</option>
              <option value={7}>7 dias (semana)</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
            </select>
          </div>
          <button className="btn" onClick={gerar} disabled={gerando}>
            {gerando && <span className="spinner" />}
            {lista ? "Gerar novamente" : "Gerar lista"}
          </button>
        </div>
      </div>

      {lista && (lista.categorias || []).map((cat, i) => (
        <div className="card" key={i}>
          <h2 style={{ fontSize: "1.1rem" }}>{cat.nome}</h2>
          <ul className="checklist">
            {(cat.itens || []).map((it, j) => {
              const k = `${i}-${j}`;
              return (
                <li key={j} style={{ opacity: marcados[k] ? 0.55 : 1 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", width: "100%", fontWeight: 400 }}>
                    <input type="checkbox" checked={!!marcados[k]} onChange={() => toggle(i, j)} />
                    <span>
                      <span style={{ textDecoration: marcados[k] ? "line-through" : "none" }}>{it.item}</span>
                      {it.quantidade && <span className="muted"> — {it.quantidade}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {!lista && !gerando && (
        <p className="muted center">Clique em “Gerar lista” para montar suas compras.</p>
      )}
    </>
  );
}
