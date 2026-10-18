import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // El proyecto usa `any` en mocks de NextAuth y tests; lo dejamos como aviso.
      "@typescript-eslint/no-explicit-any": "warn",
      // Patrón fetch-on-mount estándar (useEffect -> cargar); aviso, no error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Código generado por Prisma (no se versiona ni se lintea).
    "src/generated/**",
  ]),
]);

export default eslintConfig;
