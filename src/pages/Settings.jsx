import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useToast } from "../context/ToastContext.jsx";
import { getGroqKey, setGroqKey, getGroqModel, setGroqModel } from "../lib/groq.js";
import Questionnaire from "./Questionnaire.jsx";

const MODELOS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
];

export default function Settings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [key, setKey] = useState(getGroqKey());
  const [model, setModel] = useState(getGroqModel());

  function salvar(e) {
    e.preventDefault();
    setGroqKey(key);
    setGroqModel(model);
    toast("Configurações salvas!", "success");
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <>
      <div className="card">
        <div className="row-between">
          <h2>Configurações</h2>
          <button className="btn-sair" onClick={sair}>Sair</button>
        </div>
        <p className="subtitle">
          Cole sua chave da API do Groq. Ela fica salva apenas no seu navegador
          (localStorage) e nunca é enviada ao banco de dados.
        </p>


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

          <button className="btn">Salvar configurações</button>
        </form>
      </div>

      {/* Questionário + geração do plano */}
      <Questionnaire />
    </>
  );
}
