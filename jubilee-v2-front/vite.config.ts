/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import fs from "fs";
import path from "path";

export default ({ mode }) => {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("VITE_")) {
      delete process.env[key];
    }
  }
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    //@ts-ignore
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/helpers/testSetup.tsx',
      alias: {
        '~/': new URL('./src/', import.meta.url).pathname, 
      }
    },
    plugins: [
      {
        name: "liquid-as-string", // name your plugin
        resolveId(source) {
          if (source.endsWith(".liquid")) {
            return source;
          }
        },
        load(id) {
          if (id.endsWith(".liquid")) {
            const fullPath = path.resolve(id);
            const fileContent = fs.readFileSync(fullPath, "utf-8");
            // Escape characters that conflict with JavaScript string literals
            const escapedContent = JSON.stringify(fileContent);
            return `export default ${escapedContent}`;
          }
        },
      },
      react(),
      svgr(),
    ],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "./build",
      sourcemap: true,
    },
  });
};
