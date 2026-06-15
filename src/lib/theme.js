// Paletas de cor e tipografia — aplicadas via variáveis CSS no <html>.
// A escolha fica salva só no navegador (localStorage).

const PAL_KEY = "nm_palette";
const FONT_KEY = "nm_font";
const NUMFONT_KEY = "nm_numfont";

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
    dot: "#2b86c4",
    vars: {
      "--accent": "#2b86c4",
      "--accent-dark": "#1c6196",
      "--accent-rgb": "43, 134, 196",
      "--accent-soft": "#dcebf7",
      "--header-grad":
        "linear-gradient(125deg, rgba(18,84,140,0.9), rgba(54,154,214,0.62))",
      "--bg-base": "#e9f1f8",
      "--bg-g1": "rgba(60, 156, 220, 0.52)",
      "--bg-g2": "rgba(30, 104, 166, 0.44)",
      "--bg-g3": "rgba(150, 206, 232, 0.5)",
    },
  },
  {
    id: "ameixa",
    nome: "Ameixa",
    dot: "#9b4fb0",
    vars: {
      "--accent": "#9b4fb0",
      "--accent-dark": "#743a88",
      "--accent-rgb": "155, 79, 176",
      "--accent-soft": "#f0e3f5",
      "--header-grad":
        "linear-gradient(125deg, rgba(104,48,128,0.9), rgba(172,92,196,0.62))",
      "--bg-base": "#f1e8f6",
      "--bg-g1": "rgba(186, 110, 212, 0.5)",
      "--bg-g2": "rgba(138, 72, 166, 0.42)",
      "--bg-g3": "rgba(236, 172, 222, 0.48)",
    },
  },
  {
    id: "coral",
    nome: "Coral",
    dot: "#e0644c",
    vars: {
      "--accent": "#e0644c",
      "--accent-dark": "#b3452f",
      "--accent-rgb": "224, 100, 76",
      "--accent-soft": "#f9e1da",
      "--header-grad":
        "linear-gradient(125deg, rgba(174,54,38,0.9), rgba(234,114,88,0.62))",
      "--bg-base": "#f9ece5",
      "--bg-g1": "rgba(242, 138, 104, 0.52)",
      "--bg-g2": "rgba(212, 88, 62, 0.44)",
      "--bg-g3": "rgba(246, 202, 154, 0.5)",
    },
  },
  {
    id: "ambar",
    nome: "Âmbar",
    dot: "#d09b2c",
    vars: {
      "--accent": "#d09b2c",
      "--accent-dark": "#a4781d",
      "--accent-rgb": "208, 155, 44",
      "--accent-soft": "#f6ecd2",
      "--header-grad":
        "linear-gradient(125deg, rgba(156,110,20,0.9), rgba(216,168,58,0.62))",
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

// chamado no boot da app, antes de renderizar
export function applySavedTheme() {
  setPalette(getPalette());
  setFont(getFont());
  setNumFont(getNumFont());
}
