(() => {
  const internal = window.SCRAPPO_MAP_INTERNAL;
  if (!internal) {
    return;
  }

  const { config, playerConfig, playerPos, state } = internal;

  const handleKeyDown = (event) => {
    if (!state.active) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key.startsWith("arrow")) {
      event.preventDefault();
    }
    state.keys.add(key);
  };

  const handleKeyUp = (event) => {
    if (!state.active) {
      return;
    }

    const key = event.key.toLowerCase();
    state.keys.delete(key);
  };

  const init = () => {
    if (state.initialized) {
      return;
    }

    state.frame = document.querySelector(".game-frame");
    state.world = document.querySelector("[data-world]");
    state.player = document.querySelector("[data-player]");
    state.hpBar = document.querySelector("[data-player-hp-bar]");
    state.hpText = document.querySelector("[data-player-hp-text]");
    state.xpBar = document.querySelector("[data-player-xp-bar]");
    state.xpText = document.querySelector("[data-player-xp-text]");
    state.goldText = document.querySelector("[data-player-gold-text]");

    if (!state.frame || !state.world || !state.player) {
      return;
    }

    state.player.style.width = `${playerConfig.size}px`;
    state.player.style.height = `${playerConfig.size}px`;
    state.player.style.setProperty("--player-size", `${playerConfig.size}px`);

    if (typeof internal.setupWorld === "function") {
      internal.setupWorld();
    }
    if (typeof internal.spawnItems === "function") {
      internal.spawnItems();
    }
    if (typeof internal.updateCamera === "function") {
      internal.updateCamera();
    }
    if (typeof internal.updatePlayerHealthUI === "function") {
      internal.updatePlayerHealthUI();
    }
    if (typeof internal.updatePlayerXpUI === "function") {
      internal.updatePlayerXpUI();
    }
    if (typeof internal.updatePlayerGoldUI === "function") {
      internal.updatePlayerGoldUI();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", () => state.keys.clear());
    window.addEventListener("resize", () => {
      if (typeof internal.updateCamera === "function") {
        internal.updateCamera();
      }
    });

    state.initialized = true;
  };

  const tick = (timestamp) => {
    if (!state.active) {
      state.rafId = null;
      return;
    }

    const delta = Math.min(0.05, (timestamp - state.lastTime) / 1000);
    state.lastTime = timestamp;

    if (typeof internal.updateMovement === "function") {
      internal.updateMovement(delta);
    }
    if (typeof internal.updateMobs === "function") {
      internal.updateMobs(delta, timestamp);
    }
    if (typeof internal.updateExperienceDrops === "function") {
      internal.updateExperienceDrops(delta);
    }
    if (typeof internal.updateGoldDrops === "function") {
      internal.updateGoldDrops(delta);
    }
    if (typeof internal.updateCamera === "function") {
      internal.updateCamera();
    }

    state.rafId = window.requestAnimationFrame(tick);
  };

  const start = () => {
    init();
    if (!state.initialized) {
      return;
    }
    if (typeof internal.resetPlayerState === "function") {
      internal.resetPlayerState();
    }
    if (typeof internal.clearExperienceDrops === "function") {
      internal.clearExperienceDrops();
    }
    if (typeof internal.clearGoldDrops === "function") {
      internal.clearGoldDrops();
    }
    state.keys.clear();
    state.active = true;
    state.lastTime = performance.now();
    if (!state.rafId) {
      state.rafId = window.requestAnimationFrame(tick);
    }
  };

  const pause = () => {
    state.active = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    state.rafId = null;
    state.keys.clear();
    if (state.player) {
      state.player.classList.remove("is-moving");
    }
  };

  const resume = () => {
    if (state.active) {
      return;
    }
    state.active = true;
    state.lastTime = performance.now();
    if (!state.rafId) {
      state.rafId = window.requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    pause();
    if (typeof internal.clearExperienceDrops === "function") {
      internal.clearExperienceDrops();
    }
    if (typeof internal.clearGoldDrops === "function") {
      internal.clearGoldDrops();
    }
  };

  window.SCRAPPO_MAP = {
    start,
    pause,
    resume,
    stop,
    prepareNextWave: internal.prepareNextWave,
    spawnMob: internal.spawnMob,
    clearMobs: internal.clearMobs,
    getMobTargets: internal.getMobTargets,
    applyDamage: internal.applyDamage,
    refreshPlayerHud: internal.refreshPlayerHud,
    getPlayerPosition: () => ({ x: playerPos.x, y: playerPos.y }),
    getMapSize: () => config.mapSize,
    getPlayerSize: () => playerConfig.size,
    getZoom: () => config.zoom
  };
})();
