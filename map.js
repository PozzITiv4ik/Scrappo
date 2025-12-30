(() => {
  const CONFIG = {
    mapSize: 1400,
    playerSize: 52,
    itemSize: 28,
    itemCount: 14,
    speed: 240,
    zoom: 2.5
  };

  const PLANT_PATHS = [
    "icons/location_item_1.png",
    "icons/location_item_2.png",
    "icons/location_item_3.png",
    "icons/location_item_4.png",
    "icons/location_item_5.png",
    "icons/location_item_6.png"
  ];

  let frame = null;
  let world = null;
  let player = null;
  let mobId = 0;
  let initialized = false;
  let active = false;
  let rafId = null;
  let lastTime = 0;

  const keys = new Set();
  const mobs = new Map();
  const playerPos = {
    x: CONFIG.mapSize / 2,
    y: CONFIG.mapSize / 2
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setupWorld = () => {
    world.style.width = `${CONFIG.mapSize}px`;
    world.style.height = `${CONFIG.mapSize}px`;
  };

  const spawnItems = () => {
    if (world.querySelectorAll(".map-item").length > 0) {
      return;
    }

    const padding = CONFIG.itemSize;
    for (let i = 0; i < CONFIG.itemCount; i += 1) {
      const img = document.createElement("img");
      img.className = "map-item";
      img.src = PLANT_PATHS[Math.floor(Math.random() * PLANT_PATHS.length)];
      img.alt = "";
      const x = padding + Math.random() * (CONFIG.mapSize - padding * 2);
      const y = padding + Math.random() * (CONFIG.mapSize - padding * 2);
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      world.appendChild(img);
    }
  };

  const updatePlayer = () => {
    const offsetX = playerPos.x - CONFIG.playerSize / 2;
    const offsetY = playerPos.y - CONFIG.playerSize / 2;
    player.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  };

  const spawnMob = (mob, position) => {
    if (!world || !mob || !position) {
      return null;
    }

    mobId += 1;
    const id = `mob-${mobId}`;
    const mobEl = document.createElement("img");
    mobEl.className = "mob";
    mobEl.src = mob.sprite;
    mobEl.alt = "";
    mobEl.dataset.mobId = id;
    mobEl.dataset.mobType = mob.id || "mob";
    if (mob.size) {
      mobEl.style.width = `${mob.size}px`;
      mobEl.style.height = `${mob.size}px`;
    }
    mobEl.style.left = `${position.x}px`;
    mobEl.style.top = `${position.y}px`;
    world.appendChild(mobEl);
    mobs.set(id, mobEl);
    return id;
  };

  const clearMobs = () => {
    mobs.forEach((mobEl) => mobEl.remove());
    mobs.clear();
  };

  const updateCamera = () => {
    if (!frame) {
      return;
    }

    const viewWidth = frame.clientWidth;
    const viewHeight = frame.clientHeight;
    const zoom = CONFIG.zoom;
    const halfW = viewWidth / 2;
    const halfH = viewHeight / 2;
    const viewHalfW = halfW / zoom;
    const viewHalfH = halfH / zoom;

    const minX = viewHalfW;
    const maxX = CONFIG.mapSize - viewHalfW;
    const minY = viewHalfH;
    const maxY = CONFIG.mapSize - viewHalfH;

    const camX = minX > maxX ? CONFIG.mapSize / 2 : clamp(playerPos.x, minX, maxX);
    const camY = minY > maxY ? CONFIG.mapSize / 2 : clamp(playerPos.y, minY, maxY);

    const offsetX = halfW - camX * zoom;
    const offsetY = halfH - camY * zoom;
    world.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${zoom})`;
    updatePlayer();
  };

  const updateMovement = (delta) => {
    let axisX = 0;
    let axisY = 0;

    if (keys.has("w") || keys.has("arrowup")) {
      axisY -= 1;
    }
    if (keys.has("s") || keys.has("arrowdown")) {
      axisY += 1;
    }
    if (keys.has("a") || keys.has("arrowleft")) {
      axisX -= 1;
    }
    if (keys.has("d") || keys.has("arrowright")) {
      axisX += 1;
    }

    if (axisX === 0 && axisY === 0) {
      return;
    }

    const length = Math.hypot(axisX, axisY) || 1;
    const velocityX = (axisX / length) * CONFIG.speed * delta;
    const velocityY = (axisY / length) * CONFIG.speed * delta;

    playerPos.x = clamp(
      playerPos.x + velocityX,
      CONFIG.playerSize / 2,
      CONFIG.mapSize - CONFIG.playerSize / 2
    );
    playerPos.y = clamp(
      playerPos.y + velocityY,
      CONFIG.playerSize / 2,
      CONFIG.mapSize - CONFIG.playerSize / 2
    );
  };

  const tick = (timestamp) => {
    if (!active) {
      rafId = null;
      return;
    }

    const delta = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    updateMovement(delta);
    updateCamera();

    rafId = window.requestAnimationFrame(tick);
  };

  const handleKeyDown = (event) => {
    if (!active) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key.startsWith("arrow")) {
      event.preventDefault();
    }
    keys.add(key);
  };

  const handleKeyUp = (event) => {
    if (!active) {
      return;
    }

    const key = event.key.toLowerCase();
    keys.delete(key);
  };

  const init = () => {
    if (initialized) {
      return;
    }

    frame = document.querySelector(".game-frame");
    world = document.querySelector("[data-world]");
    player = document.querySelector("[data-player]");

    if (!frame || !world || !player) {
      return;
    }

    setupWorld();
    spawnItems();
    updateCamera();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", () => keys.clear());
    window.addEventListener("resize", updateCamera);

    initialized = true;
  };

  const start = () => {
    init();
    active = true;
    lastTime = performance.now();
    if (!rafId) {
      rafId = window.requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    active = false;
  };

  window.SCRAPPO_MAP = {
    start,
    stop,
    spawnMob,
    clearMobs,
    getPlayerPosition: () => ({ x: playerPos.x, y: playerPos.y }),
    getMapSize: () => CONFIG.mapSize,
    getPlayerSize: () => CONFIG.playerSize
  };
})();
