/* Efeitos da seleção: CSS anima; JS controla somente visibilidade e preferência. */
(() => {
  const intro = document.getElementById("intro");
  const play = document.getElementById("play");
  const admin = document.getElementById("adminLoginModal");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const preferenceKey = "lq_lobby_motion_paused";
  let paused = false;
  try {
    paused = sessionStorage.getItem(preferenceKey) === "true";
  } catch {}

  const atmosphere = document.createElement("div");
  atmosphere.className = "lobby-atmosphere";
  atmosphere.setAttribute("aria-hidden", "true");
  atmosphere.hidden = true;
  for (let index = 0; index < 12; index++) {
    const mote = document.createElement("span");
    mote.className = "lobby-mote";
    mote.style.setProperty("--mote-x", `${4 + ((index * 29) % 91)}%`);
    mote.style.setProperty("--mote-size", `${2 + (index % 3)}px`);
    mote.style.setProperty("--mote-time", `${19 + (index % 7)}s`);
    mote.style.setProperty("--mote-delay", `${-index * 2.7}s`);
    atmosphere.append(mote);
  }
  document.body.prepend(atmosphere);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = "lobbyMotionToggle";
  toggle.className = "lobby-motion-toggle";
  toggle.hidden = true;
  document.body.append(toggle);

  function sync() {
    const selecting =
      play.classList.contains("active") && !intro.classList.contains("hidden");
    const adminOpen = admin && !admin.classList.contains("hidden");
    const running =
      selecting &&
      !paused &&
      !reduced.matches &&
      !document.hidden &&
      !adminOpen;
    document.body.classList.toggle("lobby-screen", selecting);
    document.body.classList.toggle("lobby-motion", running);
    atmosphere.hidden = !selecting;
    toggle.hidden = !selecting || adminOpen;
    toggle.disabled = reduced.matches;
    toggle.setAttribute("aria-pressed", String(paused || reduced.matches));
    toggle.textContent = reduced.matches
      ? "Movimento reduzido"
      : paused
        ? "Ativar animações"
        : "Pausar animações";
    toggle.title = reduced.matches
      ? "A preferência de movimento reduzido do dispositivo está sendo respeitada."
      : "Controlar os efeitos decorativos da tela inicial";
  }
  toggle.addEventListener("click", () => {
    paused = !paused;
    try {
      sessionStorage.setItem(preferenceKey, String(paused));
    } catch {}
    sync();
  });
  const observer = new MutationObserver(sync);
  for (const element of [intro, play, admin])
    if (element)
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["class"],
      });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  sync();
})();
