const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  Session,
  requiresBowlDrop,
  shouldPauseClock,
} = require("../js/cookie-recipe");
const catalog = require("../js/recipe-catalog");
function values(s) {
  const t = s.task;
  return {
    procedure: t.procedure,
    quantity: t.quantity,
    temperature: t.temperature,
    duration:
      t.duration ||
      (t.kind === "chill"
        ? 10
        : t.kind === "bake"
          ? s.definition.bake.min
          : undefined),
    portions: 8,
  };
}
function action(s) {
  const r = s.configure(values(s));
  assert.ok(r.ok, r.message);
  if (s.status === "running") s.tick(s.target, true);
  else if (s.status === "repeat") {
    for (let i = 0; i < s.task.count; i++) assert.ok(s.repeat(i).ok);
  } else if (s.status === "portion") {
    for (let i = 0; i < 8; i++) {
      s.collect();
      assert.ok(
        s.place(0.1 + (i % 5) * 0.2, 0.1 + Math.floor(i / 5) * 0.26).ok,
      );
    }
  } else if (s.status === "baking") {
    s.equipGloves();
    s.tick(s.definition.bake.min);
    assert.ok(s.removeTray().ok);
  }
}
function until(s, predicate) {
  let n = 0;
  while (!predicate(s.task)) {
    assert.ok(n++ < 100);
    action(s);
  }
  return s;
}
for (const id of Object.keys(catalog))
  test(`${id}: entire documented recipe completes with quantities and recorded history`, () => {
    const s = new Session(catalog[id]);
    let n = 0;
    while (!s.completed) {
      assert.ok(n++ < 100);
      action(s);
    }
    assert.ok(s.score >= 1000);
    assert.equal(s.report().recipeId, id);
    assert.equal(s.report().phases, catalog[id].phases.length);
    assert.equal(s.history.length, catalog[id].tasks.length);
  });
test("cookies start with flour: both bowls are automatically selected", () => {
  assert.equal(catalog.cookie.tasks[0].item, "flour");
  assert.equal(
    catalog.cookie.tasks.filter((t) =>
      t.procedure.startsWith("Selecionar a tigela"),
    ).length,
    0,
  );
});
test("quantity must be supplied; wrong quantities/procedures never advance", () => {
  const s = new Session();
  assert.equal(s.configure({ ...values(s), quantity: "" }).ok, false);
  assert.equal(s.configure({ ...values(s), quantity: 449 }).ok, false);
  assert.equal(s.configure({ ...values(s), procedure: "ignorar" }).ok, false);
  assert.equal(s.index, 0);
  assert.ok(s.configure(values(s)).ok);
  assert.equal(s.task.item, "soda");
});
test("clock runs during ready/configuration, portioning and repeat actions; pauses only for timed work", () => {
  const s = new Session();
  assert.equal(shouldPauseClock(s), false);
  until(s, (t) => t.item === "spoon");
  s.configure(values(s));
  assert.equal(shouldPauseClock(s), true);
  s.tick(2);
  assert.equal(s.elapsed, 0);
  s.tick(3, true);
  assert.equal(shouldPauseClock(s), false);
  const p = until(new Session(), (t) => t.kind === "portion");
  p.configure(values(p));
  assert.equal(shouldPauseClock(p), false);
  const r = until(new Session(catalog.lemonade), (t) => t.kind === "repeat");
  r.configure(values(r));
  assert.equal(shouldPauseClock(r), false);
});
test("optional cookie rest grants exactly 10 aesthetic points; can be skipped only before starting", () => {
  const s = until(new Session(), (t) => t.kind === "chill");
  assert.equal(s.configure({ ...values(s), duration: 9 }).ok, false);
  s.configure(values(s));
  assert.equal(s.skipOptional(), false);
  s.tick(10);
  assert.equal(s.aesthetics, 110);
  const skip = until(new Session(), (t) => t.kind === "chill");
  assert.ok(skip.skipOptional());
  assert.equal(skip.aesthetics, 100);
});
test("portion count, collection, bounds and spacing remain enforced", () => {
  const s = until(new Session(), (t) => t.kind === "portion");
  assert.equal(s.configure({ ...values(s), portions: 21 }).ok, false);
  s.configure(values(s));
  assert.equal(s.place(0.1, 0.1).ok, false);
  s.collect();
  assert.equal(s.place(0, 0).ok, false);
  assert.ok(s.place(0.1, 0.1).ok);
  s.collect();
  assert.equal(s.place(0.12, 0.12).ok, false);
});
for (const id of ["cookie", "brownie"])
  test(`${id}: oven temperature, timing, gloves, early removal and burning`, () => {
    const d = catalog[id],
      s = until(new Session(d), (t) => !!t.temperature);
    assert.equal(s.configure({ ...values(s), temperature: 220 }).ok, false);
    action(s);
    until(s, (t) => t.kind === "bake");
    assert.equal(
      s.configure({ ...values(s), duration: d.bake.max + 1 }).ok,
      false,
    );
    s.configure(values(s));
    s.tick(d.bake.min - 1);
    s.equipGloves();
    assert.equal(s.removeTray().ok, false);
    s.tick(1);
    assert.ok(s.removeTray().ok);
    assert.equal(s.bakeQuality, "ideal");
    const burn = until(new Session(d), (t) => t.kind === "bake");
    burn.configure(values(burn));
    assert.equal(shouldPauseClock(burn), true);
    burn.tick(d.bake.burn + 0.01);
    assert.equal(burn.status, "burnt");
    assert.equal(burn.completed, false);
  });
