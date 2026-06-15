import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { gerarPratoPersonalizado, getGroqKey } from "../lib/groq.js";

// Data local no formato YYYY-MM-DD (para resetar a água a cada dia)
function hojeStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Medidor de água: arraste da esquerda p/ direita para "encher" (azul translúcido).
// Atualiza via refs durante o arraste (sem re-render) para ficar fluido.
function AguaBar({ litros }) {
  const barRef = useRef(null);
  const fillRef = useRef(null);
  const handleRef = useRef(null);
  const valRef = useRef(null);
  const arrasto = useRef(false);
  const pctRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  function aplica(p) {
    pctRef.current = p;
    if (fillRef.current) fillRef.current.style.width = p + "%";
    if (handleRef.current) handleRef.current.style.left = p + "%";
    if (valRef.current) valRef.current.textContent = ((litros * p) / 100).toFixed(1);
  }
  useEffect(() => {
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem("agua_dia")); } catch { salvo = null; }
    // só mantém o nível se for do dia de hoje; senão começa zerado
    aplica(salvo && salvo.date === hojeStr() ? Number(salvo.pct) || 0 : 0);
  }, [litros]);

  function fromX(x) {
    const r = barRef.current.getBoundingClientRect();
    const p = ((x - r.left) / r.width) * 100;
    return Math.max(0, Math.min(100, p));
  }
  function down(e) {
    arrasto.current = true;
    setDragging(true);
    barRef.current.setPointerCapture?.(e.pointerId);
    aplica(fromX(e.clientX));
  }
  function move(e) {
    if (arrasto.current) aplica(fromX(e.clientX));
  }
  function up() {
    if (!arrasto.current) return;
    arrasto.current = false;
    setDragging(false);
    localStorage.setItem("agua_dia", JSON.stringify({ date: hojeStr(), pct: Math.round(pctRef.current) }));
  }

  return (
    <div
      className={`agua-bar ${dragging ? "dragging" : ""}`}
      ref={barRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      role="slider"
      aria-label="Água ingerida"
    >
      <div className="agua-fill" ref={fillRef} />
      <div className="agua-handle" ref={handleRef}>
        <svg className="agua-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </div>
      <div className="agua-label">
        <span className="agua-ic">💧</span>
        <b><span ref={valRef}>0</span> L</b>&nbsp;de {litros} L de água
      </div>
    </div>
  );
}

function alvoRefeicao(ref, meta) {
  const ops = ref.opcoes || [];
  const comMacros = ops.filter((o) => o.calorias);
  if (comMacros.length) {
    const avg = (k) =>
      Math.round(comMacros.reduce((s, o) => s + (Number(o[k]) || 0), 0) / comMacros.length);
    return { calorias: avg("calorias"), proteina_g: avg("proteina_g"), carbo_g: avg("carbo_g"), gordura_g: avg("gordura_g") };
  }
  return {
    calorias: Math.round((meta?.nutri?.calorias || 2000) / 4),
    proteina_g: Math.round((meta?.nutri?.proteina_g || 120) / 4),
    carbo_g: Math.round((meta?.nutri?.carbo_g || 200) / 4),
    gordura_g: Math.round((meta?.nutri?.gordura_g || 60) / 4),
  };
}

function PlanSkeleton() {
  return (
    <>
      <div className="plan-summary">
        <div className="skel" style={{ height: 26, width: "55%", margin: "8px 2px 16px" }} />
        <div className="plan-macros">
          {[0, 1, 2, 3].map((i) => (
            <div className="macro-item" key={i}>
              <div className="skel" style={{ height: 26, width: "55%" }} />
              <div className="skel" style={{ height: 11, width: "80%", marginTop: 8 }} />
            </div>
          ))}
        </div>
        <div className="skel" style={{ height: 46, marginTop: 16, borderRadius: 15 }} />
        <div className="skel" style={{ height: 78, marginTop: 16, borderRadius: 18 }} />
      </div>
      <div className="filter-bar">
        {[0, 1, 2].map((i) => <div className="skel skel-chip" key={i} />)}
      </div>
      {[0, 1].map((i) => (
        <div className="meal" key={i}>
          <div className="skel" style={{ height: 18, width: "42%" }} />
          <div className="skel" style={{ height: 58, marginTop: 12, borderRadius: 14 }} />
          <div className="skel" style={{ height: 58, marginTop: 10, borderRadius: 14 }} />
        </div>
      ))}
    </>
  );
}

