import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { calcularPlanoNutricional, aguaRecomendada } from "../lib/nutrition.js";
import { gerarPlanoAlimentar, getGroqKey } from "../lib/groq.js";

const NIVEIS = [
  {
    v: "sedentario",
    t: "Sedentário",
    d: "Pouco ou nenhum exercício; trabalho de escritório.",
  },
  {
    v: "leve",
    t: "Levemente ativo",
    d: "Exercício leve 1 a 3 vezes por semana.",
  },
  {
    v: "moderado",
    t: "Moderadamente ativo",
    d: "Exercício moderado 3 a 5 vezes por semana.",
  },
  {
    v: "intenso",
    t: "Muito ativo",
    d: "Exercício intenso 6 a 7 vezes por semana.",
  },
];
const OBJETIVOS = [
  {
    v: "emagrecer",
    t: "Emagrecer",
    d: "Perder gordura com déficit calórico seguro (~20%).",
  },
  {
    v: "ganhar_massa",
    t: "Ganhar massa muscular",
    d: "Hipertrofia com leve superávit e alta proteína.",
  },
  {
    v: "manter",
    t: "Manter o peso",
    d: "Equilíbrio calórico e composição corporal.",
  },
  {
    v: "saude",
    t: "Melhorar a saúde",
    d: "Mais qualidade alimentar e bem-estar geral.",
  },
];
const RESTRICOES = [
  "vegetariano",
  "vegano",
  "sem lactose",
  "sem glúten",
  "low carb",
  "diabético",
  "sem frutos do mar",
  "sem amendoim",
];

