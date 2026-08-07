import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Legacy fetch-in-effect pages set state synchronously inside effects.
      // Kept as-is per project decision; rule relaxed to avoid noise.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