export default function MealPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const setErro = (m) => { if (m) toast(m, "error"); };
  const filterRef = useRef(null);
  const [registro, setRegistro] = useState(null);
  const [plano, setPlano] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [pers, setPers] = useState({});
  const [filtro, setFiltro] = useState("Todos");
  const [opAberta, setOpAberta] = useState({});

  function toggleOpcao(i, j) {
    const k = `${i}-${j}`;
    setOpAberta((o) => ({ ...o, [k]: !o[k] }));
  }
  function aplicarFiltro(f) {
    const bar = filterRef.current;
    const antes = bar ? bar.getBoundingClientRect().top : 0;
    setFiltro(f);
    requestAnimationFrame(() => {
      const depois = bar ? bar.getBoundingClientRect().top : 0;
      window.scrollBy(0, depois - antes);
    });
  }
  const [aberto, setAberto] = useState(() => {
    const v = localStorage.getItem("plano_aberto");
    return v === null ? true : v === "1";
  });
  useEffect(() => {
    localStorage.setItem("plano_aberto", aberto ? "1" : "0");
  }, [aberto]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const id = localStorage.getItem("ultimo_plano_id");
      let query = supabase.from("meal_plans").select("*").eq("user_id", user.id);
      query = id ? query.eq("id", id) : query.order("created_at", { ascending: false }).limit(1);
      const { data, error } = await query.maybeSingle();
      if (error) setErro(error.message);
      setRegistro(data);
      setPlano(data?.plano || null);
      setCarregando(false);
    })();
  }, [user]);

  function setPersField(i, patch) {
    setPers((p) => ({ ...p, [i]: { ...(p[i] || {}), ...patch } }));
  }

  async function gerarPersonalizado(i, ref) {
    setErro("");
    if (!getGroqKey()) return setPersField(i, { erro: "Configure sua chave Groq em Ajustes." });
    const texto = (pers[i]?.texto || "").trim();
    if (!texto) return setPersField(i, { erro: "Escreva o que você gostaria de comer." });
    setPersField(i, { loading: true, erro: "" });
    try {
      const meta = plano._meta || {};
      const novaOpcao = await gerarPratoPersonalizado({
        refeicaoNome: ref.nome,
        preferencia: texto,
        alvo: alvoRefeicao(ref, meta),
        restricoes: meta.restricoes || [],
      });
      novaOpcao.personalizado = true;
      const novoPlano = { ...plano, refeicoes: plano.refeicoes.map((r, idx) =>
        idx === i ? { ...r, opcoes: [...(r.opcoes || []), novaOpcao] } : r
      ) };
      setPlano(novoPlano);
      setPersField(i, { loading: false, texto: "", open: false });
      await supabase.from("meal_plans").update({ plano: novoPlano }).eq("id", registro.id);
    } catch (err) {
      setPersField(i, { loading: false, erro: err.message || "Erro ao gerar o prato." });
    }
  }

  if (carregando) return <PlanSkeleton />;

  if (!plano)
    return (
      <div className="card">
        <h2>Nenhum plano ainda</h2>
        <p className="subtitle">Responda o questionário em Configurações para gerar seu primeiro plano alimentar.</p>
        <button className="btn" onClick={() => navigate("/ajustes")}>Ir para Configurações</button>
      </div>
    );

  const resumo = plano.resumo || {};
  const meta = plano._meta || {};
  const refeicoes = plano.refeicoes || [];
  const filtros = ["Todos", ...refeicoes.map((r) => r.nome)];

  return (
    <>
      {/* Resumo do plano — sem painel branco, colapsável e animado */}
      <div className="plan-summary">
        <button className="plan-head" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>
          <span className="plan-title">{registro?.titulo || "Seu plano alimentar"}</span>
          <span className={`chev-btn ${aberto ? "open" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </button>

        <div className={`collapse ${aberto ? "open" : ""}`}>
          <div className="collapse-inner">
            <div className="plan-macros">
              <div className="macro-item m-kcal"><span className="mi-dot" /><span className="mi-val">{resumo.calorias_alvo || meta.nutri?.calorias || "—"}</span><span className="mi-lbl">kcal / dia</span></div>
              <div className="macro-item m-prot"><span className="mi-dot" /><span className="mi-val">{resumo.proteina_g || meta.nutri?.proteina_g || "—"}<small>g</small></span><span className="mi-lbl">Proteína</span></div>
              <div className="macro-item m-carb"><span className="mi-dot" /><span className="mi-val">{resumo.carbo_g || meta.nutri?.carbo_g || "—"}<small>g</small></span><span className="mi-lbl">Carboidrato</span></div>
              <div className="macro-item m-fat"><span className="mi-dot" /><span className="mi-val">{resumo.gordura_g || meta.nutri?.gordura_g || "—"}<small>g</small></span><span className="mi-lbl">Gordura</span></div>
            </div>

            {meta.agua_litros && <AguaBar litros={meta.agua_litros} />}

            <div className="plan-note">
              {resumo.observacao && <p className="plan-note-text">{resumo.observacao}</p>}
              <div className="plan-note-actions">
                <button className="btn-compras" onClick={() => navigate("/compras")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.3 12.2a1 1 0 0 0 1 .8h8.3a1 1 0 0 0 1-.8L21 7H6" /></svg>
                  Ver lista de compras
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros por refeição — uma linha, rolagem horizontal */}
      <div className="filter-bar filter-scroll" ref={filterRef}>
        {filtros.map((f) => (
          <span key={f} className={`chip ${filtro === f ? "selected" : ""}`} onClick={() => aplicarFiltro(f)}>
            {f}
          </span>
        ))}
      </div>

      {refeicoes.map((ref, i) => {
        if (filtro !== "Todos" && ref.nome !== filtro) return null;
        return (
          <div className="meal" key={i}>
            <h3>
              {ref.nome}{" "}
              {ref.horario_sugerido && <span className="muted">· {ref.horario_sugerido}</span>}
            </h3>
            {(ref.opcoes || []).map((op, j) => {
              const aberta = !!opAberta[`${i}-${j}`];
              return (
                <div className="opt-prato" key={j}>
                  <button className="opt-head" onClick={() => toggleOpcao(i, j)} aria-expanded={aberta}>
                    <strong>{op.personalizado ? "★ Personalizado" : `Opção ${j + 1}`}: {op.prato}</strong>
                    {op.ingredientes && (
                      <span className={`chev-mini ${aberta ? "open" : ""}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </span>
                    )}
                  </button>
                  {op.ingredientes && (
                    <div className={`collapse ${aberta ? "open" : ""}`}>
                      <div className="collapse-inner">
                        <ul>{op.ingredientes.map((ing, k) => <li key={k}>{ing}</li>)}</ul>
                      </div>
                    </div>
                  )}
                  <div className="macros">
                    {op.calorias ? `${op.calorias} kcal` : ""}
                    {op.proteina_g != null ? ` · P ${op.proteina_g}g` : ""}
                    {op.carbo_g != null ? ` · C ${op.carbo_g}g` : ""}
                    {op.gordura_g != null ? ` · G ${op.gordura_g}g` : ""}
                  </div>
                </div>
              );
            })}

            {pers[i]?.open ? (
              <div className="pers-box">
                <label>O que você gostaria de comer nesta refeição?</label>
                <input
                  value={pers[i]?.texto || ""}
                  onChange={(e) => setPersField(i, { texto: e.target.value })}
                  placeholder="ex: tapioca com frango, ou algo com ovo e abacate"
                  onKeyDown={(e) => e.key === "Enter" && gerarPersonalizado(i, ref)}
                />
                {pers[i]?.erro && <div className="alert alert-error" style={{ marginTop: 10 }}>{pers[i].erro}</div>}
                <div className="row-between" style={{ marginTop: 10 }}>
                  <button className="btn btn-outline" onClick={() => setPersField(i, { open: false, erro: "" })}>Cancelar</button>
                  <button className="btn" onClick={() => gerarPersonalizado(i, ref)} disabled={pers[i]?.loading}>
                    {pers[i]?.loading && <span className="spinner" />}
                    {pers[i]?.loading ? "Montando prato…" : "Gerar prato"}
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-add" onClick={() => setPersField(i, { open: true, erro: "" })}>
                + Gerar opção personalizada
              </button>
            )}
          </div>
        );
      })}

      {plano.dica && (
        <div className="plan-note dica-note">
          <div className="dica-title">💡 Dica</div>
          <p className="plan-note-text">{plano.dica}</p>
        </div>
      )}

      <div className="center" style={{ marginTop: 20 }}>
        <button className="btn-refazer" onClick={() => navigate("/ajustes")}>← Refazer questionário</button>
      </div>
    </>
  );
}
