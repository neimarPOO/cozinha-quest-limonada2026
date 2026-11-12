/* Assets procedurais locais, sem downloads ou dependências adicionais. */
window.CookieScene = class CookieScene {
  constructor(root, interact, place, announce, onFailure) {
    this.root = root;
    this.interact = interact;
    this.place = place;
    this.announce = announce;
    this.objects = new Map();
    this.disposed = false;
    this.preparing = true;
    this.needsRender = true;
    this.pendingAssets = [];
    this.time = 0;
    this.labels = [];
    this.zoom = 1;
    this.viewTarget = new THREE.Vector3(0, 0.65, 0);
    this.mobile = false; // O jogo é exclusivo do desktop; celular entra em admin.html.
    this.onFailure = onFailure;
    this.labelLayer = document.createElement("div");
    this.labelLayer.className = "cookie-world-labels";
    root.append(this.labelLayer);
    const T = THREE;
    this.T = T;
    this.renderer = window.KitchenResources ? KitchenResources.renderer()
      : new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.performance = new KitchenPerformance(devicePixelRatio);
    this.renderer.setPixelRatio(this.performance.ratio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Bancada 3D. Arraste ingredientes até a tigela indicada; use o scroll para zoom.",
    );
    this.renderer.domElement.tabIndex = 0;
    root.append(this.renderer.domElement);
    this.scene = new T.Scene();
    this.scene.background = new T.Color("#233629");
    this.camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 6.8, 12.8);
    this.camera.lookAt(0, 0.2, -0.3);
    this.scene.add(new T.HemisphereLight(0xe9ffe3, 0x29362a, 1.3));
    const light = new T.DirectionalLight(0xffe4b3, 3);
    light.position.set(-4, 9, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -10,
      right: 10,
      top: 9,
      bottom: -9,
      near: 0.5,
      far: 30,
    });
    light.shadow.bias = -0.00025;
    light.shadow.normalBias = 0.025;
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
    woodMap.anisotropy = 8;
    desk.material.map = woodMap;
    desk.material.bumpMap = woodMap;
    desk.material.bumpScale = 0.025;
    desk.material.roughness = 0.72;
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
    for (const x of [-5, -2, 1, 4]) {
      this.box(this.scene, 0x233c32, [2.9, 2.4, 7.5], [x, -1.7, 0]);
      for (const z of [3.82]) {
        this.box(this.scene, 0x345443, [2.7, 1.9, 0.12], [x, -1.5, z]);
        this.box(this.scene, 0xb4b9a2, [0.7, 0.07, 0.08], [x, -0.8, z + 0.1]);
      }
    }
    this.box(this.scene, 0x715132, [8, 0.16, 0.8], [0, 2.7, -3.5]);
    for (let n = 0; n < 6; n++) {
      this.cylinder(
        this.scene,
        [0xe9dfc3, 0xb88b45, 0xddd5ac][n % 3],
        0.22,
        0.22,
        0.5,
        [-3 + n * 1.2, 3, -3.5],
      );
      this.cylinder(this.scene, 0x8c754c, 0.24, 0.24, 0.08, [
        -3 + n * 1.2,
        3.29,
        -3.5,
      ]);
    }
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
      g.traverse((o) => {
        if (o.isMesh && o.material?.isMeshStandardMaterial) {
          o.material.roughness = 0.65;
          if (!["egg", "vanilla"].includes(id)) {
            const texture = this.grainTexture();
            o.material.bumpMap = texture;
            o.material.bumpScale = 0.012;
          }
        }
      });
      this.label(
        g,
        CookieRecipe.items[id][0],
        id === "flour" ? 1.35 : 1.04,
        1.35,
      );
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
    this.hand = window.KitchenHand
      ? KitchenHand.create()
      : typeof three !== "undefined" && three?.createHand
        ? three.createHand()
        : null;
    if (this.hand) {
      this.scene.add(this.hand.group);
      this.hand.group.visible = false;
      this.hand.group.scale.setScalar(1.16);
      this.hand.group.rotation.set(-1.2, Math.PI, 0);
    }
    window.KitchenEnvironment?.enhance(this);
    window.KitchenAssets?.enhance(this);
    window.KitchenLighting?.enhance(this);
    this.staticBatchStats = window.KitchenResources?.batchStatic(
      this.kitchenEnvironment,
    );
    document.fonts?.ready.then(() => {
      if (!this.disposed) {
        for (const entry of this.labels) {
          entry.width = 0;
          entry.height = 0;
        }
        this.labelSignature = null;
      }
    });
    this.highlights = new Map();
    for (const [id, group] of this.objects) {
      const materials = new Map();
      group.traverse((object) => {
        if (object.material?.emissive && !materials.has(object.material))
          materials.set(object.material, {
            color: object.material.emissive.clone(),
            intensity: object.material.emissiveIntensity,
          });
      });
      this.highlights.set(id, { materials, amount: 0 });
    }
    const canvas = this.renderer.domElement;
    this.down = (e) => {
      this.pendingPointer=null;
      if (e.button === 2) {
        this.pan = {
          x: e.clientX,
          y: e.clientY,
          target: this.viewTarget.clone(),
        };
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      if (e.button !== 0) return;
      const hit = this.hit(e);
      if (!hit) return;
      this.drag = {
        id: hit.id,
        g: hit.g,
        x: e.clientX,
        y: e.clientY,
        home: hit.g.position.clone(),
        contact: hit.point?.clone(),
      };
      canvas.setPointerCapture(e.pointerId);
      this.onDragStart?.();
      this.updateHand(e);
    };
    this.move = (e) => {
      if (this.pan) {
        this.viewTarget.x = THREE.MathUtils.clamp(
          this.pan.target.x - ((e.clientX - this.pan.x) * 0.012) / this.zoom,
          -6,
          6,
        );
        this.viewTarget.z = THREE.MathUtils.clamp(
          this.pan.target.z - ((e.clientY - this.pan.y) * 0.018) / this.zoom,
          -3,
          3,
        );
        this.updateCamera();
        return;
      }
      this.setHovered(this.hit(e)?.id || null, e.pointerType);
      this.updateHand(e);
      if (!this.drag) return;
      const d = this.drag;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.moved = true;
      this.setRay(e);
      const v = new T.Vector3();
      if (
        this.ray.ray.intersectPlane(
          new T.Plane(new T.Vector3(0, 1, 0), -0.8),
          v,
        )
      ) {
        d.g.position.set(
          THREE.MathUtils.clamp(v.x, -7, 7),
          0.8,
          THREE.MathUtils.clamp(v.z, -3.5, 3.8),
        );
      }
    };
    this.processMove = this.move;
    this.move = (e) => {
      this.pendingPointer = {clientX:e.clientX,clientY:e.clientY,pointerType:e.pointerType};
    };
    this.up = (e) => {
      this.pendingPointer=null;
      if(this.drag||this.pan)this.processMove(e);
      if (this.pan) {
        this.pan = null;
        return;
      }
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
        if (
          this.ray.ray.intersectPlane(
            new T.Plane(new T.Vector3(0, 1, 0), -0.25),
            v,
          )
        ) {
          const local = this.tray.worldToLocal(v);
          this.place((local.x + 1.5) / 3, (local.z + 1) / 2, true);
        }
      } else
        this.interact(d.id, d.moved ? target?.id : null, "scene", d.contact);
      this.updateHand(e);
    };
    this.cancel = () => {
      this.pendingPointer=null;
      this.needsRender = true;
      this.renderer.shadowMap.needsUpdate = true;
      if (this.drag) this.drag.g.position.copy(this.drag.home);
      this.drag = null;
      this.pan = null;
      if (this.hand) this.hand.group.visible = false;
    };
    this.leave = () => {
      this.pendingPointer=null;
      this.needsRender = true;
      this.renderer.shadowMap.needsUpdate = true;
      if (!this.drag && this.hand) this.hand.group.visible = false;
      this.setHovered(null);
    };
    this.wheel = (e) => {
      e.preventDefault();
      if (this.drag) return;
      this.setZoom(
        this.zoom *
          Math.exp(-THREE.MathUtils.clamp(e.deltaY, -150, 150) * 0.0025),
      );
    };
    this.contextMenu = (e) => e.preventDefault();
    canvas.addEventListener("pointerdown", this.down);
    canvas.addEventListener("pointermove", this.move);
    canvas.addEventListener("pointerup", this.up);
    canvas.addEventListener("pointercancel", this.cancel);
    canvas.addEventListener("pointerleave", this.leave);
    canvas.addEventListener("wheel", this.wheel, { passive: false });
    canvas.addEventListener("contextmenu", this.contextMenu);
    this.contextLost = (e) => {
      e.preventDefault();
      this.cancel();
      this.announce(
        "O WebGL falhou. Os controles alternativos estão disponíveis na aba Modo sem WebGL.",
      );
      this.onFailure?.();
    };
    canvas.addEventListener("webglcontextlost", this.contextLost);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(root);
    this.resize();
    this.setZoom(1);
    this.toolMotion = new KitchenToolMotion(this);
    this.last = performance.now();
    this.frame = (t) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(this.frame);
      if (document.hidden || this.preparing) return;
      if(this.pendingPointer){const event=this.pendingPointer;this.pendingPointer=null;this.processMove(event);}
      if (this.frameFence) {
        const gl = this.renderer.getContext();
        if (gl.isContextLost()) return;
        const status = gl.clientWaitSync(this.frameFence, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) return;
        gl.deleteSync(this.frameFence);
        this.frameFence = null;
        if (this.performance.sample(Math.max(this.frameCpuMs || 0, performance.now()-this.frameSubmittedAt), t)) {
          this.renderer.setPixelRatio(this.performance.ratio);
          this.needsRender=true;
        }
      }
      if (t - this.last < 1000 / 30) return;
      this.time = t / 1000;
      this.frameDelta = Math.min(1, (t - this.last) / 1000);
      this.last = t;
      if (
        this.state?.status === "running" &&
        ["mixer", "spoon", "spatula"].includes(this.state.task.item) &&
        (!this.state.requiresStir || this.state.working)
      ) {
        const mixture = this.state.task.target === "dry" ? this.dryMix : this.wetMix;
        if (this.state.task.item === "mixer") mixture.rotation.y += 4.5 * this.frameDelta;
        if (this.state.task.item === "mixer") this.whisk.rotation.y += 9 * this.frameDelta;
      }
      const toolAnimated = this.toolMotion.update(this.frameDelta);
      if (this.hand && this.state?.working && this.state?.requiresStir &&
          !["spoon", "spatula"].includes(this.state.task.item) && !this.readingHand && !this.toolMotion.hidesHand) {
        const bowl = this.objects.get(this.state.task.target) || this.wet;
        this.hand.group.visible = true;
        this.hand.group.position.copy(bowl.position).add(new T.Vector3(Math.sin(t / 220) * .3, .9, Math.cos(t / 220) * .2));
        this.hand.pose("grab", 1 - Math.pow(.85, this.frameDelta * 30));
      }
      const highlightChanged = this.updateHighlights();
      const animated =
        this.state?.status === "running" &&
        ((["mixer", "spoon", "spatula"].includes(this.state.task.item) &&
          (!this.state.requiresStir || this.state.working)) ||
          (this.state.working && this.state.requiresStir));
      if (!this.needsRender && !highlightChanged && !this.drag && !animated && !toolAnimated)
        return;
      this.needsRender = false;
      const shadowKey = [
        this.state?.index,
        this.state?.status,
        this.state?.portions?.length,
        this.state?.repetitions?.length,
        this.state?.bakeQuality,
      ].join(":");
      if (
        shadowKey !== this.shadowKey ||
        this.drag ||
        ["running", "baking"].includes(this.state?.status)
      )
        this.renderer.shadowMap.needsUpdate = true;
      this.shadowKey = shadowKey;
      this.beforeRender?.();
      const renderStarted=performance.now();
      this.renderer.render(this.scene, this.camera);
      this.frameCpuMs=performance.now()-renderStarted;
      this.frameSubmittedAt=performance.now();
      const gl = this.renderer.getContext();
      if (gl.fenceSync && !gl.isContextLost()) {
        this.frameFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
      }
      this.updateLabels();
      this.onViewChange?.();
    };
    this.raf = requestAnimationFrame(this.frame);
  }
  async prepare() {
    await Promise.all(this.pendingAssets);
    if (this.disposed) return false;
    if (this.renderer.compileAsync)
      await this.renderer.compileAsync(this.scene, this.camera);
    else this.renderer.compile(this.scene, this.camera);
    if (this.disposed) return false;
    this.beforeRender?.();
    this.renderer.render(this.scene, this.camera);
    const gl = this.renderer.getContext();
    if (gl.fenceSync && !gl.isContextLost()) {
      const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      try {
        await new Promise((resolve, reject) => {
          const poll = () => {
            if (this.disposed) {
              resolve();
              return;
            }
            if (gl.isContextLost()) {
              reject(new Error("WebGL indisponível durante preparação"));
              return;
            }
            const status = gl.clientWaitSync(fence, 0, 0);
            if (status === gl.WAIT_FAILED) {
              reject(new Error("Falha ao preparar GPU"));
              return;
            }
            if (status === gl.TIMEOUT_EXPIRED) setTimeout(poll, 16);
            else resolve();
          };
          poll();
        });
      } finally {
        if (!this.disposed && !gl.isContextLost()) gl.deleteSync(fence);
      }
    }
    if (this.disposed) return false;
    this.preparing = false;
    this.last = performance.now();
    this.updateLabels();
    this.onViewChange?.();
    return true;
  }
  setGraphicsMode(mode) {
    this.renderer.setPixelRatio(this.performance.setMode(mode));
    this.needsRender=true;
  }
  material(color) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.08,
    });
  }
  box(parent, color, size, pos) {
    const m = new THREE.Mesh(this.softBox(...size), this.material(color));
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.set(...pos);
    parent.add(m);
    return m;
  }
  sphere(parent, color, r, pos) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 24, 16),
      this.material(color),
    );
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.set(...pos);
    parent.add(m);
    return m;
  }
  cylinder(parent, color, rt, rb, h, pos) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, 24),
      this.material(color),
    );
    m.castShadow = true;
    m.receiveShadow = true;
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
    const points = [];
    for (let n = 0; n <= 24; n++) {
      const a = ((n / 24) * Math.PI) / 2;
      points.push(
        new THREE.Vector2(
          0.2 * r + 0.8 * r * Math.sin(a),
          0.06 + 0.6 * (1 - Math.cos(a)),
        ),
      );
    }
    for (let n = 24; n >= 0; n--) {
      const a = ((n / 24) * Math.PI) / 2;
      points.push(
        new THREE.Vector2(
          Math.max(0.05, 0.2 * r + 0.8 * r * Math.sin(a) - 0.06),
          0.12 + 0.54 * (1 - Math.cos(a)),
        ),
      );
    }
    const m = new THREE.Mesh(
      new THREE.LatheGeometry(points, 32),
      new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        roughness: 0.32,
      }),
    );
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(r - 0.025, 0.045, 12, 64),
      this.material(color),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.66;
    g.add(rim);
    this.label(g, CookieRecipe.items[id][0], 1.2, 1.8);
    return g;
  }
  grainTexture() {
    if (this.grain) return this.grain;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#c2b99e";
    ctx.fillRect(0, 0, 128, 128);
    for (let n = 0; n < 1600; n++) {
      const x = (n * 37.7) % 128,
        y = (n * 61.3) % 128;
      ctx.fillStyle = n % 2 ? "#e9e0cb" : "#8f856f";
      ctx.fillRect(x, y, 1.2, 1.2);
    }
    this.grain = new THREE.CanvasTexture(c);
    this.grain.wrapS = this.grain.wrapT = THREE.RepeatWrapping;
    this.grain.repeat.set(3, 3);
    return this.grain;
  }
  softBox(w, h, d) {
    return window.KitchenResources
      ? KitchenResources.geometry(this, `box:${w}:${h}:${d}`, () =>
          this.buildSoftBox(w, h, d),
        )
      : this.buildSoftBox(w, h, d);
  }
  buildSoftBox(w, h, d) {
    const r = Math.min(0.055, w / 8, h / 8, d / 8);
    if (r < 0.015) return new THREE.BoxGeometry(w, h, d);
    const s = new THREE.Shape(),
      x = -w / 2 + r,
      y = -h / 2 + r,
      W = w - 2 * r,
      H = h - 2 * r;
    s.moveTo(x + r, y);
    s.lineTo(x + W - r, y);
    s.quadraticCurveTo(x + W, y, x + W, y + r);
    s.lineTo(x + W, y + H - r);
    s.quadraticCurveTo(x + W, y + H, x + W - r, y + H);
    s.lineTo(x + r, y + H);
    s.quadraticCurveTo(x, y + H, x, y + H - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: d - 2 * r,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 6,
    });
    g.translate(0, 0, -d / 2 + r);
    // ExtrudeGeometry uses world-sized UVs; normalize each face for material maps.
    const pos = g.attributes.position,
      normals = g.attributes.normal,
      uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(normals.getX(i)),
        ny = Math.abs(normals.getY(i)),
        nz = Math.abs(normals.getZ(i));
      if (ny >= nx && ny >= nz)
        uv.setXY(i, pos.getX(i) / w + 0.5, pos.getZ(i) / d + 0.5);
      else if (nx >= nz)
        uv.setXY(i, pos.getZ(i) / d + 0.5, pos.getY(i) / h + 0.5);
      else uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
    }
    return g;
  }
  label(parent, text, y, width) {
    const anchor = new THREE.Object3D();
    anchor.position.set(0, y, 0);
    parent.add(anchor);
    const label = document.createElement("div");
    label.className = "cookie-world-label";
    label.textContent = text;
    label.title = text;
    this.labelLayer.append(label);
    const id = parent.userData.entity;
    label.addEventListener("pointerenter", (e) => {
      if (id === this.state?.task?.item) this.setHovered(id, e.pointerType);
    });
    label.addEventListener("pointerleave", () => this.setHovered(null));
    label.addEventListener("click", () => {
      if (id === this.state?.task?.item) this.interact(id, null, "scene");
    });
    this.labels.push({ anchor, label, id });
  }
  updateLabels() {
    const signature = [
      this.renderWidth,
      this.renderHeight,
      this.state?.index,
      this.state?.status,
      this.hovered,
      this.drag?.id,
      ...this.camera.projectionMatrix.elements,
      ...this.camera.matrixWorld.elements,
      ...[...this.objects.values()].flatMap((g) => [
        g.visible,
        g.position.x,
        g.position.y,
        g.position.z,
      ]),
    ].join(",");
    if (signature === this.labelSignature) return;
    this.labelSignature = signature;
    const placed = [];
    const priority = (id) =>
      id === this.state?.task?.item
        ? 2
        : id === this.state?.task?.target
          ? 1
          : 0;
    const entries = [...this.labels].sort(
      (a, b) => priority(b.id) - priority(a.id),
    );
    for (const entry of entries) {
      const { anchor, label, id } = entry;
      const group = this.objects.get(id);
      if (!group?.visible || this.drag?.id === id) {
        label.hidden = true;
        continue;
      }
      const v = anchor
        .getWorldPosition(new THREE.Vector3())
        .project(this.camera);
      label.hidden =
        v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1;
      if (label.hidden) continue;
      label.classList.toggle("is-target", priority(id) > 0);
      label.classList.toggle("is-hovered", id === this.hovered);
      label.classList.toggle(
        "is-actionable",
        id === this.state?.task?.item && this.state.status === "ready",
      );
      entry.width ||= label.offsetWidth || 126;
      entry.height ||= label.offsetHeight || 28;
      const w = entry.width,
        h = entry.height,
        x = THREE.MathUtils.clamp(
          ((v.x + 1) * this.renderWidth) / 2,
          w / 2 + 6,
          this.renderWidth - w / 2 - 6,
        ),
        anchorY = ((1 - v.y) * this.renderHeight) / 2;
      let y = anchorY;
      for (let attempt = 0; attempt < 12; attempt++) {
        const hit = placed.find(
          (r) =>
            x - w / 2 < r.right + 4 &&
            x + w / 2 > r.left - 4 &&
            y > r.top - 4 &&
            y - h < r.bottom + 4,
        );
        if (!hit) break;
        y = hit.top - 6;
      }
      y = Math.max(h + 6, y);
      placed.push({ left: x - w / 2, right: x + w / 2, top: y - h, bottom: y });
      label.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
      label.style.setProperty(
        "--label-leader",
        `${Math.max(0, anchorY - y)}px`,
      );
    }
  }
  updateCamera() {
    if (!this.camera) return;
    this.needsRender = true;
    const distance = Math.max(
      11.8,
      8.2 /
        (Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) *
          this.camera.aspect),
    );
    this.camera.position
      .copy(this.viewTarget)
      .add(
        new THREE.Vector3(0, 0.36, 0.93)
          .normalize()
          .multiplyScalar(distance / this.zoom),
      );
    this.camera.lookAt(this.viewTarget);
    this.camera.updateMatrixWorld();
    this.camera.updateProjectionMatrix();
  }
  setZoom(value) {
    this.zoom = THREE.MathUtils.clamp(value, 0.8, 2.5);
    this.updateCamera();
    const output = document.getElementById("cookieZoomLevel");
    if (output) output.value = Math.round(this.zoom * 100) + "%";
  }
  resetView() {
    this.viewTarget.set(0, 0.65, 0);
    this.setZoom(1);
    this.root.scrollLeft = (this.renderWidth - this.root.clientWidth) / 2;
  }
  focus(id) {
    const object = this.objects.get(id);
    if (object) {
      this.viewTarget.copy(object.position);
      this.viewTarget.y = 0.4;
      this.setZoom(1.7);
      this.root.scrollLeft = (this.renderWidth - this.root.clientWidth) / 2;
    }
  }
  revealCurrentObject(id) {
    if (this.renderWidth <= this.root.clientWidth) return;
    const point = this.getObjectAnchor(id);
    if (!point) return;
    const bounds = this.root.getBoundingClientRect();
    if (point.x >= bounds.left + 55 && point.x <= bounds.right - 55) return;
    this.root.scrollLeft = THREE.MathUtils.clamp(
      this.root.scrollLeft + point.x - bounds.left - this.root.clientWidth / 2,
      0,
      this.renderWidth - this.root.clientWidth,
    );
  }
  setHovered(id, pointerType = "mouse") {
    if (this.hovered === id) return;
    this.hovered = id;
    this.needsRender = true;
    this.onHoverChange?.(id, pointerType);
  }
  updateHighlights() {
    let changed = false;
    for (const [id, record] of this.highlights) {
      const touched =
        id === this.hovered || id === this.drag?.id || id === this.actionObject;
      const previous = record.amount;
      record.amount +=
        ((touched ? 1 : 0) - record.amount) *
        (1 - Math.pow(0.75, (this.frameDelta || 1 / 30) * 30));
      if (Math.abs(record.amount - previous) > 0.0005) changed = true;
      for (const [material, baseline] of record.materials) {
        if (record.amount > 0.01) {
          material.emissive.setHex(0x8ee05a);
          material.emissiveIntensity = 0.26 * record.amount;
        } else {
          material.emissive.copy(baseline.color);
          material.emissiveIntensity = baseline.intensity;
        }
      }
    }
    return changed;
  }
  getObjectAnchor(id) {
    const object = this.objects.get(id);
    if (!object || !object.visible) return null;
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld();
    const v = object
      .localToWorld(new THREE.Vector3(0, 0.65, 0))
      .project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: rect.left + ((v.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - v.y) * rect.height) / 2,
    };
  }
  press(info) {
    return this.toolMotion?.queueCut(info?.task, info?.point, info?.index);
  }
  updateHand(e) {
    if (!this.hand) return;
    if (this.toolMotion?.hidesHand && !this.readingHand) { this.hand.group.visible = false; return; }
    this.needsRender = true;
    this.renderer.shadowMap.needsUpdate = true;
    this.setRay(e);
    const group = this.hand.group;
    // Mesmos enquadramento, escala, orientação e poses do cursor das outras receitas.
    const tip = this.ray.ray.origin
      .clone()
      .addScaledVector(this.ray.ray.direction, 4.35);
    group.quaternion
      .copy(this.camera.quaternion)
      .multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(-1.2, Math.PI, 0, "YXZ"),
        ),
      );
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      group.quaternion,
    );
    group.visible = true;
    group.scale.setScalar(1.16);
    group.position.copy(tip).addScaledVector(forward, -0.3 * group.scale.x);
    group.position.y += Math.sin(performance.now() * 0.006) * 0.012;
    this.hand.pose(this.drag ? "grab" : this.hovered ? "pinch" : "open", 0.35);
  }
  resize() {
    const first =
        !this.renderWidth || this.viewportWidth !== this.root.clientWidth,
      w = Math.max(this.root.clientWidth, 980),
      h = this.root.clientHeight || 560;
    this.viewportWidth = this.root.clientWidth;
    this.renderWidth = w;
    this.renderHeight = h;
    this.renderer.setSize(w, h);
    const inset = Math.min(h * 0.36, this.instructionInset || 130);
    const workWidth = Math.max(300, w - (this.notebookInset || 0));
    this.camera.aspect = workWidth / (h - inset);
    // Extend the view above the usable workbench so the wall also fills behind HUD.
    this.camera.setViewOffset(workWidth, h - inset, 0, -inset, w, h);
    this.updateCamera();
    if (first) this.root.scrollLeft = (w - this.root.clientWidth) / 2;
  }
  setNotebookInset(value) {
    const inset = Math.round(value);
    if (this.notebookInset === inset) return;
    this.notebookInset = inset;
    this.resize();
    if (this.state?.task) this.revealCurrentObject(this.state.task.item);
  }
  readPageHand(event, grab) {
    if (!this.hand) return;
    if (!this.readingHand) {
      this.readingHand = true;
      this.handDepthFrame = null;
      this.handRenderState = [];
      this.handMaterialState = new Map();
      this.hand.group.traverse((o) => {
        if (!o.isMesh) return;
        const previousRender = o.onBeforeRender;
        this.handRenderState.push([
          o,
          o.renderOrder,
          o.castShadow,
          previousRender,
        ]);
        const view = this;
        o.onBeforeRender = function (renderer, ...args) {
          if (view.handDepthFrame !== renderer.info.render.frame) {
            renderer.clearDepth();
            view.handDepthFrame = renderer.info.render.frame;
          }
          previousRender.call(this, renderer, ...args);
        };
        o.renderOrder = 1100;
        o.castShadow = false;
        if (!this.handMaterialState.has(o.material))
          this.handMaterialState.set(o.material, {
            depth: o.material.depthTest,
            write: o.material.depthWrite,
            transparent: o.material.transparent,
          });
        o.material.depthTest = true;
        o.material.depthWrite = true;
        o.material.transparent = true;
        o.material.needsUpdate = true;
      });
      this.renderer.shadowMap.needsUpdate = true;
    }
    // Pose de leitura própria: sem alternar a preensão de ingredientes com a página.
    this.setRay(event);
    const group = this.hand.group;
    group.quaternion
      .copy(this.camera.quaternion)
      .multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(1.35, Math.PI, 0.1, "XYZ"),
        ),
      );
    group.scale.setScalar(0.9);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      group.quaternion,
    );
    group.position
      .copy(this.ray.ray.origin)
      .addScaledVector(this.ray.ray.direction, 4.35)
      .addScaledVector(forward, -0.23 * 0.9);
    group.visible = true;
    this.hand.pose(grab ? "pageDrag" : "page", 1);
    this.needsRender = true;
  }
  endReadingHand() {
    if (!this.readingHand) return;
    for (const [o, order, shadow, previousRender] of this.handRenderState) {
      o.renderOrder = order;
      o.castShadow = shadow;
      o.onBeforeRender = previousRender;
    }
    for (const [material, saved] of this.handMaterialState) {
      material.depthTest = saved.depth;
      material.depthWrite = saved.write;
      material.transparent = saved.transparent;
      material.needsUpdate = true;
    }
    this.readingHand = false;
    this.hand.group.visible = false;
    this.needsRender = true;
    this.renderer.shadowMap.needsUpdate = true;
  }
  setInstructionInset(value) {
    const inset = Math.round(value);
    if (inset !== this.instructionInset) {
      this.instructionInset = inset;
      this.resize();
    }
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
    this.pickBounds ||= new THREE.Box3();
    this.pickCandidates ||= [];
    this.pickCandidates.length=0;
    for(const [id,group] of this.objects){
      if(!group.visible||id===ignore)continue;
      group.updateWorldMatrix(true,true);
      this.pickBounds.setFromObject(group);
      if(!this.ray.ray.intersectsBox(this.pickBounds))continue;
      group.traverseVisible(object=>{if(object.raycast&&!object.isSprite)this.pickCandidates.push(object)});
    }
    for (const h of this.ray.intersectObjects(this.pickCandidates, false)) {
      let g = h.object;
      if (g.isSprite) continue;
      while (g && !g.userData.entity) g = g.parent;
      if (g && g.visible && g.userData.entity !== ignore)
        return { id: g.userData.entity, g, point: h.point };
    }
    return null;
  }
  syncProtection(state) {
    const equipped=Boolean(state.gloves);
    const changed=this.hand?.setGloved?.(equipped);
    const pair=this.objects.get("gloves")?.userData.thermalPair;
    if(pair){pair[0].visible=!equipped;pair[1].visible=true;}
    if(changed&&equipped&&!this.readingHand){
      const anchor=this.getObjectAnchor("gloves");
      if(anchor)this.updateHand({clientX:anchor.x,clientY:anchor.y});
    }
    if(changed)this.needsRender=true;
  }
  sync(state) {
    this.needsRender = true;
    this.state = state;
    const t = state.task;
    this.ring.visible = !!t;
    if (t) {
      const target = this.objects.get(t.item);
      if (target)
        this.ring.position.set(target.position.x, 0.04, target.position.z);
    }
    const done = (item) =>
      state.history?.some((h) => h.item === item && !h.skipped);
    const taskIndex = (item, predicate = () => true) =>
      state.tasks.findIndex((t) => t.item === item && predicate(t));
    this.dryMix.visible = done("flour");
    this.wetMix.visible = done("butter");
    this.wetMix.material.color.set(
      state.index > taskIndex("dry", (t) => t.target === "wet")
        ? 0xcba16c
        : done("mixer")
          ? 0xd0b184
          : 0x82532e,
    );
    if (state.status === "running" && t.phase === 1) {
      this.wetMix.material.color.lerp(
        new THREE.Color(0xd0b184),
        Math.min(1, state.elapsed / state.target),
      );
    }
    for (const chip of this.doughChips) chip.visible = done("chips");
    this.dry.visible = !done("dry");
    this.paperMesh.visible = done("paper");
    if (this.drag?.id !== "wet") this.wet.position.set(0.6, 0, -1.35);
    if (t?.item === "mixer" && state.status === "running")
      this.wet.position.set(2.05, 0, -2.2);
    if (t?.kind === "chill" && state.status === "running")
      this.wet.position.set(-5.5, 1, -2.1);
    this.ovenDoor.rotation.x =
      t.item === "tray" && t.target === "oven" ? -0.7 : 0;
    this.ovenLight.material.color.set(
      state.status === "baking" ? 0xff8e22 : done("oven") ? 0xc66825 : 0x3d2f1b,
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
      const addedAt = state.tasks.findIndex((task) => task.item === id);
      this.objects.get(id).visible = state.index <= addedAt;
    }
    if (this.drag?.id !== "tray") this.tray.position.set(4, 0, 1);
    if (t.kind === "bake") this.tray.position.set(5, 0.35, -2.1);
    else if (state.bakeQuality) this.tray.position.set(0.1, 0.1, 1.8);
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
    if(this.disposed)return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    this.labelLayer?.remove();
    this.pendingPointer=null;
    for(const [event,handler] of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.cancel],['pointerleave',this.leave],['contextmenu',this.contextMenu]])
      this.renderer.domElement.removeEventListener(event,handler);
    this.renderer.domElement.removeEventListener("wheel", this.wheel);
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.grain?.dispose();
    const skeletons = new Set(),
      textures = new Set(),
      materials = new Set(),
      geometries = new Set();
    this.scene.traverse((o) => {
      o.shadow?.dispose();
      if (o.skeleton) skeletons.add(o.skeleton);
      if (o.geometry) geometries.add(o.geometry);
      for (const m of o.material
        ? Array.isArray(o.material)
          ? o.material
          : [o.material]
        : []) {
        materials.add(m);
        for (const value of Object.values(m))
          if (value?.isTexture) textures.add(value);
      }
    });
    for (const skeleton of skeletons) skeleton.dispose();
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries)
      if (!geometry.userData.kitchenShared) geometry.dispose();
    window.KitchenResources?.releaseGeometries(this);
    if (!window.KitchenResources) this.environmentTarget?.dispose();
    if (this.frameFence) {
      const gl = this.renderer.getContext();
      if (!gl.isContextLost()) gl.deleteSync(this.frameFence);
      this.frameFence = null;
    }
    this.renderer.domElement.remove();
    if (window.KitchenResources) KitchenResources.releaseRenderer(this.renderer);
    else this.renderer.dispose();
  }
};
