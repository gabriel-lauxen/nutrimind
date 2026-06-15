import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useToast } from "../context/ToastContext.jsx";
import { getGroqKey, setGroqKey, getGroqModel, setGroqModel } from "../lib/groq.js";
import {
  PALETTES,
  FONTS,
  NUMFONTS,
  getPalette,
  setPalette,
  getFont,
  setFont,
  getNumFont,
  setNumFont,
  getMode,
  setMode,
} from "../lib/theme.js";
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
  const [palette, setPaletteSel] = useState(getPalette());
  const [font, setFontSel] = useState(getFont());
  const [numFont, setNumFontSel] = useState(getNumFont());
  const [mode, setModeSel] = useState(getMode());

  function escolherModo(m) {
    setMode(m);
    setModeSel(m);
  }

  function escolherPaleta(id) {
    setPalette(id);
    setPaletteSel(id);
  }
  function escolherFonte(id) {
    setFont(id);
    setFontSel(id);
  }
  function escolherNumFonte(id) {
    setNumFont(id);
    setNumFontSel(id);
  }

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
      <div className="card config-card">
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
              Crie uma chave gratuita em{" "}
              <a
                className="link-groq"
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                console.groq.com → API Keys
              </a>
              .
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

      {/* Aparência: paleta de cores + tipografia */}
      <div className="card config-card">
        <h2>Aparência</h2>
        <p className="subtitle">
          Escolha o tema, a paleta de cores e a tipografia do app. As mudanças
          são aplicadas na hora.
        </p>

        <div className="field">
          <label>Tema</label>
          <div className="mode-row">
            <button
              type="button"
              className={`mode-opt${mode === "light" ? " selected" : ""}`}
              onClick={() => escolherModo("light")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              Claro
            </button>
            <button
              type="button"
              className={`mode-opt${mode === "dark" ? " selected" : ""}`}
              onClick={() => escolherModo("dark")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
              Escuro
            </button>
          </div>
        </div>

        <div className="field">
          <label>Paleta de cores</label>
          <div className="palette-row">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`palette-dot${palette === p.id ? " selected" : ""}`}
                style={{ "--dot": p.dot }}
                onClick={() => escolherPaleta(p.id)}
                title={p.nome}
                aria-label={p.nome}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>Tipografia</label>
          <div className="font-grid">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`font-opt${font === f.id ? " selected" : ""}`}
                onClick={() => escolherFonte(f.id)}
              >
                <span className="font-opt-aa" style={{ fontFamily: f.css }}>
                  Aa
                </span>
                <span className="font-opt-nome">{f.nome}</span>
                <span className="font-opt-vibe">{f.vibe}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Fonte dos números dos macros (provisório)</label>
          <div className="numfont-row">
            {NUMFONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`numfont-opt${numFont === f.id ? " selected" : ""}`}
                onClick={() => escolherNumFonte(f.id)}
              >
                <span className="numfont-num" style={{ fontFamily: f.css }}>123</span>
                <span className="numfont-nome">{f.nome}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questionário + geração do plano */}
      <Questionnaire />
    </>
  );
}
