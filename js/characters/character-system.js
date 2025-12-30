(() => {
  const characterBase = window.SCRAPPO_CHARACTER_BASE;
  const characterList = window.SCRAPPO_CHARACTERS || [];
  const grid = document.querySelector("[data-character-grid]");
  const previewName = document.querySelector("[data-character-name]");
  const previewDesc = document.querySelector("[data-character-desc]");
  const previewPortrait = document.querySelector("[data-character-portrait]");
  const previewWeapon = document.querySelector("[data-character-weapon]");
  const previewTraits = document.querySelector("[data-character-traits]");

  const DEFAULT_SKIN = "icons/main_character.png";
  const DEFAULT_WEAPON_ID = "pistol";

  const STAT_LABELS = {
    maxHp: "stats.maxHp",
    speed: "stats.moveSpeed",
    pickupRadius: "stats.pickupRadius",
    damage: "stats.damage",
    fireRate: "stats.fireRate"
  };

  let selectedCharacterId = characterList[0]?.id || "normal";
  let previewCharacterId = selectedCharacterId;
  let initialized = false;

  const getDictionary = () => {
    const lang = document.documentElement.lang || "en";
    const translations = window.SCRAPPO_I18N || {};
    return translations[lang] || translations.en || {};
  };

  const t = (key, fallback = "") => {
    const dictionary = getDictionary();
    return dictionary[key] || fallback || key;
  };

  const getCharacterById = (id) => {
    if (!id) {
      return characterList[0] || null;
    }
    return characterList.find((item) => item.id === id) || characterList[0] || null;
  };

  const getCharacterSkin = (character) => {
    return character?.skin || character?.icon || DEFAULT_SKIN;
  };

  const getWeaponSprite = (character) => {
    const weapons = window.SCRAPPO_WEAPONS || {};
    const weaponId = character?.weaponId || DEFAULT_WEAPON_ID;
    return weapons[weaponId]?.sprite || weapons[DEFAULT_WEAPON_ID]?.sprite || "weapons/pistol/weapon_pistol.png";
  };

  const getModifierTotals = (character) => {
    const totals = {};
    const modifiers = Array.isArray(character?.modifiers) ? character.modifiers : [];
    modifiers.forEach((modifier) => {
      if (!modifier || !modifier.stat) {
        return;
      }
      const entry = totals[modifier.stat] || { flat: 0, pct: 0 };
      const value = typeof modifier.value === "number" ? modifier.value : 0;
      if (modifier.type === "percent") {
        entry.pct += value;
      } else {
        entry.flat += value;
      }
      totals[modifier.stat] = entry;
    });
    return totals;
  };

  const formatModifierValue = (flat, pct) => {
    if (!flat && !pct) {
      return "0";
    }
    const parts = [];
    if (flat) {
      parts.push(`${flat > 0 ? "+" : ""}${Math.round(flat)}`);
    }
    if (pct) {
      parts.push(`${pct > 0 ? "+" : ""}${Math.round(pct * 100)}%`);
    }
    return parts.join(" ");
  };

  const getCombatTotals = (character) => {
    const baseCombat = characterBase?.combat || { damageFlat: 0, damagePct: 0, fireRatePct: 0 };
    const totals = {
      damageFlat: baseCombat.damageFlat || 0,
      damagePct: baseCombat.damagePct || 0,
      fireRatePct: baseCombat.fireRatePct || 0
    };
    const modifiers = Array.isArray(character?.modifiers) ? character.modifiers : [];
    modifiers.forEach((modifier) => {
      if (!modifier || !modifier.stat) {
        return;
      }
      const value = typeof modifier.value === "number" ? modifier.value : 0;
      if (modifier.stat === "damage") {
        if (modifier.type === "percent") {
          totals.damagePct += value;
        } else {
          totals.damageFlat += value;
        }
      }
      if (modifier.stat === "fireRate" && modifier.type === "percent") {
        totals.fireRatePct += value;
      }
    });
    return totals;
  };

  const applyCharacter = (character) => {
    if (!character || !characterBase || !characterBase.stats) {
      return;
    }

    const totals = getModifierTotals(character);
    window.SCRAPPO_CHARACTER_MODIFIERS = getCombatTotals(character);
    window.SCRAPPO_SELECTED_CHARACTER = character.id;

    const playerApi = window.SCRAPPO_PLAYER;
    if (!playerApi || !playerApi.config) {
      return;
    }

    Object.keys(characterBase.stats).forEach((key) => {
      const baseValue = characterBase.stats[key];
      const mod = totals[key] || { flat: 0, pct: 0 };
      const nextValue = baseValue * (1 + mod.pct) + mod.flat;
      playerApi.config[key] = Math.round(nextValue);
    });

    if (typeof playerApi.resetState === "function") {
      playerApi.resetState();
    }
  };

  const renderTraits = (character) => {
    if (!previewTraits) {
      return;
    }
    previewTraits.innerHTML = "";
    const totals = getModifierTotals(character);
    const rows = [];

    Object.entries(STAT_LABELS).forEach(([stat, labelKey]) => {
      const mod = totals[stat];
      if (!mod || (!mod.flat && !mod.pct)) {
        return;
      }
      const sign = mod.flat ? Math.sign(mod.flat) : Math.sign(mod.pct);
      rows.push({
        label: t(labelKey, labelKey),
        value: formatModifierValue(mod.flat, mod.pct),
        sign
      });
    });

    if (!rows.length) {
      const item = document.createElement("li");
      item.className = "character-trait is-neutral";
      const label = document.createElement("span");
      label.textContent = t("characters.traits.none", "No bonuses");
      const value = document.createElement("span");
      value.className = "character-trait__value";
      value.textContent = "-";
      item.appendChild(label);
      item.appendChild(value);
      previewTraits.appendChild(item);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("li");
      item.className = "character-trait";
      if (row.sign > 0) {
        item.classList.add("is-positive");
      } else if (row.sign < 0) {
        item.classList.add("is-negative");
      } else {
        item.classList.add("is-neutral");
      }
      const label = document.createElement("span");
      label.textContent = row.label;
      const value = document.createElement("span");
      value.className = "character-trait__value";
      value.textContent = row.value;
      item.appendChild(label);
      item.appendChild(value);
      previewTraits.appendChild(item);
    });
  };

  const renderPreview = (characterId) => {
    const character = getCharacterById(characterId);
    if (!character) {
      return;
    }
    const dictionary = getDictionary();
    const name = dictionary[character.nameKey] || character.id;
    const desc = dictionary[character.descKey] || "";
    if (previewName) {
      previewName.textContent = name;
    }
    if (previewDesc) {
      previewDesc.textContent = desc;
    }
    if (previewPortrait) {
      previewPortrait.src = getCharacterSkin(character);
      previewPortrait.alt = name;
    }
    if (previewWeapon) {
      previewWeapon.src = getWeaponSprite(character);
      previewWeapon.alt = "";
    }
    renderTraits(character);
    previewCharacterId = character.id;
  };

  const renderGrid = () => {
    if (!grid) {
      return;
    }
    grid.innerHTML = "";
    const dictionary = getDictionary();
    characterList.forEach((character) => {
      const name = dictionary[character.nameKey] || character.id;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "character-icon";
      button.dataset.characterId = character.id;
      button.setAttribute("aria-label", name);
      if (character.id === selectedCharacterId) {
        button.classList.add("is-selected");
      }
      const img = document.createElement("img");
      img.src = character.icon || character.skin || DEFAULT_SKIN;
      img.alt = "";
      button.appendChild(img);
      grid.appendChild(button);
    });
  };

  const setPreview = (characterId) => {
    if (previewCharacterId === characterId) {
      return;
    }
    previewCharacterId = characterId;
    renderPreview(characterId);
  };

  const selectCharacter = (characterId) => {
    const character = getCharacterById(characterId);
    if (!character) {
      return;
    }
    selectedCharacterId = character.id;
    applyCharacter(character);
    renderGrid();
    setPreview(selectedCharacterId);
  };

  const handleGridHover = (event) => {
    const target = event.target.closest("[data-character-id]");
    if (!target) {
      return;
    }
    setPreview(target.dataset.characterId);
  };

  const handleGridLeave = () => {
    setPreview(selectedCharacterId);
  };

  const handleGridClick = (event) => {
    const target = event.target.closest("[data-character-id]");
    if (!target) {
      return;
    }
    selectCharacter(target.dataset.characterId);
    const ui = window.SCRAPPO_UI;
    if (ui && typeof ui.startGame === "function") {
      ui.startGame();
    }
  };

  const showSelection = () => {
    renderGrid();
    renderPreview(selectedCharacterId);
  };

  const refreshTexts = () => {
    renderGrid();
    renderPreview(selectedCharacterId);
  };

  const init = () => {
    if (initialized) {
      return;
    }
    if (!grid) {
      return;
    }
    grid.addEventListener("click", handleGridClick);
    grid.addEventListener("pointerover", handleGridHover);
    grid.addEventListener("focusin", handleGridHover);
    grid.addEventListener("pointerleave", handleGridLeave);
    selectCharacter(selectedCharacterId);
    initialized = true;
  };

  init();

  window.SCRAPPO_CHARACTER_SYSTEM = {
    init,
    refreshTexts,
    showSelection,
    selectCharacter,
    getSelectedId: () => selectedCharacterId
  };
})();
