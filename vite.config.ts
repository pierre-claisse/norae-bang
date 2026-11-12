import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/norae-bang/",
  plugins: [react()],
  build: {
    sourcemap: false,
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    environment: "node",
    exclude: ["node_modules/**", "dist/**"],
  },
});
