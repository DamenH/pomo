import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = await readFile(new URL("../public/icon.svg", import.meta.url));
const outputs = [
	["icon-192.png", 192],
	["icon-512.png", 512],
	["icon-maskable-512.png", 512],
	["apple-touch-icon.png", 180],
];

await Promise.all(
	outputs.map(([name, size]) =>
		sharp(source)
			.resize(Number(size), Number(size))
			.png()
			.toFile(fileURLToPath(new URL(`../public/${name}`, import.meta.url))),
	),
);

console.log(`Generated ${outputs.length} icons from public/icon.svg`);
