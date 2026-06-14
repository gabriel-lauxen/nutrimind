import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { gerarPratoPersonalizado, getGroqKey } from "../lib/groq.js";

// Alvo de macros da refeição: média das opções existentes (são equivalentes)
function alvoRefeicao(ref, meta) {
  const ops = ref.opcoes || [];
  const comMacros = ops.filter((o) => o.calorias);
  if (comMacros.length) {
    const avg = (k) =>
      Math.round(comMacros.reduce((s, o) => s + (Number(o[k]) || 0), 0) / comMacros.length);
    return {
      calorias: avg("calorias"),
      proteina_g: avg("proteina_g"),
      carbo_g: avg("carbo_g"),
      gordura_g: avg("gordura_g"),
    };
  }
  // Fallback: divide o total diário pelo número de refeições
  const n = meta?.nutri ? 1 : 1;
  return {
    calorias: Math.round((meta?.nutri?.calorias || 2000) / 4),
    proteina_g: Math.round((meta?.nutri?.proteina_g || 120) / 4),
    carbo_g: Math.round((meta?.nutri?.carbo_g || 200) / 4),
    gordura_g: Math.round((meta?.nutri?.gordura_g || 60) / 4),
  };
}

export default function MealPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState(null);
  const [plano, setPlano] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Estado do gerador personalizado por refeição: { [i]: {open, texto, loading, erro} }
  const [pers, setPers] = useState({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const id = localStorage.getItem("ultimo_plano_id");
      let query = supabase.from("meal_plans").select("*").eq("user_id", user.id);
      query = id
        ? query.eq("id", id)
        : query.order("created_at", { ascending: false }).limit(1);
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
    if (!getGroqKey()) {
      setPersField(i, { erro: "Configure sua chave Groq em Ajustes." });
      return;
    }
    const texto = (pers[i]?.texto || "").trim();
    if (!texto) {
      setPersField(i, { erro: "Escreva o que você gostaria de comer." });
      return;
    }
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

      // Atualiza o plano em memória
      const novoPlano = { ...plano, refeicoes: plano.refeicoes.map((r, idx) =>
        idx === i ? { ...r, opcoes: [...(r.opcoes || []), novaOpcao] } : r
      ) };
      setPlano(novoPlano);
      setPersField(i, { loading: false, texto: "", open: false });

      // Persiste no Supabase
      await supabase.from("meal_plans").update({ plano: novoPlano }).eq("id", registro.id);
    } catch (err) {
      setPersField(i, { loading: false, erro: err.message || "Erro ao gerar o prato." });
    }
  }

  if (carregando)
    return (
      <div className="card center">
        <span className="spinner" /> Carregando plano…
      </div>
    );

  if (!plano)
    return (
      <div className="card">
        <h2>Nenhum plano ainda</h2>
        <p className="subtitle">
          Responda o questionário para gerar seu primeiro plano alimentar.
        </p>
        <button className="btn" onClick={() => navigate("/")}>
          Ir para o questionário
        </button>
      </div>
    );

  const resumo = plano.resumo || {};
  const meta = plano._meta || {};

  return (
    <>
      <div className="card">
        <div className="row-between">
          <h2>{registro?.titulo || "Seu plano alimentar"}</h2>
          <button className="btn btn-outline" onClick={() => navigate("/compras")}>
            Gerar lista de compras →
          </button>
        </div>
        {erro && <div className="alert alert-error">{erro}</div>}
        <div className="stats" style={{ marginTop: 14 }}>
          <div className="stat"><div className="num">{resumo.calorias_alvo || meta.nutri?.calorias || "—"}</div><div className="lbl">kcal/dia</div></div>
          <div className="stat"><div className="num">{resumo.proteina_g || meta.nutri?.proteina_g || "—"}g</div><div className="lbl">Proteína</div></div>
          <div className="stat"><div className="num">{resumo.carbo_g || meta.nutri?.carbo_g || "—"}g</div><div className="lbl">Carboidrato</div></div>
          <div className="stat"><div className="num">{resumo.gordura_g || meta.nutri?.gordura_g || "—"}g</div><div className="lbl">Gordura</div></div>
          {meta.agua_litros && (
            <div className="stat"><div className="num">{meta.agua_litros}L</div><div className="lbl">Água/dia</div></div>
          )}
        </div>
        {resumo.observacao && <p className="muted">{resumo.observacao}</p>}
      </div>

      {(plano.refeicoes || []).map((ref, i) => (
        <div className="meal" key={i}>
          <h3>
            {ref.nome}{" "}
            {ref.horario_sugerido && <span className="muted">· {ref.horario_sugerido}</span>}
          </h3>
          {(ref.opcoes || []).map((op, j) => (
            <div className="opt-prato" key={j}>
              <strong>
                {op.personalizado ? "★ Personalizado" : `Opção ${j + 1}`}: {op.prato}
              </strong>
              {op.ingredientes && (
                <ul>
                  {op.ingredientes.map((ing, k) => (
                    <li key={k}>{ing}</li>
                  ))}
                </ul>
              )}
              <div className="macros">
                {op.calorias ? `${op.calorias} kcal` : ""}
                {op.proteina_g != null ? ` · P ${op.proteina_g}g` : ""}
                {op.carbo_g != null ? ` · C ${op.carbo_g}g` : ""}
                {op.gordura_g != null ? ` · G ${op.gordura_g}g` : ""}
              </div>
            </div>
          ))}

          {/* Gerador de prato personalizado */}
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
                <button className="btn btn-outline" onClick={() => setPersField(i, { open: false, erro: "" })}>
                  Cancelar
                </button>
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
      ))}

      {plano.dica && (
        <div className="card">
          <h2>💡 Dica</h2>
          <p>{plano.dica}</p>
        </div>
      )}

      <button className="btn btn-outline" onClick={() => navigate("/")}>
        ← Refazer questionário
      </button>
    </>
  );
}
