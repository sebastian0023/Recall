import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "src/generated/**",
      "src/lib/aws.ts",
      "src/lib/prompt.ts",
      "src/lib/transcribe.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      eqeqeq: ["error", "always"],
      // En src/ todo pasa por el logger (src/lib/logger.ts)
      "no-console": "error",
    },
  },
  {
    // Los scripts (seed) sí pueden escribir en la consola
    files: ["prisma/**"],
    rules: { "no-console": "off" },
  },
);
