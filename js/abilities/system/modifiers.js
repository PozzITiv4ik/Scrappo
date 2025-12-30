(() => {
  const internal = window.SCRAPPO_ABILITY_INTERNAL;
  if (!internal) {
    return;
  }

  const { abilityById, state } = internal;

  const getModifiers = () => {
    if (state.modifiersCache) {
      return state.modifiersCache;
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

    state.inventory.forEach((count, id) => {
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

    state.modifiersCache = modifiers;
    return modifiers;
  };

  const invalidateModifiers = () => {
    state.modifiersCache = null;
  };

  const getPlayerStats = () => {
    const playerApi = internal.getPlayerApi();
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
    const playerApi = internal.getPlayerApi();
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
    const mapApi = internal.getMapApi();
    if (mapApi && typeof mapApi.refreshPlayerHud === "function") {
      mapApi.refreshPlayerHud();
    }
  };

  const addToInventory = (abilityId) => {
    if (!abilityById.has(abilityId)) {
      return;
    }
    const current = state.inventory.get(abilityId) || 0;
    state.inventory.set(abilityId, current + 1);
    invalidateModifiers();
    applyPlayerStats();
  };

  const clearInventory = () => {
    state.inventory.clear();
    invalidateModifiers();
  };

  internal.modifiers = {
    getModifiers,
    invalidateModifiers,
    getPlayerStats,
    getCombatModifiers,
    applyPlayerStats,
    addToInventory,
    clearInventory
  };
})();
