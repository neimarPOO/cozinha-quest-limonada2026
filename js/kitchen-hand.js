/* Mão articulada compartilhada pelas três receitas, com superfícies suaves e pele negra. */
window.KitchenHand = {
  create() {
    const mat = (options) => new THREE.MeshStandardMaterial(options);
    let skinMat = mat({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.57,
      metalness: 0,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    let nailMat = mat({ color: 0xb98b7c, roughness: 0.3, metalness: 0 });
    let sleeveMat = mat({ color: 0xb9cdb4, roughness: 0.9 });
    function addPart(parent, geo, m) {
      let x = new THREE.Mesh(geo, m);
      x.castShadow = false;
      x.receiveShadow = false;
      parent.add(x);
      return x;
    }
    // Merge static surfaces once: smoother silhouettes without extra draw calls.
    function mergeSurfaces(parts, skinned = false) {
      const positions = [],
        normals = [],
        uvs = [],
        indices = [],
        joints = [],
        weights = [];
      let offset = 0;
      parts.forEach((geo) => {
        const p = geo.attributes.position,
          n = geo.attributes.normal,
          uv = geo.attributes.uv;
        positions.push(...p.array);
        normals.push(...n.array);
        if (uv) uvs.push(...uv.array);
        else for (let i = 0; i < p.count; i++) uvs.push(0, 0);
        if (skinned) {
          joints.push(...geo.attributes.skinIndex.array);
          weights.push(...geo.attributes.skinWeight.array);
        }
        if (geo.index)
          for (const index of geo.index.array) indices.push(index + offset);
        else for (let i = 0; i < p.count; i++) indices.push(i + offset);
        offset += p.count;
        geo.dispose();
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      if (skinned) {
        geo.setAttribute(
          "skinIndex",
          new THREE.Uint16BufferAttribute(joints, 4),
        );
        geo.setAttribute(
          "skinWeight",
          new THREE.Float32BufferAttribute(weights, 4),
        );
      }
      return geo;
    }
    function buildHand(side) {
      side = side || 1;
      const g = new THREE.Group(),
        rig = { group: g, fingers: [], thumb: [], side };
      const base = new THREE.Bone(),
        bones = [base],
        surfaces = [];
      g.add(base);
      function skin(geo, joint = 0) {
        const ids = [],
          weights = [];
        for (let i = 0; i < geo.attributes.position.count; i++) {
          ids.push(joint, 0, 0, 0);
          weights.push(1, 0, 0, 0);
        }
        geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(ids, 4));
        geo.setAttribute(
          "skinWeight",
          new THREE.Float32BufferAttribute(weights, 4),
        );
        surfaces.push(geo);
        return geo;
      }
      // One continuous palm, tapering into a shorter wrist and forearm.
      const palmPositions = [],
        palmUV = [],
        palmIndices = [];
      const profile = [
        [-0.193, 0.05, 0.033],
        [-0.14, 0.048, 0.03],
        [-0.065, 0.048, 0.029],
        [0, 0.055, 0.029],
        [0.045, 0.074, 0.033],
        [0.095, 0.079, 0.032],
        [0.135, 0.072, 0.024],
        [0.158, 0.038, 0.012],
        [0.165, 0, 0],
      ];
      const palmSides = 36;
      profile.forEach(([z, width, depth], ring) => {
        for (let j = 0; j <= palmSides; j++) {
          const a = (j / palmSides) * Math.PI * 2;
          palmPositions.push(
            Math.cos(a) * width,
            Math.sin(a) * depth + 0.002,
            z,
          );
          palmUV.push(j / palmSides, ring / (profile.length - 1));
          if (ring < profile.length - 1 && j < palmSides) {
            const a = ring * (palmSides + 1) + j,
              b = a + palmSides + 1;
            palmIndices.push(a, a + 1, b, a + 1, b + 1, b);
          }
        }
      });
      const palm = new THREE.BufferGeometry();
      palm.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(palmPositions, 3),
      );
      palm.setAttribute("uv", new THREE.Float32BufferAttribute(palmUV, 2));
      palm.setIndex(palmIndices);
      palm.computeVertexNormals();
      skin(palm);
      // Eminência tenar: transição carnosa entre a palma e a base do polegar.
      const thenar = new THREE.SphereGeometry(1, 20, 14);
      thenar.scale(0.029, 0.027, 0.061);
      thenar.rotateY(-side * 0.3);
      thenar.translate(-side * 0.047, -0.005, 0.051);
      skin(thenar);
      const cuff = addPart(
        g,
        new THREE.CylinderGeometry(0.06, 0.064, 0.09, 24, 1),
        sleeveMat,
      );
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(0, 0.002, -0.215);
      const cuffRim = addPart(
        g,
        new THREE.TorusGeometry(0.06, 0.006, 6, 20),
        sleeveMat,
      );
      cuffRim.position.set(0, 0.002, -0.17);
      // A finger is a closed continuous surface; skin weights blend through joints.
      function finger(x, z, length, radius, lengths, rotation, thumb = false) {
        const root = new THREE.Bone();
        root.position.set(x, thumb ? -0.01 : 0.004, z);
        if (rotation) root.rotation.set(...rotation);
        base.add(root);
        const chain = [root],
          ids = [bones.length];
        bones.push(root);
        for (let j = 1; j < lengths.length; j++) {
          const bone = new THREE.Bone();
          bone.position.z = lengths[j - 1];
          chain[j - 1].add(bone);
          chain.push(bone);
          ids.push(bones.length);
          bones.push(bone);
        }
        g.updateMatrixWorld(true);
        const vertices = [],
          uv = [],
          index = [],
          skinIds = [],
          skinWeights = [];
        const rings = 28,
          sides = 20;
        for (let j = 0; j <= rings; j++) {
          const t = j / rings,
            localZ = -0.01 + t * (length + 0.01);
          const tip = Math.min(1, (1 - t) / 0.16),
            start = Math.min(1, t / 0.06);
          const r =
            radius *
            (1 - 0.25 * t) *
            (1 + 0.07 * Math.exp(-Math.pow((t - 0.44) / 0.08, 2)) +
              0.045 * Math.exp(-Math.pow((t - 0.76) / 0.07, 2))) *
            Math.sqrt(Math.max(0, tip * (2 - tip))) *
            Math.sqrt(start);
          let bone = 0,
            at = localZ;
          while (bone < lengths.length - 1 && at > lengths[bone]) {
            at -= lengths[bone];
            bone++;
          }
          const blend =
            bone < lengths.length - 1
              ? THREE.MathUtils.smoothstep(at / lengths[bone], 0.55, 1)
              : 0;
          for (let k = 0; k <= sides; k++) {
            const angle = (k / sides) * Math.PI * 2;
            const v = new THREE.Vector3(
              Math.cos(angle) * r,
              Math.sin(angle) * r * 0.88,
              localZ,
            ).applyMatrix4(root.matrixWorld);
            vertices.push(v.x, v.y, v.z);
            uv.push(k / sides, t);
            skinIds.push(
              ids[bone],
              ids[Math.min(bone + 1, ids.length - 1)],
              0,
              0,
            );
            skinWeights.push(1 - blend, blend, 0, 0);
            if (j < rings && k < sides) {
              const a = j * (sides + 1) + k,
                b = a + sides + 1;
              index.push(a, a + 1, b, a + 1, b + 1, b);
            }
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3),
        );
        geo.setIndex(index);
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        geo.computeVertexNormals();
        geo.setAttribute(
          "skinIndex",
          new THREE.Uint16BufferAttribute(skinIds, 4),
        );
        geo.setAttribute(
          "skinWeight",
          new THREE.Float32BufferAttribute(skinWeights, 4),
        );
        surfaces.push(geo);
        const nail = addPart(
          chain[chain.length - 1],
          new THREE.SphereGeometry(1, 18, 12),
          nailMat,
        );
        nail.scale.set(
          radius * 0.5,
          0.0016,
          lengths[lengths.length - 1] * 0.44,
        );
        nail.position.set(0, radius * 0.74, lengths[lengths.length - 1] * 0.48);
        return chain;
      }
      [
        [-0.058, 0.129, 0.139, 0.015],
        [-0.019, 0.14, 0.16, 0.0165],
        [0.02, 0.135, 0.148, 0.015],
        [0.057, 0.12, 0.115, 0.013],
      ].forEach(([x, z, len, r]) => {
        rig.fingers.push(
          finger(x * side, z, len, r, [len * 0.44, len * 0.32, len * 0.24]),
        );
      });
      // Pequenas comissuras suavizam a ligação entre os dedos e a palma.
      for (const [x,z] of [[-0.039,0.129],[0,0.132],[0.039,0.122]]) {
        const web = new THREE.SphereGeometry(1, 16, 10);
        web.scale(0.014,0.016,0.022);
        web.translate(x * side,0,z);
        skin(web);
      }
      // Index is fingers[0] on -X: the right thumb belongs on that same side.
      // CMC, MCP and IP get independent controls; opposition starts at the CMC.
      rig.thumb = finger(
        -side * 0.063,
        0.06,
        0.115,
        0.025,
        [0.045, 0.04, 0.03],
        [0.12, -side * 0.7, side * 0.12],
        true,
      );
      let geometry;
      if (window.KitchenHandSurface) {
        const asset = window.KitchenHandSurface;
        const decode = (value, Type) => {
          const text = atob(value), bytes = new Uint8Array(text.length);
          for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
          return new Type(bytes.buffer);
        };
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(
          Float32Array.from(decode(asset.position, Int16Array), n => n / 100000), 3));
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute(
          Float32Array.from(decode(asset.normal, Int16Array), n => n / 32767), 3));
        geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(decode(asset.skinIndex, Uint8Array), 4));
        geometry.setAttribute("skinWeight", new THREE.BufferAttribute(decode(asset.skinWeight, Uint8Array), 4, true));
        geometry.setIndex(new THREE.BufferAttribute(decode(asset.index, Uint16Array), 1));
        for (const surface of surfaces) surface.dispose();
      } else geometry = mergeSurfaces(surfaces, true);
      const colors = [], normal = geometry.attributes.normal;
      const dorsal = new THREE.Color(0x573421), palmar = new THREE.Color(0x936446);
      // A palma é naturalmente mais clara; a pigmentação acompanha a superfície.
      for (let i = 0; i < normal.count; i++) {
        const amount = THREE.MathUtils.smoothstep(-normal.getY(i), -0.15, 0.85);
        const color = dorsal.clone().lerp(palmar, amount);
        colors.push(color.r,color.g,color.b);
      }
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const mesh = new THREE.SkinnedMesh(geometry, skinMat);
      mesh.name = "Mão articulada — pele negra";
      g.add(mesh);
      g.updateMatrixWorld(true);
      mesh.bind(new THREE.Skeleton(bones));
      // The small hand moves beyond its rest bounds when kneading.
      mesh.frustumCulled = false;
      mesh.userData.continuousHand = true;
      return rig;
    }
    // Local +Y is dorsal (nails); positive X flexion curls toward the palm (-Y).
    // CMC yaw brings the thumb across the palm while roll turns its pad inward.
    // References: OpenStax Anatomy & Physiology 2e, Types of Body Movements
    // and Muscles of the Pectoral Girdle and Upper Limbs (opposition/thenar muscles).
    const HAND_POSES = {
      open: {
        f: [
          [0.1, 0.12, 0.08],
          [0.08, 0.14, 0.09],
          [0.12, 0.18, 0.12],
          [0.16, 0.23, 0.15],
        ],
        spread: [-0.18, -0.03, 0.08, 0.23],
        thumb: { cmc: [0.12, -0.7, 0.12], mcp: 0.12, ip: 0.1 },
      },
      grab: {
        f: [
          [1.05, 1.05, 0.65],
          [1.13, 1.1, 0.7],
          [1.2, 1.15, 0.74],
          [1.26, 1.18, 0.76],
        ],
        spread: [-0.035, -0.01, 0.015, 0.035],
        thumb: { cmc: [0.8, 0.65, -1.1], mcp: 0.28, ip: 0.32 },
      },
      pinch: {
        f: [
          [0.88, 0.82, 0.5],
          [0.45, 0.55, 0.34],
          [0.56, 0.64, 0.4],
          [0.68, 0.78, 0.48],
        ],
        spread: [0.025, -0.01, 0.035, 0.07],
        thumb: { cmc: [0.78, 0.4, -1.2], mcp: 0.04, ip: 0.04 },
      },
      press: {
        f: [
          [0.16, 0.14, 0.09],
          [0.14, 0.14, 0.09],
          [0.18, 0.17, 0.11],
          [0.22, 0.2, 0.13],
        ],
        spread: [-0.045, -0.015, 0.02, 0.055],
        thumb: { cmc: [0.23, -0.4, -0.12], mcp: 0.15, ip: 0.1 },
      },
      page: {
        f: [
          [0.06, 0.08, 0.04],
          [0.16, 0.18, 0.1],
          [0.22, 0.24, 0.13],
          [0.28, 0.3, 0.16],
        ],
        spread: [-0.035, -0.005, 0.025, 0.055],
        thumb: { cmc: [-0.05, -0.65, -0.1], mcp: 0.15, ip: 0.1 },
      },
      pageDrag: {
        f: [
          [0.16, 0.2, 0.1],
          [0.23, 0.27, 0.15],
          [0.3, 0.34, 0.18],
          [0.36, 0.4, 0.22],
        ],
        spread: [-0.025, -0.005, 0.02, 0.045],
        thumb: { cmc: [-0.05, -0.52, -0.1], mcp: 0.2, ip: 0.14 },
      },
      knead: {
        f: [
          [0.7, 0.55, 0.36],
          [0.74, 0.58, 0.38],
          [0.8, 0.64, 0.42],
          [0.88, 0.7, 0.46],
        ],
        spread: [-0.035, -0.01, 0.02, 0.05],
        thumb: { cmc: [0.6, 0.3, -0.85], mcp: 0.18, ip: 0.2 },
      },
    };
    function poseHand(rig, name, k) {
      const P = HAND_POSES[name] || HAND_POSES.open,
        a = THREE.MathUtils.clamp(k, 0, 1);
      for (let i = 0; i < 4; i++) {
        const finger = rig.fingers[i],
          target = P.f[i];
        for (let j = 0; j < 3; j++) {
          const angle = THREE.MathUtils.clamp(
            target[j],
            0,
            j === 2 ? 1.25 : 1.55,
          );
          finger[j].rotation.x += (angle - finger[j].rotation.x) * a;
        }
        finger[0].rotation.y +=
          (P.spread[i] * rig.side - finger[0].rotation.y) * a;
      }
      const cmc = rig.thumb[0],
        target = P.thumb;
      cmc.rotation.x += (target.cmc[0] - cmc.rotation.x) * a;
      cmc.rotation.y += (target.cmc[1] * rig.side - cmc.rotation.y) * a;
      cmc.rotation.z += (target.cmc[2] * rig.side - cmc.rotation.z) * a;
      rig.thumb[1].rotation.x += (target.mcp - rig.thumb[1].rotation.x) * a;
      rig.thumb[2].rotation.x += (target.ip - rig.thumb[2].rotation.x) * a;
    }

    const rig = buildHand(1);
    rig.group.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    return {
      group: rig.group,
      pose(name, amount) {
        poseHand(rig, name, amount);
      },
    };
  },
};
