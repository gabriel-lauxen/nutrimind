// Paletas de cor e tipografia — aplicadas via variáveis CSS no <html>.
// A escolha fica salva só no navegador (localStorage).

const PAL_KEY = "nm_palette";
const FONT_KEY = "nm_font";
const NUMFONT_KEY = "nm_numfont";
const MODE_KEY = "nm_mode";

export const PALETTES = [
  {
    id: "botanico",
    nome: "Esmeralda",
    dot: "#2f9e6a",
    vars: {
      "--accent": "#2b8c5e",
      "--accent-dark": "#1c6e48",
      "--accent-rgb": "43, 140, 94",
      "--accent-soft": "#dcefe4",
      "--header-grad":
        "linear-gradient(125deg, rgba(16,104,67,0.9), rgba(52,162,110,0.62))",
      // fundo animado: base clara + 3 manchas suaves que fluem
      "--bg-base": "#eef5ec",
      "--bg-g1": "rgba(70, 168, 120, 0.5)",
      "--bg-g2": "rgba(34, 124, 86, 0.42)",
      "--bg-g3": "rgba(224, 222, 150, 0.48)",
    },
  },
  {
    id: "oceano",
    nome: "Oceano",
    dot: "#2982ad",
    vars: {
      "--accent": "#2982ad",
      "--accent-dark": "#1a6088",
      "--accent-rgb": "41, 130, 173",
      "--accent-soft": "#dbeaf4",
      "--header-grad":
        "linear-gradient(125deg, rgba(16,82,118,0.9), rgba(52,148,190,0.62))",
      "--bg-base": "#e9f1f8",
      "--bg-g1": "rgba(60, 156, 220, 0.52)",
      "--bg-g2": "rgba(30, 104, 166, 0.44)",
      "--bg-g3": "rgba(150, 206, 232, 0.5)",
    },
  },
  {
    id: "ameixa",
    nome: "Ameixa",
    dot: "#8a55a6",
    vars: {
      "--accent": "#8a55a6",
      "--accent-dark": "#69407f",
      "--accent-rgb": "138, 85, 166",
      "--accent-soft": "#ece2f3",
      "--header-grad":
        "linear-gradient(125deg, rgba(96,52,122,0.9), rgba(158,96,186,0.62))",
      "--bg-base": "#f1e8f6",
      "--bg-g1": "rgba(186, 110, 212, 0.5)",
      "--bg-g2": "rgba(138, 72, 166, 0.42)",
      "--bg-g3": "rgba(236, 172, 222, 0.48)",
    },
  },
  {
    id: "coral",
    nome: "Coral",
    dot: "#db6048",
    vars: {
      "--accent": "#db6048",
      "--accent-dark": "#b0442f",
      "--accent-rgb": "219, 96, 72",
      "--accent-soft": "#f8e1d9",
      "--header-grad":
        "linear-gradient(125deg, rgba(168,52,36,0.9), rgba(226,108,82,0.62))",
      "--bg-base": "#f9ece5",
      "--bg-g1": "rgba(242, 138, 104, 0.52)",
      "--bg-g2": "rgba(212, 88, 62, 0.44)",
      "--bg-g3": "rgba(246, 202, 154, 0.5)",
    },
  },
  {
    id: "ambar",
    nome: "Âmbar",
    dot: "#c8922f",
    vars: {
      "--accent": "#c8922f",
      "--accent-dark": "#9d711f",
      "--accent-rgb": "200, 146, 47",
      "--accent-soft": "#f5ead0",
      "--header-grad":
        "linear-gradient(125deg, rgba(148,104,20,0.9), rgba(206,158,52,0.62))",
      "--bg-base": "#f7f0db",
      "--bg-g1": "rgba(228, 188, 78, 0.54)",
      "--bg-g2": "rgba(196, 148, 46, 0.46)",
      "--bg-g3": "rgba(238, 216, 140, 0.5)",
    },
  },
];

