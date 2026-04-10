import esbuild from "esbuild";
import process from "process";
import path from "path";
import builtins from "builtin-modules";
import { getPluginOutputDir } from "./plugin-output-dir.mjs";

const prod = process.argv[2] === "production";

const outDir = getPluginOutputDir();
const outfile = path.join(outDir, "main.js");

const banner = `/*
Reading list — generated bundle
*/`;

const ctx = await esbuild.context({
	banner: { js: banner },
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "es2020",
	logLevel: prod ? "info" : "silent",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile,
});

if (prod) {
	await ctx.rebuild();
	await ctx.dispose();
	process.exit(0);
} else {
	await ctx.rebuild();
	await ctx.dispose();
}
