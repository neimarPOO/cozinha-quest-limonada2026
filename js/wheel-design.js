/* Arte SVG da roleta. A escolha e a reserva de prêmios continuam em app.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WheelDesign = api;
})(globalThis, () => {
  const escape = (text) =>
    String(text).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icons = {
    drink:
      '<path d="M-14-12h24v21c0 10-24 10-24 0zM10-8h5c12 0 10 17-5 17M-7-20c-5-6 5-8 0-14M2-20c-5-6 5-8 0-14"/>',
    sweet:
      '<path d="M-17 0h34l-4 18h-26zM-16 0c-8-12 2-19 10-15-2-15 17-16 17-3 11-3 16 11 5 18M-9 4v10M0 4v10M9 4v10"/>',
    ticket:
      '<path d="M-23-15h46v9c-9 0-9 12 0 12v9h-46V6c9 0 9-12 0-12zM5-15v5M5-5v5M5 5v5M5 14v1"/><path d="m-9-7 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z"/>',
    gift: '<path d="M-18-5h36v24h-36zM-21-12h42v8h-42zM0-12v31M0-12c-25 2-18-23-6-13l6 13c25 2 18-23 6-13z"/>',
    respin: '<path d="M17-9a20 20 0 1 0 1 19M17-23v15H2"/>',
    badge:
      '<path d="m0-23 6 5 8-1 2 8 7 5-4 7 1 8-8 2-5 7-7-4-8 1-2-8-7-5 4-7-1-8 8-2zM-8 0l6 6 11-13"/>',
  };
  function svg(sectors) {
    const colors = [
      "#326b64",
      "#263d33",
      "#96743c",
      "#294b43",
      "#80513d",
      "#273e35",
      "#536b3b",
      "#628126",
    ];
    let result =
      '<title id="rewardWheelTitle">Roleta de recompensas da Cozinha Quest</title><desc id="rewardWheelDesc">' +
      escape(
        sectors
          .map((s) => (s.type === "miss" ? "Insígnia digital" : s.name))
          .join("; "),
      ) +
      '</desc><defs><linearGradient id="rewardMetal" x2="1" y2="1"><stop stop-color="#fff0b9"/><stop offset=".23" stop-color="#b58740"/><stop offset=".5" stop-color="#f4d38b"/><stop offset=".78" stop-color="#8b622c"/><stop offset="1" stop-color="#e8c47b"/></linearGradient><radialGradient id="rewardEnamel"><stop stop-color="#294a3b"/><stop offset="1" stop-color="#0b211a"/></radialGradient><radialGradient id="rewardGloss" cx=".3" cy=".1" r=".9"><stop stop-color="#fff" stop-opacity=".12"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient><linearGradient id="rewardPaper" x2="1" y2="1"><stop stop-color="#fff9df"/><stop offset="1" stop-color="#e9d6a4"/></linearGradient></defs><circle cx="250" cy="250" r="248" fill="#0a1914"/><circle cx="250" cy="250" r="242" fill="url(#rewardMetal)"/><circle cx="250" cy="250" r="232" fill="#132b20"/>';
    sectors.forEach((s, k) => {
      const a = ((-112.5 + k * 45) * Math.PI) / 180,
        b = a + Math.PI / 4,
        r = 223;
      const path = `M250 250 L${250 + r * Math.cos(a)} ${250 + r * Math.sin(a)} A${r} ${r} 0 0 1 ${250 + r * Math.cos(b)} ${250 + r * Math.sin(b)} Z`;
      const digital = s.type === "miss",
        label = digital ? "INSÍGNIA" : s.label,
        sub = digital ? "DIGITAL" : s.sub;
      result += `<g data-sector="${escape(s.id)}" data-index="${k}"><path d="${path}" fill="${colors[k % colors.length]}" stroke="#e9d090" stroke-opacity=".45" stroke-width="1.2"/><g transform="rotate(${k * 45} 250 250)" fill="${digital ? "#d9e6c6" : "#fff3d1"}" font-family="Outfit,system-ui,sans-serif" text-anchor="middle"><text x="250" y="82" font-size="${label.length > 11 ? 16 : 18}" font-weight="800">${escape(label)}</text><text x="250" y="101" font-size="11.5" font-weight="600" letter-spacing=".6">${escape(sub.toUpperCase())}</text><circle cx="250" cy="151" r="29" fill="#071d16" fill-opacity=".30" stroke="#efdb9f" stroke-opacity=".25"/><g transform="translate(250 151) scale(.76)" fill="none" stroke="${digital ? "#bcd39c" : "#f8e3a9"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${icons[s.id] || icons.badge}</g></g></g>`;
    });
    result +=
      '<circle cx="250" cy="250" r="223" fill="url(#rewardGloss)" pointer-events="none"/>';
    for (let i = 0; i < 48; i++) {
      const a = (i * Math.PI) / 24;
      result += `<circle cx="${250 + 237 * Math.cos(a)}" cy="${250 + 237 * Math.sin(a)}" r="${i % 6 === 0 ? 3 : 1.6}" fill="${i % 6 === 0 ? "#e8ff9d" : "#fff0c0"}" fill-opacity="${i % 6 === 0 ? 1 : 0.55}"/>`;
    }
    result +=
      '<g id="rewardWheelHub"><circle cx="250" cy="250" r="66" fill="#071c16"/><circle cx="250" cy="250" r="61" fill="url(#rewardMetal)"/><circle cx="250" cy="250" r="56" fill="url(#rewardEnamel)"/><path d="M232 247v-14c-19-2-18-25-3-28 4-15 25-15 30-1 19-5 26 22 7 28v15zM232 244h34M239 235v-9M258 235v-9" fill="none" stroke="#e6f69e" stroke-width="3" stroke-linejoin="round"/><text x="250" y="265" fill="#f9edc7" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="12" text-anchor="middle" letter-spacing="1">COZINHA</text><text x="250" y="280" fill="#bfe36e" font-family="Outfit,system-ui,sans-serif" font-weight="800" font-size="10" text-anchor="middle" letter-spacing="2.5">QUEST</text></g>';
    return result;
  }
  function render(element, sectors, context = {}) {
    element.innerHTML = svg(sectors);
    const frame = element.closest(".roleta-frame");
    frame.querySelector(".reward-hub")?.remove();
    const hub = document.createElement("div");
    hub.className = "reward-hub";
    hub.setAttribute("aria-hidden", "true");
    const cap = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    cap.setAttribute("viewBox", "180 180 140 140");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    for (const id of ["rewardMetal", "rewardEnamel"]) {
      const gradient = element.querySelector("#" + id).cloneNode(true);
      gradient.id = id + "Cap";
      defs.append(gradient);
    }
    cap.append(defs);
    const group = element.querySelector("#rewardWheelHub");
    group.innerHTML = group.innerHTML
      .replaceAll("url(#rewardMetal)", "url(#rewardMetalCap)")
      .replaceAll("url(#rewardEnamel)", "url(#rewardEnamelCap)");
    cap.append(group);
    hub.append(cap);
    frame.append(hub);
    element.setAttribute("role", "img");
    element.setAttribute("aria-labelledby", "rewardWheelTitle rewardWheelDesc");
    document.getElementById("rouletteScoreValue").textContent =
      Number(context.score || 0).toLocaleString("pt-BR") + " pts";
    document.getElementById("rouletteRecipeValue").textContent =
      context.recipe || "Seu preparo na bancada";
    state("ready");
  }
  function state(value) {
    const area = document.getElementById("wheelArea");
    if (!area) return;
    area.dataset.state = value;
    if (value === "spinning") {
      area.tabIndex = -1;
      area.focus({ preventScroll: true });
    }
    if (value === "again")
      queueMicrotask(() =>
        document.getElementById("spinBtn").focus({ preventScroll: true }),
      );
    document
      .getElementById("spinBtn")
      .setAttribute("aria-busy", String(value === "spinning"));
    const label = document.getElementById("rouletteState");
    if (label)
      label.textContent =
        value === "spinning"
          ? "Revelando sua recompensa"
          : value === "again"
            ? "Você ganhou mais uma rodada"
            : value === "settled"
              ? "Recompensa revelada"
              : "Sua rodada está pronta";
  }
  return { svg, render, state };
});
