import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/phaser")) {
            return "phaser";
          }

          if (id.includes("node_modules")) {
            return "vendor";
          }

          return undefined;
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"]
  }
});
