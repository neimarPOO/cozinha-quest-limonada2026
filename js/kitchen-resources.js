/* Recursos limitados e compartilhados: sem alteração de resolução ou materiais. */
window.KitchenResources = (() => {
  const images = new Map(),
    geometries = new Map();
  let idleRenderer = null, releaseTimer = null;
  const environments = new WeakMap();
  function destroyRenderer(renderer) {
    environments.get(renderer)?.dispose();
    environments.delete(renderer);
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  function renderer() {
    clearTimeout(releaseTimer);
    if (idleRenderer) {
      const value=idleRenderer;idleRenderer=null;
      if (!value.getContext().isContextLost()) return value;
      destroyRenderer(value);
    }
    return new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  }
  function releaseRenderer(value) {
    if(idleRenderer===value)return;
    if (idleRenderer) destroyRenderer(idleRenderer);
    if (value.getContext().isContextLost()) {destroyRenderer(value);return;}
    value.renderLists.dispose();
    idleRenderer=value;
    releaseTimer=setTimeout(()=>{if(idleRenderer===value){idleRenderer=null;destroyRenderer(value)}},60000);
  }
  function environment(renderer, build) {
    if (!environments.has(renderer)) environments.set(renderer,build());
    return environments.get(renderer);
  }
  function image(url) {
    if (!images.has(url)) {
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error("Não foi possível carregar " + url));
        img.src = window.KitchenAssetURLs?.[url] || url;
      });
      images.set(url, promise);
      promise.catch(() => images.delete(url));
    }
    return images.get(url);
  }
  function texture(owner, url) {
    const map = new THREE.Texture();
    const ready = image(url).then((img) => {
      if (!owner.disposed) {
        map.image = img;
        map.needsUpdate = true;
      }
    });
    owner.pendingAssets.push(ready);
    return map;
  }
  function geometry(owner, key, create) {
    let entry = geometries.get(key);
    if (!entry) {
      const value = create();
      value.userData.kitchenShared = true;
      entry = { value, users: 0 };
      geometries.set(key, entry);
    }
    owner.sharedGeometryKeys ||= new Set();
    if (!owner.sharedGeometryKeys.has(key)) {
      owner.sharedGeometryKeys.add(key);
      entry.users++;
    }
    // Mantém os recursos recentemente usados no fim do cache.
    geometries.delete(key);
    geometries.set(key, entry);
    return entry.value;
  }
  function releaseGeometries(owner) {
    for (const key of owner.sharedGeometryKeys || [])
      geometries.get(key).users--;
    owner.sharedGeometryKeys?.clear();
    for (const [key, entry] of geometries) {
      if (geometries.size <= 96) break;
      if (!entry.users) {
        entry.value.dispose();
        geometries.delete(key);
      }
    }
  }
  function batchStatic(root) {
    if (!root) return { before: 0, after: 0 };
    root.updateMatrixWorld(true);
    const buckets = new Map(),
      inverse = root.matrixWorld.clone().invert();
    let before = 0,
      after = 0;
    const properties = [
      "type",
      "roughness",
      "metalness",
      "clearcoat",
      "clearcoatRoughness",
      "transparent",
      "opacity",
      "depthWrite",
      "depthTest",
      "side",
      "alphaTest",
      "blending",
      "emissiveIntensity",
      "bumpScale",
      "envMapIntensity",
      "vertexColors",
      "flatShading",
      "dithering",
    ];
    root.traverse((mesh) => {
      if (
        !mesh.isMesh ||
        mesh.isInstancedMesh ||
        mesh.isSkinnedMesh ||
        Array.isArray(mesh.material)
      )
        return;
      const material = mesh.material,
        geometry = mesh.geometry;
      if (
        !geometry.attributes.position ||
        !geometry.attributes.normal ||
        !geometry.attributes.uv ||
        geometry.attributes.color
      )
        return;
      const key = JSON.stringify([
        mesh.castShadow,
        mesh.receiveShadow,
        ...properties.map((p) => material[p]),
        material.color?.getHex(),
        material.emissive?.getHex(),
        ...[
          "map",
          "bumpMap",
          "normalMap",
          "roughnessMap",
          "metalnessMap",
          "alphaMap",
        ].map((p) => material[p]?.uuid),
      ]);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(mesh);
      before++;
    });
    for (const meshes of buckets.values()) {
      if (meshes.length < 2) {
        after++;
        continue;
      }
      const parts = meshes.map((mesh) => {
        const part = mesh.geometry.index
          ? mesh.geometry.toNonIndexed()
          : mesh.geometry.clone();
        part.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
        return part;
      });
      const geometry = new THREE.BufferGeometry();
      for (const name of ["position", "normal", "uv"]) {
        const size = parts[0].attributes[name].itemSize;
        const values = new Float32Array(
          parts.reduce((n, p) => n + p.attributes[name].array.length, 0),
        );
        let offset = 0;
        for (const part of parts) {
          values.set(part.attributes[name].array, offset);
          offset += part.attributes[name].array.length;
        }
        geometry.setAttribute(name, new THREE.BufferAttribute(values, size));
      }
      const merged = new THREE.Mesh(geometry, meshes[0].material);
      merged.castShadow = meshes[0].castShadow;
      merged.receiveShadow = meshes[0].receiveShadow;
      merged.name = "kitchen-static-batch";
      root.add(merged);
      after++;
      const materials = new Set();
      for (const mesh of meshes) {
        mesh.parent.remove(mesh);
        if (!mesh.geometry.userData.kitchenShared) mesh.geometry.dispose();
        if (mesh.material !== merged.material) materials.add(mesh.material);
      }
      for (const material of materials) material.dispose();
      for (const part of parts) part.dispose();
    }
    return { before, after };
  }
  return { image, texture, geometry, releaseGeometries, batchStatic, renderer, releaseRenderer, environment };
})();
