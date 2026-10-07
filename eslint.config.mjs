import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
  {
    // Il motore dei calcoli è puro: può importare solo da se stesso.
    files: ["src/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\./|\\.\\./)",
              message: "src/engine può importare solo da src/engine (percorsi relativi interni).",
            },
            {
              regex: "^\\.\\./\\.\\./",
              message: "src/engine non può importare da fuori src/engine.",
            },
          ],
        },
      ],
    },
  },
  {
    // I test del motore possono usare vitest.
    files: ["src/engine/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\./|\\.\\./|vitest$)",
              message: "src/engine può importare solo da src/engine (e i test da vitest).",
            },
          ],
        },
      ],
    },
  },
]);
