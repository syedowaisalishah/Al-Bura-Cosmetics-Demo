import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["@/api", "@/api/**", "@/app", "@/app/**"],
        message: "Web code uses HTTP endpoints or shared contracts; API implementation belongs in src/api.",
      }] }],
    },
  },
  {
    files: ["src/api/**/*.ts", "src/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["@/web", "@/web/**"],
        message: "Backend code must not depend on browser UI, camera code or AI workers.",
      }] }],
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["@/web", "@/web/**", "@/api", "@/api/**", "@/app", "@/app/**"],
        message: "Shared contracts, data and rules must stay independent of web and API layers.",
      }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/wasm/**",
    "public/workers/**",
  ]),
]);

export default eslintConfig;
