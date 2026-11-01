/* Assets procedurais locais, sem downloads ou dependências adicionais. */
window.CookieScene = class CookieScene {
  constructor(root, interact, place, announce) {
    this.root = root;
    this.interact = interact;
    this.place = place;
    this.announce = announce;
    this.objects = new Map();
    this.disposed = false;
    this.time = 0;
    const T = THREE;
    this.T = T;
    this.renderer = new T.WebGLRenderer({
      antialias: false,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Bancada 3D de cookies. Use também os botões de ingredientes e estações.",
    );
    root.append(this.renderer.domElement);
    this.scene = new T.Scene();
    this.scene.background = new T.Color("#121e28");
    this.camera = new T.PerspectiveCamera(43, 1, 0.1, 100);
    this.camera.position.set(0, 10.5, 12.8);
    this.camera.lookAt(0, 0.2, -0.3);
    this.scene.add(new T.HemisphereLight(0xe9ffe3, 0x26344a, 2));
    const light = new T.DirectionalLight(0xffe4b3, 2.8);
    light.position.set(-4, 9, 5);
    this.scene.add(light);
    const blue = new T.PointLight(0x53d9df, 25, 18);
    blue.position.set(6, 4, -3);
    this.scene.add(blue);
    const desk = this.box(this.scene, 0x805333, [15, 0.4, 8], [0, -0.3, 0]);
    const wood = document.createElement("canvas");
    wood.width = 1024;
    wood.height = 512;
    const woodCtx = wood.getContext("2d");
    woodCtx.fillStyle = "#9a713f";
    woodCtx.fillRect(0, 0, 1024, 512);
    for (let n = 0; n < 140; n++) {
      const y = n * 3.7;
      woodCtx.strokeStyle = n % 4 === 0 ? "#5f3f243f" : "#d9a76735";
      woodCtx.lineWidth = (n % 3) + 1;
      woodCtx.beginPath();
      woodCtx.moveTo(0, y);
      woodCtx.bezierCurveTo(280, y + 5, 600, y - 7, 1024, y + 2);
      woodCtx.stroke();
    }
    const woodMap = new T.CanvasTexture(wood);
    woodMap.colorSpace = T.SRGBColorSpace;
    desk.material.map = woodMap;
    desk.material.color.set(0xffffff);
    this.box(this.scene, 0x203b3b, [15, 0.1, 0.12], [0, 1.05, -3.85]);
    for (const x of [-4, 4]) {
      const lamp = new T.PointLight(0xffb54f, 8, 8);
      lamp.position.set(x, 3.2, -2.5);
      this.scene.add(lamp);
      this.box(this.scene, 0xf6b452, [2.4, 0.05, 0.12], [x, 3, -3.7]);
    }
    this.box(this.scene, 0x213d3c, [15, 5, 0.2], [0, 2, -4.1]);
    for (let x = -7; x <= 7; x++)
      this.box(this.scene, 0x395650, [0.025, 5, 0.03], [x, 2, -3.96]);
    for (let y = 0; y < 5; y++)
      this.box(this.scene, 0x395650, [15, 0.025, 0.03], [0, y, -3.96]);
    const specs = [
      ["flour", -6, 1.1, 0xf0e4c8],
      ["soda", -4.8, 1.1, 0xe6ebdf],
      ["powder", -3.6, 1.1, 0xeee3ca],
      ["salt", -2.4, 1.1, 0xf9f6ed],
      ["butter", -1.2, 1.1, 0xf1d362],
      ["brown", -6, 2.7, 0x8c582f],
      ["white", -4.8, 2.7, 0xece7d6],
      ["egg", -3.6, 2.7, 0xf1d6aa],
      ["vanilla", -2.4, 2.7, 0x77432b],
      ["chips", -1.2, 2.7, 0x45251b],
    ];
    for (const [id, x, z, color] of specs) {
      const g = this.entity(id, x, z);
      if (id === "butter") {
        this.box(g, 0xe4e1d4, [0.9, 0.07, 0.65], [0, 0.04, 0]);
        this.box(g, color, [0.7, 0.35, 0.45], [0, 0.25, 0]);
      } else if (id === "egg") {
        const e = this.sphere(g, color, 0.3, [0, 0.45, 0]);
        e.scale.set(0.85, 1.4, 0.85);
        this.cylinder(g, 0xe3d5bf, 0.4, 0.4, 0.08, [0, 0.05, 0]);
      } else if (id === "flour") {
        this.box(g, 0xdccda9, [0.7, 0.95, 0.48], [0, 0.5, 0]);
        this.box(g, 0xf1e6c9, [0.75, 0.15, 0.51], [0, 1.01, 0]);
        this.box(g, 0x54845a, [0.55, 0.26, 0.02], [0, 0.6, 0.25]);
      } else if (id === "vanilla") {
        this.cylinder(g, color, 0.2, 0.23, 0.65, [0, 0.4, 0]);
        this.cylinder(g, 0x222628, 0.16, 0.16, 0.17, [0, 0.81, 0]);
      } else {
        this.cylinder(g, 0x99b2ad, 0.36, 0.36, 0.12, [0, 0.08, 0]);
        this.cylinder(g, color, 0.32, 0.32, 0.52, [0, 0.4, 0]);
        this.cylinder(g, 0xc6b687, 0.39, 0.39, 0.12, [0, 0.75, 0]);
        if (["brown", "white", "salt"].includes(id))
          for (let n = 0; n < 18; n++) {
            const a = n * 2.4;
            this.sphere(g, color, 0.035, [
              Math.cos(a) * (0.08 + (n % 3) * 0.08),
              0.68,
              Math.sin(a) * (0.08 + (n % 3) * 0.08),
            ]);
          }
        if (id === "chips")
          for (let i = 0; i < 10; i++) {
            const a = i * 2.4;
            this.sphere(g, 0x321a11, 0.07, [
              Math.cos(a) * 0.2,
              0.68,
              Math.sin(a) * 0.2,
            ]);
          }
      }
      this.label(g, CookieRecipe.items[id][0], 1.04, 1.35);
    }
    this.dry = this.bowl("dry", -1.7, -1.45, 0.78, 0x66bfb8);
    this.wet = this.bowl("wet", 0.6, -1.35, 1.02, 0xf0e3be);
    this.dryMix = this.cylinder(
      this.dry,
      0xe5d2b0,
      0.6,
      0.6,
      0.04,
      [0, 0.34, 0],
    );
    this.dryMix.visible = false;
    this.wetMix = this.cylinder(
      this.wet,
      0xd3b275,
      0.8,
      0.8,
      0.1,
      [0, 0.38, 0],
    );
    this.wetMix.visible = false;
    this.doughChips = [];
    for (let i = 0; i < 22; i++) {
      const a = i * 2.4,
        r = 0.16 + (i % 5) * 0.12;
      const chip = this.sphere(this.wet, 0x45271a, 0.055, [
        Math.cos(a) * r,
        0.45,
        Math.sin(a) * r,
      ]);
      chip.visible = false;
      this.doughChips.push(chip);
    }
    const mixer = this.entity("mixer", 2.4, -2.2);
    this.box(mixer, 0x3d8790, [0.9, 0.2, 0.8], [0, 0.1, 0]);
    this.box(mixer, 0x3d8790, [0.3, 1.4, 0.4], [0.3, 0.8, 0]);
    this.box(mixer, 0x72bac0, [1.2, 0.4, 0.65], [0, 1.4, 0]);
    this.whisk = new T.Group();
    this.whisk.position.set(-0.35, 0.9, 0);
    mixer.add(this.whisk);
    this.cylinder(this.whisk, 0xc8d9dc, 0.04, 0.04, 0.65, [0, 0, 0]);
    for (let w = 0; w < 3; w++) {
      const wire = new T.Mesh(
        new T.TorusGeometry(0.18, 0.014, 6, 18),
        this.material(0xd6e4e0),
      );
      wire.rotation.y = (w * Math.PI) / 3;
      wire.position.y = -0.25;
      this.whisk.add(wire);
    }
    this.label(mixer, "Batedeira", 1.9, 1.7);
    for (const [id, x, z] of [
      ["spoon", 0.6, 1.25],
      ["spatula", 1.8, 1.25],
    ]) {
      const g = this.entity(id, x, z);
      this.box(
        g,
        id === "spoon" ? 0x997349 : 0xe2aa78,
        [0.12, 0.1, 1],
        [0, 0.15, 0],
      );
      if (id === "spoon") {
        const m = this.sphere(g, 0xb48b58, 0.22, [0, 0.15, -0.6]);
        m.scale.y = 0.25;
      } else this.box(g, 0x79c3b8, [0.45, 0.1, 0.45], [0, 0.15, -0.6]);
      this.label(g, CookieRecipe.items[id][0], 0.6, 1.2);
    }
    this.tray = this.entity("tray", 4, 1.0);
    this.box(this.tray, 0x525f65, [3, 0.16, 2], [0, 0.12, 0]);
    for (const x of [-1.5, 1.5])
      this.box(this.tray, 0x8a9ca0, [0.08, 0.18, 2.1], [x, 0.2, 0]);
    for (const z of [-1, 1])
      this.box(this.tray, 0x8a9ca0, [3, 0.18, 0.08], [0, 0.2, z]);
    this.paperMesh = this.box(
      this.tray,
      0xf2e2bb,
      [2.85, 0.02, 1.85],
      [0, 0.22, 0],
    );
    this.paperMesh.visible = false;
    this.label(this.tray, "Assadeira", 0.7, 1.7);
    const paper = this.entity("paper", 2.4, 2.8);
    this.cylinder(paper, 0xf1e3c8, 0.13, 0.13, 1.2, [0, 0.2, 0]).rotation.z =
      Math.PI / 2;
    this.box(paper, 0xe9dbb8, [1.15, 0.02, 0.55], [0, 0.06, 0.35]);
    this.label(paper, "Papel-Manteiga", 0.7, 1.8);
    const fridge = this.entity("fridge", -5.5, -2.45);
    this.box(fridge, 0x78b5b2, [1.8, 2.5, 1.25], [0, 1.25, 0]);
    this.box(fridge, 0xbed5ca, [1.65, 2.25, 0.1], [0, 1.25, 0.68]);
    this.box(fridge, 0x364e54, [0.08, 0.65, 0.12], [0.6, 1.6, 0.8]);
    this.label(fridge, "Geladeira", 2.85, 1.8);
    this.oven = this.entity("oven", 5, -2.4);
    this.box(this.oven, 0x26343c, [2.6, 1.9, 1.7], [0, 0.95, 0]);
    this.ovenDoor = this.box(
      this.oven,
      0x11191d,
      [2.2, 1.2, 0.08],
      [0, 0.85, 0.89],
    );
    this.box(this.oven, 0x95a7a3, [1.7, 0.08, 0.12], [0, 1.5, 1]);
    this.box(this.oven, 0xa3b8b9, [0.12, 1.15, 0.08], [-1.13, 0.85, 0.95]);
    this.box(this.oven, 0xa3b8b9, [0.12, 1.15, 0.08], [1.13, 0.85, 0.95]);
    for (const x of [-0.7, 0.7])
      this.cylinder(this.oven, 0xbcc6b3, 0.11, 0.11, 0.1, [
        x,
        1.72,
        0.92,
      ]).rotation.x = Math.PI / 2;
    this.ovenLight = this.box(
      this.oven,
      0x3d2f1b,
      [1.8, 0.72, 0.04],
      [0, 0.9, 0.95],
    );
    this.label(this.oven, "Forno · 180 °C", 2.3, 2);
    const gloves = this.entity("gloves", 6.1, 2.8);
    for (const x of [-0.23, 0.23]) {
      this.box(gloves, 0xbd4c3c, [0.37, 0.18, 0.65], [x, 0.14, 0]);
      this.sphere(gloves, 0xdb6a44, 0.18, [x, 0.17, -0.35]);
    }
    this.label(gloves, "Luvas Térmicas", 0.65, 1.7);
    const plate = this.entity("plate", 4.3, 2.9);
    this.cylinder(plate, 0xc2e0d0, 0.67, 0.7, 0.07, [0, 0.08, 0]);
    this.label(plate, "Prato", 0.55, 1.2);
    const bench = this.entity("bench", 0.1, 3.2);
    this.box(bench, 0x468d83, [1, 0.03, 0.7], [0, 0.03, 0]);
    this.label(bench, "Resfriar", 0.5, 1.4);
    this.cookies = [];
    this.ray = new T.Raycaster();
    this.pointer = new T.Vector2();
    this.ring = new T.Mesh(
      new T.TorusGeometry(0.7, 0.035, 8, 40),
      new T.MeshBasicMaterial({ color: 0xc6f44b }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.scene.add(this.ring);
    const canvas = this.renderer.domElement;
    this.down = (e) => {
      if (e.button !== 0) return;
      const hit = this.hit(e);
      if (!hit) return;
      this.drag = {
        id: hit.id,
        g: hit.g,
        x: e.clientX,
        y: e.clientY,
        home: hit.g.position.clone(),
      };
      canvas.setPointerCapture(e.pointerId);
    };
    this.move = (e) => {
      if (!this.drag) return;
      const d = this.drag;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.moved = true;
      this.setRay(e);
      const v = new T.Vector3();
      this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -0.6), v);
      if (v) d.g.position.set(v.x, 0.6, v.z);
    };
    this.up = (e) => {
      if (!this.drag) return;
      const d = this.drag;
      d.g.position.copy(d.home);
      this.drag = null;
      const target = this.hit(e, d.id);
      if (
        d.moved &&
        target?.id === "tray" &&
        d.id === "wet" &&
        this.state?.status === "portion"
      ) {
        this.setRay(e);
        const v = new T.Vector3();
        this.ray.ray.intersectPlane(
          new T.Plane(new T.Vector3(0, 1, 0), -0.25),
          v,
        );
        const local = this.tray.worldToLocal(v);
        this.place((local.x + 1.5) / 3, (local.z + 1) / 2, true);
      } else this.interact(d.id, d.moved ? target?.id : null);
    };
    this.cancel = () => {
      if (this.drag) this.drag.g.position.copy(this.drag.home);
      this.drag = null;
    };
    canvas.addEventListener("pointerdown", this.down);
    canvas.addEventListener("pointermove", this.move);
    canvas.addEventListener("pointerup", this.up);
    canvas.addEventListener("pointercancel", this.cancel);
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.announce(
        "A visualização 3D está indisponível. Continue com os botões abaixo.",
      );
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(root);
    this.resize();
    this.last = performance.now();
    this.frame = (t) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.frame);
      if (document.hidden) return;
      if (t - this.last < 1000 / 30) return;
      this.time = t / 1000;
      this.last = t;
      if (
        this.state?.status === "running" &&
        ["mixer", "spoon", "spatula"].includes(this.state.task.item) &&
        (!this.state.requiresStir || this.state.working)
      ) {
        this.wetMix.rotation.y += 0.15;
        this.wetMix.scale.setScalar(1 + Math.sin(t / 100) * 0.015);
        this.whisk.rotation.y += 0.3;
      }
      this.renderer.render(this.scene, this.camera);
    };
    this.raf = requestAnimationFrame(this.frame);
  }
  material(color) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.08,
    });
  }
  box(parent, color, size, pos) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      this.material(color),
    );
    m.position.set(...pos);
    parent.add(m);
    return m;
  }
  sphere(parent, color, r, pos) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 8),
      this.material(color),
    );
    m.position.set(...pos);
    parent.add(m);
    return m;
  }
  cylinder(parent, color, rt, rb, h, pos) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, 24),
      this.material(color),
    );
    m.position.set(...pos);
    parent.add(m);
    return m;
  }
  entity(id, x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.entity = id;
    this.scene.add(g);
    this.objects.set(id, g);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 24),
      new THREE.MeshBasicMaterial({
        color: 0x1a1712,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001;
    g.add(shadow);
    return g;
  }
  bowl(id, x, z, r, color) {
    const g = this.entity(id, x, z);
    const points = [
      new THREE.Vector2(0.1, 0),
      new THREE.Vector2(r * 0.6, 0.06),
      new THREE.Vector2(r * 0.9, 0.4),
      new THREE.Vector2(r, 0.65),
      new THREE.Vector2(r - 0.06, 0.65),
      new THREE.Vector2(r * 0.82, 0.4),
      new THREE.Vector2(r * 0.55, 0.15),
      new THREE.Vector2(0.1, 0.12),
    ];
    const m = new THREE.Mesh(
      new THREE.LatheGeometry(points, 32),
      new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        roughness: 0.32,
      }),
    );
    g.add(m);
    this.label(g, CookieRecipe.items[id][0], 1.2, 1.8);
    return g;
  }
  label(parent, text, y, width) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0b171e";
    ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = "#85ba69";
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, 508, 92);
    ctx.fillStyle = "#eaf5da";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 48, 490);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, depthTest: false }),
    );
    sp.position.set(0, y, 0);
    sp.scale.set(width, (width * 96) / 512, 1);
    sp.renderOrder = 2;
    parent.add(sp);
  }
  resize() {
    const w = Math.max(this.root.clientWidth, 740),
      h = this.root.clientHeight || 420;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  setRay(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
  }
  hit(e, ignore) {
    this.setRay(e);
    for (const h of this.ray.intersectObjects(this.scene.children, true)) {
      let g = h.object;
      if (g.isSprite) continue;
      while (g && !g.userData.entity) g = g.parent;
      if (g && g.userData.entity !== ignore)
        return { id: g.userData.entity, g };
    }
    return null;
  }
  sync(state) {
    this.state = state;
    const t = state.task;
    this.ring.visible = !!t;
    if (t) {
      const target = this.objects.get(t.item);
      if (target)
        this.ring.position.set(target.position.x, 0.04, target.position.z);
    }
    this.dryMix.visible = state.index > 1;
    this.wetMix.visible = state.index > 7;
    this.wetMix.material.color.set(
      state.index > 14 ? 0xcba16c : state.index > 10 ? 0xd0b184 : 0x82532e,
    );
    if (state.status === "running" && t.phase === 1) {
      this.wetMix.material.color.lerp(
        new THREE.Color(0xd0b184),
        Math.min(1, state.elapsed / state.target),
      );
    }
    for (const chip of this.doughChips) chip.visible = state.index > 16;
    this.dry.visible = state.index < 15;
    this.paperMesh.visible = state.index > 19;
    this.wet.position.set(0.6, 0, -1.35);
    if (t?.item === "mixer" && state.status === "running")
      this.wet.position.set(2.05, 0, -2.2);
    if (t?.kind === "chill" && state.status === "running")
      this.wet.position.set(-5.5, 1, -2.1);
    this.ovenDoor.rotation.x = state.index === 22 ? -0.7 : 0;
    this.ovenLight.material.color.set(
      state.status === "baking"
        ? 0xff8e22
        : state.index > 21
          ? 0xc66825
          : 0x3d2f1b,
    );
    for (const id of [
      "flour",
      "soda",
      "powder",
      "salt",
      "butter",
      "brown",
      "white",
      "egg",
      "vanilla",
      "chips",
    ]) {
      const addedAt = CookieRecipe.tasks.findIndex((task) => task.item === id);
      this.objects.get(id).visible = state.index <= addedAt;
    }
    this.tray.position.set(4, 0, 1);
    if (state.index === 23) this.tray.position.set(5, 0.35, -2.1);
    else if (state.index >= 24) this.tray.position.set(0.1, 0.1, 1.8);
    while (this.cookies.length < state.portions.length) {
      const mesh = this.sphere(this.tray, 0xc69762, 0.16, [0, 0.4, 0]);
      for (let c = 0; c < 5; c++) {
        const a = c * 2.4;
        this.sphere(mesh, 0x3b2015, 0.026, [
          Math.cos(a) * 0.085,
          0.12,
          Math.sin(a) * 0.085,
        ]);
      }
      this.cookies.push(mesh);
    }
    this.cookies.forEach((mesh, i) => {
      const p = state.portions[i];
      mesh.position.set((p.x - 0.5) * 2.7, 0.38, (p.y - 0.5) * 1.7);
      const baked = state.bakeQuality || state.status === "baking";
      const spread = state.bakeQuality ? 1 : Math.min(1, state.elapsed / 9);
      mesh.scale.set(
        baked ? 1 + spread * 0.5 : 1,
        baked ? 1 - spread * 0.6 : 1,
        baked ? 1 + spread * 0.5 : 1,
      );
      mesh.material.color.set(
        state.bakeQuality === "burnt" ? 0x3c2115 : baked ? 0xb87936 : 0xd1b17b,
      );
      if (state.completed) {
        mesh.position.set(
          ((i % 5) - 0.2) * 0.16,
          0.2 + Math.floor(i / 5) * 0.08,
          (Math.floor(i / 5) - 1) * 0.15,
        );
      }
    });
    if (state.completed)
      this.tray.position.copy(this.objects.get("plate").position);
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) {
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.map?.dispose();
          m.dispose();
        }
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
};
