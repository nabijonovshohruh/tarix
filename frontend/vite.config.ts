import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  // Lets `vite preview` (serves the real built dist/ bundle, unlike `vite
  // dev`'s HMR-injected CSS) still reach the local backend for auth/data —
  // used to verify the actual production CSS delivery path matches dev.
  preview: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
