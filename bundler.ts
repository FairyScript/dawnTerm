import tailwindPlugin from "bun-plugin-tailwind";
import reactCompiler from "@zomme/bun-plugin-react-compiler";

Bun.build({
  entrypoints: ["./src/mainview/index.html"],
  outdir: "./dist",
  plugins: [
    tailwindPlugin,
    reactCompiler
  ]
})