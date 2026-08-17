import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Set VITE_BASE_PATH=/repo-name/ for GitHub Pages; defaults to "/" for local dev & custom domains
  base: process.env.VITE_BASE_PATH || "/",
  // Expose NEXT_PUBLIC_* too, so the vars the Supabase↔Vercel integration
  // auto-creates are readable by the client (in addition to our VITE_* vars).
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [react(), tailwindcss()],
});
