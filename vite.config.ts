import { defineConfig } from "vitest/config";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/igt-game-test/" : "/",
  server: { port: 5173 },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
}));
