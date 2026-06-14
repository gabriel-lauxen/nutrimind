-- =============================================================
-- Schema do protótipo "Bem Estar do Corpo e da Mente"
-- Execute no SQL Editor do Supabase (uma vez).
-- =============================================================

-- Perfil/anamnese do usuário (1 por usuário)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  idade int,
  sexo text,
  peso numeric,            -- kg
  altura numeric,          -- cm
  nivel_atividade text,    -- sedentario | leve | moderado | intenso
  objetivo text,           -- emagrecer | ganhar_massa | manter | saude
  restricoes text[],       -- ex: {vegetariano, sem_lactose}
  refeicoes_dia int,
  updated_at timestamptz default now()
);

-- Planos alimentares gerados pela IA
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text,
  plano jsonb not null,    -- estrutura completa retornada pela IA
  created_at timestamptz default now()
);

-- Listas de compras geradas a partir de um plano
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,
  itens jsonb not null,
  created_at timestamptz default now()
);

-- =============================================================
-- Row Level Security: cada usuário só acessa os próprios dados
-- =============================================================
alter table public.profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.shopping_lists enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meal_plans_own" on public.meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "shopping_lists_own" on public.shopping_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
