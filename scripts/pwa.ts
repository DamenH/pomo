import { readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

async function listFiles(directory: string, root = directory): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map((entry) => {
			const path = join(directory, entry.name);
			return entry.isDirectory() ? listFiles(path, root) : relative(root, path);
		}),
	);
	return files.flat().filter((file) => file !== "sw.js");
}

export async function writeServiceWorker(outputDirectory: string): Promise<void> {
	const files = (await listFiles(outputDirectory)).map(
		(file) => `./${file.split(sep).join("/")}`,
	);
	const source = `const CACHE = "pomo-v2";
const ASSETS = ${JSON.stringify(files, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true, ignoreVary: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response.ok) throw new Error("Network response was not successful");
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() =>
          event.request.mode === "navigate" ? caches.match("./index.html") : Response.error(),
        );
    }),
  );
});
`;
	await writeFile(join(outputDirectory, "sw.js"), source);
}
