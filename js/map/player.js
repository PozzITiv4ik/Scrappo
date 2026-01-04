(() => {
  const internal = window.SCRAPPO_MAP_INTERNAL;
  if (!internal) {
    return;
  }

  const { playerApi, playerConfig, playerState, playerPos, config, state, utils } = internal;
  const { clamp } = utils;

  const updatePlayer = () => {
    if (!state.player) {
      return;
    }
    const offsetX = playerPos.x - playerConfig.size / 2;
    const offsetY = playerPos.y - playerConfig.size / 2;
    state.player.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  };

  const spawnPlayerDamageNumber = (amount) => {
    if (!state.world) {
      return;
    }
    const label = document.createElement("div");
    label.className = "damage-number damage-number--player";
    label.textContent = `-${amount}`;
    label.style.left = `${playerPos.x}px`;
    label.style.top = `${playerPos.y - 20}px`;
    label.addEventListener("animationend", () => label.remove());
    state.world.appendChild(label);
  };

  const updatePlayerHealthUI = () => {
    if (!state.hpBar || !state.hpText) {
      return;
    }
    const ratio = playerState.maxHp > 0 ? playerState.hp / playerState.maxHp : 0;
    state.hpBar.style.width = `${Math.max(0, ratio) * 100}%`;
    state.hpText.textContent = `${Math.max(0, Math.round(playerState.hp))}/${playerState.maxHp}`;
  };

  const updatePlayerXpUI = () => {
    if (!state.xpBar || !state.xpText) {
      return;
    }
    const ratio = playerState.xpToNext > 0 ? playerState.xp / playerState.xpToNext : 0;
    state.xpBar.style.width = `${Math.max(0, ratio) * 100}%`;
    const remaining = Math.max(0, Math.ceil(playerState.xpToNext - playerState.xp));
    state.xpText.textContent = `LV ${playerState.level} - ${remaining} XP`;
  };

  const updatePlayerGoldUI = () => {
    if (!state.goldText) {
      return;
    }
    state.goldText.textContent = `${Math.max(0, Math.floor(playerState.gold))}`;
  };

  const refreshPlayerHud = () => {
    updatePlayerHealthUI();
    updatePlayerXpUI();
    updatePlayerGoldUI();
  };

  const addPlayerGold = (amount) => {
    const stats = internal.getPlayerStats();
    const scaledAmount = amount * (stats.goldGainMultiplier || 1);
    const gained = Math.max(0, Math.round(scaledAmount));
    if (!gained) {
      return;
    }
    playerState.gold += gained;
    updatePlayerGoldUI();
  };

  const grantPlayerGold = (amount) => {
    const gained = Math.max(0, Math.round(amount));
    if (!gained) {
      return;
    }
    playerState.gold += gained;
    updatePlayerGoldUI();
  };

  const getPlayerGold = () => Math.max(0, Math.floor(playerState.gold));

  const spendPlayerGold = (amount) => {
    const cost = Math.max(0, Math.round(amount));
    if (!cost) {
      return true;
    }
    if (playerState.gold < cost) {
      return false;
    }
    playerState.gold -= cost;
    updatePlayerGoldUI();
    return true;
  };

  const addPlayerExperience = (amount) => {
    const stats = internal.getPlayerStats();
    const scaledAmount = amount * (stats.xpGainMultiplier || 1);
    const gained = Math.max(0, Math.round(scaledAmount));
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
        const abilityApi = internal.getAbilityApi();
        if (abilityApi && typeof abilityApi.onLevelUp === "function") {
          abilityApi.onLevelUp();
        }
      } else {
        playerState.xp += remaining;
        remaining = 0;
      }
    }
    updatePlayerXpUI();
  };

  const resetPlayerState = () => {
    const abilityApi = internal.getAbilityApi();
    if (abilityApi && typeof abilityApi.resetForNewRun === "function") {
      abilityApi.resetForNewRun();
    } else if (typeof playerApi.resetState === "function") {
      playerApi.resetState();
    }
    if (abilityApi && typeof abilityApi.applyPlayerStats === "function") {
      abilityApi.applyPlayerStats();
    }
    playerPos.x = config.mapSize / 2;
    playerPos.y = config.mapSize / 2;
    playerState.hp = playerState.maxHp;
    refreshPlayerHud();
    if (state.player) {
      state.player.classList.remove("is-moving");
    }
  };

  const prepareNextWave = () => {
    const abilityApi = internal.getAbilityApi();
    if (abilityApi && typeof abilityApi.applyPlayerStats === "function") {
      abilityApi.applyPlayerStats();
    }
    playerPos.x = config.mapSize / 2;
    playerPos.y = config.mapSize / 2;
    playerState.hp = playerState.maxHp;
    playerState.invulnerableUntil = 0;
    refreshPlayerHud();
    state.keys.clear();
    if (state.player) {
      state.player.classList.remove("is-moving");
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

  const updateMovement = (delta) => {
    let axisX = 0;
    let axisY = 0;

    if (state.keys.has("w") || state.keys.has("arrowup")) {
      axisY -= 1;
    }
    if (state.keys.has("s") || state.keys.has("arrowdown")) {
      axisY += 1;
    }
    if (state.keys.has("a") || state.keys.has("arrowleft")) {
      axisX -= 1;
    }
    if (state.keys.has("d") || state.keys.has("arrowright")) {
      axisX += 1;
    }

    const isMoving = axisX !== 0 || axisY !== 0;
    if (state.player) {
      state.player.classList.toggle("is-moving", isMoving);
    }

    if (!isMoving) {
      return;
    }

    const length = Math.hypot(axisX, axisY) || 1;
    const stats = internal.getPlayerStats();
    const moveSpeed = stats.speed || playerConfig.speed;
    const velocityX = (axisX / length) * moveSpeed * delta;
    const velocityY = (axisY / length) * moveSpeed * delta;

    playerPos.x = clamp(
      playerPos.x + velocityX,
      playerConfig.size / 2,
      config.mapSize - playerConfig.size / 2
    );
    playerPos.y = clamp(
      playerPos.y + velocityY,
      playerConfig.size / 2,
      config.mapSize - playerConfig.size / 2
    );
  };

  internal.updatePlayer = updatePlayer;
  internal.spawnPlayerDamageNumber = spawnPlayerDamageNumber;
  internal.updatePlayerHealthUI = updatePlayerHealthUI;
  internal.updatePlayerXpUI = updatePlayerXpUI;
  internal.updatePlayerGoldUI = updatePlayerGoldUI;
  internal.refreshPlayerHud = refreshPlayerHud;
  internal.addPlayerGold = addPlayerGold;
  internal.grantPlayerGold = grantPlayerGold;
  internal.getPlayerGold = getPlayerGold;
  internal.spendPlayerGold = spendPlayerGold;
  internal.addPlayerExperience = addPlayerExperience;
  internal.resetPlayerState = resetPlayerState;
  internal.prepareNextWave = prepareNextWave;
  internal.applyPlayerDamage = applyPlayerDamage;
  internal.updateMovement = updateMovement;
})();
