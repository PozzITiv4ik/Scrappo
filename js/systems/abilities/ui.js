import { WEAPONS } from "../../data/weapons.js";
import { formatTemplate, getText } from "../../core/i18n.js";
import { internal } from "./internal.js";

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

  const getShopApi = () => internal.getShopApi();

  const getWeaponText = (weapon, field) => {
    const shopApi = getShopApi();
    if (shopApi && typeof shopApi.getWeaponText === "function") {
      return shopApi.getWeaponText(weapon, field);
    }
    return getText(weapon?.[field]);
  };

  const getPlayerGold = () => {
    const mapApi = internal.getMapApi();
    if (mapApi && typeof mapApi.getPlayerGold === "function") {
      return mapApi.getPlayerGold();
    }
    const playerApi = internal.getPlayerApi();
    return Math.max(0, Math.floor(playerApi?.state?.gold || 0));
  };

  const updateShopSubtitle = () => {
    if (!dom.shopSubtitleEl) {
      return;
    }
    const template = internal.i18n.t("shop.subtitle", "Wave {wave} offers");
    dom.shopSubtitleEl.textContent = formatTemplate(template, { wave: state.activeWave || 1 });
  };

  const updateShopGold = () => {
    if (!dom.shopGoldText) {
      return;
    }
    dom.shopGoldText.textContent = `${getPlayerGold()}`;
  };

  const renderWeaponSlots = () => {
    if (!dom.inventoryWeaponsEl) {
      return;
    }

    dom.inventoryWeaponsEl.innerHTML = "";

    const { t, getRarityLabel } = internal.i18n;
    const weaponApi = internal.getWeaponApi();
    const shopApi = getShopApi();
    const weapons = WEAPONS;
    const slots = weaponApi && typeof weaponApi.getSlots === "function" ? weaponApi.getSlots() : [];
    const slotCount =
      weaponApi && typeof weaponApi.getSlotCount === "function"
        ? weaponApi.getSlotCount()
        : Math.max(4, slots.length || 0);

    for (let i = 0; i < slotCount; i += 1) {
      const weaponId = slots[i];
      const card = document.createElement("div");
      card.className = "weapon-slot ui-tile";

      const index = document.createElement("div");
      index.className = "weapon-slot__index";
      index.textContent = `#${i + 1}`;
      card.appendChild(index);

      if (!weaponId) {
        const empty = document.createElement("div");
        empty.className = "weapon-slot__empty ui-text-muted";
        empty.textContent = t("inventory.slot_empty", "Empty slot");
        card.appendChild(empty);
        dom.inventoryWeaponsEl.appendChild(card);
        continue;
      }

      const weapon = weapons[weaponId];
      if (!weapon) {
        const empty = document.createElement("div");
        empty.className = "weapon-slot__empty ui-text-muted";
        empty.textContent = t("inventory.slot_empty", "Empty slot");
        card.appendChild(empty);
        dom.inventoryWeaponsEl.appendChild(card);
        continue;
      }

      const header = document.createElement("div");
      header.className = "weapon-slot__header";
      const image = document.createElement("img");
      image.className = "weapon-slot__image";
      image.alt = "";
      if (weapon.sprite) {
        image.src = weapon.sprite;
      } else {
        image.hidden = true;
      }

      const meta = document.createElement("div");
      const rarity = document.createElement("div");
      const rarityKey = weapon.rarity || "common";
      rarity.className = `weapon-slot__rarity ui-pill shop-item__rarity--${rarityKey}`;
      rarity.textContent = getRarityLabel(rarityKey);
      const name = document.createElement("div");
      name.className = "weapon-slot__name ui-text-strong";
      name.textContent = getWeaponText(weapon, "name") || weaponId;

      meta.appendChild(rarity);
      meta.appendChild(name);
      header.appendChild(image);
      header.appendChild(meta);
      card.appendChild(header);

      const desc = getWeaponText(weapon, "description");
      if (desc) {
        card.title = desc;
      }

      const stats = document.createElement("div");
      stats.className = "weapon-slot__stats";
      const addStat = (label, value) => {
        const stat = document.createElement("div");
        stat.className = "weapon-slot__stat ui-pill";
        stat.textContent = `${label}: ${value}`;
        stats.appendChild(stat);
      };
      const damageValue = Number.isFinite(weapon.damage) ? Math.round(weapon.damage) : "-";
      const fireRateValue = Number.isFinite(weapon.fireRate) ? weapon.fireRate.toFixed(1) : "-";
      const rangeValue = Number.isFinite(weapon.range) ? Math.round(weapon.range) : "-";
      addStat(t("stats.damage", "Damage"), damageValue);
      addStat(t("stats.fireRate", "Fire Rate"), fireRateValue);
      addStat(t("stats.range", "Range"), rangeValue);
      card.appendChild(stats);

      const actions = document.createElement("div");
      actions.className = "weapon-slot__actions";
      const price = shopApi && typeof shopApi.getSellPrice === "function" ? shopApi.getSellPrice(weapon) : 0;
      const priceTag = document.createElement("div");
      priceTag.className = "weapon-slot__price";
      const priceIcon = document.createElement("img");
      priceIcon.src = "assets/icons/gold.png";
      priceIcon.alt = "";
      priceIcon.width = 14;
      priceIcon.height = 14;
      const priceText = document.createElement("span");
      priceText.textContent = `+${price}`;
      priceTag.appendChild(priceIcon);
      priceTag.appendChild(priceText);

      const sellButton = document.createElement("button");
      sellButton.type = "button";
      sellButton.className = "ui-button ui-button--small";
      sellButton.textContent = t("inventory.sell", "Sell");
      sellButton.dataset.weaponSell = "true";
      sellButton.dataset.slotIndex = String(i);

      actions.appendChild(priceTag);
      actions.appendChild(sellButton);
      card.appendChild(actions);

      dom.inventoryWeaponsEl.appendChild(card);
    }
  };

  const renderInventory = () => {
    if (!dom.inventoryAbilitiesEl || !dom.inventoryStatsEl) {
      return;
    }
    renderWeaponSlots();
    dom.inventoryAbilitiesEl.innerHTML = "";
    dom.inventoryStatsEl.innerHTML = "";

    const { t, getAbilityText } = internal.i18n;

    if (!state.inventory.size) {
      const empty = document.createElement("div");
      empty.className = "ability-item ui-tile ui-text-strong";
      empty.textContent = t("inventory.empty", "Empty");
      dom.inventoryAbilitiesEl.appendChild(empty);
    } else {
      state.inventory.forEach((count, id) => {
        const ability = internal.abilityById.get(id);
        if (!ability) {
          return;
        }
        const item = document.createElement("div");
        item.className = "ability-item ui-tile ui-text-strong";
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
      line.className = "stats-row ui-row ui-row--between";
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

  const renderShop = () => {
    if (!dom.shopGrid || !dom.shopCard) {
      return;
    }
    if (dom.shopCard.dataset.mode !== "wave") {
      return;
    }
    const shopApi = getShopApi();
    if (!shopApi || typeof shopApi.getOffers !== "function") {
      dom.shopCard.style.display = "none";
      return;
    }
    if (typeof shopApi.prepareForWave === "function") {
      shopApi.prepareForWave(state.activeWave || 1);
    }

    dom.shopCard.style.display = "";
    dom.shopGrid.innerHTML = "";

    const offers = shopApi.getOffers();
    const { t, getRarityLabel } = internal.i18n;
    const weaponApi = internal.getWeaponApi();
    const gold = getPlayerGold();
    const slotsFull = weaponApi && typeof weaponApi.hasEmptySlot === "function"
      ? !weaponApi.hasEmptySlot()
      : false;

    if (!offers.length) {
      const empty = document.createElement("div");
      empty.className = "shop-empty ui-text-muted";
      empty.textContent = t("shop.empty", "No weapons available");
      dom.shopGrid.appendChild(empty);
      updateShopGold();
      updateShopSubtitle();
      return;
    }

    offers.forEach((offer) => {
      const weapon = offer.weapon;
      if (!weapon) {
        return;
      }
      const rarity = weapon.rarity || "common";
      const card = document.createElement("div");
      card.className = "shop-item ui-tile";
      const rarityEl = document.createElement("div");
      rarityEl.className = `shop-item__rarity ui-pill shop-item__rarity--${rarity}`;
      rarityEl.textContent = getRarityLabel(rarity);
      const name = document.createElement("div");
      name.className = "shop-item__name ui-text-strong";
      name.textContent = getWeaponText(weapon, "name") || weapon.id;
      const desc = document.createElement("div");
      desc.className = "shop-item__desc ui-text-muted";
      desc.textContent = getWeaponText(weapon, "description");

      const stats = document.createElement("div");
      stats.className = "shop-item__stats";
      const addStat = (label, value) => {
        const stat = document.createElement("div");
        stat.className = "shop-item__stat ui-pill";
        stat.textContent = `${label}: ${value}`;
        stats.appendChild(stat);
      };
      const damageValue = Number.isFinite(weapon.damage) ? Math.round(weapon.damage) : "-";
      const fireRateValue = Number.isFinite(weapon.fireRate) ? weapon.fireRate.toFixed(1) : "-";
      const rangeValue = Number.isFinite(weapon.range) ? Math.round(weapon.range) : "-";
      addStat(t("stats.damage", "Damage"), damageValue);
      addStat(t("stats.fireRate", "Fire Rate"), fireRateValue);
      addStat(t("stats.range", "Range"), rangeValue);

      const priceRow = document.createElement("div");
      priceRow.className = "shop-item__price";
      const priceIcon = document.createElement("img");
      priceIcon.src = "assets/icons/gold.png";
      priceIcon.alt = "";
      priceIcon.width = 16;
      priceIcon.height = 16;
      const priceText = document.createElement("span");
      priceText.textContent = `${offer.price}`;
      priceRow.appendChild(priceIcon);
      priceRow.appendChild(priceText);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ui-button ui-button--small";
      button.dataset.shopBuy = "true";
      button.dataset.weaponId = weapon.id;

      const owned = weaponApi && typeof weaponApi.hasWeapon === "function"
        ? weaponApi.hasWeapon(weapon.id)
        : false;
      const canAfford = gold >= offer.price;
      if (owned) {
        button.textContent = t("shop.owned", "Owned");
      } else if (slotsFull) {
        button.textContent = t("shop.slots_full", "Slots full");
      } else if (!canAfford) {
        button.textContent = t("shop.not_enough", "Not enough gold");
      } else {
        button.textContent = t("shop.buy", "Buy");
      }
      button.disabled = owned || slotsFull || !canAfford;

      card.appendChild(rarityEl);
      card.appendChild(name);
      if (desc.textContent) {
        card.appendChild(desc);
      }
      card.appendChild(stats);
      card.appendChild(priceRow);
      card.appendChild(button);
      dom.shopGrid.appendChild(card);
    });

    updateShopGold();
    updateShopSubtitle();
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
      card.className = "ability-card ui-tile ui-tile--interactive";
      card.dataset.abilityId = ability.id;
      const rarity = document.createElement("div");
      rarity.className = `ability-card__rarity ui-pill ability-card__rarity--${ability.rarity}`;
      rarity.textContent = getRarityLabel(ability.rarity);
      const name = document.createElement("div");
      name.className = "ability-card__name ui-text-strong";
      name.textContent = getAbilityText(ability, "name");
      const desc = document.createElement("div");
      desc.className = "ability-card__desc ui-text-muted";
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

  const handleShopPurchase = (weaponId) => {
    const shopApi = getShopApi();
    if (!shopApi || typeof shopApi.purchase !== "function") {
      return;
    }
    shopApi.purchase(weaponId);
    renderInventory();
    renderShop();
  };

  const handleWeaponSell = (slotIndex) => {
    const weaponApi = internal.getWeaponApi();
    if (!weaponApi || typeof weaponApi.removeWeapon !== "function") {
      return;
    }
    const slots = typeof weaponApi.getSlots === "function" ? weaponApi.getSlots() : [];
    const weaponId = slots[slotIndex];
    if (!weaponId) {
      return;
    }

    const weapons = WEAPONS;
    const weapon = weapons[weaponId];
    const shopApi = getShopApi();
    const sellPrice = shopApi && typeof shopApi.getSellPrice === "function" && weapon
      ? shopApi.getSellPrice(weapon)
      : 0;
    const removedId = weaponApi.removeWeapon(slotIndex);
    if (!removedId) {
      return;
    }
    const mapApi = internal.getMapApi();
    if (sellPrice > 0 && mapApi && typeof mapApi.grantPlayerGold === "function") {
      mapApi.grantPlayerGold(sellPrice);
    }
    renderInventory();
    renderShop();
  };

  const openInventory = (mode) => {
    renderInventory();
    if (dom.shopCard) {
      const showShop = mode === "wave";
      dom.shopCard.dataset.mode = mode;
      dom.shopCard.style.display = showShop ? "" : "none";
      if (showShop) {
        renderShop();
      }
    }
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
    renderShop();
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
    renderShop,
    renderAbilityChoices,
    updateAbilitiesSubtitle,
    openAbilitySelection,
    handleShopPurchase,
    handleWeaponSell,
    openInventory,
    openPauseMenu,
    refreshTexts
  };
