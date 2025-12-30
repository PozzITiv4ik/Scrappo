(() => {
  const abilities = Array.isArray(window.SCRAPPO_ABILITIES) ? window.SCRAPPO_ABILITIES : [];
  const abilityById = new Map(abilities.map((ability) => [ability.id, ability]));
  const rarityWeightsByWave = {
    1: { common: 1, rare: 0 },
    2: { common: 0.95, rare: 0.05 }
  };

  let pendingSelections = 0;
  let flowState = "playing";
  let activeWave = 1;
  let hasNextWave = true;
  let modifiersCache = null;
  const inventory = new Map();

  let overlayAbilities = null;
  let overlayInventory = null;
  let overlayPause = null;
  let abilityChoicesEl = null;
  let abilitiesSubtitleEl = null;
  let inventoryAbilitiesEl = null;
  let inventoryStatsEl = null;
  let inventoryContinueBtn = null;
  let inventoryCloseBtn = null;

  const getPlayerApi = () => window.SCRAPPO_PLAYER;
  const getMapApi = () => window.SCRAPPO_MAP;
  const getWaveApi = () => window.SCRAPPO_WAVE_SYSTEM;
  const getWeaponApi = () => window.SCRAPPO_WEAPON_SYSTEM;
  const getUiApi = () => window.SCRAPPO_UI;

  const getDictionary = () => {
    const lang = document.documentElement.lang || "en";
    const i18n = window.SCRAPPO_I18N || {};
    return i18n[lang] || i18n.en || {};
  };

  const t = (key, fallback = "") => {
    const dictionary = getDictionary();
    return dictionary[key] || fallback || key;
  };

  const getAbilityText = (ability, field) => {
    const lang = document.documentElement.lang || "en";
    const entry = ability[field] || {};
    return entry[lang] || entry.en || "";
  };

  const getRarityLabel = (rarity) => t(`rarity.${rarity}`, rarity);

  const openOverlay = (overlay) => {
    if (!overlay) {
      return;
    }
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
  };

  const closeOverlay = (overlay) => {
    if (!overlay) {
      return;
    }
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
  };

  const closeAllOverlays = () => {
    closeOverlay(overlayAbilities);
    closeOverlay(overlayInventory);
    closeOverlay(overlayPause);
  };

  const isGameActive = () => document.body.classList.contains("is-game");
  const isOverlayOpen = (overlay) => overlay && overlay.classList.contains("is-active");

  const getRarityWeights = (wave) => rarityWeightsByWave[wave] || rarityWeightsByWave[2];

  const getModifiers = () => {
    if (modifiersCache) {
      return modifiersCache;
    }
    const modifiers = {
      maxHpFlat: 0,
      maxHpPct: 0,
      moveSpeedPct: 0,
      damageFlat: 0,
      damagePct: 0,
      fireRatePct: 0,
      pickupRadiusFlat: 0,
      xpGainPct: 0,
      goldGainPct: 0
    };

    inventory.forEach((count, id) => {
      const ability = abilityById.get(id);
      if (!ability || !Array.isArray(ability.effects)) {
        return;
      }
      ability.effects.forEach((effect) => {
        const value = (typeof effect.value === "number" ? effect.value : 0) * count;
        if (!value) {
          return;
        }
        if (effect.stat === "maxHp") {
          if (effect.type === "percent") {
            modifiers.maxHpPct += value;
          } else {
            modifiers.maxHpFlat += value;
          }
        } else if (effect.stat === "moveSpeed" && effect.type === "percent") {
          modifiers.moveSpeedPct += value;
        } else if (effect.stat === "damage") {
          if (effect.type === "percent") {
            modifiers.damagePct += value;
          } else {
            modifiers.damageFlat += value;
          }
        } else if (effect.stat === "fireRate" && effect.type === "percent") {
          modifiers.fireRatePct += value;
        } else if (effect.stat === "pickupRadius" && effect.type !== "percent") {
          modifiers.pickupRadiusFlat += value;
        } else if (effect.stat === "xpGain" && effect.type === "percent") {
          modifiers.xpGainPct += value;
        } else if (effect.stat === "goldGain" && effect.type === "percent") {
          modifiers.goldGainPct += value;
        }
      });
    });

    modifiersCache = modifiers;
    return modifiers;
  };

  const invalidateModifiers = () => {
    modifiersCache = null;
  };

  const getPlayerStats = () => {
    const playerApi = getPlayerApi();
    const base = playerApi ? playerApi.config : null;
    const mods = getModifiers();
    const maxHpBase = base ? base.maxHp : 100;
    const maxHp = Math.max(1, Math.round(maxHpBase * (1 + mods.maxHpPct) + mods.maxHpFlat));
    const speed = base ? base.speed * (1 + mods.moveSpeedPct) : 0;
    const pickupRadius = base ? base.pickupRadius + mods.pickupRadiusFlat : 0;
    const collectRadius = base ? base.collectRadius : 0;
    return {
      maxHp,
      speed,
      pickupRadius,
      collectRadius,
      xpGainMultiplier: 1 + mods.xpGainPct,
      goldGainMultiplier: 1 + mods.goldGainPct
    };
  };

  const getCombatModifiers = () => {
    const mods = getModifiers();
    return {
      damageFlat: mods.damageFlat,
      damageMultiplier: 1 + mods.damagePct,
      fireRateMultiplier: 1 + mods.fireRatePct
    };
  };

  const applyPlayerStats = () => {
    const playerApi = getPlayerApi();
    if (!playerApi || !playerApi.state) {
      return;
    }
    const stats = getPlayerStats();
    playerApi.state.maxHp = stats.maxHp;
    playerApi.state.pickupRadius = stats.pickupRadius;
    playerApi.state.collectRadius = stats.collectRadius;
    if (playerApi.state.hp > playerApi.state.maxHp) {
      playerApi.state.hp = playerApi.state.maxHp;
    }
    const mapApi = getMapApi();
    if (mapApi && typeof mapApi.refreshPlayerHud === "function") {
      mapApi.refreshPlayerHud();
    }
  };

  const addToInventory = (abilityId) => {
    if (!abilityById.has(abilityId)) {
      return;
    }
    const current = inventory.get(abilityId) || 0;
    inventory.set(abilityId, current + 1);
    invalidateModifiers();
    applyPlayerStats();
  };

  const clearInventory = () => {
    inventory.clear();
    invalidateModifiers();
  };

  const rollRarity = (weights) => {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
    let roll = Math.random() * total;
    for (const [rarity, value] of entries) {
      if (roll <= value) {
        return rarity;
      }
      roll -= value;
    }
    return entries[0][0];
  };

  const getRandomChoices = (count) => {
    const weights = getRarityWeights(activeWave);
    const choices = [];
    const used = new Set();
    for (let i = 0; i < count; i += 1) {
      const rarity = rollRarity(weights);
      let pool = abilities.filter((ability) => ability.rarity === rarity && !used.has(ability.id));
      if (!pool.length) {
        pool = abilities.filter((ability) => !used.has(ability.id));
      }
      if (!pool.length) {
        break;
      }
      const choice = pool[Math.floor(Math.random() * pool.length)];
      used.add(choice.id);
      choices.push(choice);
    }
    return choices;
  };

  const formatPercent = (value) => `${Math.round(value * 100)}%`;
  const formatBonus = (flat, percent) => {
    if (!flat && !percent) {
      return "0";
    }
    const parts = [];
    if (flat) {
      parts.push(`${flat > 0 ? "+" : ""}${flat}`);
    }
    if (percent) {
      parts.push(`${percent > 0 ? "+" : ""}${Math.round(percent * 100)}%`);
    }
    return parts.join(", ");
  };

  const renderInventory = () => {
    if (!inventoryAbilitiesEl || !inventoryStatsEl) {
      return;
    }
    inventoryAbilitiesEl.innerHTML = "";
    inventoryStatsEl.innerHTML = "";

    if (!inventory.size) {
      const empty = document.createElement("div");
      empty.className = "ability-item";
      empty.textContent = t("inventory.empty", "Empty");
      inventoryAbilitiesEl.appendChild(empty);
    } else {
      inventory.forEach((count, id) => {
        const ability = abilityById.get(id);
        if (!ability) {
          return;
        }
        const item = document.createElement("div");
        item.className = "ability-item";
        item.textContent = getAbilityText(ability, "name");
        item.title = getAbilityText(ability, "description");
        if (count > 1) {
          const stack = document.createElement("div");
          stack.className = "ability-stack";
          stack.textContent = `${count}x`;
          item.appendChild(stack);
        }
        inventoryAbilitiesEl.appendChild(item);
      });
    }

    const playerStats = getPlayerStats();
    const combat = getCombatModifiers();
    const rows = [
      { key: "stats.maxHp", value: `${Math.round(playerStats.maxHp)}` },
      { key: "stats.moveSpeed", value: `${Math.round(playerStats.speed)}` },
      { key: "stats.damage", value: formatBonus(combat.damageFlat, combat.damageMultiplier - 1) },
      { key: "stats.fireRate", value: formatPercent(combat.fireRateMultiplier - 1) },
      { key: "stats.pickupRadius", value: `${Math.round(playerStats.pickupRadius)}` },
      { key: "stats.xpGain", value: formatPercent(playerStats.xpGainMultiplier - 1) },
      { key: "stats.goldGain", value: formatPercent(playerStats.goldGainMultiplier - 1) }
    ];

    rows.forEach((row) => {
      const line = document.createElement("div");
      line.className = "stats-row";
      const label = document.createElement("span");
      label.textContent = t(row.key, row.key);
      const value = document.createElement("span");
      value.className = "stats-value";
      value.textContent = row.value;
      line.appendChild(label);
      line.appendChild(value);
      inventoryStatsEl.appendChild(line);
    });
  };

  const renderAbilityChoices = () => {
    if (!abilityChoicesEl) {
      return;
    }
    abilityChoicesEl.innerHTML = "";
    const choices = getRandomChoices(3);
    choices.forEach((ability) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "ability-card";
      card.dataset.abilityId = ability.id;
      const rarity = document.createElement("div");
      rarity.className = `ability-card__rarity ability-card__rarity--${ability.rarity}`;
      rarity.textContent = getRarityLabel(ability.rarity);
      const name = document.createElement("div");
      name.className = "ability-card__name";
      name.textContent = getAbilityText(ability, "name");
      const desc = document.createElement("div");
      desc.className = "ability-card__desc";
      desc.textContent = getAbilityText(ability, "description");
      card.appendChild(rarity);
      card.appendChild(name);
      card.appendChild(desc);
      abilityChoicesEl.appendChild(card);
    });
  };

  const updateAbilitiesSubtitle = () => {
    if (!abilitiesSubtitleEl) {
      return;
    }
    const remaining = Math.max(0, pendingSelections);
    abilitiesSubtitleEl.textContent = remaining
      ? `${t("abilities.remaining", "Choices left")}: ${remaining}`
      : "";
  };

  const openAbilitySelection = () => {
    renderAbilityChoices();
    updateAbilitiesSubtitle();
    closeOverlay(overlayInventory);
    closeOverlay(overlayPause);
    openOverlay(overlayAbilities);
  };

  const openInventory = (mode) => {
    renderInventory();
    closeOverlay(overlayAbilities);
    closeOverlay(overlayPause);
    openOverlay(overlayInventory);

    if (inventoryContinueBtn) {
      inventoryContinueBtn.dataset.mode = mode;
      if (mode === "wave") {
        inventoryContinueBtn.textContent = hasNextWave
          ? t("inventory.continue", "Start Next Wave")
          : t("pause.exit", "Main Menu");
      } else {
        inventoryContinueBtn.textContent = t("pause.resume", "Resume");
      }
      inventoryContinueBtn.disabled = false;
    }

    if (inventoryCloseBtn) {
      const shouldHide = mode === "wave";
      inventoryCloseBtn.style.display = shouldHide ? "none" : "inline-flex";
    }
  };

  const openPauseMenu = () => {
    closeOverlay(overlayInventory);
    closeOverlay(overlayAbilities);
    openOverlay(overlayPause);
  };

  const pauseGame = (showPauseOverlay = true) => {
    const mapApi = getMapApi();
    const waveApi = getWaveApi();
    const weaponApi = getWeaponApi();
    if (mapApi && typeof mapApi.pause === "function") {
      mapApi.pause();
    }
    if (waveApi && typeof waveApi.pause === "function") {
      waveApi.pause();
    }
    if (weaponApi && typeof weaponApi.pause === "function") {
      weaponApi.pause();
    }
    if (showPauseOverlay) {
      openPauseMenu();
    }
  };

  const resumeGame = () => {
    const mapApi = getMapApi();
    const waveApi = getWaveApi();
    const weaponApi = getWeaponApi();
    if (mapApi && typeof mapApi.resume === "function") {
      mapApi.resume();
    }
    if (waveApi && typeof waveApi.resume === "function") {
      waveApi.resume();
    }
    if (weaponApi && typeof weaponApi.resume === "function") {
      weaponApi.resume();
    }
    closeAllOverlays();
    flowState = "playing";
  };

  const startNextWave = () => {
    if (!hasNextWave) {
      const ui = getUiApi();
      if (ui && typeof ui.showPanel === "function") {
        ui.showPanel("main");
      }
      return;
    }
    const mapApi = getMapApi();
    const waveApi = getWaveApi();
    const weaponApi = getWeaponApi();
    if (mapApi && typeof mapApi.prepareNextWave === "function") {
      mapApi.prepareNextWave();
    }
    if (waveApi && typeof waveApi.startNextWave === "function") {
      waveApi.startNextWave();
    }
    if (mapApi && typeof mapApi.resume === "function") {
      mapApi.resume();
    }
    if (weaponApi && typeof weaponApi.resume === "function") {
      weaponApi.resume();
    }
    closeAllOverlays();
    flowState = "playing";
  };

  const handleAbilityPick = (abilityId) => {
    addToInventory(abilityId);
    pendingSelections = Math.max(0, pendingSelections - 1);
    if (pendingSelections > 0) {
      openAbilitySelection();
    } else {
      openInventory("wave");
    }
  };

  const handleWaveComplete = ({ waveIndex, hasNext }) => {
    activeWave = waveIndex || 1;
    hasNextWave = hasNext;
    flowState = "wave-end";
    pauseGame(false);
    if (pendingSelections > 0) {
      openAbilitySelection();
    } else {
      openInventory("wave");
    }
  };

  const onLevelUp = () => {
    pendingSelections += 1;
  };

  const resetForNewRun = () => {
    const playerApi = getPlayerApi();
    clearInventory();
    pendingSelections = 0;
    flowState = "playing";
    closeAllOverlays();
    if (playerApi && typeof playerApi.resetState === "function") {
      playerApi.resetState();
    }
    applyPlayerStats();
    renderInventory();
  };

  const refreshTexts = () => {
    renderInventory();
    if (isOverlayOpen(overlayAbilities)) {
      renderAbilityChoices();
      updateAbilitiesSubtitle();
    }
    if (isOverlayOpen(overlayInventory)) {
      const mode = inventoryContinueBtn?.dataset.mode || "pause";
      if (inventoryContinueBtn) {
        if (mode === "wave") {
          inventoryContinueBtn.textContent = hasNextWave
            ? t("inventory.continue", "Start Next Wave")
            : t("pause.exit", "Main Menu");
        } else {
          inventoryContinueBtn.textContent = t("pause.resume", "Resume");
        }
      }
    }
  };

  const handleEsc = () => {
    if (!isGameActive()) {
      return;
    }
    if (isOverlayOpen(overlayAbilities)) {
      return;
    }
    if (flowState === "wave-end") {
      return;
    }
    if (isOverlayOpen(overlayInventory)) {
      openPauseMenu();
      return;
    }
    if (isOverlayOpen(overlayPause)) {
      resumeGame();
      return;
    }
    flowState = "pause";
    pauseGame(true);
  };

  const init = () => {
    overlayAbilities = document.querySelector('[data-overlay="abilities"]');
    overlayInventory = document.querySelector('[data-overlay="inventory"]');
    overlayPause = document.querySelector('[data-overlay="pause"]');
    abilityChoicesEl = document.querySelector("[data-ability-choices]");
    abilitiesSubtitleEl = document.querySelector("[data-abilities-subtitle]");
    inventoryAbilitiesEl = document.querySelector("[data-inventory-abilities]");
    inventoryStatsEl = document.querySelector("[data-inventory-stats]");
    inventoryContinueBtn = document.querySelector('[data-action="inventory-continue"]');
    inventoryCloseBtn = document.querySelector('[data-action="inventory-close"]');

    document.addEventListener("click", (event) => {
      const abilityCard = event.target.closest(".ability-card");
      if (abilityCard && abilityCard.dataset.abilityId) {
        handleAbilityPick(abilityCard.dataset.abilityId);
        return;
      }
      const action = event.target.closest("[data-action]");
      if (!action) {
        return;
      }
      const name = action.dataset.action;
      if (name === "pause-resume") {
        resumeGame();
      } else if (name === "pause-inventory") {
        openInventory("pause");
      } else if (name === "pause-exit") {
        const ui = getUiApi();
        if (ui && typeof ui.showPanel === "function") {
          ui.showPanel("main");
        }
      } else if (name === "inventory-continue") {
        const mode = inventoryContinueBtn?.dataset.mode || "pause";
        if (mode === "wave") {
          startNextWave();
        } else {
          resumeGame();
        }
      } else if (name === "inventory-close") {
        if (flowState === "pause") {
          openPauseMenu();
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      if (!isGameActive()) {
        return;
      }
      event.preventDefault();
      handleEsc();
    });

    refreshTexts();
  };

  init();

  window.SCRAPPO_ABILITY_SYSTEM = {
    onLevelUp,
    handleWaveComplete,
    resetForNewRun,
    refreshTexts,
    closeOverlays: closeAllOverlays,
    getPlayerStats,
    getCombatModifiers,
    applyPlayerStats,
    addToInventory,
    getInventory: () => new Map(inventory),
    isPaused: () => flowState !== "playing"
  };
})();
