# 🥗 NutriMind — Protótipo (React + Vite + Supabase + Groq)

Protótipo do app de alimentação saudável com IA (TCC ADS): questionário nutricional
baseado em evidências, geração de **plano alimentar** e **lista de compras** com IA
(Groq), agente conversacional por voz e PWA com tela cheia no iPhone.

## Funcionalidades
- Login/cadastro (Supabase Auth).
- Questionário (TMB Mifflin-St Jeor, fator de atividade, macros por objetivo, IMC e peso ideal).
- Plano alimentar com 2–3 opções por refeição + geração de prato personalizado.
- Filtros em chips por refeição (Plano) e por categoria (Lista de compras).
- Lista de compras com assistente conversacional (texto ou **voz** via Whisper/Groq):
  “adicione maçã”, “marque banana”, “sugira frutas da estação”.
- UI moderna: header verde liquid-glass, app bar lateral (desktop) e bottom nav (mobile).
- PWA instalável e tela cheia no iPhone.

## Pré-requisitos
- Node.js 18+ e npm.
- Conta no [Supabase](https://supabase.com) e chave da API do [Groq](https://console.groq.com).

## 1. Supabase
1. Crie um projeto e rode o conteúdo de [`supabase_schema.sql`](./supabase_schema.sql) no SQL Editor.
2. (Opcional) Desative "Confirm email" em Authentication → Providers → Email para testes.
3. Copie a **Project URL** e a **publishable key** em Project Settings → API Keys.

## 2. `.env`
Crie um `.env` (modelo em `.env.example`). Prefixo `VITE_` obrigatório:
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

## 3. Rodar
```bash
npm install
npm run dev
```
Em **Ajustes**, cole sua chave da API Groq (fica só no navegador).

## Testar o PWA no iPhone (HTTPS via ngrok)
O dev server já libera túneis ngrok (`vite.config.js`). Em outro terminal:
```bash
npm run tunnel        # ngrok http 5173
```
Abra a URL `https://...ngrok...` no Safari do iPhone → Compartilhar → "Adicionar à Tela de Início".

## Estrutura
```
src/
  lib/        supabase.js · nutrition.js · groq.js
  context/    AuthContext.jsx
  pages/      Login · Questionnaire · MealPlan · ShoppingList · Settings
  App.jsx     Rotas + sidebar + header glass + bottom nav
public/       manifest, service worker, ícones
supabase_schema.sql
```

Protótipo acadêmico — o conteúdo gerado pela IA é sugestão e não substitui um nutricionista.
