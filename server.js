const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { promisify } = require("node:util");
const brotli = promisify(zlib.brotliCompress),
  gzip = promisify(zlib.gzip);
const ROOT = __dirname;
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};
function createServer() {
  const compressed = new Map();
  let bytes = 0;
  async function representation(file, stats, encoding) {
    const key = [file, stats.size, stats.mtimeMs, encoding].join(":");
    if (compressed.has(key)) return compressed.get(key);
    const work = fs.promises.readFile(file).then((data) =>
      encoding === "br"
        ? brotli(data, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
          })
        : gzip(data, { level: 6 }),
    );
    compressed.set(key, work);
    try {
      const data = await work;
      bytes += data.length;
      for (const [old, value] of compressed) {
        if (bytes <= 16 * 1024 * 1024 && compressed.size <= 64) break;
        if (Buffer.isBuffer(value)) {
          bytes -= value.length;
          compressed.delete(old);
        }
      }
      if (compressed.get(key) === work) compressed.set(key, data);
      return data;
    } catch (error) {
      compressed.delete(key);
      throw error;
    }
  }
  return http.createServer(async (req, res) => {
    let parsed, reqPath;
    try {
      parsed = new URL(req.url, "http://localhost");
      reqPath = decodeURIComponent(parsed.pathname);
    } catch {
      res.writeHead(400);
      res.end("Endereço inválido");
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    if (reqPath === "/" || !reqPath) reqPath = "/index.html";
    const file = path.resolve(ROOT, "." + reqPath);
    if (!file.startsWith(ROOT + path.sep)) {
      res.writeHead(403);
      res.end("Acesso negado");
      return;
    }
    try {
      const stats = await fs.promises.stat(file);
      if (!stats.isFile()) throw Object.assign(new Error(), { code: "ENOENT" });
      const ext = path.extname(file).toLowerCase();
      // JPEG/PNG/GLB já são comprimidos: Brotli é reservado aos arquivos textuais.
      const compressible =
        [".html", ".js", ".css", ".json", ".svg", ".txt", ".gltf"].includes(
          ext,
        ) && stats.size > 1024;
      const accepts = (req.headers["accept-encoding"] || "")
        .split(",")
        .map((part) => {
          const [name, ...params] = part.trim().split(";");
          const q = params.find((p) => p.trim().startsWith("q="));
          return { name, q: q ? Number(q.trim().slice(2)) : 1 };
        });
      const allows = (name) => accepts.some((e) => e.name === name && e.q > 0);
      const encoding = compressible
        ? allows("br")
          ? "br"
          : allows("gzip")
            ? "gzip"
            : ""
        : "";
      const etag =
        '"' +
        stats.size.toString(16) +
        "-" +
        Math.trunc(stats.mtimeMs).toString(16) +
        "-" +
        (encoding || "identity") +
        '"';
      const headers = {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control":
          ext === ".html"
            ? "no-cache"
            : parsed.searchParams.has("v")
              ? "public, max-age=31536000, immutable"
              : "public, max-age=0, must-revalidate",
        ETag: etag,
        "Last-Modified": stats.mtime.toUTCString(),
        Vary: "Accept-Encoding",
        "Access-Control-Allow-Origin": "*",
      };
      if (
        req.headers["if-none-match"]
          ?.split(",")
          .map((x) => x.trim())
          .includes(etag)
      ) {
        res.writeHead(304, headers);
        res.end();
        return;
      }
      if (encoding) headers["Content-Encoding"] = encoding;
      if (req.method === "HEAD") {
        if (!encoding) headers["Content-Length"] = stats.size;
        res.writeHead(200, headers);
        res.end();
        return;
      }
      if (encoding) {
        const body = await representation(file, stats, encoding);
        headers["Content-Length"] = body.length;
        res.writeHead(200, headers);
        res.end(body);
      } else {
        headers["Content-Length"] = stats.size;
        res.writeHead(200, headers);
        const stream = fs.createReadStream(file);
        stream.on("error", () => res.destroy());
        stream.pipe(res);
      }
    } catch (error) {
      if (!res.headersSent)
        res.writeHead(error.code === "ENOENT" ? 404 : 500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
      res.end("Arquivo indisponível");
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, "127.0.0.1", () =>
    console.log(`🍋 Cozinha Quest: http://127.0.0.1:${port}`),
  );
}
module.exports = { createServer };
