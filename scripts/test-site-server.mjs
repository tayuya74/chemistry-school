import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { root } from "./oge-migrate-lib.mjs";

const port = 4173;
const host = "127.0.0.1";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url, `http://${host}`).pathname,
  );
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const candidate = path.resolve(root, relative);

  if (!candidate.startsWith(root + path.sep) || !fs.existsSync(candidate)) {
    response.writeHead(404).end("Not found");
    return;
  }

  const filePath = fs.statSync(candidate).isDirectory()
    ? path.join(candidate, "index.html")
    : candidate;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type":
      contentTypes[path.extname(filePath)] ?? "application/octet-stream",
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Тестовый сайт: http://${host}:${port}`);
});