test("lemonade: 4 lemons and a single eight-half batch, 150ml juice, 1000ml water and correct ranges", () => {
  const d = catalog.lemonade;
  assert.equal(d.tasks[0].quantity, 4);
  assert.equal(d.tasks.filter((t) => t.item === "halves").length, 1);
  assert.equal(d.tasks.find((t) => t.item === "halves").quantity, 8);
  assert.ok(!d.tasks.some((t) => /^half[0-9]/.test(t.item)));
  assert.equal(d.tasks.find((t) => t.item === "dry").quantity, 150);
  assert.equal(d.tasks.find((t) => t.item === "water").quantity, 1000);
  const s = until(new Session(d), (t) => t.item === "white");
  assert.equal(s.configure({ ...values(s), quantity: 3 }).ok, false);
  assert.ok(s.configure({ ...values(s), quantity: 6 }).ok);
  const ice = until(s, (t) => t.item === "ice");
  assert.equal(ice.configure({ ...values(ice), quantity: 11 }).ok, false);
  assert.ok(ice.configure({ ...values(ice), quantity: 10 }).ok);
});
test("lemonade: 90% fill and both optional garnishes required for presentation bonus", () => {
  const s = until(new Session(catalog.lemonade), (t) => t.item === "wet");
  assert.equal(s.configure({ ...values(s), quantity: 100 }).ok, false);
  action(s);
  action(s);
  assert.equal(s.aesthetics, 100);
  action(s);
  assert.equal(s.aesthetics, 110);
  const skip = until(new Session(catalog.lemonade), (t) => t.optional);
  skip.skipOptional();
  action(skip);
  assert.equal(skip.aesthetics, 100);
});
test("brownie: exact document quantities, noisette, aeration and mandatory two-hour cooling adaptation", () => {
  const d = catalog.brownie;
  for (const [item, amount] of Object.entries({
    butter: 170,
    chocolate: 120,
    white: 200,
    egg: 3,
    vanilla: 1,
    cocoa: 40,
    flour: 60,
    salt: 1,
  }))
    assert.equal(
      d.tasks.find((t) => t.item === item && t.quantity)?.quantity,
      amount,
    );
  assert.equal(
    d.tasks.some((t) => ["yeast", "rosemary", "oil"].includes(t.item)),
    false,
  );
  assert.equal(d.tasks.find((t) => t.item === "mixer").duration, 8);
  assert.match(d.tasks.find((t) => t.item === "mixer").note, /8 minutos reais/);
  assert.equal(
    d.tasks.find((t) => t.item === "stove" && t.duration).duration,
    6,
  );
  assert.equal(
    d.tasks.filter((t) => t.item === "butter" && t.delivery).length,
    2,
  );
  assert.equal(d.bake.min, 20);
  assert.equal(d.bake.max, 24);
});
test("brownie cuts require distinct positions and cannot advance without enough interactions", () => {
  const s = until(new Session(catalog.brownie), (t) => t.kind === "repeat");
  s.configure(values(s));
  s.repeat(0);
  assert.equal(s.repeat(0).ok, false);
  assert.equal(s.status, "repeat");
  for (let i = 1; i < 4; i++) s.repeat(i);
  assert.equal(s.task.item, "plate");
});
test("cooling cannot be skipped and serving cannot occur early", () => {
  const s = until(new Session(catalog.brownie), (t) => t.phase === 5);
  s.configure(values(s));
  s.tick(19.9);
  assert.equal(s.status, "running");
  assert.equal(s.configure(values(s)).ok, false);
  s.tick(0.1);
  assert.equal(s.task.item, "knife");
});
test("ingredients and required transfers demand a valid drop, ordinary stations are selectable", () => {
  assert.ok(requiresBowlDrop(catalog.cookie.tasks[0]));
  assert.ok(
    requiresBowlDrop(catalog.brownie.tasks.find((t) => t.item === "paper")),
  );
  assert.equal(
    requiresBowlDrop(catalog.lemonade.tasks.find((t) => t.item === "knife")),
    false,
  );
});

