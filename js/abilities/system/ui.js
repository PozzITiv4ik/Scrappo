(() => {
  const internal = window.SCRAPPO_ABILITY_INTERNAL;
  if (!internal) {
    return;
  }

  const { abilities, rarityWeightsByWave, state, dom } = internal;

  const isGameActive = () => document.body.classList.contains("is-game");
  const isOverlayOpen = (overlay) => overlay && overlay.classList.contains("is-active");

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
    closeOverlay(dom.overlayAbilities);
    closeOverlay(dom.overlayInventory);
    closeOverlay(dom.overlayPause);
  };

  const getRarityWeights = (wave) => rarityWeightsByWave[wave] || rarityWeightsByWave[2];

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
    const weights = getRarityWeights(state.activeWave);
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
    if (!dom.inventoryAbilitiesEl || !dom.inventoryStatsEl) {
      return;
    }
    dom.inventoryAbilitiesEl.innerHTML = "";
    dom.inventoryStatsEl.innerHTML = "";

    const { t, getAbilityText } = internal.i18n;

    if (!state.inventory.size) {
      const empty = document.createElement("div");
      empty.className = "ability-item";
      empty.textContent = t("inventory.empty", "Empty");
      dom.inventoryAbilitiesEl.appendChild(empty);
    } else {
      state.inventory.forEach((count, id) => {
        const ability = internal.abilityById.get(id);
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
        dom.inventoryAbilitiesEl.appendChild(item);
      });
    }

    const playerStats = internal.modifiers.getPlayerStats();
    const combat = internal.modifiers.getCombatModifiers();
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
      dom.inventoryStatsEl.appendChild(line);
    });
  };

  const renderAbilityChoices = () => {
    if (!dom.abilityChoicesEl) {
      return;
    }
    dom.abilityChoicesEl.innerHTML = "";
    const choices = getRandomChoices(3);
    const { getAbilityText, getRarityLabel } = internal.i18n;
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
      dom.abilityChoicesEl.appendChild(card);
    });
  };

  const updateAbilitiesSubtitle = () => {
    if (!dom.abilitiesSubtitleEl) {
      return;
    }
    const remaining = Math.max(0, state.pendingSelections);
    dom.abilitiesSubtitleEl.textContent = remaining
      ? `${internal.i18n.t("abilities.remaining", "Choices left")}: ${remaining}`
      : "";
  };

  const openAbilitySelection = () => {
    renderAbilityChoices();
    updateAbilitiesSubtitle();
    closeOverlay(dom.overlayInventory);
    closeOverlay(dom.overlayPause);
    openOverlay(dom.overlayAbilities);
  };

  const openInventory = (mode) => {
    renderInventory();
    closeOverlay(dom.overlayAbilities);
    closeOverlay(dom.overlayPause);
    openOverlay(dom.overlayInventory);

    if (dom.inventoryContinueBtn) {
      dom.inventoryContinueBtn.dataset.mode = mode;
      if (mode === "wave") {
        dom.inventoryContinueBtn.textContent = state.hasNextWave
          ? internal.i18n.t("inventory.continue", "Start Next Wave")
          : internal.i18n.t("pause.exit", "Main Menu");
      } else {
        dom.inventoryContinueBtn.textContent = internal.i18n.t("pause.resume", "Resume");
      }
      dom.inventoryContinueBtn.disabled = false;
    }

    if (dom.inventoryCloseBtn) {
      const shouldHide = mode === "wave";
      dom.inventoryCloseBtn.style.display = shouldHide ? "none" : "inline-flex";
    }
  };

  const openPauseMenu = () => {
    closeOverlay(dom.overlayInventory);
    closeOverlay(dom.overlayAbilities);
    openOverlay(dom.overlayPause);
  };

  const refreshTexts = () => {
    renderInventory();
    if (isOverlayOpen(dom.overlayAbilities)) {
      renderAbilityChoices();
      updateAbilitiesSubtitle();
    }
    if (isOverlayOpen(dom.overlayInventory)) {
      const mode = dom.inventoryContinueBtn?.dataset.mode || "pause";
      if (dom.inventoryContinueBtn) {
        if (mode === "wave") {
          dom.inventoryContinueBtn.textContent = state.hasNextWave
            ? internal.i18n.t("inventory.continue", "Start Next Wave")
            : internal.i18n.t("pause.exit", "Main Menu");
        } else {
          dom.inventoryContinueBtn.textContent = internal.i18n.t("pause.resume", "Resume");
        }
      }
    }
  };

  internal.ui = {
    isGameActive,
    isOverlayOpen,
    openOverlay,
    closeOverlay,
    closeAllOverlays,
    renderInventory,
    renderAbilityChoices,
    updateAbilitiesSubtitle,
    openAbilitySelection,
    openInventory,
    openPauseMenu,
    refreshTexts
  };
})();
