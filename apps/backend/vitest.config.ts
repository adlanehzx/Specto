import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: [
        "src/services/llm.ts",
        "src/services/promptValidator.ts",
        "src/validators/**/*.ts",
        "src/llm/promptBuilder.ts",
        "src/tunnel/cloudflare.ts",
        "src/middleware/auth.ts",
      ],
    },
  },
});
