/* Página de receita na mesma cena WebGL: texto acessível e mão 3D, sem outro contexto. */
window.RecipeNotebook = class RecipeNotebook {
  constructor(stage) {
    this.stage = stage;
    this.phase = 0;
    this.lines = [];
    this.chapterY = [];
    this.root = document.createElement("aside");
    this.root.className = "recipe-notebook";
    this.root.hidden = true;
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-modal", "false");
    this.root.setAttribute("aria-labelledby", "notebookTitle");
    this.root.innerHTML =
      '<header><span>CADERNO DE RECEITAS</span><button type="button" class="notebook-close" aria-label="Fechar caderno">×</button><h2 id="notebookTitle"></h2><p>Leia, prepare e volte à página quando precisar.</p><button type="button" class="notebook-current">Ir ao preparo atual</button></header><div class="notebook-page" tabindex="0" role="document" aria-label="Página da receita. Role a roda do mouse ou arraste com a mão para ler."><div class="notebook-readable"></div><div class="notebook-spacer" aria-hidden="true"></div></div><footer>Arraste a página com a mão · role para continuar</footer>';
    stage.append(this.root);
    this.page = this.root.querySelector(".notebook-page");
    this.readable = this.root.querySelector(".notebook-readable");
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.root.querySelector(".notebook-close").onclick = () => this.show(false);
    this.root.querySelector(".notebook-current").onclick = () => {
      this.page.scrollTop = Math.max(0, (this.chapterY[this.phase] || 0) - 16);
      this.schedulePaint();
      this.page.focus();
    };
    this.root.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.show(false);
        document.getElementById("stageGuide")?.focus();
      }
    });
    this.page.addEventListener("scroll", () => this.schedulePaint());
    this.page.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.page.scrollTop +=
          e.deltaY *
          (e.deltaMode === 1
            ? 24
            : e.deltaMode === 2
              ? this.page.clientHeight
              : 1);
        this.readingHand(e, false);
        this.schedulePaint();
      },
      { passive: false },
    );
    this.page.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      this.drag = { id: e.pointerId, y: e.clientY, top: this.page.scrollTop };
      this.page.setPointerCapture(e.pointerId);
      this.page.focus({ preventScroll: true });
      this.readingHand(e, true);
    });
    this.page.addEventListener("pointermove", (e) => {
      if (this.drag?.id === e.pointerId) {
        this.page.scrollTop = this.drag.top + this.drag.y - e.clientY;
      }
      this.readingHand(e, Boolean(this.drag));
    });
    const end = (e) => {
      if (this.page.hasPointerCapture(e.pointerId))
        this.page.releasePointerCapture(e.pointerId);
      this.drag = null;
      this.readingHand(e, false);
    };
    this.page.addEventListener("pointerup", end);
    this.page.addEventListener("pointercancel", (e) => {
      end(e);
      this.scene?.endReadingHand();
    });
    this.page.addEventListener("blur", () => {
      if (!this.drag) this.scene?.endReadingHand();
    });
    this.page.addEventListener("pointerleave", () => {
      if (!this.drag) this.scene?.endReadingHand();
    });
    this.page.addEventListener("keydown", (e) => {
      const moves = {
        ArrowDown: 36,
        ArrowUp: -36,
        PageDown: this.page.clientHeight * 0.8,
        PageUp: -this.page.clientHeight * 0.8,
        " ": this.page.clientHeight * 0.8,
      };
      if (e.key in moves) {
        e.preventDefault();
        e.stopPropagation();
        this.page.scrollTop += moves[e.key];
        const r = this.page.getBoundingClientRect();
        this.readingHand(
          { clientX: r.right - 32, clientY: r.top + r.height * 0.55 },
          false,
        );
        this.schedulePaint();
      }
    });
    this.observer = new ResizeObserver(() => {
      if (!this.root.hidden) this.layout();
    });
    this.observer.observe(this.page);
  }
  open(definition) {
    this.definition = definition;
    this.model = RecipeGuide.notebook(definition);
    this.phase = 0;
    this.progress = [];
    this.progressKey = null;
    this.root.querySelector("h2").textContent = this.model.title;
    const heading = (tag, text) => {
      const e = document.createElement(tag);
      e.textContent = text;
      return e;
    };
    this.readable.replaceChildren(heading("h3", "Ingredientes"));
    const ul = document.createElement("ul");
    for (const item of this.model.ingredients)
      ul.append(heading("li", `${item.amount} — ${item.name}`));
    this.readable.append(ul, heading("h3", "Modo de preparo"));
    this.model.chapters.forEach((chapter, i) => {
      const section = document.createElement("section");
      section.dataset.phase = i;
      section.append(
        heading("h4", `${i + 1}. ${chapter.title}`),
        heading("p", chapter.introduction),
      );
      chapter.instructions.forEach((instruction, index) => {
        const p = heading("p", instruction);
        p.dataset.taskIndex = chapter.taskIndices[index];
        section.append(p);
      });
      section.append(heading("p", chapter.timing));
      this.readable.append(section);
    });
    this.show(innerWidth >= 900);
    this.page.scrollTop = 0;
    this.phase = -1;
    this.setPhase(0);
  }
  show(open) {
    if (!open && this.drag) {
      if (this.page.hasPointerCapture(this.drag.id))
        this.page.releasePointerCapture(this.drag.id);
      this.drag = null;
    }
    const restoreFocus = !open && this.root.contains(document.activeElement);
    this.root.hidden = !open;
    if (restoreFocus)
      document.getElementById("stageGuide")?.focus({ preventScroll: true });
    document
      .getElementById("stageGuide")
      ?.setAttribute("aria-expanded", String(open));
    this.stage.classList.toggle("has-recipe-notebook", open);
    if (!open) this.scene?.endReadingHand();
    if (open) this.layout();
    else this.updateInset();
    if (this.plane) this.plane.visible = open;
    if (this.scene) this.scene.needsRender = true;
  }
  setPhase(phase) {
    if (this.phase === phase) return;
    this.phase = phase;
    for (const section of this.readable.querySelectorAll("[data-phase]")) {
      if (Number(section.dataset.phase) === phase)
        section.setAttribute("aria-current", "step");
      else section.removeAttribute("aria-current");
    }
    this.schedulePaint();
  }
  setProgress(state) {
    const progress = RecipeGuide.procedureProgress(this.definition, state),
      key = progress.join(",");
    if (key === this.progressKey) return;
    this.progress = progress;
    this.progressKey = key;
    for (const paragraph of this.readable.querySelectorAll(
      "[data-task-index]",
    )) {
      const status = progress[Number(paragraph.dataset.taskIndex)];
      paragraph.classList.toggle("is-completed", status === "done");
      paragraph.dataset.status = status;
      paragraph.setAttribute(
        "aria-label",
        (status === "done"
          ? "Concluído. "
          : status === "skipped"
            ? "Opcional não realizado. "
            : "") + paragraph.textContent,
      );
    }
    this.schedulePaint();
  }
  attach(scene) {
    this.detach();
    this.scene = scene;
    this.root.classList.add("has-webgl");
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(12), 3),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2),
    );
    geometry.setIndex([0, 2, 1, 2, 3, 1]);
    this.plane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: this.texture,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        toneMapped: false,
      }),
    );
    this.plane.name = "recipe-notebook-page";
    this.plane.renderOrder = 1000;
    this.plane.frustumCulled = false;
    this.plane.visible = !this.root.hidden;
    scene.scene.add(this.plane);
    scene.beforeRender = () => this.project();
    this.scrollListener = () => {
      this.projectionKey = null;
      scene.needsRender = true;
    };
    scene.root.addEventListener("scroll", this.scrollListener);
    this.layout();
  }
  detach() {
    if (this.scene) {
      this.scene.endReadingHand();
      this.scene.beforeRender = null;
      this.scene.root.removeEventListener("scroll", this.scrollListener);
      this.scene.setNotebookInset(0);
    }
    if (this.plane) {
      this.plane.parent?.remove(this.plane);
      this.plane.geometry.dispose();
      this.plane.material.dispose();
      this.texture.dispose();
    }
    this.scene = null;
    this.plane = null;
    this.texture = null;
    this.root.classList.remove("has-webgl");
  }
  updateInset() {
    const width =
      !this.root.hidden && innerWidth >= 900
        ? this.root.getBoundingClientRect().width + 28
        : 0;
    this.stage.style.setProperty("--notebook-width", width + "px");
    this.scene?.setNotebookInset(width);
  }
  layout() {
    this.updateInset();
    if (!this.model || this.root.hidden) return;
    const width = this.page.clientWidth;
    if (width < 80) return;
    this.lines = [];
    this.chapterY = [];
    let y = 36;
    const left = 38,
      right = 24,
      available = width - left - right,
      ctx = this.ctx;
    const text = (
      value,
      font = "17px Georgia",
      color = "#2d261f",
      gap = 10,
      taskIndex = null,
    ) => {
      ctx.font = font;
      let line = "";
      for (const word of value.split(/\s+/)) {
        const next = line ? line + " " + word : word;
        if (line && ctx.measureText(next).width > available) {
          this.lines.push({ text: line, font, color, x: left, y, taskIndex });
          y += 29;
          line = word;
        } else line = next;
      }
      if (line) {
        this.lines.push({ text: line, font, color, x: left, y, taskIndex });
        y += 29;
      }
      y += gap;
    };
    text("Ingredientes", "bold italic 24px Georgia", "#5b3625", 12);
    for (const item of this.model.ingredients)
      text(`${item.amount} — ${item.name}`, "17px Georgia", "#2d261f", 2);
    y += 18;
    text("Modo de preparo", "bold italic 24px Georgia", "#5b3625", 16);
    this.model.chapters.forEach((chapter, i) => {
      this.chapterY[i] = y - 20;
      text(`${i + 1}. ${chapter.title}`, "bold 20px Georgia", "#4f3728", 12);
      text(chapter.introduction);
      chapter.instructions.forEach((instruction, index) =>
        text(instruction, undefined, undefined, 10, chapter.taskIndices[index]),
      );
      text(chapter.timing, "italic 16px Georgia", "#66523b", 26);
    });
    this.documentHeight = y + 40;
    this.root.querySelector(".notebook-spacer").style.height =
      this.documentHeight + "px";
    this.projectionKey = null;
    this.paint();
  }
  schedulePaint() {
    if (this.paintFrame) return;
    this.paintFrame = requestAnimationFrame(() => {
      this.paintFrame = null;
      this.paint();
    });
  }
  paint() {
    if (this.root.hidden || !this.model) return;
    const w = this.page.clientWidth,
      h = this.page.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(Math.max(devicePixelRatio || 1, 2), 2.5);
    const cw = Math.round(w * scale),
      ch = Math.round(h * scale);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
      if (this.texture) {
        this.texture.dispose();
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.texture.generateMipmaps = false;
        this.texture.minFilter = THREE.LinearFilter;
        if (this.plane) {
          this.plane.material.map = this.texture;
          this.plane.material.needsUpdate = true;
        }
      }
    }
    const ctx = this.ctx;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = "#fff9e8";
    ctx.fillRect(0, 0, w, h);
    const top = this.page.scrollTop;
    ctx.strokeStyle = "#a8bdce60";
    ctx.lineWidth = 0.7;
    for (let y = 44 - (top % 29); y < h; y += 29) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 12, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#cf877b85";
    ctx.beginPath();
    ctx.moveTo(27, 0);
    ctx.lineTo(27, h);
    ctx.stroke();
    const cy = this.chapterY[this.phase] - top;
    if (cy > -100 && cy < h) {
      ctx.fillStyle = "#ead78d80";
      ctx.fillRect(32, cy - 6, w - 47, 29);
    }
    for (const line of this.lines) {
      const y = line.y - top;
      if (y < -30 || y > h + 30) continue;
      ctx.font = line.font;
      const completed =
        line.taskIndex !== null && this.progress?.[line.taskIndex] === "done";
      ctx.fillStyle = completed ? "#70604b" : line.color;
      ctx.fillText(line.text, line.x, y);
      if (completed) {
        const size = parseFloat(line.font.match(/[\d.]+px/)[0]);
        ctx.strokeStyle = "#736048";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(line.x - 1, y - size * 0.32);
        ctx.lineTo(
          line.x + ctx.measureText(line.text).width + 1,
          y - size * 0.32,
        );
        ctx.stroke();
      }
    }
    // Grão discreto do papel, sem rasterizar toda a receita na GPU.
    ctx.fillStyle = "#9d774b0a";
    for (let i = 0; i < 150; i++)
      ctx.fillRect((i * 71.3) % w, (i * 53.7) % h, 1, 1);
    if (this.texture) this.texture.needsUpdate = true;
    if (this.scene) this.scene.needsRender = true;
  }
  project() {
    if (!this.scene || !this.plane || this.root.hidden) return;
    const box = this.page.getBoundingClientRect(),
      canvas = this.scene.renderer.domElement.getBoundingClientRect(),
      camera = this.scene.camera;
    const key = [
      box.x,
      box.y,
      box.width,
      box.height,
      canvas.x,
      canvas.y,
      canvas.width,
      canvas.height,
      ...camera.projectionMatrix.elements,
      ...camera.matrixWorld.elements,
    ].join(",");
    if (key === this.projectionKey) return;
    this.projectionKey = key;
    const normal = camera.getWorldDirection(new THREE.Vector3()),
      center = camera.position.clone().addScaledVector(normal, 4.8),
      plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center),
      ray = new THREE.Raycaster();
    const corners = [
      [box.left, box.top],
      [box.right, box.top],
      [box.left, box.bottom],
      [box.right, box.bottom],
    ];
    corners.forEach(([x, y], i) => {
      ray.setFromCamera(
        new THREE.Vector2(
          ((x - canvas.left) / canvas.width) * 2 - 1,
          1 - ((y - canvas.top) / canvas.height) * 2,
        ),
        camera,
      );
      const point = ray.ray.intersectPlane(plane, new THREE.Vector3());
      if (point)
        this.plane.geometry.attributes.position.setXYZ(
          i,
          point.x,
          point.y,
          point.z,
        );
    });
    this.plane.geometry.attributes.position.needsUpdate = true;
  }
  readingHand(event, grab) {
    if (this.scene) {
      this.scene.setHovered(null);
      this.scene.readPageHand(event, grab);
    }
  }
};