export const FONTS = [
  {
    id: "jakarta",
    nome: "Jakarta",
    vibe: "Moderna e neutra",
    css: '"Plus Jakarta Sans", sans-serif',
    vars: {
      "--font": '"Plus Jakarta Sans", system-ui, sans-serif',
      "--font-head": '"Plus Jakarta Sans", system-ui, sans-serif',
    },
  },
  {
    id: "editorial",
    nome: "Editorial",
    vibe: "Títulos com serifa orgânica",
    css: "Fraunces, serif",
    vars: {
      "--font": '"DM Sans", system-ui, sans-serif',
      "--font-head": '"Fraunces", Georgia, serif',
    },
  },
  {
    id: "geometrica",
    nome: "Geométrica",
    vibe: "Techy e precisa",
    css: '"Space Grotesk", sans-serif',
    vars: {
      "--font": '"Space Grotesk", system-ui, sans-serif',
      "--font-head": '"Space Grotesk", system-ui, sans-serif',
    },
  },
  {
    id: "arredondada",
    nome: "Arredondada",
    vibe: "Amigável e leve",
    css: "Nunito, sans-serif",
    vars: {
      "--font": '"Nunito", system-ui, sans-serif',
      "--font-head": '"Nunito", system-ui, sans-serif',
    },
  },
];

// Fonte só dos NÚMEROS dos macros (seletor provisório p/ experimentar)
export const NUMFONTS = [
  { id: "padrao", nome: "Padrão", css: "var(--font)", val: "" },
  {
    id: "grotesk",
    nome: "Grotesk",
    css: '"Space Grotesk", sans-serif',
    val: '"Space Grotesk", system-ui, sans-serif',
  },
  {
    id: "fraunces",
    nome: "Fraunces",
    css: "Fraunces, serif",
    val: '"Fraunces", Georgia, serif',
  },
  {
    id: "dmsans",
    nome: "DM Sans",
    css: '"DM Sans", sans-serif',
    val: '"DM Sans", system-ui, sans-serif',
  },
  {
    id: "nunito",
    nome: "Nunito",
    css: "Nunito, sans-serif",
    val: '"Nunito", system-ui, sans-serif',
  },
  {
    id: "mono",
    nome: "Mono",
    css: "ui-monospace, monospace",
    val: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
];

function applyVars(vars) {
  const r = document.documentElement.style;
  Object.entries(vars).forEach(([k, v]) => r.setProperty(k, v));
}

export function getPalette() {
  return localStorage.getItem(PAL_KEY) || PALETTES[0].id;
}
export function setPalette(id) {
  const p = PALETTES.find((x) => x.id === id) || PALETTES[0];
  applyVars(p.vars);
  localStorage.setItem(PAL_KEY, p.id);
}

export function getFont() {
  return localStorage.getItem(FONT_KEY) || FONTS[0].id;
}
export function setFont(id) {
  const f = FONTS.find((x) => x.id === id) || FONTS[0];
  applyVars(f.vars);
  localStorage.setItem(FONT_KEY, f.id);
}

export function getNumFont() {
  return localStorage.getItem(NUMFONT_KEY) || NUMFONTS[0].id;
}
export function setNumFont(id) {
  const f = NUMFONTS.find((x) => x.id === id) || NUMFONTS[0];
  const r = document.documentElement.style;
  if (f.val) r.setProperty("--font-num", f.val);
  else r.removeProperty("--font-num");
  localStorage.setItem(NUMFONT_KEY, f.id);
}

export function getMode() {
  return localStorage.getItem(MODE_KEY) === "dark" ? "dark" : "light";
}
export function setMode(m) {
  const mode = m === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-mode", mode);
  localStorage.setItem(MODE_KEY, mode);
}

// chamado no boot da app, antes de renderizar
export function applySavedTheme() {
  setPalette(getPalette());
  setFont(getFont());
  setNumFont(getNumFont());
  setMode(getMode());
}
