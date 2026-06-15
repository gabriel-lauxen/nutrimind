import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { chatNutricao, getGroqKey } from "../lib/groq.js";

const SUGESTOES = [
  "Quanta proteína eu preciso por dia?",
  "O que comer antes do treino?",
  "Como reduzir o açúcar da dieta?",
  "Quais lanches saudáveis para a tarde?",
];

export default function Chat() {
  const toast = useToast();
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fimRef = useRef(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, loading]);

  async function enviar(texto) {
    const msg = (texto ?? input).trim();
    if (!msg || loading) return;
    if (!getGroqKey()) {
      toast("Configure sua chave da API Groq em Configurações.", "error");
      return;
    }
    const novas = [...mensagens, { role: "user", content: msg }];
    setMensagens(novas);
    setInput("");
    setLoading(true);
    try {
      const resposta = await chatNutricao(novas);
      setMensagens((m) => [...m, { role: "assistant", content: resposta }]);
    } catch (err) {
      toast(err.message || "Erro ao responder.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-page">
      {mensagens.length === 0 ? (
        <div className="chat-empty">
          <div className="chat-empty-ic">🥗</div>
          <h2>Tire dúvidas sobre nutrição com nosso agente de IA treinado</h2>
          <p className="muted">
            Pergunte sobre alimentação, dietas, macronutrientes, receitas saudáveis e bem-estar.
          </p>
          <div className="chat-sugestoes">
            {SUGESTOES.map((s) => (
              <span key={s} className="chip" onClick={() => enviar(s)}>{s}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-messages">
          {mensagens.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
          ))}
          {loading && (
            <div className="chat-bubble assistant chat-typing">
              <span className="spinner" /> Pensando…
            </div>
          )}
          <div ref={fimRef} />
        </div>
      )}

      <div className="chat-input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva sua dúvida sobre nutrição…"
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          disabled={loading}
        />
        <button className="btn" onClick={() => enviar()} disabled={loading}>
          {loading ? <span className="spinner" /> : "Enviar"}
        </button>
      </div>
    </div>
  );
}
