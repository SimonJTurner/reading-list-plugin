import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Release CI sets RELEASE_BUILD=1 → always `dist/`.
 * Otherwise, if OBSIDIAN_VAULT is set → that vault’s plugin folder.
 * Otherwise → repo `dist/` (no machine-specific default).
 */
export function getPluginOutputDir() {
	if (process.env.RELEASE_BUILD === "1") {
		return path.join(repoRoot, "dist");
	}
	const vault = process.env.OBSIDIAN_VAULT;
	if (vault) {
		return path.join(vault, ".obsidian/plugins/reading-list");
	}
	return path.join(repoRoot, "dist");
}
