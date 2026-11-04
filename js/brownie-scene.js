/* Brownie: objetos interativos preservam os IDs usados pelo preparo do documento. */
window.BrownieScene = class BrownieScene extends CookieScene {
  constructor(root, interact, place, announce, onFailure, definition) {
    super(root, interact, place, announce, onFailure);
    this.definition = definition;
    for (const id of ["soda", "powder", "brown", "chips", "fridge"]) {
      const group = this.objects.get(id);
      this.scene.remove(group);
      this.objects.delete(id);
      for (const record of this.labels.filter((r) => r.id === id))
        record.label.remove();
      this.labels = this.labels.filter((r) => r.id !== id);
      group.traverse((o) => {
        if (!o.geometry?.userData.kitchenShared) o.geometry?.dispose();
        if (o.material)
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.dispose();
      });
    }
    const positions = {
      butter: [-5.7, 1.1],
      white: [-3.1, 1.1],
      egg: [-5.7, 2.7],
      vanilla: [-4.4, 2.7],
      flour: [-3.1, 2.7],
      salt: [-1.7, 1.1],
      paper: [3.2, 3.1],
      gloves: [6.4, 2.9],
      plate: [4.5, 3.2],
    };
    for (const [id, [x, z]] of Object.entries(positions))
      this.objects.get(id).position.set(x, 0, z);
    const shortLabels = {
      egg: "Ovos", vanilla: "Baunilha", white: "Açúcar branco",
      dry: "Tigela de chocolate", wet: "Tigela de ovos",
      plate: "Prato", tray: "Fôrma 20 × 20 cm", bench: "Descanso",
    };
    for (const record of this.labels) {
      record.label.textContent =
        shortLabels[record.id] || definition.items[record.id]?.[0] || record.label.textContent;
      record.width = 0;
    }
    const T = THREE;
    const material = (color, extra = {}) =>
      new T.MeshPhysicalMaterial({
        color,
        roughness: 0.4,
        metalness: 0,
        clearcoat: 0.2,
        ...extra,
      });
    const metal = material(0xb8c0bd, { metalness: 0.95, roughness: 0.23 }),
      dark = material(0x18241f, { roughness: 0.48 }),
      copper = material(0x9b6435, { metalness: 0.8, roughness: 0.3 });
    this.mat = material;
    const add = (parent, geometry, mat, xyz) => {
      const mesh = new T.Mesh(geometry, mat);
      mesh.position.set(...xyz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const box = (parent, size, pos, mat) =>
      add(parent, this.softBox(...size), mat, pos);
    const cyl = (parent, top, bottom, h, pos, mat) =>
      add(parent, new T.CylinderGeometry(top, bottom, h, 32), mat, pos);
    const tag = (group, id, y) =>
      this.label(group, definition.items[id][0], y, 1.6);
    this.stove = this.entity("stove", -5.5, -1.9);
    box(this.stove, [2, 0.18, 1.7], [0, 0.1, 0], dark);
    this.burner = new T.Mesh(
      new T.TorusGeometry(0.57, 0.035, 8, 48),
      material(0x394c43, { emissive: 0x6b240b, emissiveIntensity: 0 }),
    );
    this.burner.rotation.x = -Math.PI / 2;
    this.burner.position.y = 0.23;
    this.stove.add(this.burner);
    for (const x of [-0.65, 0.65])
      box(this.stove, [0.07, 0.07, 1.45], [x, 0.24, 0], metal);
    tag(this.stove, "stove", 0.5);
    this.pan = this.entity("pan", -5.5, -1.9);
    const profile = [
      [0, 0.27],
      [0.38, 0.27],
      [0.63, 0.32],
      [0.7, 0.47],
      [0.72, 0.55],
      [0.68, 0.56],
      [0.65, 0.42],
      [0.38, 0.31],
      [0, 0.31],
    ].map((p) => new T.Vector2(...p));
    add(this.pan, new T.LatheGeometry(profile, 48), metal, [0, 0, 0]);
    box(this.pan, [0.2, 0.13, 1.25], [0, 0.42, 1.05], dark);
    cyl(this.pan, 0.065, 0.065, 0.16, [0, 0.46, 0.62], copper);
    this.panButter = cyl(
      this.pan,
      0.59,
      0.59,
      0.05,
      [0, 0.35, 0],
      material(0xf3c65b, { roughness: 0.18, clearcoat: 0.8 }),
    );
    this.panButter.visible = false;
    tag(this.pan, "pan", 0.95);
    const eggGroup = this.objects.get("egg");
    for (const child of [...eggGroup.children])
      if (child.isMesh && child.geometry.type !== "CircleGeometry") {
        eggGroup.remove(child);
        if (!child.geometry.userData.kitchenShared) child.geometry.dispose();
        child.material.dispose();
      }
    cyl(
      eggGroup,
      0.58,
      0.53,
      0.065,
      [0, 0.055, 0],
      material(0xeee4cc, { roughness: 0.2, clearcoat: 0.8 }),
    );
    for (const [x, z] of [
      [-0.23, -0.12],
      [0.23, -0.12],
      [0, 0.22],
    ]) {
      const egg = add(
        eggGroup,
        new T.SphereGeometry(0.235, 24, 16),
        material(0xbfa071, {
          roughness: 0.55,
          bumpMap: this.grainTexture(),
          bumpScale: 0.004,
        }),
        [x, 0.38, z],
      );
      egg.scale.set(0.84, 1.2, 0.84);
    }
    const chocolate = this.entity("chocolate", -4.4, 1.1);
    box(chocolate, [1, 0.035, 0.78], [0, 0.035, 0], material(0xe4d1a8));
    for (let i = 0; i < 10; i++) {
      const piece = box(
        chocolate,
        [0.23, 0.12 + (i % 3) * 0.025, 0.28],
        [
          -0.33 + (i % 3) * 0.3,
          0.13 + Math.floor(i / 6) * 0.1,
          -0.23 + (Math.floor(i / 3) % 2) * 0.31,
        ],
        material(i % 2 ? 0x402019 : 0x512b20, { roughness: 0.3 }),
      );
      piece.rotation.y = i * 0.23;
    }
    tag(chocolate, "chocolate", 0.8);
    const cocoa = this.entity("cocoa", -1.7, 2.7);
    const glass = material(0xe4eee7, {
      transparent: true,
      opacity: 0.25,
      transmission: this.mobile ? 0 : 0.3,
      depthWrite: false,
      roughness: 0.08,
      thickness: 0.05,
      ior: 1.47,
    });
    cyl(cocoa, 0.36, 0.36, 0.82, [0, 0.45, 0], glass);
    cyl(
      cocoa,
      0.32,
      0.32,
      0.59,
      [0, 0.34, 0],
      material(0x4e2c20, {
        roughness: 0.98,
        bumpMap: this.grainTexture(),
        bumpScale: 0.012,
      }),
    );
    cyl(cocoa, 0.39, 0.39, 0.075, [0, 0.9, 0], metal);
    tag(cocoa, "cocoa", 1.15);
    this.sieve = this.entity("sieve", 1.95, 2.8);
    const rim = add(
      this.sieve,
      new T.TorusGeometry(0.46, 0.035, 8, 48),
      metal,
      [0, 0.4, 0],
    );
    rim.rotation.x = Math.PI / 2;
    box(
      this.sieve,
      [0.12, 0.09, 0.9],
      [0, 0.39, 0.82],
      material(0xbe905b, { roughness: 0.6 }),
    );
    const meshCanvas = document.createElement("canvas");
    meshCanvas.width = meshCanvas.height = 32;
    const ctx = meshCanvas.getContext("2d");
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 2, 32);
    ctx.fillRect(0, 0, 32, 2);
    const meshMap = new T.CanvasTexture(meshCanvas);
    meshMap.wrapS = meshMap.wrapT = T.RepeatWrapping;
    meshMap.repeat.set(16, 12);
    add(
      this.sieve,
      new T.LatheGeometry(
        [
          [0, 0.15],
          [0.22, 0.17],
          [0.37, 0.27],
          [0.44, 0.4],
        ].map((p) => new T.Vector2(...p)),
        32,
      ),
      material(0xb4c0b6, {
        map: meshMap,
        alphaTest: 0.4,
        side: T.DoubleSide,
        metalness: 0.8,
      }),
      [0, 0, 0],
    );
    this.sievePowder = cyl(
      this.sieve,
      0.32,
      0.25,
      0.04,
      [0, 0.25, 0],
      material(0x9c7754, { roughness: 0.95 }),
    );
    this.sievePowder.visible = false;
    tag(this.sieve, "sieve", 0.9);
    const knife = this.entity("knife", 5.45, 3.15);
    box(knife, [0.14, 0.1, 0.65], [0, 0.1, 0.23], dark);
    const blade = box(knife, [0.27, 0.025, 0.9], [0, 0.12, -0.53], metal);
    blade.rotation.y = 0.05;
    tag(knife, "knife", 0.65);
    // Fôrma quadrada: mantenha o nó de papel já usado pela receita e o alvo de arraste.
    for (const child of [...this.tray.children])
      if (
        child.isMesh &&
        child !== this.paperMesh &&
        child.geometry.type !== "CircleGeometry"
      ) {
        this.tray.remove(child);
        if (!child.geometry.userData.kitchenShared) child.geometry.dispose();
        child.material.dispose();
      }
    box(this.tray, [2.65, 0.1, 2.65], [0, 0.12, 0], metal);
    for (const x of [-1.3, 1.3])
      box(this.tray, [0.07, 0.26, 2.65], [x, 0.24, 0], metal);
    for (const z of [-1.3, 1.3])
      box(this.tray, [2.65, 0.26, 0.07], [0, 0.24, z], metal);
    if (!this.paperMesh.geometry.userData.kitchenShared)
      this.paperMesh.geometry.dispose();
    this.paperMesh.geometry = new T.BoxGeometry(2.47, 0.02, 2.47);
    this.paperMesh.position.y = 0.19;
    this.paperMesh.visible = false;
    this.rawBatter = box(
      this.tray,
      [2.38, 0.18, 2.38],
      [0, 0.3, 0],
      material(0x412219, { roughness: 0.25, clearcoat: 0.75 }),
    );
    this.rawBatter.visible = false;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = textureCanvas.height = 512;
    const c = textureCanvas.getContext("2d");
    c.fillStyle = "#61351f";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2400; i++) {
      c.fillStyle = i % 3 ? "#b47c4720" : "#26140c55";
      c.fillRect(
        (i * 71.17) % 512,
        (i * 43.31) % 512,
        2 + (i % 6),
        1 + (i % 3),
      );
    }
    c.lineWidth = 1.4;
    for (let i = 0; i < 34; i++) {
      c.strokeStyle = i % 2 ? "#bd8a5855" : "#24130c88";
      c.beginPath();
      let x = (i * 57.31) % 512,
        y = (i * 91.13) % 512;
      c.moveTo(x, y);
      for (let n = 0; n < 5; n++) {
        x += Math.sin(i + n * 1.7) * 18;
        y += 15 + (n % 3) * 4;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    const crust = new T.CanvasTexture(textureCanvas);
    crust.colorSpace = T.SRGBColorSpace;
    const topMat = material(0xffffff, {
        map: crust,
        bumpMap: crust,
        bumpScale: 0.018,
        roughness: 0.63,
        clearcoat: 0.12,
      }),
      sideMat = material(0x331b13, {
        roughness: 0.82,
        bumpMap: this.grainTexture(),
        bumpScale: 0.012,
      });
    this.baked = box(this.tray, [2.4, 0.32, 2.4], [0, 0.36, 0], sideMat);
    this.baked.material = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    this.baked.geometry = new T.BoxGeometry(2.4, 0.32, 2.4);
    this.baked.visible = false;
    this.cutMarks = [];
    for (let i = 0; i < 4; i++) {
      const cut = box(
        this.tray,
        i < 2 ? [0.025, 0.012, 2.4] : [2.4, 0.012, 0.025],
        i < 2 ? [-0.4 + i * 0.8, 0.525, 0] : [0, 0.525, -0.4 + (i - 2) * 0.8],
        material(0x211109),
      );
      cut.visible = false;
      this.cutMarks.push(cut);
    }
    this.servings = new T.Group();
    this.plate = this.objects.get("plate");
    this.plate.add(this.servings);
    for (let i = 0; i < 9; i++) {
      const piece = new T.Mesh(new T.BoxGeometry(0.32, 0.22, 0.32), [
        sideMat,
        sideMat,
        topMat,
        sideMat,
        sideMat,
        sideMat,
      ]);
      piece.position.set(
        -0.35 + (i % 3) * 0.35,
        0.21 + Math.floor(i / 6) * 0.12,
        -0.25 + (Math.floor(i / 3) % 2) * 0.35,
      );
      piece.castShadow = true;
      this.servings.add(piece);
    }
    this.servings.visible = false;
    this.dryMix.material.dispose();
    this.wetMix.material.dispose();
    this.dryMix.material = material(0x482318, {
      roughness: 0.22,
      clearcoat: 0.8,
    });
    this.wetMix.material = material(0xe6c98f, {
      roughness: 0.28,
      clearcoat: 0.6,
    });
    this.dryMix.position.y = 0.47;
    this.wetMix.position.y = 0.56;
    this.highlights.clear();
    for (const [id, g] of this.objects) {
      const materials = new Map(),
        copies = new Map();
      g.traverse((o) => {
        if (!o.material) return;
        const clone = (m) => {
          if (!copies.has(m)) copies.set(m, m.clone());
          return copies.get(m);
        };
        o.material = Array.isArray(o.material)
          ? o.material.map(clone)
          : clone(o.material);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          if (m.emissive)
            materials.set(m, {
              color: m.emissive.clone(),
              intensity: m.emissiveIntensity,
            });
      });
      this.highlights.set(id, { materials, amount: 0 });
    }
  }
  repeatPosition(point) {
    const local = this.tray.worldToLocal(point.clone());
    if (Math.abs(local.x) > 1.5 || Math.abs(local.z) > 1.5)
      return this.state.repetitions.length;
    return (local.x >= 0 ? 1 : 0) + (local.z >= 0 ? 2 : 0);
  }
  press() {
    this.needsRender = true;
    if (this.hand) {
      this.hand.pose("press", 1);
    }
  }
  sync(state) {
    this.state = state;
    this.needsRender = true;
    const t = state.task;
    if (!t) {
      this.servings.visible = state.completed;
      this.baked.visible = false;
      return;
    }
    const done = (item, filter = () => true) =>
      state.history.some((h) => h.item === item && !h.skipped && filter(h));
    for (const id of this.definition.ingredientIds)
      this.objects.get(id).visible = state.tasks.some(
        (task, index) => index >= state.index && task.item === id,
      );
    this.ring.visible = true;
    const target = this.objects.get(t.item);
    if (target)
      this.ring.position.set(target.position.x, 0.04, target.position.z);
    const heating = state.status === "running" && t.item === "stove";
    this.burner.material.emissiveIntensity = heating ? 2 : 0;
    this.panButter.visible =
      done("butter", (h) => h.quantity === 170) && !done("pan");
    this.panButter.material.color.set(
      heating
        ? new THREE.Color(0xe6bd54).lerp(
            new THREE.Color(0xad6824),
            Math.min(1, state.elapsed / state.target),
          )
        : 0xc18b38,
    );
    this.dryMix.visible = done("pan") && !done("dry");
    this.dryMix.material.color.set(done("chocolate") ? 0x45241a : 0xc58c38);
    this.wetMix.visible = done("egg") && !done("wet");
    const creamed = done("mixer")
      ? 1
      : state.status === "running" && t.item === "mixer"
        ? Math.min(1, state.elapsed / state.target)
        : 0;
    this.wetMix.material.color.copy(
      done("dry")
        ? new THREE.Color(0x49261c)
        : new THREE.Color(0xd5a94f).lerp(new THREE.Color(0xf1e0b5), creamed),
    );
    this.wet.position.set(
      t.item === "mixer" && state.status === "running" ? 2.05 : 0.6,
      0,
      t.item === "mixer" && state.status === "running" ? -2.2 : -1.35,
    );
    this.sievePowder.visible = done("flour") && !done("sieve");
    this.paperMesh.visible = done("paper");
    const baked = Boolean(state.bakeQuality),
      baking = state.status === "baking",
      inside = !baked && (baking || done("tray"));
    if (!this.drag || this.drag.id !== "tray") {
      this.tray.position.set(
        inside ? 5 : 4,
        inside ? 0.35 : 0,
        inside ? -2.45 : 1,
      );
      this.tray.scale.setScalar(inside ? 0.65 : 1);
    }
    this.ovenDoor.rotation.x =
      t.item === "tray" && t.target === "oven" ? -0.7 : 0;
    this.ovenLight.material.color.set(
      baking ? 0xff9d33 : done("oven") ? 0x815025 : 0x362414,
    );
    this.rawBatter.visible = done("wet") && !baked && !baking;
    this.baked.visible = baked || baking;
    this.baked.scale.y = baking
      ? 0.7 + 0.3 * Math.min(1, state.elapsed / 20)
      : 1;
    this.baked.material[2].color.set(
      state.bakeQuality === "burnt" ? 0x28110a : 0xffffff,
    );
    this.cutMarks.forEach(
      (m, i) =>
        (m.visible =
          done("knife") ||
          (state.status === "repeat" &&
            t.item === "knife" &&
            state.repetitions.length > i)),
    );
    this.servings.visible = state.completed || done("plate");
  }
};
