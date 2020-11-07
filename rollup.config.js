import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import svelte from 'rollup-plugin-svelte';
import autoPreprocess from "svelte-preprocess";

export default {
  input: "./src/main.ts",
  output: {
    dir: ".",
    sourcemap: "inline",
    format: "cjs",
    exports: "default",
  },
  external: ["obsidian"],
  plugins: [
    svelte({
      preprocess: autoPreprocess()
    }),
    typescript({ sourceMap: true }),
    nodeResolve({ browser: true }),
    commonjs()
  ],
};