import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { chunkSizeWarningLimit: 1600, rollupOptions: {input: {main: "index.html", guru: "guru.html"}} },
  server: { host: "0.0.0.0", port: 5173 },
});
