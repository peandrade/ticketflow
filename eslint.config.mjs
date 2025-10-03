import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import pluginImport from "eslint-plugin-import";
import tseslint from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import("eslint").Linter.FlatConfig[]} */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  pluginImport.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": ["warn", { "prefer": "type-imports" }],
      "import/no-default-export": "warn",
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object"],
          pathGroups: [
            { pattern: "@core/**", group: "internal", position: "before" },
            { pattern: "@features/**", group: "internal", position: "before" },
            { pattern: "@shared/**", group: "internal", position: "before" }
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true }
        }
      ]
    }
  }
];

export default eslintConfig;
