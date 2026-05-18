import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { Readable } from "node:stream";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8181);
const root = process.cwd();
const clientDir = resolve(root, "dist/client");
const serverBundle = await import(resolve(root, "dist/server/index.js"));
const worker = serverBundle.default;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getStaticFilePath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const normalized = normalize(pathname).replace(/^[/\\]+/, "");
  const filePath = resolve(join(clientDir, normalized));

  if (!filePath.startsWith(clientDir)) return null;
  if (!existsSync(filePath)) return null;
  if (!statSync(filePath).isFile()) return null;

  return filePath;
}

function createWebRequest(req) {
  const url = `http://${req.headers.host || `${host}:${port}`}${req.url || "/"}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return new Request(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : Readable.toWeb(req),
    duplex: req.method === "GET" || req.method === "HEAD" ? undefined : "half",
  });
}

async function sendWebResponse(res, webResponse, headOnly = false) {
  res.statusCode = webResponse.status;
  res.statusMessage = webResponse.statusText;

  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (headOnly || !webResponse.body) {
    res.end();
    return;
  }

  Readable.fromWeb(webResponse.body).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const staticFilePath = getStaticFilePath(req.url || "/");

    if ((req.method === "GET" || req.method === "HEAD") && staticFilePath) {
      res.statusCode = 200;
      res.setHeader("Content-Type", mimeTypes[extname(staticFilePath)] || "application/octet-stream");
      res.setHeader("Cache-Control", staticFilePath.includes(`${join("dist", "client", "assets")}`) ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate");

      if (req.method === "HEAD") {
        res.end();
      } else {
        createReadStream(staticFilePath).pipe(res);
      }
      return;
    }

    const webResponse = await worker.fetch(createWebRequest(req), {}, {});
    await sendWebResponse(res, webResponse, req.method === "HEAD");
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Admin study dashboard running on http://${host}:${port}`);
});