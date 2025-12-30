(() => {
  const playerApi = window.SCRAPPO_PLAYER;
  if (!playerApi || !playerApi.config || !playerApi.state) {
    return;
  }
  const playerConfig = playerApi.config;
  const playerState = playerApi.state;

  const CONFIG = {
    mapSize: 1400,
    itemSize: 28,
    itemCount: 14,
    mobSpeed: 90,
    zoom: 2.5,
    xpOrbSize: 18,
    xpMinPieces: 3,
    xpMaxPieces: 6
  };

  const PLANT_PATHS = [
    "icons/location_item_1.png",
    "icons/location_item_2.png",
    "icons/location_item_3.png",
    "icons/location_item_4.png",
    "icons/location_item_5.png",
    "icons/location_item_6.png"
  ];

  const EXPERIENCE_SPRITES = [
    "icons/experience.png",
    "icons/experience.png",
    "icons/experience.png"
  ];

  let frame = null;
  let world = null;
  let player = null;
  let hpBar = null;
  let hpText = null;
  let xpBar = null;
  let xpText = null;
  let mobId = 0;
  let experienceId = 0;
  let initialized = false;
  let active = false;
  let rafId = null;
  let lastTime = 0;

  const keys = new Set();
  const mobs = new Map();
  const experienceDrops = new Map();
  if (!playerState.position) {
    playerState.position = { x: CONFIG.mapSize / 2, y: CONFIG.mapSize / 2 };
  }
  const playerPos = playerState.position;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const getExperienceSprites = () => window.SCRAPPO_EXPERIENCE_SPRITES || EXPERIENCE_SPRITES;

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

  const getRandomExperienceSprite = () => {
    const sprites = getExperienceSprites();
    if (!sprites.length) {
      return "icons/experience.png";
    }
    return sprites[Math.floor(Math.random() * sprites.length)] || sprites[0];
  };

  const createExperienceDrop = (value, position) => {
    if (!world) {
      return null;
    }
    experienceId += 1;
    const id = `xp-${experienceId}`;
    const orb = document.createElement("img");
    orb.className = "xp-orb";
    orb.src = getRandomExperienceSprite();
    orb.alt = "";
    const size = CONFIG.xpOrbSize;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    orb.style.left = `${position.x}px`;
    orb.style.top = `${position.y}px`;
    world.appendChild(orb);
    experienceDrops.set(id, {
      id,
      el: orb,
      x: position.x,
      y: position.y,
      value
    });
    return id;
  };

  const spawnExperienceDrops = (amount, position) => {
    const total = Math.max(0, Math.round(amount));
    if (!total || !position) {
      return;
    }
    const maxPieces = Math.max(1, CONFIG.xpMaxPieces);
    const minPieces = Math.max(1, CONFIG.xpMinPieces);
    const desiredPieces = Math.max(minPieces, Math.round(total / 6));
    const pieces = Math.min(maxPieces, desiredPieces, total);
    const baseValue = Math.floor(total / pieces);
    let remainder = total - baseValue * pieces;

    for (let i = 0; i < pieces; i += 1) {
      const value = baseValue + (remainder > 0 ? 1 : 0);
      if (remainder > 0) {
        remainder -= 1;
      }
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 16;
      const x = clamp(position.x + Math.cos(angle) * radius, 0, CONFIG.mapSize);
      const y = clamp(position.y + Math.sin(angle) * radius, 0, CONFIG.mapSize);
      createExperienceDrop(value, { x, y });
    }
  };

  const clearExperienceDrops = () => {
    experienceDrops.forEach((drop) => drop.el.remove());
    experienceDrops.clear();
    experienceId = 0;
  };

  const updatePlayer = () => {
    const offsetX = playerPos.x - playerConfig.size / 2;
    const offsetY = playerPos.y - playerConfig.size / 2;
    player.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  };

  const spawnPlayerDamageNumber = (amount) => {
    if (!world) {
      return;
    }
    const label = document.createElement("div");
    label.className = "damage-number damage-number--player";
    label.textContent = `-${amount}`;
    label.style.left = `${playerPos.x}px`;
    label.style.top = `${playerPos.y - 20}px`;
    label.addEventListener("animationend", () => label.remove());
    world.appendChild(label);
  };

  const updatePlayerHealthUI = () => {
    if (!hpBar || !hpText) {
      return;
    }
    const ratio = playerState.maxHp > 0 ? playerState.hp / playerState.maxHp : 0;
    hpBar.style.width = `${Math.max(0, ratio) * 100}%`;
    hpText.textContent = `${Math.max(0, Math.round(playerState.hp))}/${playerState.maxHp}`;
  };

  const updatePlayerXpUI = () => {
    if (!xpBar || !xpText) {
      return;
    }
    const ratio = playerState.xpToNext > 0 ? playerState.xp / playerState.xpToNext : 0;
    xpBar.style.width = `${Math.max(0, ratio) * 100}%`;
    const remaining = Math.max(0, Math.ceil(playerState.xpToNext - playerState.xp));
    xpText.textContent = `LV ${playerState.level} - ${remaining} XP`;
  };

  const addPlayerExperience = (amount) => {
    const gained = Math.max(0, Math.round(amount));
    if (!gained) {
      return;
    }
    let remaining = gained;
    while (remaining > 0) {
      const needed = playerState.xpToNext - playerState.xp;
      if (remaining >= needed) {
        playerState.level += 1;
        remaining -= needed;
        playerState.xp = 0;
        playerState.xpToNext = playerApi.getXpForLevel(playerState.level);
      } else {
        playerState.xp += remaining;
        remaining = 0;
      }
    }
    updatePlayerXpUI();
  };

  const resetPlayerState = () => {
    if (typeof playerApi.resetState === "function") {
      playerApi.resetState();
    }
    playerPos.x = CONFIG.mapSize / 2;
    playerPos.y = CONFIG.mapSize / 2;
    updatePlayerHealthUI();
    updatePlayerXpUI();
    if (player) {
      player.classList.remove("is-moving");
    }
  };

  const applyPlayerDamage = (amount, now) => {
    if (amount <= 0) {
      return;
    }
    if (now < playerState.invulnerableUntil) {
      return;
    }
    playerState.hp = Math.max(0, playerState.hp - amount);
    playerState.invulnerableUntil = now + playerConfig.invulnerableMs;
    updatePlayerHealthUI();
    spawnPlayerDamageNumber(amount);
    if (window.SCRAPPO_SOUND && typeof window.SCRAPPO_SOUND.playPlayerHit === "function") {
      window.SCRAPPO_SOUND.playPlayerHit();
    }
  };

  const spawnMob = (mob, position) => {
    if (!world || !mob || !position) {
      return null;
    }

    mobId += 1;
    const id = `mob-${mobId}`;
    const mobEl = document.createElement("div");
    mobEl.className = "mob";
    mobEl.dataset.mobId = id;
    mobEl.dataset.mobType = mob.id || "mob";
    const size = typeof mob.size === "number" ? mob.size : playerConfig.size;
    mobEl.style.width = `${size}px`;
    mobEl.style.height = `${size}px`;
    mobEl.style.left = `${position.x}px`;
    mobEl.style.top = `${position.y}px`;

    const hpTrack = document.createElement("div");
    hpTrack.className = "mob-hp";
    const hpBar = document.createElement("div");
    hpBar.className = "mob-hp-bar";
    hpTrack.appendChild(hpBar);

    const sprite = document.createElement("img");
    sprite.className = "mob-sprite";
    sprite.src = mob.sprite;
    sprite.alt = "";

    mobEl.appendChild(hpTrack);
    mobEl.appendChild(sprite);
    world.appendChild(mobEl);
    const maxHp = typeof mob.hp === "number" ? mob.hp : 10;
    hpBar.style.width = "100%";
    mobs.set(id, {
      el: mobEl,
      x: position.x,
      y: position.y,
      size,
      speed: typeof mob.speed === "number" ? mob.speed : CONFIG.mobSpeed,
      damage: typeof mob.damage === "number" ? mob.damage : 5,
      experience: typeof mob.experience === "number" ? mob.experience : 0,
      hp: maxHp,
      maxHp,
      hpBar
    });
    return id;
  };

  const clearMobs = () => {
    mobs.forEach((mobData) => mobData.el.remove());
    mobs.clear();
  };

  const getMobTargets = () => Array.from(mobs.entries()).map(([id, mob]) => ({
    id,
    x: mob.x,
    y: mob.y,
    size: mob.size,
    hp: mob.hp,
    maxHp: mob.maxHp
  }));

  const applyDamage = (id, amount) => {
    const mob = mobs.get(id);
    if (!mob) {
      return null;
    }

    const nextHp = Math.max(0, mob.hp - amount);
    mob.hp = nextHp;
    if (mob.hpBar) {
      const ratio = mob.maxHp > 0 ? nextHp / mob.maxHp : 0;
      mob.hpBar.style.width = `${Math.max(0, ratio) * 100}%`;
    }

    const position = { x: mob.x, y: mob.y };
    if (nextHp <= 0) {
      mob.el.remove();
      mobs.delete(id);
      if (mob.experience) {
        spawnExperienceDrops(mob.experience, position);
      }
    }

    return {
      hp: nextHp,
      position
    };
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

    const isMoving = axisX !== 0 || axisY !== 0;
    if (player) {
      player.classList.toggle("is-moving", isMoving);
    }

    if (!isMoving) {
      return;
    }

    const length = Math.hypot(axisX, axisY) || 1;
    const velocityX = (axisX / length) * playerConfig.speed * delta;
    const velocityY = (axisY / length) * playerConfig.speed * delta;

    playerPos.x = clamp(
      playerPos.x + velocityX,
      playerConfig.size / 2,
      CONFIG.mapSize - playerConfig.size / 2
    );
    playerPos.y = clamp(
      playerPos.y + velocityY,
      playerConfig.size / 2,
      CONFIG.mapSize - playerConfig.size / 2
    );
  };

  const updateMobs = (delta, now) => {
    if (!mobs.size) {
      return;
    }

    const current = typeof now === "number" ? now : performance.now();
    const playerRadius = playerConfig.size / 2;
    let hitApplied = false;

    mobs.forEach((mob) => {
      const dx = playerPos.x - mob.x;
      const dy = playerPos.y - mob.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= 1) {
        const step = Math.min(mob.speed * delta, distance);
        const nextX = mob.x + (dx / distance) * step;
        const nextY = mob.y + (dy / distance) * step;
        const halfSize = mob.size / 2;
        mob.x = clamp(nextX, halfSize, CONFIG.mapSize - halfSize);
        mob.y = clamp(nextY, halfSize, CONFIG.mapSize - halfSize);
        mob.el.style.left = `${mob.x}px`;
        mob.el.style.top = `${mob.y}px`;
      }

      if (!hitApplied && current >= playerState.invulnerableUntil) {
        const hitDistance = playerRadius + mob.size / 2;
        const hitDx = playerPos.x - mob.x;
        const hitDy = playerPos.y - mob.y;
        if (Math.hypot(hitDx, hitDy) <= hitDistance) {
          applyPlayerDamage(mob.damage, current);
          hitApplied = true;
        }
      }
    });
  };

  const updateExperienceDrops = (delta) => {
    if (!experienceDrops.size) {
      return;
    }

    const radius = playerState.pickupRadius;
    const collectRadius = playerState.collectRadius;
    const minSpeed = playerConfig.xpPullMinSpeed;
    const maxSpeed = playerConfig.xpPullMaxSpeed;
    const halfSize = CONFIG.xpOrbSize / 2;

    experienceDrops.forEach((drop, id) => {
      const dx = playerPos.x - drop.x;
      const dy = playerPos.y - drop.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= radius) {
        const pull = 1 - distance / radius;
        const speed = minSpeed + pull * (maxSpeed - minSpeed);
        if (distance > 0.5) {
          drop.x = clamp(drop.x + (dx / distance) * speed * delta, halfSize, CONFIG.mapSize - halfSize);
          drop.y = clamp(drop.y + (dy / distance) * speed * delta, halfSize, CONFIG.mapSize - halfSize);
        }
        drop.el.classList.add("is-attracted");
      } else {
        drop.el.classList.remove("is-attracted");
      }

      drop.el.style.left = `${drop.x}px`;
      drop.el.style.top = `${drop.y}px`;

      if (distance <= collectRadius) {
        addPlayerExperience(drop.value);
        drop.el.remove();
        experienceDrops.delete(id);
      }
    });
  };

  const tick = (timestamp) => {
    if (!active) {
      rafId = null;
      return;
    }

    const delta = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    updateMovement(delta);
    updateMobs(delta, timestamp);
    updateExperienceDrops(delta);
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
    hpBar = document.querySelector("[data-player-hp-bar]");
    hpText = document.querySelector("[data-player-hp-text]");
    xpBar = document.querySelector("[data-player-xp-bar]");
    xpText = document.querySelector("[data-player-xp-text]");

    if (!frame || !world || !player) {
      return;
    }

    player.style.width = `${playerConfig.size}px`;
    player.style.height = `${playerConfig.size}px`;
    player.style.setProperty("--player-size", `${playerConfig.size}px`);

    setupWorld();
    spawnItems();
    updateCamera();
    updatePlayerHealthUI();
    updatePlayerXpUI();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", () => keys.clear());
    window.addEventListener("resize", updateCamera);

    initialized = true;
  };

  const start = () => {
    init();
    resetPlayerState();
    clearExperienceDrops();
    keys.clear();
    active = true;
    lastTime = performance.now();
    if (!rafId) {
      rafId = window.requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    active = false;
    keys.clear();
    clearExperienceDrops();
    if (player) {
      player.classList.remove("is-moving");
    }
  };

  window.SCRAPPO_MAP = {
    start,
    stop,
    spawnMob,
    clearMobs,
    getMobTargets,
    applyDamage,
    getPlayerPosition: () => ({ x: playerPos.x, y: playerPos.y }),
    getMapSize: () => CONFIG.mapSize,
    getPlayerSize: () => playerConfig.size,
    getZoom: () => CONFIG.zoom
  };
})();
