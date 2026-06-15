import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  gerarListaCompras,
  editarListaPorComando,
  transcreverAudio,
  getGroqKey,
} from "../lib/groq.js";

function normalizar(lista) {
  if (!lista || !Array.isArray(lista.categorias)) return lista;
  return {
    ...lista,
    categorias: lista.categorias.map((c) => ({
      ...c,
      itens: (c.itens || []).map((it) => ({ marcado: false, ...it })),
    })),
  };
}

const IconMic = ({ on }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
    {on ? (
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
    ) : (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
      </>
    )}
  </svg>
);

const FAB_SIZE = 60;

// Botão de microfone flutuante e arrastável (posição salva no localStorage)
function FloatingMic({ recording, busy, onToggle }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const st = useRef({ active: false, moved: false, startX: 0, startY: 0, dx: 0, dy: 0, pos: null });

  function clamp(left, top) {
    const m = 8, w = window.innerWidth, h = window.innerHeight;
    return {
      left: Math.min(Math.max(m, left), w - FAB_SIZE - m),
      top: Math.min(Math.max(m, top), h - FAB_SIZE - m),
    };
  }

  useEffect(() => {
    let p = null;
    try { p = JSON.parse(localStorage.getItem("mic_fab_pos")); } catch { p = null; }
    if (!p || typeof p.left !== "number") {
      const w = window.innerWidth, h = window.innerHeight;
      // padrão: canto direito; no desktop folga maior, no mobile acima da bottom nav
      p = { left: w - FAB_SIZE - 20, top: h - FAB_SIZE - (w >= 880 ? 48 : 116) };
    }
    p = clamp(p.left, p.top);
    st.current.pos = p;
    setPos(p);
  }, []);

  function down(e) {
    const r = ref.current.getBoundingClientRect();
    const s = st.current;
    s.active = true; s.moved = false;
    s.startX = e.clientX; s.startY = e.clientY;
    s.dx = e.clientX - r.left; s.dy = e.clientY - r.top;
    ref.current.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    const s = st.current;
    if (!s.active) return;
    if (Math.abs(e.clientX - s.startX) + Math.abs(e.clientY - s.startY) > 6) s.moved = true;
    const np = clamp(e.clientX - s.dx, e.clientY - s.dy);
    s.pos = np;
    setPos(np);
  }
  function up() {
    const s = st.current;
    if (!s.active) return;
    s.active = false;
    if (s.moved) {
      localStorage.setItem("mic_fab_pos", JSON.stringify(s.pos));
    } else if (!busy) {
      onToggle();
    }
  }

  if (!pos) return null;
  return (
    <button
      ref={ref}
      className={`fab-mic ${recording ? "rec" : ""}`}
      style={{ left: pos.left, top: pos.top }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      aria-label={recording ? "Parar gravação" : "Falar comando"}
      title="Falar comando (arraste para mover)"
    >
      {busy ? <span className="fab-spin" /> : <IconMic on={recording} />}
    </button>
  );
}

function ListSkeleton() {
  return (
    <>
      <div className="card">
        <div className="skel" style={{ height: 24, width: "50%" }} />
        <div className="skel" style={{ height: 12, width: "85%", marginTop: 12 }} />
        <div className="skel" style={{ height: 40, marginTop: 16, borderRadius: 13 }} />
      </div>
      {[0, 1].map((c) => (
        <div className="card" key={c}>
          <div className="skel" style={{ height: 18, width: "35%" }} />
          {[0, 1, 2, 3].map((r) => (
            <div className="skel" key={r} style={{ height: 14, width: `${72 - r * 9}%`, marginTop: 16 }} />
          ))}
        </div>
      ))}
    </>
  );
}

export default function ShoppingList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const setErro = (m) => { if (m) toast(m, "error"); };
  const setChatMsg = (m) => { if (m) toast(m, "success"); };
  const filterRef = useRef(null);
  const [planoReg, setPlanoReg] = useState(null);
  const [lista, setLista] = useState(null);
  const [rowId, setRowId] = useState(null);
  const [dias, setDias] = useState(7);
  const [filtro, setFiltro] = useState("Todos");
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);

  const [chat, setChat] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [gravando, setGravando] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  // Troca de filtro sem deixar a tela pular (ancora a barra de filtros)
  function aplicarFiltro(f) {
    const bar = filterRef.current;
    const antes = bar ? bar.getBoundingClientRect().top : 0;
    setFiltro(f);
    requestAnimationFrame(() => {
      const depois = bar ? bar.getBoundingClientRect().top : 0;
      window.scrollBy(0, depois - antes);
    });
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      const id = localStorage.getItem("ultimo_plano_id");
      let q = supabase.from("meal_plans").select("*").eq("user_id", user.id);
      q = id ? q.eq("id", id) : q.order("created_at", { ascending: false }).limit(1);
      const { data } = await q.maybeSingle();
      setPlanoReg(data);
      if (data) {
        const { data: sl } = await supabase
          .from("shopping_lists").select("*")
          .eq("meal_plan_id", data.id)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (sl) {
          setLista(normalizar(sl.itens));
          setRowId(sl.id);
          if (sl.itens?.dias) setDias(sl.itens.dias);
        }
      }
      setCarregando(false);
    })();
  }, [user]);

  async function persistir(novaLista, novoRowId = rowId) {
    setLista(novaLista);
    if (novoRowId) {
      await supabase.from("shopping_lists").update({ itens: novaLista }).eq("id", novoRowId);
    } else if (planoReg) {
      const { data } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, meal_plan_id: planoReg.id, itens: novaLista })
        .select().single();
      if (data) setRowId(data.id);
    }
  }

  async function gerar() {
    setErro("");
    setChatMsg("");
    if (!getGroqKey()) return setErro("Configure sua chave da API Groq em Ajustes.");
    if (!planoReg) return;
    setGerando(true);
    try {
      const result = normalizar(await gerarListaCompras(planoReg.plano, Number(dias)));
      const { data } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, meal_plan_id: planoReg.id, itens: result })
        .select().single();
      setLista(result);
      setRowId(data?.id || null);
      setFiltro("Todos");
    } catch (err) {
      setErro(err.message || "Erro ao gerar a lista.");
    } finally {
      setGerando(false);
    }
  }

  function toggle(ci, ii) {
    const nova = {
      ...lista,
      categorias: lista.categorias.map((c, x) =>
        x !== ci ? c : { ...c, itens: c.itens.map((it, y) => (y !== ii ? it : { ...it, marcado: !it.marcado })) }
      ),
    };
    persistir(nova);
  }

  async function enviarComando(texto) {
    const comando = (texto ?? chat).trim();
    if (!comando) return;
    setErro("");
    setChatMsg("");
    if (!getGroqKey()) return setErro("Configure sua chave da API Groq em Ajustes.");
    setChatLoading(true);
    try {
      const result = normalizar(await editarListaPorComando({ lista, comando }));
      setChatMsg(result.mensagem || "Lista atualizada.");
      await persistir({ ...lista, categorias: result.categorias });
      setChat("");
    } catch (err) {
      setErro(err.message || "Erro ao processar o comando.");
    } finally {
      setChatLoading(false);
    }
  }

  async function alternarGravacao() {
    if (gravando) {
      mediaRef.current?.stop();
      return;
    }
    if (!getGroqKey()) return setErro("Configure sua chave da API Groq em Ajustes.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
        (m) => window.MediaRecorder?.isTypeSupported?.(m)
      );
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setGravando(false);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setChatLoading(true);
        try {
          const texto = await transcreverAudio(blob);
          if (texto) {
            setChat(texto);
            await enviarComando(texto);
          } else {
            setErro("Não consegui entender o áudio. Tente de novo.");
          }
        } catch (err) {
          setErro(err.message || "Erro na transcrição.");
        } finally {
          setChatLoading(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setGravando(true);
    } catch {
      setErro("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }

  if (carregando) return <ListSkeleton />;

  if (!planoReg)
    return (
      <div className="card">
        <h2>Gere um plano primeiro</h2>
        <p className="subtitle">A lista de compras é montada a partir do seu plano alimentar.</p>
        <button className="btn" onClick={() => navigate("/ajustes")}>Ir para Configurações</button>
      </div>
    );

  const filtros = lista ? ["Todos", ...lista.categorias.map((c) => c.nome)] : [];

  return (
    <>
      <div className="card">
        <h2>Lista de compras</h2>
        <p className="subtitle">Gerada por IA a partir do seu plano e organizada por setor do mercado.</p>
        <label>Período</label>
        <div className="controls-row">
          <select className="slim" value={dias} onChange={(e) => setDias(e.target.value)}>
            <option value={1}>1 dia</option>
            <option value={3}>3 dias</option>
            <option value={7}>7 dias (semana)</option>
            <option value={15}>15 dias</option>
            <option value={30}>30 dias</option>
          </select>
          <button className="btn btn-slim" onClick={gerar} disabled={gerando}>
            {gerando && <span className="spinner" />}
            {lista ? "Gerar novamente" : "Gerar lista"}
          </button>
        </div>
      </div>

      {lista && (
        <div className="card assist-card">
          <h2>Assistente da lista</h2>
          <p className="subtitle">
            Peça por texto ou voz: “adicione maçã”, “marque banana”, “tira o leite”, “sugira frutas da estação”.
          </p>
          <textarea
            className="assist-input"
            rows={3}
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder={gravando ? "Ouvindo… fale agora" : "Escreva um comando para a lista…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarComando();
              }
            }}
            disabled={chatLoading || gravando}
          />
          <div className="assist-actions">
            <span className="muted assist-hint">Ou use o microfone flutuante 🎤 (arraste para reposicionar).</span>
            <button className="btn assist-send" onClick={() => enviarComando()} disabled={chatLoading || gravando}>
              {chatLoading ? <span className="spinner" /> : "Enviar"}
            </button>
          </div>
        </div>
      )}

      {lista && (
        <div className="filter-bar filter-scroll" ref={filterRef}>
          {filtros.map((f) => (
            <span key={f} className={`chip ${filtro === f ? "selected" : ""}`} onClick={() => aplicarFiltro(f)}>
              {f}
            </span>
          ))}
        </div>
      )}

      {lista && lista.categorias
        .map((cat, ci) => ({ cat, ci }))
        .filter(({ cat }) => filtro === "Todos" || cat.nome === filtro)
        .map(({ cat, ci }) => (
          <div className="card" key={ci}>
            <h2 style={{ fontSize: "1.12rem" }}>{cat.nome}</h2>
            <ul className="checklist">
              {(cat.itens || []).map((it, j) => (
                <li key={j} style={{ opacity: it.marcado ? 0.55 : 1 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", width: "100%", fontWeight: 400, marginBottom: 0 }}>
                    <input type="checkbox" checked={!!it.marcado} onChange={() => toggle(ci, j)} />
                    <span>
                      <span style={{ textDecoration: it.marcado ? "line-through" : "none" }}>{it.item}</span>
                      {it.quantidade && <span className="muted"> — {it.quantidade}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {!lista && !gerando && (
        <p className="muted center">Clique em “Gerar lista” para montar suas compras.</p>
      )}

      {lista && (
        <FloatingMic recording={gravando} busy={chatLoading} onToggle={alternarGravacao} />
      )}
    </>
  );
}
