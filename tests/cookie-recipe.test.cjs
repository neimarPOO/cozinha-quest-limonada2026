const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Session, tasks, phases } = require("../js/cookie-recipe");
function values(t) {
  return {
    procedure: t.procedure,
    quantity: t.quantity,
    temperature: t.temperature,
    duration:
      t.duration ||
      (t.kind === "chill" ? 10 : t.kind === "bake" ? 9 : undefined),
    portions: 20,
  };
}
function advanceTo(s, kind) {
  while (s.task.kind !== kind) {
    const result = s.configure(values(s.task));
    assert.ok(result.ok);
    if (s.status === "running") s.tick(s.target, true);
  }
  return s;
}
function fillTray(s) {
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 5; x++) {
      s.collect();
      assert.ok(s.place(0.1 + x * 0.2, 0.1 + y * 0.26).ok);
    }
}
test("eight phases and exact ingredient quantities, including both sugars and raising agents", () => {
  assert.equal(phases.length, 8);
  assert.deepEqual(
    tasks.filter((t) => t.quantity).map((t) => [t.item, t.quantity]),
    [
      ["flour", 450],
      ["soda", 5],
      ["powder", 5],
      ["salt", 5],
      ["butter", 200],
      ["brown", 200],
      ["white", 100],
      ["egg", 1],
      ["vanilla", 1],
      ["chips", 350],
    ],
  );
});
test("wrong procedure, quantity and action duration do not advance", () => {
  const s = new Session();
  assert.equal(s.configure({ procedure: "sauter" }).ok, false);
  assert.equal(s.index, 0);
  s.configure(values(s.task));
  assert.equal(s.configure({ ...values(s.task), quantity: 449 }).ok, false);
  assert.equal(s.index, 1);
  while (s.task.item !== "spoon") s.configure(values(s.task));
  assert.equal(s.configure({ ...values(s.task), duration: 2 }).ok, false);
  s.configure(values(s.task));
  s.tick(5);
  assert.equal(s.elapsed, 0);
  s.tick(2.9, true);
  assert.equal(s.task.item, "spoon");
  s.tick(0.1, true);
  assert.equal(s.task.phase, 1);
});
test("rest is optional, only 10–15 seconds grants the aesthetics buff", () => {
  const s = advanceTo(new Session(), "chill");
  assert.equal(s.configure({ ...values(s.task), duration: 9 }).ok, false);
  s.configure({ ...values(s.task), duration: 15 });
  s.tick(14);
  assert.equal(s.rested, false);
  s.tick(1);
  assert.equal(s.rested, true);
  assert.equal(s.aesthetics, 110);
  const skip = advanceTo(new Session(), "chill");
  assert.equal(skip.skipChill(), true);
  assert.equal(skip.aesthetics, 100);
  assert.equal(skip.task.phase, 5);
});
test("portion capacity, collection, boundaries, spacing and twenty valid portions", () => {
  const s = advanceTo(new Session(), "chill");
  s.skipChill();
  s.configure(values(s.task));
  assert.equal(s.configure({ ...values(s.task), portions: 21 }).ok, false);
  s.configure(values(s.task));
  assert.equal(s.place(0.1, 0.1).ok, false);
  s.collect();
  assert.equal(s.place(-1, 0.1).ok, false);
  assert.ok(s.place(0.1, 0.1).ok);
  s.collect();
  assert.equal(s.place(0.12, 0.12).ok, false);
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 5; x++) {
      if (!x && !y) continue;
      s.collect();
      assert.ok(s.place(0.1 + x * 0.2, 0.1 + y * 0.26).ok);
    }
  assert.equal(s.portions.length, 20);
  assert.equal(s.task.temperature, 180);
});
function baking(rest = true) {
  const s = advanceTo(new Session(), "chill");
  if (rest) {
    s.configure(values(s.task));
    s.tick(10);
  } else s.skipChill();
  s.configure(values(s.task));
  s.configure(values(s.task));
  fillTray(s);
  assert.equal(s.configure({ ...values(s.task), temperature: 200 }).ok, false);
  s.configure(values(s.task));
  s.configure(values(s.task));
  assert.equal(s.configure({ ...values(s.task), duration: 11 }).ok, false);
  s.configure(values(s.task));
  return s;
}
test("baking needs gloves, blocks early removal and accepts the 8–10 second window", () => {
  for (const seconds of [8, 9, 10]) {
    const s = baking();
    s.tick(7);
    assert.equal(s.removeTray().ok, false);
    s.equipGloves();
    assert.equal(s.removeTray().ok, false);
    s.tick(seconds - 7);
    assert.ok(s.removeTray().ok);
    assert.equal(s.bakeQuality, "ideal");
    assert.equal(s.task.phase, 7);
  }
});
test("late removal loses softness; more than 15 seconds burns even in a background tab", () => {
  const late = baking();
  late.equipGloves();
  late.tick(15);
  assert.ok(late.removeTray().ok);
  assert.equal(late.bakeQuality, "dry");
  const burnt = baking();
  burnt.tick(15.001);
  assert.equal(burnt.status, "burnt");
  assert.equal(burnt.completed, false);
  assert.equal(burnt.removeTray().ok, false);
  const jump = baking();
  jump.tick(80);
  assert.equal(jump.status, "burnt");
});
test("cooling cannot be skipped, serving completes and report preserves quality and aesthetic bonus", () => {
  const s = baking();
  s.equipGloves();
  s.tick(9);
  s.removeTray();
  s.configure(values(s.task));
  s.tick(4.99);
  assert.equal(s.configure(values(s.task)).ok, false);
  s.tick(0.02);
  assert.equal(s.task.item, "plate");
  s.configure(values(s.task));
  assert.ok(s.completed);
  assert.equal(s.score, 1000); // 1010 less two intentional invalid choices in baking helper
  assert.deepEqual(s.report(), {
    version: 1,
    phases: 8,
    portions: 20,
    rested: true,
    aesthetics: 110,
    bakeQuality: "ideal",
    penalties: 10,
  });
});
test("cancelled or completed sessions cannot advance or accept more portions", () => {
  const s = baking(false);
  s.equipGloves();
  s.tick(9);
  s.removeTray();
  s.configure(values(s.task));
  s.tick(5);
  s.configure(values(s.task));
  const index = s.index;
  assert.equal(s.configure({}).ok, false);
  assert.equal(s.place(0.5, 0.5).ok, false);
  s.tick(100);
  assert.equal(s.index, index);
});
