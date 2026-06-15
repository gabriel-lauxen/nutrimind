// ============================================================================
// Integração com a API do Groq (endpoint compatível com OpenAI).
// A chave é lida do localStorage (configurada pelo usuário na tela Ajustes).
// ============================================================================

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELO_PADRAO = "llama-3.3-70b-versatile";

export function getGroqKey() {
  return localStorage.getItem("groq_api_key") || "";
}
export function setGroqKey(key) {
  localStorage.setItem("groq_api_key", key.trim());
}
export function getGroqModel() {
  return localStorage.getItem("groq_model") || MODELO_PADRAO;
}
export function setGroqModel(model) {
  localStorage.setItem("groq_model", model);
}

const LABEL_OBJETIVO = {
  emagrecer: "perda de peso (emagrecimento)",
  ganhar_massa: "ganho de massa muscular (hipertrofia)",
  manter: "manutenção do peso",
  saude: "melhora da saúde geral e bem-estar",
};
const LABEL_ATIVIDADE = {
  sedentario: "sedentário",
  leve: "levemente ativo",
  moderado: "moderadamente ativo",
  intenso: "muito ativo",
};

// ----------------------------------------------------------------------------
// Prompt clínico, estruturado e baseado em evidências para o plano alimentar
// ----------------------------------------------------------------------------
export function montarPromptDieta(dados, nutri) {
  const restricoes =
    dados.restricoes && dados.restricoes.length
      ? dados.restricoes.join(", ")
      : "nenhuma restrição informada";

  const recomendar = dados.refeicoes_dia === "recomendar";
  const refeicoesPerfil = recomendar
    ? "não definido — você deve recomendar o número ideal de refeições (entre 3 e 6) com base no perfil, na rotina e no objetivo do paciente"
    : `${dados.refeicoes_dia}`;
  const refeicoesInstrucao = recomendar
    ? "Defina o número ideal de refeições (entre 3 e 6) para este paciente e distribua as calorias e macros de forma equilibrada entre elas, explicando brevemente a escolha no campo observação"
    : `Distribua as calorias e macros de forma equilibrada entre as ${dados.refeicoes_dia} refeições`;

  return `Você é um nutricionista clínico experiente, baseando-se em diretrizes científicas atuais (Mifflin-St Jeor para gasto energético, recomendações de proteína da ISSN de 1,6 a 2,2 g/kg, diretrizes da OMS e do Guia Alimentar para a População Brasileira). Elabore um plano alimentar diário personalizado, prático e culturalmente adequado ao Brasil.

PERFIL DO PACIENTE
- Idade: ${dados.idade} anos
- Sexo: ${dados.sexo}
- Peso: ${dados.peso} kg
- Altura: ${dados.altura} cm
- IMC: ${nutri.imc} (${nutri.classificacao_imc})
- Nível de atividade física: ${LABEL_ATIVIDADE[dados.nivel_atividade]}
- Objetivo principal: ${LABEL_OBJETIVO[dados.objetivo]}
- Restrições/preferências alimentares: ${restricoes}
- Refeições por dia desejadas: ${refeicoesPerfil}

METAS NUTRICIONAIS JÁ CALCULADAS (use-as como alvo, não recalcule)
- Meta calórica diária: ${nutri.calorias} kcal
- Proteína: ${nutri.proteina_g} g/dia
- Carboidratos: ${nutri.carbo_g} g/dia
- Gorduras: ${nutri.gordura_g} g/dia

INSTRUÇÕES
1. ${refeicoesInstrucao}.
2. Para CADA refeição, ofereça 2 a 3 OPÇÕES de pratos equivalentes em calorias, para dar variedade.
3. Priorize alimentos in natura e minimamente processados, acessíveis no Brasil; evite ultraprocessados.
4. Respeite rigorosamente as restrições alimentares informadas.
5. Inclua porções aproximadas e a estimativa de calorias e macros por opção.
6. Dê uma dica prática alinhada ao objetivo do paciente.

Responda EXCLUSIVAMENTE em JSON válido, sem texto fora do JSON, no formato:
{
  "resumo": {
    "objetivo": "string",
    "calorias_alvo": number,
    "proteina_g": number,
    "carbo_g": number,
    "gordura_g": number,
    "observacao": "string"
  },
  "refeicoes": [
    {
      "nome": "string (ex: Café da manhã)",
      "horario_sugerido": "string (ex: 07:00)",
      "opcoes": [
        {
          "prato": "string",
          "ingredientes": ["string com quantidade, ex: 2 ovos"],
          "calorias": number,
          "proteina_g": number,
          "carbo_g": number,
          "gordura_g": number
        }
      ]
    }
  ],
  "dica": "string"
}`;
}

