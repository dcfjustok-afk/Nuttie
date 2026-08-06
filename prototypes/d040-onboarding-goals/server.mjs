import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const host = "127.0.0.1";
const requestedPort = Number(process.argv[2] || "4177");
const port = Number.isInteger(requestedPort) && requestedPort >= 1024 && requestedPort <= 65535
  ? requestedPort
  : 4177;
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".webp", "image/webp"]
]);

const server = http.createServer(async (request, response) => {
  try {
    if (!new Set(["GET", "HEAD"]).has(request.method || "GET")) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
    const requestedPath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
    const filePath = path.resolve(root, `.${requestedPath}`);
    const rootPrefix = `${path.resolve(root)}${path.sep}`;

    if (!filePath.startsWith(rootPrefix)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw Object.assign(new Error("Not found"), { code: "ENOENT" });

    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Length": fileStat.size,
      "Content-Type": mime.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(status === 404 ? "Not found" : "Internal server error");
  }
});

server.listen(port, host, () => {
  console.log(`Nuttie D-040 prototype: http://${host}:${port}/`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
