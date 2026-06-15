import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) navigate("/");

  async function submit(e) {
    e.preventDefault();
    setErro("");
    setInfo("");
    setCarregando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        setInfo("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada. Caso contrário, já pode entrar.");
        setModo("login");
      }
    } catch (err) {
      setErro(err.message || "Erro ao autenticar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>🥗 NutriMind</h1>
        <p className="center muted" style={{ marginBottom: 22 }}>
          Corpo e mente em equilíbrio, com inteligência artificial
        </p>

        {erro && <div className="alert alert-error">{erro}</div>}
        {info && <div className="alert alert-info">{info}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="voce@email.com" />
          </div>
          <div className="field">
            <label>Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} placeholder="mínimo 6 caracteres" />
          </div>
          <button className="btn" style={{ width: "100%" }} disabled={carregando}>
            {carregando && <span className="spinner" />}
            {modo === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="center muted" style={{ marginTop: 18 }}>
          {modo === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setErro("");
              setInfo("");
              setModo(modo === "login" ? "cadastro" : "login");
            }}
          >
            {modo === "login" ? "Cadastre-se" : "Entrar"}
          </a>
        </p>
      </div>
    </div>
  );
}
