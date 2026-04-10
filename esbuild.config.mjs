import esbuild from "esbuild";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import builtins from "builtin-modules";

const prod = process.argv[2] === "production";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const releaseBuild = process.env.RELEASE_BUILD === "1";
const vaultRoot = process.env.OBSIDIAN_VAULT || "/Users/simonturner/vault";
const outDir = releaseBuild
	? path.join(repoRoot, "dist")
	: path.join(vaultRoot, ".obsidian/plugins/reading-list");
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
