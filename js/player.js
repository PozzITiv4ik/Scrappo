(() => {
  const config = {
    size: 52,
    speed: 240,
    maxHp: 100,
    invulnerableMs: 500,
    pickupRadius: 160,
    collectRadius: 18,
    xpPullMinSpeed: 120,
    xpPullMaxSpeed: 520
  };

  function getXpForLevel(level) {
    return Math.round(100 + (level - 1) * 40);
  }

  const state = {
    position: { x: 0, y: 0 },
    hp: config.maxHp,
    maxHp: config.maxHp,
    invulnerableUntil: 0,
    level: 1,
    xp: 0,
    xpToNext: getXpForLevel(1),
    pickupRadius: config.pickupRadius,
    collectRadius: config.collectRadius
  };

  const resetState = () => {
    state.hp = config.maxHp;
    state.maxHp = config.maxHp;
    state.invulnerableUntil = 0;
    state.level = 1;
    state.xp = 0;
    state.xpToNext = getXpForLevel(state.level);
    state.pickupRadius = config.pickupRadius;
    state.collectRadius = config.collectRadius;
    return state;
  };

  window.SCRAPPO_PLAYER = {
    config,
    state,
    getXpForLevel,
    resetState
  };
})();
