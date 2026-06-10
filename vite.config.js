import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Set VITE_BASE_PATH=/repo-name/ for GitHub Pages; defaults to "/" for local dev & custom domains
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
});
