import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// Usa a publishable key (novo padrão do Supabase). Mantém fallback para anon por compatibilidade.
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !publishableKey) {
  // Aviso amigável no console caso o .env não tenha sido preenchido
  console.warn(
    "[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY ausentes. " +
      "Crie um arquivo .env baseado em .env.example."
  );
}

export const supabase = createClient(url || "http://localhost", publishableKey || "public-key");
