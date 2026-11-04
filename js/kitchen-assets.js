/* Modelos de bancada feitos localmente. Mantém grupos, alvos e nós animados do jogo. */
window.KitchenAssets = (() => {
  function enhance(c) {
    const T = THREE;
    const detailed = !c.mobile;
    const latheSegments = detailed ? 48 : 28;
    const protectedNodes = new Set([
      c.dryMix,
      c.wetMix,
      c.whisk,
      c.ovenDoor,
      c.ovenLight,
      c.paperMesh,
      ...c.doughChips,
    ]);
    const textures = {};
    function texture(kind) {
      if (textures[kind]) return textures[kind];
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (kind === "wood") {
        ctx.fillStyle = "#c19357";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 120; i++) {
          ctx.strokeStyle = i % 3 ? "#6c45262b" : "#f5d9a84f";
          ctx.lineWidth = i % 4 === 0 ? 2 : 0.6;
          ctx.beginPath();
          ctx.moveTo(i * 2.3, 0);
          ctx.bezierCurveTo(
            i * 2.3 + 12,
            80,
            i * 2.3 - 9,
            170,
            i * 2.3 + 2,
            256,
          );
          ctx.stroke();
        }
      } else if (kind === "cloth") {
        ctx.fillStyle = "#ecede0";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 16; i++) {
          ctx.fillStyle = i % 4 < 2 ? "#256d4fc0" : "#c5d7bc55";
          ctx.fillRect(i * 16, 0, 16, 256);
          ctx.fillRect(0, i * 16, 256, 16);
        }
        for (let i = 0; i < 256; i += 3) {
          ctx.fillStyle = "#ffffff25";
          ctx.fillRect(i, 0, 1, 256);
          ctx.fillRect(0, i, 256, 1);
        }
      } else {
        ctx.fillStyle = "#ddd4b9";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 8500; i++) {
          const x = (i * 71.713) % 256,
            y = (i * 43.127) % 256;
          ctx.fillStyle = i % 3 === 0 ? "#fff9e385" : "#7c6d4b50";
          ctx.fillRect(
            x,
            y,
            kind === "powder" ? 1 : 0.6,
            kind === "powder" ? 1 : 0.6,
          );
        }
      }
      const map = new T.CanvasTexture(canvas);
      map.colorSpace = T.SRGBColorSpace;
      map.wrapS = map.wrapT = T.RepeatWrapping;
      map.anisotropy = detailed ? 8 : 2;
      textures[kind] = map;
      return map;
    }
    function mat(color, props = {}) {
      return new T.MeshPhysicalMaterial({
        color,
        roughness: 0.35,
        metalness: 0,
        clearcoat: 0.25,
        clearcoatRoughness: 0.2,
        ...props,
      });
    }
    function mesh(g, geo, m, pos = [0, 0, 0]) {
      const o = new T.Mesh(geo, m);
      o.position.set(...pos);
      o.castShadow = true;
      o.receiveShadow = true;
      g.add(o);
      return o;
    }
    const rounded = (g, w, h, d, m, pos) => mesh(g, c.softBox(w, h, d), m, pos);
    function sculpted(g, w, h, d, r, m, pos) {
      // Project a subdivided box onto a rounded cuboid; smooth analytical normals
      // make appliance corners genuinely curved rather than shaded bevel strips.
      const segments = detailed ? 16 : 8;
      const geo = new T.BoxGeometry(w, h, d, segments, segments, segments);
      const p = geo.attributes.position,
        n = geo.attributes.normal;
      const inner = new T.Vector3(w / 2 - r, h / 2 - r, d / 2 - r),
        v = new T.Vector3(),
        q = new T.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        q.set(
          T.MathUtils.clamp(v.x, -inner.x, inner.x),
          T.MathUtils.clamp(v.y, -inner.y, inner.y),
          T.MathUtils.clamp(v.z, -inner.z, inner.z),
        );
        const normal = v.clone().sub(q).normalize();
        v.copy(q).addScaledVector(normal, r);
        p.setXYZ(i, v.x, v.y, v.z);
        n.setXYZ(i, normal.x, normal.y, normal.z);
      }
      return mesh(g, geo, m, pos);
    }
    const cyl = (g, r1, r2, h, m, pos, open = false) =>
      mesh(
        g,
        new T.CylinderGeometry(r1, r2, h, latheSegments, 1, open),
        m,
        pos,
      );
    const ball = (g, r, m, pos) =>
      mesh(
        g,
        new T.SphereGeometry(r, detailed ? 28 : 18, detailed ? 20 : 12),
        m,
        pos,
      );
    function ring(g, r, t, m, pos) {
      const o = mesh(g, new T.TorusGeometry(r, t, 8, latheSegments), m, pos);
      o.rotation.x = Math.PI / 2;
      return o;
    }
    function clear(g) {
      if (!g) return;
      for (const child of [...g.children]) {
        if (
          !child.isMesh ||
          protectedNodes.has(child) ||
          (child.geometry?.type === "CircleGeometry" &&
            child.material?.isMeshBasicMaterial)
        )
          continue;
        g.remove(child);
        if (!child.geometry?.userData.kitchenShared) child.geometry?.dispose();
        if (child.material)
          for (const m of Array.isArray(child.material)
            ? child.material
            : [child.material])
            m.dispose();
      }
    }
    function glass(color = 0xe8f3e8) {
      return mat(color, {
        roughness: 0.08,
        metalness: 0.02,
        transparent: true,
        opacity: 0.4,
        transmission: detailed ? 0.4 : 0,
        thickness: 0.07,
        ior: 1.47,
        depthWrite: false,
        clearcoat: 1,
      });
    }
    const ingredientColors = {
      flour: 0xf0e2c7,
      soda: 0xf3f1e6,
      powder: 0xf4e9d6,
      salt: 0xfaf8ec,
      brown: 0x9c5b1e,
      white: 0xf2ead7,
      chips: 0x4b281b,
    };
    for (const [id, color] of Object.entries(ingredientColors)) {
      const g = c.objects.get(id);
      if (!g) continue;
      clear(g);
      const tall = id === "flour",
        r = tall ? 0.38 : 0.34,
        h = tall ? 1.02 : 0.69;
      const glassMat = glass();
      const chrome = mat(0xd2d6c9, {
        roughness: 0.18,
        metalness: 0.94,
        clearcoat: 0.5,
      });
      const glassProfile = [
        [r - 0.04, 0.065],
        [r - 0.015, 0.04],
        [r, 0.08],
        [r, h + 0.01],
        [r - 0.012, h + 0.04],
        [r - 0.035, h + 0.04],
        [r - 0.044, h + 0.01],
        [r - 0.044, 0.095],
        [r - 0.04, 0.065],
      ].map((p) => new T.Vector2(...p));
      const body = mesh(
        g,
        new T.LatheGeometry(glassProfile, latheSegments),
        glassMat,
      );
      body.castShadow = false;
      cyl(g, r, r, 0.035, glassMat, [0, 0.045, 0]);
      ring(g, r, 0.022, glassMat, [0, h + 0.045, 0]);
      ring(g, r + 0.008, 0.019, chrome, [0, h + 0.024, 0]);
      ring(g, r + 0.003, 0.014, chrome, [0, h - 0.027, 0]);
      ring(g, r - 0.009, 0.012, glassMat, [0, 0.075, 0]);
      const fillHeight = h * 0.82;
      const powderMat = mat(color, {
        roughness: id === "chips" ? 0.56 : 0.91,
        clearcoat: 0,
        map: id === "chips" ? null : texture("powder"),
        bumpMap: texture("powder"),
        bumpScale: 0.018,
      });
      if (id === "chips") {
        const count = detailed ? 72 : 36;
        const inst = new T.InstancedMesh(
          new T.ConeGeometry(0.067, 0.11, 6),
          powderMat,
          count,
        );
        const dummy = new T.Object3D();
        for (let i = 0; i < count; i++) {
          const a = i * 2.399963,
            radius = Math.sqrt((i % 17) / 17) * (r - 0.07);
          dummy.position.set(
            Math.cos(a) * radius,
            0.11 + Math.floor(i / 12) * 0.095,
            Math.sin(a) * radius,
          );
          dummy.rotation.set((i % 4) * 0.6, i * 1.3, (i % 3) * 0.5);
          dummy.scale.setScalar(0.85 + (i % 5) * 0.08);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        }
        inst.castShadow = true;
        inst.receiveShadow = true;
        g.add(inst);
      } else {
        cyl(g, r - 0.035, r - 0.035, fillHeight, powderMat, [
          0,
          fillHeight / 2 + 0.07,
          0,
        ]);
        const surface = new T.SphereGeometry(
          r - 0.032,
          latheSegments,
          12,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2,
        );
        const top = mesh(g, surface, powderMat, [0, fillHeight + 0.07, 0]);
        top.scale.y = 0.13;
        const count = detailed ? 280 : 96;
        const grains = new T.InstancedMesh(
          new T.IcosahedronGeometry(1, 0),
          powderMat,
          count,
        );
        const dummy = new T.Object3D(),
          tint = new T.Color();
        for (let i = 0; i < count; i++) {
          const a = i * 2.399963;
          const onTop = i < count * 0.42;
          const radial = onTop
            ? Math.sqrt((i % 71) / 71) * (r - 0.06)
            : r - 0.045;
          const y = onTop
            ? fillHeight +
              0.077 +
              0.045 * (1 - radial / r) +
              Math.sin(i * 2.6) * 0.009
            : 0.1 + ((i * 0.618033) % 1) * fillHeight;
          dummy.position.set(Math.cos(a) * radial, y, Math.sin(a) * radial);
          const size =
            (id === "brown" ? 0.017 : 0.011) * (0.75 + (i % 7) * 0.095);
          dummy.scale.set(size, size * (0.65 + (i % 4) * 0.22), size);
          dummy.rotation.set(i * 0.7, i * 1.6, i * 0.3);
          dummy.updateMatrix();
          grains.setMatrixAt(i, dummy.matrix);
          tint.setScalar(0.72 + (i % 9) * 0.045);
          grains.setColorAt(i, tint);
        }
        grains.castShadow = false;
        grains.receiveShadow = true;
        g.add(grains);
      }
      // Bail hinge and clasp distinguish storage jars from opaque tins.
      rounded(g, 0.055, 0.13, 0.035, chrome, [0, h - 0.02, r + 0.018]);
      rounded(g, 0.15, 0.025, 0.03, chrome, [0, h + 0.06, r + 0.02]);
      for (const x of [-r, r]) {
        const hinge = mesh(
          g,
          new T.TorusGeometry(0.048, 0.009, 6, 12),
          chrome,
          [x, h - 0.005, 0],
        );
        hinge.rotation.y = Math.PI / 2;
      }
    }
    const butter = c.objects.get("butter");
    if (butter) {
      clear(butter);
      const plate = mat(0x8eb09b, { roughness: 0.22, clearcoat: 0.8 });
      rounded(butter, 0.99, 0.08, 0.76, plate, [0, 0.08, 0]);
      const butterMat = mat(0xf7d254, { roughness: 0.57, clearcoat: 0.08 });
      for (let i = 0; i < 6; i++) {
        const cube = rounded(butter, 0.27, 0.25, 0.28, butterMat, [
          ((i % 3) - 1) * 0.28,
          0.24 + Math.floor(i / 3) * 0.02,
          (Math.floor(i / 3) - 0.5) * 0.31,
        ]);
        cube.rotation.y = ((i % 3) - 1) * 0.11;
      }
    }
    const egg = c.objects.get("egg");
    if (egg) {
      clear(egg);
      const porcelain = mat(0xf9f3df, { roughness: 0.2, clearcoat: 0.85 });
      const points = [
        [0, 0.035],
        [0.17, 0.035],
        [0.28, 0.08],
        [0.35, 0.2],
        [0.37, 0.23],
        [0.34, 0.24],
        [0.28, 0.13],
        [0.1, 0.1],
      ].map((p) => new T.Vector2(...p));
      mesh(egg, new T.LatheGeometry(points, latheSegments), porcelain);
      const shell = mat(0xd99c51, {
        roughness: 0.63,
        bumpMap: texture("grain"),
        bumpScale: 0.004,
      });
      const e = ball(egg, 0.29, shell, [0, 0.48, 0]);
      e.scale.set(0.88, 1.3, 0.88);
    }
    const vanilla = c.objects.get("vanilla");
    if (vanilla) {
      clear(vanilla);
      const amber = mat(0x55230a, {
        roughness: 0.13,
        clearcoat: 1,
        transparent: true,
        opacity: 0.94,
        metalness: 0.04,
      });
      cyl(vanilla, 0.175, 0.19, 0.48, amber, [0, 0.29, 0]);
      const shoulder = ball(vanilla, 0.177, amber, [0, 0.53, 0]);
      shoulder.scale.y = 0.52;
      cyl(vanilla, 0.09, 0.12, 0.2, amber, [0, 0.62, 0]);
      cyl(
        vanilla,
        0.135,
        0.135,
        0.1,
        mat(0x9e7746, {
          roughness: 0.85,
          bumpMap: texture("grain"),
          bumpScale: 0.015,
        }),
        [0, 0.76, 0],
      );
      const label = mat(0xf1dec1, { roughness: 0.76 });
      rounded(vanilla, 0.22, 0.19, 0.015, label, [0, 0.3, 0.191]);
      rounded(vanilla, 0.14, 0.012, 0.018, mat(0x5b422b), [0, 0.31, 0.202]);
      rounded(vanilla, 0.09, 0.009, 0.018, mat(0x5b422b), [0, 0.27, 0.202]);
    }
    for (const id of ["dry", "wet"]) {
      const g = c.objects.get(id);
      if (!g) continue;
      clear(g);
      const r = id === "dry" ? 0.78 : 1.02,
        h = id === "dry" ? 0.85 : 0.95;
      const glaze = mat(id === "dry" ? 0x318c86 : 0xf0dfb6, {
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        side: T.DoubleSide,
      });
      const profile = [
        [0, 0.065],
        [r * 0.3, 0.065],
        [r * 0.44, 0.13],
        [r * 0.63, h * 0.28],
        [r * 0.83, h * 0.54],
        [r * 0.96, h * 0.8],
        [r, h],
        [r - 0.025, h + 0.012],
        [r - 0.055, h - 0.005],
        [r * 0.91, h * 0.78],
        [r * 0.77, h * 0.52],
        [r * 0.56, h * 0.28],
        [r * 0.33, 0.16],
        [0, 0.15],
      ].map((p) => new T.Vector2(...p));
      mesh(g, new T.LatheGeometry(profile, latheSegments), glaze);
      ring(g, r - 0.022, 0.028, glaze, [0, h, 0]);
      cyl(
        g,
        r * 0.3,
        r * 0.33,
        0.07,
        mat(id === "dry" ? 0x276e65 : 0xdac59c, {
          roughness: 0.28,
          clearcoat: 0.7,
        }),
        [0, 0.045, 0],
      );
      // Preserve animated mixture nodes while fitting their surfaces inside the deeper shell.
      if (id === "dry") c.dryMix.position.y = 0.48;
      else {
        c.wetMix.position.y = 0.56;
        for (const chip of c.doughChips) chip.position.y = 0.62;
      }
    }
    const mixer = c.objects.get("mixer");
    if (mixer) {
      clear(mixer);
      const enamel = mat(0x8bbeb1, {
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });
      const steel = mat(0xbac4c1, { roughness: 0.17, metalness: 0.95 });
      sculpted(mixer, 1.08, 0.18, 1.03, 0.08, enamel, [0, 0.13, 0]);
      sculpted(mixer, 0.34, 1.13, 0.48, 0.145, enamel, [0.34, 0.77, -0.09]);
      const head = sculpted(
        mixer,
        1.3,
        0.43,
        0.69,
        0.19,
        enamel,
        [-0.05, 1.37, 0],
      );
      const nose = cyl(mixer, 0.205, 0.205, 0.63, enamel, [-0.65, 1.38, 0]);
      nose.rotation.x = Math.PI / 2;
      rounded(mixer, 1.18, 0.025, 0.7, steel, [-0.05, 1.23, 0]);
      for (let i = 0; i < 5; i++)
        rounded(mixer, 0.025, 0.08, 0.015, mat(0x344b43, { roughness: 0.5 }), [
          0.18 + i * 0.055,
          1.4,
          0.351,
        ]);
      rounded(mixer, 0.29, 0.055, 0.055, steel, [0.32, 0.98, 0.29]);
      cyl(mixer, 0.12, 0.12, 0.08, steel, [-0.37, 1.17, 0]);
      if (c.whisk) {
        for (const child of [...c.whisk.children]) {
          c.whisk.remove(child);
          if (!child.geometry?.userData.kitchenShared)
            child.geometry?.dispose();
          child.material?.dispose();
        }
        cyl(c.whisk, 0.027, 0.027, 0.57, steel, [0, 0, 0]);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 6;
          const points = [];
          for (let j = 0; j <= 24; j++) {
            const theta = (j * Math.PI * 2) / 24;
            const radial =
              Math.sin(theta) * 0.19 * (0.82 + Math.cos(theta) * 0.18);
            points.push(
              new T.Vector3(
                Math.cos(a) * radial,
                -0.24 + Math.cos(theta) * 0.3,
                Math.sin(a) * radial,
              ),
            );
          }
          mesh(
            c.whisk,
            new T.TubeGeometry(
              new T.CatmullRomCurve3(points),
              detailed ? 40 : 24,
              0.011,
              5,
              true,
            ),
            steel,
          );
        }
      }
    }
    for (const id of ["spoon", "spatula"]) {
      const g = c.objects.get(id);
      if (!g) continue;
      clear(g);
      const wood = mat(0xffffff, {
        map: texture("wood"),
        roughness: 0.5,
        clearcoat: 0.18,
        bumpMap: texture("wood"),
        bumpScale: 0.006,
      });
      const outline = new T.Shape();
      outline.moveTo(-0.047, -0.5);
      outline.bezierCurveTo(-0.08, -0.34, -0.046, 0.05, -0.08, 0.42);
      outline.quadraticCurveTo(-0.08, 0.56, 0, 0.56);
      outline.quadraticCurveTo(0.08, 0.56, 0.08, 0.42);
      outline.bezierCurveTo(0.046, 0.05, 0.08, -0.34, 0.047, -0.5);
      outline.closePath();
      const hole = new T.Path();
      hole.absellipse(0, 0.44, 0.019, 0.026, 0, Math.PI * 2, true);
      outline.holes.push(hole);
      const handleGeo = new T.ExtrudeGeometry(outline, {
        depth: 0.07,
        bevelEnabled: true,
        bevelSize: 0.018,
        bevelThickness: 0.014,
        bevelSegments: 3,
        curveSegments: 12,
      });
      handleGeo.computeBoundingBox();
      const uv = handleGeo.attributes.uv,
        p = handleGeo.attributes.position,
        box = handleGeo.boundingBox;
      for (let i = 0; i < p.count; i++)
        uv.setXY(
          i,
          (p.getX(i) - box.min.x) / (box.max.x - box.min.x),
          (p.getY(i) - box.min.y) / (box.max.y - box.min.y),
        );
      const handle = mesh(g, handleGeo, wood, [0, 0.17, 0.04]);
      handle.rotation.x = Math.PI / 2;
      if (id === "spoon") {
        const profile = [
          [0, 0.1],
          [0.08, 0.1],
          [0.2, 0.12],
          [0.27, 0.17],
          [0.28, 0.2],
          [0.26, 0.215],
          [0.2, 0.17],
          [0.08, 0.145],
          [0, 0.14],
        ].map((p) => new T.Vector2(...p));
        const scoop = mesh(
          g,
          new T.LatheGeometry(profile, latheSegments),
          wood,
          [0, 0, -0.59],
        );
        scoop.scale.x = 0.82;
      } else {
        const silicone = mat(0x57b3a4, { roughness: 0.48, clearcoat: 0.08 });
        const blade = new T.Shape();
        blade.moveTo(-0.17, -0.25);
        blade.quadraticCurveTo(-0.25, -0.22, -0.22, -0.04);
        blade.lineTo(-0.17, 0.22);
        blade.quadraticCurveTo(0, 0.3, 0.17, 0.22);
        blade.lineTo(0.22, -0.04);
        blade.quadraticCurveTo(0.25, -0.22, 0.17, -0.25);
        blade.closePath();
        const bladeGeo = new T.ExtrudeGeometry(blade, {
          depth: 0.045,
          bevelEnabled: true,
          bevelSize: 0.015,
          bevelThickness: 0.012,
          bevelSegments: 3,
          curveSegments: 12,
        });
        const spatula = mesh(g, bladeGeo, silicone, [0, 0.17, -0.62]);
        spatula.rotation.x = Math.PI / 2;
      }
    }
    const tray = c.objects.get("tray");
    if (tray) {
      clear(tray);
      const steel = mat(0xb7bdba, {
        roughness: 0.29,
        metalness: 0.93,
        clearcoat: 0.2,
      });
      rounded(tray, 2.98, 0.07, 1.98, steel, [0, 0.115, 0]);
      for (const x of [-1.49, 1.49])
        rounded(tray, 0.075, 0.18, 2.04, steel, [x, 0.22, 0]);
      for (const z of [-0.99, 0.99])
        rounded(tray, 2.98, 0.18, 0.075, steel, [0, 0.22, z]);
      for (const x of [-1.49, 1.49])
        rounded(tray, 0.12, 0.045, 2.06, steel, [x, 0.32, 0]);
      for (const z of [-0.99, 0.99])
        rounded(tray, 3.04, 0.045, 0.12, steel, [0, 0.32, z]);
      c.paperMesh.material.roughness = 0.94;
      c.paperMesh.material.bumpMap = texture("grain");
      c.paperMesh.material.bumpScale = 0.003;
    }
    const paper = c.objects.get("paper");
    if (paper) {
      clear(paper);
      const parchment = mat(0xf5e9ce, {
        roughness: 0.92,
        clearcoat: 0,
        bumpMap: texture("grain"),
        bumpScale: 0.003,
        side: T.DoubleSide,
      });
      const roll = cyl(paper, 0.15, 0.15, 1.22, parchment, [0, 0.19, 0], true);
      roll.rotation.z = Math.PI / 2;
      const core = mat(0x967d54, { roughness: 0.94 });
      for (const x of [-0.615, 0.615]) {
        const edge = ring(paper, 0.11, 0.015, core, [x, 0.19, 0]);
        edge.rotation.set(0, Math.PI / 2, 0);
      }
      const geo = new T.PlaneGeometry(1.18, 0.69, 8, 8);
      const attr = geo.attributes.position;
      for (let i = 0; i < attr.count; i++)
        attr.setZ(
          i,
          Math.sin(attr.getX(i) * 12) * 0.008 +
            Math.max(0, attr.getY(i)) * 0.06,
        );
      geo.computeVertexNormals();
      const sheet = mesh(paper, geo, parchment, [0, 0.065, 0.43]);
      sheet.rotation.x = -Math.PI / 2;
    }
    const fridge = c.objects.get("fridge");
    if (fridge) {
      clear(fridge);
      const enamel = mat(0x9fc5b5, {
        roughness: 0.19,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });
      const chrome = mat(0xd4d4c1, { roughness: 0.16, metalness: 0.92 });
      sculpted(fridge, 1.85, 2.5, 1.32, 0.2, enamel, [0, 1.27, 0]);
      sculpted(fridge, 1.73, 2.25, 0.22, 0.1, enamel, [0, 1.27, 0.68]);
      rounded(fridge, 1.65, 0.018, 0.025, chrome, [0, 2.22, 0.785]);
      rounded(fridge, 0.065, 0.64, 0.1, chrome, [0.62, 1.64, 0.85]);
      for (const y of [1.35, 1.93])
        rounded(fridge, 0.095, 0.055, 0.1, chrome, [0.62, y, 0.8]);
      rounded(fridge, 0.26, 0.045, 0.012, chrome, [-0.46, 2.08, 0.783]);
      for (const x of [-0.63, 0.63])
        cyl(fridge, 0.07, 0.09, 0.1, mat(0x202b24), [x, 0.025, 0.35]);
    }
    const oven = c.objects.get("oven");
    if (oven) {
      clear(oven);
      const black = mat(0x17211f, {
        roughness: 0.25,
        metalness: 0.6,
        clearcoat: 0.65,
      });
      const steel = mat(0xbac1bc, { roughness: 0.23, metalness: 0.95 });
      rounded(oven, 2.6, 0.12, 1.72, black, [0, 1.86, 0]);
      rounded(oven, 2.6, 0.13, 1.72, black, [0, 0.09, 0]);
      for (const x of [-1.24, 1.24])
        rounded(oven, 0.12, 1.8, 1.72, black, [x, 0.95, 0]);
      rounded(oven, 2.42, 1.65, 0.1, black, [0, 0.96, -0.8]);
      rounded(oven, 2.44, 0.35, 0.12, black, [0, 1.65, 0.87]);
      for (const x of [-1.12, 1.12])
        rounded(oven, 0.055, 1.17, 0.045, steel, [x, 0.88, 0.94]);
      rounded(oven, 2.24, 0.055, 0.04, steel, [0, 0.29, 0.94]);
      for (const x of [-0.79, 0.79]) {
        const knob = cyl(oven, 0.12, 0.12, 0.09, steel, [x, 1.67, 0.97]);
        knob.rotation.x = Math.PI / 2;
        rounded(oven, 0.012, 0.07, 0.015, mat(0x222a26), [x, 1.7, 1.025]);
      }
      rounded(
        oven,
        0.57,
        0.16,
        0.025,
        mat(0x080e0b, { roughness: 0.18 }),
        [0, 1.67, 0.96],
      );
      for (let n = 0; n < 3; n++)
        rounded(
          oven,
          0.035,
          0.035,
          0.018,
          mat(0xe4b16d, { emissive: 0xc47e22, emissiveIntensity: 0.4 }),
          [-0.14 + n * 0.14, 1.67, 0.982],
        );
      rounded(oven, 1.8, 0.06, 0.1, steel, [0, 1.43, 1.02]);
      for (const x of [-0.88, 0.88])
        rounded(oven, 0.05, 0.12, 0.13, steel, [x, 1.4, 0.97]);
      c.ovenDoor.material.dispose();
      c.ovenDoor.material = mat(0x3d4b3d, {
        roughness: 0.1,
        metalness: 0.13,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        clearcoat: 1,
      });
      c.ovenDoor.castShadow = false;
      c.ovenLight.position.z = -0.73;
      c.ovenLight.material.emissive.set(0xc16d18);
      c.ovenLight.material.emissiveIntensity = 0.8;
      for (const y of [0.52, 0.93]) {
        for (let i = 0; i < 9; i++) {
          const rack = cyl(oven, 0.012, 0.012, 1.28, steel, [
            -0.9 + i * 0.225,
            y,
            -0.03,
          ]);
          rack.rotation.x = Math.PI / 2;
        }
        for (const z of [-0.65, 0.59]) {
          const rail = cyl(oven, 0.017, 0.017, 1.98, steel, [0, y, z]);
          rail.rotation.z = Math.PI / 2;
        }
      }
      const warmth = new T.PointLight(0xffa344, 0.9, 3, 2);
      warmth.position.set(0, 1.1, -0.4);
      oven.add(warmth);
    }
    const gloves = c.objects.get("gloves");
    if (gloves) {
      clear(gloves);
      const fabric = mat(0xaf242c, {
        roughness: 0.96,
        clearcoat: 0,
        bumpMap: texture("grain"),
        bumpScale: 0.016,
      });
      const seam = mat(0x6f1520, { roughness: 1, clearcoat: 0 });
      for (const x of [-0.23, 0.23]) {
        sculpted(gloves, 0.37, 0.19, 0.63, 0.085, fabric, [x, 0.15, 0]);
        const fingers = ball(gloves, 0.182, fabric, [x, 0.14, -0.31]);
        fingers.scale.y = 0.43;
        const thumb = ball(gloves, 0.11, fabric, [x + 0.18, 0.13, -0.12]);
        thumb.scale.set(0.8, 0.65, 1.5);
        rounded(gloves, 0.39, 0.035, 0.08, seam, [x, 0.218, 0.23]);
        for (let n = 0; n < 6; n++) {
          const points = [];
          for (let i = 0; i <= 6; i++) {
            const dx = -0.145 + (i * 0.29) / 6;
            points.push(
              new T.Vector3(
                x + dx,
                0.252 + 0.012 * Math.cos(dx * 10),
                -0.23 + n * 0.075 + dx * 0.3,
              ),
            );
          }
          mesh(
            gloves,
            new T.TubeGeometry(
              new T.CatmullRomCurve3(points),
              8,
              0.006,
              4,
              false,
            ),
            seam,
          );
        }
      }
    }
    const plate = c.objects.get("plate");
    if (plate) {
      clear(plate);
      const porcelain = mat(0xf3eedc, { roughness: 0.14, clearcoat: 1 });
      const profile = [
        [0, 0.05],
        [0.44, 0.05],
        [0.6, 0.085],
        [0.75, 0.16],
        [0.77, 0.19],
        [0.74, 0.2],
        [0.55, 0.12],
        [0.42, 0.095],
        [0, 0.095],
      ].map((p) => new T.Vector2(...p));
      mesh(plate, new T.LatheGeometry(profile, latheSegments), porcelain);
      ring(
        plate,
        0.748,
        0.007,
        mat(0xb58c47, { roughness: 0.25, metalness: 0.78 }),
        [0, 0.195, 0],
      );
    }
    const bench = c.objects.get("bench");
    if (bench) {
      clear(bench);
      const cloth = mat(0xffffff, {
        map: texture("cloth"),
        roughness: 0.96,
        clearcoat: 0,
        bumpMap: texture("cloth"),
        bumpScale: 0.007,
      });
      for (let i = 0; i < 3; i++)
        rounded(bench, 1.04 - i * 0.025, 0.025, 0.72 - i * 0.02, cloth, [
          0,
          0.025 + i * 0.025,
          0,
        ]);
    }
  }
  function enhanceRecipe(c) {
    if (!c.definition) return;
    const T = THREE,
      detailed = !c.mobile,
      cache = {};
    function map(kind) {
      if (cache[kind]) return cache[kind];
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle =
        kind === "wood" ? "#bf935e" : kind === "cloth" ? "#e9eadb" : "#eeeae0";
      ctx.fillRect(0, 0, 256, 256);
      if (kind === "wood") {
        for (let i = 0; i < 160; i++) {
          ctx.strokeStyle = i % 4 === 0 ? "#68441f4f" : "#f8d7a644";
          ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.6;
          ctx.beginPath();
          ctx.moveTo(0, i * 1.7);
          ctx.bezierCurveTo(
            70,
            i * 1.7 + 5,
            180,
            i * 1.7 - 4,
            256,
            i * 1.7 + 3,
          );
          ctx.stroke();
        }
      } else if (kind === "cloth") {
        for (let i = 0; i < 16; i++) {
          ctx.fillStyle = i % 4 < 2 ? "#447b6599" : "#d6dfc944";
          ctx.fillRect(i * 16, 0, 16, 256);
          ctx.fillRect(0, i * 16, 256, 16);
        }
        for (let i = 0; i < 256; i += 3) {
          ctx.fillStyle = "#ffffff44";
          ctx.fillRect(i, 0, 1, 256);
          ctx.fillRect(0, i, 256, 1);
        }
      } else {
        const count = kind === "citrus" ? 2400 : kind === "bread" ? 3400 : 7000;
        for (let i = 0; i < count; i++) {
          const x = (i * 37.711) % 256,
            y = (i * 61.133) % 256;
          ctx.fillStyle = i % 3 === 0 ? "#93856d8a" : "#ffffffb3";
          if (kind === "citrus" || kind === "bread") {
            ctx.beginPath();
            ctx.ellipse(
              x,
              y,
              kind === "bread" ? 0.7 + (i % 3) * 0.3 : 0.75,
              kind === "bread" ? 0.6 : 0.8,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          } else ctx.fillRect(x, y, 0.8, 0.8);
        }
      }
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.anisotropy = detailed ? 8 : 2;
      cache[kind] = texture;
      return texture;
    }
    function finish(o, props = {}) {
      if (!o?.isMesh || !o.material || o.material.isMeshBasicMaterial) return;
      const old = o.material;
      o.material = new T.MeshPhysicalMaterial({
        color: old.color.clone(),
        roughness: old.roughness ?? 0.5,
        metalness: old.metalness ?? 0,
        transparent: old.transparent,
        opacity: old.opacity,
        depthWrite: old.depthWrite,
        side: old.side,
        map: old.map,
        bumpMap: old.bumpMap,
        bumpScale: old.bumpScale,
        clearcoat: 0.15,
        ...props,
      });
      old.dispose();
    }
    function visit(id, callback) {
      c.objects.get(id)?.traverse((o) => {
        if (o.isMesh && !o.material?.isMeshBasicMaterial) callback(o);
      });
    }
    visit("board", (o) =>
      finish(o, {
        color: 0xffffff,
        map: map("wood"),
        bumpMap: map("wood"),
        bumpScale: 0.006,
        roughness: 0.55,
        metalness: 0,
        clearcoat: 0.12,
      }),
    );
    visit("knife", (o) =>
      finish(
        o,
        o.position.z < 0
          ? { roughness: 0.18, metalness: 0.94, clearcoat: 0.25 }
          : {
              color: 0xffffff,
              map: map("wood"),
              bumpMap: map("wood"),
              bumpScale: 0.004,
              roughness: 0.5,
              metalness: 0,
            },
      ),
    );
    if (c.definition.id === "lemonade") {
      for (const lemon of c.wholeLemons || [])
        finish(lemon, {
          color: 0xd6d92c,
          roughness: 0.52,
          metalness: 0,
          clearcoat: 0.38,
          clearcoatRoughness: 0.35,
          bumpMap: map("citrus"),
          bumpScale: 0.018,
        });
      visit("halves", (o) =>
        finish(o, {
          roughness: o.geometry.type === "TorusGeometry" ? 0.52 : 0.27,
          metalness: 0,
          clearcoat: 0.35,
          bumpMap: map("citrus"),
          bumpScale: o.geometry.type === "TorusGeometry" ? 0.012 : 0.004,
        }),
      );
      visit("slice", (o) =>
        finish(o, {
          roughness: 0.26,
          metalness: 0,
          clearcoat: 0.45,
          bumpMap: map("citrus"),
          bumpScale: 0.006,
        }),
      );
      visit("dry", (o) => {
        if (o !== c.juice)
          finish(o, {
            color: o.position.y > 0.35 ? 0xd0d4a5 : 0xb9c9c4,
            roughness: 0.22,
            metalness: 0.85,
            clearcoat: 0.3,
          });
      });
      for (const id of ["wet", "glass"])
        visit(id, (o) => {
          if (
            [
              c.wetMix,
              c.drink,
              ...(c.jarIce || []),
              ...(c.glassIce || []),
              ...(c.condensation || []),
            ].includes(o)
          )
            return;
          finish(o, {
            color: 0xe9f5eb,
            roughness: 0.075,
            metalness: 0.01,
            transparent: true,
            opacity: 0.34,
            depthWrite: false,
            transmission: detailed ? 0.25 : 0,
            thickness: 0.05,
            ior: 1.47,
            clearcoat: 1,
          });
          o.castShadow = false;
        });
      for (const liquid of [c.juice, c.wetMix, c.drink])
        finish(liquid, {
          roughness: 0.18,
          metalness: 0,
          clearcoat: 0.65,
          transparent: true,
          opacity: 0.88,
        });
      for (const cube of [...(c.jarIce || []), ...(c.glassIce || [])])
        finish(cube, {
          color: 0xdaf7f8,
          roughness: 0.15,
          metalness: 0,
          transparent: true,
          opacity: 0.62,
          transmission: detailed ? 0.3 : 0,
          thickness: 0.14,
          ior: 1.31,
          clearcoat: 1,
        });
      visit("ice", (o) =>
        finish(o, {
          color: 0xdaf7f8,
          roughness: 0.15,
          metalness: 0,
          transparent: true,
          opacity: 0.64,
          transmission: detailed ? 0.3 : 0,
          thickness: 0.14,
          ior: 1.31,
          clearcoat: 1,
        }),
      );
      visit("mint", (o) =>
        finish(o, {
          roughness: 0.63,
          metalness: 0,
          clearcoat: 0.08,
          bumpMap: map("citrus"),
          bumpScale: 0.009,
        }),
      );
      for (const droplet of c.condensation || [])
        finish(droplet, {
          roughness: 0.05,
          metalness: 0,
          transparent: true,
          opacity: 0.55,
          transmission: detailed ? 0.2 : 0,
          ior: 1.33,
          clearcoat: 1,
        });
    } else {
      visit("dry", (o) => {
        if (o !== c.yeastLiquid && !(c.foam || []).includes(o))
          finish(o, {
            roughness: 0.1,
            metalness: 0,
            transparent: true,
            opacity: 0.34,
            depthWrite: false,
            transmission: detailed ? 0.2 : 0,
            thickness: 0.04,
            ior: 1.47,
            clearcoat: 1,
          });
      });
      finish(c.dough, {
        roughness: 0.81,
        metalness: 0,
        clearcoat: 0.08,
        map: map("bread"),
        bumpMap: map("bread"),
        bumpScale: 0.013,
      });
      finish(c.bread, {
        roughness: 0.69,
        metalness: 0,
        clearcoat: 0.15,
        map: map("bread"),
        bumpMap: map("bread"),
        bumpScale: 0.024,
      });
      finish(c.clothMesh, {
        color: 0xffffff,
        roughness: 0.98,
        metalness: 0,
        clearcoat: 0,
        map: map("cloth"),
        bumpMap: map("cloth"),
        bumpScale: 0.008,
      });
      for (const foam of c.foam || [])
        finish(foam, { roughness: 0.67, metalness: 0, clearcoat: 0.05 });
      for (const herb of c.herbs || [])
        finish(herb, {
          roughness: 0.75,
          metalness: 0,
          clearcoat: 0,
          bumpMap: map("citrus"),
          bumpScale: 0.005,
        });
    }
    for (const id of ["flour", "yeast", "salt", "white", "coarse", "rosemary"])
      visit(id, (o) =>
        finish(
          o,
          o.position.y > 0.6
            ? { roughness: 0.3, metalness: 0.75, clearcoat: 0.3 }
            : {
                roughness: 0.89,
                metalness: 0,
                clearcoat: 0.02,
                map: map("powder"),
                bumpMap: map("powder"),
                bumpScale: 0.014,
              },
        ),
      );
    for (const id of ["water", "oil"])
      visit(id, (o) =>
        finish(
          o,
          o.position.y > 0.6
            ? { roughness: 0.28, metalness: 0.65 }
            : {
                roughness: 0.12,
                metalness: 0,
                clearcoat: 0.85,
                transparent: true,
                opacity: 0.65,
                transmission: detailed ? 0.15 : 0,
                thickness: 0.05,
              },
        ),
      );
    // Replace only geometry of existing vessel meshes: animation references remain intact.
    function remesh(o, geometry) {
      if (!o.geometry.userData.kitchenShared) o.geometry.dispose();
      o.geometry = geometry;
    }
    function added(g, geometry, material, pos = [0, 0, 0]) {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    }
    function lathe(points) {
      return new T.LatheGeometry(
        points.map((p) => new T.Vector2(...p)),
        detailed ? 48 : 28,
      );
    }
    function glassMaterial() {
      return new T.MeshPhysicalMaterial({
        color: 0xe5f1e8,
        roughness: 0.08,
        metalness: 0,
        transparent: true,
        opacity: 0.33,
        depthWrite: false,
        transmission: detailed ? 0.2 : 0,
        thickness: 0.045,
        ior: 1.47,
        clearcoat: 1,
      });
    }
    for (const id of c.definition.id === "lemonade"
      ? ["wet", "glass"]
      : ["dry"]) {
      const group = c.objects.get(id);
      if (!group) continue;
      const body = group.children.find(
        (o) =>
          o.isMesh &&
          o.geometry.type === "CylinderGeometry" &&
          o !== c.yeastLiquid,
      );
      if (!body) continue;
      const r = id === "wet" ? 0.62 : id === "glass" ? 0.36 : 0.46,
        h = id === "wet" ? 1.65 : id === "glass" ? 1.15 : 1;
      const profile = [
        [0, 0.025],
        [r * 0.79, 0.025],
        [r * 0.88, 0.07],
        [r * 0.92, h * 0.16],
        [r, h * 0.91],
        [r * 1.025, h],
        [r * 0.99, h + 0.015],
        [r * 0.955, h - 0.025],
        [r * 0.94, h * 0.89],
        [r * 0.85, 0.1],
        [0, 0.09],
      ];
      remesh(body, lathe(profile));
      body.position.y = 0;
      body.castShadow = false;
      const lip = added(
        group,
        new T.TorusGeometry(r * 0.99, 0.018, 8, detailed ? 48 : 28),
        glassMaterial(),
        [0, h, 0],
      );
      lip.rotation.x = Math.PI / 2;
      lip.castShadow = false;
      if (id === "wet") {
        const handle = group.children.find(
          (o) => o.isMesh && o.geometry.type === "TorusGeometry" && o !== lip,
        );
        if (handle) {
          const shape = new T.CatmullRomCurve3([
            new T.Vector3(0, 0.51, 0),
            new T.Vector3(0.37, 0.45, 0),
            new T.Vector3(0.45, 0.03, 0),
            new T.Vector3(0.33, -0.39, 0),
            new T.Vector3(-0.04, -0.45, 0),
          ]);
          remesh(
            handle,
            new T.TubeGeometry(shape, detailed ? 40 : 24, 0.052, 8, false),
          );
          handle.position.set(0.55, 0.86, 0);
        }
        // Slight asymmetric pouring lip, keeping the jar's original bounding footprint.
        const pos = body.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i),
            y = pos.getY(i),
            z = pos.getZ(i);
          if (y > h * 0.9 && x < -r * 0.7)
            pos.setXYZ(
              i,
              x - 0.09 * (y / h),
              y + 0.035 * (1 - Math.abs(z) / r),
              z,
            );
        }
        body.geometry.computeVertexNormals();
      }
    }
    if (c.definition.id === "lemonade") {
      const juicer = c.objects.get("dry");
      const cone = juicer.children.find(
        (o) =>
          o.isMesh &&
          o.geometry.type === "CylinderGeometry" &&
          o.position.y > 0.4 &&
          o !== c.juice,
      );
      if (cone) {
        const geometry = new T.CylinderGeometry(
          0.025,
          0.25,
          0.55,
          detailed ? 48 : 24,
          10,
        );
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i),
            y = pos.getY(i),
            z = pos.getZ(i),
            a = Math.atan2(z, x),
            scale = 1 + Math.cos(a * 12) * 0.13;
          pos.setXYZ(i, x * scale, y, z * scale);
        }
        geometry.computeVertexNormals();
        remesh(cone, geometry);
      }
      const basin = juicer.children.find(
        (o) =>
          o.isMesh &&
          o.geometry.type === "CylinderGeometry" &&
          o.position.y < 0.4 &&
          o !== c.juice,
      );
      if (basin) {
        remesh(
          basin,
          lathe([
            [0, 0.025],
            [0.35, 0.025],
            [0.55, 0.1],
            [0.65, 0.24],
            [0.65, 0.34],
            [0.61, 0.355],
            [0.57, 0.24],
            [0.4, 0.12],
            [0, 0.1],
          ]),
        );
        basin.position.y = 0;
      }
    }
    for (const id of [
      "water",
      "oil",
      "flour",
      "white",
      "salt",
      "yeast",
      "coarse",
      "rosemary",
    ]) {
      const group = c.objects.get(id);
      if (!group) continue;
      const body = group.children.find(
        (o) =>
          o.isMesh &&
          o.geometry.type === "CylinderGeometry" &&
          o.position.y < 0.6,
      );
      if (!body) continue;
      const isBottle = id === "water" || id === "oil",
        contentMaterial = body.material.clone();
      const h = 0.56,
        r = isBottle ? 0.29 : 0.32;
      const profile = isBottle
        ? [
            [0, 0.025],
            [r * 0.9, 0.025],
            [r, 0.08],
            [r, 0.36],
            [r * 0.8, 0.45],
            [r * 0.46, 0.51],
            [r * 0.46, h],
            [r * 0.35, h],
            [r * 0.35, 0.51],
            [r * 0.72, 0.43],
            [r * 0.88, 0.35],
            [r * 0.88, 0.1],
            [0, 0.085],
          ]
        : [
            [0, 0.025],
            [r * 0.9, 0.025],
            [r, 0.07],
            [r, 0.5],
            [r * 0.92, h],
            [r * 0.82, h],
            [r * 0.88, 0.49],
            [r * 0.88, 0.09],
            [0, 0.085],
          ];
      remesh(body, lathe(profile));
      body.position.y = 0.04;
      body.material.dispose();
      body.material = glassMaterial();
      body.castShadow = false;
      contentMaterial.transparent = isBottle;
      contentMaterial.opacity = isBottle ? 0.86 : 1;
      contentMaterial.transmission = 0;
      contentMaterial.depthWrite = true;
      contentMaterial.roughness = isBottle ? 0.14 : 0.91;
      if (id === "oil") {
        contentMaterial.color.set(0xa7a72d);
        contentMaterial.clearcoat = 0.7;
      }
      const fillHeight = isBottle ? 0.27 : 0.4;
      added(
        group,
        new T.CylinderGeometry(
          r * 0.86,
          r * 0.86,
          fillHeight,
          detailed ? 32 : 20,
        ),
        contentMaterial,
        [0, 0.12 + fillHeight / 2, 0],
      );
      const cap = group.children.find(
        (o) =>
          o.isMesh &&
          o.geometry.type === "CylinderGeometry" &&
          o.position.y > 0.6,
      );
      if (cap && isBottle) {
        cap.scale.set(0.48, 0.8, 0.48);
        cap.position.y = 0.65;
      }
      if (!isBottle) {
        const rim = added(
          group,
          new T.TorusGeometry(r * 0.87, 0.012, 6, detailed ? 40 : 24),
          new T.MeshPhysicalMaterial({
            color: 0xc8d2c8,
            metalness: 0.86,
            roughness: 0.23,
          }),
          [0, 0.6, 0],
        );
        rim.rotation.x = Math.PI / 2;
      }
    }
  }
  return { enhance, enhanceRecipe };
})();
