import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { chatNutricao, getGroqKey } from "../lib/groq.js";

const SUGESTOES = [
  "Quanta proteína eu preciso por dia?",
  "O que comer antes do treino?",
  "Como reduzir o açúcar da dieta?",
  "Quais lanches saudáveis para a tarde?",
];

// Mini renderizador de Markdown (negrito, itálico, código, links, listas,
// títulos) — sem dependências. Escapa HTML antes de aplicar a formatação.
function mdToHtml(src) {
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(
        /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      );
  const lines = (src || "").replace(/\r/g, "").split("\n");
  let html = "";
  let list = null; // 'ul' | 'ol'
  const closeList = () => {
    if (list) {
      html += `</${list}>`;
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    let m;
    if ((m = line.match(/^\s*[-*+]\s+(.*)/))) {
      if (list !== "ul") {
        closeList();
        html += "<ul>";
        list = "ul";
      }
      html += `<li>${inline(m[1])}</li>`;
    } else if ((m = line.match(/^\s*\d+\.\s+(.*)/))) {
      if (list !== "ol") {
        closeList();
        html += "<ol>";
        list = "ol";
      }
      html += `<li>${inline(m[1])}</li>`;
    } else if ((m = line.match(/^\s*#{1,6}\s+(.*)/))) {
      closeList();
      html += `<p class="md-h">${inline(m[1])}</p>`;
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

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
          {mensagens.map((m, i) =>
            m.role === "assistant" ? (
              <div
                key={i}
                className="chat-bubble assistant md"
                dangerouslySetInnerHTML={{ __html: mdToHtml(m.content) }}
              />
            ) : (
              <div key={i} className="chat-bubble user">{m.content}</div>
            ),
          )}
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
