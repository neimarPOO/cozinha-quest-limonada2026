/* Ambientes específicos usam a mesma bancada, mão, câmera e painéis do fluxo de cookies. */
window.RecipeScene = class RecipeScene extends CookieScene {
  constructor(root, interact, place, announce, onFailure, definition) {
    super(root, interact, place, announce, onFailure);
    this.definition = definition;
    this.decoration = [];
    const keep =
      definition.id === "focaccia"
        ? [
            "wet",
            "spoon",
            "spatula",
            "tray",
            "oven",
            "gloves",
            "bench",
            "plate",
          ]
        : ["spoon", "bench"];
    for (const [id, g] of [...this.objects])
      if (!keep.includes(id)) this.removeEntity(id);
    for (const record of this.labels) {
      record.label.textContent =
        definition.items[record.id]?.[0] || record.label.textContent;
      record.width = 0;
      record.height = 0;
    }
    this.actionMarks = [];
    if (definition.id === "lemonade") this.lemonadeAssets();
    else this.focacciaAssets();
    window.KitchenAssets?.enhanceRecipe?.(this);
    this.highlights.clear();
    for (const [id, g] of this.objects) {
      if (!this.highlights.has(id)) {
        const materials = new Map();
        g.traverse((o) => {
          if (o.material?.emissive)
            materials.set(o.material, {
              color: o.material.emissive.clone(),
              intensity: o.material.emissiveIntensity,
            });
        });
        this.highlights.set(id, { materials, amount: 0 });
      }
    }
  }
  removeEntity(id) {
    const g = this.objects.get(id);
    this.scene.remove(g);
    g.traverse((o) => {
      if (!o.geometry?.userData.kitchenShared) o.geometry?.dispose();
      if (o.material) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    this.objects.delete(id);
    this.highlights.delete(id);
    this.labels = this.labels.filter((r) => {
      if (r.id !== id) return true;
      r.label.remove();
      return false;
    });
  }
  tag(g, id, y = 1) {
    this.label(g, this.definition.items[id][0], y, 1.8);
    return g;
  }
  jar(id, x, z, color) {
    const g = this.entity(id, x, z);
    this.cylinder(g, color, 0.32, 0.32, 0.55, [0, 0.35, 0]);
    this.cylinder(g, 0xcbb991, 0.36, 0.36, 0.1, [0, 0.69, 0]);
    return this.tag(g, id, 0.94);
  }
  vessel(id, x, z, r, h) {
    const g = this.entity(id, x, z);
    const body = this.cylinder(g, 0xc4e4dc, r, r * 0.9, h, [0, h / 2, 0]);
    body.material.transparent = true;
    body.material.opacity = 0.26;
    body.material.roughness = 0.16;
    body.material.depthWrite = false;
    this.tag(g, id, h + 0.3);
    return g;
  }
  knife(id, x, z) {
    const g = this.entity(id, x, z);
    this.box(g, 0xd5e0df, [0.13, 0.07, 0.9], [0, 0.14, -0.2]);
    this.box(g, 0x69482d, [0.16, 0.12, 0.5], [0, 0.14, 0.5]);
    return this.tag(g, id, 0.6);
  }
  lemonadeAssets() {
    const board = this.entity("board", -3.5, 0);
    this.box(board, 0xb4834e, [3, 0.1, 1.6], [0, 0.03, 0]);
    this.tag(board, "board", 0.5);
    this.knife("knife", -1.7, 1.9);
    const lemons = this.entity("lemon", -5.3, 2);
    this.wholeLemons = [];
    for (let i = 0; i < 4; i++) {
      const m = this.sphere(lemons, 0xc8d532, 0.26, [
        (i % 2) * 0.6,
        0.3,
        Math.floor(i / 2) * 0.5,
      ]);
      this.wholeLemons.push(m);
      m.scale.set(1.2, 0.9, 0.9);
      m.material.bumpMap = this.grainTexture();
      m.material.bumpScale = 0.018;
    }
    this.tag(lemons, "lemon", 1);
    this.halves = [];
    this.halvesBatch = this.entity("halves", -3.4, 0);
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      g.position.set(-1.1 + (i % 4) * 0.75, 0, -0.35 + Math.floor(i / 4) * 0.7);
      this.halvesBatch.add(g);
      this.cylinder(g, 0xf3eda2, 0.25, 0.25, 0.12, [0, 0.17, 0]);
      const rind = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.025, 8, 28),
        this.material(0xa7bd21),
      );
      rind.rotation.x = Math.PI / 2;
      rind.position.y = 0.24;
      g.add(rind);
      for (let j = 0; j < 6; j++) {
        const line = this.box(g, 0xfff6c4, [0.015, 0.015, 0.4], [0, 0.24, 0]);
        line.rotation.y = (j * Math.PI) / 3;
      }
      this.halves.push(g);
    }
    this.tag(this.halvesBatch, "halves", 0.75);
    this.dry = this.entity("dry", -0.5, -1.1);
    this.cylinder(this.dry, 0x74b6af, 0.65, 0.65, 0.3, [0, 0.2, 0]);
    this.cylinder(this.dry, 0xbed65b, 0.02, 0.25, 0.55, [0, 0.5, 0]);
    this.juice = this.cylinder(
      this.dry,
      0xdce552,
      0.56,
      0.56,
      0.03,
      [0, 0.35, 0],
    );
    this.tag(this.dry, "dry", 1.2);
    this.wet = this.vessel("wet", 2, -0.8, 0.62, 1.65);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.065, 10, 32),
      this.material(0xafcfc4),
    );
    handle.position.set(0.7, 0.9, 0);
    this.wet.add(handle);
    this.wetMix = this.cylinder(
      this.wet,
      0xdae86c,
      0.53,
      0.49,
      0.06,
      [0, 0.2, 0],
    );
    this.wetMix.material.transparent = true;
    this.wetMix.material.opacity = 0.75;
    this.glass = this.vessel("glass", 4.8, 1.5, 0.36, 1.15);
    this.drink = this.cylinder(
      this.glass,
      0xd7e66e,
      0.3,
      0.27,
      0.8,
      [0, 0.45, 0],
    );
    this.drink.visible = false;
    this.jarIce = [];
    this.glassIce = [];
    for (let i = 0; i < 10; i++) {
      const cube = this.box(
        this.wet,
        0xb9e5ef,
        [0.17, 0.17, 0.17],
        [
          Math.cos(i * 2.4) * 0.3,
          1.05 + (i % 2) * 0.17,
          Math.sin(i * 2.4) * 0.3,
        ],
      );
      cube.material.transparent = true;
      cube.material.opacity = 0.65;
      cube.visible = false;
      this.jarIce.push(cube);
    }
    for (let i = 0; i < 2; i++) {
      const cube = this.box(
        this.glass,
        0xb9e5ef,
        [0.15, 0.15, 0.15],
        [i * 0.2 - 0.1, 0.18, 0],
      );
      cube.visible = false;
      this.glassIce.push(cube);
    }
    this.jar("water", -5, 3, 0x82bac5);
    this.jar("white", -3.7, 3, 0xece3c8);
    const ice = this.entity("ice", -0.5, 2.8);
    for (let i = 0; i < 10; i++) {
      const m = this.box(
        ice,
        0xb9e5ed,
        [0.2, 0.2, 0.2],
        [(i % 4) * 0.22, 0.2 + Math.floor(i / 4) * 0.16, 0],
      );
      m.material.transparent = true;
      m.material.opacity = 0.65;
    }
    this.tag(ice, "ice", 1);
    const mint = this.entity("mint", 5.8, 3);
    for (let i = 0; i < 5; i++) {
      const leaf = this.sphere(mint, 0x3b8c3b, 0.2, [
        (i % 2) * 0.2,
        0.2 + i * 0.05,
        0,
      ]);
      leaf.scale.set(1, 0.2, 1.5);
      leaf.rotation.y = i;
    }
    this.tag(mint, "mint", 0.8);
    const slice = this.entity("slice", 4.3, 3);
    this.cylinder(slice, 0xe3dd5d, 0.3, 0.3, 0.06, [0, 0.14, 0]);
    this.tag(slice, "slice", 0.65);
    this.condensation = [];
    for (let i = 0; i < 24; i++) {
      const a = i * 2.4,
        m = this.sphere(this.wet, 0xe3fcff, 0.025, [
          Math.cos(a) * 0.63,
          0.25 + (i % 7) * 0.17,
          Math.sin(a) * 0.63,
        ]);
      m.visible = false;
      this.condensation.push(m);
    }
  }
  focacciaAssets() {
    this.dry = this.vessel("dry", -2.4, -1.2, 0.46, 1);
    this.yeastLiquid = this.cylinder(
      this.dry,
      0xd7c58a,
      0.38,
      0.36,
      0.45,
      [0, 0.3, 0],
    );
    this.yeastLiquid.visible = false;
    const ingredients = [
      ["water", -6, 1, 0x8ebdc7],
      ["yeast", -4.8, 1, 0xc5ad7a],
      ["white", -3.6, 1, 0xf1e6c8],
      ["flour", -6, 2.6, 0xe8dbba],
      ["salt", -4.8, 2.6, 0xeee6d2],
      ["oil", -3.6, 2.6, 0x8d9f32],
      ["rosemary", -2.4, 2.6, 0x3f793b],
      ["coarse", -1.2, 2.6, 0xf4e7c8],
    ];
    for (const [id, x, z, c] of ingredients) this.jar(id, x, z, c);
    const cloth = this.entity("cloth", 2.3, 2.9);
    this.clothMesh = this.box(cloth, 0xd3d4bd, [1, 0.04, 0.8], [0, 0.12, 0]);
    this.tag(cloth, "cloth", 0.6);
    const hands = this.entity("hands", 1.3, 2.8);
    this.box(hands, 0x759a69, [0.7, 0.05, 0.65], [0, 0.1, 0]);
    this.tag(hands, "hands", 0.65);
    this.knife("knife", 5.8, 2.8);
    this.dough = this.sphere(this.wet, 0xe3cb9a, 0.6, [0, 0.45, 0]);
    this.dough.scale.y = 0.5;
    this.bread = this.box(this.tray, 0xe5cb95, [2.65, 0.26, 1.7], [0, 0.38, 0]);
    this.bread.visible = false;
    this.bread.material.bumpMap = this.grainTexture();
    this.bread.material.bumpScale = 0.025;
    this.cutMarks = [];
    for (let i = 0; i < 4; i++) {
      const mark = this.box(
        this.tray,
        0x684723,
        [0.025, 0.01, 1.7],
        [-0.9 + i * 0.6, 0.53, 0],
      );
      mark.visible = false;
      this.cutMarks.push(mark);
    }
    this.dimples = [];
    for (let i = 0; i < 6; i++) {
      const d = this.cylinder(this.tray, 0x987344, 0.1, 0.08, 0.02, [
        -0.8 + (i % 3) * 0.8,
        0.525,
        -0.4 + Math.floor(i / 3) * 0.8,
      ]);
      d.visible = false;
      this.dimples.push(d);
    }
    this.foam = [];
    for (let i = 0; i < 10; i++) {
      const bubble = this.sphere(this.dry, 0xefe7c9, 0.055, [
        Math.cos(i * 2.4) * 0.25,
        0.55,
        Math.sin(i * 2.4) * 0.25,
      ]);
      bubble.visible = false;
      this.foam.push(bubble);
    }
    this.herbs = [];
    for (let i = 0; i < 16; i++) {
      const leaf = this.box(
        this.tray,
        0x3e6d31,
        [0.025, 0.025, 0.16],
        [-1 + (i % 5) * 0.45, 0.54, -0.6 + Math.floor(i / 5) * 0.35],
      );
      leaf.rotation.y = i;
      leaf.visible = false;
      this.herbs.push(leaf);
    }
  }
  repeatPosition(point, task) {
    if (this.definition.id !== "focaccia" || task.target !== "tray")
      return this.state.repetitions.length;
    const local = this.tray.worldToLocal(point.clone());
    if (task.phase === 3)
      return (local.x >= 0 ? 1 : 0) + (local.z >= 0 ? 2 : 0);
    if (task.phase === 4)
      return (
        "point:" + Math.round(local.x / 0.25) + ":" + Math.round(local.z / 0.25)
      );
    return this.state.repetitions.length;
  }
  press() {
    if (this.hand) {
      const g = this.objects.get(this.state.task?.target || "tray");
      if (g) {
        this.hand.group.position
          .copy(g.position)
          .add(new THREE.Vector3(0, 0.9, 0));
        this.hand.group.scale.setScalar(1.7);
        this.hand.pose("press", 1);
        this.hand.group.visible = true;
      }
    }
  }
  sync(state) {
    this.needsRender = true;
    this.state = state;
    const t = state.task;
    if (!t) return;
    const done = (item, filter = () => true) =>
      state.history.some((h) => h.item === item && !h.skipped && filter(h));
    const target = this.objects.get(t.target || t.item);
    if (target) {
      this.ring.position.set(target.position.x, 0.04, target.position.z);
      this.ring.visible = true;
    }
    for (const [id, g] of this.objects) {
      if (this.definition.ingredientIds.includes(id)) {
        g.visible = state.tasks.some(
          (task, i) => i >= state.index && task.item === id,
        );
      }
    }
    if (this.definition.id === "lemonade") {
      const cut = done("knife");
      const cuts = cut
        ? 4
        : t.kind === "repeat" && t.item === "knife"
          ? state.repetitions.length
          : 0;
      this.objects.get("lemon").visible = !cut;
      if (done("lemon") && this.drag?.id !== "lemon")
        this.objects.get("lemon").position.set(-4.2, 0, -0.35);
      this.wholeLemons.forEach((m, i) => (m.visible = i >= cuts));
      this.halvesBatch.visible = cuts > 0 && !done("halves");
      this.halves.forEach((g, i) => (g.visible = i < cuts * 2));
      const processing = t.item === "halves" && state.status === "running";
      const extracted = done("halves")
        ? 8
        : processing
          ? Math.min(8, (state.elapsed / state.target) * 8)
          : 0;
      if (this.drag?.id !== "halves") {
        this.halvesBatch.position.set(-3.4, 0, 0);
        this.halvesBatch.scale.setScalar(1);
        if (processing) {
          const progress = Math.min(1, state.elapsed / state.target);
          this.halvesBatch.position.lerp(
            this.dry.position.clone().add(new THREE.Vector3(0, 0.6, 0)),
            progress,
          );
          this.halvesBatch.scale.setScalar(1 - progress * 0.7);
        }
      }
      this.juice.scale.y = done("dry") ? 0.1 : Math.max(0.1, extracted);
      this.juice.position.y = 0.23 + extracted * 0.013;
      const poured = done("dry");
      const water = done("water");
      this.wetMix.visible = poured;
      this.wetMix.scale.y = water ? 18 : 3;
      this.wetMix.position.y = water ? 0.8 : 0.3;
      this.wetMix.material.color.set(done("spoon") ? 0xdbe88a : 0xd2cc76);
      this.condensation.forEach(
        (d) =>
          (d.visible = state.history.some(
            (h) => h.item === "bench" && !h.skipped,
          )),
      );
      const pouring = t.item === "wet" && state.status === "running";
      this.drink.visible = done("wet") || pouring;
      this.drink.scale.y = pouring
        ? Math.max(0.02, state.elapsed / state.target)
        : 1;
      const iceAdds = state.history.filter((h) => h.item === "ice");
      this.jarIce.forEach(
        (m, i) => (m.visible = i < (iceAdds[0]?.quantity || 0)),
      );
      this.glassIce.forEach((m) => (m.visible = iceAdds.length > 1));
      if (done("slice"))
        this.objects
          .get("slice")
          .position.copy(this.glass.position)
          .add(new THREE.Vector3(0.3, 0.9, 0));
      if (done("mint"))
        this.objects
          .get("mint")
          .position.copy(this.glass.position)
          .add(new THREE.Vector3(0, 1, 0));
    } else {
      this.yeastLiquid.visible = done("water");
      this.foam.forEach(
        (m) => (m.visible = done("bench", (h) => h.phase === 0)),
      );
      const first = done("bench", (h) => h.phase === 2),
        second = done("bench", (h) => h.phase === 3);
      this.dough.visible = done("flour") && !done("wet");
      const progress =
        state.status === "running" && t.phase === 2
          ? state.elapsed / state.target
          : 0;
      const growth = first
        ? Math.cbrt(2)
        : 1 + (Math.cbrt(2) - 1) * Math.min(1, progress);
      this.dough.scale.set(growth, 0.5 * growth, growth);
      this.wetMix.visible = false;
      this.bread.visible = done("wet");
      this.paperMesh.visible = false;
      this.bread.scale.x = second
        ? 1
        : Math.min(1, 0.55 + state.repetitions.length * 0.1);
      this.bread.material.color.set(
        state.status === "baking"
          ? new THREE.Color(0xe5cb95).lerp(
              new THREE.Color(0xb77b32),
              Math.min(1, state.elapsed / 23),
            )
          : state.bakeQuality === "burnt"
            ? 0x3b2617
            : state.bakeQuality
              ? 0xb77b32
              : 0xe5cb95,
      );
      const pressed = done("hands", (h) => h.phase === 4);
      this.dimples.forEach(
        (m, i) =>
          (m.visible =
            pressed ||
            (t.phase === 4 &&
              t.kind === "repeat" &&
              state.repetitions.length > i)),
      );
      this.herbs.forEach((m) => (m.visible = done("rosemary")));
      const cloth = this.objects.get("cloth");
      if (this.drag?.id !== "cloth") {
        cloth.position.set(2.3, 0, 2.9);
        this.clothMesh.scale.set(1, 1, 1);
        if (
          [2, 3].includes(t.phase) &&
          done("cloth", (h) => h.phase === t.phase)
        ) {
          cloth.position
            .copy(t.phase === 2 ? this.wet.position : this.tray.position)
            .add(new THREE.Vector3(0, 0.85, 0));
          this.clothMesh.scale.set(
            t.phase === 2 ? 2 : 3,
            1,
            t.phase === 2 ? 2 : 2.5,
          );
        }
      }
      this.cutMarks.forEach(
        (mark, i) =>
          (mark.visible =
            done("knife") ||
            (t.phase === 6 &&
              t.kind === "repeat" &&
              state.repetitions.length > i)),
      );
      if (this.drag?.id !== "tray")
        this.tray.position.set(
          state.status === "baking" ? 5 : 4,
          state.status === "baking" ? 0.35 : 0,
          state.status === "baking" ? -2.1 : 1,
        );
      this.ovenLight.material.color.set(
        state.status === "baking" ? 0xff902b : 0x3d2f1b,
      );
      for (const r of this.labels)
        if (r.id === "oven") r.label.textContent = "Forno · 220 °C";
    }
  }
};
