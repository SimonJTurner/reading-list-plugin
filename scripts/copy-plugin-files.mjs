import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPluginOutputDir } from "../plugin-output-dir.mjs";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dest = getPluginOutputDir();

fs.mkdirSync(dest, { recursive: true });
for (const name of ["manifest.json", "styles.css"]) {
	const src = path.join(repoRoot, name);
	fs.copyFileSync(src, path.join(dest, name));
}
