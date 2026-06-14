# 🥗 NutriMind — Protótipo (React + Vite + Supabase + Groq)

Protótipo do aplicativo do TCC: questionário nutricional baseado em evidências,
geração de **plano alimentar** com IA (Groq) e **lista de compras** automática.
Paleta verde, login por e-mail/senha (Supabase Auth).

## Funcionalidades
- Login e cadastro (Supabase Auth).
- Questionário com peso, altura, idade, sexo, nível de atividade e objetivo da dieta.
- Cálculo automático de metas (TMB Mifflin-St Jeor, fator de atividade, macros por objetivo).
- Geração de plano alimentar com **2–3 opções de prato por refeição** via IA.
- Página de **lista de compras** categorizada por setor do mercado, com checkboxes.
- Chave da API Groq salva **apenas no navegador** (localStorage).

## Pré-requisitos
- Node.js 18+ e npm.
- Uma conta no [Supabase](https://supabase.com).
- Uma chave da API do [Groq](https://console.groq.com) (gratuita).

## 1. Configurar o Supabase
1. Crie um projeto no Supabase.
2. No menu **SQL Editor**, cole e execute o conteúdo de [`supabase_schema.sql`](./supabase_schema.sql).
   Isso cria as tabelas `profiles`, `meal_plans`, `shopping_lists` e as políticas de segurança (RLS).
3. (Opcional) Em **Authentication → Providers → Email**, desative "Confirm email"
   para conseguir logar de imediato durante os testes.
4. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## 2. Configurar o `.env`
Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`).
Use a **publishable key** (Project Settings → API Keys). O prefixo `VITE_` é
obrigatório — este projeto usa Vite, então `NEXT_PUBLIC_` **não** funciona.

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

## 3. Rodar o projeto
```bash
npm install
npm run dev
```
Abra o endereço exibido (ex.: http://localhost:5173).

## 4. Usar
1. Crie uma conta e faça login.
2. Vá em **Ajustes** e cole sua **chave da API Groq**.
3. Preencha o **Questionário** e clique em *Gerar plano alimentar*.
4. Veja o plano em **Plano** e gere sua **Lista de compras**.

## Estrutura
```
src/
  lib/
    supabase.js     Cliente Supabase
    nutrition.js    Cálculos (TMB, GET, macros, IMC) — baseados em literatura
    groq.js         Integração Groq + prompts estruturados de dieta e compras
  context/AuthContext.jsx
  pages/
    Login.jsx
    Settings.jsx        Chave da API Groq
    Questionnaire.jsx   Anamnese + prévia das metas
    MealPlan.jsx        Plano alimentar com opções de prato
    ShoppingList.jsx    Lista de compras categorizada
  App.jsx               Rotas + navbar
supabase_schema.sql     Script para criar o banco
```

## Observações
- Protótipo acadêmico: o plano gerado pela IA é uma sugestão e **não substitui** a
  orientação de um nutricionista.
- A chave Groq nunca é enviada ao Supabase — fica só no `localStorage` do navegador.
