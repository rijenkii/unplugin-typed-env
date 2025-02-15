// @ts-check

import eslint from "@eslint/js";
import gitignore from "eslint-config-flat-gitignore";
import prettier from "eslint-config-prettier";
// @ts-expect-error https://github.com/import-js/eslint-plugin-import/issues/3090
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
  gitignore({ files: [".gitignore"] }),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  prettier,
  {
    plugins: { "simple-import-sort": simpleImportSort },
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side effect imports.
            ["^\\u0000"],
            // Node.js builtins.
            ["^node:"],
            // External packages.
            ["^@?\\w"],
            // Virtual imports.
            ["^virtual:"],
            // Absolute imports.
            ["^"],
            // Relative imports.
            ["^\\."],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "import/no-unresolved": "off",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/no-duplicates": ["error", { considerQueryString: true }],
      "import/namespace": "off",
      "import/default": "off",
      "import/named": "off",
    },
  },
);
