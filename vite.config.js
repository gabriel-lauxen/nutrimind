import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expõe na rede local (necessário para túneis)
    // Permite acessar o dev server através de túneis ngrok (HTTPS) — útil para
    // testar o PWA em tela cheia no iPhone.
    allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.io", ".ngrok-free.dev"],
  },
});
