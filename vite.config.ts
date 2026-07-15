import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Forçamos o plugin a olhar para a pasta routes
  vite: {
    plugins: [], // O plugin do lovable já cuida disso, mas vamos garantir o alias
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});