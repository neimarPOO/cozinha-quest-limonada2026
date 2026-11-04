/* Luz de janela e reflexos HDR locais, compartilhados pelas três receitas. */
window.KitchenLighting = {
  enhance(c) {
    const T = THREE;
    if (window.RectAreaLightUniformsLib && !window.kitchenAreaLightReady) {
      RectAreaLightUniformsLib.init();
      window.kitchenAreaLightReady = true;
    }
    // Captura de ambiente em alta faixa dinâmica: o vidro e o esmalte refletem
    // uma janela com montantes, não uma cor ambiente uniforme.
    const studio = new T.Scene();
    studio.background = new T.Color("#151b17");
    const panel = (w, h, color, p, target, intensity = 1) => {
      const m = new T.Mesh(
        new T.PlaneGeometry(w, h),
        new T.MeshBasicMaterial({
          color: new T.Color(color).multiplyScalar(intensity),
          side: T.DoubleSide,
        }),
      );
      m.position.set(...p);
      m.lookAt(...target);
      studio.add(m);
      return m;
    };
    panel(18, 18, "#5d4530", [0, -4, 0], [0, 0, 0], 0.65);
    panel(18, 12, "#172d24", [0, 3, -8], [0, 2, 0], 0.8);
    for (const z of [-1.14, 0.44])
      for (const y of [0.7, 2.55])
        panel(1.45, 1.7, "#fff2d9", [-6, y, z], [0, 1, 0], 4.8);
    panel(4, 2, "#c9deec", [6, 4, 2], [0, 1, 0], 0.7);
    panel(8, 4, "#e6edf1", [3, 4, 6], [0, 0.6, 0], 0.7);
    panel(7, 0.13, "#ffd08b", [0, 2.8, -4], [0, 0, 0], 2.7);
    const pmrem = new T.PMREMGenerator(c.renderer);
    c.environmentTarget = pmrem.fromScene(studio, 0.025, 0.1, 40);
    c.scene.environment = c.environmentTarget.texture;
    pmrem.dispose();
    studio.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    c.renderer.shadowMap.autoUpdate = false;
    c.renderer.shadowMap.needsUpdate = true;
    c.renderer.shadowMap.type = T.PCFSoftShadowMap;
    c.renderer.toneMappingExposure = 1.12;
    c.scene.background = new T.Color("#15271f");
    for (const light of c.scene.children) {
      if (light.isHemisphereLight) {
        light.intensity = 0.48;
        light.color.set("#e2eff0");
        light.groundColor.set("#54351e");
      }
      if (light.isDirectionalLight) {
        light.intensity = 3.3;
        light.color.set("#fff0d5");
        light.position.set(-10, 4, -1.65);
        light.target.position.set(0, -0.1, 1);
        c.scene.add(light.target);
        light.shadow.mapSize.set(c.mobile ? 512 : 2048, c.mobile ? 512 : 2048);
        light.shadow.radius = 3;
        light.shadow.normalBias = 0.012;
        light.shadow.bias = -0.00012;
        Object.assign(light.shadow.camera, {
          left: -10,
          right: 10,
          top: 7,
          bottom: -7,
          near: 0.5,
          far: 30,
        });
      }
    }
    const fill = new T.DirectionalLight("#c4d9ec", 0.42);
    fill.position.set(5, 4, 3);
    c.scene.add(fill);
    if (window.kitchenAreaLightReady) {
      const windowLight = new T.RectAreaLight("#fff1da", 5.5, 2.7, 3.6);
      windowLight.position.set(-7.7, 2.5, -1.5);
      windowLight.lookAt(0, 0.2, 1);
      c.scene.add(windowLight);
      const overhead = new T.RectAreaLight("#ffe3b8", 1.2, 7, 1);
      overhead.position.set(0, 4.8, -1);
      overhead.lookAt(0, 0, 1);
      c.scene.add(overhead);
      const frontFill = new T.RectAreaLight("#e9eef1", 2.2, 8, 4);
      frontFill.position.set(3, 4, 6);
      frontFill.lookAt(0, 0.6, 0);
      c.scene.add(frontFill);
    }
    c.scene.traverse((o) => {
      if (o.isMesh && o.material) {
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          if (m.envMapIntensity !== undefined) m.envMapIntensity = 0.85;
      }
    });
  },
};
