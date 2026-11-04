const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const { brotliDecompressSync, gunzipSync } = require("node:zlib");
const { createServer } = require("../server");
function request(port, url, headers = {}, method = "GET") {
  return new Promise((resolve, reject) => {
    http
      .request(
        { host: "127.0.0.1", port, path: url, headers, method },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks),
            }),
          );
        },
      )
      .on("error", reject)
      .end();
  });
}
test("static delivery preserves bytes with Brotli/gzip, revalidates and keeps HTML fresh", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port,
      original = fs.readFileSync(require.resolve("../js/app.js"));
    const br = await request(port, "/js/app.js?v=test", {
      "Accept-Encoding": "br, gzip",
    });
    assert.equal(br.status, 200);
    assert.equal(br.headers["content-encoding"], "br");
    assert.deepEqual(brotliDecompressSync(br.body), original);
    assert.ok(br.body.length < original.length * 0.5);
    assert.match(br.headers["cache-control"], /immutable/);
    const gz = await request(port, "/js/app.js?v=test", {
      "Accept-Encoding": "gzip",
    });
    assert.deepEqual(gunzipSync(gz.body), original);
    const identity = await request(port, "/js/app.js?v=test", {
      "Accept-Encoding": "br;q=0, gzip;q=0",
    });
    assert.equal(identity.headers["content-encoding"], undefined);
    assert.deepEqual(identity.body, original);
    const cached = await request(port, "/js/app.js?v=test", {
      "Accept-Encoding": "br",
      "If-None-Match": br.headers.etag,
    });
    assert.equal(cached.status, 304);
    assert.equal(cached.body.length, 0);
    const html = await request(port, "/");
    assert.equal(html.headers["cache-control"], "no-cache");
    const image = await request(
      port,
      "/public/textures/kitchen/hardwood2_diffuse.jpg",
      { "Accept-Encoding": "br" },
    );
    assert.equal(image.headers["content-encoding"], undefined);
    assert.match(image.headers["cache-control"], /must-revalidate/);
    const head = await request(port, "/js/app.js", {}, "HEAD");
    assert.equal(head.body.length, 0);
    assert.equal(Number(head.headers["content-length"]), original.length);
    assert.equal((await request(port, "/%E0%A4%A")).status, 400);
    assert.equal((await request(port, "/missing.js")).status, 404);
    assert.equal((await request(port, "/index.html", {}, "POST")).status, 405);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
