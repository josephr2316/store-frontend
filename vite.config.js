import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH: en GitHub Pages usar /nombre-repo/ (ej: /tienda-sistema/)
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["src/test/setup.js"],
    run: true,
  },
});
