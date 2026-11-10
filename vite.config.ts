import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { writeServiceWorker } from "./scripts/pwa.ts";

function sourceFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? sourceFiles(path) : [path];
	});
}

const sourceHash = createHash("sha256");
for (const path of [
	...sourceFiles("src"),
	...sourceFiles("public"),
	...sourceFiles("scripts"),
	"index.html",
	"package.json",
	"package-lock.json",
	"vite.config.ts",
].sort()) {
	sourceHash.update(path).update("\0").update(readFileSync(path)).update("\0");
}
const buildHash = sourceHash.digest("hex").slice(0, 10);

export default defineConfig({
	define: {
		"import.meta.env.VITE_BUILD_HASH": JSON.stringify(buildHash),
	},
	base: "./",
	plugins: [
		react(),
		tailwindcss(),
		{
			name: "pomo-offline",
			apply: "build",
			async closeBundle() {
				await writeServiceWorker("dist");
			},
		},
	],
	build: {
		target: "es2022",
	},
	test: {
		include: ["src/**/*.test.ts"],
		environment: "node",
	},
});
