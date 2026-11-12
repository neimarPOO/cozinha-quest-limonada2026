/* Cozinha de referência: materiais locais, iluminação de estúdio e decoração instanciada. */
window.KitchenEnvironment = (() => {
  function enhance(view) {
    if (view.kitchenEnvironment) return;
    const T = THREE,
      scene = view.scene;
    const group = new T.Group();
    group.name = "reference-kitchen-environment";
    view.kitchenEnvironment = group;
    // A bancada original consiste somente em malhas diretas; entidades e cursor são preservados.
    for (const child of [...scene.children]) {
      if (
        (child.isMesh && child !== view.ring && !child.userData.entity) ||
        child.isPointLight
      ) {
        scene.remove(child);
        if (!child.geometry?.userData.kitchenShared) child.geometry?.dispose();
        if (child.material) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      }
    }
    scene.add(group);
    scene.background = new T.Color(0x142622);
    let seed = 1967;
    const random = () =>
      (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const canvasMap = (size, draw) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      draw(canvas.getContext("2d"), size);
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = view.mobile ? 2 : 8;
      return texture;
    };
    // Conserva a sequência visual após remover a textura de madeira descartada.
    seed = 3463640705;
    const contactShadow = canvasMap(128, (c, n) => {
      const gradient = c.createRadialGradient(
        n / 2,
        n / 2,
        4,
        n / 2,
        n / 2,
        n / 2,
      );
      gradient.addColorStop(0, "rgba(19,15,8,.72)");
      gradient.addColorStop(0.4, "rgba(19,15,8,.38)");
      gradient.addColorStop(1, "rgba(19,15,8,0)");
      c.fillStyle = gradient;
      c.fillRect(0, 0, n, n);
    });
    for (const entity of view.objects.values())
      for (const child of entity.children) {
        if (
          child.isMesh &&
          child.geometry?.type === "CircleGeometry" &&
          child.material?.isMeshBasicMaterial
        ) {
          child.material.map = contactShadow;
          child.material.color.set(0xffffff);
          child.material.opacity = 0.5;
          child.material.needsUpdate = true;
        }
      }
    const stone = canvasMap(128, (c, size) => {
      c.fillStyle = "#d3c8b1";
      c.fillRect(0, 0, size, size);
      for (let n = 0; n < 1800; n++) {
        c.fillStyle = n % 3 ? "#756a5833" : "#fff8e177";
        c.fillRect(random() * size, random() * size, 1, 1);
      }
    });
    const mat = (color, roughness = 0.4, metalness = 0) =>
      new T.MeshStandardMaterial({ color, roughness, metalness });
    const loader = new T.TextureLoader();
    const photo = (name, color = false) => {
      const url = "public/textures/kitchen/hardwood2_" + name + ".jpg";
      const texture = window.KitchenResources
        ? KitchenResources.texture(view, url)
        : loader.load(url);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(1.2, 1);
      texture.anisotropy = view.mobile ? 2 : 8;
      if (color) texture.colorSpace = T.SRGBColorSpace;
      return texture;
    };
    const timber = new T.MeshPhysicalMaterial({
      map: photo("diffuse", true),
      bumpMap: photo("bump"),
      roughnessMap: photo("roughness"),
      bumpScale: 0.014,
      roughness: 0.48,
      clearcoat: 0.32,
      clearcoatRoughness: 0.28,
      color: 0xb18558,
    });
    const brass = mat(0xc6ad77, 0.24, 0.8),
      chrome = mat(0xd7e0d8, 0.2, 0.94),
      darkGreen = mat(0x244737, 0.29, 0.07);
    const mesh = (geometry, material, pos, parent = group) => {
      const m = new T.Mesh(geometry, material);
      m.position.set(...pos);
      m.castShadow = !(pos[0] < -8);
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const box = (size, pos, material, parent = group) =>
      mesh(view.softBox(...size), material, pos, parent);
    const cylinder = (rt, rb, h, pos, material, parent = group) =>
      mesh(
        new T.CylinderGeometry(rt, rb, h, view.mobile ? 16 : 28),
        material,
        pos,
        parent,
      );
    box([15.8, 0.42, 8.5], [0, -0.3, 0], timber);
    box([15.8, 0.07, 0.09], [0, -0.08, 4.2], mat(0x542f1c, 0.4));
    box([28.8, 13.2, 0.25], [0, 5.2, -4.42], mat(0x17271f, 0.9));
    const sideWallMaterial = mat(0x102b24, 0.48, 0.03);
    for (const side of [-1, 1])
      box([0.22, 12.5, 14], [side * 8.2, 4.7, 2.2], sideWallMaterial);
    const tileShape = new T.Shape();
    tileShape.moveTo(-0.415, -0.36);
    tileShape.lineTo(0.415, -0.36);
    tileShape.lineTo(0.415, 0.36);
    tileShape.lineTo(-0.415, 0.36);
    tileShape.closePath();
    const tileGeo = new T.ExtrudeGeometry(tileShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.015,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 1,
    });
    const tiles = new T.InstancedMesh(
      tileGeo,
      new T.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.18,
        metalness: 0.045,
        clearcoat: 0.65,
        clearcoatRoughness: 0.16,
      }),
      30 * 16,
    );
    const dummy = new T.Object3D(),
      color = new T.Color();
    let index = 0;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 30; x++) {
        dummy.position.set(-13.5 + x * 0.93, -0.77 + y * 0.8, -4.24);
        dummy.updateMatrix();
        tiles.setMatrixAt(index, dummy.matrix);
        color.setHSL(
          0.435 + random() * 0.018,
          0.44 + random() * 0.1,
          0.036 + random() * 0.025,
        );
        tiles.setColorAt(index++, color);
      }
    tiles.receiveShadow = true;
    group.add(tiles);
    for (let x = -6.25; x < 7; x += 2.5) {
      box([2.45, 2.4, 8.1], [x, -1.7, 0], darkGreen);
      box([2.34, 1.85, 0.1], [x, -1.58, 4.07], mat(0x325c47, 0.34));
      box([2.14, 1.6, 0.035], [x, -1.58, 4.14], mat(0x284e3d, 0.32));
      const handle = cylinder(0.045, 0.045, 0.74, [x, -0.91, 4.25], chrome);
      handle.rotation.z = Math.PI / 2;
      for (const hx of [-0.29, 0.29])
        box([0.055, 0.06, 0.1], [x + hx, -0.91, 4.2], chrome);
    }
    box([8.3, 0.16, 0.83], [0.2, 2.51, -3.7], timber);
    for (const x of [-3, 3.4]) {
      box([0.065, 0.65, 0.055], [x, 2.13, -4.02], brass);
      box([0.065, 0.065, 0.65], [x, 1.85, -3.72], brass);
    }
    const ledMat = new T.MeshStandardMaterial({
      color: 0xffdfa0,
      emissive: 0xffa529,
      emissiveIntensity: 3.3,
      roughness: 0.3,
    });
    for (const x of [-4.7, 4.9]) {
      box([2.2, 0.055, 0.08], [x, 2.78, -4.03], ledMat);
      const light = new T.PointLight(0xffb95d, view.mobile ? 3 : 4.5, 8, 2);
      light.position.set(x, 2.58, -3.3);
      group.add(light);
    }
    const glass = new T.MeshPhysicalMaterial({
      color: 0xe3e4cc,
      roughness: 0.12,
      metalness: 0.03,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: T.DoubleSide,
    });
    const jarColors = [0x44281d, 0xb98532, 0xe6dfc7, 0xbc9562, 0x40251a];
    for (let j = 0; j < 5; j++) {
      const x = -2.2 + j * 1.05;
      cylinder(0.33, 0.33, 0.77, [x, 2.98, -3.62], glass);
      cylinder(0.285, 0.285, 0.58, [x, 2.89, -3.62], mat(jarColors[j], 0.78));
      cylinder(0.35, 0.35, 0.075, [x, 3.39, -3.62], mat(0x987340, 0.45, 0.12));
      cylinder(0.335, 0.335, 0.035, [x, 3.335, -3.62], chrome);
      const flecks = new T.InstancedMesh(
        new T.IcosahedronGeometry(0.026, 0),
        mat(jarColors[j], 0.75),
        view.mobile ? 35 : 85,
      );
      for (let n = 0; n < flecks.count; n++) {
        const a = random() * Math.PI * 2,
          r = Math.sqrt(random()) * 0.27;
        dummy.position.set(
          x + Math.cos(a) * r,
          2.64 + random() * 0.57,
          -3.62 + Math.sin(a) * r,
        );
        dummy.scale.setScalar(0.6 + random() * 0.7);
        dummy.updateMatrix();
        flecks.setMatrixAt(n, dummy.matrix);
      }
      group.add(flecks);
    }
    const potMat = new T.MeshStandardMaterial({
      map: stone,
      bumpMap: stone,
      bumpScale: 0.012,
      roughness: 0.68,
      color: 0xc7bda6,
    });
    function plant(x, y, z, scale = 1, hanging = false) {
      const pot = new T.Group();
      pot.position.set(x, y, z);
      pot.scale.setScalar(scale);
      group.add(pot);
      cylinder(0.36, 0.25, 0.55, [0, 0.28, 0], potMat, pot);
      cylinder(0.31, 0.31, 0.035, [0, 0.56, 0], mat(0x302119, 0.95), pot);
      const leafGeo = new T.PlaneGeometry(2, 2, 8, 12);
      const positions = leafGeo.attributes.position;
      for (let vertex = 0; vertex < positions.count; vertex++) {
        const u = positions.getX(vertex),
          v = positions.getY(vertex),
          t = (v + 1) / 2;
        positions.setXYZ(
          vertex,
          u * Math.pow(Math.sin(Math.PI * t), 0.68) * 0.57,
          0.13 * Math.sin(Math.PI * t) + Math.abs(u) * 0.09,
          v,
        );
      }
      leafGeo.computeVertexNormals();
      const veins = canvasMap(128, (c, n) => {
        c.fillStyle = "#c7d9ab";
        c.fillRect(0, 0, n, n);
        c.strokeStyle = "#86975a";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(n / 2, 0);
        c.lineTo(n / 2, n);
        c.stroke();
        c.lineWidth = 0.7;
        c.strokeStyle = "#a8bc80";
        for (let row = 16; row < n; row += 15)
          for (const side of [-1, 1]) {
            c.beginPath();
            c.moveTo(n / 2, row);
            c.quadraticCurveTo(
              n / 2 + side * 20,
              row - 5,
              n / 2 + side * 52,
              row - 20,
            );
            c.stroke();
          }
      });
      const leafMat = new T.MeshStandardMaterial({
        color: 0xffffff,
        map: veins,
        roughness: 0.46,
        side: T.DoubleSide,
      });
      const leaves = new T.InstancedMesh(
        leafGeo,
        leafMat,
        view.mobile ? 40 : 75,
      );
      pot.add(leaves);
      for (let n = 0; n < leaves.count; n++) {
        const a = n * 2.399,
          r = 0.1 + random() * 0.6,
          drop = hanging && n > 20;
        dummy.position.set(
          Math.cos(a) * r,
          0.7 + random() * 0.65 - (drop ? random() * 1.6 : 0),
          Math.sin(a) * r,
        );
        dummy.rotation.set(
          (random() - 0.5) * 1.25,
          random() * 6,
          (random() - 0.5) * 0.9,
        );
        dummy.scale.set(
          0.13 + random() * 0.13,
          0.6 + random() * 0.45,
          0.16 + random() * 0.19,
        );
        dummy.updateMatrix();
        leaves.setMatrixAt(n, dummy.matrix);
        color.setHSL(0.22 + random() * 0.075, 0.52, 0.075 + random() * 0.095);
        leaves.setColorAt(n, color);
      }
      for (let n = 0; n < 8; n++) {
        const a = n * 2.399;
        const curve = new T.CatmullRomCurve3([
          new T.Vector3(0, 0.5, 0),
          new T.Vector3(Math.cos(a) * 0.2, 0.92, Math.sin(a) * 0.2),
          new T.Vector3(
            Math.cos(a) * 0.55,
            hanging ? -0.25 : 1.1,
            Math.sin(a) * 0.55,
          ),
        ]);
        mesh(
          new T.TubeGeometry(curve, 8, 0.008, 4, false),
          mat(0x496c25, 0.7),
          [0, 0, 0],
          pot,
        );
      }
    }
    plant(-4.05, 2.61, -3.57, 0.95, true);
    plant(-7.02, 0, -1.9, 1.05, false);
    plant(6.92, 3.25, -3.64, 1.08, true);
    // Janela lateral luminosa, caixilho e travessas em madeira.
    const windowRoot = new T.Group();
    windowRoot.position.set(-7.88, 2.2, -1.65);
    windowRoot.rotation.y = Math.PI / 2;
    group.add(windowRoot);
    const daylight = new T.MeshBasicMaterial({ color: 0xe7e6bd });
    box([2.65, 3.7, 0.1], [0, 0, -0.08], daylight, windowRoot);
    const garden = canvasMap(512, (c, n) => {
      const g = c.createLinearGradient(0, 0, n, n);
      g.addColorStop(0, "#dbe9e7");
      g.addColorStop(0.45, "#b6c5a1");
      g.addColorStop(1, "#5b7445");
      c.fillStyle = g;
      c.fillRect(0, 0, n, n);
      c.filter = "blur(7px)";
      for (let layer = 0; layer < 3; layer++) {
        for (let branch = 0; branch < 7; branch++) {
          const x = random() * n,
            y = n * (0.4 + random() * 0.7);
          c.strokeStyle = ["#67714b", "#596442", "#77725a"][layer];
          c.lineWidth = 2 + layer * 1.5;
          c.beginPath();
          c.moveTo(x, y);
          c.bezierCurveTo(x - 25, y - 80, x + 30, y - 170, x + 60, y - 240);
          c.stroke();
          for (let leaf = 0; leaf < 20; leaf++) {
            const ly = y - random() * 230,
              lx = x + (random() - 0.4) * 100;
            c.fillStyle = ["#6f8b54", "#8fa473", "#435f36", "#b7c78e"][
              leaf % 4
            ];
            c.beginPath();
            c.ellipse(
              lx,
              ly,
              5 + random() * 12,
              2 + random() * 5,
              random() * Math.PI,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
        }
      }
      c.filter = "none";
      const haze = c.createLinearGradient(0, 0, n, n);
      haze.addColorStop(0, "#fff7d04f");
      haze.addColorStop(1, "#e9eee200");
      c.fillStyle = haze;
      c.fillRect(0, 0, n, n);
    });
    box(
      [2.53, 3.55, 0.02],
      [0, 0, 0.01],
      new T.MeshBasicMaterial({ map: garden }),
      windowRoot,
    );
    windowRoot.traverse((o) => {
      if (o.isMesh && o.material?.isMeshBasicMaterial) o.castShadow = false;
    });
    const frame = mat(0x62422a, 0.5);
    for (const x of [-1.36, 0, 1.36])
      box([0.095, 3.8, 0.14], [x, 0, 0.1], frame, windowRoot);
    for (const y of [-1.88, 0, 1.88])
      box([2.8, 0.09, 0.14], [0, y, 0.1], frame, windowRoot);
    box([2.92, 0.14, 0.45], [0, -1.92, 0.1], timber, windowRoot);
    // Decoração fora do inventário: porta-utensílios, fouet e colheres ao fundo.
    const utensilPot = new T.Group();
    utensilPot.position.set(6.9, 0, -2.65);
    group.add(utensilPot);
    cylinder(0.32, 0.27, 0.8, [0, 0.42, 0], potMat, utensilPot);
    for (let n = 0; n < 3; n++) {
      const utensil = new T.Group();
      utensil.position.set((n - 1) * 0.18, 0.78, 0);
      utensil.rotation.z = (n - 1) * -0.18;
      utensilPot.add(utensil);
      cylinder(
        0.035,
        0.035,
        0.85,
        [0, 0.3, 0],
        n === 1 ? chrome : timber,
        utensil,
      );
      if (n !== 1) {
        const spoon = mesh(
          new T.SphereGeometry(0.16, 16, 8),
          timber,
          [0, 0.84, 0],
          utensil,
        );
        spoon.scale.set(1, 1.45, 0.23);
      } else
        for (let w = 0; w < 4; w++) {
          const wire = mesh(
            new T.TorusGeometry(0.17, 0.012, 5, 20),
            chrome,
            [0, 0.84, 0],
            utensil,
          );
          wire.rotation.y = (w * Math.PI) / 4;
          wire.scale.y = 1.4;
        }
    }
  }
  return { enhance };
})();
