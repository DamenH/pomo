import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { writeServiceWorker } from "./scripts/pwa.ts";

export default defineConfig({
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
