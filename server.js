"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_CACHE = "public, max-age=300";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  const isError = status >= 400;
  const payload = Buffer.from(String(body));
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": isError ? "no-store" : PUBLIC_CACHE,
    "Content-Length": payload.length,
    ...headers,
  });
  res.end(payload);
}

function handle(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
  }

  let pathname;
  try {
    // Host y request-target pueden ser inválidos: fuera del try tumbaban el proceso.
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return send(res, 400, "Bad Request");
  }

  // Un NUL decodificado (%00) hacía que fs.readFile lanzara de forma síncrona.
  if (pathname.includes("\0")) return send(res, 400, "Bad Request");

  if (pathname === "/health") {
    return send(res, 200, JSON.stringify({ ok: true }), {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
  }

  if (pathname.endsWith("/")) pathname += "index.html";
  const filePath = path.join(ROOT, path.normalize(pathname));

  // Impide salir del directorio raíz (path traversal).
  if (!filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, "Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, "No encontrado");
    }

    const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
    const headers = {
      "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      ETag: etag,
      "Last-Modified": stat.mtime.toUTCString(),
    };
    const inm = req.headers["if-none-match"];
    if (inm && inm === etag) {
      res.writeHead(304, { ETag: etag, "Cache-Control": PUBLIC_CACHE });
      return res.end();
    }

    if (req.method === "HEAD") {
      res.writeHead(200, { ...headers, "Content-Length": stat.size });
      return res.end();
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return send(res, 500, "Error interno");
      res.writeHead(200, { ...headers, "Content-Length": data.length });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  try {
    handle(req, res);
  } catch {
    if (!res.headersSent) send(res, 500, "Error interno");
    else res.destroy();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Nexo CRM escuchando en http://${HOST}:${PORT}`);
});

let closing = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    const timer = setTimeout(() => {
      server.closeAllConnections?.();
      process.exit(1);
    }, 8000);
    timer.unref();
    server.close(() => {
      clearTimeout(timer);
      process.exit(0);
    });
  });
}
