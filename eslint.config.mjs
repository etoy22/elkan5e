import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { ignores: ["src/packs.mjs"] }, // or "**/src/packs.mjs" if needed
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        foundry: "readonly",
        game: "readonly",
        canvas: "readonly",
        ui: "readonly",
        CONFIG: "readonly",
        CONST: "readonly",
        Roll: "readonly",
        MidiQOL: "readonly",
        Token: "readonly",
        fromUuid: "readonly",
        console: "readonly",
        token: "readonly",
        process: "readonly",
        ChatMessage: "readonly",
        getProperty: "readonly",
        structuredClone: "readonly",
        document: "readonly",
        setTimeout: "readonly",
        FormData: "readonly",
        actor: "readonly",
        activity: "readonly",
        Hooks: "readonly",
        fetch: "readonly",
        FormApplication: "readonly",
      },
    },

    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      semi: ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "prettier/prettier": "error",
    },
  },
];
