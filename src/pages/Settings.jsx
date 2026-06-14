import { useState } from "react";
import { getGroqKey, setGroqKey, getGroqModel, setGroqModel } from "../lib/groq.js";

const MODELOS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
];

export default function Settings() {
  const [key, setKey] = useState(getGroqKey());
  const [model, setModel] = useState(getGroqModel());
  const [salvo, setSalvo] = useState(false);

  function salvar(e) {
    e.preventDefault();
    setGroqKey(key);
    setGroqModel(model);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="card">
      <h2>Ajustes</h2>
      <p className="subtitle">
        Cole aqui sua chave da API do Groq. Ela fica salva apenas no seu navegador
        (localStorage) e nunca é enviada ao banco de dados.
      </p>

      {salvo && <div className="alert alert-info">Configurações salvas!</div>}

      <form onSubmit={salvar}>
        <div className="field">
          <label>Chave da API Groq</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="gsk_..."
            autoComplete="off"
          />
          <p className="muted" style={{ marginTop: 6 }}>
            Crie uma chave gratuita em console.groq.com → API Keys.
          </p>
        </div>

        <div className="field">
          <label>Modelo</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button className="btn">Salvar</button>
      </form>
    </div>
  );
}
