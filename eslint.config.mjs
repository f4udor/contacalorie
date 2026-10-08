import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
  {
    // Il motore dei calcoli è puro: può importare solo da se stesso.
    // La cartella è piatta: sono ammessi solo import "./nome" (nessun "../", nessun pacchetto).
    files: ["src/engine/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\./[A-Za-z0-9_-]+$)",
              message: "src/engine può importare solo da src/engine (percorsi './nome').",
            },
          ],
        },
      ],
    },
  },
  {
    // I test del motore possono usare anche vitest.
    files: ["src/engine/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\./[A-Za-z0-9_-]+$|vitest$)",
              message: "src/engine può importare solo da src/engine (e i test da vitest).",
            },
          ],
        },
      ],
    },
  },
]);
