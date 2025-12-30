(() => {
  const internal = window.SCRAPPO_MAP_INTERNAL;
  if (!internal) {
    return;
  }

  const { config, state, utils, playerPos, playerConfig, playerState } = internal;
  const { clamp, getExperienceSprites, getGoldSprites } = utils;

  const getRandomExperienceSprite = () => {
    const sprites = getExperienceSprites();
    if (!sprites.length) {
      return "icons/experience.png";
    }
    return sprites[Math.floor(Math.random() * sprites.length)] || sprites[0];
  };

  const getRandomGoldSprite = () => {
    const sprites = getGoldSprites();
    if (!sprites.length) {
      return "icons/gold.png";
    }
    return sprites[Math.floor(Math.random() * sprites.length)] || sprites[0];
  };

  const createExperienceDrop = (value, position) => {
    if (!state.world) {
      return null;
    }
    state.experienceId += 1;
    const id = `xp-${state.experienceId}`;
    const orb = document.createElement("img");
    orb.className = "xp-orb";
    orb.src = getRandomExperienceSprite();
    orb.alt = "";
    const size = config.xpOrbSize;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    orb.style.left = `${position.x}px`;
    orb.style.top = `${position.y}px`;
    state.world.appendChild(orb);
    state.experienceDrops.set(id, {
      id,
      el: orb,
      x: position.x,
      y: position.y,
      value
    });
    return id;
  };

  const createGoldDrop = (value, position) => {
    if (!state.world) {
      return null;
    }
    state.goldId += 1;
    const id = `gold-${state.goldId}`;
    const orb = document.createElement("img");
    orb.className = "gold-orb";
    orb.src = getRandomGoldSprite();
    orb.alt = "";
    const size = config.goldOrbSize;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    orb.style.left = `${position.x}px`;
    orb.style.top = `${position.y}px`;
    state.world.appendChild(orb);
    state.goldDrops.set(id, {
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
    const maxPieces = Math.max(1, config.xpMaxPieces);
    const minPieces = Math.max(1, config.xpMinPieces);
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
      const x = clamp(position.x + Math.cos(angle) * radius, 0, config.mapSize);
      const y = clamp(position.y + Math.sin(angle) * radius, 0, config.mapSize);
      createExperienceDrop(value, { x, y });
    }
  };

  const spawnGoldDrops = (amount, position) => {
    const total = Math.max(0, Math.round(amount));
    if (!total || !position) {
      return;
    }
    const maxPieces = Math.max(1, config.goldMaxPieces);
    const minPieces = Math.max(1, config.goldMinPieces);
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
      const x = clamp(position.x + Math.cos(angle) * radius, 0, config.mapSize);
      const y = clamp(position.y + Math.sin(angle) * radius, 0, config.mapSize);
      createGoldDrop(value, { x, y });
    }
  };

  const clearExperienceDrops = () => {
    state.experienceDrops.forEach((drop) => drop.el.remove());
    state.experienceDrops.clear();
    state.experienceId = 0;
  };

  const clearGoldDrops = () => {
    state.goldDrops.forEach((drop) => drop.el.remove());
    state.goldDrops.clear();
    state.goldId = 0;
  };

  const updateExperienceDrops = (delta) => {
    if (!state.experienceDrops.size) {
      return;
    }

    const radius = playerState.pickupRadius;
    const collectRadius = playerState.collectRadius;
    const minSpeed = playerConfig.xpPullMinSpeed;
    const maxSpeed = playerConfig.xpPullMaxSpeed;
    const halfSize = config.xpOrbSize / 2;

    state.experienceDrops.forEach((drop, id) => {
      const dx = playerPos.x - drop.x;
      const dy = playerPos.y - drop.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= radius) {
        const pull = 1 - distance / radius;
        const speed = minSpeed + pull * (maxSpeed - minSpeed);
        if (distance > 0.5) {
          drop.x = clamp(drop.x + (dx / distance) * speed * delta, halfSize, config.mapSize - halfSize);
          drop.y = clamp(drop.y + (dy / distance) * speed * delta, halfSize, config.mapSize - halfSize);
        }
        drop.el.classList.add("is-attracted");
      } else {
        drop.el.classList.remove("is-attracted");
      }

      drop.el.style.left = `${drop.x}px`;
      drop.el.style.top = `${drop.y}px`;

      if (distance <= collectRadius) {
        if (typeof internal.addPlayerExperience === "function") {
          internal.addPlayerExperience(drop.value);
        }
        drop.el.remove();
        state.experienceDrops.delete(id);
      }
    });
  };

  const updateGoldDrops = (delta) => {
    if (!state.goldDrops.size) {
      return;
    }

    const radius = playerState.pickupRadius;
    const collectRadius = playerState.collectRadius;
    const minSpeed = playerConfig.xpPullMinSpeed;
    const maxSpeed = playerConfig.xpPullMaxSpeed;
    const halfSize = config.goldOrbSize / 2;

    state.goldDrops.forEach((drop, id) => {
      const dx = playerPos.x - drop.x;
      const dy = playerPos.y - drop.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= radius) {
        const pull = 1 - distance / radius;
        const speed = minSpeed + pull * (maxSpeed - minSpeed);
        if (distance > 0.5) {
          drop.x = clamp(drop.x + (dx / distance) * speed * delta, halfSize, config.mapSize - halfSize);
          drop.y = clamp(drop.y + (dy / distance) * speed * delta, halfSize, config.mapSize - halfSize);
        }
        drop.el.classList.add("is-attracted");
      } else {
        drop.el.classList.remove("is-attracted");
      }

      drop.el.style.left = `${drop.x}px`;
      drop.el.style.top = `${drop.y}px`;

      if (distance <= collectRadius) {
        if (typeof internal.addPlayerGold === "function") {
          internal.addPlayerGold(drop.value);
        }
        drop.el.remove();
        state.goldDrops.delete(id);
      }
    });
  };

  internal.spawnExperienceDrops = spawnExperienceDrops;
  internal.spawnGoldDrops = spawnGoldDrops;
  internal.clearExperienceDrops = clearExperienceDrops;
  internal.clearGoldDrops = clearGoldDrops;
  internal.updateExperienceDrops = updateExperienceDrops;
  internal.updateGoldDrops = updateGoldDrops;
})();
