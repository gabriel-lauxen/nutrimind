// ============================================================================
// Cálculos nutricionais baseados em literatura científica.
// Referências:
//  - Mifflin MD, St Jeor ST et al. (1990) — equação de gasto energético basal.
//  - FAO/WHO/UNU — fatores de nível de atividade física (PAL).
//  - ISSN Position Stand: protein and exercise (Jäger et al., 2017) — 1.6–2.2 g/kg.
//  - Dietary Guidelines / OMS — distribuição de macronutrientes.
// ============================================================================

// Taxa Metabólica Basal (Mifflin-St Jeor)
export function calcularTMB({ sexo, peso, altura, idade }) {
  const base = 10 * peso + 6.25 * altura - 5 * idade;
  return sexo === "feminino" ? base - 161 : base + 5;
}

// Fatores de atividade (PAL) — FAO/WHO/UNU
export const FATOR_ATIVIDADE = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
};

export function calcularGET(dados) {
  return calcularTMB(dados) * (FATOR_ATIVIDADE[dados.nivel_atividade] || 1.2);
}

// Ajuste calórico por objetivo (déficit/superávit moderado e seguro)
export const AJUSTE_OBJETIVO = {
  emagrecer: -0.2,
  manter: 0,
  ganhar_massa: 0.1,
  saude: 0,
};

// Distribuição de macronutrientes por objetivo (proteína em g/kg)
export const MACROS_OBJETIVO = {
  emagrecer: { proteina_g_kg: 2.0, gordura_perc: 0.25 },
  ganhar_massa: { proteina_g_kg: 1.8, gordura_perc: 0.25 },
  manter: { proteina_g_kg: 1.6, gordura_perc: 0.3 },
  saude: { proteina_g_kg: 1.4, gordura_perc: 0.3 },
};

export function calcularPlanoNutricional(dados) {
  const tmb = calcularTMB(dados);
  const get = calcularGET(dados);
  const ajuste = AJUSTE_OBJETIVO[dados.objetivo] ?? 0;
  const calorias = Math.round(get * (1 + ajuste));

  const m = MACROS_OBJETIVO[dados.objetivo] || MACROS_OBJETIVO.manter;
  const proteina_g = Math.round(m.proteina_g_kg * dados.peso);
  const gordura_g = Math.round((calorias * m.gordura_perc) / 9);
  const kcal_prot = proteina_g * 4;
  const kcal_gord = gordura_g * 9;
  const carbo_g = Math.max(0, Math.round((calorias - kcal_prot - kcal_gord) / 4));

  const imc = dados.peso / Math.pow(dados.altura / 100, 2);
  const faixaPeso = pesoIdealFaixa(dados.altura);

  return {
    tmb: Math.round(tmb),
    get: Math.round(get),
    calorias,
    proteina_g,
    carbo_g,
    gordura_g,
    imc: Number(imc.toFixed(1)),
    classificacao_imc: classificarIMC(imc),
    peso_ideal_min: faixaPeso.min,
    peso_ideal_max: faixaPeso.max,
  };
}

function classificarIMC(imc) {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidade";
}

// Faixa de peso saudável (kg) a partir do IMC entre 18,5 e 24,9
export function pesoIdealFaixa(alturaCm) {
  const m2 = Math.pow(alturaCm / 100, 2);
  return { min: Math.round(18.5 * m2), max: Math.round(24.9 * m2) };
}

// Litros de água recomendados (~35 ml/kg)
export function aguaRecomendada(peso) {
  return Number(((peso * 35) / 1000).toFixed(1));
}