export default function Questionnaire() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    idade: "",
    sexo: "masculino",
    peso: "",
    altura: "",
    nivel_atividade: "moderado",
    objetivo: "emagrecer",
    refeicoes_dia: 4,
    restricoes: [],
  });
  const [erro, setErro] = useState("");
  const [gerando, setGerando] = useState(false);
  const [previa, setPrevia] = useState(null);

  // Carrega perfil salvo, se existir
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm((f) => ({
            ...f,
            nome: data.nome || "",
            idade: data.idade || "",
            sexo: data.sexo || "masculino",
            peso: data.peso || "",
            altura: data.altura || "",
            nivel_atividade: data.nivel_atividade || "moderado",
            objetivo: data.objetivo || "emagrecer",
            refeicoes_dia: data.refeicoes_dia || "recomendar",
            restricoes: data.restricoes || [],
          }));
        }
      });
  }, [user]);

  // Prévia das metas em tempo real
  useEffect(() => {
    const { idade, peso, altura } = form;
    if (idade && peso && altura) {
      setPrevia(
        calcularPlanoNutricional({
          sexo: form.sexo,
          peso: Number(peso),
          altura: Number(altura),
          idade: Number(idade),
          nivel_atividade: form.nivel_atividade,
          objetivo: form.objetivo,
        }),
      );
    } else {
      setPrevia(null);
    }
  }, [form]);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }
  function toggleRestricao(r) {
    setForm((f) => ({
      ...f,
      restricoes: f.restricoes.includes(r)
        ? f.restricoes.filter((x) => x !== r)
        : [...f.restricoes, r],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setErro("");
    if (!getGroqKey()) {
      setErro(
        "Configure sua chave da API Groq em Ajustes antes de gerar o plano.",
      );
      return;
    }
    const recomendarRefeicoes = form.refeicoes_dia === "recomendar";
    const dados = {
      ...form,
      idade: Number(form.idade),
      peso: Number(form.peso),
      altura: Number(form.altura),
      refeicoes_dia: recomendarRefeicoes
        ? "recomendar"
        : Number(form.refeicoes_dia),
    };
    const nutri = calcularPlanoNutricional(dados);

    setGerando(true);
    try {
      // Salva/atualiza perfil
      await supabase.from("profiles").upsert({
        user_id: user.id,
        nome: dados.nome,
        idade: dados.idade,
        sexo: dados.sexo,
        peso: dados.peso,
        altura: dados.altura,
        nivel_atividade: dados.nivel_atividade,
        objetivo: dados.objetivo,
        restricoes: dados.restricoes,
        refeicoes_dia: recomendarRefeicoes ? null : dados.refeicoes_dia,
        updated_at: new Date().toISOString(),
      });

      // Gera plano com a IA (Groq)
      const plano = await gerarPlanoAlimentar(dados, nutri);
      plano._meta = {
        nutri,
        agua_litros: aguaRecomendada(dados.peso),
        objetivo: dados.objetivo,
        restricoes: dados.restricoes,
      };

      // Persiste o plano
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          titulo: `Plano · ${OBJETIVOS.find((o) => o.v === dados.objetivo)?.t || ""}`,
          plano,
        })
        .select()
        .single();
      if (error) throw error;

      localStorage.setItem("ultimo_plano_id", data.id);
      navigate("/plano");
    } catch (err) {
      setErro(err.message || "Erro ao gerar o plano.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="card">
        <h2>Questionário</h2>
        <p className="subtitle">
          Respostas usadas para calcular suas metas (equação de Mifflin-St Jeor,
          fatores de atividade física e recomendações de macronutrientes
          baseadas em evidências).
        </p>

        {erro && <div className="alert alert-error">{erro}</div>}

        <div className="field">
          <label>Nome (opcional)</label>
          <input
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Seu nome"
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Idade</label>
            <input
              type="number"
              min="12"
              max="100"
              value={form.idade}
              onChange={(e) => set("idade", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Sexo</label>
            <select
              value={form.sexo}
              onChange={(e) => set("sexo", e.target.value)}
            >
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>
          <div className="field">
            <label>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={form.peso}
              onChange={(e) => set("peso", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Altura (cm)</label>
            <input
              type="number"
              min="120"
              max="230"
              value={form.altura}
              onChange={(e) => set("altura", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Nível de atividade física</h2>
        <p className="subtitle">
          Influencia diretamente seu gasto energético diário.
        </p>
        <div className="options">
          {NIVEIS.map((n) => (
            <div
              key={n.v}
              className={`option ${form.nivel_atividade === n.v ? "selected" : ""}`}
              onClick={() => set("nivel_atividade", n.v)}
            >
              <input
                type="radio"
                checked={form.nivel_atividade === n.v}
                onChange={() => {}}
              />
              <div>
                <div className="opt-title">{n.t}</div>
                <div className="opt-desc">{n.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Objetivo da dieta</h2>
        <p className="subtitle">
          Define o ajuste calórico e a distribuição de macronutrientes.
        </p>
        <div className="options">
          {OBJETIVOS.map((o) => (
            <div
              key={o.v}
              className={`option ${form.objetivo === o.v ? "selected" : ""}`}
              onClick={() => set("objetivo", o.v)}
            >
              <input
                type="radio"
                checked={form.objetivo === o.v}
                onChange={() => {}}
              />
              <div>
                <div className="opt-title">{o.t}</div>
                <div className="opt-desc">{o.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Preferências e restrições</h2>
        <p className="subtitle">Selecione tudo que se aplica (opcional).</p>
        <div className="chips">
          {RESTRICOES.map((r) => (
            <span
              key={r}
              className={`chip ${form.restricoes.includes(r) ? "selected" : ""}`}
              onClick={() => toggleRestricao(r)}
            >
              {r}
            </span>
          ))}
        </div>
        <div className="field" style={{ marginTop: 18 }}>
          <label>Refeições por dia</label>
          <select
            value={form.refeicoes_dia}
            onChange={(e) => set("refeicoes_dia", e.target.value)}
          >
            <option value="recomendar">Recomendar (a IA decide)</option>
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} refeições
              </option>
            ))}
          </select>
        </div>
      </div>

      {previa && (
        <div className="card">
          <h2>Prévia das suas metas</h2>
          <div className="stats">
            <div className="stat">
              <div className="num">{previa.calorias}</div>
              <div className="lbl">kcal/dia</div>
            </div>
            <div className="stat">
              <div className="num">{previa.proteina_g}g</div>
              <div className="lbl">Proteína</div>
            </div>
            <div className="stat">
              <div className="num">{previa.carbo_g}g</div>
              <div className="lbl">Carboidrato</div>
            </div>
            <div className="stat">
              <div className="num">{previa.gordura_g}g</div>
              <div className="lbl">Gordura</div>
            </div>
            <div className="stat">
              <div className="num">{previa.imc}</div>
              <div className="lbl">IMC · {previa.classificacao_imc}</div>
            </div>
            <div className="stat">
              <div className="num">
                {previa.peso_ideal_min}–{previa.peso_ideal_max}
              </div>
              <div className="lbl">Peso ideal (kg)</div>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 4 }}>
            O IMC classifica seu peso atual; o peso ideal é a faixa saudável para
            a sua altura (referência, não meta rígida).
          </p>
        </div>
      )}

      <button
        className="btn"
        style={{ width: "100%", padding: 15 }}
        disabled={gerando}
      >
        {gerando && <span className="spinner" />}
        {gerando ? "Gerando seu plano com IA…" : "Gerar plano alimentar"}
      </button>
    </form>
  );
}
