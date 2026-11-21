/** Local-only preview for Next.js static export; never a production service. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../out/", import.meta.url));
try { await stat(resolve(root, "index.html")); } catch { throw new Error("Static build missing. Run npm run build before npm start."); }
const port = Number(process.env.PORT ?? 3000);
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json",
  ".wasm": "application/wasm", ".svg": "image/svg+xml", ".png": "image/png",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".pdf": "application/pdf",
};
const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    let path = resolve(root, `.${pathname}`);
    if (path !== resolve(root) && !path.startsWith(resolve(root) + sep)) {
      response.writeHead(403).end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const body = await readFile(path);
    response.writeHead(200, { "Content-Type": contentTypes[extname(path)] ?? "application/octet-stream", "Content-Length": body.length });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Static preview: http://127.0.0.1:${port}`));
