const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const THREE = require("../public/three.min.js");
function resources() {
  const context = { window: {}, THREE, Image: class {} };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../js/kitchen-resources"), "utf8"),
    context,
  );
  return context.window.KitchenResources;
}
test("geometry cache reuses shapes across recipes and bounds retained idle entries", () => {
  const cache = resources(),
    a = {},
    b = {};
  let builds = 0;
  const first = cache.geometry(a, "shape", () => {
    builds++;
    return new THREE.BoxGeometry(1, 2, 3);
  });
  assert.equal(
    cache.geometry(a, "shape", () => {
      throw Error("must reuse");
    }),
    first,
  );
  cache.releaseGeometries(a);
  assert.equal(
    cache.geometry(b, "shape", () => {
      throw Error("must reuse after scene disposal");
    }),
    first,
  );
  assert.equal(builds, 1);
  let disposed = 0;
  for (let i = 0; i < 120; i++)
    cache.geometry(b, "box" + i, () => {
      const g = new THREE.BoxGeometry();
      g.addEventListener("dispose", () => disposed++);
      return g;
    });
  cache.releaseGeometries(b);
  assert.equal(disposed, 24);
});
test("static batching preserves transformed bounds, UVs, normals and instanced objects", () => {
  const cache = resources(),
    root = new THREE.Group(),
    nested = new THREE.Group();
  root.position.set(5, 2, 1);
  nested.rotation.y = 0.3;
  root.add(nested);
  const material = new THREE.MeshStandardMaterial({
    color: 0x345678,
    roughness: 0.4,
  });
  const a = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 3), material),
    b = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), material.clone());
  a.position.set(1, 2, 3);
  b.position.set(4, 0, 0);
  a.castShadow = b.castShadow = true;
  root.add(a);
  nested.add(b);
  const before = new THREE.Box3().setFromObject(root);
  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(),
    material.clone(),
    1,
  );
  inst.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0, 0));
  root.add(inst);
  const stats = cache.batchStatic(root);
  assert.equal(stats.before, 2);
  assert.equal(stats.after, 1);
  assert.equal(inst.parent, root);
  const merged = root.children.find((m) => m.name === "kitchen-static-batch");
  root.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(merged);
  assert.ok(before.min.distanceTo(after.min) < 0.000001);
  assert.ok(before.max.distanceTo(after.max) < 0.000001);
  assert.equal(merged.geometry.attributes.position.count, 72);
  assert.equal(merged.geometry.attributes.uv.count, 72);
  assert.equal(merged.geometry.attributes.normal.count, 72);
  assert.equal(merged.castShadow, true);
  assert.equal(merged.material.color.getHex(), material.color.getHex());
});

test("highlight transitions keep their duration across frame rates and stop invalidating when stable", () => {
  const context = { window: {}, THREE };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../js/cookie-scene"), "utf8"),
    context,
  );
  const update = context.window.CookieScene.prototype.updateHighlights;
  function owner(delta) {
    const material = new THREE.MeshStandardMaterial();
    return {
      hovered: "flour",
      frameDelta: delta,
      highlights: new Map([
        [
          "flour",
          {
            amount: 0,
            materials: new Map([
              [material, { color: material.emissive.clone(), intensity: 0 }],
            ]),
          },
        ],
      ]),
    };
  }
  const regular = owner(1 / 30),
    slow = owner(0.5);
  for (let i = 0; i < 15; i++)
    assert.equal(typeof update.call(regular), "boolean");
  assert.equal(update.call(slow), true);
  assert.ok(
    Math.abs(
      regular.highlights.get("flour").amount -
        slow.highlights.get("flour").amount,
    ) < 1e-10,
  );
  slow.highlights.get("flour").amount = 1;
  assert.equal(update.call(slow), false);
  slow.hovered = null;
  assert.equal(update.call(slow), true);
});