export function montarPromptListaCompras(plano, dias = 7) {
  return `Com base no plano alimentar diário abaixo (em JSON), gere uma LISTA DE COMPRAS consolidada para ${dias} dias, somando as quantidades de todas as opções de pratos e organizando por categorias de supermercado.

PLANO ALIMENTAR:
${JSON.stringify(plano)}

Responda EXCLUSIVAMENTE em JSON válido no formato:
{
  "dias": ${dias},
  "categorias": [
    {
      "nome": "string (ex: Hortifrúti, Proteínas, Grãos e cereais, Laticínios, Outros)",
      "itens": [
        { "item": "string", "quantidade": "string (ex: 1 kg, 12 unidades)" }
      ]
    }
  ]
}`;
}

// Extrai uma mensagem de erro amigável do corpo da resposta (sem JSON cru)
async function msgErro(resp, fallback) {
  try {
    const j = await resp.json();
    const m = j?.error?.message;
    if (m && !/could not process file|invalid media/i.test(m)) return m;
  } catch {
    /* corpo não-JSON: usa o fallback */
  }
  return fallback;
}

async function chamarGroqJSON(prompt) {
  const key = getGroqKey();
  if (!key) {
    throw new Error("Chave da API Groq não configurada. Vá em Ajustes e cole sua chave.");
  }

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: getGroqModel(),
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista que responde sempre em JSON válido, em português do Brasil.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    throw new Error(await msgErro(resp, "Não consegui falar com a IA agora. Tente novamente."));
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("A IA não retornou um JSON válido. Tente novamente.");
  }
}

export function gerarPlanoAlimentar(dados, nutri) {
  return chamarGroqJSON(montarPromptDieta(dados, nutri));
}

export function gerarListaCompras(plano, dias = 7) {
  return chamarGroqJSON(montarPromptListaCompras(plano, dias));
}

// ----------------------------------------------------------------------------
// Chat de dúvidas de nutrição (agente nutricionista)
// ----------------------------------------------------------------------------
const SISTEMA_NUTRI =
  "Você é o assistente nutricionista virtual do app NutriMind: experiente, acolhedor e didático. " +
  "Responda dúvidas sobre nutrição, alimentação saudável, dietas, macronutrientes, receitas e bem-estar " +
  "de forma clara, prática e baseada em evidências, sempre em português do Brasil. Seja conciso e amigável, " +
  "use exemplos do dia a dia e do contexto brasileiro. Quando fizer sentido, lembre gentilmente que você não " +
  "substitui o acompanhamento de um nutricionista. Não faça diagnósticos nem prescreva tratamento para doenças; " +
  "nesses casos, oriente procurar um profissional de saúde.";

export async function chatNutricao(historico) {
  const key = getGroqKey();
  if (!key) throw new Error("Configure sua chave Groq em Ajustes.");

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: getGroqModel(),
      temperature: 0.6,
      messages: [{ role: "system", content: SISTEMA_NUTRI }, ...historico],
    }),
  });
  if (!resp.ok) {
    throw new Error(await msgErro(resp, "Não consegui responder agora. Tente novamente."));
  }
  const data = await resp.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}

