import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  base: "./",
  server: { port: 4561, host: true },
  preview: { port: 4561, host: true },
});
