(() => {
  const SPAWN_SAFE_RADIUS = 160;
  const MAX_SPAWN_ATTEMPTS = 24;

  let running = false;
  let waveIndex = 0;
  let waveStart = 0;
  let rafId = null;
  let spawnStates = [];
  let timerEl = null;

  const getTimerEl = () => {
    if (!timerEl) {
      timerEl = document.querySelector("[data-wave-timer]");
    }
    return timerEl;
  };

  const updateTimer = (seconds) => {
    const el = getTimerEl();
    if (!el) {
      return;
    }
    const value = Math.max(0, Math.ceil(seconds));
    el.textContent = `${value}`;
  };

  const getWaveData = () => window.SCRAPPO_WAVES || [];
  const getMobData = () => window.SCRAPPO_MOBS || {};

  const spawnMob = (type) => {
    const mapApi = window.SCRAPPO_MAP;
    const mobs = getMobData();
    const mob = mobs[type];
    if (!mapApi || !mob || typeof mapApi.spawnMob !== "function") {
      return false;
    }

    const mapSize = typeof mapApi.getMapSize === "function" ? mapApi.getMapSize() : 0;
    const playerPos = typeof mapApi.getPlayerPosition === "function" ? mapApi.getPlayerPosition() : null;
    const playerSize = typeof mapApi.getPlayerSize === "function" ? mapApi.getPlayerSize() : 52;

    if (!mapSize || !playerPos) {
      return false;
    }

    const padding = mob.size ? mob.size / 2 + 8 : 16;
    const safeRadius = Math.max(SPAWN_SAFE_RADIUS, playerSize * 2.4);

    for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt += 1) {
      const x = padding + Math.random() * (mapSize - padding * 2);
      const y = padding + Math.random() * (mapSize - padding * 2);
      const distance = Math.hypot(x - playerPos.x, y - playerPos.y);
      if (distance >= safeRadius) {
        mapApi.spawnMob(mob, { x, y });
        return true;
      }
    }

    return false;
  };

  const prepareSpawns = (wave) => wave.spawns.map((spawn) => ({
    type: spawn.type,
    count: typeof spawn.count === "number" ? spawn.count : 0,
    interval: typeof spawn.interval === "number" ? spawn.interval : 1,
    spawned: 0,
    nextAt: typeof spawn.delay === "number" ? spawn.delay : 0
  }));

  const startWave = (wave) => {
    waveStart = performance.now();
    spawnStates = prepareSpawns(wave);
    updateTimer(wave.duration);
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(tick);
  };

  const tick = (timestamp) => {
    if (!running) {
      return;
    }

    const waves = getWaveData();
    const wave = waves[waveIndex];
    if (!wave) {
      stop();
      return;
    }

    const elapsed = (timestamp - waveStart) / 1000;
    const timeLeft = wave.duration - elapsed;
    updateTimer(timeLeft);

    spawnStates.forEach((state) => {
      while (state.spawned < state.count && elapsed >= state.nextAt && elapsed <= wave.duration) {
        spawnMob(state.type);
        state.spawned += 1;
        state.nextAt += state.interval;
      }
    });

    if (timeLeft <= 0) {
      waveIndex += 1;
      if (waveIndex < waves.length) {
        startWave(waves[waveIndex]);
      } else {
        stop();
      }
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) {
      return;
    }

    const waves = getWaveData();
    if (!waves.length) {
      return;
    }

    const mapApi = window.SCRAPPO_MAP;
    if (mapApi && typeof mapApi.clearMobs === "function") {
      mapApi.clearMobs();
    }

    running = true;
    waveIndex = 0;
    startWave(waves[waveIndex]);
  };

  const stop = () => {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
    updateTimer(0);
  };

  window.SCRAPPO_WAVE_SYSTEM = {
    start,
    stop
  };
})();