// ----------------------------------------------------------------------------
// Prato personalizado para uma refeição específica, batendo os macros da dieta
// ----------------------------------------------------------------------------
export function montarPromptPratoPersonalizado({ refeicaoNome, preferencia, alvo, restricoes }) {
  const restr = restricoes && restricoes.length ? restricoes.join(", ") : "nenhuma";
  return `Você é um nutricionista. Monte UMA opção de prato para a refeição "${refeicaoNome}" levando em conta o que o paciente gosta/pediu: "${preferencia}".

O prato deve se aproximar destas metas nutricionais desta refeição:
- Calorias: ~${alvo.calorias} kcal
- Proteína: ~${alvo.proteina_g} g
- Carboidratos: ~${alvo.carbo_g} g
- Gorduras: ~${alvo.gordura_g} g

Restrições/preferências alimentares a respeitar: ${restr}.

Regras: ajuste as PORÇÕES dos ingredientes para bater nas metas; use alimentos acessíveis no Brasil; informe quantidades. Se o pedido do paciente for incompatível com as metas ou restrições, faça a adaptação mais próxima possível e mantenha-se saudável.

Responda EXCLUSIVAMENTE em JSON válido no formato:
{
  "prato": "string",
  "ingredientes": ["string com quantidade"],
  "calorias": number,
  "proteina_g": number,
  "carbo_g": number,
  "gordura_g": number
}`;
}

export function gerarPratoPersonalizado(args) {
  return chamarGroqJSON(montarPromptPratoPersonalizado(args));
}

// ----------------------------------------------------------------------------
// Agente da lista de compras: aplica um comando em linguagem natural ao JSON
// ----------------------------------------------------------------------------
export function montarPromptEditarLista({ lista, comando }) {
  return `Você é um assistente que gerencia uma lista de compras em JSON. Aplique o comando do usuário e retorne a LISTA COMPLETA atualizada, além de uma mensagem curta e amigável de confirmação.

Tipos de comando que você deve entender (em português):
- Adicionar item (ex: "adicione maçã", "põe 1kg de arroz") → inclua na categoria mais adequada (Hortifrúti, Proteínas, Grãos e cereais, Laticínios, Outros).
- Remover item (ex: "tira a banana", "remove o leite").
- Marcar item como comprado (ex: "marque banana") → defina "marcado": true.
- Desmarcar (ex: "desmarque banana") → "marcado": false.
- Marcar/limpar tudo, renomear, alterar quantidade.
- Sugerir itens (ex: "sugira frutas da estação", "o que falta para uma salada?") → adicione itens coerentes e cite-os na mensagem.

Encontre itens por nome aproximado (ignore acentos/maiúsculas). Mantenha os itens não afetados como estão. Toda a estrutura deve ser preservada.

COMANDO DO USUÁRIO: "${comando}"

LISTA ATUAL (JSON):
${JSON.stringify(lista)}

Responda EXCLUSIVAMENTE em JSON válido no formato:
{
  "mensagem": "string curta confirmando o que foi feito",
  "categorias": [
    { "nome": "string", "itens": [ { "item": "string", "quantidade": "string", "marcado": boolean } ] }
  ]
}`;
}

export function editarListaPorComando(args) {
  return chamarGroqJSON(montarPromptEditarLista(args));
}

// ----------------------------------------------------------------------------
// Transcrição de áudio (voz) via Whisper no Groq
// ----------------------------------------------------------------------------
export async function transcreverAudio(blob) {
  const key = getGroqKey();
  if (!key) throw new Error("Configure sua chave Groq em Ajustes.");

  if (!blob || blob.size < 1200) {
    throw new Error("Gravação muito curta. Toque no microfone, fale e toque de novo para enviar.");
  }

  const ext = blob.type.includes("mp4")
    ? "mp4"
    : blob.type.includes("ogg")
      ? "ogg"
      : "webm";

  const form = new FormData();
  form.append("file", blob, `comando.${ext}`);
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "pt");
  form.append("response_format", "json");

  const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!resp.ok) {
    throw new Error(await msgErro(resp, "Não consegui entender o áudio. Tente gravar de novo."));
  }
  const data = await resp.json();
  return (data.text || "").trim();
}
