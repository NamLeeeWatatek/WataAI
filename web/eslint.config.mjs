import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const nextPlugin = require("@next/eslint-plugin-next");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

const eslintConfig = [
    {
        ignores: [".next/*", "node_modules/*", "out/*", "build/*"]
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            }
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "@next/next": nextPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "@typescript-eslint/no-explicit-any": "warn"
        }
    },
    {
        files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
        rules: {
            "no-console": ["warn", { allow: ["warn", "error"] }],
        }
    }
];

export default eslintConfig;
