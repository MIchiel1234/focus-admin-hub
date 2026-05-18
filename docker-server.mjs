import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 8181);
const host = process.env.HOST || "0.0.0.0";
const root = fileURLToPath(new URL("./dist/client/", import.meta.url));
const serverBuild = await import("./dist/server/index.js");
const app = serverBuild.default;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

async function serveStatic(url, res) {
  const pathname = new URL(url, "http://localhost").pathname;
  const safePath = normalize(pathname).replace(/^\.\.(?:[/\\]|$)/, "");
  const filePath = join(root, safePath === "/" ? "index.html" : safePath);
  const body = await readFile(filePath);
  res.writeHead(200, { "content-type": contentTypes[extname(filePath)] || "application/octet-stream" });
  res.end(body);
}

createServer(async (req, res) => {
  try {
    await serveStatic(req.url || "/", res);
  } catch {
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
    });
    const response = await app.fetch(request, process.env, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }
}).listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});