test("recipe time defaults to three minutes, migrates old saves and validates admin limits", () => {
  const settings = require("../js/game-settings");
  assert.equal(settings.DEFAULT_SECONDS, 180);
  for (const old of [undefined, NaN, 0, 30, 100, 179])
    assert.equal(settings.normalizeDuration(old), 180);
  assert.equal(settings.normalizeDuration(300), 300);
  assert.equal(settings.normalizeDuration(1801), 1800);
  assert.equal(settings.isValidDuration(179), false);
  assert.equal(settings.isValidDuration(180), true);
  assert.equal(settings.isValidDuration(1800), true);
  assert.equal(settings.isValidDuration(1801), false);
  assert.equal(settings.isValidDuration(180.5), false);
});
test("phase guidance includes correct amounts, duration and narrative procedure in all recipes", () => {
  const guide = require("../js/recipe-guide");
  const dry = guide.build(catalog.cookie, 0);
  assert.match(dry.introduction, /tigela de secos/);
  assert.match(dry.introduction, /reserve/);
  assert.match(dry.ingredients, /450 g/);
  assert.equal((dry.ingredients.match(/5 g/g) || []).length, 3);
  assert.match(dry.timing, /3 segundos/);
  for (const d of Object.values(catalog))
    for (let phase = 0; phase < d.phases.length; phase++) {
      const text = guide.build(d, phase);
      assert.ok(text.introduction);
      assert.ok(text.timing);
    }
  assert.match(guide.build(catalog.brownie, 4).timing, /180 °C/);
  assert.match(guide.build(catalog.brownie, 4).timing, /20–24/);
  assert.match(guide.build(catalog.lemonade, 1).ingredients, /8 metades/);
});

test("contextual balloons expose only the current actionable object", () => {
  const { contextMode } = require("../js/cookie-recipe");
  for (const definition of Object.values(catalog).filter((d) => d?.tasks)) {
    const s = new Session(definition);
    assert.equal(contextMode(s, s.task.item), "task");
    assert.equal(contextMode(s, "unrelated"), null);
    s.status = "running";
    assert.equal(contextMode(s, s.task.item), null);
    s.status = "baking";
    assert.equal(contextMode(s, "gloves"), "gloves");
    s.gloves = true;
    assert.equal(contextMode(s, "gloves"), null);
  }
});
