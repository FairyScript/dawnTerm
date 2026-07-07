import tailwindPlugin from "bun-plugin-tailwind";
import reactCompiler from "./reactCompiler";

Bun.build({
  entrypoints: ["./src/mainview/index.html"],
  outdir: "./dist",
  plugins: [
    tailwindPlugin,
    reactCompiler
  ],
})