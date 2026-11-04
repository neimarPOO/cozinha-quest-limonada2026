const { test } = require("node:test");
const assert = require("node:assert/strict");
const { notebook } = require("../js/recipe-guide");
const recipes = require("../js/recipe-catalog");
for (const id of ["cookie", "lemonade", "focaccia"])
  test(
    id +
      ": notebook contains every ingredient and preparation phase from the playable recipe",
    () => {
      const definition = recipes[id],
        page = notebook(definition);
      assert.equal(page.title, definition.name);
      assert.equal(page.chapters.length, definition.phases.length);
      for (const phase of page.chapters.keys()) {
        const chapter = page.chapters[phase];
        assert.ok(chapter.introduction);
        assert.ok(chapter.timing);
        assert.equal(
          chapter.instructions.length,
          definition.tasks.filter((t) => t.phase === phase).length,
        );
      }
      assert.equal(
        page.ingredients.length,
        definition.ingredientIds.filter(
          (id) => !["halves", "juice"].includes(id),
        ).length,
      );
    },
  );
test("notebook preserves recipe amounts, divided additions, oven temperatures and real/game times", () => {
  const cookie = notebook(recipes.cookie),
    lemon = notebook(recipes.lemonade),
    bread = notebook(recipes.focaccia);
  assert.equal(
    cookie.ingredients.find((i) => /Farinha/.test(i.name)).amount,
    "450 g",
  );
  assert.match(JSON.stringify(cookie.chapters), /180 °C/);
  assert.match(JSON.stringify(cookie.chapters), /12–24/);
  assert.equal(
    bread.ingredients.find((i) => /Azeite/.test(i.name)).amount,
    "60 ml",
  );
  assert.match(JSON.stringify(bread.chapters), /220 °C/);
  assert.equal(
    lemon.ingredients.find((i) => /gelo/i.test(i.name)).amount,
    "10–12 cubos",
  );
  assert.equal(
    lemon.ingredients.some((i) => /metades/i.test(i.name)),
    false,
  );
  assert.match(JSON.stringify(lemon.chapters), /150 ml/);
});

test("reading hand restores shared materials and individual mesh properties", () => {
  const fs = require("node:fs"),
    vm = require("node:vm"),
    THREE = require("../public/three.min.js");
  const context = { window: {}, THREE };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../js/cookie-scene"), "utf8"),
    context,
  );
  const group = new THREE.Group(),
    material = new THREE.MeshStandardMaterial(),
    a = new THREE.Mesh(new THREE.BoxGeometry(), material),
    b = new THREE.Mesh(new THREE.BoxGeometry(), material);
  a.renderOrder = 4;
  b.renderOrder = 5;
  a.castShadow = true;
  b.castShadow = false;
  group.add(a, b);
  const owner = {
    hand: { group, pose() {} },
    renderer: { shadowMap: { needsUpdate: false } },
    updateHand() {
      group.visible = true;
    },
  };
  const methods = context.window.CookieScene.prototype;
  methods.readPageHand.call(owner, { clientX: 100, clientY: 100 }, true);
  assert.equal(material.depthTest, false);
  assert.equal(material.transparent, true);
  assert.equal(a.renderOrder, 1100);
  methods.endReadingHand.call(owner);
  assert.equal(material.depthTest, true);
  assert.equal(material.transparent, false);
  assert.equal(a.renderOrder, 4);
  assert.equal(b.renderOrder, 5);
  assert.equal(a.castShadow, true);
  assert.equal(b.castShadow, false);
  assert.equal(group.visible, false);
});
test("notebook projection stays aligned with its page under camera view offsets", () => {
  const fs = require("node:fs"),
    vm = require("node:vm"),
    THREE = require("../public/three.min.js");
  const context = { window: {}, THREE };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../js/recipe-notebook"), "utf8"),
    context,
  );
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 4, 8);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(600, 700, 0, -100, 1000, 800);
  camera.updateMatrixWorld();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(12), 3),
  );
  const rect = {
    x: 650,
    y: 80,
    left: 650,
    right: 980,
    top: 80,
    bottom: 700,
    width: 330,
    height: 620,
  };
  const owner = {
    root: { hidden: false },
    page: { getBoundingClientRect: () => rect },
    plane: { geometry },
    scene: {
      camera,
      renderer: {
        domElement: {
          getBoundingClientRect: () => ({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            width: 1000,
            height: 800,
          }),
        },
      },
    },
  };
  context.window.RecipeNotebook.prototype.project.call(owner);
  const expected = [
    [650, 80],
    [980, 80],
    [650, 700],
    [980, 700],
  ];
  expected.forEach(([x, y], i) => {
    const v = new THREE.Vector3()
      .fromBufferAttribute(geometry.attributes.position, i)
      .project(camera);
    assert.ok(Math.abs((v.x + 1) * 500 - x) < 0.001);
    assert.ok(Math.abs((1 - v.y) * 400 - y) < 0.001);
  });
});
