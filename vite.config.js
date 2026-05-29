import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  build: {
    outDir: "docs",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        generator: resolve(__dirname, "generator.html"),
        generate: resolve(__dirname, "generate.html"),
      },
    },
  },
});
