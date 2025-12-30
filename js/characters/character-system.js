(() => {
  const characterBase = window.SCRAPPO_CHARACTER_BASE;
  const characterList = window.SCRAPPO_CHARACTERS || [];
  const characterTrack = document.querySelector("[data-character-track]");
  const characterCarousel = document.querySelector("[data-character-carousel]");

  const CHARACTER_STAT_LABELS = {
    maxHp: "stats.maxHp",
    speed: "stats.moveSpeed",
    pickupRadius: "stats.pickupRadius",
    damage: "stats.damage",
    fireRate: "stats.fireRate"
  };

  let selectedCharacterId = characterList[0]?.id || "normal";
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

  const renderCharacterCards = () => {
    if (!characterTrack) {
      return;
    }
    characterTrack.innerHTML = "";
    const dictionary = getDictionary();

    characterList.forEach((character) => {
      const name = dictionary[character.nameKey] || character.id;
      const desc = dictionary[character.descKey] || "";
      const tag = character.tagKey ? dictionary[character.tagKey] : "";
      const notes = Array.isArray(character.notes) ? character.notes : [];
      const totals = getModifierTotals(character);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "character-card";
      card.dataset.characterId = character.id;
      if (character.id === selectedCharacterId) {
        card.classList.add("is-selected");
      }

      const header = document.createElement("div");
      header.className = "character-card__header";
      const title = document.createElement("h3");
      title.className = "character-card__name";
      title.textContent = name;
      header.appendChild(title);
      if (tag) {
        const tagEl = document.createElement("span");
        tagEl.className = "character-card__tag";
        tagEl.textContent = tag;
        header.appendChild(tagEl);
      }
      card.appendChild(header);

      if (desc) {
        const descEl = document.createElement("p");
        descEl.className = "character-card__desc";
        descEl.textContent = desc;
        card.appendChild(descEl);
      }

      const statsTitle = document.createElement("p");
      statsTitle.className = "character-card__section-title";
      statsTitle.textContent = t("characters.section.stats", "Stats");
      card.appendChild(statsTitle);

      const statsBox = document.createElement("div");
      statsBox.className = "character-stats";
      const statRows = [];
      Object.entries(CHARACTER_STAT_LABELS).forEach(([stat, labelKey]) => {
        const mod = totals[stat];
        if (!mod || (!mod.flat && !mod.pct)) {
          return;
        }
        const sign = mod.flat ? Math.sign(mod.flat) : Math.sign(mod.pct);
        statRows.push({
          label: t(labelKey, labelKey),
          value: formatModifierValue(mod.flat, mod.pct),
          sign
        });
      });

      if (!statRows.length) {
        const row = document.createElement("div");
        row.className = "character-stat is-neutral";
        const label = document.createElement("span");
        label.textContent = t("characters.traits.none", "No bonuses");
        const value = document.createElement("span");
        value.className = "character-stat__value";
        value.textContent = "-";
        row.appendChild(label);
        row.appendChild(value);
        statsBox.appendChild(row);
      } else {
        statRows.forEach((row) => {
          const line = document.createElement("div");
          line.className = "character-stat";
          if (row.sign > 0) {
            line.classList.add("is-positive");
          } else if (row.sign < 0) {
            line.classList.add("is-negative");
          } else {
            line.classList.add("is-neutral");
          }
          const label = document.createElement("span");
          label.textContent = row.label;
          const value = document.createElement("span");
          value.className = "character-stat__value";
          value.textContent = row.value;
          line.appendChild(label);
          line.appendChild(value);
          statsBox.appendChild(line);
        });
      }
      card.appendChild(statsBox);

      if (notes.length) {
        const notesTitle = document.createElement("p");
        notesTitle.className = "character-card__section-title";
        notesTitle.textContent = t("characters.section.traits", "Traits");
        card.appendChild(notesTitle);

        const list = document.createElement("ul");
        list.className = "character-notes";
        notes.forEach((noteKey) => {
          const noteText = dictionary[noteKey] || noteKey;
          if (!noteText) {
            return;
          }
          const item = document.createElement("li");
          item.textContent = noteText;
          list.appendChild(item);
        });
        card.appendChild(list);
      }

      characterTrack.appendChild(card);
    });
  };

  const selectCharacter = (characterId) => {
    const character = characterList.find((item) => item.id === characterId);
    if (!character) {
      return;
    }
    selectedCharacterId = character.id;
    applyCharacter(character);
    renderCharacterCards();
    if (characterCarousel) {
      characterCarousel.scrollLeft = 0;
    }
  };

  const handleCardClick = (event) => {
    const card = event.target.closest("[data-character-id]");
    if (!card) {
      return;
    }
    selectCharacter(card.dataset.characterId);
    const ui = window.SCRAPPO_UI;
    if (ui && typeof ui.startGame === "function") {
      ui.startGame();
    }
  };

  const showSelection = () => {
    renderCharacterCards();
    if (characterCarousel) {
      characterCarousel.scrollLeft = 0;
    }
  };

  const refreshTexts = () => {
    renderCharacterCards();
  };

  const init = () => {
    if (initialized) {
      return;
    }
    document.addEventListener("click", handleCardClick);
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
