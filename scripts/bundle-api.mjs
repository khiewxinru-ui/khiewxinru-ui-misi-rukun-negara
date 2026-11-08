import { build } from "esbuild";

await build({
  entryPoints: ["api/handler.ts"],
  outfile: "api/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  packages: "external",
});
